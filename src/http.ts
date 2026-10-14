import type { IncomingMessage, ServerResponse } from 'node:http';
import { PEER_HEADER } from './ratelimit';

/** Largest body accepted; the biggest legitimate one is a Discord interaction, a few KB. */
const MAX_BODY_BYTES = 64 * 1024;

/** A Web-style handler: every route is written against the Fetch API. */
export type Handler = (request: Request) => Promise<Response>;

/**
 * @author dop42
 * @method toNodeHandler
 * @description Adapts a Web-style handler to Node's `(req, res)` server callback.
 * @remarks Converting once here keeps every route written against `Request`/`Response`,
 * which is what the tests exercise. A body over the cap is refused before it is buffered
 * whole. A handler that throws answers a bare 500: the error goes to the logs, never to the
 * client.
 * @param handler {Handler}
 * @returns {(req: IncomingMessage, res: ServerResponse) => Promise<void>}
 */
export function toNodeHandler(handler: Handler) {
	return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
		let response: Response;
		try {
			const headers = new Headers();
			for (const [key, value] of Object.entries(req.headers)) {
				if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
				else if (value !== undefined) headers.set(key, value);
			}
			headers.set(PEER_HEADER, req.socket.remoteAddress ?? '');

			const chunks: Buffer[] = [];
			let size = 0;
			for await (const chunk of req) {
				size += (chunk as Buffer).length;
				if (size > MAX_BODY_BYTES) {
					res.writeHead(413).end();
					req.destroy();
					return;
				}
				chunks.push(chunk as Buffer);
			}

			const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`, {
				method: req.method,
				headers,
				body: chunks.length ? Buffer.concat(chunks) : undefined,
			});
			response = await handler(request);
		} catch (error) {
			console.error(error);
			response = new Response(null, { status: 500 });
		}

		res.statusCode = response.status;
		response.headers.forEach((value, key) => {
			if (key !== 'set-cookie') res.setHeader(key, value);
		});
		const cookies = response.headers.getSetCookie();
		if (cookies.length) res.setHeader('set-cookie', cookies);
		res.end(Buffer.from(await response.arrayBuffer()));
	};
}

/**
 * @author dop42
 * @method apiJson
 * @description Answers a dashboard API call with a JSON body that is never cached.
 * @param body {unknown}
 * @param status {number}
 * @returns {Response}
 */
export const apiJson = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
	});

/**
 * @author dop42
 * @method readCookie
 * @description Reads one cookie from a request.
 * @param request {Request}
 * @param name {string}
 * @returns {string | undefined}
 */
export function readCookie(request: Request, name: string): string | undefined {
	for (const part of (request.headers.get('cookie') ?? '').split(';')) {
		const [key, ...value] = part.trim().split('=');
		if (key === name) return value.join('=');
	}
	return undefined;
}

/**
 * @author dop42
 * @method cookie
 * @description Serializes a `__Host-` cookie: Secure, HttpOnly, whole site, no Domain.
 * @remarks SameSite=Lax rather than Strict: the login comes back from discord.com as a
 * top-level navigation, which Strict would strip the cookie from.
 * @param name {string}
 * @param value {string}
 * @param maxAge {number} seconds; 0 deletes the cookie
 * @returns {string}
 */
export const cookie = (name: string, value: string, maxAge: number) =>
	`${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

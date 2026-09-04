import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * @author dop42
 * @method toNodeHandler
 * @description Adapts a Web-style handler to the signature Vercel actually invokes.
 * @remarks Vercel's Node runtime calls functions with Node's `(req, res)` objects, not with
 * a Fetch `Request`: `req.url` is a bare path, `req.headers` is a plain object and there is
 * no `.text()`. Converting once here keeps every handler written against the Web API, which
 * is what the tests exercise and what a reader can reason about.
 * @param handler {(request: Request) => Promise<Response>}
 * @returns {(req: IncomingMessage, res: ServerResponse) => Promise<void>}
 */
export function toNodeHandler(handler: (request: Request) => Promise<Response>) {
	return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
			else if (value !== undefined) headers.set(key, value);
		}

		const chunks: Buffer[] = [];
		for await (const chunk of req) chunks.push(chunk as Buffer);

		const request = new Request(`https://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`, {
			method: req.method,
			headers,
			body: chunks.length ? Buffer.concat(chunks) : undefined,
		});

		const response = await handler(request);
		res.statusCode = response.status;
		response.headers.forEach((value, key) => res.setHeader(key, value));
		res.end(Buffer.from(await response.arrayBuffer()));
	};
}

import { isIP } from 'node:net';

/** Header `toNodeHandler` writes the TCP peer into, replacing whatever a client sent. */
export const PEER_HEADER = 'x-peer-address';

/**
 * @author dop42
 * @method isProxy
 * @description Tells whether the TCP peer is a proxy we run, whose `X-Forwarded-For` we trust.
 * @remarks The instance listens on loopback only, or on the compose network behind Caddy;
 * both reach it from a loopback or a private address. A public peer is a client speaking
 * directly, and its forwarding header is a lie it chose.
 * @param address {string}
 * @returns {boolean}
 */
function isProxy(address: string): boolean {
	const ip = address.replace(/^::ffff:/, '');
	if (isIP(ip) === 4) {
		const [a = 0, b = 0] = ip.split('.').map(Number);
		return a === 127 || a === 10 || (a === 172 && b >= 16 && b < 32) || (a === 192 && b === 168);
	}
	return ip === '::1' || /^f[cd]/i.test(ip);
}

/**
 * @author dop42
 * @method clientAddress
 * @description Returns the address a request comes from, as far as it can be trusted.
 * @remarks Behind our proxy, the last `X-Forwarded-For` entry is the one the proxy itself
 * appended; anything before it was sent by the client. The address is held in memory for a
 * minute to count requests, and never logged nor stored.
 * @param request {Request}
 * @returns {string}
 */
export function clientAddress(request: Request): string {
	const peer = request.headers.get(PEER_HEADER) ?? '';
	if (!isProxy(peer)) return peer;
	const forwarded = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
	return forwarded || peer;
}

interface Window {
	count: number;
	resetAt: number;
}

/**
 * A fixed-window counter per key. In memory: one instance serves everything, and losing the
 * counts on a restart only forgives a minute of requests.
 */
export class RateLimiter {
	private readonly windows = new Map<string, Window>();

	constructor(
		private readonly max: number,
		private readonly windowMs: number,
	) {}

	/**
	 * @author dop42
	 * @method take
	 * @description Counts one request for a key.
	 * @param key {string}
	 * @param now {number}
	 * @returns {number} 0 when allowed, otherwise the seconds to wait
	 */
	take(key: string, now = Date.now()): number {
		if (this.windows.size > 10_000) {
			for (const [stale, window] of this.windows) {
				if (window.resetAt <= now) this.windows.delete(stale);
			}
		}
		let window = this.windows.get(key);
		if (!window || window.resetAt <= now) {
			window = { count: 0, resetAt: now + this.windowMs };
			this.windows.set(key, window);
		}
		window.count++;
		return window.count > this.max ? Math.ceil((window.resetAt - now) / 1000) : 0;
	}
}

/** Logins and verifications: each costs calls to Discord or 42, a person needs a handful. */
const logins = new RateLimiter(20, 60_000);
/** The dashboard API: a page load is a few calls, saving is one. */
const api = new RateLimiter(120, 60_000);

/**
 * @author dop42
 * @method limit
 * @description Refuses a request over its address's budget, or returns null to let it through.
 * @remarks Discord's interactions are signed and come from Discord's own addresses, so they
 * are left alone, as are the static files.
 * @param request {Request}
 * @returns {Response | null}
 */
export function limit(request: Request): Response | null {
	const { pathname } = new URL(request.url);
	const limiter =
		pathname === '/api/callback' || pathname.startsWith('/auth/')
			? logins
			: pathname.startsWith('/api/') && pathname !== '/api/interactions'
				? api
				: null;
	if (!limiter) return null;

	const wait = limiter.take(clientAddress(request));
	if (!wait) return null;
	return new Response(JSON.stringify({ error: 'rate_limited' }), {
		status: 429,
		headers: { 'Content-Type': 'application/json', 'Retry-After': String(wait) },
	});
}

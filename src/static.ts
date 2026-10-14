import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

/** Built dashboard, served from the working directory like the migrations. */
const ROOT = join(process.cwd(), 'web', 'dist');

const TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.json': 'application/json',
	'.txt': 'text/plain; charset=utf-8',
	'.woff2': 'font/woff2',
};

/**
 * Headers every dashboard page is served with.
 *
 * @remarks Scripts and styles come from this origin only, and the only third-party resource
 * is the Discord CDN for avatars and server icons. Nothing loads from anywhere else, which is
 * also why the dashboard needs no cookie banner: no tracker can be on it.
 */
const PAGE_HEADERS = {
	'Content-Security-Policy':
		"default-src 'self'; img-src 'self' data: https://cdn.discordapp.com; connect-src 'self'; " +
		"object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Frame-Options': 'DENY',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * @author dop42
 * @method serveStatic
 * @description Serves the built dashboard, falling back to `index.html` for its routes.
 * @remarks A path resolving outside the build directory is refused before touching the disk.
 * Hashed assets are immutable and cached for a year; `index.html` is never cached, so a new
 * build reaches browsers on the next load.
 * @param request {Request}
 * @returns {Promise<Response>}
 */
export async function serveStatic(request: Request): Promise<Response> {
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return new Response(null, { status: 405 });
	}

	const pathname = decodeURIComponent(new URL(request.url).pathname);
	const path = normalize(join(ROOT, pathname));
	if (path !== ROOT && !path.startsWith(ROOT + sep)) return new Response(null, { status: 404 });

	const type = TYPES[extname(path)];
	if (type) {
		const body = await readFile(path).catch(() => null);
		if (body) {
			const immutable = pathname.startsWith('/assets/');
			return new Response(body, {
				headers: {
					...PAGE_HEADERS,
					'Content-Type': type,
					'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
				},
			});
		}
		if (extname(path) !== '.html') return new Response(null, { status: 404 });
	}

	const index = await readFile(join(ROOT, 'index.html')).catch(() => null);
	if (!index) return new Response('dashboard not built: npm run build:web', { status: 503 });
	return new Response(index, {
		headers: { ...PAGE_HEADERS, 'Content-Type': TYPES['.html']!, 'Cache-Control': 'no-cache' },
	});
}

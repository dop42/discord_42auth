const ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
};

/**
 * @author dop42
 * @method escapeHtml
 * @description Escapes text for an HTML body or a double-quoted attribute.
 * @remarks Single quotes are deliberately left alone: every attribute in this file is
 * double-quoted, and there is no scriptable context on these pages.
 * @param text {string}
 * @returns {string}
 */
const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (char) => ESCAPES[char]!);

const OK = '#2ecc71';
const BAD = '#e74c3c';

/**
 * @author dop42
 * @method layout
 * @description Wraps a body fragment in the shared page shell.
 * @param locale {string}
 * @param accent {string}
 * @param body {string}
 * @param status {number}
 * @returns {Response}
 */
function layout(locale: string, accent: string, body: string, status: number): Response {
	const html = `<!doctype html>
<html lang="${escapeHtml(locale)}">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
	body { margin:0; min-height:100vh; display:grid; place-items:center; background:#1e1f22; color:#dbdee1; font:16px/1.6 system-ui,sans-serif; }
	main { max-width:30rem; padding:2rem; text-align:center; }
	h1 { margin:0 0 .75rem; font-size:1.4rem; color:${accent}; }
	p { margin:0 0 1rem; color:#b5bac1; }
</style>
<main>${body}</main>`;
	return new Response(html, {
		status,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			// These pages are reached with a verification code in the URL: they must not be
			// cached, framed, or leaked through a Referer.
			'Cache-Control': 'no-store',
			'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
			'X-Frame-Options': 'DENY',
			'Referrer-Policy': 'no-referrer',
			'X-Content-Type-Options': 'nosniff',
		},
	});
}

/**
 * @author dop42
 * @method renderPage
 * @description Renders the page ending the flow, on success or on any refusal.
 * @param ok {boolean}
 * @param title {string}
 * @param body {string}
 * @param locale {string}
 * @returns {Response}
 */
export function renderPage(ok: boolean, title: string, body: string, locale: string): Response {
	return layout(
		locale,
		ok ? OK : BAD,
		`<h1>${escapeHtml(title)}</h1><p>${escapeHtml(body)}</p>`,
		ok ? 200 : 400,
	);
}


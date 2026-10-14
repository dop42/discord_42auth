import { LOGO_PATH, LOGO_VIEWBOX } from '../shared/logo';

const ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
};

/**
 * Escapes text for an HTML body or a double-quoted attribute.
 * @remarks Single quotes are deliberately left alone: every attribute in this file is
 * double-quoted, and there is no scriptable context on these pages.
 */
const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (char) => ESCAPES[char]!);

const BAD = '#e74c3c';

/**
 * Wraps a body fragment in the shared page shell.
 * @remarks These pages are reached with a verification code in the URL, so they are sent
 * uncacheable, unframeable, and without a Referer.
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
	svg { height:3.5rem; margin-bottom:1.25rem; fill:#dbdee1; }
</style>
<main><svg viewBox="${LOGO_VIEWBOX}" aria-hidden="true"><path d="${LOGO_PATH}"/></svg>${body}</main>`;
	return new Response(html, {
		status,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'no-store',
			'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
			'X-Frame-Options': 'DENY',
			'Referrer-Policy': 'no-referrer',
			'X-Content-Type-Options': 'nosniff',
		},
	});
}

/**
 * Sends the member back into the Discord server instead of a result page.
 * @remarks Used on success only. Landing in the server is the confirmation — the role is
 * granted and the channels are there — so a page saying so would only be an extra tab to
 * close. Failures still need a page, because they have a reason to explain.
 */
export function redirectToGuild(guildId: string): Response {
	return new Response(null, {
		status: 302,
		headers: {
			Location: `https://discord.com/channels/${guildId}`,
			'Cache-Control': 'no-store',
			'Referrer-Policy': 'no-referrer',
		},
	});
}

/** Renders the page a refusal ends on. */
export function renderPage(title: string, body: string, locale: string): Response {
	return layout(locale, BAD, `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(body)}</p>`, 400);
}


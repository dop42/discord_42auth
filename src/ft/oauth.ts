import { env } from '../env';

const FT_API = 'https://api.intra.42.fr';

/**
 * Raised when the intranet refuses the code itself rather than failing.
 *
 * @remarks A 42 code is single-use, so this is what a member reloading the result page
 * produces — they already have their role. Telling them "something went wrong on our side"
 * would send them chasing an outage that never happened.
 */
export class UsedCodeError extends Error {}

/**
 * @author dop42
 * @method authorizeUrl
 * @description Builds the intranet login URL that `/auth` hands to the member.
 * @remarks The state travels to the intranet and back untouched, so the callback verifies
 * the same signature `/auth` issued. Only the `public` scope is requested.
 * @param state {string}
 * @returns {string}
 */
export function authorizeUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: env.ftClientId,
		redirect_uri: env.redirectUri,
		response_type: 'code',
		scope: 'public',
		state,
	});
	return `${FT_API}/oauth/authorize?${params}`;
}

/**
 * @author dop42
 * @method exchangeCode
 * @description Trades the callback code for an access token.
 * @remarks The token is returned to the caller and never stored; it is held only for the
 * length of one request, and the errors carry a status code, never the code or the secret.
 * A refusal naming `invalid_grant` becomes a `UsedCodeError`, since that is what a member
 * reloading the result page produces; anything else — a wrong client secret, a redirect URI
 * mismatch, an outage — is a real failure and must not be blamed on the link.
 * @param code {string}
 * @returns {Promise<string>}
 * @throws {UsedCodeError}
 * @throws {Error}
 */
export async function exchangeCode(code: string): Promise<string> {
	const response = await fetch(`${FT_API}/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: env.ftClientId,
			client_secret: env.ftClientSecret,
			code,
			redirect_uri: env.redirectUri,
		}),
	});
	if (!response.ok) {
		const body = await response.text();
		if (body.includes('invalid_grant')) {
			throw new UsedCodeError('42 refused the code: already used or expired');
		}
		throw new Error(`42 token exchange failed with ${response.status}`);
	}
	const { access_token } = (await response.json()) as { access_token: string };
	return access_token;
}

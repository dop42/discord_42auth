import { randomBytes, timingSafeEqual } from 'node:crypto';
import { seal, unseal } from './crypto';
import { db } from './db/pool';
import {
	DiscordError,
	exchangeDiscordCodeFor,
	putRoleConnection,
	readAsUser,
	refreshDiscordToken,
	type OAuthUser,
} from './discord/rest';
import { env } from './env';
import { fetchAppToken, fetchUser, type FtUser, type Priority } from './ft/api';
import { cookie, readCookie } from './http';
import { localeFromHeader, t } from './i18n';
import { latestLink } from './links';
import { renderDone, renderPage } from './page';
import { mainLevel } from './rules';

const NONCE_COOKIE = '__Host-linked';
const redirectUri = () => `${env.publicUrl}/linked-roles/callback`;

/**
 * What a Discord admin can require of a role, registered once with `npm run register`.
 * @remarks Types are Discord's: 2 is "at least this number", 7 is "is true".
 */
export const ROLE_METADATA = [
	{
		key: 'level',
		name: 'Level',
		name_localizations: { fr: 'Niveau' },
		description: 'Level reached in the 42 main cursus',
		description_localizations: { fr: 'Niveau atteint dans le cursus principal de 42' },
		type: 2,
	},
	{
		key: 'projects',
		name: 'Validated projects',
		name_localizations: { fr: 'Projets validés' },
		description: 'Number of 42 projects validated',
		description_localizations: { fr: 'Nombre de projets 42 validés' },
		type: 2,
	},
	{
		key: 'student',
		name: 'Active student',
		name_localizations: { fr: 'Étudiant actif' },
		description: 'An active 42 account, not alumni',
		description_localizations: { fr: 'Un compte 42 actif, pas alumni' },
		type: 7,
	},
];

/** What the member's Discord profile shows, from their 42 profile. Discord wants strings. */
export function connectionOf(user: FtUser): {
	platform_name: string;
	platform_username: string;
	metadata: Record<string, string>;
} {
	const validated = (user.projects_users ?? []).filter((entry) => entry['validated?'] === true).length;
	const student = user['active?'] && !user['alumni?'];
	return {
		platform_name: '42',
		platform_username: user.login,
		metadata: {
			level: String(Math.floor(mainLevel(user) ?? 0)),
			projects: String(validated),
			student: student ? '1' : '0',
		},
	};
}

/**
 * Starts the Linked Roles flow: the URL set as "Linked Roles Verification URL" in the portal.
 * @remarks Asks Discord for `role_connections.write` only, plus `identify` to know who came
 * back. The state is a nonce mirrored in a ten-minute cookie, like the dashboard login.
 */
export function startLinkedRoles(): Response {
	const nonce = randomBytes(16).toString('base64url');
	const params = new URLSearchParams({
		client_id: env.discordAppId,
		redirect_uri: redirectUri(),
		response_type: 'code',
		scope: 'identify role_connections.write',
		state: nonce,
		prompt: 'consent',
	});
	return new Response(null, {
		status: 302,
		headers: {
			Location: `https://discord.com/oauth2/authorize?${params}`,
			'Set-Cookie': cookie(NONCE_COOKIE, nonce, 600),
			'Cache-Control': 'no-store',
		},
	});
}

/**
 * Reads the member's 42 profile and sends Discord what their profile shows.
 * @returns false when they have no 42 account linked anywhere any more
 * @throws {FtError | DiscordError}
 */
async function push(userId: string, accessToken: string, priority: Priority): Promise<boolean> {
	const link = await latestLink(userId);
	const user = link && (await fetchUser(link.ftId, await fetchAppToken(priority), priority));
	if (!user) {
		await putRoleConnection(accessToken, { platform_name: '42', platform_username: null, metadata: {} });
		return false;
	}
	await putRoleConnection(accessToken, connectionOf(user));
	return true;
}

/**
 * Finishes the flow: links the member's Discord profile to their 42 account.
 * @remarks Only a member who already verified on a server with this bot gets anything; the
 * 42 account is the one they verified most recently. Their refresh token is kept, encrypted,
 * so the weekly refresh can keep the level current.
 */
export async function finishLinkedRoles(request: Request): Promise<Response> {
	const params = new URL(request.url).searchParams;
	const locale = localeFromHeader(request.headers.get('accept-language'));
	const expected = Buffer.from(readCookie(request, NONCE_COOKIE) ?? '');
	const given = Buffer.from(params.get('state') ?? '');
	const code = params.get('code');
	if (!code || !expected.length || expected.length !== given.length || !timingSafeEqual(expected, given)) {
		return renderPage(t(locale, 'page.invalid.title'), t(locale, 'page.invalid.body'), locale);
	}

	try {
		const tokens = await exchangeDiscordCodeFor(code, redirectUri());
		const { id } = await readAsUser<OAuthUser>(tokens.access_token, '/users/@me');
		if (!(await push(id, tokens.access_token, 'interactive'))) {
			return renderPage(t(locale, 'linked.none.title'), t(locale, 'linked.none.body'), locale);
		}
		await db().query(
			`INSERT INTO role_connections (user_id, refresh_token) VALUES ($1, $2)
			 ON CONFLICT (user_id) DO UPDATE SET refresh_token = $2, updated_at = now()`,
			[id, seal(tokens.refresh_token)],
		);
		return renderDone(t(locale, 'linked.done.title'), t(locale, 'linked.done.body'), locale);
	} catch (failure) {
		console.error(failure);
		return renderPage(t(locale, 'page.failed.title'), t(locale, 'page.failed.body'), locale);
	}
}

/** Connections refreshed per run; once a week each. */
const BATCH = 50;

/**
 * Brings each member's Linked Roles up to date once a week.
 * @remarks Each refresh hands out a new refresh token, stored in place of the old one. A
 * member who revoked the app on Discord, or whose token no longer decrypts, is forgotten;
 * one with no 42 link left is cleared on Discord, then forgotten.
 */
export async function refreshLinkedRoles(): Promise<string | void> {
	const { rows } = await db().query<{ user_id: string; refresh_token: Buffer }>(
		`SELECT user_id, refresh_token FROM role_connections
		 WHERE updated_at < now() - interval '7 days' ORDER BY updated_at LIMIT $1`,
		[BATCH],
	);
	let refreshed = 0;
	for (const row of rows) {
		const forget = () => db().query('DELETE FROM role_connections WHERE user_id = $1', [row.user_id]);
		let tokens;
		try {
			tokens = await refreshDiscordToken(unseal(row.refresh_token));
		} catch (failure) {
			if (failure instanceof DiscordError && failure.status >= 500) throw failure;
			await forget();
			continue;
		}
		if (await push(row.user_id, tokens.access_token, 'background')) {
			await db().query('UPDATE role_connections SET refresh_token = $2, updated_at = now() WHERE user_id = $1', [
				row.user_id,
				seal(tokens.refresh_token),
			]);
			refreshed++;
		} else {
			await forget();
		}
	}
	return refreshed ? `${refreshed} refreshed` : undefined;
}

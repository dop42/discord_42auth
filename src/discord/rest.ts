import { env } from '../env';

const DISCORD_API = 'https://discord.com/api/v10';

/** Longest wait for one Discord call: a hung connection must not hold a request or the sweeper forever. */
const TIMEOUT_MS = 10_000;

/** A Discord error code meaning the member is not (or no longer) in the server. */
const UNKNOWN_MEMBER = 10007;

/**
 * Calls the Discord REST API with the bot token.
 * @remarks One retry on 429, after the delay Discord asks for when it is short. Longer
 * waits are not worth holding a request for, so the 429 is handed back to the caller.
 */
async function request(method: string, path: string, body?: unknown): Promise<Response> {
	const send = () =>
		fetch(`${DISCORD_API}${path}`, {
			method,
			headers: {
				Authorization: `Bot ${env.discordBotToken}`,
				'Content-Type': 'application/json',
			},
			body: body === undefined ? undefined : JSON.stringify(body),
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});

	const response = await send();
	if (response.status !== 429) return response;
	const wait = Number(response.headers.get('retry-after') ?? 'NaN');
	if (!(wait <= 2)) return response;
	await new Promise((resolve) => setTimeout(resolve, wait * 1000));
	return send();
}

/** GETs a bot route and parses it, failing on anything but a 2xx. */
async function read<T>(path: string): Promise<T> {
	const response = await request('GET', path);
	if (!response.ok) throw new DiscordError(response.status, path);
	return (await response.json()) as T;
}

/** A Discord refusal, carrying the status so callers can tell 403 from 404. */
export class DiscordError extends Error {
	constructor(
		readonly status: number,
		path: string,
	) {
		super(`Discord ${path.replace(/\d{17,20}/g, ':id')} answered ${status}`);
	}
}

/**
 * Grants the verified role to a member.
 * @remarks Fails when the bot role sits below the granted role, which is the most common
 * setup mistake; the error text says so because it surfaces in the logs.
 */
export async function addRole(guildId: string, userId: string, roleId: string): Promise<void> {
	const response = await request('PUT', `/guilds/${guildId}/members/${userId}/roles/${roleId}`);
	if (!response.ok) {
		throw new Error(
			`Could not grant the role (${response.status}). Check the bot permissions and role order.`,
		);
	}
}

/**
 * Takes the verified role back from a member, best-effort.
 * @remarks Never throws: it runs after the link is already forgotten, which is the part the
 * member asked for. A role left behind is visible and an admin can remove it.
 * @returns whether Discord accepted it
 */
export async function removeRole(guildId: string, userId: string, roleId: string): Promise<boolean> {
	const response = await request(
		'DELETE',
		`/guilds/${guildId}/members/${userId}/roles/${roleId}`,
	).catch(() => null);
	return response?.ok ?? false;
}

/**
 * Renames a member, or clears their nickname when given null.
 * @remarks Best-effort, and deliberately never throws: the role is what grants access, and
 * it has already been given by the time this runs. The log line names neither the member nor
 * the server — the operator's logs are not a place for personal data.
 */
export async function setNickname(
	guildId: string,
	userId: string,
	nick: string | null,
): Promise<void> {
	const response = await request('PATCH', `/guilds/${guildId}/members/${userId}`, {
		nick,
	}).catch(() => null);
	if (!response?.ok) {
		console.error(`Could not rename a member: ${response?.status ?? 'network'}`);
	}
}

/**
 * Posts a message in a channel: an audit line, or the verification panel.
 * @remarks Never throws: losing a log line must not fail an authentication that succeeded.
 * @returns whether Discord accepted it
 */
export async function postMessage(channelId: string, body: unknown): Promise<boolean> {
	const response = await request('POST', `/channels/${channelId}/messages`, body).catch(() => null);
	if (!response?.ok) {
		console.error(`Could not post in a channel: ${response?.status ?? 'network'}`);
	}
	return response?.ok ?? false;
}

export interface Member {
	user: { id: string };
	roles: string[];
	nick?: string | null;
}

/**
 * Fetches one member, or null when they are not in the server.
 * @remarks Only "Unknown Member" means absent. Any other failure — a 429, an outage, the bot
 * having been removed — throws, so the sweeper never deletes a link on a guess.
 * @throws {DiscordError}
 */
export async function getMember(guildId: string, userId: string): Promise<Member | null> {
	const path = `/guilds/${guildId}/members/${userId}`;
	const response = await request('GET', path);
	if (response.ok) return (await response.json()) as Member;
	if (response.status === 404) {
		const body = (await response.json().catch(() => ({}))) as { code?: number };
		if (body.code === UNKNOWN_MEMBER) return null;
	}
	throw new DiscordError(response.status, path);
}

export interface Role {
	id: string;
	name: string;
	color: number;
	position: number;
	permissions: string;
	managed: boolean;
}

export interface Guild {
	id: string;
	name: string;
	icon: string | null;
	owner_id: string;
	roles: Role[];
	/** Language of the server, e.g. `fr`; the panel is written in it. */
	preferred_locale: string;
}

/**
 * Fetches a server the bot is in, with its roles.
 * @throws {DiscordError}
 */
export const getGuild = (guildId: string) => read<Guild>(`/guilds/${guildId}`);

export interface Channel {
	id: string;
	name: string;
	type: number;
	position: number;
}

/**
 * Lists every channel of a server the bot is in.
 * @throws {DiscordError}
 */
export const getChannels = (guildId: string) => read<Channel[]>(`/guilds/${guildId}/channels`);

/**
 * Lists every server the bot is currently in.
 * @remarks Paginated by 200, Discord's maximum. Throws rather than returning a partial list:
 * the sweeper deletes the data of every server missing from it.
 * @throws {DiscordError}
 */
export async function botGuildIds(): Promise<Set<string>> {
	const ids = new Set<string>();
	let after = '0';
	for (;;) {
		const page = await read<Array<{ id: string }>>(`/users/@me/guilds?limit=200&after=${after}`);
		for (const guild of page) ids.add(guild.id);
		const last = page.at(-1);
		if (page.length < 200 || !last) return ids;
		after = last.id;
	}
}

// --- Dashboard login: these run with the admin's own OAuth2 token, never the bot's. ---

export interface OAuthUser {
	id: string;
	username: string;
	global_name: string | null;
	avatar: string | null;
}

export interface OAuthGuild {
	id: string;
	name: string;
	icon: string | null;
	owner: boolean;
	permissions: string;
}

/**
 * Trades a dashboard login code for a user access token.
 * @remarks The token is used for two reads during the login and then dropped; it is never
 * stored. Later permission checks go through the bot instead.
 */
export async function exchangeDiscordCode(code: string): Promise<string> {
	const response = await fetch(`${DISCORD_API}/oauth2/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: env.discordAppId,
			client_secret: env.discordClientSecret,
			code,
			redirect_uri: env.discordRedirectUri,
		}),
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
	if (!response.ok) throw new Error(`Discord token exchange failed with ${response.status}`);
	const { access_token } = (await response.json()) as { access_token: string };
	return access_token;
}

/**
 * GETs a route with a user's OAuth2 token.
 * @throws {DiscordError}
 */
export async function readAsUser<T>(token: string, path: string): Promise<T> {
	const response = await fetch(`${DISCORD_API}${path}`, {
		headers: { Authorization: `Bearer ${token}` },
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
	if (!response.ok) throw new DiscordError(response.status, path);
	return (await response.json()) as T;
}

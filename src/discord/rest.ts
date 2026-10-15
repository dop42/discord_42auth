import { env } from '../env';

const DISCORD_API = 'https://discord.com/api/v10';

/** Longest wait for one Discord call: a hung connection must not hold a request or the sweeper forever. */
const TIMEOUT_MS = 10_000;

/** A Discord error code meaning the member is not (or no longer) in the server. */
const UNKNOWN_MEMBER = 10007;

/**
 * Calls the Discord REST API with the bot token.
 * @remarks On 429, retries after the delay Discord asks for when it is at most `patience`
 * seconds, a few times. Two seconds by default: longer waits are not worth holding a
 * dashboard request for, so the 429 is handed back to the caller. Background work that must
 * go through, like copying the campus events, passes more.
 */
async function request(method: string, path: string, body?: unknown, patience = 2): Promise<Response> {
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

	let response = await send();
	for (let retry = 0; response.status === 429 && retry < 5; retry++) {
		const wait = Number(response.headers.get('retry-after') ?? 'NaN');
		if (!(wait <= patience)) return response;
		await new Promise((resolve) => setTimeout(resolve, wait * 1000));
		response = await send();
	}
	return response;
}

/** How long removing the copied events waits on Discord's rate limit, which is tight for events. */
const EVENTS_PATIENCE = 120;

/** GETs a bot route and parses it, failing on anything but a 2xx. */
async function read<T>(path: string): Promise<T> {
	const response = await request('GET', path);
	if (!response.ok) throw await DiscordError.from(response, path);
	return (await response.json()) as T;
}

/** A Discord refusal, carrying the status so callers can tell 403 from 404. */
export class DiscordError extends Error {
	constructor(
		readonly status: number,
		path: string,
		/** Discord's own reason, e.g. `50013 Missing Permissions`, which tells what to fix. */
		reason?: string,
	) {
		super(`Discord ${path.replace(/\d{17,20}/g, ':id')} answered ${status}${reason ? ` (${reason})` : ''}`);
	}

	/**
	 * Builds the error from a refused response, with Discord's code and message when it sent
	 * some. Neither names a member or a server.
	 */
	static async from(response: Response, path: string): Promise<DiscordError> {
		const body = (await response.json().catch(() => null)) as { code?: unknown; message?: unknown } | null;
		const reason =
			typeof body?.code === 'number' && typeof body.message === 'string'
				? `${body.code} ${body.message.slice(0, 100)}`
				: undefined;
		return new DiscordError(response.status, path, reason);
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

/**
 * Replaces the reply of a deferred interaction.
 * @remarks Goes through the interaction's webhook, so it works even where the bot cannot
 * post. Never throws, like `postMessage`: the member simply keeps seeing "thinking…".
 * @param token the interaction token, valid 15 minutes
 */
export async function editReply(token: string, body: unknown): Promise<void> {
	const response = await request(
		'PATCH',
		`/webhooks/${env.discordAppId}/${token}/messages/@original`,
		body,
	).catch(() => null);
	if (!response?.ok) {
		console.error(`Could not answer an interaction: ${response?.status ?? 'network'}`);
	}
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
	throw await DiscordError.from(response, path);
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

/** Deletes a Discord event the bot created, best-effort: one already gone is fine. */
export async function deleteScheduledEvent(guildId: string, eventId: string): Promise<void> {
	await request('DELETE', `/guilds/${guildId}/scheduled-events/${eventId}`, undefined, EVENTS_PATIENCE).catch(
		() => null,
	);
}

/** A Discord AutoMod rule, as far as the bot reads it. */
export interface AutomodRule {
	id: string;
	/** 1 keyword, 3 suspected spam, 4 Discord's word lists, 5 mention spam. */
	trigger_type: number;
}

/** What the bot sends to create or update an AutoMod rule; the trigger is only set on creation. */
export interface AutomodRuleBody {
	name: string;
	trigger_metadata: Record<string, unknown>;
	actions: Array<{ type: number; metadata?: Record<string, unknown> }>;
	enabled: boolean;
}

/**
 * Lists a server's AutoMod rules.
 * @throws {DiscordError} 403 when the bot lacks Manage Server
 */
export const listAutomodRules = (guildId: string) =>
	read<AutomodRule[]>(`/guilds/${guildId}/auto-moderation/rules`);

/**
 * Creates an AutoMod rule acting on messages sent.
 * @returns its id
 * @throws {DiscordError}
 */
export async function createAutomodRule(
	guildId: string,
	triggerType: number,
	body: AutomodRuleBody,
): Promise<string> {
	const path = `/guilds/${guildId}/auto-moderation/rules`;
	// Event type 1: a member sends or edits a message.
	const response = await request('POST', path, { ...body, event_type: 1, trigger_type: triggerType });
	if (!response.ok) throw await DiscordError.from(response, path);
	return ((await response.json()) as { id: string }).id;
}

/**
 * Updates an AutoMod rule, with only the fields given.
 * @returns false when Discord does not find it, even if it was just listed
 * @throws {DiscordError}
 */
export async function updateAutomodRule(
	guildId: string,
	ruleId: string,
	body: Partial<AutomodRuleBody>,
): Promise<boolean> {
	const path = `/guilds/${guildId}/auto-moderation/rules/${ruleId}`;
	const response = await request('PATCH', path, body);
	if (response.status === 404) return false;
	if (!response.ok) throw await DiscordError.from(response, path);
	return true;
}

/**
 * Deletes an AutoMod rule; one already gone is fine.
 * @throws {DiscordError}
 */
export async function deleteAutomodRule(guildId: string, ruleId: string): Promise<void> {
	const path = `/guilds/${guildId}/auto-moderation/rules/${ruleId}`;
	const response = await request('DELETE', path);
	if (!response.ok && response.status !== 404) throw await DiscordError.from(response, path);
}

/**
 * Renames a channel.
 * @remarks Discord allows two renames per channel every ten minutes; the counter never asks
 * for more.
 * @throws {DiscordError}
 */
export async function renameChannel(channelId: string, name: string): Promise<void> {
	const path = `/channels/${channelId}`;
	const response = await request('PATCH', path, { name });
	if (!response.ok) throw await DiscordError.from(response, path);
}

/**
 * Sends a private message to a user who shares a server with the bot.
 * @returns whether it was delivered; false when their private messages are closed
 */
export async function sendDirectMessage(userId: string, body: unknown): Promise<boolean> {
	const response = await request('POST', '/users/@me/channels', { recipient_id: userId }).catch(() => null);
	if (!response?.ok) return false;
	const { id } = (await response.json()) as { id: string };
	const sent = await request('POST', `/channels/${id}/messages`, body).catch(() => null);
	return sent?.ok ?? false;
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

/** What Discord hands back for a user's OAuth2 grant. */
export interface DiscordTokens {
	access_token: string;
	refresh_token: string;
}

/**
 * Calls Discord's token endpoint with the application's credentials.
 * @throws {DiscordError}
 */
async function tokenRequest(grant: Record<string, string>): Promise<DiscordTokens> {
	const response = await fetch(`${DISCORD_API}/oauth2/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: env.discordAppId,
			client_secret: env.discordClientSecret,
			...grant,
		}),
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
	if (!response.ok) throw await DiscordError.from(response, '/oauth2/token');
	return (await response.json()) as DiscordTokens;
}

/**
 * Trades an OAuth2 code for the user's tokens.
 * @param redirectUri the one the authorization was started with
 * @throws {DiscordError}
 */
export const exchangeDiscordCodeFor = (code: string, redirectUri: string) =>
	tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri });

/**
 * Trades a refresh token for new tokens; the old refresh token stops working.
 * @throws {DiscordError}
 */
export const refreshDiscordToken = (refreshToken: string) =>
	tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken });

/**
 * Trades a dashboard login code for a user access token.
 * @remarks The token is used for two reads during the login and then dropped; it is never
 * stored. Later permission checks go through the bot instead.
 * @throws {DiscordError}
 */
export async function exchangeDiscordCode(code: string): Promise<string> {
	return (await exchangeDiscordCodeFor(code, env.discordRedirectUri)).access_token;
}

/**
 * Sets what the member's Discord profile shows for this application (Linked Roles).
 * @param token the member's own access token, with `role_connections.write`
 * @throws {DiscordError}
 */
export async function putRoleConnection(
	token: string,
	connection: { platform_name: string; platform_username: string | null; metadata: Record<string, string> },
): Promise<void> {
	const path = `/users/@me/applications/${env.discordAppId}/role-connection`;
	const response = await fetch(`${DISCORD_API}${path}`, {
		method: 'PUT',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(connection),
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
	if (!response.ok) throw await DiscordError.from(response, path);
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
	if (!response.ok) throw await DiscordError.from(response, path);
	return (await response.json()) as T;
}

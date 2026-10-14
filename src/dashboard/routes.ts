import { randomBytes, timingSafeEqual } from 'node:crypto';
import type {
	ChannelOption,
	GuildDetail,
	GuildSettings,
	GuildSummary,
	Me,
	Meta,
	RoleOption,
} from '../../shared/api';
import { basePermissions, canManage, highestPosition, inviteUrl } from '../discord/permissions';
import {
	botGuildIds,
	DiscordError,
	exchangeDiscordCode,
	getChannels,
	getGuild,
	getMember,
	readAsUser,
	type Guild,
	type OAuthGuild,
	type OAuthUser,
} from '../discord/rest';
import { TEXT_CHANNEL_TYPES } from '../discord/types';
import { env } from '../env';
import { apiJson, cookie, readCookie } from '../http';
import { countLinks } from '../links';
import { deleteGuild, getSettings, parseSettings, saveSettings } from '../settings';
import { createSession, endSession, readSession, type Session } from './session';

const OAUTH_COOKIE = '__Host-oauth';

/** How long the list of servers the bot is in may be reused before asking Discord again. */
const BOT_GUILDS_TTL_MS = 60 * 1000;

let botGuilds: { ids: Set<string>; at: number } | undefined;

/**
 * @author dop42
 * @method currentBotGuilds
 * @description Returns the servers the bot is in, cached for a minute.
 * @remarks The home page needs it on every load, and Discord rate-limits the route.
 * @returns {Promise<Set<string>>}
 */
async function currentBotGuilds(): Promise<Set<string>> {
	if (!botGuilds || Date.now() - botGuilds.at > BOT_GUILDS_TTL_MS) {
		botGuilds = { ids: await botGuildIds(), at: Date.now() };
	}
	return botGuilds.ids;
}

const error = (status: number, code: string, field?: keyof GuildSettings) =>
	apiJson(field ? { error: code, field } : { error: code }, status);

/**
 * @author dop42
 * @method sameOrigin
 * @description Tells whether a state-changing request was sent by the dashboard itself.
 * @remarks The session cookie is SameSite=Lax, which already keeps it off cross-site POSTs;
 * this is the second lock, and the one that also covers same-site subdomains.
 * @param request {Request}
 * @returns {boolean}
 */
const sameOrigin = (request: Request) => request.headers.get('origin') === env.publicUrl;

/**
 * @author dop42
 * @method login
 * @description Starts the Discord login of the dashboard.
 * @remarks The state is a random nonce mirrored in a ten-minute cookie, so a callback can
 * only finish a login this browser started. Only `identify` and `guilds` are requested: who
 * the admin is, and which servers they could manage.
 * @returns {Response}
 */
function login(): Response {
	const nonce = randomBytes(16).toString('base64url');
	const params = new URLSearchParams({
		client_id: env.discordAppId,
		redirect_uri: env.discordRedirectUri,
		response_type: 'code',
		scope: 'identify guilds',
		state: nonce,
		prompt: 'none',
	});
	return new Response(null, {
		status: 302,
		headers: {
			Location: `https://discord.com/oauth2/authorize?${params}`,
			'Set-Cookie': cookie(OAUTH_COOKIE, nonce, 600),
			'Cache-Control': 'no-store',
		},
	});
}

/**
 * @author dop42
 * @method loginCallback
 * @description Finishes the Discord login and opens a session.
 * @remarks The admin's token is used for the two reads below and then dropped. Any failure
 * lands back on the home page logged out rather than on an error page: retrying is one click.
 * @param request {Request}
 * @returns {Promise<Response>}
 */
async function loginCallback(request: Request): Promise<Response> {
	const params = new URL(request.url).searchParams;
	const expected = Buffer.from(readCookie(request, OAUTH_COOKIE) ?? '');
	const given = Buffer.from(params.get('state') ?? '');
	const code = params.get('code');

	const home = (setCookies: string[]) => {
		const headers = new Headers({ Location: '/', 'Cache-Control': 'no-store' });
		for (const value of setCookies) headers.append('Set-Cookie', value);
		return new Response(null, { status: 302, headers });
	};
	const clearNonce = cookie(OAUTH_COOKIE, '', 0);

	if (!code || !expected.length || expected.length !== given.length || !timingSafeEqual(expected, given)) {
		return home([clearNonce]);
	}

	try {
		const token = await exchangeDiscordCode(code);
		const [user, guilds] = await Promise.all([
			readAsUser<OAuthUser>(token, '/users/@me'),
			readAsUser<OAuthGuild[]>(token, '/users/@me/guilds'),
		]);
		const session = await createSession({
			userId: user.id,
			username: user.global_name ?? user.username,
			avatar: user.avatar,
			guilds: guilds
				.filter((guild) => guild.owner || canManage(BigInt(guild.permissions)))
				.map(({ id, name, icon }) => ({ id, name, icon })),
		});
		return home([clearNonce, session]);
	} catch (failure) {
		console.error(failure);
		return home([clearNonce]);
	}
}

/**
 * @author dop42
 * @method authorize
 * @description Proves, through the bot, that the session's user may manage a server now.
 * @remarks The list kept in the session is a snapshot from the login; permissions may have
 * been taken away since, so every guild route asks Discord again. Discord answering 403 or
 * 404 for the server means the bot is not in it.
 * @param session {Session}
 * @param guildId {string}
 * @returns {Promise<Guild | Response>} the server, or the error response to send
 */
async function authorize(session: Session, guildId: string): Promise<Guild | Response> {
	let guild: Guild;
	try {
		guild = await getGuild(guildId);
	} catch (failure) {
		if (failure instanceof DiscordError && (failure.status === 403 || failure.status === 404)) {
			return error(404, 'bot_absent');
		}
		throw failure;
	}
	const member = await getMember(guildId, session.userId);
	if (!member || !canManage(basePermissions(guild, member))) return error(403, 'forbidden');
	return guild;
}

/**
 * @author dop42
 * @method options
 * @description Lists the roles and channels the settings form may offer.
 * @param guild {Guild}
 * @returns {Promise<{ roles: RoleOption[]; channels: ChannelOption[] }>}
 */
async function options(guild: Guild): Promise<{ roles: RoleOption[]; channels: ChannelOption[] }> {
	const [bot, channels] = await Promise.all([
		getMember(guild.id, env.discordAppId),
		getChannels(guild.id),
	]);
	const top = bot ? highestPosition(guild, bot) : 0;

	return {
		roles: guild.roles
			.filter((role) => role.id !== guild.id)
			.sort((a, b) => b.position - a.position)
			.map((role) => ({
				id: role.id,
				name: role.name,
				color: role.color,
				assignable: !role.managed && role.position < top,
			})),
		channels: channels
			.filter((channel) => TEXT_CHANNEL_TYPES.has(channel.type))
			.sort((a, b) => a.position - b.position)
			.map(({ id, name }) => ({ id, name })),
	};
}

/**
 * @author dop42
 * @method guildRoute
 * @description Serves `/api/guilds/:id`: read, save, or erase one server's settings.
 * @param request {Request}
 * @param session {Session}
 * @param guildId {string}
 * @returns {Promise<Response>}
 */
async function guildRoute(request: Request, session: Session, guildId: string): Promise<Response> {
	const guild = await authorize(session, guildId);
	if (guild instanceof Response) return guild;

	switch (request.method) {
		case 'GET': {
			const [settings, { roles, channels }, verifiedCount] = await Promise.all([
				getSettings(guildId),
				options(guild),
				countLinks(guildId),
			]);
			const detail: GuildDetail = {
				guild: { id: guild.id, name: guild.name, icon: guild.icon },
				settings,
				roles,
				channels,
				verifiedCount,
			};
			return apiJson(detail);
		}
		case 'PUT': {
			const parsed = parseSettings(await request.json().catch(() => null));
			if (!parsed.ok) return error(400, 'invalid', parsed.field);
			const { settings } = parsed;

			const { roles, channels } = await options(guild);
			if (settings.roleId && !roles.some((r) => r.id === settings.roleId && r.assignable)) {
				return error(400, 'invalid', 'roleId');
			}
			if (settings.logChannelId && !channels.some((c) => c.id === settings.logChannelId)) {
				return error(400, 'invalid', 'logChannelId');
			}

			await saveSettings(guildId, settings);
			return apiJson(settings);
		}
		case 'DELETE':
			await deleteGuild(guildId);
			return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
		default:
			return error(405, 'method_not_allowed');
	}
}

/**
 * @author dop42
 * @method handleDashboard
 * @description Serves the dashboard's login routes and JSON API, or null for any other path.
 * @param request {Request}
 * @returns {Promise<Response | null>}
 */
export async function handleDashboard(request: Request): Promise<Response | null> {
	const { pathname } = new URL(request.url);
	const method = request.method;

	if (pathname === '/auth/login' && method === 'GET') return login();
	if (pathname === '/auth/callback' && method === 'GET') return loginCallback(request);

	if (pathname === '/api/meta' && method === 'GET') {
		const meta: Meta = {
			operator: { name: env.operatorName, contact: env.operatorContact },
			hosting: env.hosting,
			inviteUrl: inviteUrl(),
		};
		return apiJson(meta);
	}

	const isAuth = pathname === '/auth/logout';
	if (!isAuth && !pathname.startsWith('/api/')) return null;

	if (method !== 'GET' && !sameOrigin(request)) return error(403, 'bad_origin');

	if (isAuth) {
		if (method !== 'POST') return error(405, 'method_not_allowed');
		const cleared = await endSession(request);
		return new Response(null, { status: 204, headers: { 'Set-Cookie': cleared } });
	}

	const session = await readSession(request);
	if (!session) return error(401, 'unauthenticated');

	if (pathname === '/api/me' && method === 'GET') {
		const present = await currentBotGuilds();
		const guilds: GuildSummary[] = session.guilds.map((guild) => ({
			...guild,
			botPresent: present.has(guild.id),
			inviteUrl: inviteUrl(guild.id),
		}));
		const me: Me = {
			user: { id: session.userId, username: session.username, avatar: session.avatar },
			guilds,
		};
		return apiJson(me);
	}

	const match = /^\/api\/guilds\/(\d{17,20})$/.exec(pathname);
	if (match?.[1]) return guildRoute(request, session, match[1]);

	return error(404, 'not_found');
}

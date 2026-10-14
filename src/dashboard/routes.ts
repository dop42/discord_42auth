import { randomBytes, timingSafeEqual } from 'node:crypto';
import type {
	ApiError,
	ChannelOption,
	GuildDetail,
	GuildSummary,
	LinkedMember,
	Me,
	MemberPage,
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
	postMessage,
	readAsUser,
	type Guild,
	type OAuthGuild,
	type OAuthUser,
} from '../discord/rest';
import { MessageFlags, SNOWFLAKE, TEXT_CHANNEL_TYPES } from '../discord/types';
import { env } from '../env';
import { apiJson, cookie, readCookie } from '../http';
import { resolveLocale } from '../i18n';
import { countLinks, listLinks, PAGE_SIZE } from '../links';
import { unlink } from '../membership';
import { panelComponents } from '../panel';
import { deleteGuild, getSettings, parseSettings, saveSettings } from '../settings';
import { createSession, endSession, readSession, type Session } from './session';

const OAUTH_COOKIE = '__Host-oauth';

/** How long the list of servers the bot is in may be reused before asking Discord again. */
const BOT_GUILDS_TTL_MS = 60 * 1000;

let botGuilds: { ids: Set<string>; at: number } | undefined;

/**
 * Returns the servers the bot is in, cached for a minute.
 * @remarks The home page needs it on every load, and Discord rate-limits the route.
 */
async function currentBotGuilds(): Promise<Set<string>> {
	if (!botGuilds || Date.now() - botGuilds.at > BOT_GUILDS_TTL_MS) {
		botGuilds = { ids: await botGuildIds(), at: Date.now() };
	}
	return botGuilds.ids;
}

/** How long a Discord read made for the dashboard may be reused. */
const CACHE_MS = 15_000;

const reads = new Map<string, { at: number; value: Promise<unknown> }>();

/**
 * Reuses a recent Discord read for the dashboard.
 * @remarks A page load asks for the same server, roles and channels several times, and every
 * API call re-checks the admin's rights through the bot. Fifteen seconds keeps that to one
 * Discord call each while a right taken away, or a role just created, still shows up almost at
 * once. Concurrent callers share the request in flight; a failed read is not kept.
 */
function cached<T>(key: string, read: () => Promise<T>): Promise<T> {
	const now = Date.now();
	for (const [stale, entry] of reads) if (now - entry.at > CACHE_MS) reads.delete(stale);
	const hit = reads.get(key);
	if (hit) return hit.value as Promise<T>;
	const value = read();
	reads.set(key, { at: now, value });
	value.catch(() => {
		if (reads.get(key)?.value === value) reads.delete(key);
	});
	return value;
}

const error = (status: number, code: string, field?: ApiError['field'], index?: number) => {
	const body: ApiError = { error: code };
	if (field) body.field = field;
	if (index !== undefined) body.index = index;
	return apiJson(body, status);
};

const noContent = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

/**
 * Tells whether a state-changing request was sent by the dashboard itself.
 * @remarks The session cookie is SameSite=Lax, which already keeps it off cross-site POSTs;
 * this is the second lock, and the one that also covers same-site subdomains.
 */
const sameOrigin = (request: Request) => request.headers.get('origin') === env.publicUrl;

/**
 * Starts the Discord login of the dashboard.
 * @remarks The state is a random nonce mirrored in a ten-minute cookie, so a callback can
 * only finish a login this browser started. Only `identify` and `guilds` are requested: who
 * the admin is, and which servers they could manage.
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
 * Finishes the Discord login and opens a session.
 * @remarks The admin's token is used for the two reads below and then dropped. Any failure
 * lands back on the home page logged out rather than on an error page: retrying is one click.
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
 * Proves, through the bot, that the session's user may manage a server now.
 * @remarks The list kept in the session is a snapshot from the login; permissions may have
 * been taken away since, so every guild route asks Discord again. Discord answering 403 or
 * 404 for the server means the bot is not in it.
 * @returns the server, or the error response to send
 */
async function authorize(session: Session, guildId: string): Promise<Guild | Response> {
	let guild: Guild;
	try {
		guild = await cached(`guild:${guildId}`, () => getGuild(guildId));
	} catch (failure) {
		if (failure instanceof DiscordError && (failure.status === 403 || failure.status === 404)) {
			return error(404, 'bot_absent');
		}
		throw failure;
	}
	const member = await cached(`member:${guildId}:${session.userId}`, () =>
		getMember(guildId, session.userId),
	);
	if (!member || !canManage(basePermissions(guild, member))) return error(403, 'forbidden');
	return guild;
}

/** Lists the roles and channels the settings form may offer. */
async function options(guild: Guild): Promise<{ roles: RoleOption[]; channels: ChannelOption[] }> {
	const [bot, channels] = await Promise.all([
		cached(`member:${guild.id}:${env.discordAppId}`, () => getMember(guild.id, env.discordAppId)),
		cached(`channels:${guild.id}`, () => getChannels(guild.id)),
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

/** Serves `/api/guilds/:id`: read, save, or erase one server's settings. */
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
			if (!parsed.ok) return error(400, 'invalid', parsed.field, parsed.index);
			const { settings } = parsed;

			const { roles, channels } = await options(guild);
			const assignable = (id: string) => roles.some((r) => r.id === id && r.assignable);
			if (settings.roleId && !assignable(settings.roleId)) {
				return error(400, 'invalid', 'roleId');
			}
			const badRule = settings.roleRules.findIndex((rule) => !assignable(rule.roleId));
			if (badRule !== -1) return error(400, 'invalid', 'roleRules', badRule);
			if (settings.logChannelId && !channels.some((c) => c.id === settings.logChannelId)) {
				return error(400, 'invalid', 'logChannelId');
			}

			await saveSettings(guildId, settings);
			return apiJson(settings);
		}
		case 'DELETE':
			await deleteGuild(guildId);
			return noContent();
		default:
			return error(405, 'method_not_allowed');
	}
}

/**
 * Serves `/api/guilds/:id/members`: one page of the verified members.
 * @remarks Only what the database holds is shown — the Discord id, the 42 login and the
 * date. Resolving every member's Discord name would cost one call each; the admin can find
 * anyone from their id.
 */
async function membersRoute(request: Request, guildId: string): Promise<Response> {
	const params = new URL(request.url).searchParams;
	const query = (params.get('q') ?? '').trim().slice(0, 64);
	const page = Math.max(0, Math.min(Number.parseInt(params.get('page') ?? '0', 10) || 0, 10_000));
	const { links, total } = await listLinks(guildId, query, page);
	const members: LinkedMember[] = links.map((link) => ({
		userId: link.userId,
		ftLogin: link.ftLogin,
		verifiedAt: link.verifiedAt.toISOString(),
	}));
	const body: MemberPage = { members, total, page, pageSize: PAGE_SIZE };
	return apiJson(body);
}

/**
 * Serves `DELETE /api/guilds/:id/members/:userId`: an admin unlinks one member.
 * @remarks Same effect as the member running `/forget`: the link, the roles and the
 * nickname the bot gave go. The member can verify again afterwards.
 */
async function unlinkRoute(guildId: string, userId: string): Promise<Response> {
	const settings = await getSettings(guildId);
	const result = await unlink(guildId, userId, settings, await getMember(guildId, userId));
	return result.linked ? noContent() : error(404, 'not_linked');
}

/**
 * Serves `POST /api/guilds/:id/panel`: posts the verification panel in a channel.
 * @remarks The same message `/panel` posts, in the server's language. Only channels the form
 * offers are accepted; Discord refusing (the bot cannot see or write there) is a 502 the
 * dashboard explains.
 */
async function panelRoute(request: Request, guild: Guild): Promise<Response> {
	const body = (await request.json().catch(() => null)) as { channelId?: unknown } | null;
	const channelId = body?.channelId;
	if (typeof channelId !== 'string' || !SNOWFLAKE.test(channelId)) {
		return error(400, 'invalid', 'channelId');
	}
	const { channels } = await options(guild);
	if (!channels.some((channel) => channel.id === channelId)) return error(400, 'invalid', 'channelId');

	const posted = await postMessage(channelId, {
		flags: MessageFlags.IS_COMPONENTS_V2,
		components: panelComponents(resolveLocale(guild.preferred_locale)),
	});
	return posted ? noContent() : error(502, 'cannot_post');
}

/** Serves the dashboard's login routes and JSON API, or null for any other path. */
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
	// Asking "am I logged in?" is not an error: answering 401 would print one in the console
	// of every visitor of the landing page.
	if (!session && pathname === '/api/me' && method === 'GET') return noContent();
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

	const match = /^\/api\/guilds\/(\d{17,20})(?:\/(members|panel)(?:\/(\d{17,20}))?)?$/.exec(pathname);
	const guildId = match?.[1];
	if (!match || !guildId) return error(404, 'not_found');
	const [, , section, userId] = match;

	if (!section) return guildRoute(request, session, guildId);

	const guild = await authorize(session, guildId);
	if (guild instanceof Response) return guild;

	if (section === 'members' && !userId && method === 'GET') return membersRoute(request, guildId);
	if (section === 'members' && userId && method === 'DELETE') return unlinkRoute(guildId, userId);
	if (section === 'panel' && !userId && method === 'POST') return panelRoute(request, guild);

	return error(404, 'not_found');
}

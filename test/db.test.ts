import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';

/**
 * Runs against a real PostgreSQL, with Discord replaced by a fake `fetch`.
 * Skipped unless TEST_DATABASE_URL points at a throwaway database: every table is emptied.
 *   docker run --rm -d -p 5433:5432 -e POSTGRES_PASSWORD=test --name pg-test postgres:17-alpine
 *   TEST_DATABASE_URL=postgres://postgres:test@localhost:5433/postgres npm test
 */
const url = process.env.TEST_DATABASE_URL;

const ORIGIN = 'https://bot.example';
const APP = '200000000000000000';
const GUILD = '200000000000000001';
const ROLE = '200000000000000002';
const HIGH = '200000000000000003';
const BOT_ROLE = '200000000000000004';
const CHANNEL = '200000000000000005';
const ADMIN = '200000000000000006';
const MEMBER = '200000000000000007';
const LEFT = '200000000000000008';
const CURSUS_ROLE = '200000000000000010';
const ORDER_ROLE = '200000000000000011';

Object.assign(process.env, {
	DATABASE_URL: url ?? '',
	PUBLIC_URL: ORIGIN,
	DISCORD_APP_ID: APP,
	DISCORD_BOT_TOKEN: 'bot',
	DISCORD_CLIENT_SECRET: 'secret',
	OPERATOR_NAME: 'op',
	OPERATOR_CONTACT: 'op@example.org',
	HOSTING_LOCATION: 'France',
	STATE_SECRET: 'x'.repeat(32),
	FT_CLIENT_ID: 'ft',
	FT_CLIENT_SECRET: 'ft',
	FT_SPACING_MS: '0',
});

/** The 42 account every fake login returns; reset before each test. */
const freshUser = () => ({
	id: 42,
	login: 'jdoe',
	usual_full_name: 'John Doe',
	'active?': true,
	'alumni?': false,
	'staff?': false,
	campus: [{ id: 1, name: 'Paris' }],
	campus_users: [{ campus_id: 1, is_primary: true }],
	cursus_users: [{ end_at: null, cursus: { name: '42cursus', slug: '42cursus' } }],
});
let ftUser = freshUser();

/** Members the fake Discord knows about in GUILD. */
const members = new Map<string, string[]>([
	[ADMIN, [HIGH]],
	[MEMBER, []],
	[APP, [BOT_ROLE]],
]);
let botGuilds = [GUILD];

/** What the fake intra answers for marks, campus events: set by the tests that need them. */
let fakeMarks: unknown[] = [];
let fakeEvents: Array<Record<string, unknown>> = [];
/** The server's AutoMod rules on the fake Discord, and what listing them answers. */
let automodRules: Array<{ id: string; trigger_type: number }> = [];
let automodStatus = 200;
/** Bodies of the Discord writes, in the same order as `writes`. */
const bodies: string[] = [];

/** The last validations lookup `/helpers` made, to see which accounts it asked about. */
let lastValidationQuery = '';

/** Discord calls that change something, as `METHOD path`. */
const writes: string[] = [];

const fakeFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
	const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
	if (String(input) === 'https://api.intra.42.fr/oauth/token') return ok({ access_token: 't', expires_in: 7200 });
	if (String(input) === 'https://api.intra.42.fr/v2/me') return ok(ftUser);
	if (String(input) === 'https://api.intra.42.fr/v2/users/42') return ok(ftUser);
	if (String(input) === 'https://api.intra.42.fr/v2/users/42/coalitions') return ok([{ name: 'The Order', slug: 'the-order' }]);
	if (String(input).startsWith('https://api.intra.42.fr/v2/campus/1/locations?filter[active]=true&page')) {
		return ok([
			{ host: 'c1r1p1', user: { id: 42, login: 'jdoe' } },
			{ host: 'c2r5p8', user: { id: 7, login: 'helper' } },
			{ host: 'c3r1p2', user: { id: 8, login: 'shy' } },
		]);
	}
	if (String(input) === 'https://api.intra.42.fr/v2/projects/cub3d') return ok({ name: 'cub3d', slug: 'cub3d' });
	if (String(input).startsWith('https://api.intra.42.fr/v2/projects/cub3d/projects_users?')) {
		lastValidationQuery = String(input);
		return ok([
			{ status: 'finished', 'validated?': false, final_mark: 40, user: { id: 7, login: 'helper' } },
			{ status: 'finished', 'validated?': true, final_mark: 115, user: { id: 7, login: 'helper' } },
			{ status: 'finished', 'validated?': true, final_mark: 100, user: { id: 8, login: 'shy' } },
		]);
	}
	if (String(input).startsWith('https://api.intra.42.fr/v2/projects/')) return new Response('{}', { status: 404 });
	if (String(input).startsWith('https://api.intra.42.fr/v2/projects_users?filter[user_id]=')) return ok(fakeMarks);
	if (String(input) === 'https://api.intra.42.fr/v2/campus?filter[name]=Paris') return ok([{ id: 1, name: 'Paris', time_zone: 'Europe/Paris' }]);
	if (String(input).startsWith('https://api.intra.42.fr/v2/campus/1/events?')) return ok(fakeEvents);
	if (String(input).startsWith('https://api.intra.42.fr/v2/campus/1/exams?')) return ok([]);
	const path = String(input).replace('https://discord.com/api/v10', '');
	if (init?.method && init.method !== 'GET') {
		writes.push(`${init.method} ${path}`);
		bodies.push(String(init.body ?? ''));
		if (init.method === 'POST' && path === `/guilds/${GUILD}/scheduled-events`) return ok({ id: `2000000000000009${String(writes.length).padStart(2, '0')}` });
		if (path.startsWith(`/guilds/${GUILD}/auto-moderation/rules`)) {
			if (init.method === 'POST') {
				const id = `2000000000000008${String(writes.length).padStart(2, '0')}`;
				automodRules.push({ id, trigger_type: (JSON.parse(String(init.body)) as { trigger_type: number }).trigger_type });
				return ok({ id });
			}
			if (init.method === 'DELETE') automodRules = automodRules.filter((rule) => !path.endsWith(rule.id));
			return new Response(null, { status: 204 });
		}
		if (init.method === 'POST' && path === '/users/@me/channels') return ok({ id: '200000000000000088' });
		if (init.method === 'POST' && path === '/oauth2/token') {
			return ok({ access_token: 'user-access', refresh_token: `refresh-${writes.length}` });
		}
		return new Response(null, { status: 204 });
	}
	if (path === `/guilds/${GUILD}/auto-moderation/rules`) {
		return automodStatus === 200 ? ok(automodRules) : new Response('{}', { status: automodStatus });
	}
	if (path.startsWith('/users/@me/guilds')) return ok(botGuilds.map((id) => ({ id })));
	if (path === '/users/@me') return ok({ id: MEMBER, username: 'member', global_name: null, avatar: null });
	if (path === `/guilds/${GUILD}`) {
		return ok({
			id: GUILD,
			name: 'campus',
			icon: null,
			owner_id: '1',
			preferred_locale: 'fr',
			roles: [
				{ id: GUILD, name: '@everyone', color: 0, position: 0, permissions: '0', managed: false },
				{ id: ROLE, name: 'verified', color: 0, position: 1, permissions: '0', managed: false },
				{ id: CURSUS_ROLE, name: '42cursus', color: 0, position: 1, permissions: '0', managed: false },
				{ id: ORDER_ROLE, name: 'order', color: 0, position: 1, permissions: '0', managed: false },
				{ id: BOT_ROLE, name: 'bot', color: 0, position: 2, permissions: '0', managed: true },
				{ id: HIGH, name: 'admins', color: 0, position: 3, permissions: '32', managed: false },
			],
		});
	}
	if (path === `/guilds/${GUILD}/channels`) {
		return ok([
			{ id: CHANNEL, name: 'logs', type: 0, position: 1 },
			{ id: '200000000000000099', name: 'voice', type: 2, position: 0 },
		]);
	}
	const member = new RegExp(`^/guilds/${GUILD}/members/(\\d+)$`).exec(path);
	if (member?.[1]) {
		const roles = members.get(member[1]);
		return roles
			? ok({ user: { id: member[1] }, roles })
			: new Response(JSON.stringify({ code: 10007 }), { status: 404 });
	}
	return new Response('{}', { status: 404 });
};

const skip = url ? false : 'TEST_DATABASE_URL not set';

let db: typeof import('../src/db/pool');
let route: typeof import('../src/server').route;
let cookie = '';

before(async () => {
	if (!url) return;
	globalThis.fetch = fakeFetch as typeof fetch;
	db = await import('../src/db/pool');
	route = (await import('../src/server')).route;
	await db.db().query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
	await db.migrate();

	const { createSession } = await import('../src/dashboard/session');
	cookie = (await createSession({ userId: ADMIN, username: 'admin', avatar: null, guilds: [{ id: GUILD, name: 'campus', icon: null }] })).split(';')[0]!;
});

beforeEach(async () => {
	if (!url) return;
	await db.db().query('TRUNCATE guilds CASCADE');
	members.set(ADMIN, [HIGH]);
	members.set(MEMBER, []);
	members.delete(LEFT);
	botGuilds = [GUILD];
	writes.length = 0;
	bodies.length = 0;
	fakeMarks = [];
	fakeEvents = [];
	automodRules = [];
	automodStatus = 200;
	ftUser = freshUser();
});

after(async () => {
	if (url) await db.closeDb();
});

const call = (path: string, init: RequestInit = {}) =>
	route(new Request(`${ORIGIN}${path}`, { ...init, headers: { cookie, origin: ORIGIN, ...init.headers } }));

const settings = {
	roleId: ROLE,
	campus: 'Paris',
	studentsOnly: true,
	nickname: 'login',
	logChannelId: CHANNEL,
	roleRules: [] as unknown[],
	helpers: false,
	fameChannelId: null as string | null,
	syncEvents: false,
	syncExams: false,
	counterChannelId: null as string | null,
	automodSpam: false,
	automodMentions: null as number | null,
	automodLanguage: false,
	automodKeywords: [] as string[],
	automodAlertChannelId: null as string | null,
};
const rules = [
	{ kind: 'cursus', value: '42cursus', roleId: CURSUS_ROLE },
	{ kind: 'coalition', value: 'the-order', roleId: ORDER_ROLE },
];

test('migrations are idempotent', { skip }, async () => {
	assert.deepEqual(await db.migrate(), []);
});

test('/api/me lists the session servers with the bot presence', { skip }, async () => {
	const response = await call('/api/me');
	assert.equal(response.status, 200);
	const me = (await response.json()) as { guilds: Array<{ id: string; botPresent: boolean }> };
	assert.deepEqual(me.guilds.map((g) => [g.id, g.botPresent]), [[GUILD, true]]);
});

test('no session: /api/me is empty, the other routes are a 401', { skip }, async () => {
	assert.equal((await route(new Request(`${ORIGIN}/api/me`))).status, 204);
	assert.equal((await route(new Request(`${ORIGIN}/api/guilds/${GUILD}`))).status, 401);
});

test('a guild detail offers only roles under the bot and text channels', { skip }, async () => {
	const response = await call(`/api/guilds/${GUILD}`);
	assert.equal(response.status, 200);
	const detail = (await response.json()) as { roles: Array<{ id: string; assignable: boolean }>; channels: Array<{ id: string }> };
	assert.deepEqual(detail.roles.map((r) => [r.id, r.assignable]), [[HIGH, false], [BOT_ROLE, false], [ROLE, true], [CURSUS_ROLE, true], [ORDER_ROLE, true]]);
	assert.deepEqual(detail.channels.map((c) => c.id), [CHANNEL]);
});

test('settings are saved, then read back', { skip }, async () => {
	const saved = await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify(settings) });
	assert.equal(saved.status, 200);
	const detail = (await (await call(`/api/guilds/${GUILD}`)).json()) as { settings: unknown };
	assert.deepEqual(detail.settings, settings);
});

test('a role above the bot is refused', { skip }, async () => {
	const response = await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify({ ...settings, roleId: HIGH }) });
	assert.equal(response.status, 400);
	assert.deepEqual(await response.json(), { error: 'invalid', field: 'roleId' });
});

test('a write from another origin is refused', { skip }, async () => {
	const response = await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify(settings), headers: { origin: 'https://evil.example' } });
	assert.equal(response.status, 403);
});

test('an admin who lost Manage Server is refused, despite the session snapshot', { skip }, async () => {
	members.set(ADMIN, []);
	assert.equal((await call(`/api/guilds/${GUILD}`)).status, 403);
});

test('deleting a server erases its settings and links', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify(settings) });
	const { saveLink, countLinks } = await import('../src/links');
	await saveLink({ guildId: GUILD, userId: MEMBER, ftId: 1, ftLogin: 'jdoe' });
	assert.equal((await call(`/api/guilds/${GUILD}`, { method: 'DELETE' })).status, 204);
	assert.equal(await countLinks(GUILD), 0);
	const { rowCount } = await db.db().query('SELECT 1 FROM guilds');
	assert.equal(rowCount, 0);
});

test('one 42 account cannot be linked to two members of a server', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify(settings) });
	const { saveLink } = await import('../src/links');
	await saveLink({ guildId: GUILD, userId: MEMBER, ftId: 1, ftLogin: 'jdoe' });
	await assert.rejects(saveLink({ guildId: GUILD, userId: LEFT, ftId: 1, ftLogin: 'jdoe' }));
});

test('the sweeper drops members who left, then servers the bot left', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify(settings) });
	const { saveLink, countLinks } = await import('../src/links');
	const { sweep } = await import('../src/sweeper');
	await saveLink({ guildId: GUILD, userId: MEMBER, ftId: 1, ftLogin: 'stay' });
	await saveLink({ guildId: GUILD, userId: LEFT, ftId: 2, ftLogin: 'gone' });
	await db.db().query("UPDATE links SET checked_at = now() - interval '2 days'");

	assert.deepEqual(await sweep(), { sessions: 0, guilds: 0, links: 1, revoked: 0 });
	assert.equal(await countLinks(GUILD), 1);

	botGuilds = [];
	assert.equal((await sweep()).guilds, 1);
	assert.equal(await countLinks(GUILD), 0);
});

test('the 42 callback links, grants, and keeps one 42 account to one member', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify({ ...settings, logChannelId: null }) });
	const { createState } = await import('../src/state');
	const { findByFtAccount } = await import('../src/links');
	const verify = (userId: string) => {
		const state = createState({ guildId: GUILD, userId, locale: 'en-US', guildLocale: 'en-US' });
		return route(new Request(`${ORIGIN}/api/callback?code=c&state=${state}`));
	};

	assert.equal((await verify(MEMBER)).status, 302);
	assert.equal((await findByFtAccount(GUILD, 42))?.userId, MEMBER);
	assert.ok(writes.includes(`PUT /guilds/${GUILD}/members/${MEMBER}/roles/${ROLE}`));

	members.set(LEFT, []);
	assert.equal((await verify(LEFT)).status, 400, 'a second member is refused while the first is here');
	assert.equal((await findByFtAccount(GUILD, 42))?.userId, MEMBER);

	members.delete(MEMBER);
	members.set(LEFT, []);
	assert.equal((await verify(LEFT)).status, 302, 'the account is released once its holder left');
	assert.equal((await findByFtAccount(GUILD, 42))?.userId, LEFT);
});

test('a role rule naming a role above the bot is refused with its index', { skip }, async () => {
	const body = { ...settings, roleRules: [rules[0], { ...rules[1], roleId: HIGH }] };
	const response = await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify(body) });
	assert.equal(response.status, 400);
	assert.deepEqual(await response.json(), { error: 'invalid', field: 'roleRules', index: 1 });
});

test('the callback grants the rule roles the account earns', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify({ ...settings, logChannelId: null, roleRules: rules }) });
	const { createState } = await import('../src/state');
	const state = createState({ guildId: GUILD, userId: MEMBER, locale: 'en-US', guildLocale: 'en-US' });
	assert.equal((await route(new Request(`${ORIGIN}/api/callback?code=c&state=${state}`))).status, 302);
	for (const role of [ROLE, CURSUS_ROLE, ORDER_ROLE]) {
		assert.ok(writes.includes(`PUT /guilds/${GUILD}/members/${MEMBER}/roles/${role}`), role);
	}
});

test('the members tab lists, searches and unlinks', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify(settings) });
	const { saveLink, countLinks } = await import('../src/links');
	await saveLink({ guildId: GUILD, userId: MEMBER, ftId: 1, ftLogin: 'jdoe' });
	await saveLink({ guildId: GUILD, userId: ADMIN, ftId: 2, ftLogin: 'admin42' });

	const all = (await (await call(`/api/guilds/${GUILD}/members`)).json()) as { total: number; members: Array<{ ftLogin: string }> };
	assert.equal(all.total, 2);
	const found = (await (await call(`/api/guilds/${GUILD}/members?q=JD`)).json()) as { total: number; members: Array<{ ftLogin: string }> };
	assert.deepEqual(found.members.map((m) => m.ftLogin), ['jdoe']);

	members.set(MEMBER, [ROLE]);
	assert.equal((await call(`/api/guilds/${GUILD}/members/${MEMBER}`, { method: 'DELETE' })).status, 204);
	assert.ok(writes.includes(`DELETE /guilds/${GUILD}/members/${MEMBER}/roles/${ROLE}`));
	assert.equal(await countLinks(GUILD), 1);
	assert.equal((await call(`/api/guilds/${GUILD}/members/${MEMBER}`, { method: 'DELETE' })).status, 404);
});

test('the panel is posted only in a text channel of the server', { skip }, async () => {
	const post = (channelId: string) => call(`/api/guilds/${GUILD}/panel`, { method: 'POST', body: JSON.stringify({ channelId }) });
	assert.equal((await post(CHANNEL)).status, 204);
	assert.ok(writes.includes(`POST /channels/${CHANNEL}/messages`));
	assert.equal((await post('200000000000000099')).status, 400);
});

test('the weekly re-check takes the role back from a closed account and syncs the others', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify({ ...settings, roleRules: [rules[0]] }) });
	const { saveLink, countLinks } = await import('../src/links');
	const { sweep } = await import('../src/sweeper');
	await saveLink({ guildId: GUILD, userId: MEMBER, ftId: 42, ftLogin: 'jdoe' });
	await db.db().query("UPDATE links SET ft_checked_at = now() - interval '8 days'");

	members.set(MEMBER, [ROLE]);
	assert.equal((await sweep()).revoked, 0);
	assert.ok(writes.includes(`PUT /guilds/${GUILD}/members/${MEMBER}/roles/${CURSUS_ROLE}`));
	assert.equal((await sweep()).revoked, 0, 'checked again only a week later');

	await db.db().query("UPDATE links SET ft_checked_at = now() - interval '8 days'");
	ftUser['active?'] = false;
	members.set(MEMBER, [ROLE, CURSUS_ROLE]);
	writes.length = 0;
	assert.equal((await sweep()).revoked, 1);
	assert.equal(await countLinks(GUILD), 0);
	assert.ok(writes.includes(`DELETE /guilds/${GUILD}/members/${MEMBER}/roles/${ROLE}`));
	assert.ok(writes.includes(`DELETE /guilds/${GUILD}/members/${MEMBER}/roles/${CURSUS_ROLE}`));
	assert.ok(writes.includes(`POST /channels/${CHANNEL}/messages`), 'the log channel says why');
});

test('too many logins from one address are refused', { skip }, async () => {
	const responses = [];
	for (let i = 0; i < 25; i++) {
		responses.push(await route(new Request(`${ORIGIN}/auth/login`, { headers: { 'x-peer-address': '198.51.100.20' } })));
	}
	assert.equal(responses[0]?.status, 302);
	assert.equal(responses.at(-1)?.status, 429);
	assert.ok(Number(responses.at(-1)?.headers.get('retry-after')) > 0);
});

test('/profile is deferred, then answered with the card, to verified members only, admins included', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify(settings) });
	const { saveLink } = await import('../src/links');
	const { handleProfile } = await import('../src/commands/profile');
	await saveLink({ guildId: GUILD, userId: MEMBER, ftId: 42, ftLogin: 'jdoe' });
	const ask = (callerId: string, memberId?: string) =>
		handleProfile({
			type: 2,
			token: 'itoken',
			guild_id: GUILD,
			member: { user: { id: callerId }, roles: [], permissions: '0' },
			data: { name: 'profile', options: memberId ? [{ name: 'member', type: 6, value: memberId }] : [] },
			locale: 'en-US',
		});
	const reply = async (response: Response) => (await response.json()) as { type: number; data: { content?: string } };

	members.set(LEFT, []);
	assert.match((await reply(await ask(LEFT, MEMBER))).data.content ?? '', /Verify your own 42 account/);
	assert.match((await reply(await ask(LEFT))).data.content ?? '', /not verified on this server/);
	const asAdmin = await handleProfile({
		type: 2,
		token: 'itoken',
		guild_id: GUILD,
		member: { user: { id: ADMIN }, roles: [HIGH], permissions: '32' },
		data: { name: 'profile', options: [{ name: 'member', type: 6, value: MEMBER }] },
		locale: 'en-US',
	});
	assert.match((await reply(asAdmin)).data.content ?? '', /Verify your own 42 account/, 'Manage Server is not a 42 account');

	assert.equal((await reply(await ask(MEMBER))).type, 5);
	const edit = `PATCH /webhooks/${APP}/itoken/messages/@original`;
	for (let i = 0; i < 50 && !writes.includes(edit); i++) await new Promise((resolve) => setTimeout(resolve, 10));
	assert.ok(writes.includes(edit), 'the deferred reply is filled in');
});

test('/helpers lists who is on campus with the project validated, and /visibility hides a member', { skip }, async () => {
	const { saveLink } = await import('../src/links');
	const { handleHelpers } = await import('../src/commands/helpers');
	const { handleVisibility } = await import('../src/commands/visibility');
	const SHY = '200000000000000012';
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify(settings) });
	await saveLink({ guildId: GUILD, userId: MEMBER, ftId: 42, ftLogin: 'jdoe' });
	await saveLink({ guildId: GUILD, userId: ADMIN, ftId: 7, ftLogin: 'helper' });
	await saveLink({ guildId: GUILD, userId: SHY, ftId: 8, ftLogin: 'shy' });

	const command = (name: string, callerId: string, option: { name: string; type: number; value: string | boolean }) => ({
		type: 2,
		token: `t-${name}-${callerId}`,
		guild_id: GUILD,
		member: { user: { id: callerId }, roles: [], permissions: '0' },
		data: { name, options: [option] },
		locale: 'en-US',
	});
	const helpers = (callerId: string, project = 'cub3d') =>
		handleHelpers(command('helpers', callerId, { name: 'project', type: 3, value: project }));
	const content = async (response: Response) => ((await response.json()) as { data: { content?: string } }).data.content ?? '';
	const edited = async (token: string) => {
		const edit = `PATCH /webhooks/${APP}/${token}/messages/@original`;
		for (let i = 0; i < 50 && !writes.includes(edit); i++) await new Promise((resolve) => setTimeout(resolve, 10));
		return writes.includes(edit);
	};

	assert.match(await content(await helpers(MEMBER)), /not enabled/, 'off until an admin turns it on');
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify({ ...settings, helpers: true }) });
	assert.match(await content(await helpers(LEFT)), /Verify your own 42 account/);
	assert.match(await content(await helpers(MEMBER, '../users')), /No project named/);

	assert.equal(((await (await helpers(MEMBER)).json()) as { type: number }).type, 5);
	assert.ok(await edited(`t-helpers-${MEMBER}`));
	assert.deepEqual(lastValidationQuery.match(/user_id\]=([\d,]+)/)?.[1]?.split(',').sort(), ['7', '8'], 'the caller is left out');

	assert.match(await content(await handleVisibility(command('visibility', SHY, { name: 'shown', type: 5, value: false }))), /will no longer show you/);
	writes.length = 0;
	await helpers(MEMBER);
	assert.ok(await edited(`t-helpers-${MEMBER}`));
	assert.match(lastValidationQuery, /user_id\]=7&/, 'a hidden member is not even looked up');
	assert.match(await content(await handleVisibility(command('visibility', LEFT, { name: 'shown', type: 5, value: true }))), /No 42 account is linked/);
});

test('the events and the counter need a campus, and the counter a voice channel', { skip }, async () => {
	const save = (body: object) => call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify({ ...settings, ...body }) });
	assert.deepEqual(await (await save({ campus: null, syncEvents: true })).json(), { error: 'invalid', field: 'syncEvents' });
	assert.deepEqual(await (await save({ counterChannelId: CHANNEL })).json(), { error: 'invalid', field: 'counterChannelId' });
	assert.deepEqual(await (await save({ fameChannelId: '200000000000000099' })).json(), { error: 'invalid', field: 'fameChannelId' });
	assert.equal((await save({ syncEvents: true, counterChannelId: '200000000000000099', fameChannelId: CHANNEL })).status, 200);
});

test('the AutoMod filters become Discord rules, an existing one is taken over, a refusal saves nothing', { skip }, async () => {
	const save = (body: object) => call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify({ ...settings, ...body }) });
	const path = `/guilds/${GUILD}/auto-moderation/rules`;
	const count = (method: string) => writes.filter((write) => write.startsWith(`${method} ${path}`)).length;
	const ADMIN_RULE = '200000000000000777';
	automodRules = [{ id: ADMIN_RULE, trigger_type: 3 }];

	const on = { automodSpam: true, automodMentions: 5, automodKeywords: [' *spoil* ', '', '*SPOIL*', 'triche'], automodAlertChannelId: CHANNEL };
	const saved = (await (await save(on)).json()) as { automodKeywords: string[] };
	assert.deepEqual(saved.automodKeywords, ['*spoil*', 'triche'], 'trimmed, blank and repeated words dropped');
	assert.equal(count('POST'), 2, 'mentions and custom words are created');
	assert.ok(writes.includes(`PATCH ${path}/${ADMIN_RULE}`), 'the spam rule an admin made is taken over');
	assert.ok(bodies.some((body) => /"name":"Mentions en masse".*"mention_total_limit":5/.test(body)));
	assert.ok(bodies.some((body) => body.includes(`"channel_id":"${CHANNEL}"`)), 'alerts go to the chosen channel');

	writes.length = 0;
	bodies.length = 0;
	await save({ ...on, helpers: true });
	assert.equal(writes.filter((write) => write.includes('auto-moderation')).length, 0, 'unchanged filters send nothing');

	await save({});
	assert.equal(count('DELETE'), 2, 'the rules the bot made are deleted');
	assert.equal(bodies[writes.lastIndexOf(`PATCH ${path}/${ADMIN_RULE}`)], '{"enabled":false}', 'the admin rule is only disabled');
	assert.deepEqual(automodRules.map((rule) => rule.id), [ADMIN_RULE]);
	assert.equal((await db.db().query('SELECT 1 FROM guild_automod')).rowCount, 0);

	automodStatus = 403;
	const refused = await save({ automodLanguage: true });
	assert.equal(refused.status, 502);
	assert.deepEqual(await refused.json(), { error: 'automod_forbidden' });
	const kept = (await (await call(`/api/guilds/${GUILD}`)).json()) as { settings: { automodLanguage: boolean } };
	assert.equal(kept.settings.automodLanguage, false, 'nothing is saved when Discord refuses');

	automodStatus = 200;
	assert.deepEqual(await (await save({ automodMentions: 51 })).json(), { error: 'invalid', field: 'automodMentions' });
	assert.deepEqual(await (await save({ automodKeywords: ['x'.repeat(61)] })).json(), { error: 'invalid', field: 'automodKeywords' });
	assert.deepEqual(await (await save({ automodAlertChannelId: '200000000000000099' })).json(), { error: 'invalid', field: 'automodAlertChannelId' });
});

test('the hall of fame starts from now, then announces new validations once, hidden members never', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify({ ...settings, fameChannelId: CHANNEL }) });
	const { saveLink, setHidden } = await import('../src/links');
	const { announceFame } = await import('../src/fame');
	await saveLink({ guildId: GUILD, userId: MEMBER, ftId: 42, ftLogin: 'jdoe' });
	fakeMarks = [{ final_mark: 105, 'validated?': true, marked_at: new Date().toISOString(), project: { name: 'cub3d', slug: 'cub3d' }, user: { id: 42, login: 'jdoe' } }];
	const posts = () => writes.filter((write) => write === `POST /channels/${CHANNEL}/messages`).length;

	await announceFame();
	assert.equal(posts(), 0, 'a channel just chosen starts from now');
	await db.db().query("UPDATE guilds SET fame_checked_at = now() - interval '15 minutes'");
	await announceFame();
	assert.equal(posts(), 1);
	assert.match(bodies.at(-1) ?? '', /<@200000000000000007> a validé \*\*cub3d\*\* — \*\*105\*\*/);
	assert.match(bodies.at(-1) ?? '', /"parse":\[\]/, 'nobody is pinged');

	await setHidden(GUILD, MEMBER, true);
	await db.db().query("UPDATE guilds SET fame_checked_at = now() - interval '15 minutes'");
	await announceFame();
	assert.equal(posts(), 1, 'a hidden member is not announced');
});

test('campus events are mirrored once, updated when the intra changes them, removed when cancelled', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify({ ...settings, syncEvents: true }) });
	const { syncEvents } = await import('../src/events');
	const soon = (hours: number) => new Date(Date.now() + hours * 3600_000).toISOString();
	fakeEvents = [{ id: 1, name: 'Talk', kind: 'conference', description: 'about C', location: 'Amphi', begin_at: soon(48), end_at: soon(50), updated_at: '2026-10-01T00:00:00Z' }];
	const count = (method: string) => writes.filter((write) => write.startsWith(`${method} /guilds/${GUILD}/scheduled-events`)).length;

	await syncEvents();
	assert.equal(count('POST'), 1);
	await syncEvents(new Date(Date.now() + 31 * 60_000));
	assert.equal(count('POST') + count('PATCH'), 1, 'nothing changed, nothing sent');

	fakeEvents = [{ ...fakeEvents[0]!, name: 'Talk (moved)', updated_at: '2026-10-02T00:00:00Z' }];
	await syncEvents(new Date(Date.now() + 62 * 60_000));
	assert.equal(count('PATCH'), 1);

	fakeEvents = [];
	await syncEvents(new Date(Date.now() + 93 * 60_000));
	assert.equal(count('DELETE'), 1);
	const { rowCount } = await db.db().query('SELECT 1 FROM guild_events');
	assert.equal(rowCount, 0);
});

test('the counter renames its channel only when the count changes', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify({ ...settings, counterChannelId: '200000000000000099' }) });
	const { saveLink } = await import('../src/links');
	const { updateCounters } = await import('../src/counter');
	await saveLink({ guildId: GUILD, userId: MEMBER, ftId: 42, ftLogin: 'jdoe' });
	await updateCounters();
	assert.ok(writes.includes('PATCH /channels/200000000000000099'));
	assert.match(bodies.at(-1) ?? '', /"3 au campus · 1 ici"/);
	await updateCounters();
	assert.equal(writes.filter((write) => write === 'PATCH /channels/200000000000000099').length, 1);
});

test('a reminder is sent once when the deadline comes close, and goes with the last link', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify(settings) });
	const { saveLink, deleteLink } = await import('../src/links');
	const { setReminder, sendReminders } = await import('../src/reminders');
	await saveLink({ guildId: GUILD, userId: MEMBER, ftId: 42, ftLogin: 'jdoe' });
	const deadline = new Date(Date.now() + 5 * 24 * 3600_000).toISOString();
	Object.assign(ftUser, {
		cursus_users: [{ end_at: null, blackholed_at: deadline, cursus: { name: '42cursus', slug: '42cursus', kind: 'main' } }],
	});
	await setReminder(MEMBER, 7, 'fr');

	await sendReminders();
	assert.ok(writes.includes('POST /channels/200000000000000088/messages'));
	assert.match(bodies.at(-1) ?? '', /Ton échéance 42 arrive <t:\d+:R>/);
	await db.db().query("UPDATE reminders SET checked_at = '-infinity'");
	writes.length = 0;
	await sendReminders();
	assert.equal(writes.filter((write) => write.endsWith('/messages')).length, 0, 'the same deadline is reminded once');

	await deleteLink(GUILD, MEMBER);
	await db.db().query("UPDATE reminders SET checked_at = '-infinity'");
	await sendReminders();
	const { rowCount } = await db.db().query('SELECT 1 FROM reminders');
	assert.equal(rowCount, 0, 'no link left, no reminder kept');
});

test('Linked Roles: the flow shows the 42 profile on Discord, keeps the token sealed, and refreshes it', { skip }, async () => {
	await call(`/api/guilds/${GUILD}`, { method: 'PUT', body: JSON.stringify(settings) });
	const { saveLink } = await import('../src/links');
	const { refreshLinkedRoles } = await import('../src/linkedRoles');
	const start = await route(new Request(`${ORIGIN}/linked-roles`));
	assert.equal(start.status, 302);
	const state = new URL(start.headers.get('location') ?? '').searchParams.get('state');
	const nonce = `__Host-linked=${state}`;
	const finish = () =>
		route(new Request(`${ORIGIN}/linked-roles/callback?code=c&state=${state}`, { headers: { cookie: nonce } }));

	assert.equal((await finish()).status, 400, 'no 42 account linked yet');
	await saveLink({ guildId: GUILD, userId: MEMBER, ftId: 42, ftLogin: 'jdoe' });
	writes.length = 0;
	bodies.length = 0;
	assert.equal((await finish()).status, 200);
	const put = writes.indexOf(`PUT /users/@me/applications/${APP}/role-connection`);
	assert.ok(put >= 0);
	assert.deepEqual(JSON.parse(bodies[put]!), { platform_name: '42', platform_username: 'jdoe', metadata: { level: '0', projects: '0', student: '1' } });
	const { rows } = await db.db().query<{ refresh_token: Buffer }>('SELECT refresh_token FROM role_connections WHERE user_id = $1', [MEMBER]);
	assert.ok(rows[0] && !rows[0].refresh_token.toString().includes('refresh-'), 'stored sealed, never in clear');

	await db.db().query("UPDATE role_connections SET updated_at = now() - interval '8 days'");
	writes.length = 0;
	assert.equal(await refreshLinkedRoles(), '1 refreshed');
	assert.ok(writes.includes('POST /oauth2/token') && writes.includes(`PUT /users/@me/applications/${APP}/role-connection`));
	assert.notDeepEqual((await db.db().query<{ refresh_token: Buffer }>('SELECT refresh_token FROM role_connections')).rows[0]?.refresh_token, rows[0]!.refresh_token, 'the new refresh token replaces the old one');

	const wrong = await route(new Request(`${ORIGIN}/linked-roles/callback?code=c&state=forged`, { headers: { cookie: nonce } }));
	assert.equal(wrong.status, 400, 'a state this browser did not start is refused');
});

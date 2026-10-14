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

Object.assign(process.env, {
	DATABASE_URL: url ?? '',
	PUBLIC_URL: ORIGIN,
	DISCORD_APP_ID: APP,
	DISCORD_BOT_TOKEN: 'bot',
	OPERATOR_NAME: 'op',
	OPERATOR_CONTACT: 'op@example.org',
	HOSTING_LOCATION: 'France',
	STATE_SECRET: 'x'.repeat(32),
	FT_CLIENT_ID: 'ft',
	FT_CLIENT_SECRET: 'ft',
});

/** Members the fake Discord knows about in GUILD. */
const members = new Map<string, string[]>([
	[ADMIN, [HIGH]],
	[MEMBER, []],
	[APP, [BOT_ROLE]],
]);
let botGuilds = [GUILD];

/** Discord calls that change something, as `METHOD path`. */
const writes: string[] = [];

const fakeFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
	const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
	if (String(input) === 'https://api.intra.42.fr/oauth/token') return ok({ access_token: 't' });
	if (String(input) === 'https://api.intra.42.fr/v2/me') {
		return ok({ id: 42, login: 'jdoe', usual_full_name: 'John Doe', 'active?': true, 'alumni?': false, 'staff?': false, campus: [{ id: 1, name: 'Paris' }], campus_users: [{ campus_id: 1, is_primary: true }] });
	}
	const path = String(input).replace('https://discord.com/api/v10', '');
	if (init?.method && init.method !== 'GET') {
		writes.push(`${init.method} ${path}`);
		return new Response(null, { status: 204 });
	}
	if (path.startsWith('/users/@me/guilds')) return ok(botGuilds.map((id) => ({ id })));
	if (path === `/guilds/${GUILD}`) {
		return ok({
			id: GUILD,
			name: 'campus',
			icon: null,
			owner_id: '1',
			roles: [
				{ id: GUILD, name: '@everyone', color: 0, position: 0, permissions: '0', managed: false },
				{ id: ROLE, name: 'verified', color: 0, position: 1, permissions: '0', managed: false },
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
});

after(async () => {
	if (url) await db.closeDb();
});

const call = (path: string, init: RequestInit = {}) =>
	route(new Request(`${ORIGIN}${path}`, { ...init, headers: { cookie, origin: ORIGIN, ...init.headers } }));

const settings = { roleId: ROLE, campus: 'Paris', studentsOnly: true, nickname: 'login', logChannelId: CHANNEL };

test('migrations are idempotent', { skip }, async () => {
	assert.deepEqual(await db.migrate(), []);
});

test('/api/me lists the session servers with the bot presence', { skip }, async () => {
	const response = await call('/api/me');
	assert.equal(response.status, 200);
	const me = (await response.json()) as { guilds: Array<{ id: string; botPresent: boolean }> };
	assert.deepEqual(me.guilds.map((g) => [g.id, g.botPresent]), [[GUILD, true]]);
});

test('no session is a 401', { skip }, async () => {
	const response = await route(new Request(`${ORIGIN}/api/me`));
	assert.equal(response.status, 401);
});

test('a guild detail offers only roles under the bot and text channels', { skip }, async () => {
	const response = await call(`/api/guilds/${GUILD}`);
	assert.equal(response.status, 200);
	const detail = (await response.json()) as { roles: Array<{ id: string; assignable: boolean }>; channels: Array<{ id: string }> };
	assert.deepEqual(detail.roles.map((r) => [r.id, r.assignable]), [[HIGH, false], [BOT_ROLE, false], [ROLE, true]]);
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

	assert.deepEqual(await sweep(), { sessions: 0, guilds: 0, links: 1 });
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

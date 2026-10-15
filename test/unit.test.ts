import assert from 'node:assert/strict';
import { test } from 'node:test';
import { basePermissions, canManage, highestPosition } from '../src/discord/permissions';
import type { Guild, Member } from '../src/discord/rest';
import { Permissions } from '../src/discord/types';
import type { FtUser } from '../src/ft/api';
import { clientAddress, PEER_HEADER, RateLimiter } from '../src/ratelimit';
import { TtlCache } from '../src/cache';
import { helpersMessage, projectSlug } from '../src/helpers';
import { profileMessage } from '../src/profile';
import { matchingRoles, poolOf } from '../src/rules';
import { DEFAULTS, parseSettings } from '../src/settings';

const GUILD = '100000000000000001';
const ROLE = '100000000000000002';

const guild: Guild = {
	id: GUILD,
	name: 'campus',
	icon: null,
	owner_id: '100000000000000009',
	preferred_locale: 'fr',
	roles: [
		{ id: GUILD, name: '@everyone', color: 0, position: 0, permissions: '0', managed: false },
		{ id: ROLE, name: 'staff', color: 0, position: 3, permissions: String(Permissions.MANAGE_GUILD), managed: false },
		{ id: '100000000000000003', name: 'member', color: 0, position: 1, permissions: '0', managed: false },
	],
};
const member = (id: string, roles: string[]): Member => ({ user: { id }, roles });

test('parseSettings accepts a full, valid body and trims the campus', () => {
	const parsed = parseSettings({ ...DEFAULTS, roleId: ROLE, campus: '  Paris  ' });
	assert.deepEqual(parsed, { ok: true, settings: { ...DEFAULTS, roleId: ROLE, campus: 'Paris' } });
});

test('parseSettings turns a blank campus into "any"', () => {
	const parsed = parseSettings({ ...DEFAULTS, campus: '   ' });
	assert.equal(parsed.ok && parsed.settings.campus, null);
});

test('parseSettings names the first refused field', () => {
	assert.deepEqual(parseSettings({ ...DEFAULTS, roleId: '<@&123>' }), { ok: false, field: 'roleId' });
	assert.deepEqual(parseSettings({ ...DEFAULTS, logChannelId: 12 }), { ok: false, field: 'logChannelId' });
	assert.deepEqual(parseSettings({ ...DEFAULTS, nickname: 'nope' }), { ok: false, field: 'nickname' });
	assert.deepEqual(parseSettings({ ...DEFAULTS, studentsOnly: 'yes' }), { ok: false, field: 'studentsOnly' });
	assert.deepEqual(parseSettings({ ...DEFAULTS, campus: 'x'.repeat(65) }), { ok: false, field: 'campus' });
	assert.equal(parseSettings(null).ok, false);
});

test('parseSettings validates every role rule and says which one is wrong', () => {
	const rule = { kind: 'campus', value: ' Paris ', roleId: ROLE };
	const parsed = parseSettings({ ...DEFAULTS, roleRules: [rule] });
	assert.deepEqual(parsed.ok && parsed.settings.roleRules, [{ ...rule, value: 'Paris' }]);
	assert.deepEqual(parseSettings({ ...DEFAULTS, roleRules: [rule, { ...rule, kind: 'house' }] }), {
		ok: false,
		field: 'roleRules',
		index: 1,
	});
	assert.deepEqual(parseSettings({ ...DEFAULTS, roleRules: [{ ...rule, value: ' ' }] }), { ok: false, field: 'roleRules', index: 0 });
	assert.deepEqual(parseSettings({ ...DEFAULTS, roleRules: Array(26).fill(rule) }), { ok: false, field: 'roleRules' });
	assert.deepEqual(parseSettings({ ...DEFAULTS, roleRules: undefined }), { ok: false, field: 'roleRules' });
});

const student: FtUser = {
	id: 1,
	login: 'jdoe',
	usual_full_name: 'John Doe',
	'active?': true,
	'alumni?': false,
	'staff?': false,
	campus: [{ id: 1, name: 'Paris' }, { id: 2, name: 'Lyon' }],
	campus_users: [{ campus_id: 1, is_primary: true }, { campus_id: 2, is_primary: false }],
	cursus_users: [
		{ end_at: '2024-08-01T00:00:00.000Z', cursus: { name: 'C Piscine', slug: 'c-piscine' } },
		{ end_at: null, cursus: { name: '42cursus', slug: '42cursus' } },
	],
};

test('matchingRoles reads the primary campus, running cursus and coalitions', () => {
	const rules = [
		{ kind: 'campus', value: 'paris', roleId: 'paris' },
		{ kind: 'campus', value: 'Lyon', roleId: 'lyon' },
		{ kind: 'cursus', value: '42CURSUS', roleId: 'cursus' },
		{ kind: 'cursus', value: 'c-piscine', roleId: 'piscine' },
		{ kind: 'coalition', value: 'The Order', roleId: 'order' },
		{ kind: 'coalition', value: 'the-alliance', roleId: 'alliance' },
	] as const;
	const roles = matchingRoles(student, [{ name: 'The Order', slug: 'the-order' }], [...rules], new Date('2025-01-01'));
	assert.deepEqual(roles, ['paris', 'cursus', 'order']);
});

test('parseSettings checks level and piscine values, and normalizes a level', () => {
	const rule = (kind: string, value: string) => ({ ...DEFAULTS, roleRules: [{ kind, value, roleId: ROLE }] });
	const parsed = parseSettings(rule('level', ' 07.50 '));
	assert.deepEqual(parsed.ok && parsed.settings.roleRules, [{ kind: 'level', value: '7.5', roleId: ROLE }]);
	assert.equal(parseSettings(rule('pool', '2025-07')).ok, true);
	assert.equal(parseSettings(rule('pool', '2025')).ok, true);
	for (const [kind, value] of [['level', 'ten'], ['level', '-1'], ['level', '100'], ['pool', '2025-13'], ['pool', 'july']]) {
		assert.deepEqual(parseSettings(rule(kind!, value!)), { ok: false, field: 'roleRules', index: 0 }, `${kind} ${value}`);
	}
});

const cadet: FtUser = {
	...student,
	pool_month: 'july',
	pool_year: '2025',
	cursus_users: [
		{ end_at: '2025-07-25T16:00:00.000Z', level: 9.1, grade: 'Pisciner', cursus: { name: 'C Piscine', slug: 'c-piscine', kind: 'piscine' } },
		{ end_at: null, level: 4.07, grade: 'Cadet', blackholed_at: '2026-10-18T06:42:00.000Z', cursus: { name: '42cursus', slug: '42cursus', kind: 'main' } },
	],
	projects_users: [
		{ status: 'finished', 'validated?': true, final_mark: 100, project: { name: 'CPP Module 00', slug: 'cpp-module-00' } },
		{ status: 'finished', 'validated?': false, final_mark: 0, project: { name: 'minishell', slug: 'minishell' } },
		{ status: 'in_progress', 'validated?': null, final_mark: null, project: { name: 'cub3d', slug: 'cub3d' } },
	],
};

test('matchingRoles reads the main level, validated projects and the piscine', () => {
	const rules = [
		{ kind: 'level', value: '4', roleId: 'lvl4' },
		{ kind: 'level', value: '5', roleId: 'lvl5' },
		{ kind: 'project', value: 'cpp module 00', roleId: 'cpp' },
		{ kind: 'project', value: 'minishell', roleId: 'minishell' },
		{ kind: 'project', value: 'cub3d', roleId: 'cub3d' },
		{ kind: 'pool', value: '2025', roleId: 'y2025' },
		{ kind: 'pool', value: '2025-07', roleId: 'july' },
		{ kind: 'pool', value: '2025-08', roleId: 'august' },
	] as const;
	assert.deepEqual(matchingRoles(cadet, [], [...rules]), ['lvl4', 'cpp', 'y2025', 'july']);
	// The piscine level is another scale: 9.1 there does not reach level 5.
	assert.deepEqual(matchingRoles({ ...cadet, cursus_users: cadet.cursus_users!.slice(0, 1) }, [], [...rules]), [
		'cpp',
		'y2025',
		'july',
	]);
});

test('poolOf gives the year alone when the month is missing', () => {
	assert.equal(poolOf(cadet), '2025-07');
	assert.equal(poolOf({ ...cadet, pool_month: null }), '2025');
	assert.equal(poolOf({ ...cadet, pool_year: null }), null);
});

test('the profile card keeps the deadline and the points for the member themselves', () => {
	const now = new Date('2026-10-15T00:00:00Z');
	const text = (self: boolean) => JSON.stringify(profileMessage(cadet, [], 'en-US', { memberId: '1', self, now }));
	assert.match(text(true), /level 4\.07/);
	assert.match(text(true), /`cub3d`/);
	assert.match(text(true), /July 2025/);
	assert.match(text(true), /<t:1792305720:R>/);
	assert.doesNotMatch(text(false), /<t:|Evaluation points/);
	// The finished piscine is not listed, the main cursus is.
	assert.doesNotMatch(text(false), /C Piscine/);
});

test('projectSlug accepts a name or a slug, and nothing that could leave the path', () => {
	assert.equal(projectSlug('  CPP Module 00 '), 'cpp-module-00');
	assert.equal(projectSlug('ft_printf'), 'ft_printf');
	assert.equal(projectSlug('Born2beroot'), 'born2beroot');
	for (const bad of ['', '../users', 'a/b', 'x?y=1', '-start', 'x'.repeat(65)]) assert.equal(projectSlug(bad), null, bad);
});

test('the helpers answer lists the best marks and says so when nobody is there', () => {
	const project = { name: 'cub3d', slug: 'cub3d' };
	const text = JSON.stringify(helpersMessage(project, [{ userId: '1', login: 'jdoe', host: 'c2r5p8', mark: 115 }], 'en-US'));
	assert.match(text, /cub3d — 1 on campus/);
	assert.match(text, /<@1> · `c2r5p8` · jdoe · \*\*115\*\*/);
	assert.match(JSON.stringify(helpersMessage(project, [], 'en-US')), /Nobody from this server/);
});

test('the cache shares a load, keeps it until it expires, and forgets a failure', async () => {
	const cache = new TtlCache<string, number>(1000);
	let loads = 0;
	const load = async () => ++loads;
	assert.deepEqual(await Promise.all([cache.get('a', load, 0), cache.get('a', load, 0)]), [1, 1]);
	assert.equal(await cache.get('a', load, 999), 1);
	assert.equal(await cache.get('a', load, 1000), 2);
	await assert.rejects(cache.get('b', () => Promise.reject(new Error('down')), 0));
	assert.equal(await cache.get('b', load, 0), 3);
});

test('the rate limiter counts per key and says how long to wait', () => {
	const limiter = new RateLimiter(2, 60_000);
	assert.equal(limiter.take('a', 0), 0);
	assert.equal(limiter.take('a', 0), 0);
	assert.equal(limiter.take('a', 1000), 59);
	assert.equal(limiter.take('b', 1000), 0);
	assert.equal(limiter.take('a', 60_000), 0);
});

test('X-Forwarded-For is trusted only from our own proxy', () => {
	const request = (peer: string) =>
		new Request('https://bot.example/', { headers: { [PEER_HEADER]: peer, 'x-forwarded-for': '6.6.6.6, 203.0.113.9' } });
	assert.equal(clientAddress(request('172.18.0.3')), '203.0.113.9');
	assert.equal(clientAddress(request('::ffff:127.0.0.1')), '203.0.113.9');
	assert.equal(clientAddress(request('198.51.100.7')), '198.51.100.7');
});

test('a member can manage through a role granting Manage Server', () => {
	assert.equal(canManage(basePermissions(guild, member('100000000000000005', [ROLE]))), true);
	assert.equal(canManage(basePermissions(guild, member('100000000000000005', ['100000000000000003']))), false);
});

test('the owner can manage whatever their roles', () => {
	assert.equal(canManage(basePermissions(guild, member(guild.owner_id, []))), true);
});

test('@everyone permissions count for every member', () => {
	const open = { ...guild, roles: guild.roles.map((r) => (r.id === GUILD ? { ...r, permissions: String(Permissions.ADMINISTRATOR) } : r)) };
	assert.equal(canManage(basePermissions(open, member('100000000000000005', []))), true);
});

test('highestPosition is the top role, 0 without any', () => {
	assert.equal(highestPosition(guild, member('1', [ROLE, '100000000000000003'])), 3);
	assert.equal(highestPosition(guild, member('1', [])), 0);
});

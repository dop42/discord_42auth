import assert from 'node:assert/strict';
import { test } from 'node:test';
import { basePermissions, canManage, highestPosition } from '../src/discord/permissions';
import type { Guild, Member } from '../src/discord/rest';
import { Permissions } from '../src/discord/types';
import type { FtUser } from '../src/ft/api';
import { clientAddress, PEER_HEADER, RateLimiter } from '../src/ratelimit';
import { matchingRoles } from '../src/rules';
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

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { basePermissions, canManage, highestPosition } from '../src/discord/permissions';
import type { Guild, Member } from '../src/discord/rest';
import { Permissions } from '../src/discord/types';
import { DEFAULTS, parseSettings } from '../src/settings';

const GUILD = '100000000000000001';
const ROLE = '100000000000000002';

const guild: Guild = {
	id: GUILD,
	name: 'campus',
	icon: null,
	owner_id: '100000000000000009',
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

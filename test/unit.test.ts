import assert from 'node:assert/strict';
import { test } from 'node:test';
import { basePermissions, canManage, highestPosition } from '../src/discord/permissions';
import type { Guild, Member } from '../src/discord/rest';
import { Permissions } from '../src/discord/types';
import type { FtUser } from '../src/ft/api';
import { clientAddress, PEER_HEADER, RateLimiter } from '../src/ratelimit';
import { TtlCache } from '../src/cache';
import { seal, unseal } from '../src/crypto';
import { examMessage } from '../src/exams';
import { fameMessages } from '../src/fame';
import { connectionOf } from '../src/linkedRoles';
import { formatDuration, localMidnight, periodsFor, timeIn } from '../src/logtime';
import { deadlineOf, reminderDue } from '../src/reminders';
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

test('the hall of fame lists validations oldest first, members only, within Discord limits', () => {
	const mark = (id: number, project: string, at: string, validated = true) => ({
		final_mark: 100,
		'validated?': validated,
		marked_at: at,
		project: { name: project, slug: project },
		user: { id, login: `u${id}` },
	});
	const links = [{ guildId: 'g', userId: '11', ftId: 1, ftLogin: 'u1' }];
	const messages = fameMessages(
		[mark(1, 'cub3d', '2026-10-15T10:00:00Z'), mark(1, 'libft', '2026-10-15T09:00:00Z'), mark(1, 'push_swap', '2026-10-15T11:00:00Z', false), mark(2, 'minishell', '2026-10-15T10:00:00Z')],
		links,
		'en-US',
	);
	assert.deepEqual(messages, ['<@11> validated **libft** — **100**\n<@11> validated **cub3d** — **100**']);
	const many = fameMessages(Array.from({ length: 80 }, (_, i) => mark(1, `project-${i}`, `2026-10-15T10:${String(i % 60).padStart(2, '0')}:00Z`)), links, 'en-US');
	assert.ok(many.length > 1 && many.every((message) => message.length <= 2000));
});

test('an exam is announced by its projects, with Discord timestamps and a link to the intra', () => {
	const exam = { id: 7, name: 'Exam Stud', location: '', begin_at: '2026-10-20T10:00:00Z', end_at: '2026-10-20T13:00:00Z', projects: [{ name: 'Exam Rank 02' }, { name: 'Exam Rank 03' }] };
	const [container] = examMessage(exam, 'Paris', 'fr') as Array<{ components: Array<{ content?: string; components?: Array<{ label: string; url: string; style: number }> }> }>;
	assert.equal(
		container?.components[0]?.content,
		'### Examen · Exam Rank 02 · Exam Rank 03\n<t:1792490400:F> – <t:1792501200:t> (<t:1792490400:R>)\nParis',
	);
	assert.deepEqual(container?.components[1]?.components?.[0], { type: 2, style: 5, label: "S'inscrire sur l'intra", url: 'https://profile.intra.42.fr/' });
	const named = examMessage({ ...exam, projects: [], location: 'c1, c2' }, 'Paris', 'en-US') as typeof container[];
	assert.match(named[0]?.components[0]?.content ?? '', /^### Exam · Exam Stud\n.*\nc1, c2$/);
});

test('logtime splits sessions at local midnights and counts an open one up to now', () => {
	assert.equal(localMidnight(2026, 10, 1, 'Europe/Paris').toISOString(), '2026-09-30T22:00:00.000Z');
	assert.equal(localMidnight(2026, 1, 1, 'Europe/Paris').toISOString(), '2025-12-31T23:00:00.000Z');
	const now = new Date('2026-10-15T12:00:00Z'); // a Thursday
	const periods = periodsFor(undefined, 'Europe/Paris', now);
	assert.equal(periods.month.from.toISOString(), '2026-09-30T22:00:00.000Z');
	assert.equal(periods.week?.from.toISOString(), '2026-10-11T22:00:00.000Z');
	assert.equal(periods.today?.from.toISOString(), '2026-10-14T22:00:00.000Z');
	assert.equal(periodsFor('2026-09', 'Europe/Paris', now).week, undefined);

	const sessions = [
		{ begin_at: '2026-09-30T20:00:00Z', end_at: '2026-09-30T23:00:00Z' }, // one hour falls in October
		{ begin_at: '2026-10-15T10:00:00Z', end_at: null }, // still open: two hours so far
	];
	assert.equal(timeIn(sessions, periods.month, now), 3 * 3600_000);
	assert.equal(timeIn(sessions, periods.today!, now), 2 * 3600_000);
	assert.equal(formatDuration(3 * 3600_000 + 5 * 60_000), '3 h 05');
});

test('a reminder is due once per deadline, within the days asked for', () => {
	const now = new Date('2026-10-15T00:00:00Z');
	const deadline = new Date('2026-10-20T00:00:00Z');
	assert.equal(reminderDue(deadline, 7, null, now), true);
	assert.equal(reminderDue(deadline, 3, null, now), false);
	assert.equal(reminderDue(deadline, 7, deadline, now), false, 'already reminded about this one');
	assert.equal(reminderDue(deadline, 7, new Date('2026-10-01T00:00:00Z'), now), true, 'a new deadline');
	assert.equal(reminderDue(null, 7, null, now), false);
	assert.equal(deadlineOf(cadet, now)?.toISOString(), '2026-10-18T06:42:00.000Z');
	assert.equal(deadlineOf(cadet, new Date('2026-11-01T00:00:00Z')), null, 'a passed deadline is no reminder');
});

test('Linked Roles show the floored main level, validated projects and student status', () => {
	assert.deepEqual(connectionOf(cadet), {
		platform_name: '42',
		platform_username: 'jdoe',
		metadata: { level: '4', projects: '1', student: '1' },
	});
	assert.equal(connectionOf({ ...cadet, 'alumni?': true }).metadata.student, '0');
});

test('a sealed token opens back, and an altered one does not', () => {
	process.env.STATE_SECRET ??= 'x'.repeat(32);
	const sealed = seal('refresh-token');
	assert.equal(unseal(sealed), 'refresh-token');
	assert.notDeepEqual(seal('refresh-token'), sealed, 'a fresh nonce each time');
	sealed[sealed.length - 1]! ^= 1;
	assert.throws(() => unseal(sealed));
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

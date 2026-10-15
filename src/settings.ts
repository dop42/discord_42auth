import {
	MAX_ROLE_RULES,
	NICKNAME_MODES,
	RULE_KINDS,
	type GuildSettings,
	type NicknameMode,
	type RoleRule,
	type RuleKind,
} from '../shared/api';
import { db } from './db/pool';
import { SNOWFLAKE } from './discord/types';

export type { GuildSettings as Settings };

/** What a server with no saved settings does: nothing, until a role is chosen. */
export const DEFAULTS: GuildSettings = {
	roleId: null,
	campus: null,
	studentsOnly: true,
	nickname: 'login',
	logChannelId: null,
	roleRules: [],
	helpers: false,
};

const CAMPUS_MAX = 64;

interface Row {
	role_id: string | null;
	campus: string | null;
	students_only: boolean;
	nickname_mode: NicknameMode;
	log_channel_id: string | null;
	role_rules: RoleRule[];
	helpers: boolean;
}

/** Reads what one server does, or the defaults when it was never configured. */
export async function getSettings(guildId: string): Promise<GuildSettings> {
	const { rows } = await db().query<Row>(
		`SELECT role_id, campus, students_only, nickname_mode, log_channel_id, role_rules, helpers
		 FROM guilds WHERE guild_id = $1`,
		[guildId],
	);
	const row = rows[0];
	if (!row) return { ...DEFAULTS };
	return {
		roleId: row.role_id,
		campus: row.campus,
		studentsOnly: row.students_only,
		nickname: row.nickname_mode,
		logChannelId: row.log_channel_id,
		roleRules: row.role_rules,
		helpers: row.helpers,
	};
}

/** Creates or replaces the settings of one server. */
export async function saveSettings(guildId: string, settings: GuildSettings): Promise<void> {
	await db().query(
		`INSERT INTO guilds
			(guild_id, role_id, campus, students_only, nickname_mode, log_channel_id, role_rules, helpers)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 ON CONFLICT (guild_id) DO UPDATE SET
			role_id = $2, campus = $3, students_only = $4, nickname_mode = $5,
			log_channel_id = $6, role_rules = $7, helpers = $8, updated_at = now()`,
		[
			guildId,
			settings.roleId,
			settings.campus,
			settings.studentsOnly,
			settings.nickname,
			settings.logChannelId,
			JSON.stringify(settings.roleRules),
			settings.helpers,
		],
	);
}

/**
 * Erases everything kept about one server: its settings and every link made there.
 * @remarks Used when an admin asks for it from the dashboard and when the sweeper finds the
 * bot was removed. The links go with the row through `ON DELETE CASCADE`.
 */
export async function deleteGuild(guildId: string): Promise<void> {
	await db().query('DELETE FROM guilds WHERE guild_id = $1', [guildId]);
}

/** Result of `parseSettings`: the settings, or the first field refused. */
export type Parsed =
	| { ok: true; settings: GuildSettings }
	| { ok: false; field: keyof GuildSettings; index?: number };

/**
 * Validates settings sent by the dashboard, shape only.
 * @remarks Whether the role and the channel exist in the server is checked by the caller,
 * which has the server's lists at hand. Ids end up interpolated into REST paths, so anything
 * but a bare snowflake is refused here. A blank campus means "any".
 */
export function parseSettings(body: unknown): Parsed {
	if (typeof body !== 'object' || body === null) return { ok: false, field: 'roleId' };
	const input = body as Record<string, unknown>;

	const id = (value: unknown) =>
		value === null || (typeof value === 'string' && SNOWFLAKE.test(value));

	if (!id(input.roleId)) return { ok: false, field: 'roleId' };
	if (!id(input.logChannelId)) return { ok: false, field: 'logChannelId' };
	if (typeof input.studentsOnly !== 'boolean') return { ok: false, field: 'studentsOnly' };
	if (typeof input.helpers !== 'boolean') return { ok: false, field: 'helpers' };
	if (!NICKNAME_MODES.includes(input.nickname as NicknameMode)) {
		return { ok: false, field: 'nickname' };
	}

	let campus: string | null = null;
	if (input.campus !== null) {
		if (typeof input.campus !== 'string') return { ok: false, field: 'campus' };
		const trimmed = input.campus.trim();
		if ([...trimmed].length > CAMPUS_MAX) return { ok: false, field: 'campus' };
		campus = trimmed || null;
	}

	if (!Array.isArray(input.roleRules) || input.roleRules.length > MAX_ROLE_RULES) {
		return { ok: false, field: 'roleRules' };
	}
	const roleRules: RoleRule[] = [];
	for (const [index, rule] of (input.roleRules as unknown[]).entries()) {
		const parsed = parseRule(rule);
		if (!parsed) return { ok: false, field: 'roleRules', index };
		roleRules.push(parsed);
	}

	return {
		ok: true,
		settings: {
			roleId: input.roleId as string | null,
			campus,
			studentsOnly: input.studentsOnly,
			nickname: input.nickname as NicknameMode,
			logChannelId: input.logChannelId as string | null,
			roleRules,
			helpers: input.helpers,
		},
	};
}

/** A level as the intra counts them: 0 to 99, with at most two decimals. */
const LEVEL = /^\d{1,2}(\.\d{1,2})?$/;
/** A piscine year, or a year and a month: `2025`, `2025-07`. */
const POOL = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

/**
 * Validates one role rule, or returns null.
 * @remarks A level is stored normalized (`07.50` becomes `7.5`), so the `/config` card shows
 * what the comparison actually uses.
 */
function parseRule(value: unknown): RoleRule | null {
	if (typeof value !== 'object' || value === null) return null;
	const { kind, value: text, roleId } = value as Record<string, unknown>;
	if (!RULE_KINDS.includes(kind as RuleKind)) return null;
	if (typeof roleId !== 'string' || !SNOWFLAKE.test(roleId)) return null;
	if (typeof text !== 'string') return null;
	const trimmed = text.trim();
	if (!trimmed || [...trimmed].length > CAMPUS_MAX) return null;

	switch (kind as RuleKind) {
		case 'level':
			return LEVEL.test(trimmed) ? { kind: 'level', value: String(Number(trimmed)), roleId } : null;
		case 'pool':
			return POOL.test(trimmed) ? { kind: 'pool', value: trimmed, roleId } : null;
		default:
			return { kind: kind as RuleKind, value: trimmed, roleId };
	}
}

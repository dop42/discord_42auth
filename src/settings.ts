import {
	AUTOMOD_KEYWORD_MAX,
	MAX_AUTOMOD_KEYWORDS,
	MAX_MENTION_LIMIT,
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
	fameChannelId: null,
	syncEvents: false,
	syncExams: false,
	counterChannelId: null,
	automodSpam: false,
	automodMentions: null,
	automodLanguage: false,
	automodKeywords: [],
	automodAlertChannelId: null,
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
	fame_channel_id: string | null;
	sync_events: boolean;
	sync_exams: boolean;
	counter_channel_id: string | null;
	automod_spam: boolean;
	automod_mentions: number | null;
	automod_language: boolean;
	automod_keywords: string[];
	automod_alert_channel_id: string | null;
}

/** Reads what one server does, or the defaults when it was never configured. */
export async function getSettings(guildId: string): Promise<GuildSettings> {
	const { rows } = await db().query<Row>(
		`SELECT role_id, campus, students_only, nickname_mode, log_channel_id, role_rules, helpers,
			fame_channel_id, sync_events, sync_exams, counter_channel_id, automod_spam, automod_mentions,
			automod_language, automod_keywords, automod_alert_channel_id
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
		fameChannelId: row.fame_channel_id,
		syncEvents: row.sync_events,
		syncExams: row.sync_exams,
		counterChannelId: row.counter_channel_id,
		automodSpam: row.automod_spam,
		automodMentions: row.automod_mentions,
		automodLanguage: row.automod_language,
		automodKeywords: row.automod_keywords,
		automodAlertChannelId: row.automod_alert_channel_id,
	};
}

/** Creates or replaces the settings of one server. */
export async function saveSettings(guildId: string, settings: GuildSettings): Promise<void> {
	await db().query(
		`INSERT INTO guilds
			(guild_id, role_id, campus, students_only, nickname_mode, log_channel_id, role_rules, helpers,
			 fame_channel_id, sync_events, sync_exams, counter_channel_id, automod_spam, automod_mentions,
			 automod_language, automod_keywords, automod_alert_channel_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		 ON CONFLICT (guild_id) DO UPDATE SET
			role_id = $2, campus = $3, students_only = $4, nickname_mode = $5,
			log_channel_id = $6, role_rules = $7, helpers = $8,
			-- A channel newly chosen starts from now, not from whatever was missed before.
			fame_checked_at = CASE WHEN guilds.fame_channel_id IS DISTINCT FROM $9 THEN NULL ELSE guilds.fame_checked_at END,
			fame_channel_id = $9, sync_events = $10, sync_exams = $11, counter_channel_id = $12,
			automod_spam = $13, automod_mentions = $14, automod_language = $15, automod_keywords = $16,
			automod_alert_channel_id = $17, updated_at = now()`,
		[
			guildId,
			settings.roleId,
			settings.campus,
			settings.studentsOnly,
			settings.nickname,
			settings.logChannelId,
			JSON.stringify(settings.roleRules),
			settings.helpers,
			settings.fameChannelId,
			settings.syncEvents,
			settings.syncExams,
			settings.counterChannelId,
			settings.automodSpam,
			settings.automodMentions,
			settings.automodLanguage,
			settings.automodKeywords,
			settings.automodAlertChannelId,
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
	if (!id(input.fameChannelId)) return { ok: false, field: 'fameChannelId' };
	if (typeof input.syncEvents !== 'boolean') return { ok: false, field: 'syncEvents' };
	if (typeof input.syncExams !== 'boolean') return { ok: false, field: 'syncExams' };
	if (!id(input.counterChannelId)) return { ok: false, field: 'counterChannelId' };
	if (typeof input.automodSpam !== 'boolean') return { ok: false, field: 'automodSpam' };
	if (
		input.automodMentions !== null &&
		!(
			Number.isInteger(input.automodMentions) &&
			(input.automodMentions as number) >= 1 &&
			(input.automodMentions as number) <= MAX_MENTION_LIMIT
		)
	) {
		return { ok: false, field: 'automodMentions' };
	}
	if (typeof input.automodLanguage !== 'boolean') return { ok: false, field: 'automodLanguage' };
	if (!id(input.automodAlertChannelId)) return { ok: false, field: 'automodAlertChannelId' };
	const keywords = parseKeywords(input.automodKeywords);
	if (!keywords) return { ok: false, field: 'automodKeywords' };
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
			fameChannelId: input.fameChannelId as string | null,
			syncEvents: input.syncEvents,
			syncExams: input.syncExams,
			counterChannelId: input.counterChannelId as string | null,
			automodSpam: input.automodSpam,
			automodMentions: input.automodMentions as number | null,
			automodLanguage: input.automodLanguage,
			automodKeywords: keywords,
			automodAlertChannelId: input.automodAlertChannelId as string | null,
		},
	};
}

/**
 * Validates the words of the custom AutoMod filter, or returns null.
 * @remarks Blank lines are dropped and a word given twice, whatever its case, is kept once:
 * the dashboard sends the text area line by line.
 */
function parseKeywords(value: unknown): string[] | null {
	if (!Array.isArray(value) || value.length > MAX_AUTOMOD_KEYWORDS) return null;
	const words = new Map<string, string>();
	for (const word of value as unknown[]) {
		if (typeof word !== 'string') return null;
		const trimmed = word.trim();
		if (!trimmed) continue;
		if ([...trimmed].length > AUTOMOD_KEYWORD_MAX) return null;
		if (!words.has(trimmed.toLowerCase())) words.set(trimmed.toLowerCase(), trimmed);
	}
	return [...words.values()];
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

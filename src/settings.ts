import { NICKNAME_MODES, type GuildSettings, type NicknameMode } from '../shared/api';
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
};

const CAMPUS_MAX = 64;

interface Row {
	role_id: string | null;
	campus: string | null;
	students_only: boolean;
	nickname_mode: NicknameMode;
	log_channel_id: string | null;
}

/**
 * @author dop42
 * @method getSettings
 * @description Reads what one server does, or the defaults when it was never configured.
 * @param guildId {string}
 * @returns {Promise<GuildSettings>}
 */
export async function getSettings(guildId: string): Promise<GuildSettings> {
	const { rows } = await db().query<Row>(
		'SELECT role_id, campus, students_only, nickname_mode, log_channel_id FROM guilds WHERE guild_id = $1',
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
	};
}

/**
 * @author dop42
 * @method saveSettings
 * @description Creates or replaces the settings of one server.
 * @param guildId {string}
 * @param settings {GuildSettings}
 * @returns {Promise<void>}
 */
export async function saveSettings(guildId: string, settings: GuildSettings): Promise<void> {
	await db().query(
		`INSERT INTO guilds (guild_id, role_id, campus, students_only, nickname_mode, log_channel_id)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (guild_id) DO UPDATE SET
			role_id = $2, campus = $3, students_only = $4, nickname_mode = $5,
			log_channel_id = $6, updated_at = now()`,
		[
			guildId,
			settings.roleId,
			settings.campus,
			settings.studentsOnly,
			settings.nickname,
			settings.logChannelId,
		],
	);
}

/**
 * @author dop42
 * @method deleteGuild
 * @description Erases everything kept about one server: its settings and every link made there.
 * @remarks Used when an admin asks for it from the dashboard and when the sweeper finds the
 * bot was removed. The links go with the row through `ON DELETE CASCADE`.
 * @param guildId {string}
 * @returns {Promise<void>}
 */
export async function deleteGuild(guildId: string): Promise<void> {
	await db().query('DELETE FROM guilds WHERE guild_id = $1', [guildId]);
}

/** Result of `parseSettings`: the settings, or the first field refused. */
export type Parsed =
	| { ok: true; settings: GuildSettings }
	| { ok: false; field: keyof GuildSettings };

/**
 * @author dop42
 * @method parseSettings
 * @description Validates settings sent by the dashboard, shape only.
 * @remarks Whether the role and the channel exist in the server is checked by the caller,
 * which has the server's lists at hand. Ids end up interpolated into REST paths, so anything
 * but a bare snowflake is refused here. A blank campus means "any".
 * @param body {unknown}
 * @returns {Parsed}
 */
export function parseSettings(body: unknown): Parsed {
	if (typeof body !== 'object' || body === null) return { ok: false, field: 'roleId' };
	const input = body as Record<string, unknown>;

	const id = (value: unknown) =>
		value === null || (typeof value === 'string' && SNOWFLAKE.test(value));

	if (!id(input.roleId)) return { ok: false, field: 'roleId' };
	if (!id(input.logChannelId)) return { ok: false, field: 'logChannelId' };
	if (typeof input.studentsOnly !== 'boolean') return { ok: false, field: 'studentsOnly' };
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

	return {
		ok: true,
		settings: {
			roleId: input.roleId as string | null,
			campus,
			studentsOnly: input.studentsOnly,
			nickname: input.nickname as NicknameMode,
			logChannelId: input.logChannelId as string | null,
		},
	};
}

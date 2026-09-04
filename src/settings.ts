import { SNOWFLAKE } from './discord/types';

const MODES = ['off', 'login', 'full'] as const;

/** `off` leaves the nickname alone, `login` sets the intra login, `full` sets "Full Name (login)". */
type NicknameMode = (typeof MODES)[number];

export interface Settings {
	/** Role granted once the 42 account is verified. Without it `/auth` is disabled. */
	roleId?: string;
	/** Campus name as it appears on the intra, compared case-insensitively. Undefined means any. */
	campus?: string;
	/** Refuse alumni. Closed accounts are refused regardless of this. */
	studentsOnly: boolean;
	/** How the Discord nickname is rewritten after a successful auth. */
	nickname: NicknameMode;
	/** Channel receiving one audit message per refusal and per granted role. */
	logChannelId?: string;
}

/**
 * @author dop42
 * @method optional
 * @description Reads an optional variable, treating blank as unset.
 * @param name {string}
 * @returns {string | undefined}
 */
const optional = (name: string) => process.env[name]?.trim() || undefined;

/**
 * @author dop42
 * @method snowflake
 * @description Reads an optional Discord id, refusing anything that is not one.
 * @remarks These end up interpolated into REST paths, so a pasted `<@&123>` would otherwise
 * produce a confusing 404 on the first real authentication. Settings are read per request,
 * not at boot, so the complaint surfaces on the first command rather than at deploy time.
 * @param name {string}
 * @returns {string | undefined}
 * @throws {Error}
 */
function snowflake(name: string): string | undefined {
	const value = optional(name);
	if (value && !SNOWFLAKE.test(value)) {
		throw new Error(`${name} must be a Discord id: 17 to 20 digits, nothing else.`);
	}
	return value;
}

/**
 * @author dop42
 * @method getSettings
 * @description Reads what this deployment does from its environment variables.
 * @remarks One deployment serves one Discord server, so settings live next to the
 * credentials on Vercel rather than in a database. Changing one needs a redeploy.
 * @returns {Settings}
 * @throws {Error}
 */
export function getSettings(): Settings {
	const nickname = optional('NICKNAME_MODE') ?? 'login';
	if (!MODES.includes(nickname as NicknameMode)) {
		throw new Error(`NICKNAME_MODE must be one of: ${MODES.join(', ')}`);
	}

	return {
		roleId: snowflake('ROLE_ID'),
		campus: optional('FT_CAMPUS'),
		// Anything but an explicit "false" keeps the check on.
		studentsOnly: optional('STUDENTS_ONLY') !== 'false',
		nickname: nickname as NicknameMode,
		logChannelId: snowflake('LOG_CHANNEL_ID'),
	};
}

const FT_API = 'https://api.intra.42.fr';

/** The fields of `/v2/me` this bot reads. The full profile is received; nothing else is kept. */
export interface FtUser {
	login: string;
	usual_full_name: string;
	/** False once the account is closed or deactivated. */
	'active?': boolean;
	/** True once the student has graduated; alumni keep an active account. */
	'alumni?': boolean;
	/** Staff skip the student and campus rules in `checkEligibility`. */
	'staff?': boolean;
	/** Every campus the account was ever attached to, not only the current one. */
	campus: Array<{ id: number; name: string }>;
	/** Links into `campus`; the one flagged `is_primary` is the current campus. */
	campus_users: Array<{ campus_id: number; is_primary: boolean }>;
}

/**
 * @author dop42
 * @method fetchMe
 * @description Fetches the profile of the user who just completed the OAuth flow.
 * @param accessToken {string}
 * @returns {Promise<FtUser>}
 * @throws {Error}
 */
export async function fetchMe(accessToken: string): Promise<FtUser> {
	const response = await fetch(`${FT_API}/v2/me`, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!response.ok) throw new Error(`42 API /v2/me failed with ${response.status}`);
	return (await response.json()) as FtUser;
}

/**
 * @author dop42
 * @method primaryCampus
 * @description Returns the campus flagged primary, or undefined when none is.
 * @remarks `user.campus` also lists every campus the account ever passed through — piscine,
 * exchange, transfer — so the campus check and the audit log both go through this one
 * function to make sure they can never disagree. Returning undefined rather than guessing
 * the first entry keeps an account with no primary link from being judged on its piscine
 * campus; `checkEligibility` then refuses it whenever a campus is configured.
 * @param user {FtUser}
 * @returns {{ id: number; name: string } | undefined}
 */
export function primaryCampus(user: FtUser): { id: number; name: string } | undefined {
	const link = user.campus_users.find((entry) => entry.is_primary);
	if (!link) return undefined;
	return user.campus.find((campus) => campus.id === link.campus_id);
}

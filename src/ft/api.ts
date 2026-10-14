import { env } from '../env';

const FT_API = 'https://api.intra.42.fr';

/** The fields of a 42 profile this bot reads. The full profile is received; nothing else is kept. */
export interface FtUser {
	/** Stable numeric id; a login can be renamed, this cannot. */
	id: number;
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
	/** Every cursus ever joined; one whose `end_at` is past is over (a finished piscine). */
	cursus_users?: Array<{ end_at: string | null; cursus: { name: string; slug: string } }>;
}

/** A coalition the user belongs to. */
export interface FtCoalition {
	name: string;
	slug: string;
}

/** Raised when the intranet answers something other than a success or a "not found". */
export class FtError extends Error {
	constructor(readonly status: number) {
		super(`42 API answered ${status}`);
	}
}

/**
 * Who is waiting for the API. A member in the middle of a verification goes before the
 * weekly re-checks, so a busy sweeper never makes anyone wait at the 42 login.
 */
export type Priority = 'interactive' | 'background';

/**
 * Time between two calls. The default 42 application allows 2 per second; a little margin
 * keeps a burst of verifications from ever reaching it. `FT_SPACING_MS` exists for the tests.
 */
const spacing = () => Number(process.env.FT_SPACING_MS ?? 550);

const lanes: Record<Priority, Array<() => void>> = { interactive: [], background: [] };
let nextSlot = 0;
let pumping = false;

/**
 * @author dop42
 * @method pump
 * @description Hands out the call slots, one every `spacing()` ms, interactive lane first.
 * @returns {Promise<void>}
 */
async function pump(): Promise<void> {
	if (pumping) return;
	pumping = true;
	for (;;) {
		const release = lanes.interactive.shift() ?? lanes.background.shift();
		if (!release) break;
		const wait = nextSlot - Date.now();
		if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
		nextSlot = Date.now() + spacing();
		release();
	}
	pumping = false;
}

/**
 * @author dop42
 * @method ftFetch
 * @description Calls the 42 API through the shared rate limiter.
 * @remarks Every call of the process goes through here, so the limit holds however many
 * verifications arrive at once. A 429 is retried once, after the delay 42 asks for.
 * @param path {string} absolute URL or path under the API
 * @param init {RequestInit}
 * @param priority {Priority}
 * @returns {Promise<Response>}
 */
export async function ftFetch(
	path: string,
	init: RequestInit = {},
	priority: Priority = 'interactive',
): Promise<Response> {
	const url = path.startsWith('https://') ? path : `${FT_API}${path}`;
	for (let attempt = 0; ; attempt++) {
		await new Promise<void>((resolve) => {
			lanes[priority].push(resolve);
			void pump();
		});
		const response = await fetch(url, init);
		if (response.status !== 429 || attempt > 0) return response;
		const wait = Math.min(Number(response.headers.get('retry-after')) || 1, 5);
		nextSlot = Math.max(nextSlot, Date.now() + wait * 1000);
	}
}

/**
 * @author dop42
 * @method fetchMe
 * @description Fetches the profile of the user who just completed the OAuth flow.
 * @param accessToken {string}
 * @returns {Promise<FtUser>}
 * @throws {FtError}
 */
export async function fetchMe(accessToken: string): Promise<FtUser> {
	const response = await ftFetch('/v2/me', { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!response.ok) throw new FtError(response.status);
	return (await response.json()) as FtUser;
}

/**
 * @author dop42
 * @method fetchCoalitions
 * @description Lists the coalitions of a user, with the member's token or the app's.
 * @remarks Only called when the server has a coalition rule: it is one more call per
 * verification.
 * @param userId {number}
 * @param accessToken {string}
 * @param priority {Priority}
 * @returns {Promise<FtCoalition[]>}
 * @throws {FtError}
 */
export async function fetchCoalitions(
	userId: number,
	accessToken: string,
	priority: Priority = 'interactive',
): Promise<FtCoalition[]> {
	const response = await ftFetch(
		`/v2/users/${userId}/coalitions`,
		{ headers: { Authorization: `Bearer ${accessToken}` } },
		priority,
	);
	if (!response.ok) throw new FtError(response.status);
	return (await response.json()) as FtCoalition[];
}

let appToken: { value: string; expiresAt: number } | undefined;

/**
 * @author dop42
 * @method fetchAppToken
 * @description Returns a client-credentials token of the 42 application, cached until it expires.
 * @remarks Used by the weekly re-checks, which run with no member around to log in. It reads
 * public profiles only, the same `public` scope the members granted.
 * @returns {Promise<string>}
 * @throws {FtError}
 */
export async function fetchAppToken(): Promise<string> {
	if (appToken && appToken.expiresAt > Date.now() + 60_000) return appToken.value;
	const response = await ftFetch(
		'/oauth/token',
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: env.ftClientId,
				client_secret: env.ftClientSecret,
				scope: 'public',
			}),
		},
		'background',
	);
	if (!response.ok) throw new FtError(response.status);
	const { access_token, expires_in } = (await response.json()) as {
		access_token: string;
		expires_in: number;
	};
	appToken = { value: access_token, expiresAt: Date.now() + expires_in * 1000 };
	return access_token;
}

/**
 * @author dop42
 * @method fetchUser
 * @description Looks a 42 account up again by id, for the weekly re-check.
 * @param userId {number}
 * @param accessToken {string} the application token
 * @returns {Promise<FtUser | null>} null when the account no longer exists
 * @throws {FtError}
 */
export async function fetchUser(userId: number, accessToken: string): Promise<FtUser | null> {
	const response = await ftFetch(
		`/v2/users/${userId}`,
		{ headers: { Authorization: `Bearer ${accessToken}` } },
		'background',
	);
	if (response.status === 404) return null;
	if (!response.ok) throw new FtError(response.status);
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

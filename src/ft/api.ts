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
	cursus_users?: FtCursusUser[];
	/** Every project ever registered to, validated or not, piscine ones included. */
	projects_users?: FtProjectUser[];
	/** Lowercase English month of the piscine, e.g. `july`; null for an account with none. */
	pool_month?: string | null;
	/** Year of the piscine as a string, e.g. `2025`. */
	pool_year?: string | null;
	/** Host the student is logged in on right now, e.g. `c1r2p3`; null off campus. */
	location?: string | null;
	image?: { link: string | null; versions?: { medium?: string | null } };
	correction_point?: number;
	wallet?: number;
}

export interface FtCursusUser {
	end_at: string | null;
	/** Absent from older fixtures; the intra always sends it. */
	level?: number;
	/** `Pisciner`, `Cadet`, `Member`…, or null. */
	grade?: string | null;
	/** Deadline in the main cursus; null when the campus does not use one. */
	blackholed_at?: string | null;
	/** `kind` is `main` for the 42cursus, `piscine` for a piscine. */
	cursus: { name: string; slug: string; kind?: string };
}

export interface FtProjectUser {
	status: string;
	/** Null until the project is marked. */
	'validated?': boolean | null;
	final_mark: number | null;
	project: { name: string; slug: string };
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

/** Longest wait for one 42 call: a hung connection must not hold a request or the sweeper forever. */
const TIMEOUT_MS = 10_000;

const lanes: Record<Priority, Array<() => void>> = { interactive: [], background: [] };
let nextSlot = 0;
let pumping = false;

/** Hands out the call slots, one every `spacing()` ms, interactive lane first. */
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
 * Calls the 42 API through the shared rate limiter.
 * @remarks Every call of the process goes through here, so the limit holds however many
 * verifications arrive at once. A 429 is retried once, after the delay 42 asks for.
 * @param path absolute URL or path under the API
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
		const response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
		if (response.status !== 429 || attempt > 0) return response;
		const wait = Math.min(Number(response.headers.get('retry-after')) || 1, 5);
		nextSlot = Math.max(nextSlot, Date.now() + wait * 1000);
	}
}

/**
 * Fetches the profile of the user who just completed the OAuth flow.
 * @throws {FtError}
 */
export async function fetchMe(accessToken: string): Promise<FtUser> {
	const response = await ftFetch('/v2/me', { headers: { Authorization: `Bearer ${accessToken}` } });
	if (!response.ok) throw new FtError(response.status);
	return (await response.json()) as FtUser;
}

/**
 * Lists the coalitions of a user, with the member's token or the app's.
 * @remarks Only called when the server has a coalition rule: it is one more call per
 * verification.
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
 * Returns a client-credentials token of the 42 application, cached until it expires.
 * @remarks Used by the weekly re-checks and `/profile`, which run with no member around to
 * log in. It reads public profiles only, the same `public` scope the members granted.
 * @throws {FtError}
 */
export async function fetchAppToken(priority: Priority = 'background'): Promise<string> {
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
		priority,
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
 * Looks a 42 account up again by id, for the weekly re-check or `/profile`.
 * @param accessToken the application token
 * @returns null when the account no longer exists
 * @throws {FtError}
 */
export async function fetchUser(
	userId: number,
	accessToken: string,
	priority: Priority = 'background',
): Promise<FtUser | null> {
	const response = await ftFetch(
		`/v2/users/${userId}`,
		{ headers: { Authorization: `Bearer ${accessToken}` } },
		priority,
	);
	if (response.status === 404) return null;
	if (!response.ok) throw new FtError(response.status);
	return (await response.json()) as FtUser;
}

/**
 * Returns the campus flagged primary, or undefined when none is.
 * @remarks `user.campus` also lists every campus the account ever passed through — piscine,
 * exchange, transfer — so the campus check and the audit log both go through this one
 * function to make sure they can never disagree. Returning undefined rather than guessing
 * the first entry keeps an account with no primary link from being judged on its piscine
 * campus; `checkEligibility` then refuses it whenever a campus is configured.
 */
export function primaryCampus(user: FtUser): { id: number; name: string } | undefined {
	const link = user.campus_users.find((entry) => entry.is_primary);
	if (!link) return undefined;
	return user.campus.find((campus) => campus.id === link.campus_id);
}

/** Largest page the 42 API serves. */
const PAGE_SIZE = 100;

/**
 * Reads every page of a list endpoint.
 * @param path a list route with its filters, without paging
 * @throws {FtError}
 */
async function fetchAll<T>(path: string, accessToken: string): Promise<T[]> {
	const items: T[] = [];
	for (let page = 1; ; page++) {
		const separator = path.includes('?') ? '&' : '?';
		const response = await ftFetch(
			`${path}${separator}page[size]=${PAGE_SIZE}&page[number]=${page}`,
			{ headers: { Authorization: `Bearer ${accessToken}` } },
		);
		if (!response.ok) throw new FtError(response.status);
		const batch = (await response.json()) as T[];
		items.push(...batch);
		if (batch.length < PAGE_SIZE) return items;
	}
}

/** Someone logged in on a campus computer right now. */
export interface FtLocation {
	/** The seat, e.g. `c1r2p3`. */
	host: string;
	user: { id: number; login: string };
}

/**
 * Lists who is logged in on a campus right now.
 * @remarks One call per hundred people on campus, whatever the number of servers asking.
 * @throws {FtError}
 */
export function fetchCampusLocations(campusId: number, accessToken: string): Promise<FtLocation[]> {
	return fetchAll<FtLocation>(`/v2/campus/${campusId}/locations?filter[active]=true`, accessToken);
}

export interface FtProject {
	name: string;
	slug: string;
}

/**
 * Looks a project up by its slug.
 * @returns null when the intra knows no such project
 * @throws {FtError}
 */
export async function fetchProject(slug: string, accessToken: string): Promise<FtProject | null> {
	const response = await ftFetch(`/v2/projects/${encodeURIComponent(slug)}`, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (response.status === 404) return null;
	if (!response.ok) throw new FtError(response.status);
	const { name } = (await response.json()) as FtProject;
	return { name, slug };
}

/** One account's registration to a project, as `fetchValidations` lists them. */
export interface FtProjectUserOf extends Omit<FtProjectUser, 'project'> {
	user: { id: number; login: string };
}

/**
 * Returns which of the given accounts validated a project, with their best mark.
 * @remarks The intra filters by many users in one call; it refuses a filter on `validated`,
 * so that part is done here. A project retried keeps one entry per occurrence, hence the
 * best mark per account. Asked by chunks of a hundred ids, the page size.
 * @returns the mark of each account that validated it, by account id
 * @throws {FtError}
 */
export async function fetchValidations(
	slug: string,
	userIds: number[],
	accessToken: string,
): Promise<Map<number, number>> {
	const marks = new Map<number, number>();
	for (let start = 0; start < userIds.length; start += PAGE_SIZE) {
		const ids = userIds.slice(start, start + PAGE_SIZE).join(',');
		const entries = await fetchAll<FtProjectUserOf>(
			`/v2/projects/${encodeURIComponent(slug)}/projects_users?filter[user_id]=${ids}`,
			accessToken,
		);
		for (const entry of entries) {
			if (entry['validated?'] !== true) continue;
			marks.set(entry.user.id, Math.max(marks.get(entry.user.id) ?? 0, entry.final_mark ?? 0));
		}
	}
	return marks;
}

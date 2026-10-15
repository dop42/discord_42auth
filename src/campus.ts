import { TtlCache } from './cache';
import { fetchAppToken, fetchCampusByName, fetchCampusLocations, type FtLocation, type Priority } from './ft/api';

/** Who sits where changes by the minute; two of them keep a busy campus to a few calls. */
const locations = new TtlCache<number, FtLocation[]>(2 * 60_000);
/** A campus's id and time zone change about never. */
const campuses = new TtlCache<string, { id: number; name: string; time_zone: string } | null>(
	24 * 60 * 60_000,
);

/**
 * Returns who is logged in on a campus right now.
 * @remarks Shared by `/helpers` and the counter of every server on that campus, so the cost
 * is per campus and per two minutes, never per server.
 * @throws {FtError}
 */
export async function campusLocations(campusId: number, priority: Priority): Promise<FtLocation[]> {
	return locations.get(campusId, async () =>
		fetchCampusLocations(campusId, await fetchAppToken(priority), priority),
	);
}

/**
 * Resolves the campus a server is set to, by the name its admins typed.
 * @returns null when the intra has no campus by that name
 * @throws {FtError}
 */
export function campusNamed(name: string): Promise<{ id: number; name: string; time_zone: string } | null> {
	return campuses.get(name.toLowerCase(), async () =>
		fetchCampusByName(name, await fetchAppToken('background')),
	);
}

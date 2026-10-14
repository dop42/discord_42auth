import { createHash, randomBytes } from 'node:crypto';
import { db } from '../db/pool';
import { cookie, readCookie } from '../http';

export const SESSION_COOKIE = '__Host-session';

/** A dashboard login lasts a day; the sweeper deletes it once expired. */
const SESSION_SECONDS = 24 * 60 * 60;

export interface SessionGuild {
	id: string;
	name: string;
	icon: string | null;
}

export interface Session {
	userId: string;
	username: string;
	avatar: string | null;
	/** Servers the admin could manage when they logged in. Writes re-check through the bot. */
	guilds: SessionGuild[];
}

const hash = (token: string) => createHash('sha256').update(token).digest();

/**
 * @author dop42
 * @method createSession
 * @description Opens a dashboard session and returns the cookie that carries it.
 * @remarks The cookie holds 32 random bytes; the database holds only their hash.
 * @param session {Session}
 * @returns {Promise<string>} a Set-Cookie value
 */
export async function createSession(session: Session): Promise<string> {
	const token = randomBytes(32).toString('base64url');
	await db().query(
		`INSERT INTO sessions (token_hash, user_id, username, avatar, guilds, expires_at)
		 VALUES ($1, $2, $3, $4, $5, now() + make_interval(secs => $6))`,
		[
			hash(token),
			session.userId,
			session.username,
			session.avatar,
			JSON.stringify(session.guilds),
			SESSION_SECONDS,
		],
	);
	return cookie(SESSION_COOKIE, token, SESSION_SECONDS);
}

/**
 * @author dop42
 * @method readSession
 * @description Returns the session a request carries, or null when it has none or it expired.
 * @param request {Request}
 * @returns {Promise<Session | null>}
 */
export async function readSession(request: Request): Promise<Session | null> {
	const token = readCookie(request, SESSION_COOKIE);
	if (!token) return null;
	const { rows } = await db().query<{
		user_id: string;
		username: string;
		avatar: string | null;
		guilds: SessionGuild[];
	}>(
		'SELECT user_id, username, avatar, guilds FROM sessions WHERE token_hash = $1 AND expires_at > now()',
		[hash(token)],
	);
	const row = rows[0];
	return row
		? { userId: row.user_id, username: row.username, avatar: row.avatar, guilds: row.guilds }
		: null;
}

/**
 * @author dop42
 * @method endSession
 * @description Deletes the session a request carries and returns the cookie clearing it.
 * @param request {Request}
 * @returns {Promise<string>} a Set-Cookie value
 */
export async function endSession(request: Request): Promise<string> {
	const token = readCookie(request, SESSION_COOKIE);
	if (token) await db().query('DELETE FROM sessions WHERE token_hash = $1', [hash(token)]);
	return cookie(SESSION_COOKIE, '', 0);
}

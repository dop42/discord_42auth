import { db } from './db/pool';

export interface Link {
	guildId: string;
	userId: string;
	ftId: number;
	ftLogin: string;
}

/**
 * @author dop42
 * @method findByFtAccount
 * @description Returns the member a 42 account is linked to in one server, if any.
 * @param guildId {string}
 * @param ftId {number}
 * @returns {Promise<Link | undefined>}
 */
export async function findByFtAccount(guildId: string, ftId: number): Promise<Link | undefined> {
	const { rows } = await db().query<{ user_id: string; ft_login: string }>(
		'SELECT user_id, ft_login FROM links WHERE guild_id = $1 AND ft_id = $2',
		[guildId, ftId],
	);
	const row = rows[0];
	return row && { guildId, userId: row.user_id, ftId, ftLogin: row.ft_login };
}

/**
 * @author dop42
 * @method findByMember
 * @description Returns the 42 account a member is linked to in one server, if any.
 * @param guildId {string}
 * @param userId {string}
 * @returns {Promise<Link | undefined>}
 */
export async function findByMember(guildId: string, userId: string): Promise<Link | undefined> {
	const { rows } = await db().query<{ ft_id: number; ft_login: string }>(
		'SELECT ft_id, ft_login FROM links WHERE guild_id = $1 AND user_id = $2',
		[guildId, userId],
	);
	const row = rows[0];
	return row && { guildId, userId, ftId: row.ft_id, ftLogin: row.ft_login };
}

/**
 * @author dop42
 * @method saveLink
 * @description Records that a member proved a 42 account, replacing their previous link.
 * @remarks A member verifying again with another 42 account moves their link rather than
 * holding two. The `(guild_id, ft_id)` uniqueness is enforced by the database: the caller
 * must have released the 42 account from any other member first.
 * @param link {Link}
 * @returns {Promise<void>}
 */
export async function saveLink(link: Link): Promise<void> {
	await db().query(
		`INSERT INTO links (guild_id, user_id, ft_id, ft_login) VALUES ($1, $2, $3, $4)
		 ON CONFLICT (guild_id, user_id) DO UPDATE SET
			ft_id = $3, ft_login = $4, verified_at = now(), checked_at = now(), ft_checked_at = now()`,
		[link.guildId, link.userId, link.ftId, link.ftLogin],
	);
}

/**
 * @author dop42
 * @method deleteLink
 * @description Forgets one member's link in one server.
 * @param guildId {string}
 * @param userId {string}
 * @returns {Promise<boolean>} whether there was one
 */
export async function deleteLink(guildId: string, userId: string): Promise<boolean> {
	const { rowCount } = await db().query('DELETE FROM links WHERE guild_id = $1 AND user_id = $2', [
		guildId,
		userId,
	]);
	return (rowCount ?? 0) > 0;
}

/**
 * @author dop42
 * @method countLinks
 * @description Counts the members linked in one server, for the dashboard.
 * @param guildId {string}
 * @returns {Promise<number>}
 */
export async function countLinks(guildId: string): Promise<number> {
	const { rows } = await db().query<{ count: string }>(
		'SELECT count(*) FROM links WHERE guild_id = $1',
		[guildId],
	);
	return Number(rows[0]?.count ?? 0);
}

/** Members shown per page of the members tab. */
export const PAGE_SIZE = 50;

/**
 * @author dop42
 * @method listLinks
 * @description Lists the members linked in one server, newest first, for the members tab.
 * @remarks `query` matches anywhere in the 42 login, or a whole Discord id.
 * @param guildId {string}
 * @param query {string}
 * @param page {number} from 0
 * @returns {Promise<{ links: Array<Link & { verifiedAt: Date }>; total: number }>}
 */
export async function listLinks(
	guildId: string,
	query: string,
	page: number,
): Promise<{ links: Array<Link & { verifiedAt: Date }>; total: number }> {
	const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
	const { rows } = await db().query<{
		user_id: string;
		ft_id: number;
		ft_login: string;
		verified_at: Date;
		total: string;
	}>(
		`SELECT user_id, ft_id, ft_login, verified_at, count(*) OVER () AS total
		 FROM links
		 WHERE guild_id = $1 AND ($2 = '' OR ft_login ILIKE $3 OR user_id = $2)
		 ORDER BY verified_at DESC, user_id
		 LIMIT $4 OFFSET $5`,
		[guildId, query, pattern, PAGE_SIZE, page * PAGE_SIZE],
	);
	return {
		links: rows.map((row) => ({
			guildId,
			userId: row.user_id,
			ftId: row.ft_id,
			ftLogin: row.ft_login,
			verifiedAt: row.verified_at,
		})),
		total: rows.length ? Number(rows[0]!.total) : 0,
	};
}

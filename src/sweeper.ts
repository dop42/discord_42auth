import { db } from './db/pool';
import { botGuildIds, DiscordError, getMember } from './discord/rest';
import { deleteLink } from './links';
import { deleteGuild } from './settings';

/** How often the sweeper runs. */
const INTERVAL_MS = 60 * 60 * 1000;
/** Members checked per run; 500 an hour covers 12 000 links a day. */
const BATCH = 500;
/** Pause between two member checks, well under Discord's rate limits. */
const PAUSE_MS = 250;

const pause = () => new Promise((resolve) => setTimeout(resolve, PAUSE_MS));

/**
 * @author dop42
 * @method sweep
 * @description Deletes what the bot no longer has a reason to keep.
 * @remarks This is the retention policy, enforced. Expired dashboard sessions go first. Then
 * every server the bot was removed from loses its settings and links — only when Discord
 * returned the bot's full server list, never on a partial one. Last, the links least
 * recently checked are re-checked against the server: a member who left loses their link.
 * Only "Unknown Member" deletes; any other answer leaves the row for the next run, and a 429
 * ends the run early.
 * @returns {Promise<{ sessions: number; guilds: number; links: number }>} rows deleted
 */
export async function sweep(): Promise<{ sessions: number; guilds: number; links: number }> {
	const deleted = { sessions: 0, guilds: 0, links: 0 };

	const sessions = await db().query('DELETE FROM sessions WHERE expires_at < now()');
	deleted.sessions = sessions.rowCount ?? 0;

	const present = await botGuildIds();
	const { rows: known } = await db().query<{ guild_id: string }>('SELECT guild_id FROM guilds');
	for (const { guild_id } of known) {
		if (present.has(guild_id)) continue;
		await deleteGuild(guild_id);
		deleted.guilds++;
	}

	const { rows: links } = await db().query<{ guild_id: string; user_id: string }>(
		`SELECT guild_id, user_id FROM links
		 WHERE checked_at < now() - interval '1 day'
		 ORDER BY checked_at LIMIT $1`,
		[BATCH],
	);
	for (const { guild_id, user_id } of links) {
		try {
			if (await getMember(guild_id, user_id)) {
				await db().query(
					'UPDATE links SET checked_at = now() WHERE guild_id = $1 AND user_id = $2',
					[guild_id, user_id],
				);
			} else if (await deleteLink(guild_id, user_id)) {
				deleted.links++;
			}
		} catch (failure) {
			if (failure instanceof DiscordError && failure.status === 429) break;
		}
		await pause();
	}

	return deleted;
}

/**
 * @author dop42
 * @method startSweeper
 * @description Runs `sweep` a minute after boot, then every hour, never two at once.
 * @returns {() => void} stops the timers
 */
export function startSweeper(): () => void {
	let running = false;
	const run = async () => {
		if (running) return;
		running = true;
		try {
			const deleted = await sweep();
			console.log(
				`sweep: ${deleted.sessions} sessions, ${deleted.guilds} servers, ${deleted.links} links deleted`,
			);
		} catch (failure) {
			console.error('sweep failed:', failure);
		} finally {
			running = false;
		}
	};
	const first = setTimeout(run, 60 * 1000);
	const every = setInterval(run, INTERVAL_MS);
	return () => {
		clearTimeout(first);
		clearInterval(every);
	};
}

import { db } from './db/pool';
import { deleteScheduledEvent } from './discord/rest';

/**
 * Deletes the Discord events the bot copied from the intra before it stopped doing so.
 * @remarks The campus events showed too much of the intra to the whole server; exams are
 * announced in a channel instead. Events already started are only forgotten: Discord ends
 * them on its own. Once the table is empty, this is one query an hour, until the table goes.
 */
export async function removeMirroredEvents(now = new Date()): Promise<string | void> {
	const { rows } = await db().query<{ guild_id: string; source: string; ft_id: number; discord_event_id: string; begin_at: Date }>(
		'SELECT guild_id, source, ft_id, discord_event_id, begin_at FROM guild_events',
	);
	let removed = 0;
	for (const row of rows) {
		if (row.begin_at > now) {
			await deleteScheduledEvent(row.guild_id, row.discord_event_id);
			removed++;
		}
		await db().query('DELETE FROM guild_events WHERE guild_id = $1 AND source = $2 AND ft_id = $3', [
			row.guild_id,
			row.source,
			row.ft_id,
		]);
	}
	return removed ? `${removed} removed` : undefined;
}

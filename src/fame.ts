import { db } from './db/pool';
import { getGuild, postMessage } from './discord/rest';
import { fetchAppToken, fetchMarks, type FtMark } from './ft/api';
import { resolveLocale, t } from './i18n';
import { forEachGuild } from './jobs';
import { shownLinks, type Link } from './links';

/** Longest stretch looked back on, so a bot down for a day does not flood the channel after. */
const LOOKBACK_MS = 2 * 60 * 60 * 1000;
/** Discord's limit for one message. */
const MAX_LENGTH = 2000;

/**
 * Turns validations into announcement messages, as many as Discord's length limit needs.
 * @remarks One line per validation, oldest first. Members are mentioned so readers can click
 * through, but the caller posts with mentions disabled: nobody is pinged for their own mark.
 */
export function fameMessages(marks: FtMark[], links: Link[], locale: string): string[] {
	const member = new Map(links.map((link) => [link.ftId, link.userId]));
	const lines = marks
		.filter((mark) => mark['validated?'] === true && member.has(mark.user.id))
		.sort((a, b) => (a.marked_at ?? '').localeCompare(b.marked_at ?? ''))
		.map((mark) =>
			t(locale, 'fame.line', {
				member: `<@${member.get(mark.user.id)}>`,
				project: mark.project.name,
				mark: mark.final_mark ?? 0,
			}),
		);

	const messages: string[] = [];
	for (const line of lines) {
		const last = messages.at(-1);
		if (last !== undefined && last.length + 1 + line.length <= MAX_LENGTH) {
			messages[messages.length - 1] = `${last}\n${line}`;
		} else {
			messages.push(line);
		}
	}
	return messages;
}

/**
 * Announces, in each server's hall of fame channel, the projects its members validated since
 * the last run.
 * @remarks One call per hundred members of a server, whatever the campus. A channel just
 * chosen starts from now. The window moves on once the marks were read, even when posting
 * fails, so a channel the bot lost access to is not retried with an ever-growing backlog; a
 * failed read leaves it where it was. Members hidden with `/visibility` are never announced.
 */
export async function announceFame(now = new Date()): Promise<string | void> {
	const { rows } = await db().query<{ guild_id: string; fame_channel_id: string; fame_checked_at: Date | null }>(
		'SELECT guild_id, fame_channel_id, fame_checked_at FROM guilds WHERE fame_channel_id IS NOT NULL',
	);
	if (!rows.length) return;

	const token = await fetchAppToken('background');
	let posted = 0;
	for (const row of rows) {
		const from = row.fame_checked_at && new Date(Math.max(+row.fame_checked_at, +now - LOOKBACK_MS));
		const done = await forEachGuild('fame', async () => {
			if (!from) return;
			const links = await shownLinks(row.guild_id);
			const marks = links.length ? await fetchMarks(links.map((link) => link.ftId), from, now, token) : [];
			if (!marks.length) return;
			const locale = resolveLocale((await getGuild(row.guild_id)).preferred_locale);
			for (const content of fameMessages(marks, links, locale)) {
				if (await postMessage(row.fame_channel_id, { content, allowed_mentions: { parse: [] } })) posted++;
			}
		});
		// A 42 outage leaves the window where it was, to be read again next time.
		if (done) await db().query('UPDATE guilds SET fame_checked_at = $2 WHERE guild_id = $1', [row.guild_id, now]);
	}
	return posted ? `${posted} messages` : undefined;
}

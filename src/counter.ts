import { campusLocations, campusNamed } from './campus';
import { db } from './db/pool';
import { getGuild, renameChannel } from './discord/rest';
import { resolveLocale, t } from './i18n';
import { forEachGuild } from './jobs';
import { visibleLinks } from './links';

/** The name last given to each counter channel, so an unchanged count costs no call. */
const shown = new Map<string, string>();

/**
 * Renames each server's counter channel after how many people are on its campus right now,
 * and how many of them are its own members.
 * @remarks Runs every ten minutes: Discord allows two renames per channel in that time. The
 * campus count is read once for every server of a campus, and only counts are shown, never
 * who. A server whose campus is unknown to the intra is skipped.
 */
export async function updateCounters(): Promise<string | void> {
	const { rows } = await db().query<{ guild_id: string; counter_channel_id: string; campus: string }>(
		'SELECT guild_id, counter_channel_id, campus FROM guilds WHERE counter_channel_id IS NOT NULL AND campus IS NOT NULL',
	);
	let renamed = 0;
	for (const row of rows) {
		await forEachGuild('counter', async () => {
			const campus = await campusNamed(row.campus);
			if (!campus) return;
			const present = await campusLocations(campus.id, 'background');
			const here = (await visibleLinks(row.guild_id, present.map((location) => location.user.id))).length;
			const locale = resolveLocale((await getGuild(row.guild_id)).preferred_locale);
			const name = t(locale, 'counter.name', { count: present.length, here });
			if (shown.get(row.counter_channel_id) === name) return;
			await renameChannel(row.counter_channel_id, name);
			shown.set(row.counter_channel_id, name);
			renamed++;
		});
	}
	return renamed ? `${renamed} renamed` : undefined;
}

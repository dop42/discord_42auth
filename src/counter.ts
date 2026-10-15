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
			if (await updateCounter(row.guild_id, row.counter_channel_id, row.campus)) renamed++;
		});
	}
	return renamed ? `${renamed} renamed` : undefined;
}

/**
 * Renames one server's counter channel, unless it already shows that count.
 * @remarks Called by the job and when an admin saves a counter channel or a campus, so the
 * channel is right at once instead of at the next ten minutes.
 * @returns whether the channel was renamed
 * @throws {DiscordError} 403 when the bot lacks Manage Channels
 */
export async function updateCounter(guildId: string, channelId: string, campusName: string): Promise<boolean> {
	const campus = await campusNamed(campusName);
	if (!campus) return false;
	const present = await campusLocations(campus.id, 'background');
	const here = (await visibleLinks(guildId, present.map((location) => location.user.id))).length;
	const locale = resolveLocale((await getGuild(guildId)).preferred_locale);
	const name = t(locale, 'counter.name', { count: present.length, here });
	if (shown.get(channelId) === name) return false;
	await renameChannel(channelId, name);
	shown.set(channelId, name);
	return true;
}

import { campusNamed } from './campus';
import { db } from './db/pool';
import {
	createScheduledEvent,
	deleteScheduledEvent,
	getGuild,
	updateScheduledEvent,
	type ScheduledEventBody,
} from './discord/rest';
import { fetchAppToken, fetchCampusEvents, type FtEvent } from './ft/api';
import { resolveLocale, t } from './i18n';
import { forEachGuild } from './jobs';
import { getSettings } from './settings';

/** How far ahead events are copied. */
const WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
/** Discord holds 100 events per server; the bot never takes more than half. */
const MAX_EVENTS = 50;

export type EventSource = 'event' | 'exam';


/**
 * A web address in an intra description, bare, between `<>`, or as a Markdown link (group 1 is
 * its text). The Discord event is seen by the whole server, the intra page only by 42 accounts.
 */
const ADDRESS = /\[([^\]]*)\]\(\s*(?:https?:\/\/|www\.)[^)]*\)|<?(?:https?:\/\/|www\.)[^\s<>]*[^\s<>.,;:!?)]>?/gi;

/** An intra description without its web addresses, a Markdown link keeping its text. */
export function withoutAddresses(text: string): string {
	return text
		.replace(ADDRESS, (_, label?: string) => label ?? '')
		.replace(/[ \t]+$/gm, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

const cut = (text: string, max: number) => ([...text].length > max ? `${[...text].slice(0, max - 1).join('')}…` : text);

/**
 * Builds the Discord event mirroring an intra one.
 * @remarks Discord caps a name at 100 characters, a description at 1000, a location at 100.
 * The addresses of the intra description are left out; an event links to its intra page
 * instead, behind a label, which only 42 accounts can open.
 * An exam is named after the projects it lets students take, which says more than its title.
 * An intra event with no place falls back on the campus name: Discord requires one.
 */
export function eventBody(event: FtEvent, source: EventSource, campus: string, locale: string): ScheduledEventBody {
	const projects = (event.projects ?? []).map((project) => project.name).join(' · ');
	const name =
		source === 'exam' ? t(locale, 'events.exam', { projects: projects || event.name }) : event.name;
	const link =
		source === 'event' ? `\n\n[${t(locale, 'events.link')}](https://profile.intra.42.fr/events/${event.id})` : '';
	const description = cut(withoutAddresses(event.description ?? ''), 1000 - link.length) + link;
	return {
		name: cut(name, 100),
		description: description.trim() || t(locale, 'events.noDescription'),
		scheduled_start_time: event.begin_at,
		scheduled_end_time: event.end_at,
		entity_metadata: { location: cut(withoutAddresses(event.location ?? '') || campus, 100) },
	};
}

interface Mirrored {
	source: EventSource;
	ft_id: number;
	discord_event_id: string;
	ft_updated_at: Date;
	begin_at: Date;
}

/** A campus's events or exams, read once per campus and per run whatever the number of servers. */
type Lists = Map<string, Promise<FtEvent[]>>;

/** Servers being synced right now, so a save and the hourly job never mirror one twice. */
const inFlight = new Map<string, Promise<{ created: number; removed: number }>>();

/**
 * Keeps each server's Discord events in step with its campus's events and exams.
 * @remarks Runs over every server that syncs or still has mirrored events, so switching it
 * off cleans up.
 */
export async function syncEvents(now = new Date()): Promise<string | void> {
	const { rows: guilds } = await db().query<{ guild_id: string }>(
		`SELECT guild_id FROM guilds WHERE sync_events OR sync_exams
		 UNION SELECT DISTINCT guild_id FROM guild_events`,
	);
	if (!guilds.length) return;

	let created = 0;
	let removed = 0;
	const lists: Lists = new Map();
	for (const { guild_id: guildId } of guilds) {
		await forEachGuild('events', async () => {
			const counts = await syncGuildEvents(guildId, now, lists);
			created += counts.created;
			removed += counts.removed;
		});
	}
	return created || removed ? `${created} created, ${removed} removed` : undefined;
}

/**
 * Brings one server's Discord events in step with its campus, right away.
 * @remarks Called by the hourly job and when an admin saves the settings, so switching the
 * option on shows the events without waiting for the next hour. The next two weeks, soonest
 * first, up to fifty. A new intra event is created, one the intra changed is updated
 * (recreated if an admin deleted it by hand), and one that left the list before starting —
 * cancelled, or its kind switched off — is removed. Past events are only forgotten: Discord
 * ends them on its own.
 * @throws when the 42 API or Discord refuses, the bot lacking Manage Events for one
 */
export function syncGuildEvents(
	guildId: string,
	now = new Date(),
	lists: Lists = new Map(),
): Promise<{ created: number; removed: number }> {
	const running = inFlight.get(guildId);
	if (running) return running;
	const work = syncGuild(guildId, now, lists).finally(() => inFlight.delete(guildId));
	inFlight.set(guildId, work);
	return work;
}

async function syncGuild(guildId: string, now: Date, lists: Lists): Promise<{ created: number; removed: number }> {
	let created = 0;
	let removed = 0;
	const settings = await getSettings(guildId);
	const campus = settings.campus ? await campusNamed(settings.campus) : null;
	const wanted: Array<{ source: EventSource; event: FtEvent }> = [];
	if (campus) {
		const read = (source: EventSource) => {
			const key = `${campus.id}:${source}`;
			if (!lists.has(key)) {
				lists.set(
					key,
					fetchAppToken('background').then((token) =>
						fetchCampusEvents(
							campus.id,
							source === 'event' ? 'events' : 'exams',
							now,
							new Date(+now + WINDOW_MS),
							token,
						),
					),
				);
			}
			return lists.get(key)!;
		};
		if (settings.syncEvents) wanted.push(...(await read('event')).map((event) => ({ source: 'event' as const, event })));
		if (settings.syncExams) wanted.push(...(await read('exam')).map((event) => ({ source: 'exam' as const, event })));
	}
	const upcoming = wanted
		// Discord refuses an event that has already started.
		.filter(({ event }) => new Date(event.begin_at) > new Date(+now + 60_000))
		.sort((a, b) => a.event.begin_at.localeCompare(b.event.begin_at))
		.slice(0, MAX_EVENTS);

	const { rows: mirrored } = await db().query<Mirrored>(
		'SELECT source, ft_id, discord_event_id, ft_updated_at, begin_at FROM guild_events WHERE guild_id = $1',
		[guildId],
	);
	const key = (source: string, id: number) => `${source}:${id}`;
	const known = new Map(mirrored.map((row) => [key(row.source, row.ft_id), row]));
	const locale = upcoming.length ? resolveLocale((await getGuild(guildId)).preferred_locale) : 'en-US';

	for (const { source, event } of upcoming) {
		const body = eventBody(event, source, campus?.name ?? '', locale);
		const row = known.get(key(source, event.id));
		known.delete(key(source, event.id));
		if (row && +row.ft_updated_at === +new Date(event.updated_at)) continue;
		let discordId = row?.discord_event_id;
		if (!discordId || !(await updateScheduledEvent(guildId, discordId, body))) {
			discordId = await createScheduledEvent(guildId, body);
			created++;
		}
		await db().query(
			`INSERT INTO guild_events (guild_id, source, ft_id, discord_event_id, ft_updated_at, begin_at)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 ON CONFLICT (guild_id, source, ft_id) DO UPDATE SET
				discord_event_id = $4, ft_updated_at = $5, begin_at = $6`,
			[guildId, source, event.id, discordId, event.updated_at, event.begin_at],
		);
	}

	// What is left was mirrored but is not wanted any more.
	for (const row of known.values()) {
		if (row.begin_at > now) {
			await deleteScheduledEvent(guildId, row.discord_event_id);
			removed++;
		}
		await db().query('DELETE FROM guild_events WHERE guild_id = $1 AND source = $2 AND ft_id = $3', [
			guildId,
			row.source,
			row.ft_id,
		]);
	}
	return { created, removed };
}

import type { FtSession } from './ft/api';

/** Offset of a time zone from UTC at an instant, in milliseconds. */
function offsetAt(instant: number, timeZone: string): number {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat('en-US', {
			timeZone,
			hourCycle: 'h23',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		})
			.formatToParts(instant)
			.map((part) => [part.type, part.value]),
	);
	const asUtc = Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!, +parts.hour!, +parts.minute!, +parts.second!);
	return asUtc - Math.floor(instant / 1000) * 1000;
}

/** The instant a local date starts in a time zone: midnight there, as UTC. */
export function localMidnight(year: number, month: number, day: number, timeZone: string): Date {
	const guess = Date.UTC(year, month - 1, day);
	return new Date(guess - offsetAt(guess, timeZone));
}

/** The local calendar date of an instant in a time zone. */
function localDate(instant: Date, timeZone: string): { year: number; month: number; day: number; weekday: number } {
	const shifted = new Date(+instant + offsetAt(+instant, timeZone));
	return {
		year: shifted.getUTCFullYear(),
		month: shifted.getUTCMonth() + 1,
		day: shifted.getUTCDate(),
		// Monday is 0: a 42 week, like a French one, starts on Monday.
		weekday: (shifted.getUTCDay() + 6) % 7,
	};
}

/** The three spans `/logtime` adds up, in the campus's own time. */
export interface Periods {
	month: { from: Date; to: Date };
	/** Only for the month in progress. */
	week?: { from: Date; to: Date };
	today?: { from: Date; to: Date };
}

/**
 * Works out the month asked for, and for the current month the week and the day, in local time.
 * @param month `YYYY-MM`, or undefined for the current month
 */
export function periodsFor(month: string | undefined, timeZone: string, now = new Date()): Periods {
	const local = localDate(now, timeZone);
	const [year, monthNumber] = month ? month.split('-').map(Number) : [local.year, local.month];
	const from = localMidnight(year!, monthNumber!, 1, timeZone);
	const next = monthNumber === 12 ? localMidnight(year! + 1, 1, 1, timeZone) : localMidnight(year!, monthNumber! + 1, 1, timeZone);
	const current = year === local.year && monthNumber === local.month;
	if (!current) return { month: { from, to: next } };

	const today = localMidnight(local.year, local.month, local.day, timeZone);
	const monday = new Date(+localMidnight(local.year, local.month, local.day - local.weekday, timeZone));
	return {
		month: { from, to: now },
		week: { from: monday, to: now },
		today: { from: today, to: now },
	};
}

/**
 * Adds up the time spent logged in on campus within a span.
 * @remarks A session still open counts up to now, and one crossing a boundary counts only the
 * part inside, so a night session is split between the two days.
 */
export function timeIn(sessions: FtSession[], span: { from: Date; to: Date }, now = new Date()): number {
	let total = 0;
	for (const session of sessions) {
		const begin = Math.max(+new Date(session.begin_at), +span.from);
		const end = Math.min(session.end_at ? +new Date(session.end_at) : +now, +span.to);
		if (end > begin) total += end - begin;
	}
	return total;
}

/** `42 h 05` from milliseconds. */
export function formatDuration(ms: number): string {
	const minutes = Math.round(ms / 60_000);
	return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}

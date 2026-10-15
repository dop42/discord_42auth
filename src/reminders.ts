import { db } from './db/pool';
import { sendDirectMessage } from './discord/rest';
import { fetchAppToken, fetchUser, type FtUser } from './ft/api';
import { t } from './i18n';
import { latestLink } from './links';

/** Reminders checked per run; once a day each, so a hundred an hour covers 2 400 members. */
const BATCH = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Sets, or with 0 removes, a member's reminder; the message will be in their language. */
export async function setReminder(userId: string, days: number, locale: string): Promise<void> {
	if (days === 0) {
		await db().query('DELETE FROM reminders WHERE user_id = $1', [userId]);
		return;
	}
	await db().query(
		`INSERT INTO reminders (user_id, days, locale) VALUES ($1, $2, $3)
		 ON CONFLICT (user_id) DO UPDATE SET days = $2, locale = $3, checked_at = '-infinity'`,
		[userId, days, locale],
	);
}

/** The deadline of the main cursus still running, or null where the campus uses none. */
export function deadlineOf(user: FtUser, now = new Date()): Date | null {
	const entry = (user.cursus_users ?? []).find(
		(cursus) =>
			cursus.cursus.kind === 'main' &&
			(cursus.end_at === null || new Date(cursus.end_at) > now) &&
			cursus.blackholed_at &&
			new Date(cursus.blackholed_at) > now,
	);
	return entry?.blackholed_at ? new Date(entry.blackholed_at) : null;
}

/**
 * Tells whether a reminder is due: the deadline is within the days asked for, and this
 * deadline was not reminded about yet.
 * @remarks A deadline pushed back by a validated project is a new one, and earns its own
 * reminder when it comes close again.
 */
export function reminderDue(deadline: Date | null, days: number, sentFor: Date | null, now = new Date()): boolean {
	if (!deadline) return false;
	if (sentFor && +sentFor === +deadline) return false;
	return +deadline - +now <= days * DAY_MS;
}

/**
 * Checks each reminder once a day and sends the private message when it is due.
 * @remarks The member's 42 account is the one they verified most recently, on any server. A
 * member with no link left has their reminder deleted: there is nobody to remind. Private
 * messages closed is not an error; the reminder simply waits for the next deadline.
 */
export async function sendReminders(now = new Date()): Promise<string | void> {
	const { rows } = await db().query<{ user_id: string; days: number; locale: string; sent_for: Date | null }>(
		`SELECT user_id, days, locale, sent_for FROM reminders
		 WHERE checked_at < now() - interval '1 day' ORDER BY checked_at LIMIT $1`,
		[BATCH],
	);
	if (!rows.length) return;

	const token = await fetchAppToken('background');
	let sent = 0;
	for (const row of rows) {
		const link = await latestLink(row.user_id);
		if (!link) {
			await db().query('DELETE FROM reminders WHERE user_id = $1', [row.user_id]);
			continue;
		}
		const user = await fetchUser(link.ftId, token);
		const deadline = user ? deadlineOf(user, now) : null;
		let sentFor = row.sent_for;
		if (deadline && reminderDue(deadline, row.days, row.sent_for, now)) {
			const at = Math.floor(+deadline / 1000);
			const content = t(row.locale, 'reminder.message', { relative: `<t:${at}:R>`, date: `<t:${at}:F>` });
			if (await sendDirectMessage(row.user_id, { content })) sent++;
			sentFor = deadline;
		}
		await db().query('UPDATE reminders SET checked_at = $2, sent_for = $3 WHERE user_id = $1', [
			row.user_id,
			now,
			sentFor,
		]);
	}
	return sent ? `${sent} sent` : undefined;
}

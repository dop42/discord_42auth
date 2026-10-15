import { deferred, ephemeral } from '../discord/responses';
import { editReply } from '../discord/rest';
import { optionValue, type Interaction } from '../discord/types';
import { fetchAppToken, fetchSessions, fetchUser, primaryCampus } from '../ft/api';
import { resolveLocale, t } from '../i18n';
import { findByMember, type Link } from '../links';
import { formatDuration, periodsFor, timeIn } from '../logtime';
import { RateLimiter } from '../ratelimit';

/** A night session started the evening before still counts for the first day of the month. */
const LOOKBEHIND_MS = 24 * 60 * 60 * 1000;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

const lookups = new RateLimiter(5, 60_000);

/**
 * Answers `/logtime [month]` with the caller's time on campus, only to them.
 * @remarks Your own time only: how long someone sits on campus is nobody else's business.
 * Read live from the intra and kept nowhere. Days and months follow the caller's campus time
 * zone, so midnight is the campus's midnight.
 */
export async function handleLogtime(interaction: Interaction): Promise<Response> {
	const locale = resolveLocale(interaction.locale);
	const guildId = interaction.guild_id;
	const member = interaction.member;
	if (!guildId || !member) return ephemeral(t(locale, 'error.notInGuild'));

	const link = await findByMember(guildId, member.user.id);
	if (!link) return ephemeral(t(locale, 'profile.selfNotLinked'));

	const typed = optionValue(interaction, 'month');
	const month = typeof typed === 'string' ? typed.trim() : undefined;
	if (month !== undefined && (!MONTH.test(month) || month > new Date().toISOString().slice(0, 7))) {
		return ephemeral(t(locale, 'logtime.badMonth'));
	}
	if (lookups.take(member.user.id)) return ephemeral(t(locale, 'profile.slowDown'));

	void answer(interaction.token, link, month, locale);
	return deferred(true);
}

async function answer(interactionToken: string, link: Link, month: string | undefined, locale: string): Promise<void> {
	try {
		const token = await fetchAppToken('interactive');
		const user = await fetchUser(link.ftId, token, 'interactive');
		const timeZone = (user && primaryCampus(user)?.time_zone) || 'UTC';
		const now = new Date();
		const periods = periodsFor(month, timeZone, now);
		const sessions = await fetchSessions(
			link.ftId,
			new Date(+periods.month.from - LOOKBEHIND_MS),
			periods.month.to,
			token,
		);

		const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone }).format(
			periods.month.from,
		);
		const lines = [`### ${t(locale, 'logtime.title', { month: title })}`];
		lines.push(`**${t(locale, 'logtime.month')}** — ${formatDuration(timeIn(sessions, periods.month, now))}`);
		if (periods.week) lines.push(`**${t(locale, 'logtime.week')}** — ${formatDuration(timeIn(sessions, periods.week, now))}`);
		if (periods.today) lines.push(`**${t(locale, 'logtime.today')}** — ${formatDuration(timeIn(sessions, periods.today, now))}`);
		lines.push(`-# ${t(locale, 'logtime.footer', { zone: timeZone })}`);
		await editReply(interactionToken, { content: lines.join('\n') });
	} catch (failure) {
		console.error(failure);
		await editReply(interactionToken, { content: t(locale, 'error.unknown') });
	}
}

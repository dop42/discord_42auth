import { ephemeral } from '../discord/responses';
import { optionValue, type Interaction } from '../discord/types';
import { resolveLocale, t } from '../i18n';
import { findByMember } from '../links';
import { setReminder } from '../reminders';

/**
 * Answers `/reminder <days>`: a private message that many days before the caller's
 * deadline, or none with 0.
 * @remarks Opt-in, and only about the caller themselves. Kept per Discord account rather than
 * per server, since it is one message to one person.
 */
export async function handleReminder(interaction: Interaction): Promise<Response> {
	const locale = resolveLocale(interaction.locale);
	const guildId = interaction.guild_id;
	const member = interaction.member;
	if (!guildId || !member) return ephemeral(t(locale, 'error.notInGuild'));
	if (!(await findByMember(guildId, member.user.id))) return ephemeral(t(locale, 'profile.selfNotLinked'));

	const days = optionValue(interaction, 'days');
	if (typeof days !== 'number' || !Number.isInteger(days) || days < 0 || days > 60) {
		return ephemeral(t(locale, 'reminder.bad'));
	}
	await setReminder(member.user.id, days, locale);
	return ephemeral(days === 0 ? t(locale, 'reminder.off') : t(locale, 'reminder.on', { days }));
}

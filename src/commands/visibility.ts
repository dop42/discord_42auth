import { ephemeral } from '../discord/responses';
import { optionValue, type Interaction } from '../discord/types';
import { resolveLocale, t } from '../i18n';
import { setHidden } from '../links';

/**
 * Answers `/visibility <shown>`: whether `/helpers` may list the caller on this server.
 * @remarks The member's own say over the one feature that tells others where they sit. It is
 * kept on the link, so it holds across a new verification and goes away with `/forget`.
 */
export async function handleVisibility(interaction: Interaction): Promise<Response> {
	const locale = resolveLocale(interaction.locale);
	const guildId = interaction.guild_id;
	const member = interaction.member;
	if (!guildId || !member) return ephemeral(t(locale, 'error.notInGuild'));

	const shown = optionValue(interaction, 'shown') !== false;
	if (!(await setHidden(guildId, member.user.id, !shown))) return ephemeral(t(locale, 'forget.none'));
	return ephemeral(t(locale, shown ? 'visibility.shown' : 'visibility.hidden'));
}

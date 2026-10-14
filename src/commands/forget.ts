import { ephemeral } from '../discord/responses';
import type { Interaction } from '../discord/types';
import { resolveLocale, t } from '../i18n';
import { unlink } from '../membership';
import { getSettings } from '../settings';

/**
 * Erases the caller's link in this server and takes the roles it gave back.
 * @remarks The member's own way to exercise the right to erasure, with no admin involved.
 * The interaction already carries the member's roles and nickname, so answering takes only
 * the calls that change something, well inside Discord's three-second budget.
 */
export async function handleForget(interaction: Interaction): Promise<Response> {
	const locale = resolveLocale(interaction.locale);
	const guildId = interaction.guild_id;
	const member = interaction.member;
	if (!guildId || !member) return ephemeral(t(locale, 'error.notInGuild'));

	const result = await unlink(guildId, member.user.id, await getSettings(guildId), {
		user: member.user,
		roles: member.roles,
		nick: member.nick ?? null,
	});
	if (!result.linked) return ephemeral(t(locale, 'forget.none'));
	return ephemeral(t(locale, result.rolesRemoved ? 'forget.done' : 'forget.roleKept'));
}

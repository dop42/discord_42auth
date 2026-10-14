import { removeRole, setNickname } from '../discord/rest';
import { ephemeral } from '../discord/responses';
import type { Interaction } from '../discord/types';
import { resolveLocale, t } from '../i18n';
import { deleteLink, findByMember } from '../links';
import { getSettings } from '../settings';

/**
 * @author dop42
 * @method handleForget
 * @description Erases the caller's link in this server and takes the verified role back.
 * @remarks The member's own way to exercise the right to erasure, with no admin involved.
 * The link goes first, since that is what was asked for; the role and the nickname follow on
 * a best-effort basis. The nickname is only cleared when it is still one the bot set, so a
 * name the member chose afterwards is left alone. Answering takes up to three REST calls,
 * well inside Discord's three-second budget.
 * @param interaction {Interaction}
 * @returns {Promise<Response>}
 * @throws {Error}
 */
export async function handleForget(interaction: Interaction): Promise<Response> {
	const locale = resolveLocale(interaction.locale);
	const guildId = interaction.guild_id;
	const member = interaction.member;
	if (!guildId || !member) return ephemeral(t(locale, 'error.notInGuild'));

	const userId = member.user.id;
	const link = await findByMember(guildId, userId);
	if (!link || !(await deleteLink(guildId, userId))) return ephemeral(t(locale, 'forget.none'));

	const nick = member.nick ?? '';
	if (nick === link.ftLogin || nick.endsWith(` (${link.ftLogin})`)) {
		await setNickname(guildId, userId, null);
	}

	const { roleId } = await getSettings(guildId);
	if (roleId && !(await removeRole(guildId, userId, roleId))) {
		return ephemeral(t(locale, 'forget.roleKept'));
	}
	return ephemeral(t(locale, 'forget.done'));
}

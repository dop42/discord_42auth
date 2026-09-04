import { componentMessage, ephemeral } from '../discord/responses';
import { ButtonStyle, ComponentType, type Interaction } from '../discord/types';
import { authorizeUrl } from '../ft/oauth';
import { resolveLocale, t } from '../i18n';
import { getSettings } from '../settings';
import { createState } from '../state';

/**
 * @author dop42
 * @method handleAuth
 * @description Hands the member a personal, short-lived verification link.
 * @remarks Serves both `/auth` and the panel button, which carry the same fields. The reply
 * is ephemeral because the link is a credential: whoever completes the 42 login on it grants
 * the role to this member, not to themselves.
 * @param interaction {Interaction}
 * @returns {Response}
 * @throws {Error}
 */
export function handleAuth(interaction: Interaction): Response {
	const locale = resolveLocale(interaction.locale);
	const guildId = interaction.guild_id;
	const member = interaction.member;
	if (!guildId || !member) return ephemeral(t(locale, 'error.notInGuild'));

	if (!getSettings().roleId) return ephemeral(t(locale, 'auth.notConfigured'));

	const state = createState({
		guildId,
		userId: member.user.id,
		locale,
		guildLocale: resolveLocale(interaction.guild_locale),
	});

	return componentMessage(
		[
			{
				type: ComponentType.CONTAINER,
				components: [
					{ type: ComponentType.TEXT_DISPLAY, content: t(locale, 'auth.notice') },
					{
						type: ComponentType.ACTION_ROW,
						components: [
							{
								type: ComponentType.BUTTON,
								style: ButtonStyle.LINK,
								label: t(locale, 'auth.button'),
								url: authorizeUrl(state),
							},
						],
					},
				],
			},
		],
		true,
	);
}

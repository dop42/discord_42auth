import { componentMessage, ephemeral } from '../discord/responses';
import { ButtonStyle, ComponentType, Permissions, type Interaction } from '../discord/types';
import { resolveLocale, t } from '../i18n';
import { AUTH_BUTTON } from './definitions';

/**
 * @author dop42
 * @method handlePanel
 * @description Posts the standing verification message, with the button members press.
 * @remarks Written in the server's language, not the caller's: it stays in the channel for
 * everyone. The button carries no member data — the personal link is minted when it is
 * pressed, so this one message serves the whole server forever.
 * @param interaction {Interaction}
 * @returns {Response}
 */
export function handlePanel(interaction: Interaction): Response {
	const locale = resolveLocale(interaction.locale);
	const permissions = BigInt(interaction.member?.permissions ?? '0');
	const allowed = Permissions.ADMINISTRATOR | Permissions.MANAGE_GUILD;
	if ((permissions & allowed) === 0n) return ephemeral(t(locale, 'config.noPermission'));

	const guildLocale = resolveLocale(interaction.guild_locale);
	return componentMessage([
		{
			type: ComponentType.CONTAINER,
			components: [
				{
					type: ComponentType.TEXT_DISPLAY,
					content: `### ${t(guildLocale, 'panel.title')}\n${t(guildLocale, 'panel.body')}`,
				},
				{ type: ComponentType.SEPARATOR, divider: true, spacing: 1 },
				{
					type: ComponentType.ACTION_ROW,
					components: [
						{
							type: ComponentType.BUTTON,
							style: ButtonStyle.PRIMARY,
							label: t(guildLocale, 'panel.button'),
							custom_id: AUTH_BUTTON,
						},
					],
				},
			],
		},
	]);
}

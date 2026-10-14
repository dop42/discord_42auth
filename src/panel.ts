import { AUTH_BUTTON } from './commands/definitions';
import { ButtonStyle, ComponentType } from './discord/types';
import { env } from './env';
import { t } from './i18n';

/**
 * @author dop42
 * @method panelComponents
 * @description Builds the standing verification message, with the button members press.
 * @remarks Written in the server's language: it stays in the channel for everyone. The
 * button carries no member data — the personal link is minted when it is pressed, so this
 * one message serves the whole server forever. The privacy line is what informs members
 * before they press anything. Posted by `/panel` and by the dashboard.
 * @param locale {string} the server's language
 * @returns {unknown[]} Components V2
 */
export function panelComponents(locale: string): unknown[] {
	return [
		{
			type: ComponentType.CONTAINER,
			components: [
				{
					type: ComponentType.TEXT_DISPLAY,
					content: `### ${t(locale, 'panel.title')}\n${t(locale, 'panel.body')}`,
				},
				{
					type: ComponentType.TEXT_DISPLAY,
					content: `-# ${t(locale, 'auth.privacy', { privacy: `${env.publicUrl}/privacy` })}`,
				},
				{ type: ComponentType.SEPARATOR, divider: true, spacing: 1 },
				{
					type: ComponentType.ACTION_ROW,
					components: [
						{
							type: ComponentType.BUTTON,
							style: ButtonStyle.PRIMARY,
							label: t(locale, 'panel.button'),
							custom_id: AUTH_BUTTON,
						},
					],
				},
			],
		},
	];
}

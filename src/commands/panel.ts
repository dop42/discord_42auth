import { componentMessage, ephemeral } from '../discord/responses';
import { canManage } from '../discord/permissions';
import type { Interaction } from '../discord/types';
import { resolveLocale, t } from '../i18n';
import { panelComponents } from '../panel';

/**
 * @author dop42
 * @method handlePanel
 * @description Answers `/panel` with the verification panel, posted in the current channel.
 * @param interaction {Interaction}
 * @returns {Response}
 */
export function handlePanel(interaction: Interaction): Response {
	const locale = resolveLocale(interaction.locale);
	if (!canManage(BigInt(interaction.member?.permissions ?? '0'))) {
		return ephemeral(t(locale, 'config.noPermission'));
	}
	return componentMessage(panelComponents(resolveLocale(interaction.guild_locale)));
}

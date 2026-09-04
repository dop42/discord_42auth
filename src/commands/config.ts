import { ephemeral } from '../discord/responses';
import { Permissions, type Interaction } from '../discord/types';
import { resolveLocale, t } from '../i18n';
import { getSettings, type Settings } from '../settings';

/**
 * @author dop42
 * @method handleConfig
 * @description Answers `/config` with what this deployment is set to.
 * @remarks The permission is re-tested here because `default_member_permissions` can be
 * overridden per guild. Administrator is accepted on its own rather than trusting Discord
 * to have expanded it into every other bit.
 * @param interaction {Interaction}
 * @returns {Response}
 * @throws {Error}
 */
export function handleConfig(interaction: Interaction): Response {
	const locale = resolveLocale(interaction.locale);
	const permissions = BigInt(interaction.member?.permissions ?? '0');
	if (!interaction.guild_id) return ephemeral(t(locale, 'error.notInGuild'));

	const allowed = Permissions.ADMINISTRATOR | Permissions.MANAGE_GUILD;
	if ((permissions & allowed) === 0n) {
		return ephemeral(t(locale, 'config.noPermission'));
	}

	return ephemeral(formatSettings(getSettings(), locale));
}

/**
 * @author dop42
 * @method formatSettings
 * @description Renders the settings as the message `/config` displays.
 * @param settings {Settings}
 * @param locale {string}
 * @returns {string}
 */
function formatSettings(settings: Settings, locale: string): string {
	const nickname = {
		off: t(locale, 'show.nickname.off'),
		login: t(locale, 'show.nickname.login'),
		full: t(locale, 'show.nickname.full'),
	}[settings.nickname];

	const role = settings.roleId ? `<@&${settings.roleId}>` : t(locale, 'show.role.unset');
	const logs = settings.logChannelId
		? `<#${settings.logChannelId}>`
		: t(locale, 'show.logs.none');

	return [
		`**${t(locale, 'show.role')}** — ${role}`,
		`**${t(locale, 'show.campus')}** — ${settings.campus ?? t(locale, 'show.campus.any')}`,
		`**${t(locale, 'show.students')}** — ${settings.studentsOnly ? t(locale, 'show.yes') : t(locale, 'show.no')}`,
		`**${t(locale, 'show.nickname')}** — ${nickname}`,
		`**${t(locale, 'show.logs')}** — ${logs}`,
		'',
		`-# ${t(locale, 'show.hint')}`,
	].join('\n');
}

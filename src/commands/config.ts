import { canManage } from '../discord/permissions';
import { ephemeral } from '../discord/responses';
import type { Interaction } from '../discord/types';
import { env } from '../env';
import { resolveLocale, t } from '../i18n';
import { getSettings, type Settings } from '../settings';

/**
 * @author dop42
 * @method handleConfig
 * @description Answers `/config` with what this server is set to, and where to change it.
 * @remarks The permission is re-tested here because `default_member_permissions` can be
 * overridden per server.
 * @param interaction {Interaction}
 * @returns {Promise<Response>}
 * @throws {Error}
 */
export async function handleConfig(interaction: Interaction): Promise<Response> {
	const locale = resolveLocale(interaction.locale);
	const guildId = interaction.guild_id;
	if (!guildId) return ephemeral(t(locale, 'error.notInGuild'));

	if (!canManage(BigInt(interaction.member?.permissions ?? '0'))) {
		return ephemeral(t(locale, 'config.noPermission'));
	}

	return ephemeral(formatSettings(await getSettings(guildId), guildId, locale));
}

/**
 * @author dop42
 * @method formatSettings
 * @description Renders the settings as the message `/config` displays.
 * @param settings {Settings}
 * @param guildId {string}
 * @param locale {string}
 * @returns {string}
 */
function formatSettings(settings: Settings, guildId: string, locale: string): string {
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
		`-# ${t(locale, 'show.hint', { url: `${env.publicUrl}/guilds/${guildId}` })}`,
	].join('\n');
}

import { canManage } from '../discord/permissions';
import { componentMessage, ephemeral } from '../discord/responses';
import { ButtonStyle, ComponentType, type Interaction } from '../discord/types';
import { env } from '../env';
import { resolveLocale, t } from '../i18n';
import { getSettings, type Settings } from '../settings';

/**
 * Answers `/config` with what this server is set to, and a button to change it.
 * @remarks The permission is re-tested here because `default_member_permissions` can be
 * overridden per server.
 */
export async function handleConfig(interaction: Interaction): Promise<Response> {
	const locale = resolveLocale(interaction.locale);
	const guildId = interaction.guild_id;
	if (!guildId) return ephemeral(t(locale, 'error.notInGuild'));

	if (!canManage(BigInt(interaction.member?.permissions ?? '0'))) {
		return ephemeral(t(locale, 'config.noPermission'));
	}

	const settings = await getSettings(guildId);
	return componentMessage(
		[
			{
				type: ComponentType.CONTAINER,
				components: [
					{ type: ComponentType.TEXT_DISPLAY, content: `### ${t(locale, 'show.title')}` },
					{ type: ComponentType.SEPARATOR, divider: true, spacing: 1 },
					{ type: ComponentType.TEXT_DISPLAY, content: formatSettings(settings, locale) },
					{ type: ComponentType.SEPARATOR, divider: true, spacing: 1 },
					{
						type: ComponentType.ACTION_ROW,
						components: [
							{
								type: ComponentType.BUTTON,
								style: ButtonStyle.LINK,
								label: t(locale, 'show.dashboard'),
								url: `${env.publicUrl}/guilds/${guildId}`,
							},
						],
					},
				],
			},
		],
		true,
	);
}

/**
 * Renders the settings as the lines of the `/config` card.
 * @remarks Role and channel mentions render as names in the client; the card is ephemeral,
 * so nobody is pinged.
 */
function formatSettings(settings: Settings, locale: string): string {
	const nickname = {
		off: t(locale, 'show.nickname.off'),
		login: t(locale, 'show.nickname.login'),
		full: t(locale, 'show.nickname.full'),
	}[settings.nickname];
	const kinds = {
		campus: t(locale, 'show.kind.campus'),
		cursus: t(locale, 'show.kind.cursus'),
		coalition: t(locale, 'show.kind.coalition'),
	};

	const role = settings.roleId ? `<@&${settings.roleId}>` : t(locale, 'show.role.unset');
	const logs = settings.logChannelId ? `<#${settings.logChannelId}>` : t(locale, 'show.logs.none');
	const rules = settings.roleRules.length
		? settings.roleRules.map((rule) => `- <@&${rule.roleId}> ← ${kinds[rule.kind]} \`${rule.value}\``)
		: [t(locale, 'show.rules.none')];

	return [
		`**${t(locale, 'show.role')}** — ${role}`,
		`**${t(locale, 'show.campus')}** — ${settings.campus ?? t(locale, 'show.campus.any')}`,
		`**${t(locale, 'show.students')}** — ${settings.studentsOnly ? t(locale, 'show.yes') : t(locale, 'show.no')}`,
		`**${t(locale, 'show.nickname')}** — ${nickname}`,
		`**${t(locale, 'show.logs')}** — ${logs}`,
		'',
		`**${t(locale, 'show.rules')}**`,
		...rules,
	].join('\n');
}

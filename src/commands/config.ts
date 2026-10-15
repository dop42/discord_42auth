import type { RoleRule, RuleKind } from '../../shared/api';
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
	const kinds: Record<RuleKind, string> = {
		campus: t(locale, 'show.kind.campus'),
		cursus: t(locale, 'show.kind.cursus'),
		coalition: t(locale, 'show.kind.coalition'),
		level: t(locale, 'show.kind.level'),
		project: t(locale, 'show.kind.project'),
		pool: t(locale, 'show.kind.pool'),
	};
	const condition = (rule: RoleRule) =>
		rule.kind === 'level' ? `≥ \`${rule.value}\`` : `\`${rule.value}\``;

	const yesNo = (on: boolean) => (on ? t(locale, 'show.yes') : t(locale, 'show.no'));
	const channel = (id: string | null) => (id ? `<#${id}>` : t(locale, 'show.logs.none'));
	const role = settings.roleId ? `<@&${settings.roleId}>` : t(locale, 'show.role.unset');
	const logs = settings.logChannelId ? `<#${settings.logChannelId}>` : t(locale, 'show.logs.none');
	const automod = [
		settings.automodSpam && t(locale, 'automod.spam'),
		settings.automodMentions && `${t(locale, 'automod.mentions')} (${settings.automodMentions})`,
		settings.automodLanguage && t(locale, 'automod.language'),
		settings.automodKeywords.length && `${t(locale, 'automod.custom')} (${settings.automodKeywords.length})`,
	].filter(Boolean);
	const rules = settings.roleRules.length
		? settings.roleRules.map((rule) => `- <@&${rule.roleId}> ← ${kinds[rule.kind]} ${condition(rule)}`)
		: [t(locale, 'show.rules.none')];

	return [
		`**${t(locale, 'show.role')}** — ${role}`,
		`**${t(locale, 'show.campus')}** — ${settings.campus ?? t(locale, 'show.campus.any')}`,
		`**${t(locale, 'show.students')}** — ${yesNo(settings.studentsOnly)}`,
		`**${t(locale, 'show.nickname')}** — ${nickname}`,
		`**${t(locale, 'show.logs')}** — ${logs}`,
		`**${t(locale, 'show.helpers')}** — ${yesNo(settings.helpers)}`,
		`**${t(locale, 'show.fame')}** — ${channel(settings.fameChannelId)}`,
		`**${t(locale, 'show.exams')}** — ${channel(settings.examChannelId)}`,
		`**${t(locale, 'show.counter')}** — ${channel(settings.counterChannelId)}`,
		`**${t(locale, 'show.automod')}** — ${automod.length ? automod.join(', ') : t(locale, 'show.no')}`,
		'',
		`**${t(locale, 'show.rules')}**`,
		...rules,
	].join('\n');
}

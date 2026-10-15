import type { GuildSettings } from '../shared/api';
import { db } from './db/pool';
import {
	createAutomodRule,
	deleteAutomodRule,
	listAutomodRules,
	updateAutomodRule,
	type AutomodRuleBody,
} from './discord/rest';
import { t } from './i18n';

/** The filters the dashboard offers: three of Discord's own, and a list of words. */
const KINDS = ['spam', 'mentions', 'language', 'custom'] as const;
type Kind = (typeof KINDS)[number];

/** Discord's trigger type for each filter. */
const TRIGGER: Record<Kind, number> = { custom: 1, spam: 3, language: 4, mentions: 5 };

/** Discord's word lists: 1 profanity, 2 sexual content, 3 slurs. */
const WORD_LISTS = [1, 2, 3];

/** Whether two versions of the settings ask for different AutoMod rules. */
export function automodChanged(a: GuildSettings, b: GuildSettings): boolean {
	return (
		a.automodSpam !== b.automodSpam ||
		a.automodMentions !== b.automodMentions ||
		a.automodLanguage !== b.automodLanguage ||
		a.automodAlertChannelId !== b.automodAlertChannelId ||
		a.automodKeywords.join('\n') !== b.automodKeywords.join('\n')
	);
}

/** The trigger settings of one filter, or null when the server keeps it off. */
function triggerOf(kind: Kind, settings: GuildSettings): Record<string, unknown> | null {
	switch (kind) {
		case 'spam':
			return settings.automodSpam ? {} : null;
		case 'mentions':
			return settings.automodMentions
				? { mention_total_limit: settings.automodMentions, mention_raid_protection_enabled: true }
				: null;
		case 'language':
			return settings.automodLanguage ? { presets: WORD_LISTS, allow_list: [] } : null;
		case 'custom':
			return settings.automodKeywords.length ? { keyword_filter: settings.automodKeywords } : null;
	}
}

interface Row {
	kind: Kind;
	rule_id: string;
	created: boolean;
}

/**
 * Brings a server's Discord AutoMod rules in line with its settings.
 * @remarks One rule per filter, named in the server's language. A filter turned on updates
 * its rule, or creates it; Discord allows one spam, one word-list and one mention rule per
 * server, so one an admin already made is taken over rather than refused. A filter turned off
 * deletes the rule the bot created, and only disables one it took over. The rules are listed
 * first, so a bot without Manage Server changes nothing.
 * @param locale the server's language, for the rule names
 * @throws {DiscordError} 403 when the bot lacks Manage Server
 */
export async function applyAutomod(guildId: string, settings: GuildSettings, locale: string): Promise<void> {
	const rules = await listAutomodRules(guildId);
	const { rows } = await db().query<Row>('SELECT kind, rule_id, created FROM guild_automod WHERE guild_id = $1', [
		guildId,
	]);
	const forget = (kind: Kind) =>
		db().query('DELETE FROM guild_automod WHERE guild_id = $1 AND kind = $2', [guildId, kind]);
	const actions: AutomodRuleBody['actions'] = [
		{ type: 1, metadata: {} },
		...(settings.automodAlertChannelId
			? [{ type: 2, metadata: { channel_id: settings.automodAlertChannelId } }]
			: []),
	];

	for (const kind of KINDS) {
		let row = rows.find((entry) => entry.kind === kind);
		// An admin deleted it by hand: it is made again if still wanted.
		if (row && !rules.some((rule) => rule.id === row?.rule_id)) {
			await forget(kind);
			row = undefined;
		}

		const trigger = triggerOf(kind, settings);
		if (!trigger) {
			if (!row) continue;
			if (row.created) await deleteAutomodRule(guildId, row.rule_id);
			else await updateAutomodRule(guildId, row.rule_id, { enabled: false });
			await forget(kind);
			continue;
		}

		const body: AutomodRuleBody = {
			name: t(locale, `automod.${kind}`),
			trigger_metadata: trigger,
			actions,
			enabled: true,
		};
		if (row) {
			if (await updateAutomodRule(guildId, row.rule_id, body)) continue;
			await forget(kind);
		}
		// A rule Discord lists but will not let the bot edit is left alone: one is created instead.
		const existing = kind === 'custom' ? undefined : rules.find((rule) => rule.trigger_type === TRIGGER[kind]);
		const taken = existing && (await updateAutomodRule(guildId, existing.id, body)) ? existing : undefined;
		const ruleId = taken?.id ?? (await createAutomodRule(guildId, TRIGGER[kind], body));
		await db().query('INSERT INTO guild_automod (guild_id, kind, rule_id, created) VALUES ($1, $2, $3, $4)', [
			guildId,
			kind,
			ruleId,
			!taken,
		]);
	}
}

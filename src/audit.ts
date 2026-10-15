import { postMessage } from './discord/rest';
import { ComponentType, MessageFlags } from './discord/types';
import { t, type MessageKey } from './i18n';

/** One line of a server's log channel. */
export interface AuditEntry {
	userId: string;
	login: string;
	campus: string | undefined;
	/** `ok` a verification, `refused` a refused one, `revoked` a role taken back by the re-check. */
	outcome: 'ok' | 'refused' | 'revoked';
	reason?: { key: MessageKey; params?: Record<string, string> | undefined };
}

const TITLES = { ok: 'log.ok', refused: 'log.refused', revoked: 'log.revoked' } as const;

/**
 * Records one event in the server's log channel.
 * @remarks Uses the server's language rather than the member's: this line is written for
 * the admins reading it. Mentions are disabled so the Discord id shows for the trail
 * without pinging anyone. Skipped entirely when no log channel is configured. These messages
 * are kept by Discord, under the server admins' control, not in this database.
 * @param locale the server's language
 */
export async function audit(channelId: string | null, locale: string, entry: AuditEntry): Promise<void> {
	if (!channelId) return;

	const profile = `https://profile.intra.42.fr/users/${encodeURIComponent(entry.login)}`;
	const rows = [
		`**${t(locale, 'log.member')}** — <@${entry.userId}>`,
		`**${t(locale, 'log.account')}** — [\`${entry.login}\`](${profile})`,
		`**${t(locale, 'log.campus')}** — ${entry.campus ?? t(locale, 'log.unknown')}`,
	];
	if (entry.reason) {
		rows.push('', `**${t(locale, 'log.reason')}**`, `> ${t(locale, entry.reason.key, entry.reason.params)}`);
	}
	const footer = `-# ${t(locale, 'log.id')} \`${entry.userId}\` · <t:${Math.floor(Date.now() / 1000)}:f>`;

	await postMessage(channelId, {
		flags: MessageFlags.IS_COMPONENTS_V2,
		allowed_mentions: { parse: [] },
		components: [
			{
				type: ComponentType.CONTAINER,
				components: [
					{ type: ComponentType.TEXT_DISPLAY, content: `### ${t(locale, TITLES[entry.outcome])}` },
					{ type: ComponentType.SEPARATOR, divider: true, spacing: 1 },
					{ type: ComponentType.TEXT_DISPLAY, content: rows.join('\n') },
					{ type: ComponentType.TEXT_DISPLAY, content: footer },
				],
			},
		],
	});
}

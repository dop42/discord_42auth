import { ComponentType, MessageFlags } from './discord/types';
import { primaryCampus, type FtCoalition, type FtCursusUser, type FtUser } from './ft/api';
import { t } from './i18n';
import { poolOf } from './rules';

/** Projects listed by name under "in progress"; the rest is a count. */
const IN_PROGRESS_SHOWN = 5;

/** A cursus worth a line: the main one, finished or not, and any other still running. */
const shownCursus = (entry: FtCursusUser, now: Date) =>
	entry.cursus.kind === 'main' || entry.end_at === null || new Date(entry.end_at) > now;

const unix = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

/** `#4caf50` → 0x4caf50, or undefined when the intra sent nothing usable. */
function accentOf(coalitions: FtCoalition[]): number | undefined {
	const hex = coalitions[0]?.color?.match(/^#([0-9a-f]{6})$/i)?.[1];
	return hex ? parseInt(hex, 16) : undefined;
}

export interface ProfileOptions {
	/** Whose card it is, for the footer. */
	memberId: string;
	/** True when the member is looking at their own card: the deadline and the points show. */
	self: boolean;
	now?: Date;
}

/**
 * Builds the `/profile` card of a linked member, as a Components V2 message body.
 * @remarks Everything comes from the public profile, read live, and nothing of it is
 * stored. The deadline, the evaluation points and the wallet are only shown to the member
 * themselves: they are on the intra too, but they are nobody else's business on Discord.
 * Mentions are disabled so the footer names the member without pinging them.
 * @param locale the reader's language, also used to format the numbers and the month
 */
export function profileMessage(
	user: FtUser,
	coalitions: FtCoalition[],
	locale: string,
	{ memberId, self, now = new Date() }: ProfileOptions,
): unknown {
	const level = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const url = `https://profile.intra.42.fr/users/${encodeURIComponent(user.login)}`;

	const where = [primaryCampus(user)?.name, coalitions[0]?.name].filter(Boolean).join(' · ');
	const header = [`### [${user.login}](${url})`, user.usual_full_name, where && `-# ${where}`]
		.filter(Boolean)
		.join('\n');

	const cursus = (user.cursus_users ?? []).filter((entry) => shownCursus(entry, now));
	const cursusLines = cursus.map((entry) => {
		const parts = [t(locale, 'profile.level', { level: level.format(entry.level ?? 0) })];
		if (entry.grade) parts.push(entry.grade);
		return `**${entry.cursus.name}** — ${parts.join(' · ')}`;
	});

	const projects = user.projects_users ?? [];
	const validated = projects.filter((entry) => entry['validated?'] === true).length;
	const current = projects.filter((entry) => entry.status !== 'finished' && entry.status !== 'parent');
	const currentNames = current.slice(0, IN_PROGRESS_SHOWN).map((entry) => `\`${entry.project.name}\``);
	if (current.length > IN_PROGRESS_SHOWN) {
		currentNames.push(t(locale, 'profile.more', { count: current.length - IN_PROGRESS_SHOWN }));
	}

	const pool = poolOf(user);
	const poolLabel =
		pool?.length === 7
			? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
					new Date(`${pool}-01T00:00:00Z`),
				)
			: pool;

	const lines = [
		...cursusLines,
		'',
		`**${t(locale, 'profile.validated')}** — ${validated}`,
		`**${t(locale, 'profile.inProgress')}** — ${currentNames.join(', ') || t(locale, 'profile.none')}`,
		`**${t(locale, 'profile.location')}** — ${user.location ? `\`${user.location}\`` : t(locale, 'profile.offCampus')}`,
	];
	if (poolLabel) lines.push(`**${t(locale, 'profile.pool')}** — ${poolLabel}`);

	if (self) {
		const deadline = cursus.find(
			(entry) => entry.cursus.kind === 'main' && entry.blackholed_at && new Date(entry.blackholed_at) > now,
		)?.blackholed_at;
		lines.push('');
		if (deadline) lines.push(`**${t(locale, 'profile.deadline')}** — <t:${unix(deadline)}:R>`);
		lines.push(
			`**${t(locale, 'profile.points')}** — ${user.correction_point ?? 0} · **${t(locale, 'profile.wallet')}** — ${user.wallet ?? 0} ₳`,
		);
	}

	const picture = user.image?.versions?.medium ?? user.image?.link;
	const top = picture
		? {
				type: ComponentType.SECTION,
				components: [{ type: ComponentType.TEXT_DISPLAY, content: header }],
				accessory: { type: ComponentType.THUMBNAIL, media: { url: picture } },
			}
		: { type: ComponentType.TEXT_DISPLAY, content: header };

	return {
		flags: MessageFlags.IS_COMPONENTS_V2,
		allowed_mentions: { parse: [] },
		components: [
			{
				type: ComponentType.CONTAINER,
				accent_color: accentOf(coalitions),
				components: [
					top,
					{ type: ComponentType.SEPARATOR, divider: true, spacing: 1 },
					{ type: ComponentType.TEXT_DISPLAY, content: lines.join('\n') },
					{
						type: ComponentType.TEXT_DISPLAY,
						content: `-# <@${memberId}> · ${t(locale, 'profile.footer')}`,
					},
				],
			},
		],
	};
}

import { TtlCache } from './cache';
import { campusLocations } from './campus';
import { ComponentType, MessageFlags } from './discord/types';
import {
	fetchAppToken,
	fetchProject,
	fetchUser,
	fetchValidations,
	primaryCampus,
	type FtProject,
} from './ft/api';
import { t } from './i18n';
import { visibleLinks, type Link } from './links';

/** A project's name and existence change about never. */
const projects = new TtlCache<string, FtProject | null>(24 * 60 * 60_000);
/** The campus of a 42 account, by account id; null when it has no primary campus. */
const campuses = new TtlCache<number, number | null>(60 * 60_000);

/** Helpers listed by name; the rest is a count. */
const SHOWN = 20;

/**
 * Turns what a member typed into a project slug, or null when it cannot be one.
 * @remarks The intra slug is the lowercase name with dashes for spaces (`CPP Module 00` →
 * `cpp-module-00`), so typing either works. The slug ends up in an API path: anything outside
 * the characters slugs use is refused here.
 */
export function projectSlug(input: string): string | null {
	const slug = input.trim().toLowerCase().replace(/\s+/g, '-');
	return /^[a-z0-9][a-z0-9_+.-]{0,63}$/.test(slug) ? slug : null;
}

/** A member who can help: on campus now, project validated. */
export interface Helper {
	userId: string;
	login: string;
	/** The seat, e.g. `c1r2p3`. */
	host: string;
	/** Best mark on the project. */
	mark: number;
}

/**
 * Lists the members of a server who sit on the caller's campus right now and validated a
 * project, best mark first.
 * @remarks Built from what the 42 API serves campus-wide, so the cost does not grow with the
 * server: the people on campus (cached two minutes, shared by every server), then one call
 * for the validations of those among them linked here. The caller is left out, and so is
 * every member who hid themselves with `/visibility`.
 * @returns null when the intra knows no such project
 * @throws {FtError}
 */
export async function findHelpers(
	caller: Link,
	slug: string,
): Promise<{ project: FtProject; helpers: Helper[] } | null> {
	const token = await fetchAppToken('interactive');
	const project = await projects.get(slug, () => fetchProject(slug, token));
	if (!project) return null;

	const campusId = await campuses.get(caller.ftId, async () => {
		const user = await fetchUser(caller.ftId, token, 'interactive');
		return (user && primaryCampus(user)?.id) ?? null;
	});
	if (campusId === null) return { project, helpers: [] };

	const present = await campusLocations(campusId, 'interactive');
	const seats = new Map(present.map((location) => [location.user.id, location.host]));
	const links = (await visibleLinks(caller.guildId, [...seats.keys()])).filter(
		(link) => link.userId !== caller.userId,
	);
	const marks = await fetchValidations(
		project.slug,
		links.map((link) => link.ftId),
		token,
	);

	const helpers = links
		.filter((link) => marks.has(link.ftId))
		.map((link) => ({
			userId: link.userId,
			login: link.ftLogin,
			host: seats.get(link.ftId) ?? '?',
			mark: marks.get(link.ftId) ?? 0,
		}))
		.sort((a, b) => b.mark - a.mark || a.login.localeCompare(b.login));
	return { project, helpers };
}

/**
 * Builds the `/helpers` answer, as a Components V2 message body.
 * @remarks Members are mentioned so the caller can click through to them, but nobody is
 * pinged: the answer is ephemeral, and mentions are disabled anyway.
 */
export function helpersMessage(project: FtProject, helpers: Helper[], locale: string): unknown {
	const lines = helpers
		.slice(0, SHOWN)
		.map((helper) => `- <@${helper.userId}> · \`${helper.host}\` · ${helper.login} · **${helper.mark}**`);
	if (helpers.length > SHOWN) lines.push(t(locale, 'profile.more', { count: helpers.length - SHOWN }));

	const title = helpers.length
		? t(locale, 'helpers.title', { project: project.name, count: helpers.length })
		: t(locale, 'helpers.none', { project: project.name });

	return {
		flags: MessageFlags.IS_COMPONENTS_V2,
		allowed_mentions: { parse: [] },
		components: [
			{
				type: ComponentType.CONTAINER,
				components: [
					{ type: ComponentType.TEXT_DISPLAY, content: `### ${title}` },
					...(lines.length
						? [
								{ type: ComponentType.SEPARATOR, divider: true, spacing: 1 },
								{ type: ComponentType.TEXT_DISPLAY, content: lines.join('\n') },
							]
						: []),
					{ type: ComponentType.TEXT_DISPLAY, content: `-# ${t(locale, 'helpers.footer')}` },
				],
			},
		],
	};
}

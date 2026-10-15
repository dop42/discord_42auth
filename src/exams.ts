import { campusNamed } from './campus';
import { db } from './db/pool';
import { getGuild, postMessage } from './discord/rest';
import { ButtonStyle, ComponentType, MessageFlags } from './discord/types';
import { fetchAppToken, fetchCampusExams, type FtExam } from './ft/api';
import { resolveLocale, t } from './i18n';
import { forEachGuild } from './jobs';

/** How far ahead exams are announced. */
const WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** Where a student registers: the intra home lists the coming exams with their button. */
const REGISTER_URL = 'https://profile.intra.42.fr/';

/** A Discord timestamp, shown in each reader's own time zone and language. */
const stamp = (iso: string, style: string) => `<t:${Math.floor(Date.parse(iso) / 1000)}:${style}>`;

/**
 * Builds the message announcing one exam.
 * @remarks Named after the projects it lets students take, which says more than its title.
 * The times are Discord timestamps, so nobody reads them in the wrong time zone. Only the
 * intra's public facts are shown: name, time and room. The button opens the intra, where the
 * student registers with their own account.
 * @returns Components V2
 */
export function examMessage(exam: FtExam, campus: string, locale: string): unknown[] {
	const projects = (exam.projects ?? []).map((project) => project.name).join(' · ');
	const title = t(locale, 'exams.title', { projects: projects || exam.name });
	const when = `${stamp(exam.begin_at, 'F')} – ${stamp(exam.end_at, 't')} (${stamp(exam.begin_at, 'R')})`;
	const where = exam.location?.trim() || campus;
	return [
		{
			type: ComponentType.CONTAINER,
			components: [
				{ type: ComponentType.TEXT_DISPLAY, content: `### ${title}\n${when}\n${where}` },
				{
					type: ComponentType.ACTION_ROW,
					components: [
						{
							type: ComponentType.BUTTON,
							style: ButtonStyle.LINK,
							label: t(locale, 'exams.register'),
							url: REGISTER_URL,
						},
					],
				},
			],
		},
	];
}

/** A campus's exams, read once per campus and per run whatever the number of servers. */
type Lists = Map<number, Promise<FtExam[]>>;

/**
 * Announces, in each server's exam channel, the campus exams of the next two weeks not
 * announced there yet.
 * @remarks One message per exam, soonest first. An exam is remembered once posted; one that
 * could not be posted is tried again at the next run.
 */
export async function announceExams(now = new Date()): Promise<string | void> {
	const { rows } = await db().query<{ guild_id: string }>(
		'SELECT guild_id FROM guilds WHERE exam_channel_id IS NOT NULL AND campus IS NOT NULL',
	);
	// Announcements of exams long started are no use any more.
	await db().query("DELETE FROM exam_announcements WHERE begin_at < now() - interval '1 day'");
	if (!rows.length) return;

	let posted = 0;
	const lists: Lists = new Map();
	for (const { guild_id: guildId } of rows) {
		await forEachGuild('exams', async () => {
			posted += await announceGuildExams(guildId, now, lists);
		});
	}
	return posted ? `${posted} announced` : undefined;
}

/**
 * Announces one server's coming exams right away.
 * @remarks Called by the hourly job and when an admin saves an exam channel or a campus, so
 * the channel fills at once. A channel just chosen gets every coming exam, even the ones the
 * previous channel already had.
 * @param fresh forget what was announced before, for a channel just chosen
 * @returns how many messages were posted
 * @throws {FtError} when the intra cannot be read
 */
export async function announceGuildExams(
	guildId: string,
	now = new Date(),
	lists: Lists = new Map(),
	fresh = false,
): Promise<number> {
	const { rows } = await db().query<{ exam_channel_id: string | null; campus: string | null }>(
		'SELECT exam_channel_id, campus FROM guilds WHERE guild_id = $1',
		[guildId],
	);
	const channelId = rows[0]?.exam_channel_id;
	const campus = rows[0]?.campus ? await campusNamed(rows[0].campus) : null;
	if (fresh) await db().query('DELETE FROM exam_announcements WHERE guild_id = $1', [guildId]);
	if (!channelId || !campus) return 0;

	if (!lists.has(campus.id)) {
		lists.set(
			campus.id,
			fetchAppToken('background').then((token) =>
				fetchCampusExams(campus.id, now, new Date(+now + WINDOW_MS), token),
			),
		);
	}
	const exams = (await lists.get(campus.id)!)
		.filter((exam) => Date.parse(exam.begin_at) > +now)
		.sort((a, b) => a.begin_at.localeCompare(b.begin_at));
	const { rows: done } = await db().query<{ ft_id: number }>(
		'SELECT ft_id FROM exam_announcements WHERE guild_id = $1',
		[guildId],
	);
	const announced = new Set(done.map((row) => row.ft_id));
	const fresher = exams.filter((exam) => !announced.has(exam.id));
	if (!fresher.length) return 0;

	const locale = resolveLocale((await getGuild(guildId)).preferred_locale);
	let posted = 0;
	for (const exam of fresher) {
		const components = examMessage(exam, campus.name, locale);
		if (!(await postMessage(channelId, { flags: MessageFlags.IS_COMPONENTS_V2, components }))) break;
		await db().query(
			`INSERT INTO exam_announcements (guild_id, ft_id, begin_at) VALUES ($1, $2, $3)
			 ON CONFLICT DO NOTHING`,
			[guildId, exam.id, exam.begin_at],
		);
		posted++;
	}
	return posted;
}

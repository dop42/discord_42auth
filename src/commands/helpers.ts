import { deferred, ephemeral } from '../discord/responses';
import { editReply } from '../discord/rest';
import { optionValue, type Interaction } from '../discord/types';
import { findHelpers, helpersMessage, projectSlug } from '../helpers';
import { resolveLocale, t } from '../i18n';
import { findByMember, type Link } from '../links';
import { RateLimiter } from '../ratelimit';
import { getSettings } from '../settings';

/** Searches per member and per minute; a busy campus costs a few calls to the 42 API. */
const searches = new RateLimiter(5, 60_000);

/**
 * Answers `/helpers <project>` with the members on campus who validated it, only to the caller.
 * @remarks Off until the server's admins turn it on, and for members verified here only,
 * admins included: it tells where people sit. Deferred like `/profile`, then filled in by
 * `answer`.
 */
export async function handleHelpers(interaction: Interaction): Promise<Response> {
	const locale = resolveLocale(interaction.locale);
	const guildId = interaction.guild_id;
	const member = interaction.member;
	if (!guildId || !member) return ephemeral(t(locale, 'error.notInGuild'));

	if (!(await getSettings(guildId)).helpers) return ephemeral(t(locale, 'helpers.disabled'));
	const caller = await findByMember(guildId, member.user.id);
	if (!caller) return ephemeral(t(locale, 'helpers.verifyFirst'));

	const typed = optionValue(interaction, 'project');
	const slug = typeof typed === 'string' ? projectSlug(typed) : null;
	if (!slug) return ephemeral(t(locale, 'helpers.unknownProject', { project: String(typed ?? '') }));
	if (searches.take(caller.userId)) return ephemeral(t(locale, 'profile.slowDown'));

	void answer(interaction.token, caller, slug, locale);
	return deferred(true);
}

/** Searches the campus and replaces the "thinking…" reply; never throws, like `/profile`. */
async function answer(interactionToken: string, caller: Link, slug: string, locale: string): Promise<void> {
	try {
		const found = await findHelpers(caller, slug);
		await editReply(
			interactionToken,
			found
				? helpersMessage(found.project, found.helpers, locale)
				: { content: t(locale, 'helpers.unknownProject', { project: slug }) },
		);
	} catch (failure) {
		console.error(failure);
		await editReply(interactionToken, { content: t(locale, 'error.unknown') });
	}
}

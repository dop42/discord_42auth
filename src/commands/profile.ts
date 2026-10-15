import { deferred, ephemeral } from '../discord/responses';
import { editReply } from '../discord/rest';
import { optionValue, type Interaction } from '../discord/types';
import { fetchAppToken, fetchCoalitions, fetchUser } from '../ft/api';
import { resolveLocale, t } from '../i18n';
import { findByMember, type Link } from '../links';
import { profileMessage } from '../profile';
import { RateLimiter } from '../ratelimit';

/** Cards per member and per minute: each one costs two or three calls to the 42 API. */
const lookups = new RateLimiter(5, 60_000);

/**
 * Answers `/profile [member]` with the 42 card of a linked member, only to the caller.
 * @remarks Another member's card is shown to members verified on this server only, admins
 * included: it holds nothing the intra does not show every 42 account already, and that is
 * exactly who may read it — managing a Discord server does not make someone part of 42.
 * The reply is deferred, since the 42 rate limiter may hold the calls past Discord's three
 * seconds, and filled in by `answer`.
 */
export async function handleProfile(interaction: Interaction): Promise<Response> {
	const locale = resolveLocale(interaction.locale);
	const guildId = interaction.guild_id;
	const member = interaction.member;
	if (!guildId || !member) return ephemeral(t(locale, 'error.notInGuild'));

	const callerId = member.user.id;
	const picked = optionValue(interaction, 'member');
	const memberId = typeof picked === 'string' ? picked : callerId;
	const self = memberId === callerId;

	if (!self && !(await findByMember(guildId, callerId))) {
		return ephemeral(t(locale, 'profile.verifyFirst'));
	}
	const link = await findByMember(guildId, memberId);
	if (!link) return ephemeral(t(locale, self ? 'profile.selfNotLinked' : 'profile.notLinked'));
	if (lookups.take(callerId)) return ephemeral(t(locale, 'profile.slowDown'));

	void answer(interaction.token, link, self, locale);
	return deferred(true);
}

/**
 * Reads the profile from the intra and replaces the "thinking…" reply with the card.
 * @remarks Runs after the interaction was answered, so it cannot throw to anyone: every
 * failure ends as a message to the caller and a line in the logs.
 */
async function answer(interactionToken: string, link: Link, self: boolean, locale: string): Promise<void> {
	try {
		const token = await fetchAppToken('interactive');
		const user = await fetchUser(link.ftId, token, 'interactive');
		if (!user) {
			await editReply(interactionToken, { content: t(locale, 'profile.gone') });
			return;
		}
		const coalitions = await fetchCoalitions(user.id, token).catch(() => []);
		await editReply(interactionToken, profileMessage(user, coalitions, locale, { memberId: link.userId, self }));
	} catch (failure) {
		console.error(failure);
		await editReply(interactionToken, { content: t(locale, 'error.unknown') });
	}
}

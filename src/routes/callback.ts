import { addRole, getMember, postMessage, setNickname } from '../discord/rest';
import { ComponentType, MessageFlags } from '../discord/types';
import { fetchMe, primaryCampus, type FtUser } from '../ft/api';
import { exchangeCode, UsedCodeError } from '../ft/oauth';
import { localeFromHeader, t, type MessageKey } from '../i18n';
import { deleteLink, findByFtAccount, saveLink } from '../links';
import { redirectToGuild, renderPage } from '../page';
import { checkEligibility, nicknameFor, type Eligibility } from '../rules';
import { getSettings } from '../settings';
import { readState, type AuthState } from '../state';

/** The refusing arm of `Eligibility`, as the audit log receives it. */
type Refusal = Extract<Eligibility, { ok: false }>;

/**
 * @author dop42
 * @method handleCallback
 * @description Completes a verification: exchanges the code, checks the account, grants the role.
 * @remarks Registered as the redirect URI of the 42 application. The signed state says which
 * Discord member started the flow, in which server and in which language to answer; the code
 * proves which 42 account they own. Nothing else the browser sends decides anything: `error`
 * and `Accept-Language` only choose which page is shown. The link is saved before the role is
 * granted, so a member never holds the role without the record that justifies it; the
 * nickname is built before both because it is pure, so a throw cannot follow a grant.
 * @param request {Request}
 * @returns {Promise<Response>}
 */
export async function handleCallback(request: Request): Promise<Response> {
	const params = new URL(request.url).searchParams;
	const state = readState(params.get('state'));
	const locale = state?.locale ?? localeFromHeader(request.headers.get('accept-language'));

	const page = (title: MessageKey, body: MessageKey) =>
		renderPage(t(locale, title), t(locale, body), locale);

	if (params.get('error')) {
		return page('page.cancelled.title', 'page.cancelled.body');
	}

	const code = params.get('code');
	if (!state || !code) {
		return page('page.invalid.title', 'page.invalid.body');
	}

	try {
		const settings = await getSettings(state.guildId);
		if (!settings.roleId) {
			return page('page.notConfigured.title', 'page.notConfigured.body');
		}

		const user = await fetchMe(await exchangeCode(code));
		const campus = primaryCampus(user)?.name;

		let eligibility = checkEligibility(user, settings);
		if (eligibility.ok) eligibility = await claimAccount(state, user);
		if (!eligibility.ok) {
			await audit(settings.logChannelId, state, user.login, campus, eligibility);
			return renderPage(
				t(locale, 'page.refused.title'),
				t(locale, eligibility.reason, eligibility.params),
				locale,
			);
		}

		const nick = nicknameFor(user, settings);

		await saveLink({ guildId: state.guildId, userId: state.userId, ftId: user.id, ftLogin: user.login });
		await addRole(state.guildId, state.userId, settings.roleId);
		await audit(settings.logChannelId, state, user.login, campus);
		if (nick) await setNickname(state.guildId, state.userId, nick);
		return redirectToGuild(state.guildId);
	} catch (error) {
		console.error(error);
		if (error instanceof UsedCodeError) {
			return page('page.invalid.title', 'page.invalid.body');
		}
		return page('page.failed.title', 'page.failed.body');
	}
}

/**
 * @author dop42
 * @method claimAccount
 * @description Makes sure a 42 account vouches for one member per server only.
 * @remarks A 42 account already linked to another member is refused while that member is
 * still in the server, so one student cannot let a second Discord account in. Once they have
 * left, the old link is stale and released: that is how a student who lost their Discord
 * account gets back in without an admin. The same member verifying again passes untouched.
 * @param state {AuthState}
 * @param user {FtUser}
 * @returns {Promise<Eligibility>}
 */
async function claimAccount(state: AuthState, user: FtUser): Promise<Eligibility> {
	const holder = await findByFtAccount(state.guildId, user.id);
	if (!holder || holder.userId === state.userId) return { ok: true };
	if (await getMember(state.guildId, holder.userId)) {
		return { ok: false, reason: 'rule.alreadyLinked' };
	}
	await deleteLink(state.guildId, holder.userId);
	return { ok: true };
}

/**
 * @author dop42
 * @method audit
 * @description Records one attempt, accepted or refused, in the server's log channel.
 * @remarks Uses the server's language rather than the member's: this line is written for
 * the admins reading it. Mentions are disabled so the Discord id shows for the trail
 * without pinging anyone. Skipped entirely when no log channel is configured. These messages
 * are kept by Discord, under the server admins' control, not in this database.
 * @param channelId {string | null}
 * @param state {AuthState}
 * @param login {string}
 * @param campus {string | undefined}
 * @param refusal {Refusal | undefined}
 * @returns {Promise<void>}
 */
async function audit(
	channelId: string | null,
	state: AuthState,
	login: string,
	campus: string | undefined,
	refusal?: Refusal,
): Promise<void> {
	if (!channelId) return;

	const locale = state.guildLocale;
	const profile = `https://profile.intra.42.fr/users/${encodeURIComponent(login)}`;
	const rows = [
		`**${t(locale, 'log.discord')}** — <@${state.userId}> (\`${state.userId}\`)`,
		`**${t(locale, 'log.account')}** — [\`${login}\`](${profile})`,
		`**${t(locale, 'log.campus')}** — ${campus ?? t(locale, 'log.unknown')}`,
	];
	if (refusal) {
		rows.push(`**${t(locale, 'log.reason')}** — ${t(locale, refusal.reason, refusal.params)}`);
	}

	await postMessage(channelId, {
		flags: MessageFlags.IS_COMPONENTS_V2,
		allowed_mentions: { parse: [] },
		components: [
			{
				type: ComponentType.CONTAINER,
				components: [
					{
						type: ComponentType.TEXT_DISPLAY,
						content: `### ${t(locale, refusal ? 'log.refused' : 'log.ok')}`,
					},
					{ type: ComponentType.SEPARATOR, divider: true, spacing: 1 },
					{ type: ComponentType.TEXT_DISPLAY, content: rows.join('\n') },
					{
						type: ComponentType.TEXT_DISPLAY,
						content: `-# <t:${Math.floor(Date.now() / 1000)}:f>`,
					},
				],
			},
		],
	});
}

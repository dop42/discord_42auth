import { audit } from '../audit';
import { addRole, getMember, setNickname } from '../discord/rest';
import { fetchCoalitions, fetchMe, primaryCampus, type FtUser } from '../ft/api';
import { exchangeCode, UsedCodeError } from '../ft/oauth';
import { localeFromHeader, t, type MessageKey } from '../i18n';
import { deleteLink, findByFtAccount, saveLink } from '../links';
import { syncRuleRoles } from '../membership';
import { redirectToGuild, renderPage } from '../page';
import { checkEligibility, matchingRoles, nicknameFor, type Eligibility } from '../rules';
import { getSettings } from '../settings';
import { readState, type AuthState } from '../state';

/**
 * @author dop42
 * @method handleCallback
 * @description Completes a verification: exchanges the code, checks the account, grants the role.
 * @remarks Registered as the redirect URI of the 42 application. The signed state says which
 * Discord member started the flow, in which server and in which language to answer; the code
 * proves which 42 account they own. Nothing else the browser sends decides anything: `error`
 * and `Accept-Language` only choose which page is shown. The link is saved before the role is
 * granted, so a member never holds the role without the record that justifies it; the
 * nickname is built before both because it is pure, so a throw cannot follow a grant. The
 * rule roles come after the verified role and are best-effort: the weekly re-check
 * completes whatever failed.
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

		const token = await exchangeCode(code);
		const user = await fetchMe(token);
		const campus = primaryCampus(user)?.name;
		const entry = { userId: state.userId, login: user.login, campus };

		let eligibility = checkEligibility(user, settings);
		if (eligibility.ok) eligibility = await claimAccount(state, user);
		if (!eligibility.ok) {
			await audit(settings.logChannelId, state.guildLocale, {
				...entry,
				outcome: 'refused',
				reason: { key: eligibility.reason, params: eligibility.params },
			});
			return renderPage(
				t(locale, 'page.refused.title'),
				t(locale, eligibility.reason, eligibility.params),
				locale,
			);
		}

		const nick = nicknameFor(user, settings);
		const coalitions = settings.roleRules.some((rule) => rule.kind === 'coalition')
			? await fetchCoalitions(user.id, token).catch(() => [])
			: [];

		await saveLink({ guildId: state.guildId, userId: state.userId, ftId: user.id, ftLogin: user.login });
		await addRole(state.guildId, state.userId, settings.roleId);
		await audit(settings.logChannelId, state.guildLocale, { ...entry, outcome: 'ok' });
		if (nick) await setNickname(state.guildId, state.userId, nick);
		if (settings.roleRules.length) {
			const member = await getMember(state.guildId, state.userId);
			const wanted = matchingRoles(user, coalitions, settings.roleRules);
			if (member) await syncRuleRoles(state.guildId, member, wanted, settings);
		}
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

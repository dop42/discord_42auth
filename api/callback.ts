import { addRole, postMessage, setNickname } from '../src/discord/rest';
import { ComponentType, MessageFlags } from '../src/discord/types';
import { env } from '../src/env';
import { fetchMe, primaryCampus } from '../src/ft/api';
import { exchangeCode, UsedCodeError } from '../src/ft/oauth';
import { localeFromHeader, t, type MessageKey } from '../src/i18n';
import { renderPage } from '../src/page';
import { checkEligibility, nicknameFor, type Eligibility } from '../src/rules';
import { getSettings } from '../src/settings';
import { readState, type AuthState } from '../src/state';
import { toNodeHandler } from '../src/vercel';

/** The refusing arm of `Eligibility`, as the audit log receives it. */
type Refusal = Extract<Eligibility, { ok: false }>;

/**
 * @author dop42
 * @method handle
 * @description Completes a verification: exchanges the code, checks the account, grants the role.
 * @remarks Registered as the redirect URI of the 42 application. The signed state says which
 * Discord member started the flow and in which language to answer; the code proves which 42
 * account they own. Nothing else the browser sends decides anything: `error` and
 * `Accept-Language` only choose which page is shown, the latter standing in when no state
 * names the member. The guild is re-checked even though `createState` can only ever sign
 * this one, so two deployments sharing a `STATE_SECRET` cannot honour each other's links.
 * The nickname is built before the grant because it is pure: a throw after `addRole` would
 * tell the member the authentication failed while they already hold the role.
 * @param request {Request}
 * @returns {Promise<Response>}
 */
export async function handle(request: Request): Promise<Response> {
	const params = new URL(request.url).searchParams;
	const state = readState(params.get('state'));
	const locale = state?.locale ?? localeFromHeader(request.headers.get('accept-language'));

	const page = (ok: boolean, title: MessageKey, body: MessageKey, values?: Record<string, string>) =>
		renderPage(ok, t(locale, title, values), t(locale, body, values), locale);

	if (params.get('error')) {
		return page(false, 'page.cancelled.title', 'page.cancelled.body');
	}

	const code = params.get('code');
	if (!state || !code || state.guildId !== env.guildId) {
		return page(false, 'page.invalid.title', 'page.invalid.body');
	}

	try {
		const settings = getSettings();
		if (!settings.roleId) {
			return page(false, 'page.notConfigured.title', 'page.notConfigured.body');
		}

		const user = await fetchMe(await exchangeCode(code));
		const campus = primaryCampus(user)?.name;

		const eligibility = checkEligibility(user, settings);
		if (!eligibility.ok) {
			await audit(settings.logChannelId, state, user.login, campus, eligibility);
			return renderPage(
				false,
				t(locale, 'page.refused.title'),
				t(locale, eligibility.reason, eligibility.params),
				locale,
			);
		}

		const nick = nicknameFor(user, settings);

		await addRole(state.guildId, state.userId, settings.roleId);
		await audit(settings.logChannelId, state, user.login, campus);
		if (nick) await setNickname(state.guildId, state.userId, nick);
		return page(true, 'page.success.title', 'page.success.body', { login: user.login });
	} catch (error) {
		console.error(error);
		if (error instanceof UsedCodeError) {
			return page(false, 'page.invalid.title', 'page.invalid.body');
		}
		return page(false, 'page.failed.title', 'page.failed.body');
	}
}

/**
 * @author dop42
 * @method audit
 * @description Records one attempt, accepted or refused, in the log channel.
 * @remarks Uses the server's language rather than the member's: this line is written for
 * the admins reading it. Mentions are disabled so the Discord id shows for the trail
 * without pinging anyone. Skipped entirely when no log channel is configured.
 * @param channelId {string | undefined}
 * @param state {AuthState}
 * @param login {string}
 * @param campus {string | undefined}
 * @param refusal {Refusal | undefined}
 * @returns {Promise<void>}
 */
async function audit(
	channelId: string | undefined,
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

export default toNodeHandler(handle);

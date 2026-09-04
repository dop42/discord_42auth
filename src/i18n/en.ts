/**
 * Reference bundle.
 *
 * @remarks `cmd.*` entries are sent to Discord as command localizations and must stay
 * at most 100 characters. `{placeholders}` are filled in by `t()`.
 */
export const en = {
	// Slash command descriptions.
	'cmd.auth': 'Verify your 42 account to get access to this server',
	'cmd.config': 'Show the 42 authentication settings of this server',

	// Errors from the interaction handler and both commands.
	'error.notInGuild': 'This command only works inside a server.',
	'error.wrongGuild': 'This bot is configured for another server.',
	'error.unknown': 'Something went wrong. Ask an admin to check the deployment logs.',

	// /auth
	'auth.notConfigured': 'This server is not configured yet — an admin must set `ROLE_ID` on the deployment.',
	'auth.link': 'Click here to verify your 42 account: {url}\n_This link is personal and expires in 5 minutes._',

	// /config
	'config.noPermission': 'You need the **Manage Server** permission to see the settings.',

	// /config — the settings display.
	'show.role': 'Role',
	'show.role.unset': '_not set, `/auth` is disabled_',
	'show.campus': 'Campus',
	'show.campus.any': '_any_',
	'show.students': 'Active students only',
	'show.nickname': 'Nickname',
	'show.nickname.off': 'unchanged',
	'show.nickname.login': 'intra login (`jdoe`)',
	'show.nickname.full': 'full name + login (`John Doe (jdoe)`)',
	'show.logs': 'Log channel',
	'show.logs.none': '_none_',
	'show.yes': 'yes',
	'show.no': 'no',
	'show.hint': 'These settings come from environment variables — change them on Vercel, then redeploy.',

	// Access rules, shown both to the member and in the audit log.
	'rule.inactive': 'This 42 account is not active (alumni or closed account).',
	'rule.wrongCampus': 'This server is restricted to {campus}, your campus is {userCampus}.',

	// Pages closing the OAuth flow.
	'page.cancelled.title': 'Authentication cancelled',
	'page.cancelled.body': 'You denied access to your 42 account.',
	'page.invalid.title': 'Invalid link',
	'page.invalid.body': 'This link is expired or malformed. Run /auth again.',
	'page.refused.title': 'Access refused',
	'page.notConfigured.title': 'Server not configured',
	'page.notConfigured.body': 'No role is set up yet. Ask an admin to set ROLE_ID on the deployment.',
	'page.success.title': 'Welcome, {login}!',
	'page.success.body': 'Your role has been granted — you can go back to Discord.',
	'page.failed.title': 'Authentication failed',
	'page.failed.body': 'Something went wrong on our side. Try again in a moment.',

	// Audit log message (Components V2 container).
	'log.ok': 'Authentication succeeded',
	'log.refused': 'Authentication refused',
	'log.discord': 'Discord',
	'log.account': '42 account',
	'log.campus': 'Campus',
	'log.reason': 'Reason',
	'log.unknown': 'unknown',
};

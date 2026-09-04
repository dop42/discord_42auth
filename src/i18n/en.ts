/**
 * Reference bundle.
 *
 * @remarks `cmd.*` entries are sent to Discord as command localizations and must stay
 * at most 100 characters. `{placeholders}` are filled in by `t()`.
 */
export const en = {
	// Slash command descriptions.
	'cmd.config': 'Show the 42 authentication settings of this server',
	'cmd.panel': 'Post the verification panel in this channel',

	// Errors from the interaction handler and both commands.
	'error.notInGuild': 'This command only works inside a server.',
	'error.wrongGuild': 'This bot is configured for another server.',
	'error.unknown': 'Something went wrong. Ask an admin to check the deployment logs.',

	// Verification link, handed out by the panel button.
	'auth.notConfigured': 'This server is not configured yet — an admin must set `ROLE_ID` on the deployment.',
	'auth.notice': 'Log in with the button below. This link is personal and expires in five minutes — never share it.',
	'auth.button': 'Log in on the 42 intranet',

	// Verification panel.
	'panel.title': '42 verification',
	'panel.body': 'Link your 42 account to get access to this server.',
	'panel.button': 'Verify',

	// /config
	'config.noPermission': 'You need the **Manage Server** permission to see the settings.',

	// /config — the settings display.
	'show.role': 'Role',
	'show.role.unset': '_not set, verification is disabled_',
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
	'page.invalid.body': 'This link is expired or malformed. Press the verification button again.',
	'page.refused.title': 'Access refused',
	'page.notConfigured.title': 'Server not configured',
	'page.notConfigured.body': 'No role is set up yet. Ask an admin to set ROLE_ID on the deployment.',
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

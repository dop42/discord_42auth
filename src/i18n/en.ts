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
	'cmd.forget': 'Erase your 42 link on this server and give back the verified role',

	// Errors from the interaction handler and the commands.
	'error.notInGuild': 'This command only works inside a server.',
	'error.unknown': 'Something went wrong. Try again in a moment.',

	// Verification link, handed out by the panel button.
	'auth.notConfigured': 'This server is not configured yet — an admin must choose a role on the dashboard.',
	'auth.title': 'Your verification link',
	'auth.notice': 'Log in on the 42 intranet with the button below, then come back here: your role is given right away.',
	'auth.warning': 'Personal link, valid for 5 minutes. Never share it: whoever uses it verifies **you**.',
	'auth.privacy': 'Your Discord account stays linked to your 42 login while you are on this server · `/forget` erases it · [Privacy]({privacy})',
	'auth.button': 'Log in on the 42 intranet',

	// Verification panel.
	'panel.title': '42 verification',
	'panel.body': 'This server is reserved for **42 students**.\nLink your intra account to get in.',
	'panel.steps': '**1.** Press **Verify** below\n**2.** Log in on the 42 intranet\n**3.** Your role is given right away',
	'panel.button': 'Verify',

	// /config
	'config.noPermission': 'You need the **Manage Server** permission to see the settings.',

	// /forget — the member erasing their own link.
	'forget.done': 'Your 42 link on this server is erased and the verified role is removed.',
	'forget.none': 'No 42 account is linked to you on this server.',
	'forget.roleKept': 'Your 42 link is erased, but the verified role could not be removed — ask an admin.',

	// /config — the settings display.
	'show.title': 'Settings of this server',
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
	'show.kind.coalition': 'coalition',
	'show.kind.cursus': 'cursus',
	'show.kind.campus': 'campus',
	'show.rules.none': '_none_',
	'show.rules': 'Extra roles',
	'show.no': 'no',
	'show.dashboard': 'Open the dashboard',

	// Access rules, shown both to the member and in the audit log.
	'rule.inactive': 'This 42 account is not active (alumni or closed account).',
	'rule.wrongCampus': 'This server is restricted to {campus}, your campus is {userCampus}.',
	'rule.alreadyLinked': 'This 42 account is already linked to another member of this server.',

	// Pages closing the OAuth flow.
	'page.cancelled.title': 'Authentication cancelled',
	'page.cancelled.body': 'You denied access to your 42 account.',
	'page.invalid.title': 'Invalid link',
	'page.invalid.body': 'This link is expired or malformed. Press the verification button again.',
	'page.refused.title': 'Access refused',
	'page.notConfigured.title': 'Server not configured',
	'page.notConfigured.body': 'No role is set up yet. Ask an admin to choose one on the dashboard.',
	'page.failed.title': 'Authentication failed',
	'page.failed.body': 'Something went wrong on our side. Try again in a moment.',

	// Audit log message (Components V2 container).
	'log.ok': 'Authentication succeeded',
	'log.refused': 'Authentication refused',
	'log.revoked': 'Verification revoked',
	'log.member': 'Member',
	'log.account': '42 account',
	'log.campus': 'Campus',
	'log.reason': 'Reason',
	'log.unknown': 'unknown',
	'log.id': 'Discord ID',
};

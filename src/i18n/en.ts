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
	'cmd.profile': 'Show the 42 profile of a verified member, only to you',
	'cmd.profile.member': 'Member to look up; yourself when left empty',
	'cmd.helpers': 'Find members on campus right now who validated a project',
	'cmd.helpers.project': 'Project name or slug, e.g. minishell or cpp-module-00',
	'cmd.visibility': 'Choose whether /helpers and the hall of fame may show you on this server',
	'cmd.visibility.shown': 'True to be listed, False to stay hidden',
	'cmd.logtime': 'Show your time on campus this month, or in a given month, only to you',
	'cmd.logtime.month': 'Month as YYYY-MM, e.g. 2026-09; the current month when empty',
	'cmd.reminder': 'Get a private message some days before your 42 deadline (blackhole)',
	'cmd.reminder.days': 'How many days before; 0 turns the reminder off',

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
	'show.helpers': 'Campus helpers (/helpers)',
	'show.fame': 'Hall of fame',
	'show.events': 'Campus events',
	'show.exams': 'Exams',
	'show.counter': 'Campus counter',
	'show.automod': 'AutoMod',
	'show.yes': 'yes',
	'show.kind.coalition': 'coalition',
	'show.kind.cursus': 'cursus',
	'show.kind.campus': 'campus',
	'show.kind.level': 'level ≥',
	'show.kind.project': 'validated project',
	'show.kind.pool': 'piscine',
	'show.rules.none': '_none_',
	'show.rules': 'Extra roles',
	'show.no': 'no',
	'show.dashboard': 'Open the dashboard',

	// /profile — a member's 42 card, read live from the intra.
	'profile.verifyFirst': 'Verify your own 42 account on this server first to see other members\' profiles.',
	'profile.selfNotLinked': 'You are not verified on this server yet — press **Verify** on the panel.',
	'profile.notLinked': 'This member has not linked a 42 account on this server.',
	'profile.slowDown': 'Too many profiles in a short time. Try again in a minute.',
	'profile.gone': 'This 42 account no longer exists on the intra.',
	'profile.level': 'level {level}',
	'profile.more': '+{count} more',
	'profile.validated': 'Validated projects',
	'profile.inProgress': 'In progress',
	'profile.none': '_none_',
	'profile.location': 'Location',
	'profile.offCampus': '_not logged in on campus_',
	'profile.pool': 'Piscine',
	'profile.deadline': 'Deadline',
	'profile.points': 'Evaluation points',
	'profile.wallet': 'Wallet',
	'profile.footer': 'read live from the intra, nothing is kept',

	// /helpers and /visibility — who on campus can help with a project.
	'helpers.disabled': '`/helpers` is not enabled on this server — an admin can turn it on in the dashboard.',
	'helpers.verifyFirst': 'Verify your own 42 account on this server first to use `/helpers`.',
	'helpers.unknownProject': 'No project named `{project}` on the intra. Try its slug, e.g. `cpp-module-00`.',
	'helpers.title': '{project} — {count} on campus who validated it',
	'helpers.none': 'Nobody from this server on campus right now has validated {project}.',
	'helpers.footer': 'members of this server logged in on your campus · `/visibility` to hide yourself',
	'visibility.shown': '`/helpers` and the hall of fame may show you on this server again.',
	'visibility.hidden': '`/helpers` and the hall of fame will no longer show you on this server.',

	// Hall of fame, campus events and counter, /logtime, /reminder, Linked Roles.
	'fame.line': '{member} validated **{project}** — **{mark}**',
	'events.exam': 'Exam · {projects}',
	'events.noDescription': 'Campus event, copied from the 42 intra.',
	'events.link': 'See it on the intra',
	'counter.name': '{count} on campus · {here} here',
	'automod.spam': 'Suspected spam',
	'automod.mentions': 'Mention spam',
	'automod.language': 'Profanity, sexual content and slurs',
	'automod.custom': 'Custom words',
	'logtime.badMonth': 'Write the month as YYYY-MM, e.g. 2026-09, and not in the future.',
	'logtime.title': 'Time on campus — {month}',
	'logtime.month': 'Month',
	'logtime.week': 'This week',
	'logtime.today': 'Today',
	'logtime.footer': 'read live from the intra, nothing is kept · time zone {zone}',
	'reminder.bad': 'Give a number of days between 0 and 60.',
	'reminder.on': 'Done: you will get a private message {days} days before your deadline. Make sure your privacy settings let this server send you private messages.',
	'reminder.off': 'Reminder turned off.',
	'reminder.message': 'Your 42 deadline is {relative} ({date}). Keep going! `/reminder days:0` turns this message off.',
	'linked.done.title': 'Linked Roles connected',
	'linked.done.body': 'Your Discord profile now shows your 42 level, updated every week. You can close this page.',
	'linked.none.title': 'No 42 account linked',
	'linked.none.body': 'Verify your 42 account on a server that uses this bot first, then try again.',

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

import type { Messages } from './fr';

/** Every string of the dashboard, in English. */
export const en: Messages = {
	appName: '42 Auth',
	loading: 'Loading…',
	retry: 'Retry',
	back: 'Back to servers',
	skip: 'Skip to content',
	crumb: 'Breadcrumb',
	'theme.toLight': 'Switch to light theme',
	'theme.toDark': 'Switch to dark theme',
	'locale.label': 'Language',

	'landing.eyebrow': 'Discord bot · 42 intra',
	'landing.title': [
		{ text: 'Keep', accent: false },
		{ text: 'your', accent: false },
		{ text: 'server', accent: false },
		{ text: 'for', accent: false },
		{ text: '42', accent: true },
		{ text: 'students', accent: true },
	],
	'landing.lead':
		'One button, one intra login, one role. Only valid 42 accounts get in — and the bot forgets everything as soon as the member leaves.',
	'landing.steps.title': 'How it works',
	'landing.steps': [
		{
			n: '01',
			title: 'The panel',
			text: 'Post the panel from the dashboard or with /panel. Members press “Verify”.',
		},
		{
			n: '02',
			title: 'The intra',
			text: 'They log in with their 42 account. The bot checks it is active and, if you want, from the right campus.',
		},
		{
			n: '03',
			title: 'The role',
			text: 'The role is granted, plus those of their campus, cursus or coalition. Everything is checked again every week.',
		},
	],
	'landing.login': 'Log in with Discord',
	'landing.invite': 'Add the bot',

	'header.logout': 'Log out',
	'header.login': 'Log in',
	'guilds.eyebrow': 'Dashboard',
	'guilds.title': 'Your',
	'guilds.titleAccent': 'servers',
	'guilds.list': 'Servers',
	'guilds.present': 'Bot active',
	'guilds.hint': 'Only servers where you have the “Manage Server” permission are listed.',
	'guilds.empty': 'No server to manage. You need the “Manage Server” permission.',
	'guilds.configure': 'Configure',
	'guilds.add': 'Add the bot',
	'guilds.absent': 'Bot missing',

	'settings.eyebrow': 'Server settings',
	'tabs.label': 'Server sections',
	'tabs.settings': 'Settings',
	'tabs.members': 'Members',
	'settings.verified': (n: number) => (n === 1 ? 'verified member' : 'verified members'),
	'settings.role': 'Granted role',
	'settings.role.help':
		'Given to members whose 42 account is accepted. Without a role, verification is disabled.',
	'settings.role.none': '— None (verification disabled) —',
	'settings.role.above': 'above the bot’s role',
	'settings.role.warn':
		'Some roles sit above the bot’s role: Discord does not let the bot grant them. In Server Settings → Roles, drag the bot’s role above the role to grant.',
	'settings.campus': 'Campus',
	'settings.campus.help':
		'Spelled as on the intra (e.g. “Paris”). Leave empty to accept every campus.',
	'settings.campus.any': 'Every campus',
	'settings.students': 'Active students only',
	'settings.students.help':
		'Refuses alumni. Closed accounts are always refused; staff are always accepted. Checked again every week: a member who becomes alumni loses the role.',
	'settings.nickname': 'Nickname of verified members',
	'settings.nickname.help':
		'The name shown on the server after verification. The login becomes visible to every member.',
	'settings.nickname.off': 'Unchanged',
	'settings.nickname.offExample': 'current nickname',
	'settings.nickname.login': 'Intra login',
	'settings.nickname.full': 'Full name and login',
	'settings.logs': 'Log channel',
	'settings.logs.none': 'None',
	'settings.logs.help':
		'One message per attempt (accepted or refused) and per verification revoked by the weekly check: Discord ID, 42 login, campus, reason.',
	'settings.logs.retention':
		'These messages stay in Discord, under the server admins’ responsibility. Delete them according to your retention policy — 3 months at most is a reasonable period.',
	'settings.rules': 'Extra roles',
	'settings.rules.help':
		'Given on top of the verified role, to members meeting the condition. Checked again every week: the piscine role goes when the piscine ends.',
	'settings.rules.kind': 'Condition',
	'settings.rules.value': 'Value',
	'settings.rules.role': 'Granted role',
	'settings.rules.pickRole': 'Pick a role',
	'settings.rules.kinds': {
		campus: 'Campus',
		cursus: 'Current cursus',
		coalition: 'Coalition',
	},
	'settings.rules.placeholders': {
		campus: 'Paris',
		cursus: '42cursus or c-piscine',
		coalition: 'The Order',
	},
	'settings.rules.add': 'Add a rule',
	'settings.rules.remove': (n: number) => `Remove rule ${String(n)}`,
	'settings.rules.rule': (n: number) => `Rule ${String(n)}`,
	'settings.rules.empty': 'No rule: only the verified role is granted.',
	'settings.rules.max': 'You reached the maximum of 25 rules.',
	'settings.rules.invalid': (n: number) =>
		`Rule ${String(n)} was refused: empty value, or a role the bot cannot grant.`,
	'settings.dirty': 'Unsaved changes',
	'settings.clean': 'Everything is saved',
	'settings.reset': 'Discard',
	'settings.save': 'Save',
	'settings.saving': 'Saving…',
	'settings.leaveConfirm': 'Some changes are not saved. Leave anyway?',
	'settings.saved': 'Settings saved.',
	'settings.invalid': 'The server refused this field.',
	'settings.error': 'Saving failed. Try again.',

	'panel.title': 'Verification panel',
	'panel.help':
		'Posts the message with the “Verify” button in a channel, like /panel. It stays valid forever.',
	'panel.channel': 'Channel',
	'panel.pick': 'Pick a channel',
	'panel.post': 'Post the panel',
	'panel.posting': 'Posting…',
	'panel.posted': (name: string) => `Panel posted in #${name}.`,
	'panel.cannotPost':
		'The bot could not write in this channel. Check it can see it and send messages there.',
	'panel.error': 'Posting failed. Try again.',
	'panel.needsRole':
		'Pick and save a role first: without it, the button answers that the server is not configured.',

	'members.title': 'Verified members',
	'members.help':
		'The Discord ↔ 42 link of each member. Unlinking removes the link, and the roles and nickname the bot gave; the member can verify again.',
	'members.search': 'Search',
	'members.searchPlaceholder': '42 login or Discord ID',
	'members.login': '42 login',
	'members.discord': 'Discord ID',
	'members.date': 'Verified on',
	'members.actions': 'Actions',
	'members.empty': 'No verified member yet.',
	'members.noMatch': 'No member matches this search.',
	'members.unlink': 'Unlink',
	'members.unlinkLabel': (login: string) => `Unlink ${login}`,
	'members.confirm': 'Confirm',
	'members.confirmLabel': (login: string) => `Confirm: unlink ${login}`,
	'members.cancel': 'Cancel',
	'members.unlinked': (login: string) => `${login} was unlinked.`,
	'members.unlinkError': 'Could not unlink this member. Try again.',
	'members.loadError': 'Could not load the members.',
	'members.copy': (id: string) => `Copy ID ${id}`,
	'members.copied': 'ID copied.',
	'members.prev': 'Previous',
	'members.next': 'Next',
	'members.page': (page: number, pages: number) => `Page ${String(page)} of ${String(pages)}`,
	'members.total': (n: number) => (n === 1 ? '1 member' : `${String(n)} members`),

	'danger.title': 'Danger zone',
	'danger.body':
		'Deletes the settings and every Discord ↔ 42 link of this server. Roles already granted are not removed.',
	'danger.button': 'Delete all data of this server',
	'danger.confirm': (name: string) => `Type “${name}” to confirm.`,
	'danger.cancel': 'Cancel',
	'danger.submit': 'Delete permanently',
	'danger.error': 'Deletion failed. Try again.',

	'error.forbidden': 'You do not have the “Manage Server” permission on this server.',
	'error.notFound': 'The bot is not in this server.',
	'error.generic': 'Could not load the data.',
	'error.rateLimited': 'Too many requests. Wait a minute before trying again.',

	'footer.tagline':
		'Keeps a Discord server for 42 intra accounts, without keeping anything more than needed.',
	'footer.legal': 'Legal',
	'footer.operator': 'Operator',
	'footer.unaffiliated': 'Not affiliated with Discord Inc. or 42.',
	'footer.privacy': 'Privacy',
	'footer.terms': 'Terms of use',

	'legal.privacy': 'Privacy policy',
	'legal.terms': 'Terms of use',
	'legal.updated': 'Last updated:',

	date: (iso: string) =>
		new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(iso)),
};

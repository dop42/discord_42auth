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
			text: 'The role is granted, plus those of their campus, cursus, coalition, level or projects. Everything is checked again every week.',
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

	'sections.label': 'Settings categories',
	'sections.settings': 'Categories',
	'sections.actions': 'Actions',
	'sections.unsaved': 'unsaved changes',
	'sections.access': 'Access',
	'sections.access.lead': 'Who gets in, and the role that opens the server.',
	'sections.members': 'Verified members',
	'sections.members.lead':
		'What the bot gives each verified member: roles and nickname, checked again every week.',
	'sections.features': 'Features',
	'sections.features.lead':
		'What the bot does for the server’s life: peer help, hall of fame, events, counter, and the verification log.',
	'sections.moderation': 'Moderation',
	'sections.moderation.lead':
		'Discord AutoMod filters the bot keeps in place on the server. A blocked message is never posted; admins and members with Manage Server are not filtered. The bot needs the Manage Server permission.',
	'switch.on': 'On',
	'switch.off': 'Off',
	'settings.refused': 'A setting was refused: fix the highlighted field, then save.',
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
	'settings.helpers': 'Campus helpers',
	'settings.helpers.help':
		'Lets verified members run /helpers minishell to see who from the server is on campus right now and validated the project, with their seat. Each member can hide themselves with /visibility.',
	'settings.off': 'Off',
	'settings.fame': 'Hall of fame',
	'settings.fame.help':
		'The bot announces in this channel every project a member validates, with the mark, without pinging anyone. Members hidden with /visibility are never announced.',
	'settings.events': 'Campus events',
	'settings.events.help':
		'Copies the events and exams of the next two weeks into the server’s Discord events as soon as you save, then updated every hour. The bot needs the Manage Events permission.',
	'settings.events.events': 'Events',
	'settings.events.exams': 'Exams',
	'settings.counter': 'Campus counter',
	'settings.counter.help':
		'Renames this voice channel as soon as you save, then every 10 minutes, with how many people are on campus, and how many of them are members of the server. The bot needs the Manage Channels permission.',
	'settings.needsCampus': 'Needs a campus, set in the Access category.',
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
		'Given on top of the verified role, to members meeting the condition. Checked again every week: the piscine role goes when the piscine ends, a level role comes once it is reached.',
	'settings.rules.kind': 'Condition',
	'settings.rules.value': 'Value',
	'settings.rules.role': 'Granted role',
	'settings.rules.pickRole': 'Pick a role',
	'settings.rules.kinds': {
		campus: 'Campus',
		cursus: 'Current cursus',
		coalition: 'Coalition',
		level: 'Level at least',
		project: 'Validated project',
		pool: 'Piscine',
	},
	'settings.rules.placeholders': {
		campus: 'Paris',
		cursus: '42cursus or c-piscine',
		coalition: 'The Order',
		level: '10',
		project: 'minishell',
		pool: '2025 or 2025-07',
	},
	'settings.rules.add': 'Add a rule',
	'settings.rules.remove': (n: number) => `Remove rule ${String(n)}`,
	'settings.rules.rule': (n: number) => `Rule ${String(n)}`,
	'settings.rules.empty': 'No rule: only the verified role is granted.',
	'settings.rules.max': 'You reached the maximum of 25 rules.',
	'settings.rules.invalid': (n: number) =>
		`Rule ${String(n)} was refused: empty or malformed value (a level is a number, a piscine is 2025 or 2025-07), or a role the bot cannot grant.`,
	'settings.dirty': 'Unsaved changes',
	'settings.clean': 'Everything is saved',
	'settings.reset': 'Discard',
	'settings.save': 'Save',
	'settings.saving': 'Saving…',
	'settings.leaveConfirm': 'Some changes are not saved. Leave anyway?',
	'settings.saved': 'Settings saved.',
	'settings.invalid': 'The server refused this field.',
	'settings.error': 'Saving failed. Try again.',
	'settings.automodForbidden':
		'Discord refused the AutoMod rules: the bot needs the Manage Server permission. Nothing was saved.',
	'settings.automodFailed': 'Discord refused the AutoMod rules. Nothing was saved. Try again.',
	'settings.automod.spam': 'Suspected spam',
	'settings.automod.spam.help':
		'Discord’s own spam detection: blocks messages it recognises as spam, such as mass-sent links and scams.',
	'settings.automod.mentions': 'Mention spam',
	'settings.automod.mentions.help':
		'Blocks a message mentioning too many members or roles at once, and stops mention raids.',
	'settings.automod.mentions.limit': 'Mentions allowed per message',
	'settings.automod.language': 'Profanity, sexual content and slurs',
	'settings.automod.language.help':
		'Blocks the words of the three lists Discord maintains, in every language it supports.',
	'settings.automod.custom': 'Custom words',
	'settings.automod.custom.help':
		'One word or phrase per line, 60 characters at most. A * matches the rest of a word: *spoiler* also blocks “spoilers”. Leave empty to turn it off.',
	'settings.automod.custom.count': (n: number, max: number) =>
		`${n === 1 ? '1 word' : `${String(n)} words`} of ${String(max)}`,
	'settings.automod.custom.invalid': (max: number) =>
		`A word was refused: ${String(max)} characters at most each.`,
	'settings.automod.mentions.invalid': (max: number) =>
		`Choose a number between 1 and ${String(max)}.`,
	'settings.automod.alert': 'Alert channel',
	'settings.automod.alert.help':
		'Discord posts a report here for every message AutoMod blocks: who, where, and the message.',

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
	'permissions.title': 'The bot is missing permissions on this server:',
	'permissions.help':
		'The features needing them fail until they are granted. Discord never adds a permission to the role the bot was invited with: authorise the bot again on this server, it stays where it is.',
	'permissions.grant': 'Grant the permissions',
	'permissions.names': {
		manageRoles: 'Manage Roles',
		manageNicknames: 'Manage Nicknames',
		viewChannel: 'View Channels',
		sendMessages: 'Send Messages',
		manageEvents: 'Manage Events',
		createEvents: 'Create Events',
		manageChannels: 'Manage Channels',
		manageGuild: 'Manage Server',
	},
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

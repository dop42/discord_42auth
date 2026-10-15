import type { GuildDetail } from '@shared/api';

export const sampleDetail = (): GuildDetail => ({
	guild: { id: '100000000000000001', name: '42 Test', icon: null },
	settings: {
		roleId: '200000000000000001',
		campus: null,
		studentsOnly: true,
		nickname: 'login',
		logChannelId: null,
		roleRules: [],
		helpers: false,
		fameChannelId: null,
		syncEvents: false,
		syncExams: false,
		counterChannelId: null,
		automodSpam: false,
		automodMentions: null,
		automodLanguage: false,
		automodKeywords: [],
		automodAlertChannelId: null,
	},
	roles: [
		{ id: '200000000000000002', name: 'Staff', color: 0xff0000, assignable: false },
		{ id: '200000000000000001', name: 'Verified', color: 0, assignable: true },
	],
	channels: [{ id: '300000000000000001', name: 'logs' }],
	voiceChannels: [{ id: '300000000000000002', name: 'Général' }],
	verifiedCount: 3,
	missingPermissions: [],
	inviteUrl: 'https://discord.com/oauth2/authorize?client_id=1',
});

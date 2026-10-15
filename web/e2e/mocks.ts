import type { Page, Route } from '@playwright/test';
import type {
	GuildDetail,
	GuildSettings,
	LinkedMember,
	Me,
	Meta,
	PanelRequest,
} from '../../shared/api';

export const meta: Meta = {
	operator: { name: 'Opérateur Test', contact: 'rgpd@example.org' },
	hosting: 'France (auto-hébergé)',
	inviteUrl: 'https://discord.com/oauth2/authorize?client_id=1',
};

export const me: Me = {
	user: { id: '400000000000000001', username: 'admin', avatar: null },
	guilds: [
		{
			id: '100000000000000001',
			name: '42 Test',
			icon: null,
			botPresent: true,
			inviteUrl: 'https://discord.com/oauth2/authorize?guild_id=100000000000000001',
		},
		{
			id: '100000000000000002',
			name: 'Sans bot',
			icon: null,
			botPresent: false,
			inviteUrl: 'https://discord.com/oauth2/authorize?guild_id=100000000000000002',
		},
	],
};

export const detail: GuildDetail = {
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
		examChannelId: null,
		counterChannelId: null,
		automodSpam: false,
		automodMentions: null,
		automodLanguage: false,
		automodKeywords: [],
		automodAlertChannelId: null,
	},
	roles: [
		{ id: '200000000000000002', name: 'Staff', color: 0xff0000, assignable: false },
		{ id: '200000000000000001', name: 'Verified', color: 0x5865f2, assignable: true },
	],
	channels: [{ id: '300000000000000001', name: 'logs' }],
	voiceChannels: [{ id: '300000000000000002', name: 'Général' }],
	verifiedCount: 12,
	missingPermissions: [],
	inviteUrl: 'https://discord.com/oauth2/authorize?client_id=1',
};

const json = (route: Route, status: number, body?: unknown) =>
	route.fulfill({
		status,
		contentType: 'application/json',
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
	});

export interface Recorded {
	saved: GuildSettings[];
	deleted: string[];
	unlinked: string[];
	panels: PanelRequest[];
}

const freshMembers = (): LinkedMember[] => [
	{ userId: '500000000000000001', ftLogin: 'jdoe', verifiedAt: '2026-10-01T10:00:00.000Z' },
	{ userId: '500000000000000002', ftLogin: 'asmith', verifiedAt: '2026-09-20T10:00:00.000Z' },
];

/** Mocks the whole backend. `loggedIn: false` makes `/api/me` answer 204, as with no session. */
export async function mockApi(page: Page, { loggedIn }: { loggedIn: boolean }): Promise<Recorded> {
	const recorded: Recorded = { saved: [], deleted: [], unlinked: [], panels: [] };
	let members = freshMembers();
	await page.route('**/api/meta', (route) => json(route, 200, meta));
	await page.route('**/api/me', (route) => (loggedIn ? json(route, 200, me) : json(route, 204)));
	await page.route('**/api/guilds/*', async (route) => {
		const request = route.request();
		if (request.method() === 'GET') return json(route, 200, detail);
		if (request.method() === 'PUT') {
			const body = request.postDataJSON() as GuildSettings;
			recorded.saved.push(body);
			return json(route, 200, body);
		}
		if (request.method() === 'DELETE') {
			recorded.deleted.push(request.url());
			return json(route, 204);
		}
		return json(route, 405, { error: 'method' });
	});
	await page.route('**/api/guilds/*/members**', async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		if (request.method() === 'DELETE') {
			const userId = url.pathname.split('/').at(-1) ?? '';
			recorded.unlinked.push(userId);
			members = members.filter((m) => m.userId !== userId);
			return json(route, 204);
		}
		const q = (url.searchParams.get('q') ?? '').toLowerCase();
		const found = members.filter((m) => m.ftLogin.includes(q) || m.userId === q);
		return json(route, 200, { members: found, total: found.length, page: 0, pageSize: 50 });
	});
	await page.route('**/api/guilds/*/panel', async (route) => {
		const body = route.request().postDataJSON() as PanelRequest;
		recorded.panels.push(body);
		return json(route, 204);
	});
	return recorded;
}

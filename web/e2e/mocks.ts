import type { Page, Route } from '@playwright/test';
import type { GuildDetail, GuildSettings, Me, Meta } from '../../shared/api';

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
	},
	roles: [
		{ id: '200000000000000002', name: 'Staff', color: 0xff0000, assignable: false },
		{ id: '200000000000000001', name: 'Verified', color: 0x5865f2, assignable: true },
	],
	channels: [{ id: '300000000000000001', name: 'logs' }],
	verifiedCount: 12,
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
}

/** Mocks the whole backend. `loggedIn: false` makes `/api/me` answer 401. */
export async function mockApi(page: Page, { loggedIn }: { loggedIn: boolean }): Promise<Recorded> {
	const recorded: Recorded = { saved: [], deleted: [] };
	await page.route('**/api/meta', (route) => json(route, 200, meta));
	await page.route('**/api/me', (route) =>
		loggedIn ? json(route, 200, me) : json(route, 401, { error: 'unauthenticated' }),
	);
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
	return recorded;
}

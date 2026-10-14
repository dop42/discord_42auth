import type { ApiError, GuildDetail, GuildSettings, Me, Meta } from '@shared/api';

/** A non-2xx answer, carrying the status and the server's `{ error, field }` body when it sent one. */
export class HttpError extends Error {
	constructor(
		readonly status: number,
		readonly body: ApiError | null,
	) {
		super(body?.error ?? `HTTP ${String(status)}`);
		this.name = 'HttpError';
	}

	get unauthenticated(): boolean {
		return this.status === 401;
	}
}

function isApiError(value: unknown): value is ApiError {
	return (
		typeof value === 'object' &&
		value !== null &&
		'error' in value &&
		typeof value.error === 'string'
	);
}

/**
 * Calls the backend on the same origin. The session cookie travels on its own; the browser
 * adds the `Origin` header the server checks on writes.
 */
export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	const init: RequestInit = {
		method,
		credentials: 'same-origin',
		headers: { Accept: 'application/json' },
	};
	if (body !== undefined) {
		init.headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
		init.body = JSON.stringify(body);
	}

	const response = await fetch(path, init);
	if (!response.ok) {
		let parsed: unknown = null;
		try {
			parsed = await response.json();
		} catch {
			// Not JSON (a proxy error page, say): keep null and report the status alone.
		}
		throw new HttpError(response.status, isApiError(parsed) ? parsed : null);
	}
	if (response.status === 204) return undefined as T;
	return (await response.json()) as T;
}

export const api = {
	meta: () => request<Meta>('GET', '/api/meta'),
	me: () => request<Me>('GET', '/api/me'),
	logout: () => request<undefined>('POST', '/auth/logout'),
	guild: (id: string) => request<GuildDetail>('GET', `/api/guilds/${encodeURIComponent(id)}`),
	saveGuild: (id: string, settings: GuildSettings) =>
		request<GuildSettings>('PUT', `/api/guilds/${encodeURIComponent(id)}`, settings),
	deleteGuild: (id: string) =>
		request<undefined>('DELETE', `/api/guilds/${encodeURIComponent(id)}`),
};

export const avatarUrl = (id: string, hash: string) =>
	`https://cdn.discordapp.com/avatars/${id}/${hash}.webp?size=64`;
export const guildIconUrl = (id: string, hash: string) =>
	`https://cdn.discordapp.com/icons/${id}/${hash}.webp?size=96`;

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** First user-perceived character, so an emoji or accented letter is never cut in half. */
const firstGrapheme = (word: string) =>
	graphemes.segment(word)[Symbol.iterator]().next().value?.segment ?? '';

/** Up to two initials, the way Discord shows a server without an icon. */
export const initials = (name: string) =>
	name.split(/\s+/).filter(Boolean).slice(0, 2).map(firstGrapheme).join('').toUpperCase() || '?';

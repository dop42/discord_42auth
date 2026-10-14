import type { MemberPage } from '@shared/api';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api, HttpError } from '@/api/client';

type LoadState = 'idle' | 'loading' | 'ready' | 'rateLimited' | 'error';

/** One page of a server's verified members, with the current search. */
export const useMembersStore = defineStore('members', () => {
	const guildId = ref<string | null>(null);
	const query = ref('');
	const page = ref(0);
	const data = ref<MemberPage | null>(null);
	const loadState = ref<LoadState>('idle');

	const pages = computed(() =>
		data.value ? Math.max(1, Math.ceil(data.value.total / data.value.pageSize)) : 1,
	);

	/** Lets the caller react to a 401 (send the user back to the landing page). */
	let onUnauthenticated: () => void = () => undefined;
	function setUnauthenticatedHandler(handler: () => void): void {
		onUnauthenticated = handler;
	}

	/** Later answers win over earlier ones: typing fast must not show a stale page. */
	let ticket = 0;

	async function load(id: string, nextQuery = query.value, nextPage = page.value): Promise<void> {
		if (id !== guildId.value) data.value = null;
		guildId.value = id;
		query.value = nextQuery;
		page.value = nextPage;
		loadState.value = 'loading';
		const mine = ++ticket;
		try {
			const result = await api.members(id, nextQuery.trim(), nextPage);
			if (mine !== ticket) return;
			data.value = result;
			loadState.value = 'ready';
		} catch (error) {
			if (mine !== ticket) return;
			if (error instanceof HttpError && error.unauthenticated) {
				onUnauthenticated();
				return;
			}
			loadState.value =
				error instanceof HttpError && error.rateLimited ? 'rateLimited' : 'error';
		}
	}

	/** Returns true once the member is unlinked; the page is then reloaded. */
	async function unlink(userId: string): Promise<boolean> {
		if (!guildId.value) return false;
		try {
			await api.unlink(guildId.value, userId);
		} catch (error) {
			if (error instanceof HttpError && error.unauthenticated) onUnauthenticated();
			return false;
		}
		const lastOnPage = data.value?.members.length === 1 && page.value > 0;
		await load(guildId.value, query.value, lastOnPage ? page.value - 1 : page.value);
		return true;
	}

	return {
		guildId,
		query,
		page,
		data,
		loadState,
		pages,
		load,
		unlink,
		setUnauthenticatedHandler,
	};
});

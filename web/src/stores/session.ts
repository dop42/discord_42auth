import type { Me } from '@shared/api';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, HttpError } from '@/api/client';

type Status = 'idle' | 'loading' | 'anonymous' | 'ready' | 'error';

/** The signed-in admin and the servers they may manage. */
export const useSessionStore = defineStore('session', () => {
	const me = ref<Me | null>(null);
	const status = ref<Status>('idle');

	async function load(): Promise<void> {
		status.value = 'loading';
		try {
			me.value = await api.me();
			status.value = 'ready';
		} catch (error) {
			me.value = null;
			status.value =
				error instanceof HttpError && error.unauthenticated ? 'anonymous' : 'error';
		}
	}

	/** Called when any request answers 401: the session expired under our feet. */
	function expire(): void {
		me.value = null;
		status.value = 'anonymous';
	}

	async function logout(): Promise<void> {
		try {
			await api.logout();
		} finally {
			window.location.assign('/');
		}
	}

	return { me, status, load, expire, logout };
});

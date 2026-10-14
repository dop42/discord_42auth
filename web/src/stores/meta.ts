import type { Meta } from '@shared/api';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';

/** Public facts about this instance: who runs it, where, and how to add the bot. */
export const useMetaStore = defineStore('meta', () => {
	const meta = ref<Meta | null>(null);
	let pending: Promise<void> | null = null;

	function load(): Promise<void> {
		pending ??= api
			.meta()
			.then((value) => {
				meta.value = value;
			})
			.catch((error: unknown) => {
				pending = null;
				console.error(error);
			});
		return pending;
	}

	return { meta, load };
});

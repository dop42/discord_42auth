import type { GuildDetail, GuildSettings } from '@shared/api';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api, HttpError } from '@/api/client';

type LoadState = 'idle' | 'loading' | 'ready' | 'forbidden' | 'notFound' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'invalid' | 'error';

const same = (a: GuildSettings, b: GuildSettings) =>
	a.roleId === b.roleId &&
	a.campus === b.campus &&
	a.studentsOnly === b.studentsOnly &&
	a.nickname === b.nickname &&
	a.logChannelId === b.logChannelId;

/** The server being edited: what is saved, what the form holds, and how the last save went. */
export const useGuildStore = defineStore('guild', () => {
	const detail = ref<GuildDetail | null>(null);
	const draft = ref<GuildSettings | null>(null);
	const loadState = ref<LoadState>('idle');
	const saveState = ref<SaveState>('idle');
	const invalidField = ref<keyof GuildSettings | null>(null);

	const dirty = computed(
		() =>
			detail.value !== null &&
			draft.value !== null &&
			!same(detail.value.settings, draft.value),
	);

	/** Lets the caller react to a 401 (send the user back to the landing page). */
	let onUnauthenticated: () => void = () => undefined;
	function setUnauthenticatedHandler(handler: () => void): void {
		onUnauthenticated = handler;
	}

	function fail(error: unknown): boolean {
		if (error instanceof HttpError && error.unauthenticated) {
			onUnauthenticated();
			return true;
		}
		return false;
	}

	function hydrate(value: GuildDetail): void {
		detail.value = value;
		draft.value = { ...value.settings };
		saveState.value = 'idle';
		invalidField.value = null;
	}

	async function load(id: string): Promise<void> {
		loadState.value = 'loading';
		detail.value = null;
		draft.value = null;
		try {
			hydrate(await api.guild(id));
			loadState.value = 'ready';
		} catch (error) {
			if (fail(error)) return;
			const status = error instanceof HttpError ? error.status : 0;
			loadState.value = status === 403 ? 'forbidden' : status === 404 ? 'notFound' : 'error';
		}
	}

	async function save(): Promise<void> {
		if (!detail.value || !draft.value) return;
		const settings: GuildSettings = {
			...draft.value,
			campus: draft.value.campus?.trim() ? draft.value.campus.trim() : null,
		};
		saveState.value = 'saving';
		invalidField.value = null;
		try {
			const saved = await api.saveGuild(detail.value.guild.id, settings);
			detail.value = { ...detail.value, settings: saved };
			draft.value = { ...saved };
			saveState.value = 'saved';
		} catch (error) {
			if (fail(error)) return;
			if (
				error instanceof HttpError &&
				error.status === 400 &&
				error.body?.error === 'invalid'
			) {
				invalidField.value = error.body.field ?? null;
				saveState.value = 'invalid';
			} else {
				saveState.value = 'error';
			}
		}
	}

	/** Drops the unsaved edits. */
	function reset(): void {
		if (!detail.value) return;
		draft.value = { ...detail.value.settings };
		invalidField.value = null;
		saveState.value = 'idle';
	}

	/** Returns true once the server's data is gone. */
	async function erase(): Promise<boolean> {
		if (!detail.value) return false;
		try {
			await api.deleteGuild(detail.value.guild.id);
			return true;
		} catch (error) {
			fail(error);
			return false;
		}
	}

	return {
		detail,
		draft,
		loadState,
		saveState,
		invalidField,
		dirty,
		hydrate,
		load,
		save,
		reset,
		erase,
		setUnauthenticatedHandler,
	};
});

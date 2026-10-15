import type { GuildDetail, GuildSettings } from '@shared/api';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api, HttpError } from '@/api/client';

type LoadState = 'idle' | 'loading' | 'ready' | 'forbidden' | 'notFound' | 'error';
type SaveState =
	| 'idle'
	| 'saving'
	| 'saved'
	| 'invalid'
	| 'rateLimited'
	| 'automodForbidden'
	| 'automodFailed'
	| 'error';

const sameRules = (a: GuildSettings['roleRules'], b: GuildSettings['roleRules']) =>
	a.length === b.length &&
	a.every((rule, i) => {
		const other = b[i];
		return (
			other !== undefined &&
			rule.kind === other.kind &&
			rule.value === other.value &&
			rule.roleId === other.roleId
		);
	});

/** Every setting, in the order the form shows them. */
const FIELDS: Array<keyof GuildSettings> = [
	'roleId',
	'campus',
	'studentsOnly',
	'roleRules',
	'nickname',
	'helpers',
	'fameChannelId',
	'examChannelId',
	'counterChannelId',
	'logChannelId',
	'automodSpam',
	'automodMentions',
	'automodLanguage',
	'automodKeywords',
	'automodAlertChannelId',
];

/** The settings that differ between two versions; empty when they are the same. */
const differences = (a: GuildSettings, b: GuildSettings) =>
	new Set(
		FIELDS.filter((field) =>
			field === 'roleRules'
				? !sameRules(a.roleRules, b.roleRules)
				: field === 'automodKeywords'
					? a.automodKeywords.join('\n') !== b.automodKeywords.join('\n')
					: a[field] !== b[field],
		),
	);

const same = (a: GuildSettings, b: GuildSettings) => differences(a, b).size === 0;

/** A copy the form can edit without touching what is saved. */
const copy = (settings: GuildSettings): GuildSettings => ({
	...settings,
	roleRules: settings.roleRules.map((rule) => ({ ...rule })),
	automodKeywords: [...settings.automodKeywords],
});

/** The server being edited: what is saved, what the form holds, and how the last save went. */
export const useGuildStore = defineStore('guild', () => {
	const detail = ref<GuildDetail | null>(null);
	const draft = ref<GuildSettings | null>(null);
	const loadState = ref<LoadState>('idle');
	const saveState = ref<SaveState>('idle');
	const invalidField = ref<keyof GuildSettings | null>(null);
	/** For an invalid `roleRules`: which rule, from 0. */
	const invalidIndex = ref<number | null>(null);

	/** The settings edited and not saved yet, so the navigation can point at them. */
	const changed = computed(() =>
		detail.value && draft.value
			? differences(detail.value.settings, draft.value)
			: new Set<keyof GuildSettings>(),
	);
	const dirty = computed(() => changed.value.size > 0);

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
		draft.value = copy(value.settings);
		saveState.value = 'idle';
		invalidField.value = null;
		invalidIndex.value = null;
	}

	/** Bumped by every load, so a reply for a server the user already left is dropped. */
	let loading = 0;

	async function load(id: string): Promise<void> {
		const ticket = ++loading;
		loadState.value = 'loading';
		detail.value = null;
		draft.value = null;
		try {
			const value = await api.guild(id);
			if (ticket !== loading) return;
			hydrate(value);
			loadState.value = 'ready';
		} catch (error) {
			if (ticket !== loading || fail(error)) return;
			const status = error instanceof HttpError ? error.status : 0;
			loadState.value = status === 403 ? 'forbidden' : status === 404 ? 'notFound' : 'error';
		}
	}

	async function save(): Promise<void> {
		if (!detail.value || !draft.value) return;
		const sent = copy(draft.value);
		const ticket = loading;
		const settings: GuildSettings = {
			...copy(draft.value),
			campus: draft.value.campus?.trim() ? draft.value.campus.trim() : null,
		};
		saveState.value = 'saving';
		invalidField.value = null;
		invalidIndex.value = null;
		try {
			const saved = await api.saveGuild(detail.value.guild.id, settings);
			// Another server was opened meanwhile: this reply is not about the form on screen.
			if (ticket !== loading) return;
			detail.value = { ...detail.value, settings: saved };
			// Edits typed while the request was in flight stay in the form, still unsaved.
			if (same(draft.value, sent)) draft.value = copy(saved);
			saveState.value = 'saved';
		} catch (error) {
			if (fail(error)) return;
			if (
				error instanceof HttpError &&
				error.status === 400 &&
				error.body?.error === 'invalid'
			) {
				const field = error.body.field;
				invalidField.value = field && field !== 'channelId' ? field : null;
				invalidIndex.value = error.body.index ?? null;
				saveState.value = 'invalid';
			} else if (error instanceof HttpError && error.body?.error === 'automod_forbidden') {
				saveState.value = 'automodForbidden';
			} else if (error instanceof HttpError && error.body?.error === 'automod_failed') {
				saveState.value = 'automodFailed';
			} else if (error instanceof HttpError && error.rateLimited) {
				saveState.value = 'rateLimited';
			} else {
				saveState.value = 'error';
			}
		}
	}

	/** Drops the unsaved edits. */
	function reset(): void {
		if (!detail.value) return;
		draft.value = copy(detail.value.settings);
		invalidField.value = null;
		invalidIndex.value = null;
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
		invalidIndex,
		changed,
		dirty,
		hydrate,
		load,
		save,
		reset,
		erase,
		setUnauthenticatedHandler,
	};
});

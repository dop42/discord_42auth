<script setup lang="ts">
import { Check, Send } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { api, HttpError } from '@/api/client';
import BaseButton from '@/components/ui/BaseButton.vue';
import { useGuildStore } from '@/stores/guild';
import { usePrefsStore } from '@/stores/prefs';

type State = 'idle' | 'posting' | 'posted' | 'cannotPost' | 'rateLimited' | 'error';

const store = useGuildStore();
const prefs = usePrefsStore();
const channelId = ref('');
const state = ref<State>('idle');
const postedIn = ref('');

const channels = computed(() => store.detail?.channels ?? []);
/** The button only works once a role is saved, not merely picked in the form. */
const configured = computed(() => Boolean(store.detail?.settings.roleId));

async function post(): Promise<void> {
	if (!store.detail || !channelId.value || state.value === 'posting') return;
	state.value = 'posting';
	try {
		await api.postPanel(store.detail.guild.id, { channelId: channelId.value });
		postedIn.value = channels.value.find((c) => c.id === channelId.value)?.name ?? '';
		state.value = 'posted';
	} catch (error) {
		if (error instanceof HttpError && error.body?.error === 'cannot_post') {
			state.value = 'cannotPost';
		} else if (error instanceof HttpError && error.rateLimited) {
			state.value = 'rateLimited';
		} else {
			state.value = 'error';
		}
	}
}
</script>

<template>
	<section class="panel" aria-labelledby="panel-title">
		<div class="panel__label">
			<h2 id="panel-title" class="panel__title">{{ prefs.t['panel.title'] }}</h2>
			<p class="hint">{{ prefs.t['panel.help'] }}</p>
		</div>
		<form class="panel__control" @submit.prevent="post">
			<p v-if="!configured" class="notice">{{ prefs.t['panel.needsRole'] }}</p>
			<label for="panel-channel" class="visually-hidden">{{
				prefs.t['panel.channel']
			}}</label>
			<div class="panel__row">
				<select
					id="panel-channel"
					v-model="channelId"
					class="field"
					:disabled="!configured"
					@change="state = 'idle'"
				>
					<option value="" disabled>{{ prefs.t['panel.pick'] }}</option>
					<option v-for="channel in channels" :key="channel.id" :value="channel.id">
						#{{ channel.name }}
					</option>
				</select>
				<BaseButton
					type="submit"
					variant="solid"
					size="md"
					:disabled="!configured || !channelId || state === 'posting'"
				>
					<Send :size="14" :stroke-width="1.8" aria-hidden="true" />
					{{ state === 'posting' ? prefs.t['panel.posting'] : prefs.t['panel.post'] }}
				</BaseButton>
			</div>
			<p aria-live="polite" class="panel__status">
				<span v-if="state === 'posted'" class="panel__ok">
					<Check :size="16" :stroke-width="2" aria-hidden="true" />
					{{ prefs.t['panel.posted'](postedIn) }}
				</span>
				<span v-else-if="state === 'cannotPost'" class="error-text">{{
					prefs.t['panel.cannotPost']
				}}</span>
				<span v-else-if="state === 'rateLimited'" class="error-text">{{
					prefs.t['error.rateLimited']
				}}</span>
				<span v-else-if="state === 'error'" class="error-text">{{
					prefs.t['panel.error']
				}}</span>
			</p>
		</form>
	</section>
</template>

<style scoped>
.panel {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 1.25rem;
	padding: clamp(1.75rem, 3.5vw, 2.5rem) var(--pad);
	border-top: 1px solid var(--border);
}

.panel__label {
	display: grid;
	align-content: start;
	gap: 0.5rem;
}

.panel__label .hint {
	max-width: 44ch;
}

.panel__title {
	font-size: clamp(1.1875rem, 1.05rem + 0.5vw, 1.4375rem);
	font-weight: 500;
	line-height: 1.3;
	letter-spacing: -0.02em;
}

.panel__control {
	display: grid;
	align-content: start;
	gap: 0.75rem;
	min-width: 0;
}

.panel__row {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 0.75rem;
}

.notice {
	padding: 0.875rem 1rem;
	border: 1px solid var(--border);
	border-radius: var(--radius-m);
	background: var(--bg-elevated);
	color: var(--fg-muted);
	font-size: 0.875rem;
	line-height: 1.55;
}

.panel__status {
	min-height: 1.25rem;
	font-size: 0.875rem;
}

.panel__ok {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--ok);
}

@media (min-width: 560px) {
	.panel__row {
		grid-template-columns: minmax(0, 1fr) auto;
	}
}

@media (min-width: 960px) {
	.panel {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
		gap: clamp(2rem, 5vw, 5rem);
	}
}
</style>

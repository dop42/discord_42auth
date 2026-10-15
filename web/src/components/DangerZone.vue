<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';
import { computed, ref, useTemplateRef } from 'vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import { useGuildStore } from '@/stores/guild';
import { usePrefsStore } from '@/stores/prefs';

const prefs = usePrefsStore();

const props = defineProps<{ guildName: string }>();
const emit = defineEmits<{ erased: [] }>();

const store = useGuildStore();
const dialog = useTemplateRef<HTMLDialogElement>('dialog');
const typed = ref('');
const busy = ref(false);
const failed = ref(false);
const matches = computed(() => typed.value.trim() === props.guildName.trim());

function open(): void {
	typed.value = '';
	failed.value = false;
	dialog.value?.showModal();
}

function close(): void {
	dialog.value?.close();
}

async function confirm(): Promise<void> {
	if (!matches.value || busy.value) return;
	busy.value = true;
	failed.value = false;
	const ok = await store.erase();
	busy.value = false;
	if (ok) {
		close();
		emit('erased');
	} else {
		failed.value = true;
	}
}
</script>

<template>
	<section class="danger" aria-labelledby="danger-title">
		<div class="danger__text">
			<h2 id="danger-title" class="danger__title">{{ prefs.t['danger.title'] }}</h2>
			<p class="hint">{{ prefs.t['danger.body'] }}</p>
		</div>
		<div>
			<BaseButton variant="danger" @click="open">
				<Trash2 :size="16" :stroke-width="1.6" aria-hidden="true" />
				{{ prefs.t['danger.button'] }}
			</BaseButton>
		</div>

		<dialog ref="dialog" aria-labelledby="danger-dialog-title" class="dialog">
			<form method="dialog" class="dialog__body" @submit.prevent="confirm">
				<h2 id="danger-dialog-title" class="dialog__title">
					{{ prefs.t['danger.button'] }}
				</h2>
				<p class="hint">{{ prefs.t['danger.body'] }}</p>
				<label for="confirm-name" class="dialog__label">{{
					prefs.t['danger.confirm'](guildName)
				}}</label>
				<input
					id="confirm-name"
					v-model="typed"
					type="text"
					autocomplete="off"
					class="field"
				/>
				<p v-if="failed" role="alert" class="error-text">{{ prefs.t['danger.error'] }}</p>
				<div class="dialog__actions">
					<BaseButton variant="ghost" size="sm" @click="close">{{
						prefs.t['danger.cancel']
					}}</BaseButton>
					<BaseButton
						type="submit"
						variant="solid"
						size="sm"
						:disabled="!matches || busy"
						>{{ prefs.t['danger.submit'] }}</BaseButton
					>
				</div>
			</form>
		</dialog>
	</section>
</template>

<style scoped>
.danger {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 1.25rem;
	padding: clamp(2rem, 4vw, 3rem) var(--pad);
	border-top: 1px solid var(--border);
	background: repeating-linear-gradient(135deg, var(--bg) 0 12px, var(--bg-elevated) 12px 24px);
}

/* Le libellé est long : sur mobile, le bouton passe à la ligne plutôt que d'élargir la page. */
.danger > div > :deep(.btn) {
	height: auto;
	min-height: 2.75rem;
	padding-block: 0.625rem;
	white-space: normal;
	text-align: left;
}

.danger__text {
	display: grid;
	gap: 0.5rem;
}

.danger__title {
	font-size: clamp(1.1875rem, 1.05rem + 0.5vw, 1.4375rem);
	font-weight: 500;
	letter-spacing: -0.02em;
}

.danger .hint {
	max-width: 52ch;
}

.dialog {
	width: min(30rem, calc(100vw - 2rem));
	margin: auto;
	padding: 0;
	border: 1px solid var(--border);
	border-radius: var(--radius-l);
	background: var(--bg);
	color: var(--fg);
	box-shadow: var(--shadow-pop);
}

.dialog::backdrop {
	background: linear-gradient(180deg, rgb(10 10 10 / 35%), rgb(10 10 10 / 60%));
	backdrop-filter: blur(4px);
}

.dialog__body {
	display: grid;
	gap: 1rem;
	padding: 1.75rem;
}

.dialog__title {
	font-size: 1.25rem;
	font-weight: 500;
	letter-spacing: -0.02em;
}

.dialog__label {
	font-size: 0.9375rem;
	font-weight: 400;
}

.dialog__actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
	margin-top: 0.5rem;
}

@container (min-width: 48rem) {
	.danger {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
		gap: clamp(2rem, 5vw, 5rem);
		align-items: center;
	}
}
</style>

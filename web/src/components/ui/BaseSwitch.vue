<script setup lang="ts">
import { usePrefsStore } from '@/stores/prefs';

/**
 * An on/off switch that says its state in words, not by position alone.
 * @remarks A real `role="switch"` button: Space and Enter toggle it, and screen readers read
 * `aria-checked`. The visible "On"/"Off" is hidden from them, since they already hear it.
 */
defineProps<{
	id: string;
	labelledby: string;
	describedby?: string | undefined;
	invalid?: boolean;
}>();
const on = defineModel<boolean>({ required: true });
const prefs = usePrefsStore();
</script>

<template>
	<div class="switch-row">
		<button
			:id="id"
			type="button"
			role="switch"
			:aria-checked="on"
			:aria-labelledby="labelledby"
			:aria-describedby="describedby"
			:aria-invalid="invalid || undefined"
			:class="['switch', { 'switch--on': on, 'field--invalid': invalid }]"
			@click="on = !on"
		>
			<span class="switch__track" aria-hidden="true" />
			<span class="switch__thumb" aria-hidden="true" />
		</button>
		<span class="switch-row__state" aria-hidden="true">{{
			on ? prefs.t['switch.on'] : prefs.t['switch.off']
		}}</span>
	</div>
</template>

<style scoped>
.switch-row {
	display: flex;
	align-items: center;
	gap: 0.875rem;
}

.switch-row__state {
	color: var(--fg-muted);
	font-size: 0.875rem;
}

.switch {
	position: relative;
	flex: none;
	width: 3.5rem;
	height: 2rem;
	padding: 0;
	border: 1px solid var(--border-input);
	border-radius: 999px;
	background: var(--bg-elevated);
	box-shadow: var(--shadow-well);
	cursor: pointer;
	transition: border-color 0.2s ease;
}

.switch:hover {
	border-color: var(--fg-muted);
}

/* Piste noire quand il est actif. */
.switch__track {
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: var(--switch-on);
	opacity: 0;
	transition: opacity 0.25s ease;
}

/* Éteint, le bouton est gris franc : il se voit sur le fond clair comme sur le sombre. */
.switch__thumb {
	position: absolute;
	top: 50%;
	left: 0.1875rem;
	width: 1.5rem;
	height: 1.5rem;
	border-radius: 50%;
	background: var(--fg-faint);
	box-shadow: var(--shadow-pop);
	translate: 0 -50%;
	transition:
		transform 0.25s var(--ease-out),
		background-color 0.25s ease;
}

.switch--on {
	border-color: transparent;
}

.switch--on .switch__track {
	opacity: 1;
}

.switch--on .switch__thumb {
	background: var(--bg);
	transform: translateX(1.5rem);
}
</style>

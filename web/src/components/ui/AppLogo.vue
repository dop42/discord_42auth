<script setup lang="ts">
import { usePrefsStore } from '@/stores/prefs';
import { LOGO_PATH, LOGO_VIEWBOX } from '@shared/logo';

withDefaults(defineProps<{ name?: boolean }>(), { name: true });

const prefs = usePrefsStore();
</script>

<template>
	<span class="logo">
		<svg class="logo__mark" :viewBox="LOGO_VIEWBOX" aria-hidden="true" focusable="false">
			<path :d="LOGO_PATH" />
		</svg>
		<span v-if="name" class="logo__name">{{ prefs.t.appName }}</span>
	</span>
</template>

<style scoped>
.logo {
	display: inline-flex;
	align-items: center;
	gap: 0.5em;
	white-space: nowrap;
	font-size: 1.125rem;
	font-weight: 500;
	letter-spacing: -0.02em;
}

/* Plum on the light theme, pink on the dark one: the accent colour of each. */
.logo__mark {
	height: 1.5em;
	width: auto;
	fill: var(--accent-strong);
	flex: none;
}
</style>

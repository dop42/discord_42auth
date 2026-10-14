<script setup lang="ts">
import { guildIconUrl, initials } from '@/api/client';

withDefaults(defineProps<{ id: string; name: string; icon: string | null; size?: number }>(), {
	size: 48,
});
</script>

<template>
	<img
		v-if="icon"
		:src="guildIconUrl(id, icon)"
		alt=""
		:width="size"
		:height="size"
		loading="lazy"
		decoding="async"
		class="avatar"
		:style="{ '--size': `${String(size)}px` }"
	/>
	<span
		v-else
		aria-hidden="true"
		class="avatar avatar--initials"
		:style="{ '--size': `${String(size)}px` }"
		>{{ initials(name) }}</span
	>
</template>

<style scoped>
.avatar {
	flex: none;
	width: var(--size);
	height: var(--size);
	border-radius: 30%;
	box-shadow: 0 0 0 1px var(--border);
}

.avatar--initials {
	display: grid;
	place-items: center;
	background: var(--bg-elevated);
	color: var(--fg-muted);
	font-size: calc(var(--size) * 0.32);
	font-weight: 500;
	letter-spacing: -0.02em;
}
</style>

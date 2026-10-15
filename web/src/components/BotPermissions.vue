<script setup lang="ts">
import { TriangleAlert } from 'lucide-vue-next';
import BaseButton from '@/components/ui/BaseButton.vue';
import { useGuildStore } from '@/stores/guild';
import { usePrefsStore } from '@/stores/prefs';

const store = useGuildStore();
const prefs = usePrefsStore();
</script>

<template>
	<div
		v-if="store.detail?.missingPermissions.length"
		class="perms"
		role="status"
		aria-labelledby="perms-title"
	>
		<TriangleAlert class="perms__icon" :size="18" :stroke-width="1.8" aria-hidden="true" />
		<div class="perms__body">
			<p id="perms-title" class="perms__title">{{ prefs.t['permissions.title'] }}</p>
			<ul class="perms__list">
				<li v-for="name in store.detail.missingPermissions" :key="name">
					{{ prefs.t['permissions.names'][name] }}
				</li>
			</ul>
			<p class="perms__help">{{ prefs.t['permissions.help'] }}</p>
			<div>
				<BaseButton :href="store.detail.inviteUrl" variant="solid" size="sm">{{
					prefs.t['permissions.grant']
				}}</BaseButton>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Bandeau sous l'en-tête du serveur, tant qu'il manque une permission au bot. */
.perms {
	display: flex;
	gap: 0.875rem;
	margin: 0 var(--pad) 1.5rem;
	padding: 1rem 1.125rem;
	border: 1px solid color-mix(in oklch, var(--warn) 30%, transparent);
	border-radius: var(--radius-m);
	background: var(--warn-soft);
	color: var(--warn);
}

.perms__icon {
	flex: none;
	margin-top: 0.15rem;
}

.perms__body {
	display: grid;
	gap: 0.625rem;
	min-width: 0;
}

.perms__title {
	font-weight: 500;
}

.perms__list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.375rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.perms__list li {
	padding: 0.25rem 0.625rem;
	border: 1px solid color-mix(in oklch, var(--warn) 35%, transparent);
	border-radius: 999px;
	font-size: 0.8125rem;
}

.perms__help {
	color: var(--fg-muted);
	font-size: 0.875rem;
	line-height: 1.55;
}
</style>

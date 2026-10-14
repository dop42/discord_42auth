<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import DangerZone from '@/components/DangerZone.vue';
import SettingsForm from '@/components/SettingsForm.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import GuildAvatar from '@/components/ui/GuildAvatar.vue';
import { fr } from '@/i18n/fr';
import { useGuildStore } from '@/stores/guild';
import { useSessionStore } from '@/stores/session';

const props = defineProps<{ id: string }>();
const store = useGuildStore();
const session = useSessionStore();
const router = useRouter();

store.setUnauthenticatedHandler(() => {
	session.expire();
	void router.replace('/');
});

onMounted(() => void store.load(props.id));
watch(
	() => props.id,
	(id) => void store.load(id),
);

async function onErased(): Promise<void> {
	await session.load();
	await router.push('/');
}
</script>

<template>
	<nav class="crumb" aria-label="Fil d’Ariane">
		<RouterLink to="/" class="crumb__back">
			<ArrowLeft :size="16" :stroke-width="1.6" aria-hidden="true" />
			{{ fr.back }}
		</RouterLink>
	</nav>

	<p v-if="store.loadState === 'loading' || store.loadState === 'idle'" class="rule pad state">
		{{ fr.loading }}
	</p>
	<p v-else-if="store.loadState === 'forbidden'" role="alert" class="rule pad state">
		{{ fr['error.forbidden'] }}
	</p>
	<p v-else-if="store.loadState === 'notFound'" role="alert" class="rule pad state">
		{{ fr['error.notFound'] }}
	</p>
	<div v-else-if="store.loadState === 'error'" role="alert" class="rule pad state">
		<p>{{ fr['error.generic'] }}</p>
		<BaseButton variant="ghost" size="sm" @click="store.load(id)">{{ fr.retry }}</BaseButton>
	</div>

	<template v-else-if="store.detail && store.draft">
		<header class="rule pad head">
			<GuildAvatar
				:id="store.detail.guild.id"
				:name="store.detail.guild.name"
				:icon="store.detail.guild.icon"
				:size="72"
			/>
			<div class="head__text">
				<p class="eyebrow">{{ fr['settings.eyebrow'] }}</p>
				<h1 class="head__title">{{ store.detail.guild.name }}</h1>
			</div>
			<p class="count">
				<span class="count__n">{{ store.detail.verifiedCount }}</span>
				<span class="count__label">{{
					fr['settings.verified'](store.detail.verifiedCount)
				}}</span>
			</p>
		</header>

		<SettingsForm />
		<DangerZone :guild-name="store.detail.guild.name" @erased="onErased" />
	</template>
</template>

<style scoped>
.crumb {
	padding: 1.25rem var(--pad);
}

.crumb__back {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--fg-muted);
	font-size: 0.875rem;
	transition: color 0.2s ease;
}

.crumb__back:hover {
	color: var(--fg);
}

.state {
	display: grid;
	justify-items: start;
	gap: 1rem;
	color: var(--fg-muted);
}

.head {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	align-items: center;
	gap: 1.5rem;
}

.head__text {
	display: grid;
	gap: 0.5rem;
	min-width: 0;
}

.head__title {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: clamp(2rem, 1rem + 3.5vw, 3.75rem);
	font-weight: 200;
	line-height: 1.05;
	letter-spacing: -0.04em;
}

.count {
	grid-column: 1 / -1;
	display: flex;
	align-items: baseline;
	gap: 0.75rem;
}

.count__n {
	font-size: clamp(2rem, 1.5rem + 1.5vw, 2.75rem);
	font-weight: 700;
	letter-spacing: -0.04em;
	line-height: 1;
}

.count__label {
	color: var(--fg-muted);
	font-size: 0.9375rem;
}

@media (min-width: 720px) {
	.head {
		grid-template-columns: auto minmax(0, 1fr) auto;
	}

	.count {
		grid-column: auto;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
	}
}
</style>

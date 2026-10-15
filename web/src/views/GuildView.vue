<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
import { onMounted, watch } from 'vue';
import {
	onBeforeRouteLeave,
	onBeforeRouteUpdate,
	useRouter,
	type RouteLocationNormalized,
} from 'vue-router';
import DangerZone from '@/components/DangerZone.vue';
import MembersPanel from '@/components/MembersPanel.vue';
import PanelPost from '@/components/PanelPost.vue';
import BotPermissions from '@/components/BotPermissions.vue';
import SettingsForm from '@/components/SettingsForm.vue';
import SettingsNav from '@/components/SettingsNav.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import GuildAvatar from '@/components/ui/GuildAvatar.vue';
import { sectionId } from '@/settings/sections';
import { useGuildStore } from '@/stores/guild';
import { useMembersStore } from '@/stores/members';
import { useSessionStore } from '@/stores/session';
import { usePrefsStore } from '@/stores/prefs';

const prefs = usePrefsStore();

const props = withDefaults(defineProps<{ id: string; tab?: 'settings' | 'members' }>(), {
	tab: 'settings',
});
const store = useGuildStore();
const members = useMembersStore();
const session = useSessionStore();
const router = useRouter();

const expired = () => {
	session.expire();
	void router.replace('/');
};
store.setUnauthenticatedHandler(expired);
members.setUnauthenticatedHandler(expired);

// Always fetched again: roles, channels or the settings may have changed since the last visit.
onMounted(() => void store.load(props.id));

/** Asks before unsaved edits are dropped by going to another page or another server. */
const confirmLeave = (to: RouteLocationNormalized) =>
	to.params.id === props.id || !store.dirty || window.confirm(prefs.t['settings.leaveConfirm']);
onBeforeRouteLeave(confirmLeave);
onBeforeRouteUpdate(confirmLeave);
watch(
	() => props.id,
	(id) => void store.load(id),
);

/** Keeps the big count right after an unlink, without reloading the whole form. */
function onMembersChanged(): void {
	if (store.detail && members.data) store.detail.verifiedCount = members.data.total;
}

async function onErased(): Promise<void> {
	await session.load();
	await router.push('/');
}
</script>

<template>
	<nav class="crumb" :aria-label="prefs.t.crumb">
		<RouterLink to="/" class="crumb__back">
			<ArrowLeft :size="16" :stroke-width="1.6" aria-hidden="true" />
			{{ prefs.t.back }}
		</RouterLink>
	</nav>

	<p v-if="store.loadState === 'loading' || store.loadState === 'idle'" class="rule pad state">
		{{ prefs.t.loading }}
	</p>
	<p v-else-if="store.loadState === 'forbidden'" role="alert" class="rule pad state">
		{{ prefs.t['error.forbidden'] }}
	</p>
	<p v-else-if="store.loadState === 'notFound'" role="alert" class="rule pad state">
		{{ prefs.t['error.notFound'] }}
	</p>
	<div v-else-if="store.loadState === 'error'" role="alert" class="rule pad state">
		<p>{{ prefs.t['error.generic'] }}</p>
		<BaseButton variant="ghost" size="sm" @click="store.load(id)">{{
			prefs.t.retry
		}}</BaseButton>
	</div>

	<template v-else-if="store.detail && store.draft">
		<header class="rule pad head">
			<GuildAvatar
				:id="store.detail.guild.id"
				:name="store.detail.guild.name"
				:icon="store.detail.guild.icon"
				:size="72"
			/>
			<h1 class="head__title">{{ store.detail.guild.name }}</h1>
			<p class="count">
				<span class="count__n">{{ store.detail.verifiedCount }}</span>
				<span class="count__label">{{
					prefs.t['settings.verified'](store.detail.verifiedCount)
				}}</span>
			</p>
		</header>

		<BotPermissions />

		<nav class="tabs" :aria-label="prefs.t['tabs.label']">
			<RouterLink
				:to="{ name: 'guild', params: { id } }"
				:class="['tab', { 'tab--on': tab === 'settings' }]"
				:aria-current="tab === 'settings' ? 'page' : undefined"
				>{{ prefs.t['tabs.settings']
				}}<span v-if="tab === 'settings'" class="tab__line sheen-line" aria-hidden="true"
			/></RouterLink>
			<RouterLink
				:to="{ name: 'members', params: { id } }"
				:class="['tab', { 'tab--on': tab === 'members' }]"
				:aria-current="tab === 'members' ? 'page' : undefined"
				>{{ prefs.t['tabs.members']
				}}<span v-if="tab === 'members'" class="tab__line sheen-line" aria-hidden="true"
			/></RouterLink>
		</nav>

		<div v-if="tab === 'settings'" class="layout">
			<SettingsNav />
			<div class="layout__content">
				<SettingsForm />
				<div :id="sectionId('panel')" class="layout__target">
					<PanelPost />
				</div>
				<div :id="sectionId('danger')" class="layout__target">
					<DangerZone :guild-name="store.detail.guild.name" @erased="onErased" />
				</div>
			</div>
		</div>
		<MembersPanel v-else :guild-id="id" @changed="onMembersChanged" />
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

.tabs {
	display: flex;
	gap: 0.25rem;
	padding: 0 var(--pad);
	border-top: 1px solid var(--border);
}

.tab {
	position: relative;
	padding: 1rem 1rem 0.875rem;
	color: var(--fg-muted);
	font-size: 0.9375rem;
	transition: color 0.2s ease;
}

.tab:first-child {
	padding-left: 0;
}

.tab:hover {
	color: var(--fg);
}

.tab--on {
	color: var(--fg);
	font-weight: 500;
}

/* Le trait de l'onglet actif reprend le dégradé de l'en-tête. */
.tab__line {
	position: absolute;
	right: 1rem;
	bottom: -1px;
	left: 1rem;
	height: 2px;
}

.tab:first-child .tab__line {
	left: 0;
}

/* Réglages : la navigation à gauche dès qu'il y a la place, le contenu à droite. */
.layout__content {
	min-width: 0;
	container-type: inline-size;
}

.layout__target {
	scroll-margin-top: 5.5rem;
}

@media (min-width: 1100px) {
	.layout {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
	}
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

.head__title {
	min-width: 0;
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

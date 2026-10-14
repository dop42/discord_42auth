<script setup lang="ts">
import { onMounted } from 'vue';
import AppFooter from '@/components/AppFooter.vue';
import AppHeader from '@/components/AppHeader.vue';
import SiteRails from '@/components/ui/SiteRails.vue';
import { useMetaStore } from '@/stores/meta';
import { usePrefsStore } from '@/stores/prefs';
import { useSessionStore } from '@/stores/session';

const session = useSessionStore();
const meta = useMetaStore();
const prefs = usePrefsStore();

onMounted(() => {
	void meta.load();
	void session.load();
});
</script>

<template>
	<a class="skip-link" href="#contenu">{{ prefs.t.skip }}</a>
	<div class="shell">
		<AppHeader />
		<main id="contenu" class="frame">
			<RouterView />
		</main>
		<AppFooter />
	</div>
	<SiteRails />
</template>

<style scoped>
.shell {
	display: grid;
	/* minmax(0, …) : un contenu long (un select, un nom de serveur) ne peut pas élargir la page. */
	grid-template-columns: minmax(0, 1fr);
	grid-template-rows: auto 1fr auto;
	min-height: 100svh;
}

/* margin-inline: auto ferait rétrécir un élément de grille à son contenu. */
.shell > .frame {
	width: 100%;
}

/* Le pied de page commence sous la ligne de flottaison : quand la page charge, il ne saute pas. */
.shell > main {
	min-height: 100svh;
}

.skip-link {
	position: absolute;
	left: 1rem;
	top: -3rem;
	z-index: 100;
	padding: 0.5rem 1rem;
	border-radius: 999px;
	background: var(--fg);
	color: var(--bg);
	font-size: 0.875rem;
}

.skip-link:focus {
	top: 1rem;
}
</style>

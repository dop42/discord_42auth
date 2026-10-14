<script setup lang="ts">
import AppLogo from '@/components/ui/AppLogo.vue';
import { useMetaStore } from '@/stores/meta';
import { usePrefsStore } from '@/stores/prefs';

const prefs = usePrefsStore();

const meta = useMetaStore();
const year = new Date().getFullYear();
</script>

<template>
	<footer class="frame">
		<div class="rule">
			<div class="cells footer__grid">
				<div class="footer__brand">
					<AppLogo class="footer__logo" />
					<p>{{ prefs.t['footer.tagline'] }}</p>
				</div>
				<nav class="footer__col" :aria-label="prefs.t['footer.legal']">
					<h2>{{ prefs.t['footer.legal'] }}</h2>
					<ul>
						<li>
							<RouterLink to="/privacy">{{ prefs.t['footer.privacy'] }}</RouterLink>
						</li>
						<li>
							<RouterLink to="/terms">{{ prefs.t['footer.terms'] }}</RouterLink>
						</li>
					</ul>
				</nav>
				<div class="footer__col">
					<h2>{{ prefs.t['footer.operator'] }}</h2>
					<ul v-if="meta.meta">
						<li>{{ meta.meta.operator.name }}</li>
						<li>{{ meta.meta.hosting }}</li>
					</ul>
				</div>
			</div>
			<div class="footer__bottom">
				<span>© {{ year }} {{ meta.meta?.operator.name ?? prefs.t.appName }}</span>
				<span>{{ prefs.t['footer.unaffiliated'] }}</span>
			</div>
		</div>
	</footer>
</template>

<style scoped>
.footer__grid {
	grid-template-columns: repeat(2, 1fr);
}

.footer__grid > * {
	padding: 2rem var(--pad);
}

.footer__brand {
	grid-column: 1 / -1;
	display: grid;
	align-content: start;
	gap: 1rem;
}

.footer__logo {
	font-size: 1.375rem;
}

.footer__brand p {
	max-width: 32ch;
	color: var(--fg-muted);
	font-size: 0.9375rem;
	line-height: 1.65;
}

.footer__col h2 {
	margin-bottom: 1.25rem;
	font-size: 0.9375rem;
	font-weight: 500;
}

.footer__col ul {
	display: grid;
	gap: 0.75rem;
	color: var(--fg-muted);
	font-size: 0.9375rem;
}

.footer__col a {
	transition: color 0.2s ease;
}

.footer__col a:hover {
	color: var(--fg);
}

.footer__bottom {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: 0.5rem;
	padding: 1.25rem var(--pad);
	border-top: 1px solid var(--border);
	color: var(--fg-faint);
	font-size: 0.875rem;
}

@media (min-width: 960px) {
	.footer__grid {
		grid-template-columns: 2fr 1fr 1fr;
	}

	.footer__brand {
		grid-column: auto;
	}
}
</style>

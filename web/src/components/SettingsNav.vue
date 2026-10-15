<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { headingId, sectionId, SETTINGS_SECTIONS } from '@/settings/sections';
import { useGuildStore } from '@/stores/guild';
import { usePrefsStore } from '@/stores/prefs';

const prefs = usePrefsStore();
const store = useGuildStore();

/** The actions under the form; their components name their own headings. */
const ACTIONS = [
	{ id: 'panel', heading: 'panel-title' },
	{ id: 'danger', heading: 'danger-title' },
] as const;

const settings = computed(() =>
	SETTINGS_SECTIONS.map((section) => ({
		id: section.id,
		heading: headingId(section.id),
		label: prefs.t[`sections.${section.id}`],
		unsaved: section.fields.some((field) => store.changed.has(field)),
	})),
);
const actions = computed(() =>
	ACTIONS.map((action) => ({
		...action,
		label: prefs.t[action.id === 'panel' ? 'panel.title' : 'danger.title'],
	})),
);

/** The category being read, highlighted in the navigation. */
const active = ref<string>(SETTINGS_SECTIONS[0]?.id ?? '');

/**
 * Scrolls to a category and hands it the focus.
 * @remarks The focus goes to the category's heading, so a keyboard or screen-reader user
 * continues from there instead of from the link they left. The URL is left alone: the page
 * has no use for a fragment, and the router would treat it as a navigation.
 */
function go(id: string, heading: string): void {
	const target = document.getElementById(sectionId(id));
	if (!target) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
	const title = document.getElementById(heading);
	if (title && !title.hasAttribute('tabindex')) title.setAttribute('tabindex', '-1');
	title?.focus({ preventScroll: true });
	active.value = id;
}

// The category crossing the upper third of the screen is the one being read.
let observer: IntersectionObserver | undefined;
onMounted(() => {
	observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) active.value = entry.target.id.replace(/^section-/, '');
			}
		},
		{ rootMargin: '-25% 0px -65% 0px' },
	);
	for (const id of [
		...SETTINGS_SECTIONS.map((section) => section.id),
		...ACTIONS.map((a) => a.id),
	]) {
		const target = document.getElementById(sectionId(id));
		if (target) observer.observe(target);
	}
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
	<nav class="snav" :aria-label="prefs.t['sections.label']">
		<div class="snav__inner">
			<p id="snav-settings" class="snav__group">{{ prefs.t['sections.settings'] }}</p>
			<ul class="snav__list" aria-labelledby="snav-settings">
				<li v-for="item in settings" :key="item.id">
					<a
						:href="`#${sectionId(item.id)}`"
						:class="['snav__link', { 'snav__link--on': active === item.id }]"
						:aria-current="active === item.id ? 'location' : undefined"
						@click.prevent="go(item.id, item.heading)"
					>
						<span>{{ item.label }}</span>
						<span v-if="item.unsaved" class="snav__dot">
							<span class="visually-hidden">— {{ prefs.t['sections.unsaved'] }}</span>
						</span>
					</a>
				</li>
			</ul>
			<p id="snav-actions" class="snav__group">{{ prefs.t['sections.actions'] }}</p>
			<ul class="snav__list" aria-labelledby="snav-actions">
				<li v-for="item in actions" :key="item.id">
					<a
						:href="`#${sectionId(item.id)}`"
						:class="['snav__link', { 'snav__link--on': active === item.id }]"
						:aria-current="active === item.id ? 'location' : undefined"
						@click.prevent="go(item.id, item.heading)"
						>{{ item.label }}</a
					>
				</li>
			</ul>
		</div>
	</nav>
</template>

<style scoped>
/* Sur mobile : une rangée de pastilles qui défile de côté, sous les onglets. */
.snav {
	border-top: 1px solid var(--border);
}

.snav__inner {
	display: flex;
	gap: 0.375rem;
	overflow-x: auto;
	padding: 0.75rem var(--pad);
	scrollbar-width: none;
	/* Le bord droit s'efface : la rangée continue hors de l'écran, on peut la faire défiler. */
	mask-image: linear-gradient(90deg, #000 calc(100% - 2.5rem), transparent);
}

.snav__group {
	display: none;
}

.snav__list {
	display: flex;
	flex: none;
	gap: 0.375rem;
}

.snav__link {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	min-height: 2.5rem;
	padding: 0 0.875rem;
	border: 1px solid var(--border);
	border-radius: 999px;
	color: var(--fg-muted);
	font-size: 0.875rem;
	white-space: nowrap;
	transition:
		color 0.2s ease,
		background-color 0.2s ease,
		border-color 0.2s ease;
}

.snav__link:hover {
	color: var(--fg);
	background: var(--hover);
}

.snav__link--on {
	border-color: var(--border-strong);
	background: var(--hover);
	color: var(--fg);
	font-weight: 500;
}

/* Un point plein : cette catégorie a des modifications non enregistrées. */
.snav__dot {
	flex: none;
	width: 0.4375rem;
	height: 0.4375rem;
	border-radius: 50%;
	background: var(--fg);
}

/* Sur grand écran : une colonne fixe à gauche du formulaire, séparée par un trait vertical. */
@media (min-width: 1100px) {
	.snav {
		border-top: 1px solid var(--border);
		border-right: 1px solid var(--border);
	}

	.snav__inner {
		position: sticky;
		top: 4.5rem;
		display: grid;
		gap: 0.25rem;
		overflow: visible;
		padding: 2rem 1.25rem 2rem var(--pad);
		mask-image: none;
	}

	.snav__group {
		display: block;
		padding: 0 0.75rem;
		color: var(--fg-faint);
		font-size: 0.8125rem;
	}

	.snav__group:not(:first-child) {
		margin-top: 1.5rem;
	}

	.snav__list {
		display: grid;
		gap: 0.125rem;
		margin-top: 0.375rem;
	}

	.snav__link {
		display: flex;
		justify-content: space-between;
		min-height: 2.5rem;
		border-color: transparent;
		border-radius: var(--radius-s);
		padding: 0 0.75rem;
		white-space: normal;
	}

	.snav__link--on {
		border-color: var(--border);
	}
}
</style>

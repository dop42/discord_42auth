<script setup lang="ts">
defineProps<{ title: string; updated: string }>();
</script>

<template>
	<article class="rule pad legal">
		<header class="legal__head">
			<p class="eyebrow">Dernière mise à jour : {{ updated }}</p>
			<h1 class="section-title">{{ title }}</h1>
		</header>
		<div class="prose">
			<slot />
		</div>
	</article>
</template>

<style scoped>
.rule::before {
	display: none;
}

.legal {
	display: grid;
	gap: clamp(2rem, 5vw, 3.5rem);
}

.legal__head {
	display: grid;
	gap: 1rem;
}

.prose {
	max-width: 68ch;
	color: var(--fg-muted);
	font-size: 1rem;
	line-height: 1.75;
}

.prose :deep(h2) {
	margin: 2.5rem 0 0.75rem;
	padding-top: 2.5rem;
	border-top: 1px solid var(--border);
	color: var(--fg);
	font-size: clamp(1.1875rem, 1.05rem + 0.5vw, 1.4375rem);
	font-weight: 500;
	letter-spacing: -0.02em;
}

.prose :deep(p + p),
.prose :deep(p + ul),
.prose :deep(ul + p) {
	margin-top: 0.875rem;
}

.prose :deep(ul) {
	display: grid;
	gap: 0.5rem;
	margin-top: 0.875rem;
}

.prose :deep(li) {
	display: flex;
	gap: 0.75rem;
}

.prose :deep(li)::before {
	content: '';
	flex: none;
	width: 0.375rem;
	height: 0.375rem;
	margin-top: 0.7rem;
	border-radius: 1px;
	background: linear-gradient(135deg, var(--fg), var(--fg-faint));
}

.prose :deep(strong) {
	color: var(--fg);
	font-weight: 500;
}

.prose :deep(a) {
	color: var(--fg);
	text-decoration: underline;
	text-decoration-color: var(--border-strong);
	text-underline-offset: 0.2em;
	transition: text-decoration-color 0.2s ease;
}

.prose :deep(a:hover) {
	text-decoration-color: var(--fg);
}

.prose :deep(code) {
	padding: 0.1em 0.4em;
	border-radius: 0.375rem;
	background: var(--bg-elevated);
	box-shadow: inset 0 0 0 1px var(--border);
	color: var(--fg);
}
</style>

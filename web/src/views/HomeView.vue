<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import { computed } from 'vue';
import GuildCard from '@/components/GuildCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import { useMetaStore } from '@/stores/meta';
import { useSessionStore } from '@/stores/session';
import { usePrefsStore } from '@/stores/prefs';

const prefs = usePrefsStore();

const session = useSessionStore();
const meta = useMetaStore();
const title = computed(() => prefs.t['landing.title']);
</script>

<template>
	<p v-if="session.status === 'idle' || session.status === 'loading'" class="pad state">
		{{ prefs.t.loading }}
	</p>

	<template v-else-if="session.status === 'anonymous'">
		<section class="rule pad hero">
			<p class="eyebrow">{{ prefs.t['landing.eyebrow'] }}</p>
			<h1 class="hero__title">
				<span class="visually-hidden">{{ title.map((w) => w.text).join(' ') }}.</span>
				<span aria-hidden="true">
					<span
						v-for="(word, i) in title"
						:key="i"
						:class="['word', { hl: word.accent }]"
						:style="{ '--i': i }"
						>{{ word.text }}</span
					><span class="word hl" :style="{ '--i': title.length }">.</span>
				</span>
			</h1>
			<div class="hero__foot">
				<p class="hero__lead">{{ prefs.t['landing.lead'] }}</p>
				<div class="hero__ctas">
					<BaseButton href="/auth/login" size="lg">
						{{ prefs.t['landing.login'] }}
						<ArrowRight :size="16" :stroke-width="1.6" aria-hidden="true" />
					</BaseButton>
					<BaseButton
						v-if="meta.meta"
						:href="meta.meta.inviteUrl"
						variant="ghost"
						size="lg"
						>{{ prefs.t['landing.invite'] }}</BaseButton
					>
				</div>
			</div>
		</section>

		<section class="rule" aria-labelledby="steps-title">
			<h2 id="steps-title" class="visually-hidden">{{ prefs.t['landing.steps.title'] }}</h2>
			<ol class="cells cells--3 steps">
				<li v-for="step in prefs.t['landing.steps']" :key="step.n" class="step">
					<span class="wash sheen-wash" aria-hidden="true" />
					<span class="step__n">{{ step.n }}</span>
					<h3 class="step__title">{{ step.title }}</h3>
					<p class="step__text">{{ step.text }}</p>
				</li>
			</ol>
		</section>
	</template>

	<section v-else-if="session.status === 'ready' && session.me" class="rule">
		<div class="pad section-head">
			<p class="eyebrow">{{ prefs.t['guilds.eyebrow'] }}</p>
			<h1 class="section-title">
				{{ prefs.t['guilds.title'] }}
				<span class="hl">{{ prefs.t['guilds.titleAccent'] }}</span
				>.
			</h1>
			<p class="section-lead">{{ prefs.t['guilds.hint'] }}</p>
		</div>
		<ul
			v-if="session.me.guilds.length"
			class="cells cells--3 guilds"
			:aria-label="prefs.t['guilds.list']"
		>
			<GuildCard v-for="guild in session.me.guilds" :key="guild.id" :guild="guild" />
		</ul>
		<p v-else class="pad empty">{{ prefs.t['guilds.empty'] }}</p>
	</section>

	<div v-else role="alert" class="pad state">
		<p>{{ prefs.t['error.generic'] }}</p>
		<BaseButton variant="ghost" size="sm" @click="session.load()">{{
			prefs.t.retry
		}}</BaseButton>
	</div>
</template>

<style scoped>
.rule:first-child::before {
	display: none;
}

.state {
	display: grid;
	justify-items: start;
	gap: 1rem;
	color: var(--fg-muted);
}

.hero {
	display: grid;
	gap: clamp(1.5rem, 4vw, 3rem);
}

.hero__title {
	max-width: 15ch;
	font-size: clamp(2.5rem, 1rem + 5.6vw, 5.75rem);
	font-weight: 200;
	line-height: 1.05;
	letter-spacing: -0.04em;
}

.word {
	display: inline-block;
	margin-right: 0.24em;
	opacity: 0;
	filter: blur(10px);
	transform: translateY(0.4em);
	animation: word-in 0.9s var(--ease-out) forwards;
	animation-delay: calc(var(--i) * 80ms + 100ms);
}

.word:nth-last-child(2),
.word:last-child {
	margin-right: 0;
}

@keyframes word-in {
	to {
		opacity: 1;
		filter: blur(0);
		transform: none;
	}
}

.hero__foot {
	display: grid;
	gap: 1.75rem;
	align-items: end;
	opacity: 0;
	filter: blur(8px);
	transform: translateY(12px);
	animation: word-in 0.9s var(--ease-out) 0.7s forwards;
}

.hero__lead {
	max-width: 36rem;
	color: var(--fg-muted);
	font-size: clamp(1.0625rem, 0.98rem + 0.4vw, 1.3125rem);
	line-height: 1.6;
}

.hero__ctas {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
}

.step {
	position: relative;
	isolation: isolate;
	display: grid;
	align-content: start;
	gap: 0.75rem;
	padding: clamp(2rem, 4vw, 3rem) var(--pad);
}

.step__n {
	color: var(--fg-faint);
	font-size: 0.8125rem;
	letter-spacing: 0.04em;
}

.step__title {
	font-size: clamp(1.75rem, 1rem + 2vw, 2.5rem);
	font-weight: 200;
	line-height: 1;
	letter-spacing: -0.04em;
}

.step__text {
	max-width: 36ch;
	color: var(--fg-muted);
	font-size: 1rem;
	line-height: 1.65;
}

.wash {
	position: absolute;
	inset: 0;
	z-index: -1;
	opacity: 0;
	animation-play-state: paused;
	transition: opacity 250ms ease;
}

@media (hover: hover) and (pointer: fine) {
	.step:hover .wash {
		opacity: 0.45;
		animation-play-state: running;
	}
}

.guilds {
	gap: 0;
	background: none;
	border-top: 1px solid var(--border);
}

.empty {
	border-top: 1px solid var(--border);
	color: var(--fg-muted);
}

@media (min-width: 1100px) {
	.hero__foot {
		grid-template-columns: 1fr auto;
	}
}

@media (prefers-reduced-motion: reduce) {
	.word,
	.hero__foot {
		opacity: 1;
		filter: none;
		transform: none;
	}
}
</style>

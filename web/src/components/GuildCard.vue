<script setup lang="ts">
import type { GuildSummary } from '@shared/api';
import { ArrowUpRight, Settings2 } from 'lucide-vue-next';
import BaseButton from '@/components/ui/BaseButton.vue';
import GuildAvatar from '@/components/ui/GuildAvatar.vue';
import LivePing from '@/components/ui/LivePing.vue';
import { fr } from '@/i18n/fr';

defineProps<{ guild: GuildSummary }>();
</script>

<template>
	<li class="card">
		<span class="wash sheen-wash" aria-hidden="true" />
		<div class="card__head">
			<GuildAvatar :id="guild.id" :name="guild.name" :icon="guild.icon" :size="56" />
			<span :class="['status', { 'status--off': !guild.botPresent }]">
				<LivePing v-if="guild.botPresent" />
				<i v-else class="status__dot" aria-hidden="true" />
				{{ guild.botPresent ? fr['guilds.present'] : fr['guilds.absent'] }}
			</span>
		</div>
		<p class="card__name" :title="guild.name">{{ guild.name }}</p>
		<div class="card__action">
			<BaseButton
				v-if="guild.botPresent"
				:to="{ name: 'guild', params: { id: guild.id } }"
				variant="solid"
				size="sm"
				:aria-label="`${fr['guilds.configure']} ${guild.name}`"
			>
				<Settings2 :size="14" :stroke-width="1.8" aria-hidden="true" />
				{{ fr['guilds.configure'] }}
			</BaseButton>
			<BaseButton
				v-else
				:href="guild.inviteUrl"
				variant="ghost"
				size="sm"
				:aria-label="`${fr['guilds.add']} — ${guild.name}`"
			>
				{{ fr['guilds.add'] }}
				<ArrowUpRight :size="14" :stroke-width="1.8" aria-hidden="true" />
			</BaseButton>
		</div>
	</li>
</template>

<style scoped>
.card {
	/* Traits portés par chaque carte : une rangée incomplète ne laisse pas de case grise. */
	box-shadow:
		1px 0 0 var(--border),
		0 1px 0 var(--border);
	position: relative;
	isolation: isolate;
	display: grid;
	gap: 1.25rem;
	padding: 2rem var(--pad);
	min-width: 0;
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
	.card:hover .wash {
		opacity: 0.35;
		animation-play-state: running;
	}
}

.card__head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
}

.status {
	display: inline-flex;
	align-items: center;
	gap: 0.625rem;
	padding: 0.3rem 0.75rem 0.3rem 0.7rem;
	border: 1px solid var(--border-soft);
	border-radius: 999px;
	background: var(--bg);
	box-shadow: var(--shadow-card);
	color: var(--fg-muted);
	font-size: 0.8125rem;
	white-space: nowrap;
}

.status__dot {
	width: 0.4rem;
	height: 0.4rem;
	border-radius: 50%;
	background: var(--border-strong);
}

.card__name {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: clamp(1.25rem, 1rem + 0.8vw, 1.625rem);
	font-weight: 300;
	letter-spacing: -0.03em;
}

.card__action {
	display: flex;
}
</style>

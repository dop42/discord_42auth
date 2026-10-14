<script setup lang="ts">
import { LogOut } from 'lucide-vue-next';
import { computed } from 'vue';
import { avatarUrl, initials } from '@/api/client';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppLogo from '@/components/ui/AppLogo.vue';
import { fr } from '@/i18n/fr';
import { useMetaStore } from '@/stores/meta';
import { useSessionStore } from '@/stores/session';

const session = useSessionStore();
const meta = useMetaStore();
const user = computed(() => session.me?.user ?? null);
</script>

<template>
	<header class="header">
		<div class="frame header__inner">
			<RouterLink to="/" class="header__logo" :aria-label="`${fr.appName}, accueil`">
				<AppLogo />
			</RouterLink>

			<div class="header__actions">
				<template v-if="user">
					<span class="user">
						<img
							v-if="user.avatar"
							:src="avatarUrl(user.id, user.avatar)"
							alt=""
							width="32"
							height="32"
							decoding="async"
							class="user__avatar"
						/>
						<span
							v-else
							aria-hidden="true"
							class="user__avatar user__avatar--initials"
							>{{ initials(user.username) }}</span
						>
						<span class="user__name">{{ user.username }}</span>
					</span>
					<button type="button" class="logout" @click="session.logout()">
						<LogOut :size="16" :stroke-width="1.6" aria-hidden="true" />
						<span>{{ fr['header.logout'] }}</span>
					</button>
				</template>
				<template v-else-if="session.status === 'anonymous'">
					<a href="/auth/login" class="header__login">{{ fr['header.login'] }}</a>
					<BaseButton
						v-if="meta.meta"
						:href="meta.meta.inviteUrl"
						size="sm"
						class="header__cta"
						>{{ fr['landing.invite'] }}</BaseButton
					>
				</template>
			</div>
			<span class="header__line sheen-line" aria-hidden="true" />
		</div>
	</header>
</template>

<style scoped>
.header {
	position: sticky;
	top: 0;
	z-index: 50;
	background: var(--bg);
}

.header__inner {
	position: relative;
	display: flex;
	align-items: stretch;
	height: 4.5rem;
}

.header__line {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 2px;
}

.header__logo {
	display: flex;
	align-items: center;
	padding-inline: var(--pad);
}

.header__actions {
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-left: auto;
	padding-inline: var(--pad);
	min-width: 0;
}

.header__login {
	display: none;
	font-size: 0.9375rem;
	color: var(--fg-muted);
	transition: color 0.2s ease;
}

.header__login:hover {
	color: var(--fg);
}

.user {
	display: flex;
	align-items: center;
	gap: 0.625rem;
	min-width: 0;
}

.user__avatar {
	flex: none;
	width: 2rem;
	height: 2rem;
	border-radius: 999px;
	box-shadow: 0 0 0 1px var(--border);
}

.user__avatar--initials {
	display: grid;
	place-items: center;
	background: var(--bg-elevated);
	font-size: 0.8125rem;
	font-weight: 500;
}

.user__name {
	display: none;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 0.9375rem;
	font-weight: 400;
}

.logout {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	height: 2.25rem;
	padding-inline: 0.875rem;
	border: 1px solid var(--border-strong);
	border-radius: 999px;
	background: var(--bg);
	color: var(--fg-muted);
	font-size: 0.8125rem;
	cursor: pointer;
	transition:
		color 0.2s ease,
		border-color 0.2s ease;
}

.logout:hover {
	color: var(--fg);
	border-color: var(--fg-faint);
}

@media (max-width: 559px) {
	.logout span {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
}

@media (min-width: 560px) {
	.header__login,
	.user__name {
		display: block;
	}
}

@media (min-width: 960px) {
	.header__logo {
		border-right: 1px solid var(--border);
	}
}
</style>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Copy, Search, Unlink } from 'lucide-vue-next';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import { useMembersStore } from '@/stores/members';
import { usePrefsStore } from '@/stores/prefs';

const props = defineProps<{ guildId: string }>();
const emit = defineEmits<{ changed: [] }>();

const store = useMembersStore();
const prefs = usePrefsStore();

const search = ref(store.guildId === props.guildId ? store.query : '');
/** The row waiting for a second click before it is unlinked. */
const confirming = ref<string | null>(null);
const busy = ref<string | null>(null);
/** Read out by screen readers after an action. */
const announce = ref<{ text: string; error: boolean } | null>(null);

onMounted(() => void store.load(props.guildId, search.value, 0));
watch(
	() => props.guildId,
	(id) => {
		search.value = '';
		void store.load(id, '', 0);
	},
);

let debounce: ReturnType<typeof setTimeout> | undefined;
watch(search, (value) => {
	clearTimeout(debounce);
	debounce = setTimeout(() => void store.load(props.guildId, value, 0), 250);
});
onBeforeUnmount(() => {
	clearTimeout(debounce);
});

const profileUrl = (login: string) =>
	`https://profile.intra.42.fr/users/${encodeURIComponent(login)}`;

async function copy(id: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(id);
		announce.value = { text: prefs.t['members.copied'], error: false };
	} catch {
		// Clipboard refused (insecure context, permission): the id stays selectable.
	}
}

async function unlink(userId: string, login: string): Promise<void> {
	busy.value = userId;
	const ok = await store.unlink(userId);
	busy.value = null;
	confirming.value = null;
	announce.value = ok
		? { text: prefs.t['members.unlinked'](login), error: false }
		: { text: prefs.t['members.unlinkError'], error: true };
	if (ok) emit('changed');
}

const goTo = (page: number) => void store.load(props.guildId, search.value, page);
</script>

<template>
	<section class="members" aria-labelledby="members-title">
		<div class="members__head">
			<div class="members__text">
				<h2 id="members-title" class="members__title">{{ prefs.t['members.title'] }}</h2>
				<p class="hint">{{ prefs.t['members.help'] }}</p>
			</div>
			<div class="search">
				<label for="members-search" class="visually-hidden">{{
					prefs.t['members.search']
				}}</label>
				<Search class="search__icon" :size="16" :stroke-width="1.6" aria-hidden="true" />
				<input
					id="members-search"
					v-model="search"
					type="search"
					maxlength="64"
					autocomplete="off"
					class="field search__input"
					:placeholder="prefs.t['members.searchPlaceholder']"
				/>
			</div>
		</div>

		<p aria-live="polite" class="members__announce">
			<span v-if="announce" :class="{ 'error-text': announce.error }">{{
				announce.text
			}}</span>
		</p>

		<div
			v-if="store.loadState === 'error' || store.loadState === 'rateLimited'"
			role="alert"
			class="pad state"
		>
			<p>
				{{
					store.loadState === 'rateLimited'
						? prefs.t['error.rateLimited']
						: prefs.t['members.loadError']
				}}
			</p>
			<BaseButton variant="ghost" size="sm" @click="goTo(store.page)">{{
				prefs.t.retry
			}}</BaseButton>
		</div>

		<p v-else-if="!store.data" class="pad state">{{ prefs.t.loading }}</p>

		<p v-else-if="!store.data.members.length" class="pad state">
			{{ search.trim() ? prefs.t['members.noMatch'] : prefs.t['members.empty'] }}
		</p>

		<template v-else>
			<table class="table" :aria-busy="store.loadState === 'loading'">
				<caption class="visually-hidden">
					{{
						prefs.t['members.title']
					}}
				</caption>
				<thead>
					<tr>
						<th scope="col">{{ prefs.t['members.login'] }}</th>
						<th scope="col">{{ prefs.t['members.discord'] }}</th>
						<th scope="col">{{ prefs.t['members.date'] }}</th>
						<th scope="col">
							<span class="visually-hidden">{{ prefs.t['members.actions'] }}</span>
						</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="member in store.data.members" :key="member.userId">
						<th scope="row" class="cell-login">
							<a
								:href="profileUrl(member.ftLogin)"
								target="_blank"
								rel="noopener"
								class="link"
								>{{ member.ftLogin }}</a
							>
						</th>
						<td :data-label="prefs.t['members.discord']">
							<span class="id">
								<code>{{ member.userId }}</code>
								<button
									type="button"
									class="mini"
									:aria-label="prefs.t['members.copy'](member.userId)"
									:title="prefs.t['members.copy'](member.userId)"
									@click="copy(member.userId)"
								>
									<Copy :size="14" :stroke-width="1.6" aria-hidden="true" />
								</button>
							</span>
						</td>
						<td :data-label="prefs.t['members.date']">
							<time :datetime="member.verifiedAt">{{
								prefs.t.date(member.verifiedAt)
							}}</time>
						</td>
						<td class="cell-actions">
							<div class="actions">
								<template v-if="confirming === member.userId">
									<BaseButton
										variant="ghost"
										size="sm"
										@click="confirming = null"
										>{{ prefs.t['members.cancel'] }}</BaseButton
									>
									<BaseButton
										variant="danger"
										size="sm"
										:disabled="busy === member.userId"
										:aria-label="
											prefs.t['members.confirmLabel'](member.ftLogin)
										"
										@click="unlink(member.userId, member.ftLogin)"
										>{{ prefs.t['members.confirm'] }}</BaseButton
									>
								</template>
								<BaseButton
									v-else
									variant="ghost"
									size="sm"
									:aria-label="prefs.t['members.unlinkLabel'](member.ftLogin)"
									@click="confirming = member.userId"
								>
									<Unlink :size="14" :stroke-width="1.6" aria-hidden="true" />
									{{ prefs.t['members.unlink'] }}
								</BaseButton>
							</div>
						</td>
					</tr>
				</tbody>
			</table>

			<nav class="pager" :aria-label="prefs.t['members.page'](store.page + 1, store.pages)">
				<span class="pager__info">
					{{ prefs.t['members.total'](store.data.total) }} ·
					{{ prefs.t['members.page'](store.page + 1, store.pages) }}
				</span>
				<div class="pager__buttons">
					<BaseButton
						variant="ghost"
						size="sm"
						:disabled="store.page === 0"
						@click="goTo(store.page - 1)"
					>
						<ChevronLeft :size="14" :stroke-width="1.8" aria-hidden="true" />
						{{ prefs.t['members.prev'] }}
					</BaseButton>
					<BaseButton
						variant="ghost"
						size="sm"
						:disabled="store.page + 1 >= store.pages"
						@click="goTo(store.page + 1)"
					>
						{{ prefs.t['members.next'] }}
						<ChevronRight :size="14" :stroke-width="1.8" aria-hidden="true" />
					</BaseButton>
				</div>
			</nav>
		</template>
	</section>
</template>

<style scoped>
.members {
	border-top: 1px solid var(--border);
}

.members__head {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 1.25rem;
	padding: clamp(1.75rem, 3.5vw, 2.5rem) var(--pad) 1rem;
}

.members__text {
	display: grid;
	gap: 0.5rem;
}

.members__text .hint {
	max-width: 52ch;
}

.members__title {
	font-size: clamp(1.1875rem, 1.05rem + 0.5vw, 1.4375rem);
	font-weight: 500;
	letter-spacing: -0.02em;
}

.search {
	position: relative;
	align-self: end;
}

.search__icon {
	position: absolute;
	top: 50%;
	left: 1rem;
	color: var(--fg-faint);
	translate: 0 -50%;
	pointer-events: none;
}

.search__input {
	padding-left: 2.625rem;
}

.members__announce {
	min-height: 1.25rem;
	padding: 0 var(--pad);
	color: var(--fg-muted);
	font-size: 0.875rem;
}

.state {
	display: grid;
	justify-items: start;
	gap: 1rem;
	color: var(--fg-muted);
}

.table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.9375rem;
}

.table th,
.table td {
	padding: 0.875rem var(--pad);
	border-top: 1px solid var(--border);
	text-align: left;
	vertical-align: middle;
}

.table thead th {
	color: var(--fg-faint);
	font-size: 0.75rem;
	font-weight: 500;
	letter-spacing: 0.02em;
}

.table tbody tr {
	transition: background-color 0.2s ease;
}

.table tbody tr:hover {
	background: var(--hover);
}

.cell-login {
	font-weight: 500;
}

.id {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
}

.id code {
	color: var(--fg-muted);
	font-size: 0.8125rem;
}

.mini {
	display: grid;
	place-items: center;
	width: 1.75rem;
	height: 1.75rem;
	border: 1px solid transparent;
	border-radius: 999px;
	background: transparent;
	color: var(--fg-faint);
	cursor: pointer;
	transition:
		color 0.2s ease,
		border-color 0.2s ease;
}

.mini:hover {
	color: var(--fg);
	border-color: var(--border-strong);
}

.actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
}

.pager {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem 1.5rem;
	padding: 1rem var(--pad) 1.5rem;
	border-top: 1px solid var(--border);
}

.pager__info {
	color: var(--fg-muted);
	font-size: 0.875rem;
}

.pager__buttons {
	display: flex;
	gap: 0.5rem;
}

/* Petit écran : chaque ligne devient une carte, les colonnes s'empilent avec leur libellé. */
@media (max-width: 719px) {
	.table thead {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}

	.table tbody tr {
		display: grid;
		gap: 0.5rem;
		padding: 1rem var(--pad);
		border-top: 1px solid var(--border);
	}

	.table th,
	.table td {
		padding: 0;
		border: 0;
	}

	.table td[data-label] {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		color: var(--fg-muted);
		font-size: 0.875rem;
	}

	.table td[data-label]::before {
		content: attr(data-label);
		color: var(--fg-faint);
		font-size: 0.75rem;
	}

	.actions {
		justify-content: flex-start;
		padding-top: 0.25rem;
	}
}

@media (min-width: 960px) {
	.members__head {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
		gap: clamp(2rem, 5vw, 5rem);
	}
}
</style>

<script setup lang="ts">
import {
	MAX_ROLE_RULES,
	NICKNAME_MODES,
	RULE_KINDS,
	type GuildSettings,
	type NicknameMode,
} from '@shared/api';
import { Check, Plus, TriangleAlert, X } from 'lucide-vue-next';
import { computed } from 'vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import { useGuildStore } from '@/stores/guild';
import { usePrefsStore } from '@/stores/prefs';

const prefs = usePrefsStore();

const store = useGuildStore();

const nicknameLabels = computed<Record<NicknameMode, { label: string; example: string }>>(() => ({
	off: {
		label: prefs.t['settings.nickname.off'],
		example: prefs.t['settings.nickname.offExample'],
	},
	login: { label: prefs.t['settings.nickname.login'], example: 'jdoe' },
	full: { label: prefs.t['settings.nickname.full'], example: 'John Doe (jdoe)' },
}));

const roles = computed(() => store.detail?.roles ?? []);
const channels = computed(() => store.detail?.channels ?? []);
const someUnassignable = computed(() => roles.value.some((role) => !role.assignable));

const invalid = (field: keyof GuildSettings) => store.invalidField === field;
const fieldClass = (field: keyof GuildSettings) => ['field', { 'field--invalid': invalid(field) }];

/** Discord colour integer → CSS hex, for the dot next to the chosen role. */
const roleColor = (color: number) =>
	color === 0 ? 'var(--border-strong)' : `#${color.toString(16).padStart(6, '0')}`;

const selectedRoleColor = computed(() => {
	const role = roles.value.find((entry) => entry.id === store.draft?.roleId);
	return role ? roleColor(role.color) : 'transparent';
});

const assignableRoles = computed(() => roles.value.filter((role) => role.assignable));
const invalidRule = (index: number) =>
	store.invalidField === 'roleRules' &&
	(store.invalidIndex === null || store.invalidIndex === index);

function addRule(): void {
	if (!store.draft || store.draft.roleRules.length >= MAX_ROLE_RULES) return;
	store.draft.roleRules.push({ kind: 'campus', value: '', roleId: '' });
}

function removeRule(index: number): void {
	store.draft?.roleRules.splice(index, 1);
}

function onCampus(event: Event): void {
	if (!store.draft) return;
	const value = (event.target as HTMLInputElement).value;
	store.draft.campus = value === '' ? null : value;
}

function onRole(event: Event): void {
	if (!store.draft) return;
	const value = (event.target as HTMLSelectElement).value;
	store.draft.roleId = value === '' ? null : value;
}

function onChannel(event: Event): void {
	if (!store.draft) return;
	const value = (event.target as HTMLSelectElement).value;
	store.draft.logChannelId = value === '' ? null : value;
}
</script>

<template>
	<form v-if="store.draft" class="form" novalidate @submit.prevent="store.save()">
		<!-- Role -->
		<div class="row">
			<div class="row__label">
				<label for="role" class="row__title">{{ prefs.t['settings.role'] }}</label>
				<p id="role-help" class="hint">{{ prefs.t['settings.role.help'] }}</p>
			</div>
			<div class="row__control">
				<div class="select-dot">
					<span
						aria-hidden="true"
						class="select-dot__dot"
						:style="{ background: selectedRoleColor }"
					/>
					<select
						id="role"
						:class="fieldClass('roleId')"
						:value="store.draft.roleId ?? ''"
						:aria-invalid="invalid('roleId')"
						aria-describedby="role-help"
						@change="onRole"
					>
						<option value="">{{ prefs.t['settings.role.none'] }}</option>
						<option
							v-for="role in roles"
							:key="role.id"
							:value="role.id"
							:disabled="!role.assignable"
						>
							{{ role.name
							}}{{ role.assignable ? '' : ` — ${prefs.t['settings.role.above']}` }}
						</option>
					</select>
				</div>
				<p v-if="invalid('roleId')" class="error-text">{{ prefs.t['settings.invalid'] }}</p>
				<p v-if="someUnassignable" class="notice notice--warn">
					<TriangleAlert :size="16" :stroke-width="1.8" aria-hidden="true" />
					<span>{{ prefs.t['settings.role.warn'] }}</span>
				</p>
			</div>
		</div>

		<!-- Extra roles -->
		<fieldset class="row">
			<div class="row__label">
				<legend class="row__title">{{ prefs.t['settings.rules'] }}</legend>
				<p class="hint">{{ prefs.t['settings.rules.help'] }}</p>
			</div>
			<div class="row__control">
				<p v-if="!store.draft.roleRules.length" class="notice">
					{{ prefs.t['settings.rules.empty'] }}
				</p>
				<ol v-else class="rules">
					<li
						v-for="(rule, i) in store.draft.roleRules"
						:key="i"
						:class="['rule-item', { 'rule-item--invalid': invalidRule(i) }]"
						:aria-label="prefs.t['settings.rules.rule'](i + 1)"
					>
						<label class="rule-item__field">
							<span class="rule-item__label">{{
								prefs.t['settings.rules.kind']
							}}</span>
							<select v-model="rule.kind" class="field">
								<option v-for="kind in RULE_KINDS" :key="kind" :value="kind">
									{{ prefs.t['settings.rules.kinds'][kind] }}
								</option>
							</select>
						</label>
						<label class="rule-item__field">
							<span class="rule-item__label">{{
								prefs.t['settings.rules.value']
							}}</span>
							<input
								v-model="rule.value"
								type="text"
								maxlength="64"
								autocomplete="off"
								class="field"
								:placeholder="prefs.t['settings.rules.placeholders'][rule.kind]"
							/>
						</label>
						<label class="rule-item__field">
							<span class="rule-item__label">{{
								prefs.t['settings.rules.role']
							}}</span>
							<select v-model="rule.roleId" class="field rule-item__role">
								<option value="" disabled>
									{{ prefs.t['settings.rules.pickRole'] }}
								</option>
								<option
									v-for="role in assignableRoles"
									:key="role.id"
									:value="role.id"
								>
									{{ role.name }}
								</option>
							</select>
						</label>
						<button
							type="button"
							class="rule-item__remove"
							:aria-label="prefs.t['settings.rules.remove'](i + 1)"
							:title="prefs.t['settings.rules.remove'](i + 1)"
							@click="removeRule(i)"
						>
							<X :size="16" :stroke-width="1.8" aria-hidden="true" />
						</button>
					</li>
				</ol>
				<p v-if="invalid('roleRules')" class="error-text">
					{{
						store.invalidIndex === null
							? prefs.t['settings.invalid']
							: prefs.t['settings.rules.invalid'](store.invalidIndex + 1)
					}}
				</p>
				<div>
					<BaseButton
						variant="ghost"
						size="sm"
						:disabled="store.draft.roleRules.length >= MAX_ROLE_RULES"
						@click="addRule"
					>
						<Plus :size="14" :stroke-width="1.8" aria-hidden="true" />
						{{ prefs.t['settings.rules.add'] }}
					</BaseButton>
				</div>
				<p v-if="store.draft.roleRules.length >= MAX_ROLE_RULES" class="hint">
					{{ prefs.t['settings.rules.max'] }}
				</p>
			</div>
		</fieldset>

		<!-- Campus -->
		<div class="row">
			<div class="row__label">
				<label for="campus" class="row__title">{{ prefs.t['settings.campus'] }}</label>
				<p id="campus-help" class="hint">{{ prefs.t['settings.campus.help'] }}</p>
			</div>
			<div class="row__control">
				<input
					id="campus"
					type="text"
					maxlength="64"
					autocomplete="off"
					:placeholder="prefs.t['settings.campus.any']"
					:class="fieldClass('campus')"
					:value="store.draft.campus ?? ''"
					:aria-invalid="invalid('campus')"
					aria-describedby="campus-help"
					@input="onCampus"
				/>
				<p v-if="invalid('campus')" class="error-text">{{ prefs.t['settings.invalid'] }}</p>
			</div>
		</div>

		<!-- Students only -->
		<div class="row">
			<div class="row__label">
				<span id="students-label" class="row__title">{{
					prefs.t['settings.students']
				}}</span>
				<p id="students-help" class="hint">{{ prefs.t['settings.students.help'] }}</p>
			</div>
			<div class="row__control">
				<button
					id="students"
					type="button"
					role="switch"
					:aria-checked="store.draft.studentsOnly"
					aria-labelledby="students-label"
					aria-describedby="students-help"
					:class="[
						'switch',
						{
							'switch--on': store.draft.studentsOnly,
							'field--invalid': invalid('studentsOnly'),
						},
					]"
					@click="store.draft.studentsOnly = !store.draft.studentsOnly"
				>
					<span class="switch__track" aria-hidden="true" />
					<span class="switch__thumb" aria-hidden="true" />
				</button>
			</div>
		</div>

		<!-- Nickname -->
		<fieldset class="row" :aria-invalid="invalid('nickname')">
			<div class="row__label">
				<legend class="row__title">{{ prefs.t['settings.nickname'] }}</legend>
				<p class="hint">{{ prefs.t['settings.nickname.help'] }}</p>
			</div>
			<div class="row__control">
				<div :class="['choices', { 'choices--invalid': invalid('nickname') }]">
					<label
						v-for="mode in NICKNAME_MODES"
						:key="mode"
						:class="['choice', { 'choice--on': store.draft.nickname === mode }]"
					>
						<input
							v-model="store.draft.nickname"
							type="radio"
							name="nickname"
							:value="mode"
							class="choice__input"
						/>
						<span class="choice__mark" aria-hidden="true">
							<Check :size="12" :stroke-width="2.4" />
						</span>
						<span class="choice__text">
							<span>{{ nicknameLabels[mode].label }}</span>
							<code>{{ nicknameLabels[mode].example }}</code>
						</span>
					</label>
				</div>
				<p v-if="invalid('nickname')" class="error-text">
					{{ prefs.t['settings.invalid'] }}
				</p>
			</div>
		</fieldset>

		<!-- Log channel -->
		<div class="row">
			<div class="row__label">
				<label for="logs" class="row__title">{{ prefs.t['settings.logs'] }}</label>
				<p id="logs-help" class="hint">{{ prefs.t['settings.logs.help'] }}</p>
			</div>
			<div class="row__control">
				<select
					id="logs"
					:class="fieldClass('logChannelId')"
					:value="store.draft.logChannelId ?? ''"
					:aria-invalid="invalid('logChannelId')"
					aria-describedby="logs-help logs-retention"
					@change="onChannel"
				>
					<option value="">{{ prefs.t['settings.logs.none'] }}</option>
					<option v-for="channel in channels" :key="channel.id" :value="channel.id">
						#{{ channel.name }}
					</option>
				</select>
				<p v-if="invalid('logChannelId')" class="error-text">
					{{ prefs.t['settings.invalid'] }}
				</p>
				<p id="logs-retention" class="notice">{{ prefs.t['settings.logs.retention'] }}</p>
			</div>
		</div>

		<!-- Save bar -->
		<div :class="['bar', { 'bar--dirty': store.dirty }]">
			<span class="bar__line sheen-line" aria-hidden="true" />
			<p class="bar__status" aria-live="polite">
				<span v-if="store.saveState === 'error'" class="error-text">{{
					prefs.t['settings.error']
				}}</span>
				<span v-else-if="store.saveState === 'rateLimited'" class="error-text">{{
					prefs.t['error.rateLimited']
				}}</span>
				<span v-else-if="store.saveState === 'saved' && !store.dirty" class="bar__ok">
					<Check :size="16" :stroke-width="2" aria-hidden="true" />{{
						prefs.t['settings.saved']
					}}
				</span>
				<span v-else>{{
					store.dirty ? prefs.t['settings.dirty'] : prefs.t['settings.clean']
				}}</span>
			</p>
			<div class="bar__actions">
				<BaseButton v-if="store.dirty" variant="ghost" size="sm" @click="store.reset()">{{
					prefs.t['settings.reset']
				}}</BaseButton>
				<BaseButton
					type="submit"
					size="md"
					:disabled="!store.dirty || store.saveState === 'saving'"
				>
					{{
						store.saveState === 'saving'
							? prefs.t['settings.saving']
							: prefs.t['settings.save']
					}}
				</BaseButton>
			</div>
		</div>
	</form>
</template>

<style scoped>
.form {
	position: relative;
}

.row {
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 1.25rem;
	margin: 0;
	padding: clamp(1.75rem, 3.5vw, 2.5rem) var(--pad);
	border: 0;
	border-top: 1px solid var(--border);
	min-width: 0;
}

.row__label {
	display: grid;
	align-content: start;
	gap: 0.5rem;
}

.row__title {
	padding: 0;
	font-size: clamp(1.1875rem, 1.05rem + 0.5vw, 1.4375rem);
	font-weight: 500;
	line-height: 1.3;
	letter-spacing: -0.02em;
}

.row__label .hint {
	max-width: 44ch;
}

.row__control {
	display: grid;
	align-content: start;
	gap: 0.75rem;
	min-width: 0;
}

/* Le fieldset place sa légende hors de la grille : on la remet dans le flux. */
fieldset.row > .row__label > legend {
	float: left;
	width: 100%;
}

.select-dot {
	position: relative;
}

.select-dot__dot {
	position: absolute;
	top: 50%;
	left: 1rem;
	width: 0.625rem;
	height: 0.625rem;
	border-radius: 50%;
	translate: 0 -50%;
	pointer-events: none;
}

.select-dot .field {
	padding-left: 2.25rem;
}

.notice {
	display: flex;
	gap: 0.625rem;
	padding: 0.875rem 1rem;
	border: 1px solid var(--border);
	border-radius: var(--radius-m);
	background: var(--bg-elevated);
	color: var(--fg-muted);
	font-size: 0.875rem;
	line-height: 1.55;
}

.notice--warn {
	border-color: color-mix(in oklch, var(--warn) 30%, transparent);
	background: var(--warn-soft);
	color: var(--warn);
}

.notice svg {
	flex: none;
	margin-top: 0.15rem;
}

/* Règles de rôles : une carte par règle, trois champs côte à côte dès qu'il y a la place. */
.rules {
	display: grid;
	gap: 0.75rem;
}

.rule-item {
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 0.75rem;
	padding: 1rem 3.25rem 1rem 1rem;
	border: 1px solid var(--border);
	border-radius: var(--radius-m);
	background: linear-gradient(135deg, var(--bg-elevated), var(--bg));
}

.rule-item--invalid {
	border-color: var(--danger);
	box-shadow: 0 0 0 3px var(--danger-soft);
}

.rule-item__field {
	display: grid;
	gap: 0.375rem;
	min-width: 0;
}

.rule-item__label {
	color: var(--fg-faint);
	font-size: 0.75rem;
}

.rule-item__remove {
	position: absolute;
	top: 0.75rem;
	right: 0.75rem;
	display: grid;
	place-items: center;
	width: 2rem;
	height: 2rem;
	border: 1px solid var(--border-strong);
	border-radius: 999px;
	background: var(--bg);
	color: var(--fg-muted);
	cursor: pointer;
	transition:
		color 0.2s ease,
		border-color 0.2s ease;
}

.rule-item__remove:hover {
	color: var(--danger);
	border-color: var(--danger);
}

@media (min-width: 560px) {
	.rule-item {
		grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr) minmax(0, 1.25fr);
		align-items: end;
	}

	.rule-item__remove {
		top: auto;
		bottom: 1.125rem;
	}
}

/* Interrupteur : piste noire quand il est actif. */
.switch {
	position: relative;
	width: 3.5rem;
	height: 2rem;
	padding: 0;
	border: 1px solid var(--border-strong);
	border-radius: 999px;
	background: var(--bg-elevated);
	box-shadow: var(--shadow-well);
	cursor: pointer;
	transition: border-color 0.2s ease;
}

.switch__track {
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: var(--switch-on);
	opacity: 0;
	transition: opacity 0.25s ease;
}

.switch__thumb {
	position: absolute;
	top: 50%;
	left: 0.1875rem;
	width: 1.5rem;
	height: 1.5rem;
	border-radius: 50%;
	background: var(--bg);
	box-shadow: var(--shadow-pop);
	translate: 0 -50%;
	transition: transform 0.25s var(--ease-out);
}

.switch--on {
	border-color: transparent;
}

.switch--on .switch__track {
	opacity: 1;
}

.switch--on .switch__thumb {
	transform: translateX(1.5rem);
}

.choices {
	display: grid;
	gap: 1px;
	overflow: hidden;
	border: 1px solid var(--border);
	border-radius: var(--radius-m);
	background: var(--border);
}

.choices--invalid {
	border-color: var(--danger);
	box-shadow: 0 0 0 3px var(--danger-soft);
}

.choice {
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.875rem;
	padding: 1rem 1.125rem;
	background: var(--bg);
	cursor: pointer;
	transition: background-color 0.2s ease;
}

/* Le vrai bouton radio couvre tout le choix, invisible : un clic n'importe où le coche. */
.choice__input {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	margin: 0;
	opacity: 0;
	cursor: pointer;
}

.choice:hover {
	background: var(--hover);
}

.choice:has(input:focus-visible) {
	outline: 2px solid var(--accent-strong);
	outline-offset: -2px;
}

.choice__mark {
	position: relative;
	display: grid;
	place-items: center;
	flex: none;
	width: 1.25rem;
	height: 1.25rem;
	overflow: hidden;
	border: 1px solid var(--border-strong);
	border-radius: 999px;
	color: transparent;
}

.choice--on {
	background: linear-gradient(135deg, var(--bg-elevated), var(--bg));
}

.choice--on .choice__mark {
	border-color: var(--fg);
	background: var(--fg);
	color: var(--bg);
}

.choice__text {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	justify-content: space-between;
	gap: 0.25rem 1rem;
	flex: 1;
	font-size: 0.9375rem;
	font-weight: 400;
}

.choice__text code {
	color: var(--fg-faint);
}

/* Barre d'enregistrement collée au bas de l'écran pendant qu'on fait défiler le formulaire. */
.bar {
	position: sticky;
	bottom: 0;
	z-index: 20;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem 1.5rem;
	padding: 1rem var(--pad);
	border-top: 1px solid var(--border);
	background: color-mix(in oklch, var(--bg) 96%, transparent);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
}

.bar__line {
	position: absolute;
	top: -1px;
	left: 0;
	right: 0;
	height: 2px;
	opacity: 0;
	transition: opacity 0.25s ease;
}

.bar--dirty .bar__line {
	opacity: 1;
}

.bar__status {
	color: var(--fg-muted);
	font-size: 0.875rem;
}

.bar__ok {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--ok);
}

.bar__actions {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

@media (min-width: 960px) {
	.row {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
		gap: clamp(2rem, 5vw, 5rem);
	}

	.choices {
		grid-template-columns: repeat(3, 1fr);
	}

	.choice__text {
		flex-direction: column;
		align-items: flex-start;
	}
}
</style>

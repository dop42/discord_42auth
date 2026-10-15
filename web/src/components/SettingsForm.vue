<script setup lang="ts">
import {
	MAX_ROLE_RULES,
	NICKNAME_MODES,
	RULE_KINDS,
	type GuildSettings,
	type NicknameMode,
} from '@shared/api';
import { Check, Plus, TriangleAlert, X } from 'lucide-vue-next';
import { computed, nextTick, watch } from 'vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseSwitch from '@/components/ui/BaseSwitch.vue';
import { headingId, sectionId } from '@/settings/sections';
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

/** Id of the message saying a field was refused; it only exists while the field is refused. */
const errorId = (field: keyof GuildSettings) => `${field}-error`;
/** The help of a field, plus its error while it has one, for `aria-describedby`. */
const describedBy = (field: keyof GuildSettings, ...help: string[]) =>
	[...help, ...(invalid(field) ? [errorId(field)] : [])].join(' ') || undefined;

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
	// The new rule's first field takes the focus, so a keyboard user lands where they type.
	const index = store.draft.roleRules.length - 1;
	void nextTick(() => document.getElementById(`rule-${String(index)}-kind`)?.focus());
}

function removeRule(index: number): void {
	store.draft?.roleRules.splice(index, 1);
	// The button just removed had the focus: hand it to "Add a rule" rather than to the page.
	void nextTick(() => document.getElementById('add-rule')?.focus());
}

/** The control a refused field is fixed in, by setting. */
const controlOf: Record<keyof GuildSettings, () => string> = {
	roleId: () => 'role',
	campus: () => 'campus',
	studentsOnly: () => 'students',
	nickname: () => `nickname-${store.draft?.nickname ?? 'login'}`,
	helpers: () => 'helpers',
	logChannelId: () => 'logs',
	roleRules: () =>
		store.invalidIndex === null ? 'add-rule' : `rule-${String(store.invalidIndex)}-value`,
};

// A refused save takes the focus to the field to fix, wherever it sits on the page.
watch(
	() => store.saveState,
	async (state) => {
		if (state !== 'invalid' || !store.invalidField) return;
		await nextTick();
		const control = document.getElementById(controlOf[store.invalidField]());
		control?.focus({ preventScroll: true });
		control?.scrollIntoView({ block: 'center' });
	},
);

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
		<section :id="sectionId('access')" class="group" :aria-labelledby="headingId('access')">
			<header class="group__head">
				<h2 :id="headingId('access')" class="group__title" tabindex="-1">
					{{ prefs.t['sections.access'] }}
				</h2>
				<p class="group__lead">{{ prefs.t['sections.access.lead'] }}</p>
			</header>

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
							:aria-describedby="
								describedBy(
									'roleId',
									'role-help',
									...(someUnassignable ? ['role-warn'] : []),
								)
							"
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
								}}{{
									role.assignable ? '' : ` — ${prefs.t['settings.role.above']}`
								}}
							</option>
						</select>
					</div>
					<p v-if="invalid('roleId')" :id="errorId('roleId')" class="error-text">
						{{ prefs.t['settings.invalid'] }}
					</p>
					<p v-if="someUnassignable" id="role-warn" class="notice notice--warn">
						<TriangleAlert :size="16" :stroke-width="1.8" aria-hidden="true" />
						<span>{{ prefs.t['settings.role.warn'] }}</span>
					</p>
				</div>
			</div>

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
						:aria-describedby="describedBy('campus', 'campus-help')"
						@input="onCampus"
					/>
					<p v-if="invalid('campus')" :id="errorId('campus')" class="error-text">
						{{ prefs.t['settings.invalid'] }}
					</p>
				</div>
			</div>

			<div class="row">
				<div class="row__label">
					<span id="students-label" class="row__title">{{
						prefs.t['settings.students']
					}}</span>
					<p id="students-help" class="hint">{{ prefs.t['settings.students.help'] }}</p>
				</div>
				<div class="row__control">
					<BaseSwitch
						id="students"
						v-model="store.draft.studentsOnly"
						labelledby="students-label"
						:describedby="describedBy('studentsOnly', 'students-help')"
						:invalid="invalid('studentsOnly')"
					/>
					<p
						v-if="invalid('studentsOnly')"
						:id="errorId('studentsOnly')"
						class="error-text"
					>
						{{ prefs.t['settings.invalid'] }}
					</p>
				</div>
			</div>
		</section>

		<section :id="sectionId('members')" class="group" :aria-labelledby="headingId('members')">
			<header class="group__head">
				<h2 :id="headingId('members')" class="group__title" tabindex="-1">
					{{ prefs.t['sections.members'] }}
				</h2>
				<p class="group__lead">{{ prefs.t['sections.members.lead'] }}</p>
			</header>

			<fieldset class="row" aria-describedby="rules-help">
				<div class="row__label">
					<legend class="row__title">{{ prefs.t['settings.rules'] }}</legend>
					<p id="rules-help" class="hint">{{ prefs.t['settings.rules.help'] }}</p>
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
						>
							<fieldset class="rule-item__group">
								<legend class="visually-hidden">
									{{ prefs.t['settings.rules.rule'](i + 1) }}
								</legend>
								<label class="rule-item__field" :for="`rule-${i}-kind`">
									<span class="rule-item__label">{{
										prefs.t['settings.rules.kind']
									}}</span>
									<select
										:id="`rule-${i}-kind`"
										v-model="rule.kind"
										class="field"
									>
										<option
											v-for="kind in RULE_KINDS"
											:key="kind"
											:value="kind"
										>
											{{ prefs.t['settings.rules.kinds'][kind] }}
										</option>
									</select>
								</label>
								<label class="rule-item__field" :for="`rule-${i}-value`">
									<span class="rule-item__label">{{
										prefs.t['settings.rules.value']
									}}</span>
									<input
										:id="`rule-${i}-value`"
										v-model="rule.value"
										type="text"
										maxlength="64"
										autocomplete="off"
										class="field"
										:inputmode="rule.kind === 'level' ? 'decimal' : 'text'"
										:placeholder="
											prefs.t['settings.rules.placeholders'][rule.kind]
										"
										:aria-invalid="invalidRule(i)"
										:aria-describedby="
											invalidRule(i) ? errorId('roleRules') : undefined
										"
									/>
								</label>
								<label class="rule-item__field" :for="`rule-${i}-role`">
									<span class="rule-item__label">{{
										prefs.t['settings.rules.role']
									}}</span>
									<select
										:id="`rule-${i}-role`"
										v-model="rule.roleId"
										class="field rule-item__role"
									>
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
							</fieldset>
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
					<p v-if="invalid('roleRules')" :id="errorId('roleRules')" class="error-text">
						{{
							store.invalidIndex === null
								? prefs.t['settings.invalid']
								: prefs.t['settings.rules.invalid'](store.invalidIndex + 1)
						}}
					</p>
					<div>
						<BaseButton
							id="add-rule"
							variant="ghost"
							size="sm"
							:disabled="store.draft.roleRules.length >= MAX_ROLE_RULES"
							:aria-describedby="
								store.draft.roleRules.length >= MAX_ROLE_RULES
									? 'rules-max'
									: undefined
							"
							@click="addRule"
						>
							<Plus :size="14" :stroke-width="1.8" aria-hidden="true" />
							{{ prefs.t['settings.rules.add'] }}
						</BaseButton>
					</div>
					<p
						v-if="store.draft.roleRules.length >= MAX_ROLE_RULES"
						id="rules-max"
						class="hint"
					>
						{{ prefs.t['settings.rules.max'] }}
					</p>
				</div>
			</fieldset>

			<fieldset
				class="row"
				aria-describedby="nickname-help"
				:aria-invalid="invalid('nickname') || undefined"
			>
				<div class="row__label">
					<legend class="row__title">{{ prefs.t['settings.nickname'] }}</legend>
					<p id="nickname-help" class="hint">{{ prefs.t['settings.nickname.help'] }}</p>
				</div>
				<div class="row__control">
					<div :class="['choices', { 'choices--invalid': invalid('nickname') }]">
						<label
							v-for="mode in NICKNAME_MODES"
							:key="mode"
							:class="['choice', { 'choice--on': store.draft.nickname === mode }]"
						>
							<input
								:id="`nickname-${mode}`"
								v-model="store.draft.nickname"
								type="radio"
								name="nickname"
								:value="mode"
								class="choice__input"
								:aria-describedby="
									invalid('nickname') ? errorId('nickname') : undefined
								"
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
					<p v-if="invalid('nickname')" :id="errorId('nickname')" class="error-text">
						{{ prefs.t['settings.invalid'] }}
					</p>
				</div>
			</fieldset>
		</section>

		<section :id="sectionId('features')" class="group" :aria-labelledby="headingId('features')">
			<header class="group__head">
				<h2 :id="headingId('features')" class="group__title" tabindex="-1">
					{{ prefs.t['sections.features'] }}
				</h2>
				<p class="group__lead">{{ prefs.t['sections.features.lead'] }}</p>
			</header>

			<div class="row">
				<div class="row__label">
					<span id="helpers-label" class="row__title">{{
						prefs.t['settings.helpers']
					}}</span>
					<p id="helpers-help" class="hint">{{ prefs.t['settings.helpers.help'] }}</p>
				</div>
				<div class="row__control">
					<BaseSwitch
						id="helpers"
						v-model="store.draft.helpers"
						labelledby="helpers-label"
						:describedby="describedBy('helpers', 'helpers-help')"
						:invalid="invalid('helpers')"
					/>
					<p v-if="invalid('helpers')" :id="errorId('helpers')" class="error-text">
						{{ prefs.t['settings.invalid'] }}
					</p>
				</div>
			</div>

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
						:aria-describedby="
							describedBy('logChannelId', 'logs-help', 'logs-retention')
						"
						@change="onChannel"
					>
						<option value="">{{ prefs.t['settings.logs.none'] }}</option>
						<option v-for="channel in channels" :key="channel.id" :value="channel.id">
							#{{ channel.name }}
						</option>
					</select>
					<p
						v-if="invalid('logChannelId')"
						:id="errorId('logChannelId')"
						class="error-text"
					>
						{{ prefs.t['settings.invalid'] }}
					</p>
					<p id="logs-retention" class="notice">
						{{ prefs.t['settings.logs.retention'] }}
					</p>
				</div>
			</div>
		</section>

		<!-- Save bar -->
		<div :class="['bar', { 'bar--dirty': store.dirty }]">
			<span class="bar__line sheen-line" aria-hidden="true" />
			<p class="bar__status" aria-live="polite">
				<span v-if="store.saveState === 'error'" class="error-text">{{
					prefs.t['settings.error']
				}}</span>
				<span v-else-if="store.saveState === 'invalid'" class="error-text">{{
					prefs.t['settings.refused']
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
	container-type: inline-size;
}

/* Une catégorie : un en-tête sur fond surélevé, puis ses réglages. */
.group {
	scroll-margin-top: 5.5rem;
}

.group__head {
	display: grid;
	gap: 0.5rem;
	padding: clamp(2rem, 4vw, 3rem) var(--pad) clamp(1.25rem, 2.5vw, 1.75rem);
	border-top: 1px solid var(--border);
	background: var(--bg-elevated);
}

.group__title {
	font-size: clamp(1.625rem, 1.3rem + 1vw, 2.125rem);
	font-weight: 300;
	line-height: 1.15;
	letter-spacing: -0.03em;
}

/* Le titre reçoit le focus quand on y saute depuis la navigation : pas d'anneau sur un titre. */
.group__title:focus {
	outline: none;
}

.group__lead {
	max-width: 60ch;
	color: var(--fg-muted);
	font-size: 0.9375rem;
	line-height: 1.55;
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
	font-size: clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);
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
	padding: 1rem 3.25rem 1rem 1rem;
	border: 1px solid var(--border);
	border-radius: var(--radius-m);
	background: linear-gradient(135deg, var(--bg-elevated), var(--bg));
}

.rule-item--invalid {
	border-color: var(--danger);
	box-shadow: 0 0 0 3px var(--danger-soft);
}

/* Le fieldset d'une règle porte la grille : ses trois champs forment un groupe nommé. */
.rule-item__group {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 0.75rem;
	min-width: 0;
	margin: 0;
	padding: 0;
	border: 0;
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
	border: 1px solid var(--border-input);
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

@container (min-width: 35rem) {
	.rule-item__group {
		grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr) minmax(0, 1.25fr);
		align-items: end;
	}

	.rule-item__remove {
		top: auto;
		bottom: 1.125rem;
	}
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
	border: 1px solid var(--border-input);
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

/* Invisible tant que rien n'est modifié : inutile de l'animer. */
.bar:not(.bar--dirty) .bar__line::before {
	animation-play-state: paused;
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

@container (min-width: 48rem) {
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

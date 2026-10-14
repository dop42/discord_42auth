<script setup lang="ts">
withDefaults(
	defineProps<{
		href?: string | undefined;
		to?: string | { name: string; params: Record<string, string> } | undefined;
		variant?: 'accent' | 'solid' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit';
		disabled?: boolean;
	}>(),
	{
		href: undefined,
		to: undefined,
		variant: 'accent',
		size: 'md',
		type: 'button',
		disabled: false,
	},
);
</script>

<template>
	<RouterLink
		v-if="to"
		:to="to"
		:class="['btn', `btn--${variant}`, `btn--${size}`, { liquid: variant === 'accent' }]"
	>
		<slot />
	</RouterLink>
	<a
		v-else-if="href"
		:href="href"
		:class="['btn', `btn--${variant}`, `btn--${size}`, { liquid: variant === 'accent' }]"
	>
		<slot />
	</a>
	<button
		v-else
		:type="type"
		:disabled="disabled"
		:class="['btn', `btn--${variant}`, `btn--${size}`, { liquid: variant === 'accent' }]"
	>
		<slot />
	</button>
</template>

<style scoped>
.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	border: 1px solid transparent;
	border-radius: 999px;
	font-family: var(--font-display);
	font-weight: 400;
	letter-spacing: 0.01em;
	white-space: nowrap;
	cursor: pointer;
	transition:
		background-color 0.2s ease,
		color 0.2s ease,
		border-color 0.2s ease,
		filter 0.2s ease,
		opacity 0.2s ease,
		transform 0.15s var(--ease-out);
	-webkit-tap-highlight-color: transparent;
}

.btn:active:not(:disabled) {
	transform: scale(0.97);
}

.btn:disabled {
	opacity: 0.45;
	cursor: not-allowed;
}

.btn--sm {
	height: 2.25rem;
	padding-inline: 1.125rem;
	font-size: 0.8125rem;
}

.btn--md {
	height: 2.75rem;
	padding-inline: 1.5rem;
	font-size: 0.875rem;
}

.btn--lg {
	height: 3.25rem;
	padding-inline: 1.875rem;
	font-size: 0.9375rem;
}

.btn--accent {
	color: var(--fg);
	font-weight: 500;
	box-shadow:
		var(--shadow-button),
		0 8px 20px -10px var(--sheen-glow);
}

.btn--solid {
	background: var(--fg);
	color: var(--bg);
	box-shadow: var(--shadow-button);
}

.btn--ghost {
	background: var(--bg);
	color: var(--fg);
	border-color: var(--border-strong);
}

.btn--danger {
	background: var(--bg);
	color: var(--danger);
	border-color: color-mix(in oklch, var(--danger) 45%, transparent);
}

@media (hover: hover) {
	.btn--accent:hover:not(:disabled) {
		filter: saturate(1.2) brightness(1.03);
	}

	.btn--solid:hover:not(:disabled) {
		background: #262626;
	}

	.btn--ghost:hover:not(:disabled) {
		border-color: var(--fg-faint);
	}

	.btn--danger:hover:not(:disabled) {
		background: var(--danger);
		border-color: var(--danger);
		color: #fff;
	}
}
</style>

<template>
	<span class="ping" aria-hidden="true"><i /><i class="ping__wave" /></span>
</template>

<style scoped>
.ping {
	position: relative;
	display: inline-grid;
	flex: none;
	width: 0.4rem;
	height: 0.4rem;
}

.ping i {
	grid-area: 1 / 1;
	border-radius: 50%;
	background: radial-gradient(circle at 35% 35%, #737373, #0a0a0a);
	box-shadow: inset 0 0 0 1px rgb(16 24 40 / 15%);
}

.ping__wave {
	opacity: 0.6;
	animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes ping {
	75%,
	100% {
		transform: scale(2.6);
		opacity: 0;
	}
}

@media (prefers-reduced-motion: reduce) {
	.ping__wave {
		animation: none;
	}
}
</style>

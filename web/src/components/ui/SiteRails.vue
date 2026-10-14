<template>
	<div class="rails" aria-hidden="true">
		<div class="rails__frame">
			<i class="outer left" />
			<i class="inner left" />
			<i class="inner right" />
			<i class="outer right" />
		</div>
	</div>
</template>

<style scoped>
.rails {
	position: fixed;
	inset: 0;
	z-index: 60;
	display: flex;
	justify-content: center;
	pointer-events: none;
}

.rails__frame {
	position: relative;
	width: 100%;
	max-width: var(--frame-w);
	height: 100%;
}

i {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 1px;
	background: var(--border);
}

.outer.left {
	left: 0;
}

.inner.left {
	left: var(--rail);
}

.inner.right {
	right: var(--rail);
}

.outer.right {
	right: 0;
}
</style>

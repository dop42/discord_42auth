// For tools that do not understand SFCs (typescript-eslint); vue-tsc resolves the real file.
declare module '*.vue' {
	import type { DefineComponent } from 'vue';
	const component: DefineComponent;
	export default component;
}

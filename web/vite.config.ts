import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

const backend = 'http://localhost:3000';

export default defineConfig(({ mode }) => ({
	plugins: [
		vue(),
		// Devtools panel only in dev; the plugin is not even loaded for a production build.
		mode === 'development' && vueDevTools(),
	].filter(Boolean),
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@shared': fileURLToPath(new URL('../shared', import.meta.url)),
		},
	},
	server: {
		proxy: { '/api': backend, '/auth': backend },
	},
	build: {
		outDir: 'dist',
		sourcemap: false,
		target: 'es2022',
		chunkSizeWarningLimit: 500,
	},
	define: {
		__VUE_PROD_DEVTOOLS__: false,
		__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
		__VUE_OPTIONS_API__: false,
	},
}));

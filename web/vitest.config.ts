import { mergeConfig, defineConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default defineConfig((env) =>
	mergeConfig(viteConfig(env), {
		test: {
			environment: 'jsdom',
			include: ['src/**/*.test.ts'],
			coverage: { provider: 'v8', include: ['src/**'] },
		},
	}),
);

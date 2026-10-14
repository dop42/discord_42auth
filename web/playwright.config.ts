import { defineConfig, devices } from '@playwright/test';
import { cpus } from 'node:os';

const PORT = '4173';

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: cpus().length,
	use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } },
	],
	webServer: {
		command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
		port: Number(PORT),
		reuseExistingServer: !process.env.CI,
	},
});

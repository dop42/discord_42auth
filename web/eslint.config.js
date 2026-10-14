import js from '@eslint/js';
import prettier from '@vue/eslint-config-prettier';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
	js.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	...vue.configs['flat/recommended'],
	{
		// Plain browser scripts served as-is, outside the bundle and the TypeScript project.
		files: ['public/**/*.js'],
		extends: [tseslint.configs.disableTypeChecked],
		languageOptions: { globals: { ...globals.browser }, sourceType: 'script' },
	},
	{
		files: ['**/*.{ts,vue}'],
		languageOptions: {
			globals: { ...globals.browser },
			parserOptions: {
				parser: tseslint.parser,
				projectService: true,
				extraFileExtensions: ['.vue'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'no-console': ['error', { allow: ['warn', 'error'] }],
			'@typescript-eslint/no-explicit-any': 'error',
		},
	},
	{
		files: ['*.config.ts', 'eslint.config.js', 'e2e/**'],
		languageOptions: { globals: { ...globals.node } },
	},
	{ files: ['eslint.config.js'], ...tseslint.configs.disableTypeChecked },
	prettier,
);

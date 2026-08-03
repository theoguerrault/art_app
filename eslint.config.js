import eslintPluginSvelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
	...tseslint.configs.strict,
	...tseslint.configs.stylistic,
	...eslintPluginSvelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tseslint.parser,
				extraFileExtensions: ['.svelte']
			}
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/', 'node_modules/']
	},
	{
		rules: {
			'svelte/no-at-html-tags': 'error',
			'svelte/valid-compile': 'error',
			'svelte/require-each-key': 'error',
			'svelte/require-optimized-style-attribute': 'error',
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'eqeqeq': 'error',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
		}
	}
);

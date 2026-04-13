const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
	{
		ignores: ['src/turndown.js', 'src/turndown-plugin-gfm.js'],
	},
	js.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.webextensions,
				TurndownService: 'readonly',
				turndownPluginGfm: 'readonly',
			},
		},
		rules: {
			curly: 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			eqeqeq: 'error',
		},
	},
];

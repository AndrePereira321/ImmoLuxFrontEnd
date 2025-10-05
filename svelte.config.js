import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			'@': './src',
			'@components': './src/components',
			'@styles': './src/styles'
		}
	},
	compilerOptions: {
		warningFilter: (warning) => {
			const warningsToIgnore = ['a11y_consider_explicit_label'];
			return !warningsToIgnore.includes(warning.code.toLowerCase());
		}
	}
};

export default config;

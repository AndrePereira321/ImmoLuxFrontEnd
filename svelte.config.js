import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		env: { dir: './env' }
	},
	compilerOptions: {
		warningFilter: (warning) => {
			const warningsToIgnore = ['a11y_consider_explicit_label'];
			return !warningsToIgnore.includes(warning.code.toLowerCase());
		}
	}
};

export default config;

import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { loadEnv } from 'vite';

// The browser calls the backend (API + images) at VITE_SERVER_URL. In production
// that's the site's own origin, already covered by 'self'; in development it's
// http://localhost:8082. Vite sets NODE_ENV before this file is loaded.
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const { VITE_SERVER_URL } = loadEnv(mode, './env', 'VITE_');
const backend = VITE_SERVER_URL ? [new URL(VITE_SERVER_URL).origin] : [];

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		env: { dir: './env' },
		// SvelteKit adds a per-request nonce for its own inline script, so script-src
		// needs no 'unsafe-inline'. Styles keep 'unsafe-inline': SSR markup has style
		// attributes, and Font Awesome injects a <style> at runtime.
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'font-src': ['self'],
				// data: covers inlined small assets (Leaflet icons, the grain texture);
				// blob: covers previews of images picked for upload
				'img-src': ['self', 'data:', 'blob:', ...backend, 'https://*.tile.openstreetmap.org'],
				'connect-src': ['self', ...backend, 'https://nominatim.openstreetmap.org'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none']
			}
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

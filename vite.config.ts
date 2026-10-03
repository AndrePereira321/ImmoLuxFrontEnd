import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
	server: {
		port: 8080
	},
	envDir: './env',
	ssr: {
		noExternal: ['@fortawesome/svelte-fontawesome'],
		external: ['leaflet', 'svelte-leafletjs']
	},
	optimizeDeps: {
		exclude: ['@vinejs/vine']
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		imagetools(),
		// .gz/.br files for build/client come from adapter-node (`precompress`, on by default)
		...(process.env.ANALYZE
			? [visualizer({ filename: 'stats.html', gzipSize: true, brotliSize: true, template: 'treemap' })]
			: [])
	],
	build: {
		minify: 'terser',
		cssMinify: true,
		// No manual vendor chunking (build.rolldownOptions.output.codeSplitting):
		// groups capture their matches' dependencies too, so a broad
		// /node_modules\/.*svelte/ group pulled svelte-i18n, svelte-leafletjs,
		// svelte-fontawesome and superforms (+ zod) into one ~680 kB chunk loaded on
		// every page. Rolldown's automatic per-route splitting is ~30% lighter.
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
				pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace']
			}
		}
	}
});

import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
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
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'ImmoLux',
				short_name: 'ImmoLux',
				description: 'Propriedades de Luxo em Portugal',
				theme_color: '#1a365d',
				background_color: '#ffffff',
				display: 'standalone',
				icons: [
					{
						src: '/favicon.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
				// Setting modifyURLPrefix (even empty) opts out of @vite-pwa/sveltekit's
				// default glob-pattern injection, which otherwise always adds a
				// 'prerendered/**/*.{html,json}' pattern — irrelevant here since no
				// routes are prerendered (adapter-node + hybrid SSR) and it only ever
				// produces a "glob pattern doesn't match any files" warning.
				modifyURLPrefix: {},
				navigateFallback: null,
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'images',
							expiration: {
								maxEntries: 128,
								maxAgeSeconds: 60 * 10
							}
						}
					},
					{
						urlPattern: /^https:\/\/unpkg\.com\/.*/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'cdn-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 1
							}
						}
					}
				]
			}
		}),
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

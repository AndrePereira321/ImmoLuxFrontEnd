import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import compression from 'vite-plugin-compression';
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
		compression({
			algorithm: 'gzip',
			ext: '.gz',
			threshold: 1024
		}),
		compression({
			algorithm: 'brotliCompress',
			ext: '.br',
			threshold: 1024
		}),
		...(process.env.ANALYZE
			? [visualizer({ filename: 'stats.html', gzipSize: true, brotliSize: true, template: 'treemap' })]
			: [])
	],
	build: {
		minify: 'terser',
		cssMinify: true,
		rolldownOptions: {
			output: {
				// Rolldown (Vite 8) replaces the manualChunks function with
				// declarative codeSplitting groups — first matching group wins.
				//
				// NOTE: currently inert for the client build. SvelteKit's Vite plugin
				// forces `codeSplitting: false` on the client output in this Rolldown
				// setup (to avoid circular-dependency issues with its own per-route
				// chunking), so these groups never get applied and Rolldown falls back
				// to its own automatic vendor chunking instead. Kept here in case a
				// future SvelteKit/Rolldown version lifts that restriction — verify
				// with `npm run build:analyze` before relying on this again.
				codeSplitting: {
					groups: [
						{ name: 'vendor-svelte', test: /node_modules\/.*svelte/ },
						{ name: 'vendor-icons', test: /node_modules\/.*@fortawesome/ },
						{ name: 'vendor-i18n', test: /node_modules\/.*svelte-i18n/ },
						{ name: 'vendor-leaflet', test: /node_modules\/.*leaflet/ },
						{ name: 'vendor', test: /node_modules/ }
					]
				}
			}
		},
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
				pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace']
			}
		}
	}
});

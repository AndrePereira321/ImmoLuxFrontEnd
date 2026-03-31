import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import compression from 'vite-plugin-compression';
import { imagetools } from 'vite-imagetools';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

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
		})
	],
	build: {
		minify: 'terser',
		cssMinify: true,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules')) {
						if (id.includes('svelte')) return 'vendor-svelte';
						if (id.includes('@fortawesome')) return 'vendor-icons';
						if (id.includes('svelte-i18n')) return 'vendor-i18n';
						if (id.includes('leaflet')) return 'vendor-leaflet';
						return 'vendor';
					}
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

import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import compression from 'vite-plugin-compression';
import { imagetools } from 'vite-imagetools';
import { VitePWA } from 'vite-plugin-pwa';

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
		// Image optimization
		imagetools(),
		// PWA with service worker for caching
		VitePWA({
			registerType: 'autoUpdate',
			outDir: '.svelte-kit/output/client',
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
				globDirectory: '.svelte-kit/output/client',
				globPatterns: ['_app/**/*.{js,css,svg,woff2}', '*.{html,ico,png,svg,webmanifest}'],
				navigateFallback: null,
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'images',
							expiration: {
								maxEntries: 128,
								maxAgeSeconds: 60 * 10 // 10 minutes
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
								maxAgeSeconds: 60 * 60 * 1 // 1 hour
							}
						}
					}
				]
			}
		}),
		// Gzip compression
		compression({
			algorithm: 'gzip',
			ext: '.gz',
			threshold: 1024 // Only compress files > 1KB
		}),
		// Brotli compression (better compression than gzip)
		compression({
			algorithm: 'brotliCompress',
			ext: '.br',
			threshold: 1024
		})
	],
	build: {
		minify: 'terser',
		cssMinify: true,
		// Enable code splitting for better caching
		rollupOptions: {
			output: {
				manualChunks(id) {
					// Vendor chunks for better caching
					if (id.includes('node_modules')) {
						if (id.includes('svelte')) {
							return 'vendor-svelte';
						}
						if (id.includes('@fortawesome')) {
							return 'vendor-icons';
						}
						if (id.includes('svelte-i18n')) {
							return 'vendor-i18n';
						}
						if (id.includes('leaflet')) {
							return 'vendor-leaflet';
						}
						// All other node_modules
						return 'vendor';
					}
				}
			}
		},
		terserOptions: {
			compress: {
				drop_console: true, // Remove console.log in production
				drop_debugger: true,
				pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace']
			}
		}
	}
});

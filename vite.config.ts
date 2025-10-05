import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	server: {
		port: 8080
	},
	envDir: './env',
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@components': path.resolve(__dirname, './src/components'),
			'@styles': path.resolve(__dirname, './src/styles')
		}
	},
	build: {
		minify: 'terser',
		cssMinify: true
		// terserOptions: {
		// 	compress: {
		// 		drop_console: true, // Removes console.log from production
		// 		drop_debugger: true
		// 	}
		// }
	}
});

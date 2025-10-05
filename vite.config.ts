import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		port: 8080
	},
	envDir: './env',
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
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

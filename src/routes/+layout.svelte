<script lang="ts">
	// Webfonts are self-hosted (fontsource), so no visitor IP reaches Google Fonts.
	// Fraunces needs `full` for the SOFT/WONK/opsz axes the headings use.
	import '@fontsource-variable/fraunces/full.css';
	import '@fontsource-variable/plus-jakarta-sans/wght.css';
	import '@fontsource-variable/plus-jakarta-sans/wght-italic.css';
	import '@fontsource/dm-mono/300.css';
	import '@fontsource/dm-mono/400.css';
	import '@fontsource/dm-mono/500.css';
	import '$lib/styles/app.css';
	import '@fortawesome/fontawesome-svg-core/styles.css';
	import '$lib/i18n';
	import favicon from '$lib/assets/favicon.png';
	import AppMenu from '$lib/components/AppMenu.svelte';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import AppLoadingSpinner from '$lib/components/AppLoadingSpinner.svelte';
	import AppNotification from '$lib/components/AppNotification.svelte';
	import { authStore } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	const { children } = $props();

	let loaded = $state(false);

	onMount(async () => {
		try {
			await authStore.checkAuth();
		} finally {
			loaded = true;
		}
	});
</script>

<svelte:head>
	<link href={favicon} rel="icon" />
</svelte:head>

<div class="flex min-h-screen flex-col bg-light-100 dark:bg-dark-900">
	<div class="sticky top-0 z-50">
		<AppMenu></AppMenu>
	</div>

	<main class="flex-grow">
		{@render children?.()}
	</main>

	<AppFooter />
</div>

<!-- Notifications -->
<AppNotification />

<!-- Loading overlay — shown on client until auth check completes -->
{#if !loaded}
	<AppLoadingSpinner />
{/if}

<script lang="ts">
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

<div class="flex min-h-screen flex-col">
	<div class="sticky top-0 z-50 shadow-xl">
		<AppMenu></AppMenu>
	</div>

	<main class="flex-grow bg-light-300 px-4 py-8 dark:bg-dark-800">
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

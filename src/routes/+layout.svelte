<script lang="ts">
	import '$lib/styles/app.css';
	import '@fortawesome/fontawesome-svg-core/styles.css';
	import '$lib/i18n';
	import favicon from '$lib/assets/favicon.png';
	import AppMenu from '$lib/components/AppMenu.svelte';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import { waitLocale } from 'svelte-i18n';
	import { onMount } from 'svelte';

	const { children } = $props();

	let loaded = $state(false);

	onMount(async () => {
		try {
			await waitLocale();
		} finally {
			loaded = true;
		}
	});
</script>

<svelte:head>
	<link href={favicon} rel="icon" />
</svelte:head>

{#if loaded}
	<div class="flex min-h-screen flex-col">
		<div class="sticky top-0 z-50 shadow-xl">
			<AppMenu></AppMenu>
		</div>

		<main class="flex-grow bg-light-300 px-4 py-8">
			{@render children?.()}
		</main>

		<AppFooter />
	</div>
{/if}

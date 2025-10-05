<script lang="ts">
	import '$lib/styles/app.css';
	import '@fortawesome/fontawesome-svg-core/styles.css';
	import '$lib/i18n';
	import favicon from '$lib/assets/favicon.png';
	import AppMenu from '$lib/components/AppMenu.svelte';
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
	<nav class="sticky top-0 z-50 border-b border-primary-100 bg-light-300 shadow-md">
		<div class="px-4 py-3 md:px-8 md:py-4">
			<AppMenu></AppMenu>
		</div>
	</nav>

	<main>
		<div class="text-primary-500">main</div>
		{@render children?.()}
	</main>
{/if}

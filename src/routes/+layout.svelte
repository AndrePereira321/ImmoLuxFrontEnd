<script lang="ts">
	import '$lib/styles/app.css';
	import '@fortawesome/fontawesome-svg-core/styles.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppMenu from '$lib/components/AppMenu.svelte';

	const { children } = $props();
</script>

<svelte:head>
	<link href={favicon} rel="icon" />
</svelte:head>

<nav class="sticky top-0 z-50 bg-light-300 shadow-md border-b border-primary-100">
	<div class="px-4 md:px-8 py-3 md:py-4">
		<AppMenu></AppMenu>
	</div>
</nav>

<main>
	<div class="text-primary-500">main</div>
	{@render children?.()}
</main>

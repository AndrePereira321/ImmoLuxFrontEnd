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

<nav class="px-6 py-8">
	<AppMenu></AppMenu>
</nav>

<main>
	<div class="text-primary-500">main</div>
	{@render children?.()}
</main>

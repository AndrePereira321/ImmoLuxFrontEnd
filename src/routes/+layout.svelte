<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';

	const { children } = $props();
</script>

<svelte:head>
	<link href={favicon} rel="icon" />
</svelte:head>

<nav>
	<a data-sveltekit-preload-data="hover" href={resolve('/')}>Home</a>
	<a data-sveltekit-preload-data="hover" href={resolve('/houses')}>Houses</a>
</nav>

<main>
	<div>main</div>
	{@render children?.()}
</main>

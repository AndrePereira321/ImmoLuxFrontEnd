<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
	import { themeStore } from '$lib/stores/theme';

	const toggleTheme = () => {
		themeStore.toggle();
	};
</script>

<button
	onclick={toggleTheme}
	class="relative inline-flex h-7 w-14 items-center rounded-full border border-light-400/60 bg-light-200 transition-colors hover:bg-light-300 focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-1 focus:outline-none dark:border-dark-600/60 dark:bg-dark-700 dark:hover:bg-dark-600"
	aria-label="Toggle theme"
>
	<!-- Sliding circle -->
	<span
		class="absolute flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out dark:bg-dark-500"
		class:translate-x-1={$themeStore === 'light'}
		class:translate-x-8={$themeStore === 'dark'}
	>
		{#if $themeStore === 'dark'}
			<FontAwesomeIcon icon={faMoon} class="text-[0.6rem] text-light-200" />
		{:else}
			<FontAwesomeIcon icon={faSun} class="text-[0.6rem] text-secondary-600" />
		{/if}
	</span>

	<!-- Fixed icons in background -->
	<span
		class="absolute left-1.5 flex items-center justify-center text-[0.55rem] text-dark-400 transition-opacity duration-200"
		class:opacity-0={$themeStore === 'light'}
		class:opacity-50={$themeStore === 'dark'}
	>
		<FontAwesomeIcon icon={faSun} />
	</span>
	<span
		class="absolute right-1.5 flex items-center justify-center text-[0.55rem] text-dark-400 transition-opacity duration-200"
		class:opacity-50={$themeStore === 'light'}
		class:opacity-0={$themeStore === 'dark'}
	>
		<FontAwesomeIcon icon={faMoon} />
	</span>
</button>

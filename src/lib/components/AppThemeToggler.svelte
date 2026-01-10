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
	class="relative inline-flex h-8 w-16 items-center rounded-full bg-primary-700 transition-colors hover:bg-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none dark:bg-dark-700 dark:hover:bg-dark-600 dark:focus:ring-dark-500"
	aria-label="Toggle theme"
>
	<!-- Sliding circle -->
	<span
		class="absolute flex h-6 w-6 items-center justify-center rounded-full bg-light-50 shadow-lg transition-transform duration-300 ease-in-out dark:bg-light-100"
		class:translate-x-1={$themeStore === 'light'}
		class:translate-x-9={$themeStore === 'dark'}
	>
		{#if $themeStore === 'dark'}
			<FontAwesomeIcon icon={faMoon} class="text-xs text-dark-800" />
		{:else}
			<FontAwesomeIcon icon={faSun} class="text-xs text-secondary-500" />
		{/if}
	</span>

	<!-- Fixed icons in background -->
	<span
		class="absolute left-1.5 flex items-center justify-center text-xs transition-opacity duration-300"
		class:opacity-0={$themeStore === 'light'}
		class:opacity-60={$themeStore === 'dark'}
	>
		<FontAwesomeIcon icon={faSun} />
	</span>
	<span
		class="absolute right-1.5 flex items-center justify-center text-xs transition-opacity duration-300"
		class:opacity-60={$themeStore === 'light'}
		class:opacity-0={$themeStore === 'dark'}
	>
		<FontAwesomeIcon icon={faMoon} />
	</span>
</button>

<script lang="ts">
	/**
	 * Two shapes, one control.
	 *
	 * `switch` is for a labelled row, where the track shows which of the two
	 * states is current. `icon` is for the top bar, where there is no room for a
	 * label and a sliding track reads as a stray piece of UI kit among the
	 * square-cornered fields the rest of the page is built from.
	 */
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
	import { _ } from 'svelte-i18n';
	import { themeStore } from '$lib/stores/theme';

	interface Props {
		variant?: 'switch' | 'icon';
	}

	let { variant = 'switch' }: Props = $props();

	const toggleTheme = () => {
		themeStore.toggle();
	};

	/** Names what pressing it does, rather than saying "toggle" and leaving the
	    reader to work out which way it goes. */
	const actionLabel = $derived($_($themeStore === 'dark' ? 'menu.themeToLight' : 'menu.themeToDark'));
</script>

{#if variant === 'icon'}
	<!-- Shows the destination, not the current state: in daylight you are offered
	     the moon.

	     The two icons are separate blocks rather than one `icon={cond ? a : b}`.
	     svelte-fontawesome resolves that prop once, with `const`, when the
	     component is created — passing it a new icon changes nothing on screen,
	     which is why this button used to sit on the moon in both themes. -->
	<button
		onclick={toggleTheme}
		class="flex h-9 w-9 items-center justify-center text-dark-500 transition-colors hover:bg-light-400/70 hover:text-dark-900 dark:text-light-500 dark:hover:bg-dark-700/70 dark:hover:text-light-100"
		aria-label={actionLabel}
	>
		{#if $themeStore === 'dark'}
			<FontAwesomeIcon icon={faSun} />
		{:else}
			<FontAwesomeIcon icon={faMoon} />
		{/if}
	</button>
{:else}
	<button
		onclick={toggleTheme}
		class="relative inline-flex h-7 w-14 items-center rounded-full border border-light-400/60 bg-light-200 transition-colors hover:bg-light-300 dark:border-dark-600/60 dark:bg-dark-700 dark:hover:bg-dark-600"
		aria-label={actionLabel}
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
{/if}

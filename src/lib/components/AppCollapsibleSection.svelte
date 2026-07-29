<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
	import { slide } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { untrack } from 'svelte';

	interface Props {
		title: string;
		defaultOpen?: boolean;
		children?: Snippet;
	}

	let { title, defaultOpen = true, children }: Props = $props();

	let isOpen = $state(untrack(() => defaultOpen));

	const toggle = () => {
		isOpen = !isOpen;
	};
</script>

<!-- One tile of the form's panel: glaze over the grout line, the section name set
     as a mono record like every field name on the site. -->
<div class="azulejo-cell azulejo-rule overflow-hidden border">
	<button
		type="button"
		onclick={toggle}
		aria-expanded={isOpen}
		class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-light-100 sm:px-6 dark:hover:bg-dark-700"
	>
		<h3 class="type-label text-primary-700 dark:text-primary-300">
			{title}
		</h3>
		<!-- Separate blocks, not one switched prop: svelte-fontawesome reads its icon
		     once at creation, so the chevron never turned over. -->
		{#if isOpen}
			<FontAwesomeIcon icon={faChevronUp} class="text-xs text-dark-400 dark:text-light-600" />
		{:else}
			<FontAwesomeIcon icon={faChevronDown} class="text-xs text-dark-400 dark:text-light-600" />
		{/if}
	</button>

	{#if isOpen}
		<div transition:slide={{ duration: 300 }} class="azulejo-rule border-t p-5 sm:p-6">
			{#if children}
				{@render children()}
			{/if}
		</div>
	{/if}
</div>

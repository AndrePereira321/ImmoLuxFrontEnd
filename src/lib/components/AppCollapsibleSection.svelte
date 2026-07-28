<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
	import { slide } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { untrack } from 'svelte';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

	interface Props {
		title: string;
		defaultOpen?: boolean;
		icon?: IconDefinition;
		children?: Snippet;
	}

	let { title, defaultOpen = true, icon, children }: Props = $props();

	let isOpen = $state(untrack(() => defaultOpen));

	const toggle = () => {
		isOpen = !isOpen;
	};
</script>

<div class="overflow-hidden rounded-lg border border-light-600 bg-light-50 dark:border-dark-600 dark:bg-dark-700">
	<button
		type="button"
		onclick={toggle}
		class="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-light-100 dark:hover:bg-dark-600"
	>
		<div class="flex items-center gap-3">
			{#if icon}
				<FontAwesomeIcon {icon} class="text-lg text-primary-600 dark:text-primary-400" />
			{/if}
			<h3 class="text-lg font-semibold text-dark-900 dark:text-light-50">
				{title}
			</h3>
		</div>
		<!-- Separate blocks, not one switched prop: svelte-fontawesome reads its icon
		     once at creation, so the chevron never turned over. -->
		{#if isOpen}
			<FontAwesomeIcon icon={faChevronUp} class="text-dark-600 dark:text-light-400" />
		{:else}
			<FontAwesomeIcon icon={faChevronDown} class="text-dark-600 dark:text-light-400" />
		{/if}
	</button>

	{#if isOpen}
		<div transition:slide={{ duration: 300 }} class="border-t border-light-300 p-4 dark:border-dark-600">
			{#if children}
				{@render children()}
			{/if}
		</div>
	{/if}
</div>

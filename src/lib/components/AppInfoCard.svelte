<script lang="ts">
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
	import type { Snippet } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	interface Props {
		icon: IconDefinition;
		iconColor?: 'primary' | 'secondary' | 'success' | 'info' | 'warning';
		title?: string;
		class?: string;
		children?: Snippet;
	}

	let { icon, iconColor = 'primary', title, class: className = '', children }: Props = $props();

	const colorClasses = $derived(() => {
		switch (iconColor) {
			case 'primary':
				return {
					bg: 'bg-primary-50 dark:bg-primary-950/40',
					icon: 'text-primary-600 dark:text-primary-400',
					border: 'group-hover:border-primary-200 dark:group-hover:border-primary-800/60'
				};
			case 'secondary':
				return {
					bg: 'bg-secondary-50 dark:bg-secondary-950/40',
					icon: 'text-secondary-700 dark:text-secondary-400',
					border: 'group-hover:border-secondary-200 dark:group-hover:border-secondary-800/60'
				};
			case 'success':
				return {
					bg: 'bg-success-50 dark:bg-success-950/40',
					icon: 'text-success-600 dark:text-success-400',
					border: 'group-hover:border-success-200 dark:group-hover:border-success-800/60'
				};
			case 'info':
				return {
					bg: 'bg-info-50 dark:bg-info-950/40',
					icon: 'text-info-600 dark:text-info-400',
					border: 'group-hover:border-info-200 dark:group-hover:border-info-800/60'
				};
			case 'warning':
				return {
					bg: 'bg-warning-50 dark:bg-warning-950/40',
					icon: 'text-warning-600 dark:text-warning-400',
					border: 'group-hover:border-warning-200 dark:group-hover:border-warning-800/60'
				};
			default:
				return {
					bg: 'bg-primary-50 dark:bg-primary-950/40',
					icon: 'text-primary-600 dark:text-primary-400',
					border: 'group-hover:border-primary-200 dark:group-hover:border-primary-800/60'
				};
		}
	});
</script>

<div
	class={`group relative overflow-hidden rounded-2xl border border-light-300/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:p-10 dark:border-dark-700/60 dark:bg-dark-800 ${colorClasses().border} ${className}`}
>
	<div class="relative text-center">
		<!-- Icon -->
		<div class="mb-6 flex justify-center">
			<div
				class={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${colorClasses().bg} transition-transform duration-300 group-hover:scale-110`}
			>
				<FontAwesomeIcon {icon} size="lg" class={colorClasses().icon} />
			</div>
		</div>

		<!-- Title (optional) -->
		{#if title}
			<h3 class="mb-3 text-xl font-normal text-dark-900 dark:text-light-50">
				{title}
			</h3>
		{/if}

		<!-- Content -->
		<div class="text-[0.938rem] leading-relaxed text-dark-500 dark:text-light-500">
			{@render children?.()}
		</div>
	</div>
</div>

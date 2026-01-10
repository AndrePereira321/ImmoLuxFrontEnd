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
					bg: 'bg-primary-100 dark:bg-primary-900',
					icon: 'text-primary-600 dark:text-primary-400',
					glow: 'bg-primary-100 dark:bg-primary-900'
				};
			case 'secondary':
				return {
					bg: 'bg-secondary-100 dark:bg-secondary-900',
					icon: 'text-secondary-600 dark:text-secondary-400',
					glow: 'bg-secondary-100 dark:bg-secondary-900'
				};
			case 'success':
				return {
					bg: 'bg-success-100 dark:bg-success-900',
					icon: 'text-success-600 dark:text-success-400',
					glow: 'bg-success-100 dark:bg-success-900'
				};
			case 'info':
				return {
					bg: 'bg-info-100 dark:bg-info-900',
					icon: 'text-info-600 dark:text-info-400',
					glow: 'bg-info-100 dark:bg-info-900'
				};
			case 'warning':
				return {
					bg: 'bg-warning-100 dark:bg-warning-900',
					icon: 'text-warning-600 dark:text-warning-400',
					glow: 'bg-warning-100 dark:bg-warning-900'
				};
			default:
				return {
					bg: 'bg-primary-100 dark:bg-primary-900',
					icon: 'text-primary-600 dark:text-primary-400',
					glow: 'bg-primary-100 dark:bg-primary-900'
				};
		}
	});
</script>

<div
	class={`group relative overflow-hidden rounded-2xl bg-light-50 p-10 shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl md:p-12 dark:bg-dark-700 ${className}`}
>
	<!-- Glow Effect -->
	<div
		class={`absolute top-0 right-0 h-40 w-40 translate-x-20 -translate-y-20 rounded-full opacity-30 blur-3xl transition-transform duration-500 group-hover:scale-150 ${colorClasses().glow}`}
	></div>

	<div class="relative text-center">
		<!-- Icon -->
		<div class="mb-6 flex justify-center">
			<div class={`inline-block rounded-full p-5 ${colorClasses().bg}`}>
				<FontAwesomeIcon {icon} size="3x" class={colorClasses().icon} />
			</div>
		</div>

		<!-- Title (optional) -->
		{#if title}
			<h3 class="mb-4 text-2xl font-light text-dark-900 dark:text-light-50">
				{title}
			</h3>
		{/if}

		<!-- Content -->
		<div class="text-lg leading-relaxed font-light text-dark-700 dark:text-light-200">
			{@render children?.()}
		</div>
	</div>
</div>

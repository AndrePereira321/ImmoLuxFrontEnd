<script lang="ts">
	interface Props {
		variant?: 'default' | 'gradient' | 'decorative';
		class?: string;
	}

	let { variant = 'default', class: className = '' }: Props = $props();
</script>

{#if variant === 'default'}
	<div
		class={`relative h-px w-full bg-gradient-to-r from-transparent via-dark-300 to-transparent dark:via-light-700 ${className}`}
	></div>
{:else if variant === 'gradient'}
	<div class={`relative py-8 ${className}`}>
		<div
			class="absolute inset-0 bg-gradient-to-b from-transparent via-primary-100/30 to-transparent dark:via-primary-900/20"
		></div>
		<div
			class="relative mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-primary-500 to-transparent"
		></div>
	</div>
{:else if variant === 'decorative'}
	<div class={`relative py-8 ${className}`}>
		<div class="mx-auto flex max-w-7xl items-center justify-center gap-4">
			<div class="h-px flex-1 bg-gradient-to-r from-transparent to-primary-400 dark:to-primary-600"></div>
			<div class="flex gap-2">
				<span class="h-2 w-2 rounded-full bg-primary-500 dark:bg-primary-600"></span>
				<span class="h-2 w-2 rounded-full bg-secondary-500 dark:bg-secondary-600"></span>
				<span class="h-2 w-2 rounded-full bg-primary-500 dark:bg-primary-600"></span>
			</div>
			<div class="h-px flex-1 bg-gradient-to-l from-transparent to-primary-400 dark:to-primary-600"></div>
		</div>
	</div>
{/if}

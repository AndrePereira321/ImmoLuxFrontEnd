<script lang="ts">
	interface Props {
		variant?: 'default' | 'gradient' | 'decorative';
		class?: string;
	}

	let { variant = 'default', class: className = '' }: Props = $props();
</script>

{#if variant === 'default'}
	<div
		class={`mx-auto h-px max-w-7xl bg-gradient-to-r from-transparent via-light-400/50 to-transparent dark:via-dark-600/50 ${className}`}
	></div>
{:else if variant === 'gradient'}
	<div class={`relative py-6 ${className}`}>
		<div
			class="mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-primary-400/40 to-transparent dark:via-primary-600/30"
		></div>
	</div>
{:else if variant === 'decorative'}
	<div class={`relative py-4 ${className}`}>
		<div class="mx-auto flex max-w-7xl items-center justify-center gap-6 px-8">
			<div class="h-px flex-1 bg-gradient-to-r from-transparent to-light-400/60 dark:to-dark-600/60"></div>
			<div class="h-1.5 w-1.5 rounded-full bg-secondary-400/70 dark:bg-secondary-600/60"></div>
			<div class="h-px flex-1 bg-gradient-to-l from-transparent to-light-400/60 dark:to-dark-600/60"></div>
		</div>
	</div>
{/if}

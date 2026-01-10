<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'tertiary';
		class?: string;
		fullWidth?: boolean;
		children?: Snippet;
	}

	let { variant = 'primary', class: className = '', fullWidth = false, children }: Props = $props();

	const variantClasses = $derived(() => {
		switch (variant) {
			case 'primary':
				return 'bg-light-50 dark:bg-dark-900';
			case 'secondary':
				return 'bg-light-100 dark:bg-dark-800';
			case 'tertiary':
				return 'bg-light-200 dark:bg-dark-850';
			default:
				return 'bg-light-50 dark:bg-dark-900';
		}
	});
</script>

<section class={`px-6 py-12 md:px-8 md:py-16 ${variantClasses()} ${className}`}>
	<div class={fullWidth ? 'mx-auto max-w-full' : 'mx-auto max-w-7xl'}>
		{@render children?.()}
	</div>
</section>

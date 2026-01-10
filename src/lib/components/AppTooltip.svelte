<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';

	interface Props {
		triggeredBy: string;
		placement?: 'top' | 'right' | 'bottom' | 'left';
		children?: any;
	}

	let { triggeredBy, placement = 'bottom', children }: Props = $props();
</script>

<Tooltip
	{triggeredBy}
	{placement}
	class="rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm font-medium text-light-50 shadow-lg dark:border-dark-500 dark:bg-dark-700 dark:text-light-50"
>
	{@render children?.()}
</Tooltip>

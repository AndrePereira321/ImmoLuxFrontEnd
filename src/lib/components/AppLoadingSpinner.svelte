<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSpinner } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		message?: string;
		overlay?: boolean;
	}

	let { message = 'Loading...', overlay = false }: Props = $props();
</script>

<div
	class="fixed inset-0 flex items-center justify-center {overlay
		? 'z-[100] bg-dark-900/70 backdrop-blur-sm'
		: 'z-50 bg-light-50 dark:bg-dark-900'}"
>
	<div class="text-center">
		<FontAwesomeIcon icon={faSpinner} class="animate-spin text-6xl text-primary-600 dark:text-primary-400" />
		<p class="mt-4 text-lg font-medium {overlay ? 'text-light-50' : 'text-dark-600 dark:text-light-400'}">{message}</p>
	</div>
</div>

<script lang="ts">
	interface Props {
		message?: string;
		overlay?: boolean;
	}

	let { message = 'Loading...', overlay = false }: Props = $props();
</script>

<div
	class="fixed inset-0 flex items-center justify-center {overlay
		? 'z-[100] bg-dark-900/50 backdrop-blur-sm'
		: 'z-50 bg-light-50 dark:bg-dark-900'} anim-fade-in"
	style="animation-duration: 0.2s"
>
	<div class="text-center">
		<!-- Elegant spinner -->
		<div class="relative mx-auto mb-5 h-12 w-12">
			<div class="absolute inset-0 rounded-full border-2 border-light-300 dark:border-dark-600"></div>
			<div
				class="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary-600 dark:border-t-primary-400"
				style="animation-duration: 0.8s"
			></div>
		</div>
		<p class="text-sm font-medium {overlay ? 'text-light-100' : 'text-dark-500 dark:text-light-500'}">{message}</p>
	</div>
</div>

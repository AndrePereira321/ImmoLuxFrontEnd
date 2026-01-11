<script lang="ts">
	interface Props {
		id: string;
		label: string;
		value?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		rows?: number;
	}

	let {
		id,
		label,
		value = $bindable(''),
		placeholder = ' ',
		required = false,
		disabled = false,
		error = '',
		rows = 3
	}: Props = $props();
</script>

<div class="relative">
	<textarea
		{id}
		bind:value
		{placeholder}
		{required}
		{disabled}
		{rows}
		class="peer w-full rounded-lg border-2 px-4 pt-7 pb-3 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 {error
			? 'border-error-600 bg-error-50 text-error-900 focus:border-error-600 dark:border-error-500 dark:bg-error-900/20 dark:text-error-50 dark:focus:border-error-500'
			: 'border-light-600 bg-light-50 text-dark-900 focus:border-primary-600 dark:border-dark-600 dark:bg-dark-700 dark:text-light-50 dark:focus:border-primary-500'}"
	></textarea>
	<label
		for={id}
		class="pointer-events-none absolute top-2 left-4 text-xs transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs {error
			? 'text-error-600 dark:text-error-500'
			: 'text-dark-300 dark:text-light-300'}"
	>
		{label}{#if required}<span class="text-error-600 dark:text-error-500">*</span>{/if}
	</label>
	{#if error}
		<p class="mt-1 text-xs text-error-600 dark:text-error-500">{error}</p>
	{/if}
</div>

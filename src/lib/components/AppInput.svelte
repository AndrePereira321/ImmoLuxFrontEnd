<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props {
		id?: string;
		type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
		label?: string;
		value?: string | number | undefined;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		step?: string | number;
		min?: string | number;
		max?: string | number;
	}

	let {
		id,
		type = 'text',
		label,
		value = $bindable(undefined),
		placeholder = ' ',
		required = false,
		disabled = false,
		error,
		autocomplete,
		step,
		min,
		max
	}: Props = $props();

	let isFocused = $state(false);
	let hasValue = $derived(value !== '' && value !== null && value !== undefined);
	let shouldFloat = $derived(isFocused || hasValue);

	const labelClasses = $derived(() => {
		const base = 'pointer-events-none absolute left-4 origin-left text-base transition-all duration-200';
		const position = shouldFloat ? 'top-2 translate-y-0 scale-75' : 'top-1/2 -translate-y-1/2';
		const color = error
			? 'text-error-600 dark:text-error-400'
			: shouldFloat
				? 'text-primary-600 dark:text-primary-400'
				: 'text-dark-500 dark:text-light-500';
		return `${base} ${position} ${color}`;
	});

	const handleFocus = () => {
		isFocused = true;
	};

	const handleBlur = () => {
		isFocused = false;
	};
</script>

<div class="relative">
	<input
		{id}
		{type}
		bind:value
		{placeholder}
		{required}
		{disabled}
		{autocomplete}
		{step}
		{min}
		{max}
		onfocus={handleFocus}
		onblur={handleBlur}
		class="peer block w-full appearance-none rounded-lg border-2 bg-white px-4 pt-6 pb-2.5 text-base text-dark-900 transition-all duration-200 placeholder:text-transparent focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-dark-700 dark:text-light-50"
		class:border-light-300={!error && !isFocused}
		class:dark:border-dark-600={!error && !isFocused}
		class:border-primary-500={!error && isFocused}
		class:dark:border-primary-400={!error && isFocused}
		class:border-error-600={error}
		class:dark:border-error-500={error}
		class:focus:border-error-600={error}
		class:dark:focus:border-error-500={error}
	/>

	{#if label}
		<label for={id} class={labelClasses()}>
			{label}
			{#if required}
				<span class="text-error-600 dark:text-error-400">*</span>
			{/if}
		</label>
	{/if}

	{#if error}
		<p class="mt-1 text-sm text-error-600 dark:text-error-400">
			{error}
		</p>
	{/if}
</div>

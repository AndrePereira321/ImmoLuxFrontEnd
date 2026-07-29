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

	/* Callers rarely pass an id, and a floating label pointed at nothing is not a
	   label. The generated id keeps every field's label clickable and announced. */
	const uid = $props.id();
	const fieldId = $derived(id ?? `field-${uid}`);

	let isFocused = $state(false);
	let hasValue = $derived(value !== '' && value !== null && value !== undefined);
	let shouldFloat = $derived(isFocused || hasValue);

	const labelClasses = $derived(() => {
		const base = 'pointer-events-none absolute left-4 origin-left text-sm transition-all duration-200';
		const position = shouldFloat ? 'top-2 translate-y-0 scale-[0.8]' : 'top-1/2 -translate-y-1/2';
		const color = error
			? 'text-error-600 dark:text-error-400'
			: shouldFloat
				? 'text-primary-700 dark:text-primary-300'
				: 'text-dark-400 dark:text-light-600';
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
		id={fieldId}
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
		class="peer block w-full appearance-none border bg-light-50 px-4 pt-6 pb-2.5 text-sm text-dark-900 transition-all duration-200 placeholder:text-transparent focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-dark-800 dark:text-light-50"
		class:border-light-800={!error && !isFocused}
		class:dark:border-dark-600={!error && !isFocused}
		class:border-primary-600={!error && isFocused}
		class:dark:border-primary-400={!error && isFocused}
		class:border-error-500={error}
		class:dark:border-error-500={error}
		class:focus:border-error-500={error}
		class:dark:focus:border-error-500={error}
	/>

	{#if label}
		<label for={fieldId} class={labelClasses()}>
			{label}
			{#if required}
				<span class="text-error-500">*</span>
			{/if}
		</label>
	{/if}

	{#if error}
		<p class="mt-1.5 text-xs text-error-600 dark:text-error-400">
			{error}
		</p>
	{/if}
</div>

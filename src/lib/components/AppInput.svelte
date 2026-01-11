<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props {
		id: string;
		type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
		label: string;
		value?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		autocomplete?: HTMLInputAttributes['autocomplete'];
	}

	let {
		id,
		type = 'text',
		label,
		value = $bindable(''),
		placeholder = ' ',
		required = false,
		disabled = false,
		error,
		autocomplete
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
				: 'text-dark-600 dark:text-light-400';
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
		onfocus={handleFocus}
		onblur={handleBlur}
		class="peer block w-full appearance-none rounded-lg border-2 border-light-600 bg-light-50 px-4 pt-7 pb-3 text-base text-dark-900 transition-all duration-200 placeholder:text-transparent focus:border-primary-600 focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-light-50 dark:focus:border-primary-500"
		class:border-error-600={error}
		class:dark:border-error-500={error}
		class:focus:border-error-600={error}
		class:dark:focus:border-error-500={error}
	/>

	<label for={id} class={labelClasses()}>
		{label}
		{#if required}
			<span class="text-error-600 dark:text-error-400">*</span>
		{/if}
	</label>

	{#if error}
		<p class="mt-2 text-sm text-error-600 dark:text-error-400">
			{error}
		</p>
	{/if}
</div>

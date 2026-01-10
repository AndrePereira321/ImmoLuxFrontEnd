<script lang="ts">
	interface Props {
		id: string;
		type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
		label: string;
		value?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		autocomplete?: string;
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

	<label
		for={id}
		class="pointer-events-none absolute top-1/2 left-4 origin-left -translate-y-1/2 text-base text-dark-600 transition-all duration-200 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:scale-75 peer-focus:text-primary-600 dark:text-light-400 dark:peer-focus:text-primary-400"
		class:top-2={shouldFloat}
		class:translate-y-0={shouldFloat}
		class:scale-75={shouldFloat}
		class:text-primary-600={shouldFloat && !error}
		class:dark:text-primary-400={shouldFloat && !error}
		class:text-error-600={error}
		class:dark:text-error-400={error}
	>
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

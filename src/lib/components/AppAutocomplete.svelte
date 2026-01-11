<script lang="ts">
	interface Option {
		value: string | number;
		label: string;
	}

	interface Props {
		id?: string;
		label?: string;
		value?: string | number | undefined;
		options?: Option[];
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
	}

	let {
		id,
		label,
		value = $bindable(undefined),
		options = [],
		placeholder = '',
		required = false,
		disabled = false,
		error
	}: Props = $props();

	let searchTerm = $state('');
	let isOpen = $state(false);
	let isFocused = $state(false);
	let inputElement = $state<HTMLInputElement>();
	let dropdownElement = $state<HTMLDivElement>();
	let dropdownPosition = $state({ top: 0, left: 0, width: 0 });

	// Find selected option label
	const selectedLabel = $derived(options.find((opt) => opt.value === value)?.label || '');

	// Filter options based on search term
	const filteredOptions = $derived(
		options.filter((opt) => opt.label && opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
	);

	// Update search term when value changes externally
	$effect(() => {
		if (!isOpen && value !== undefined) {
			searchTerm = selectedLabel;
		}
	});

	let hasValue = $derived(value !== '' && value !== null && value !== undefined);
	let shouldFloat = $derived(isFocused || hasValue);

	const labelClasses = $derived(() => {
		const base = 'pointer-events-none absolute left-4 origin-left text-base transition-all duration-200 z-10';
		const position = shouldFloat ? 'top-2 translate-y-0 scale-75' : 'top-1/2 -translate-y-1/2';
		const color = error
			? 'text-error-600 dark:text-error-400'
			: shouldFloat
				? 'text-primary-600 dark:text-primary-400'
				: 'text-dark-500 dark:text-light-500';
		return `${base} ${position} ${color}`;
	});

	const updateDropdownPosition = () => {
		if (inputElement) {
			const rect = inputElement.getBoundingClientRect();
			dropdownPosition = {
				top: rect.bottom + 4,
				left: rect.left,
				width: rect.width
			};
		}
	};

	const handleFocus = () => {
		isFocused = true;
		isOpen = true;
		searchTerm = '';
		updateDropdownPosition();
		window.addEventListener('scroll', updateDropdownPosition, true);
		window.addEventListener('resize', updateDropdownPosition);
	};

	const handleBlur = (event: FocusEvent) => {
		// Check if the new focused element is within the dropdown
		const relatedTarget = event.relatedTarget as HTMLElement;
		if (dropdownElement && dropdownElement.contains(relatedTarget)) {
			return;
		}

		setTimeout(() => {
			isFocused = false;
			isOpen = false;
			searchTerm = selectedLabel;
			window.removeEventListener('scroll', updateDropdownPosition, true);
			window.removeEventListener('resize', updateDropdownPosition);
		}, 200);
	};

	const selectOption = (option: Option) => {
		value = option.value;
		searchTerm = option.label;
		isOpen = false;
		isFocused = false;
		window.removeEventListener('scroll', updateDropdownPosition, true);
		window.removeEventListener('resize', updateDropdownPosition);
		inputElement?.blur();
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			isFocused = false;
			isOpen = false;
			searchTerm = selectedLabel;
			window.removeEventListener('scroll', updateDropdownPosition, true);
			window.removeEventListener('resize', updateDropdownPosition);
			inputElement?.blur();
		}
	};
</script>

<div class="relative">
	<div class="relative">
		<input
			bind:this={inputElement}
			{id}
			type="text"
			bind:value={searchTerm}
			{placeholder}
			{required}
			{disabled}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeyDown}
			autocomplete="off"
			class="peer block w-full appearance-none rounded-lg border-2 bg-white px-4 pt-6 pr-10 pb-2.5 text-base text-dark-900 transition-all duration-200 placeholder:text-transparent focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-dark-700 dark:text-light-50"
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

		<!-- Dropdown arrow -->
		<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
			<svg
				class="h-5 w-5 text-dark-400 transition-transform dark:text-light-400"
				class:rotate-180={isOpen}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</div>

	<!-- Dropdown menu (portal to body to avoid overflow issues) -->
	{#if isOpen && filteredOptions.length > 0}
		<div
			bind:this={dropdownElement}
			class="fixed z-[9999] max-h-60 overflow-auto rounded-lg border border-light-300 bg-white shadow-2xl dark:border-dark-600 dark:bg-dark-700"
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px; width: {dropdownPosition.width}px;"
		>
			{#each filteredOptions as option, index (`${option.value}-${index}`)}
				<button
					type="button"
					onclick={() => selectOption(option)}
					class="block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary-50 dark:text-light-100 dark:hover:bg-primary-900/20"
					class:bg-primary-100={value === option.value}
					class:dark:bg-primary-900={value === option.value}
					class:text-primary-700={value === option.value}
					class:dark:text-primary-300={value === option.value}
					class:font-medium={value === option.value}
				>
					{option.label}
				</button>
			{/each}
		</div>
	{/if}

	{#if error}
		<p class="mt-1 text-sm text-error-600 dark:text-error-400">
			{error}
		</p>
	{/if}
</div>

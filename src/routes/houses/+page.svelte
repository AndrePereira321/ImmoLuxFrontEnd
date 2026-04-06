<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { apiClient } from '$lib/api/api-client';
	import type { LocationsResponse, PropertyDTO } from '$lib/types/property';
	import AppPropertyGrid from '$lib/components/AppPropertyGrid.svelte';
	import { _ } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEuroSign, faFilter, faHome, faMapMarkerAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import homeImage from '$lib/assets/images/home_image.jpeg';

	type OrderBy = 'price_asc' | 'price_desc' | 'created_asc' | 'created_desc' | 'popularity' | 'location' | 'status';

	interface PropertyListResponse {
		properties: PropertyDTO[];
		total: number;
	}

	interface PropertyImageMap {
		[propertyId: number]: number[];
	}

	let { data } = $props();

	const { properties: _initProperties, total: _initTotal, propertyImageMap: _initMap } = untrack(() => data);

	let properties = $state<PropertyDTO[]>(_initProperties);
	let total = $state<number>(_initTotal);
	let loading = $state(false);
	let showFilters = $state(false);

	let districts = $state<string[]>([]);
	let municipalities = $state<string[]>([]);
	let parishes = $state<string[]>([]);
	let loadingLocations = $state(false);

	let filters = $state({
		district: '',
		municipality: '',
		parish: '',
		propertyType: '',
		status: '',
		minPrice: null as number | null,
		maxPrice: null as number | null,
		orderBy: 'created_desc' as OrderBy,
		limit: 12,
		offset: 0
	});

	let propertyImageMap = $state<PropertyImageMap>(_initMap);

	onMount(() => {
		loadLocations();
	});

	const activeFiltersCount = $derived(
		[
			filters.district,
			filters.municipality,
			filters.parish,
			filters.propertyType,
			filters.status,
			filters.minPrice,
			filters.maxPrice
		].filter((f) => f !== '' && f !== null).length
	);

	const loadLocations = async () => {
		if (districts.length > 0) return;
		loadingLocations = true;
		try {
			const response = await apiClient.get<LocationsResponse>('/locations');
			if (response.data.success) {
				districts = response.data.data.districts;
				municipalities = response.data.data.municipalities;
				parishes = response.data.data.parishes;
			}
		} catch (error) {
			console.error('Failed to load locations:', error);
		} finally {
			loadingLocations = false;
		}
	};

	const loadPropertyImages = async (propertyId: number) => {
		try {
			const response = await apiClient.get<{ images: { id: number; displayOrder: number }[] }>(
				`/properties/${propertyId}/images`
			);
			if (response.data.success && response.data.data) {
				const images = response.data.data.images;
				if (Array.isArray(images)) {
					propertyImageMap[propertyId] = images
						.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
						.map((img) => img.id!);
				} else {
					propertyImageMap[propertyId] = [];
				}
			} else {
				propertyImageMap[propertyId] = [];
			}
		} catch (error) {
			console.error(`Failed to load images for property ${propertyId}:`, error);
			propertyImageMap[propertyId] = [];
		}
	};

	const loadProperties = async () => {
		loading = true;
		try {
			const params = new SvelteURLSearchParams();
			if (filters.district) params.append('district', filters.district);
			if (filters.municipality) params.append('municipality', filters.municipality);
			if (filters.parish) params.append('parish', filters.parish);
			if (filters.propertyType) params.append('propertyType', filters.propertyType);
			if (filters.status) params.append('status', filters.status);
			if (filters.minPrice !== null) params.append('minPrice', filters.minPrice.toString());
			if (filters.maxPrice !== null) params.append('maxPrice', filters.maxPrice.toString());
			if (filters.orderBy) params.append('orderBy', filters.orderBy);
			params.append('limit', filters.limit.toString());
			params.append('offset', filters.offset.toString());

			const response = await apiClient.get<PropertyListResponse>(`/properties?${params.toString()}`);
			if (response.data.success) {
				properties = response.data.data.properties;
				total = response.data.data.total;
				propertyImageMap = {};
				await Promise.all(properties.map((property) => property.id && loadPropertyImages(property.id)));
			}
		} catch (error) {
			console.error('Failed to load properties:', error);
		} finally {
			loading = false;
		}
	};

	const handleFilterChange = () => {
		filters.offset = 0;
		loadProperties();
	};

	const clearFilters = () => {
		filters.district = '';
		filters.municipality = '';
		filters.parish = '';
		filters.propertyType = '';
		filters.status = '';
		filters.minPrice = null;
		filters.maxPrice = null;
		filters.offset = 0;
		loadProperties();
	};

	const toggleFilters = () => {
		showFilters = !showFilters;
		if (showFilters) loadLocations();
	};

	const propertyTypes = $derived([
		{ value: '', label: $_('houses.allTypes') },
		{ value: 'house', label: $_('properties.types.house') },
		{ value: 'apartment', label: $_('properties.types.apartment') },
		{ value: 'villa', label: $_('properties.types.villa') },
		{ value: 'townhouse', label: $_('properties.types.townhouse') },
		{ value: 'land', label: $_('properties.types.land') },
		{ value: 'commercial', label: $_('properties.types.commercial') }
	]);

	const statusOptions = $derived([
		{
			value: '',
			label: $_('houses.allStatuses'),
			dot: 'bg-dark-400 dark:bg-light-600',
			active: 'bg-dark-900 text-white dark:bg-light-50 dark:text-dark-900',
			hover: 'hover:bg-light-200 dark:hover:bg-dark-700'
		},
		{
			value: 'available',
			label: $_('properties.statuses.available'),
			dot: 'bg-success-500',
			active: 'bg-success-600 text-white ring-2 ring-success-200 dark:ring-success-800',
			hover: 'hover:bg-success-50 hover:text-success-700 dark:hover:bg-success-950/40 dark:hover:text-success-300'
		},
		{
			value: 'pending',
			label: $_('properties.statuses.pending'),
			dot: 'bg-warning-400',
			active: 'bg-warning-500 text-white ring-2 ring-warning-200 dark:ring-warning-800',
			hover: 'hover:bg-warning-50 hover:text-warning-700 dark:hover:bg-warning-950/40 dark:hover:text-warning-300'
		},
		{
			value: 'sold',
			label: $_('properties.statuses.sold'),
			dot: 'bg-error-500',
			active: 'bg-error-600 text-white ring-2 ring-error-200 dark:ring-error-800',
			hover: 'hover:bg-error-50 hover:text-error-700 dark:hover:bg-error-950/40 dark:hover:text-error-300'
		},
		{
			value: 'rented',
			label: $_('properties.statuses.rented'),
			dot: 'bg-info-500',
			active: 'bg-info-600 text-white ring-2 ring-info-200 dark:ring-info-800',
			hover: 'hover:bg-info-50 hover:text-info-700 dark:hover:bg-info-950/40 dark:hover:text-info-300'
		}
	]);
</script>

<svelte:head>
	<title>{$_('houses.meta.title')} - ImmoLux</title>
	<meta name="description" content={$_('houses.meta.description')} />
	<meta property="og:title" content="{$_('houses.meta.title')} - ImmoLux" />
	<meta property="og:description" content={$_('houses.meta.description')} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://immolux.pt/houses" />
	<meta property="og:image" content="https://immolux.pt{homeImage}" />
	<meta property="og:image:alt" content={$_('houses.hero.title')} />
	<meta name="twitter:title" content="{$_('houses.meta.title')} - ImmoLux" />
	<meta name="twitter:description" content={$_('houses.meta.description')} />
	<meta name="twitter:image" content="https://immolux.pt{homeImage}" />
	<link rel="canonical" href="https://immolux.pt/houses" />
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			"@id": "https://immolux.pt/houses#collection",
			"name": "Properties in Portugal",
			"url": "https://immolux.pt/houses",
			"description": "Browse houses, apartments and land for sale in Portugal",
			"publisher": { "@id": "https://immolux.pt/#organization" }
		}
	</script>
</svelte:head>

<div class="min-h-screen bg-light-50 dark:bg-dark-900">
	<!-- ─── Hero Strip ─────────────────────────────────────────────── -->
	<section class="relative overflow-hidden" style="height: 260px">
		<!-- Background photo -->
		<div class="absolute inset-0 bg-cover bg-center" style="background-image: url({homeImage})"></div>
		<!-- Gradient overlay: dark left, lighter right -->
		<div
			class="absolute inset-0"
			style="background: linear-gradient(120deg, rgba(10,20,45,0.92) 0%, rgba(10,20,45,0.72) 55%, rgba(10,20,45,0.45) 100%)"
		></div>
		<!-- Diagonal clip at bottom (matches page bg) -->
		<div
			class="absolute right-0 bottom-0 left-0 h-14 bg-light-50 dark:bg-dark-900"
			style="clip-path: polygon(0 100%, 100% 30%, 100% 100%)"
		></div>

		<div class="relative flex h-full items-center">
			<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
				<p
					class="mb-3 text-[0.688rem] font-semibold tracking-[0.22em] text-secondary-300 uppercase"
					style="animation: fadeInUp 0.5s ease-out; font-family: 'Plus Jakarta Sans', sans-serif"
				>
					Portugal · Imobiliário de Luxo
				</p>
				<h1
					class="mb-4 text-4xl font-normal tracking-tight text-white drop-shadow-sm sm:text-5xl"
					style="animation: fadeInUp 0.5s ease-out 0.1s both"
				>
					{$_('houses.hero.title')}
				</h1>
				<div
					class="flex items-center gap-4"
					style="animation: fadeInUp 0.5s ease-out 0.2s both; font-family: 'Plus Jakarta Sans', sans-serif"
				>
					<p class="text-sm text-white/65">{$_('houses.hero.subtitle')}</p>
					{#if !loading && total > 0}
						<div class="h-px w-8 flex-shrink-0 bg-secondary-400/50"></div>
						<p class="text-sm font-semibold text-secondary-200">
							{total}
							{total === 1 ? $_('houses.property') : $_('houses.properties')}
						</p>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- ─── Sticky Availability & Sort Bar ────────────────────────── -->
	<div
		class="sticky top-16 z-40 border-b border-light-200/80 bg-white/92 backdrop-blur-md dark:border-dark-700/70 dark:bg-dark-900/92"
	>
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div
				class="flex items-center gap-3 overflow-x-auto py-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				<!-- Availability status chips -->
				<div class="flex flex-shrink-0 items-center gap-1.5">
					{#each statusOptions as opt (opt.value)}
						<button
							type="button"
							onclick={() => {
								filters.status = opt.value;
								handleFilterChange();
							}}
							class="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 {filters.status ===
							opt.value
								? opt.active
								: `bg-light-100 text-dark-600 dark:bg-dark-800 dark:text-light-400 ${opt.hover}`}"
						>
							<span
								class="h-1.5 w-1.5 flex-shrink-0 rounded-full {filters.status === opt.value ? 'bg-white/80' : opt.dot}"
							></span>
							{opt.label}
						</button>
					{/each}
				</div>

				<!-- Divider -->
				<div class="mx-1 h-5 w-px flex-shrink-0 bg-light-300 dark:bg-dark-600"></div>

				<!-- Sort -->
				<select
					bind:value={filters.orderBy}
					onchange={handleFilterChange}
					class="flex-shrink-0 rounded-lg border border-light-200 bg-transparent py-1.5 pr-7 pl-3 text-xs font-medium text-dark-600 focus:border-primary-400 focus:outline-none dark:border-dark-700 dark:text-light-400"
					style="font-family: 'Plus Jakarta Sans', sans-serif"
				>
					<option value="created_desc">{$_('houses.sort.newest')}</option>
					<option value="popularity">{$_('houses.sort.popular')}</option>
					<option value="status">{$_('houses.sort.status')}</option>
					<option value="price_asc">{$_('houses.sort.priceLowHigh')}</option>
					<option value="price_desc">{$_('houses.sort.priceHighLow')}</option>
					<option value="location">{$_('houses.sort.location')}</option>
					<option value="created_asc">{$_('houses.sort.oldest')}</option>
				</select>

				<!-- Results count (right-aligned) -->
				<div
					class="ml-auto flex-shrink-0 text-xs text-dark-400 dark:text-light-600"
					style="font-family: 'Plus Jakarta Sans', sans-serif"
				>
					{#if loading}
						<span class="animate-pulse">{$_('houses.loading')}</span>
					{:else}
						{total} {total === 1 ? $_('houses.property') : $_('houses.properties')}
					{/if}
				</div>

				<!-- Clear filters -->
				{#if activeFiltersCount > 0}
					<button
						type="button"
						onclick={clearFilters}
						class="flex flex-shrink-0 items-center gap-1 text-xs font-medium text-error-600 transition-colors hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
					>
						<FontAwesomeIcon icon={faTimes} class="text-[0.55rem]" />
						{$_('houses.clearFilters')}
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- ─── Main Content ───────────────────────────────────────────── -->
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
		<!-- Mobile filter toggle -->
		<div class="mb-5 lg:hidden">
			<button
				type="button"
				onclick={toggleFilters}
				class="inline-flex items-center gap-2 rounded-xl border border-light-300 bg-white px-4 py-2.5 text-sm font-semibold text-dark-700 shadow-sm transition-all hover:border-primary-300 hover:text-primary-700 dark:border-dark-600 dark:bg-dark-800 dark:text-light-200 dark:hover:border-primary-600 dark:hover:text-primary-300"
			>
				<FontAwesomeIcon icon={faFilter} class="text-xs text-primary-500" />
				{$_('houses.filters')}
				{#if activeFiltersCount > 0}
					<span
						class="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[0.6rem] font-bold text-white"
					>
						{activeFiltersCount}
					</span>
				{/if}
			</button>
		</div>

		<!-- Two-column: Sidebar + Grid -->
		<div class="lg:grid lg:grid-cols-[248px_1fr] lg:gap-10 xl:gap-12">
			<!-- ─── Filter Sidebar ───────────────────────────────── -->
			<aside class="{showFilters ? 'block' : 'hidden'} mb-8 lg:mb-0 lg:block">
				<div class="sticky top-32 space-y-4">
					<!-- Sidebar header (desktop) -->
					<div class="hidden items-center justify-between lg:flex">
						<h2
							class="text-xs font-semibold tracking-wider text-dark-500 uppercase dark:text-light-600"
							style="font-family: 'Plus Jakarta Sans', sans-serif"
						>
							{$_('houses.filters')}
						</h2>
						{#if activeFiltersCount > 0}
							<button
								type="button"
								onclick={clearFilters}
								class="text-[0.688rem] font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
							>
								{$_('houses.clearFilters')}
							</button>
						{/if}
					</div>

					<!-- Location -->
					<div
						class="overflow-hidden rounded-2xl border border-light-200/80 bg-white dark:border-dark-700/60 dark:bg-dark-800"
					>
						<div class="border-b border-light-100 px-5 py-3.5 dark:border-dark-700/60">
							<h3
								class="flex items-center gap-2 text-[0.688rem] font-semibold tracking-wider text-dark-400 uppercase dark:text-light-700"
								style="font-family: 'Plus Jakarta Sans', sans-serif"
							>
								<FontAwesomeIcon icon={faMapMarkerAlt} class="text-primary-400" />
								{$_('properties.district')}
							</h3>
						</div>
						<div class="space-y-3 p-5">
							<div>
								<label
									for="district"
									class="mb-1.5 block text-[0.688rem] font-medium text-dark-500 dark:text-light-600"
								>
									{$_('properties.district')}
								</label>
								<select
									id="district"
									bind:value={filters.district}
									onchange={handleFilterChange}
									disabled={loadingLocations}
									class="w-full rounded-lg border border-light-300 bg-light-50 px-3 py-2 text-xs text-dark-800 transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/15 focus:outline-none disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700/60 dark:text-light-100"
								>
									<option value="">{$_('properties.selectDistrict')}</option>
									{#each districts as district (district)}
										<option value={district}>{district}</option>
									{/each}
								</select>
							</div>
							<div>
								<label
									for="municipality"
									class="mb-1.5 block text-[0.688rem] font-medium text-dark-500 dark:text-light-600"
								>
									{$_('properties.municipality')}
								</label>
								<select
									id="municipality"
									bind:value={filters.municipality}
									onchange={handleFilterChange}
									disabled={loadingLocations}
									class="w-full rounded-lg border border-light-300 bg-light-50 px-3 py-2 text-xs text-dark-800 transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/15 focus:outline-none disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700/60 dark:text-light-100"
								>
									<option value="">{$_('properties.selectMunicipality')}</option>
									{#each municipalities as municipality (municipality)}
										<option value={municipality}>{municipality}</option>
									{/each}
								</select>
							</div>
							<div>
								<label for="parish" class="mb-1.5 block text-[0.688rem] font-medium text-dark-500 dark:text-light-600">
									{$_('properties.parish')}
								</label>
								<select
									id="parish"
									bind:value={filters.parish}
									onchange={handleFilterChange}
									disabled={loadingLocations}
									class="w-full rounded-lg border border-light-300 bg-light-50 px-3 py-2 text-xs text-dark-800 transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/15 focus:outline-none disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700/60 dark:text-light-100"
								>
									<option value="">{$_('properties.selectParish')}</option>
									{#each parishes as parish (parish)}
										<option value={parish}>{parish}</option>
									{/each}
								</select>
							</div>
						</div>
					</div>

					<!-- Property Type -->
					<div
						class="overflow-hidden rounded-2xl border border-light-200/80 bg-white dark:border-dark-700/60 dark:bg-dark-800"
					>
						<div class="border-b border-light-100 px-5 py-3.5 dark:border-dark-700/60">
							<h3
								class="flex items-center gap-2 text-[0.688rem] font-semibold tracking-wider text-dark-400 uppercase dark:text-light-700"
								style="font-family: 'Plus Jakarta Sans', sans-serif"
							>
								<FontAwesomeIcon icon={faHome} class="text-primary-400" />
								{$_('properties.propertyType')}
							</h3>
						</div>
						<div class="flex flex-wrap gap-1.5 p-5">
							{#each propertyTypes as type (type.value)}
								<button
									type="button"
									onclick={() => {
										filters.propertyType = type.value;
										handleFilterChange();
									}}
									class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-all {filters.propertyType ===
									type.value
										? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-600/80 dark:bg-primary-950/60 dark:text-primary-300'
										: 'border-light-300 bg-light-50 text-dark-500 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600 dark:border-dark-600 dark:bg-dark-700/50 dark:text-light-500 dark:hover:border-primary-700 dark:hover:text-primary-400'}"
								>
									{type.label}
								</button>
							{/each}
						</div>
					</div>

					<!-- Price Range -->
					<div
						class="overflow-hidden rounded-2xl border border-light-200/80 bg-white dark:border-dark-700/60 dark:bg-dark-800"
					>
						<div class="border-b border-light-100 px-5 py-3.5 dark:border-dark-700/60">
							<h3
								class="flex items-center gap-2 text-[0.688rem] font-semibold tracking-wider text-dark-400 uppercase dark:text-light-700"
								style="font-family: 'Plus Jakarta Sans', sans-serif"
							>
								<FontAwesomeIcon icon={faEuroSign} class="text-primary-400" />
								{$_('houses.minPrice')} – {$_('houses.maxPrice')}
							</h3>
						</div>
						<div class="p-5">
							<div class="mb-3 grid grid-cols-2 gap-2">
								<div class="relative">
									<span
										class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[0.688rem] text-dark-400 dark:text-light-700"
										>€</span
									>
									<input
										type="number"
										bind:value={filters.minPrice}
										onchange={handleFilterChange}
										placeholder="Min"
										min="0"
										step="1000"
										class="w-full rounded-lg border border-light-300 bg-light-50 py-2 pr-2 pl-6 text-xs text-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/15 focus:outline-none dark:border-dark-600 dark:bg-dark-700/60 dark:text-light-100"
									/>
								</div>
								<div class="relative">
									<span
										class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[0.688rem] text-dark-400 dark:text-light-700"
										>€</span
									>
									<input
										type="number"
										bind:value={filters.maxPrice}
										onchange={handleFilterChange}
										placeholder="Max"
										min="0"
										step="1000"
										class="w-full rounded-lg border border-light-300 bg-light-50 py-2 pr-2 pl-6 text-xs text-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/15 focus:outline-none dark:border-dark-600 dark:bg-dark-700/60 dark:text-light-100"
									/>
								</div>
							</div>
							<!-- Price presets -->
							<div class="space-y-0.5 border-t border-light-100 pt-3 dark:border-dark-700/60">
								<button
									type="button"
									onclick={() => {
										filters.minPrice = null;
										filters.maxPrice = 200000;
										handleFilterChange();
									}}
									class="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-[0.688rem] text-dark-500 transition-colors hover:bg-light-100 hover:text-dark-800 dark:text-light-600 dark:hover:bg-dark-700/60 dark:hover:text-light-300"
								>
									{$_('houses.quickFilters.under200k')}
								</button>
								<button
									type="button"
									onclick={() => {
										filters.minPrice = 200000;
										filters.maxPrice = 500000;
										handleFilterChange();
									}}
									class="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-[0.688rem] text-dark-500 transition-colors hover:bg-light-100 hover:text-dark-800 dark:text-light-600 dark:hover:bg-dark-700/60 dark:hover:text-light-300"
								>
									{$_('houses.quickFilters.between200k500k')}
								</button>
								<button
									type="button"
									onclick={() => {
										filters.minPrice = 500000;
										filters.maxPrice = null;
										handleFilterChange();
									}}
									class="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-[0.688rem] text-dark-500 transition-colors hover:bg-light-100 hover:text-dark-800 dark:text-light-600 dark:hover:bg-dark-700/60 dark:hover:text-light-300"
								>
									{$_('houses.quickFilters.luxury500k')}
								</button>
							</div>
						</div>
					</div>
				</div>
			</aside>

			<!-- ─── Property Grid ────────────────────────────────── -->
			<AppPropertyGrid
				{properties}
				{propertyImageMap}
				{total}
				limit={filters.limit}
				offset={filters.offset}
				{loading}
				onPageChange={(newOffset) => {
					filters.offset = newOffset;
					loadProperties();
				}}
			/>
		</div>
	</div>
</div>

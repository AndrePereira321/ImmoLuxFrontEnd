<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api/api-client';
	import type { LocationsResponse, PropertyDTO } from '$lib/types/property';
	import AppPublicPropertyCard from '$lib/components/AppPublicPropertyCard.svelte';
	import AppLoadingSpinner from '$lib/components/AppLoadingSpinner.svelte';
	import { _ } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faChevronLeft,
		faChevronRight,
		faEuroSign,
		faFilter,
		faHome,
		faMapMarkerAlt,
		faTimes
	} from '@fortawesome/free-solid-svg-icons';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	type OrderBy = 'price_asc' | 'price_desc' | 'created_asc' | 'created_desc' | 'popularity' | 'location' | 'status';

	interface PropertyListResponse {
		properties: PropertyDTO[];
		total: number;
	}

	interface PropertyImageMap {
		[propertyId: number]: number[];
	}

	// Mutable state for client-side updates
	let properties = $state<PropertyDTO[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let showFilters = $state(false);

	// Locations data
	let districts = $state<string[]>([]);
	let municipalities = $state<string[]>([]);
	let parishes = $state<string[]>([]);
	let loadingLocations = $state(false);

	// Filters
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

	// Image IDs map
	let propertyImageMap = $state<PropertyImageMap>({});

	// Initialize on mount
	onMount(() => {
		loadLocations();
		loadProperties();
	});

	// Pagination
	const currentPage = $derived(Math.floor(filters.offset / filters.limit) + 1);
	const totalPages = $derived(Math.ceil(total / filters.limit));
	const hasNextPage = $derived(currentPage < totalPages);
	const hasPrevPage = $derived(currentPage > 1);

	// Active filters count
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
		// Already loaded from server
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
				// Ensure images is an array
				if (Array.isArray(images)) {
					const sortedImageIds = images
						.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
						.map((img) => img.id!);

					propertyImageMap[propertyId] = sortedImageIds;
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

				// Load images for all properties
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

	const goToPage = (page: number) => {
		filters.offset = (page - 1) * filters.limit;
		loadProperties();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const nextPage = () => {
		if (hasNextPage) {
			goToPage(currentPage + 1);
		}
	};

	const prevPage = () => {
		if (hasPrevPage) {
			goToPage(currentPage - 1);
		}
	};

	const toggleFilters = () => {
		showFilters = !showFilters;
		if (showFilters) {
			loadLocations();
		}
	};
</script>

<svelte:head>
	<title>{$_('houses.title')} - ImmoLux</title>
	<meta name="description" content={$_('houses.meta.description')} />
	<meta property="og:title" content="{$_('houses.title')} - ImmoLux" />
	<meta property="og:description" content={$_('houses.meta.description')} />
	<meta property="og:type" content="website" />
	<link rel="canonical" href="https://immolux.pt/houses" />
</svelte:head>

<div class="min-h-screen bg-light-50 dark:bg-dark-900">
	<!-- Hero Section -->
	<div class="relative overflow-hidden">
		<!-- Background Image -->
		<div
			class="absolute inset-0 bg-cover bg-center bg-no-repeat"
			style="background-image: url('/src/lib/assets/images/home_image.jpeg')"
		></div>

		<!-- Transparent Overlay -->
		<div class="absolute inset-0 bg-primary-900/70 dark:bg-dark-950/80"></div>

		<div class="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
			<div class="text-center">
				<div class="mb-4 flex justify-center">
					<div class="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
						<FontAwesomeIcon icon={faHome} class="text-4xl text-white" />
					</div>
				</div>
				<h1 class="mb-4 text-5xl font-bold tracking-tight text-white drop-shadow-lg sm:text-6xl">
					{$_('homepage.availableHouses.title')}
				</h1>
				<p class="mx-auto max-w-2xl text-xl text-white drop-shadow-md">
					{$_('homepage.availableHouses.subtitle')}
				</p>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Filters & Sort Bar -->
		<div class="mb-8">
			<div class="rounded-xl border border-light-300 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800">
				<!-- Top Row: Filter Toggle, Sort, Results Count -->
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex flex-wrap items-center gap-2">
						<!-- Filter Toggle Button -->
						<button
							type="button"
							onclick={toggleFilters}
							class="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
						>
							<FontAwesomeIcon icon={faFilter} />
							<span>{$_('houses.filters')}</span>
							{#if activeFiltersCount > 0}
								<span
									class="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-primary-600"
								>
									{activeFiltersCount}
								</span>
							{/if}
						</button>

						<!-- Quick Filter Buttons -->
						<button
							type="button"
							onclick={() => {
								filters.minPrice = null;
								filters.maxPrice = 200000;
								filters.status = 'available';
								handleFilterChange();
							}}
							class="hidden rounded-lg border border-light-300 bg-white px-3 py-2 text-sm font-medium text-dark-700 transition-colors hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 md:inline-flex dark:border-dark-600 dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-500 dark:hover:bg-primary-900/30 dark:hover:text-primary-300"
						>
							💰 {$_('houses.quickFilters.under200k')}
						</button>
						<button
							type="button"
							onclick={() => {
								filters.minPrice = 200000;
								filters.maxPrice = 500000;
								filters.status = 'available';
								handleFilterChange();
							}}
							class="hidden rounded-lg border border-light-300 bg-white px-3 py-2 text-sm font-medium text-dark-700 transition-colors hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 md:inline-flex dark:border-dark-600 dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-500 dark:hover:bg-primary-900/30 dark:hover:text-primary-300"
						>
							💎 {$_('houses.quickFilters.between200k500k')}
						</button>
						<button
							type="button"
							onclick={() => {
								filters.minPrice = 500000;
								filters.maxPrice = null;
								filters.status = 'available';
								handleFilterChange();
							}}
							class="hidden rounded-lg border border-light-300 bg-white px-3 py-2 text-sm font-medium text-dark-700 transition-colors hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 md:inline-flex dark:border-dark-600 dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-500 dark:hover:bg-primary-900/30 dark:hover:text-primary-300"
						>
							👑 {$_('houses.quickFilters.luxury500k')}
						</button>
					</div>

					<div class="flex flex-wrap items-center gap-4">
						<!-- Sort Dropdown -->
						<div class="flex items-center gap-2">
							<select
								bind:value={filters.orderBy}
								onchange={handleFilterChange}
								class="rounded-lg border border-light-400 bg-light-50 px-4 py-2.5 font-medium text-dark-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-light-50"
							>
								<option value="created_desc">{$_('houses.sort.newest')}</option>
								<option value="popularity">{$_('houses.sort.popular')}</option>
								<option value="status">{$_('houses.sort.status')}</option>
								<option value="price_asc">{$_('houses.sort.priceLowHigh')}</option>
								<option value="price_desc">{$_('houses.sort.priceHighLow')}</option>
								<option value="location">{$_('houses.sort.location')}</option>
								<option value="created_asc">{$_('houses.sort.oldest')}</option>
							</select>
						</div>

						<!-- Clear Filters Button -->
						{#if activeFiltersCount > 0}
							<button
								type="button"
								onclick={clearFilters}
								class="flex items-center gap-2 rounded-lg border border-error-500 px-3 py-2 text-sm font-medium text-error-600 transition-colors hover:bg-error-50 dark:border-error-400 dark:text-error-400 dark:hover:bg-error-900/20"
							>
								<FontAwesomeIcon icon={faTimes} />
								<span>{$_('houses.clearFilters')}</span>
							</button>
						{/if}

						<!-- Results Count -->
						<div class="text-sm font-semibold text-dark-600 dark:text-light-400">
							{#if loading}
								<span>{$_('houses.loading')}</span>
							{:else}
								<span>
									{total}
									{total === 1 ? $_('houses.property') : $_('houses.properties')}
								</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Filters Panel (Collapsible) -->
				{#if showFilters}
					<div class="mt-6 border-t border-light-200 pt-6 dark:border-dark-700">
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							<!-- District -->
							<div>
								<label for="district" class="mb-2 block text-sm font-semibold text-dark-700 dark:text-light-300">
									<FontAwesomeIcon icon={faMapMarkerAlt} class="mr-1.5 text-primary-600" />
									{$_('properties.district')}
								</label>
								<select
									id="district"
									bind:value={filters.district}
									onchange={handleFilterChange}
									disabled={loadingLocations}
									class="w-full rounded-lg border border-light-400 bg-light-50 px-4 py-2.5 text-dark-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-light-50"
								>
									<option value="">{$_('properties.selectDistrict')}</option>
									{#each districts as district (district)}
										<option value={district}>{district}</option>
									{/each}
								</select>
							</div>

							<!-- Municipality -->
							<div>
								<label for="municipality" class="mb-2 block text-sm font-semibold text-dark-700 dark:text-light-300">
									{$_('properties.municipality')}
								</label>
								<select
									id="municipality"
									bind:value={filters.municipality}
									onchange={handleFilterChange}
									disabled={loadingLocations}
									class="w-full rounded-lg border border-light-400 bg-light-50 px-4 py-2.5 text-dark-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-light-50"
								>
									<option value="">{$_('properties.selectMunicipality')}</option>
									{#each municipalities as municipality (municipality)}
										<option value={municipality}>{municipality}</option>
									{/each}
								</select>
							</div>

							<!-- Parish -->
							<div>
								<label for="parish" class="mb-2 block text-sm font-semibold text-dark-700 dark:text-light-300">
									{$_('properties.parish')}
								</label>
								<select
									id="parish"
									bind:value={filters.parish}
									onchange={handleFilterChange}
									disabled={loadingLocations}
									class="w-full rounded-lg border border-light-400 bg-light-50 px-4 py-2.5 text-dark-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-light-50"
								>
									<option value="">{$_('properties.selectParish')}</option>
									{#each parishes as parish (parish)}
										<option value={parish}>{parish}</option>
									{/each}
								</select>
							</div>

							<!-- Property Type -->
							<div>
								<label for="propertyType" class="mb-2 block text-sm font-semibold text-dark-700 dark:text-light-300">
									<FontAwesomeIcon icon={faHome} class="mr-1.5 text-primary-600" />
									{$_('properties.propertyType')}
								</label>
								<select
									id="propertyType"
									bind:value={filters.propertyType}
									onchange={handleFilterChange}
									class="w-full rounded-lg border border-light-400 bg-light-50 px-4 py-2.5 text-dark-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-light-50"
								>
									<option value="">{$_('houses.allTypes')}</option>
									<option value="house">{$_('properties.types.house')}</option>
									<option value="apartment">{$_('properties.types.apartment')}</option>
									<option value="villa">{$_('properties.types.villa')}</option>
									<option value="townhouse">{$_('properties.types.townhouse')}</option>
									<option value="land">{$_('properties.types.land')}</option>
									<option value="commercial">{$_('properties.types.commercial')}</option>
								</select>
							</div>

							<!-- Status -->
							<div>
								<label for="status" class="mb-2 block text-sm font-semibold text-dark-700 dark:text-light-300">
									{$_('properties.status')}
								</label>
								<select
									id="status"
									bind:value={filters.status}
									onchange={handleFilterChange}
									class="w-full rounded-lg border border-light-400 bg-light-50 px-4 py-2.5 text-dark-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-light-50"
								>
									<option value="">{$_('houses.allStatuses')}</option>
									<option value="available">{$_('properties.statuses.available')}</option>
									<option value="pending">{$_('properties.statuses.pending')}</option>
									<option value="sold">{$_('properties.statuses.sold')}</option>
									<option value="rented">{$_('properties.statuses.rented')}</option>
								</select>
							</div>

							<!-- Min Price -->
							<div>
								<label for="minPrice" class="mb-2 block text-sm font-semibold text-dark-700 dark:text-light-300">
									<FontAwesomeIcon icon={faEuroSign} class="mr-1.5 text-primary-600" />
									{$_('houses.minPrice')}
								</label>
								<input
									id="minPrice"
									type="number"
									bind:value={filters.minPrice}
									onchange={handleFilterChange}
									placeholder="0"
									min="0"
									step="1000"
									class="w-full rounded-lg border border-light-400 bg-light-50 px-4 py-2.5 text-dark-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-light-50"
								/>
							</div>

							<!-- Max Price -->
							<div>
								<label for="maxPrice" class="mb-2 block text-sm font-semibold text-dark-700 dark:text-light-300">
									{$_('houses.maxPrice')}
								</label>
								<input
									id="maxPrice"
									type="number"
									bind:value={filters.maxPrice}
									onchange={handleFilterChange}
									placeholder="∞"
									min="0"
									step="1000"
									class="w-full rounded-lg border border-light-400 bg-light-50 px-4 py-2.5 text-dark-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-light-50"
								/>
							</div>
						</div>

						<!-- Clear Filters Button -->
						{#if activeFiltersCount > 0}
							<div class="mt-6 flex justify-end">
								<button
									type="button"
									onclick={clearFilters}
									class="flex items-center gap-2 rounded-lg border-2 border-error-600 px-4 py-2 font-semibold text-error-600 transition-colors hover:bg-error-50 dark:border-error-400 dark:text-error-400 dark:hover:bg-error-900/20"
								>
									<FontAwesomeIcon icon={faTimes} />
									<span>{$_('houses.clearFilters')}</span>
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Loading State -->
		{#if loading}
			<AppLoadingSpinner message={$_('houses.loading')} overlay={false} />
		{:else if properties.length === 0}
			<!-- Empty State -->
			<div class="flex min-h-[400px] items-center justify-center">
				<div class="text-center">
					<div class="mb-4 flex justify-center">
						<div class="flex h-24 w-24 items-center justify-center rounded-full bg-light-200 dark:bg-dark-700">
							<FontAwesomeIcon icon={faHome} class="text-5xl text-dark-300 dark:text-light-600" />
						</div>
					</div>
					<h2 class="mb-2 text-2xl font-bold text-dark-900 dark:text-light-50">
						{$_('houses.noProperties')}
					</h2>
					<p class="mb-6 text-dark-600 dark:text-light-400">
						{$_('houses.noPropertiesDescription')}
					</p>
					{#if activeFiltersCount > 0}
						<button
							type="button"
							onclick={clearFilters}
							class="rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
						>
							{$_('houses.clearFilters')}
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Properties Grid -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each properties as property (property.id)}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href="/houses/{property.id}" class="block transition-transform duration-200 hover:scale-[1.02]">
						<AppPublicPropertyCard {property} imageIds={propertyImageMap[property.id ?? 0] || []} />
					</a>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="mt-12 flex items-center justify-center gap-2">
					<!-- Previous Button -->
					<button
						type="button"
						onclick={prevPage}
						disabled={!hasPrevPage}
						class="flex h-10 w-10 items-center justify-center rounded-lg border border-light-300 bg-white text-dark-900 transition-all hover:bg-light-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-700 dark:bg-dark-800 dark:text-light-50 dark:hover:bg-dark-700"
						aria-label="Previous page"
					>
						<FontAwesomeIcon icon={faChevronLeft} />
					</button>

					<!-- Page Numbers -->
					{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page (page)}
						{#if page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)}
							<button
								type="button"
								onclick={() => goToPage(page)}
								class="flex h-10 w-10 items-center justify-center rounded-lg border font-semibold transition-all {page ===
								currentPage
									? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500'
									: 'border-light-300 bg-white text-dark-900 hover:bg-light-100 dark:border-dark-700 dark:bg-dark-800 dark:text-light-50 dark:hover:bg-dark-700'}"
							>
								{page}
							</button>
						{:else if page === currentPage - 3 || page === currentPage + 3}
							<span class="flex h-10 w-10 items-center justify-center text-dark-500 dark:text-light-500">...</span>
						{/if}
					{/each}

					<!-- Next Button -->
					<button
						type="button"
						onclick={nextPage}
						disabled={!hasNextPage}
						class="flex h-10 w-10 items-center justify-center rounded-lg border border-light-300 bg-white text-dark-900 transition-all hover:bg-light-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-700 dark:bg-dark-800 dark:text-light-50 dark:hover:bg-dark-700"
						aria-label="Next page"
					>
						<FontAwesomeIcon icon={faChevronRight} />
					</button>
				</div>

				<!-- Page Info -->
				<div class="mt-4 text-center text-sm text-dark-600 dark:text-light-400">
					{$_('houses.pageInfo', { values: { current: currentPage, total: totalPages } })}
				</div>
			{/if}
		{/if}
	</div>
</div>

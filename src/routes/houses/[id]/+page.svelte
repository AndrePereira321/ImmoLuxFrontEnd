<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faArrowLeft,
		faBath,
		faBed,
		faBolt,
		faCalendar,
		faCar,
		faChevronLeft,
		faChevronRight,
		faElevator,
		faEnvelope,
		faLayerGroup,
		faMapMarkerAlt,
		faPhone,
		faRulerCombined,
		faSwimmingPool,
		faTree,
		faUser,
		faWarehouse
	} from '@fortawesome/free-solid-svg-icons';
	import type { PropertyDTO } from '$lib/types/property';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';

	type LeafletComponent = any; // eslint-disable-line @typescript-eslint/no-explicit-any

	let { data } = $props();

	// Derived from server data — never updated client-side
	let property = $derived<PropertyDTO | null>(data.property);
	let imageIds = $derived<number[]>(data.imageIds);
	let loading = $state(false);
	let currentImageIndex = $state(0);
	let mapCoordinates = $state<[number, number] | null>(null);
	let LeafletMap = $state<LeafletComponent>(null);
	let TileLayer = $state<LeafletComponent>(null);
	let Marker = $state<LeafletComponent>(null);
	let Popup = $state<LeafletComponent>(null);
	let mapReady = $state(false);
	let serverUrl = $state('');

	$effect(() => {
		if (browser) {
			serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
		}
	});

	const formatPrice = (price?: number): string => {
		if (!price) return '—';
		return price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
	};

	const getPropertyTypeLabel = (type?: string): string => {
		if (!type) return '—';
		return $_(`properties.types.${type}`);
	};

	const getStatusLabel = (status?: string): string => {
		if (!status) return '—';
		return $_(`properties.statuses.${status}`);
	};

	const getStatusColor = (status?: string): string => {
		switch (status) {
			case 'available':
				return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
			case 'pending':
				return 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200';
			case 'sold':
				return 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200';
			case 'rented':
				return 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-200';
			default:
				return 'bg-light-200 text-dark-800 dark:bg-dark-700 dark:text-light-200';
		}
	};

	const getEnergyRatingLabel = (rating?: string): string | null => {
		if (!rating) return null;
		return $_(`properties.energyRatings.${rating}`);
	};

	const nextImage = () => {
		if (imageIds.length > 0) {
			currentImageIndex = (currentImageIndex + 1) % imageIds.length;
		}
	};

	const prevImage = () => {
		if (imageIds.length > 0) {
			currentImageIndex = (currentImageIndex - 1 + imageIds.length) % imageIds.length;
		}
	};

	const goToImage = (index: number) => {
		currentImageIndex = index;
	};

	// Generate JSON-LD structured data
	const jsonLd = $derived(
		property
			? `<script type="application/ld+json">
{
	"@context": "https://schema.org",
	"@type": "RealEstateListing",
	"@id": "https://immolux.pt/houses/${property.id}#listing",
	"name": "${(property.title || 'Propriedade ImmoLux').replace(/"/g, '\\"')}",
	"description": "${(property.description || '').replace(/"/g, '\\"').replace(/\n/g, ' ')}",
	"url": "https://immolux.pt/houses/${property.id}",
	${imageIds.length > 0 ? `"image": "https://immolux.pt/v1/api/images/${imageIds[0]}",` : ''}
	"offers": {
		"@type": "Offer",
		"price": ${property.price || 0},
		"priceCurrency": "EUR",
		"availability": "${property.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}"
	},
	"address": {
		"@type": "PostalAddress",
		"streetAddress": "${(property.address || '').replace(/"/g, '\\"')}",
		"addressLocality": "${property.municipality || ''}",
		"addressRegion": "${property.district || ''}",
		"postalCode": "${property.postalCode || ''}",
		"addressCountry": "PT"
	}${
		property.areaSqm
			? `,
	"floorSize": {
		"@type": "QuantitativeValue",
		"value": ${property.areaSqm},
		"unitCode": "MTK"
	}`
			: ''
	}${
		property.bedrooms
			? `,
	"numberOfBedrooms": ${property.bedrooms}`
			: ''
	}${
		property.bathrooms
			? `,
	"numberOfBathroomsTotal": ${property.bathrooms}`
			: ''
	}
}
</` +
					`script>` +
					`<script type="application/ld+json">
{
	"@context": "https://schema.org",
	"@type": "BreadcrumbList",
	"itemListElement": [
		{ "@type": "ListItem", "position": 1, "name": "ImmoLux", "item": "https://immolux.pt/" },
		{ "@type": "ListItem", "position": 2, "name": "Properties", "item": "https://immolux.pt/houses" },
		{ "@type": "ListItem", "position": 3, "name": "${(property.title || 'Property').replace(/"/g, '\\"')}", "item": "https://immolux.pt/houses/${property.id}" }
	]
}
</` +
					`script>`
			: ''
	);

	onMount(async () => {
		if (!browser) return;

		// Set map coordinates from server-loaded property data
		if (property && property.latitude != null && property.longitude != null) {
			mapCoordinates = [property.latitude, property.longitude];
		} else if (property) {
			const addressParts = [
				property.address,
				property.parish,
				property.municipality,
				property.district,
				property.postalCode
			]
				.filter(Boolean)
				.join(', ');

			if (addressParts) {
				try {
					const geocodeResponse = await fetch(
						`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressParts)}&limit=1`
					);
					const geocodeData = await geocodeResponse.json();
					if (geocodeData?.length > 0) {
						mapCoordinates = [parseFloat(geocodeData[0].lat), parseFloat(geocodeData[0].lon)];
					}
				} catch {
					/* geocoding failed, map won't show */
				}
			}
		}

		// Load Leaflet dynamically (must stay client-side — excluded from SSR bundle)
		const leaflet = await import('svelte-leafletjs');
		LeafletMap = leaflet.LeafletMap;
		TileLayer = leaflet.TileLayer;
		Marker = leaflet.Marker;
		Popup = leaflet.Popup;
		mapReady = true;
	});
</script>

<svelte:head>
	{#if property}
		<title>{property.title || 'Propriedade'} - ImmoLux</title>
		<meta
			name="description"
			content={property.description
				? property.description.substring(0, 160)
				: `${getPropertyTypeLabel(property.propertyType)} em ${property.municipality}, ${property.district}. ${formatPrice(property.price)}`}
		/>
		<meta property="og:title" content="{property.title || 'Propriedade'} - ImmoLux" />
		<meta
			property="og:description"
			content={property.description
				? property.description.substring(0, 160)
				: `${getPropertyTypeLabel(property.propertyType)} em ${property.municipality}, ${property.district}`}
		/>
		<meta property="og:type" content="website" />
		<meta property="og:url" content="https://immolux.pt/houses/{property.id}" />
		{#if imageIds.length > 0}
			<meta property="og:image" content="https://immolux.pt/v1/api/images/{imageIds[0]}" />
			<meta property="og:image:alt" content={property.title || 'Property'} />
			<meta name="twitter:image" content="https://immolux.pt/v1/api/images/{imageIds[0]}" />
		{/if}
		<meta name="twitter:title" content="{property.title || 'Property'} - ImmoLux" />
		<meta
			name="twitter:description"
			content={property.description
				? property.description.substring(0, 200)
				: `${getPropertyTypeLabel(property.propertyType)} in ${property.municipality}, ${property.district}`}
		/>
		<link rel="canonical" href="https://immolux.pt/houses/{property.id}" />

		<!-- Structured Data (JSON-LD) for Rich Snippets -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLd}
	{/if}
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

{#if loading}
	<div
		class="flex min-h-screen items-center justify-center bg-gradient-to-b from-light-50 to-light-100 dark:from-dark-900 dark:to-dark-850"
	>
		<div class="text-center">
			<FontAwesomeIcon icon={faRulerCombined} class="animate-spin text-6xl text-primary-600 dark:text-primary-400" />
			<p class="mt-4 text-sm font-medium text-dark-600 dark:text-light-400">{$_('houses.loading')}</p>
		</div>
	</div>
{:else if property}
	<div class="min-h-screen bg-gradient-to-b from-light-50 to-light-100 dark:from-dark-900 dark:to-dark-850">
		<!-- Back Button -->
		<div class="border-b border-light-300 bg-white shadow-sm dark:border-dark-700 dark:bg-dark-800">
			<div class="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
				<button
					onclick={() => goto(resolve('/houses'))}
					class="group flex items-center gap-2 font-medium text-dark-600 transition-all hover:gap-3 hover:text-primary-600 dark:text-light-400 dark:hover:text-primary-400"
				>
					<FontAwesomeIcon icon={faArrowLeft} class="transition-transform group-hover:-translate-x-1" />
					<span>{$_('common.back')}</span>
				</button>
			</div>
		</div>

		<div class="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
				<!-- Left Column - Images and Main Info -->
				<div class="lg:col-span-2">
					<!-- Image Carousel -->
					<div
						class="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-light-200 to-light-300 shadow-xl dark:from-dark-600 dark:to-dark-700"
					>
						{#if imageIds.length > 0}
							<div class="relative aspect-video">
								<img
									src="{serverUrl}/v1/api/images/{imageIds[currentImageIndex]}"
									alt={property.title || 'Property'}
									class="h-full w-full object-cover"
								/>

								{#if imageIds.length > 1}
									<!-- Navigation Arrows -->
									<button
										type="button"
										onclick={prevImage}
										class="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-dark-800/90 dark:hover:bg-dark-800"
										aria-label="Previous image"
									>
										<FontAwesomeIcon icon={faChevronLeft} class="h-6 w-6 text-dark-900 dark:text-light-50" />
									</button>

									<button
										type="button"
										onclick={nextImage}
										class="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-dark-800/90 dark:hover:bg-dark-800"
										aria-label="Next image"
									>
										<FontAwesomeIcon icon={faChevronRight} class="h-6 w-6 text-dark-900 dark:text-light-50" />
									</button>

									<!-- Image Counter -->
									<div
										class="absolute right-4 bottom-4 rounded-full bg-dark-900/75 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
									>
										{currentImageIndex + 1} / {imageIds.length}
									</div>
								{/if}

								<!-- Status Badge -->
								{#if property.status}
									<div class="absolute top-4 left-4">
										<span
											class="rounded-full px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-sm {getStatusColor(
												property.status
											)}"
										>
											{getStatusLabel(property.status)}
										</span>
									</div>
								{/if}
							</div>

							<!-- Thumbnail Gallery -->
							{#if imageIds.length > 1}
								<div class="flex gap-2 overflow-x-auto bg-light-100 p-4 dark:bg-dark-800">
									{#each imageIds as imageId, index (imageId)}
										<button
											type="button"
											onclick={() => goToImage(index)}
											class="flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all {index ===
											currentImageIndex
												? 'border-primary-600 ring-2 ring-primary-500/50'
												: 'border-light-300 hover:border-primary-400 dark:border-dark-600'}"
										>
											<img
												src="{serverUrl}/v1/api/images/{imageId}"
												alt="{property.title || 'Property'} - image {index + 1}"
												class="h-20 w-28 object-cover"
											/>
										</button>
									{/each}
								</div>
							{/if}
						{:else}
							<div class="flex aspect-video items-center justify-center">
								<FontAwesomeIcon icon={faRulerCombined} class="text-8xl text-dark-200 opacity-30 dark:text-light-400" />
							</div>
						{/if}
					</div>

					<!-- Property Details Card -->
					<div class="rounded-2xl border border-light-300 bg-white p-8 shadow-xl dark:border-dark-700 dark:bg-dark-800">
						<!-- Title and Type -->
						<div class="mb-6 border-b border-light-200 pb-6 dark:border-dark-700">
							<h1 class="mb-4 text-3xl leading-tight font-bold text-dark-900 sm:text-4xl dark:text-light-50">
								{property.title || $_('properties.untitled')}
							</h1>
							<div class="flex flex-wrap items-center gap-3">
								<span
									class="rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300"
								>
									{getPropertyTypeLabel(property.propertyType)}
								</span>
								{#if property.energyRating}
									<span
										class="inline-flex items-center gap-2 rounded-full bg-success-100 px-4 py-2 text-sm font-semibold text-success-800 dark:bg-success-900 dark:text-success-200"
									>
										<FontAwesomeIcon icon={faBolt} />
										<span>{getEnergyRatingLabel(property.energyRating)}</span>
									</span>
								{/if}
							</div>
						</div>

						<!-- Price -->
						<div class="mb-8">
							<p class="text-xs font-medium tracking-wider text-dark-500 uppercase dark:text-light-500">
								{$_('properties.price')}
							</p>
							<p class="mt-1 text-4xl font-extrabold text-primary-600 sm:text-5xl dark:text-primary-400">
								{formatPrice(property.price)}
							</p>
						</div>

						<!-- Location -->
						<a
							href="https://www.google.com/maps/search/?api=1&query={encodeURIComponent(
								[property.address, property.parish, property.municipality, property.district, property.postalCode]
									.filter(Boolean)
									.join(', ')
							)}"
							target="_blank"
							rel="noopener noreferrer"
							class="mb-8 flex items-start gap-4 rounded-xl bg-light-50 p-5 transition-all hover:bg-light-100 hover:shadow-md dark:bg-dark-700/50 dark:hover:bg-dark-700"
						>
							<div
								class="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900"
							>
								<FontAwesomeIcon icon={faMapMarkerAlt} class="text-lg text-primary-600 dark:text-primary-400" />
							</div>
							<div class="flex-1">
								{#if property.address}
									<p class="text-base font-medium text-dark-700 dark:text-light-300">{property.address}</p>
								{/if}
								<p class="text-lg font-semibold text-dark-900 dark:text-light-50">
									{property.parish ? `${property.parish}, ` : ''}{property.municipality
										? `${property.municipality}, `
										: ''}{property.district ?? ''}
								</p>
								{#if property.postalCode}
									<p class="mt-1 text-sm text-dark-600 dark:text-light-400">{property.postalCode}</p>
								{/if}
							</div>
						</a>

						<!-- Map -->
						{#if mapCoordinates && mapReady && LeafletMap}
							<div class="mb-8">
								<h2 class="mb-4 flex items-center gap-3 text-2xl font-bold text-dark-900 dark:text-light-50">
									<div class="h-1 w-12 rounded-full bg-primary-600 dark:bg-primary-400"></div>
									{$_('properties.sections.location')}
								</h2>
								<div class="overflow-hidden rounded-xl border-2 border-light-300 shadow-lg dark:border-dark-600">
									<div class="h-96">
										<LeafletMap options={{ center: mapCoordinates, zoom: 15 }}>
											<TileLayer url={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'} />
											<Marker latLng={mapCoordinates}>
												<Popup>
													<div class="p-2">
														<p class="font-bold">{property.title || $_('properties.untitled')}</p>
														<p class="text-sm">{property.address}</p>
													</div>
												</Popup>
											</Marker>
										</LeafletMap>
									</div>
								</div>
							</div>
						{/if}

						<!-- Description -->
						{#if property.description}
							<div class="mb-8 border-b border-light-200 pb-8 dark:border-dark-700">
								<h2 class="mb-4 flex items-center gap-3 text-2xl font-bold text-dark-900 dark:text-light-50">
									<div class="h-1 w-12 rounded-full bg-primary-600 dark:bg-primary-400"></div>
									{$_('properties.description')}
								</h2>
								<p class="text-base leading-relaxed whitespace-pre-wrap text-dark-600 dark:text-light-400">
									{property.description}
								</p>
							</div>
						{/if}

						<!-- Main Features -->
						<div class="mb-8">
							<h2 class="mb-6 flex items-center gap-3 text-2xl font-bold text-dark-900 dark:text-light-50">
								<div class="h-1 w-12 rounded-full bg-primary-600 dark:bg-primary-400"></div>
								{$_('properties.sections.propertyDetails')}
							</h2>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{#if property.bedrooms}
									<div class="flex items-center gap-3 rounded-lg bg-light-100 p-4 dark:bg-dark-700">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900"
										>
											<FontAwesomeIcon icon={faBed} class="text-xl text-primary-600 dark:text-primary-400" />
										</div>
										<div>
											<p class="text-sm text-dark-600 dark:text-light-400">{$_('properties.bedrooms')}</p>
											<p class="text-lg font-bold text-dark-900 dark:text-light-50">{property.bedrooms}</p>
										</div>
									</div>
								{/if}

								{#if property.bathrooms}
									<div class="flex items-center gap-3 rounded-lg bg-light-100 p-4 dark:bg-dark-700">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900"
										>
											<FontAwesomeIcon icon={faBath} class="text-xl text-primary-600 dark:text-primary-400" />
										</div>
										<div>
											<p class="text-sm text-dark-600 dark:text-light-400">{$_('properties.bathrooms')}</p>
											<p class="text-lg font-bold text-dark-900 dark:text-light-50">{property.bathrooms}</p>
										</div>
									</div>
								{/if}

								{#if property.areaSqm}
									<div class="flex items-center gap-3 rounded-lg bg-light-100 p-4 dark:bg-dark-700">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900"
										>
											<FontAwesomeIcon icon={faRulerCombined} class="text-xl text-primary-600 dark:text-primary-400" />
										</div>
										<div>
											<p class="text-sm text-dark-600 dark:text-light-400">{$_('properties.areaSqm')}</p>
											<p class="text-lg font-bold text-dark-900 dark:text-light-50">{property.areaSqm} m²</p>
										</div>
									</div>
								{/if}

								{#if property.parkingSpaces}
									<div class="flex items-center gap-3 rounded-lg bg-light-100 p-4 dark:bg-dark-700">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900"
										>
											<FontAwesomeIcon icon={faCar} class="text-xl text-primary-600 dark:text-primary-400" />
										</div>
										<div>
											<p class="text-sm text-dark-600 dark:text-light-400">{$_('properties.parkingSpaces')}</p>
											<p class="text-lg font-bold text-dark-900 dark:text-light-50">{property.parkingSpaces}</p>
										</div>
									</div>
								{/if}

								{#if property.landAreaSqm}
									<div class="flex items-center gap-3 rounded-lg bg-light-100 p-4 dark:bg-dark-700">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900"
										>
											<FontAwesomeIcon icon={faRulerCombined} class="text-xl text-primary-600 dark:text-primary-400" />
										</div>
										<div>
											<p class="text-sm text-dark-600 dark:text-light-400">{$_('properties.landAreaSqm')}</p>
											<p class="text-lg font-bold text-dark-900 dark:text-light-50">{property.landAreaSqm} m²</p>
										</div>
									</div>
								{/if}

								{#if property.yearBuilt}
									<div class="flex items-center gap-3 rounded-lg bg-light-100 p-4 dark:bg-dark-700">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900"
										>
											<FontAwesomeIcon icon={faCalendar} class="text-xl text-primary-600 dark:text-primary-400" />
										</div>
										<div>
											<p class="text-sm text-dark-600 dark:text-light-400">{$_('properties.yearBuilt')}</p>
											<p class="text-lg font-bold text-dark-900 dark:text-light-50">{property.yearBuilt}</p>
										</div>
									</div>
								{/if}

								{#if property.floor !== null && property.floor !== undefined}
									<div class="flex items-center gap-3 rounded-lg bg-light-100 p-4 dark:bg-dark-700">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900"
										>
											<FontAwesomeIcon icon={faLayerGroup} class="text-xl text-primary-600 dark:text-primary-400" />
										</div>
										<div>
											<p class="text-sm text-dark-600 dark:text-light-400">{$_('properties.floor')}</p>
											<p class="text-lg font-bold text-dark-900 dark:text-light-50">
												{property.floor}{property.totalFloors ? ` / ${property.totalFloors}` : ''}
											</p>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Amenities -->
						{#if property.hasGarage || property.hasGarden || property.hasPool || property.hasElevator}
							<div class="mb-8 border-b border-light-200 pb-8 dark:border-dark-700">
								<h2 class="mb-6 flex items-center gap-3 text-2xl font-bold text-dark-900 dark:text-light-50">
									<div class="h-1 w-12 rounded-full bg-primary-600 dark:bg-primary-400"></div>
									{$_('properties.sections.features')}
								</h2>
								<div class="flex flex-wrap gap-4">
									{#if property.hasGarage}
										<div
											class="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 dark:border-primary-800 dark:bg-primary-900/30"
										>
											<FontAwesomeIcon icon={faWarehouse} class="text-primary-600 dark:text-primary-400" />
											<span class="font-medium text-dark-900 dark:text-light-50">{$_('properties.hasGarage')}</span>
										</div>
									{/if}
									{#if property.hasGarden}
										<div
											class="flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 px-4 py-2 dark:border-success-800 dark:bg-success-900/30"
										>
											<FontAwesomeIcon icon={faTree} class="text-success-600 dark:text-success-400" />
											<span class="font-medium text-dark-900 dark:text-light-50">{$_('properties.hasGarden')}</span>
										</div>
									{/if}
									{#if property.hasPool}
										<div
											class="flex items-center gap-2 rounded-lg border border-info-200 bg-info-50 px-4 py-2 dark:border-info-800 dark:bg-info-900/30"
										>
											<FontAwesomeIcon icon={faSwimmingPool} class="text-info-600 dark:text-info-400" />
											<span class="font-medium text-dark-900 dark:text-light-50">{$_('properties.hasPool')}</span>
										</div>
									{/if}
									{#if property.hasElevator}
										<div
											class="flex items-center gap-2 rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-2 dark:border-secondary-800 dark:bg-secondary-900/30"
										>
											<FontAwesomeIcon icon={faElevator} class="text-secondary-600 dark:text-secondary-400" />
											<span class="font-medium text-dark-900 dark:text-light-50">{$_('properties.hasElevator')}</span>
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Virtual Tour -->
						{#if property.virtualTourUrl}
							<div>
								<h2 class="mb-4 flex items-center gap-3 text-2xl font-bold text-dark-900 dark:text-light-50">
									<div class="h-1 w-12 rounded-full bg-primary-600 dark:bg-primary-400"></div>
									{$_('properties.virtualTourUrl')}
								</h2>
								<!-- External link - data-sveltekit-reload bypasses SvelteKit routing -->
								<a
									href={property.virtualTourUrl}
									data-sveltekit-reload
									target="_blank"
									rel="noopener noreferrer"
									class="group inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-4 text-lg font-semibold text-light-50 shadow-lg transition-all hover:-translate-y-1 hover:from-primary-700 hover:to-primary-800 hover:shadow-xl dark:from-primary-700 dark:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700"
								>
									<span>{$_('properties.virtualTourUrl')}</span>
									<span class="transition-transform group-hover:translate-x-1">→</span>
								</a>
							</div>
						{/if}
					</div>
				</div>

				<!-- Right Column - Contact -->
				<div class="lg:col-span-1">
					<div class="sticky top-8">
						{#if property.contacts && property.contacts.length > 0}
							<div
								class="overflow-hidden rounded-2xl border border-light-300 bg-white shadow-xl dark:border-dark-700 dark:bg-dark-800"
							>
								<!-- Header -->
								<div
									class="bg-gradient-to-r from-primary-600 to-primary-700 p-6 dark:from-primary-700 dark:to-primary-800"
								>
									<h2 class="mb-1 text-sm font-medium tracking-wide text-primary-100 uppercase">
										{$_('properties.sections.contact')}
										{#if property.contacts.length > 1}
											<span class="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
												{property.contacts.length}
											</span>
										{/if}
									</h2>
									<p class="text-xl font-bold text-white">
										{$_('homepage.contact.interested').split('.')[0]}
									</p>
								</div>

								<div class="space-y-6 p-6">
									{#each property.contacts as contact, index (contact.id)}
										<!-- Contact Person -->
										<div class={index > 0 ? 'border-t border-light-200 pt-6 dark:border-dark-600' : ''}>
											<div
												class="dark:bg-dark-750 mb-4 flex items-center gap-3 rounded-xl border-2 border-light-200 bg-white p-4 dark:border-dark-600"
											>
												<div class="text-3xl text-primary-600 dark:text-primary-400">
													<FontAwesomeIcon icon={faUser} />
												</div>
												<div>
													<p class="text-xs font-medium tracking-wide text-dark-500 uppercase dark:text-light-500">
														{$_('properties.contact')}
														{property.contacts.length > 1 ? `${index + 1}` : ''}
													</p>
													<p class="text-lg font-bold text-dark-900 dark:text-light-50">
														{contact.name}
													</p>
												</div>
											</div>

											<!-- Contact Buttons -->
											<div class="space-y-3">
												{#if contact.phone}
													<a
														href="tel:{contact.phone}"
														class="group flex items-center gap-3 rounded-xl border-2 border-success-200 bg-success-50 p-4 transition-all hover:border-success-400 hover:bg-success-100 hover:shadow-md dark:border-success-800 dark:bg-success-900/20 dark:hover:border-success-600 dark:hover:bg-success-900/40"
													>
														<div
															class="text-2xl text-success-600 transition-transform group-hover:scale-110 dark:text-success-400"
														>
															<FontAwesomeIcon icon={faPhone} />
														</div>
														<div class="flex-1">
															<p
																class="text-xs font-semibold tracking-wide text-success-700 uppercase dark:text-success-300"
															>
																{$_('contacts.phone')}
															</p>
															<p class="text-base font-bold text-dark-900 dark:text-light-50">{contact.phone}</p>
														</div>
													</a>
												{/if}

												{#if contact.email}
													<a
														href="mailto:{contact.email}"
														class="group flex items-center gap-3 rounded-xl border-2 border-primary-200 bg-primary-50 p-4 transition-all hover:border-primary-400 hover:bg-primary-100 hover:shadow-md dark:border-primary-800 dark:bg-primary-900/20 dark:hover:border-primary-600 dark:hover:bg-primary-900/40"
													>
														<div
															class="text-2xl text-primary-600 transition-transform group-hover:scale-110 dark:text-primary-400"
														>
															<FontAwesomeIcon icon={faEnvelope} />
														</div>
														<div class="flex-1 overflow-hidden">
															<p
																class="text-xs font-semibold tracking-wide text-primary-700 uppercase dark:text-primary-300"
															>
																{$_('contacts.email')}
															</p>
															<p class="truncate text-base font-bold text-dark-900 dark:text-light-50">
																{contact.email}
															</p>
														</div>
													</a>
												{/if}

												{#if contact.notes}
													<div
														class="rounded-xl border border-light-300 bg-light-100 p-4 dark:border-dark-600 dark:bg-dark-700"
													>
														<p class="text-sm font-medium tracking-wide text-dark-500 uppercase dark:text-light-500">
															{$_('contacts.notes')}
														</p>
														<p class="mt-2 text-sm leading-relaxed text-dark-700 dark:text-light-300">
															{contact.notes}
														</p>
													</div>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

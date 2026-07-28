<script lang="ts">
	import { onMount } from 'svelte';
	import { _, locale } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faBath,
		faBed,
		faBolt,
		faCalendar,
		faCar,
		faChevronLeft,
		faChevronRight,
		faElevator,
		faEnvelope,
		faExpand,
		faLayerGroup,
		faMapMarkerAlt,
		faPhone,
		faRulerCombined,
		faSwimmingPool,
		faTree,
		faUser,
		faWarehouse,
		faXmark
	} from '@fortawesome/free-solid-svg-icons';
	import type { PropertyDTO } from '$lib/types/property';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { inview } from '$lib/actions/inview';
	import { formatPrice as formatPriceIntl } from '$lib/utils/format';

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
	let lightboxOpen = $state(false);

	$effect(() => {
		if (browser) {
			serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
		}
	});

	// Close lightbox on Escape key; keep the page from scrolling underneath it
	$effect(() => {
		if (!browser || !lightboxOpen) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') lightboxOpen = false;
			if (e.key === 'ArrowRight') nextImage();
			if (e.key === 'ArrowLeft') prevImage();
		};
		window.addEventListener('keydown', handleKey);
		const previousOverflow = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		return () => {
			window.removeEventListener('keydown', handleKey);
			document.documentElement.style.overflow = previousOverflow;
		};
	});

	const formatPrice = (price?: number): string => formatPriceIntl(price, $locale);

	const getPropertyTypeLabel = (type?: string): string => {
		if (!type) return '—';
		return $_(`properties.types.${type}`);
	};

	const getStatusLabel = (status?: string): string => {
		if (!status) return '—';
		return $_(`properties.statuses.${status}`);
	};

	/* The 900 text steps are deliberate: these ramps run light, and the 800s
	   fall under 4.5:1 against their own 100-tint plates. */
	const getStatusColor = (status?: string): string => {
		switch (status) {
			case 'available':
				return 'bg-success-100/90 text-success-900 dark:bg-success-900/80 dark:text-success-200';
			case 'pending':
				return 'bg-warning-100/90 text-warning-900 dark:bg-warning-900/80 dark:text-warning-200';
			case 'sold':
				return 'bg-error-100/90 text-error-800 dark:bg-error-900/80 dark:text-error-200';
			case 'rented':
				return 'bg-info-100/90 text-info-900 dark:bg-info-900/80 dark:text-info-200';
			default:
				return 'bg-light-200/90 text-dark-800 dark:bg-dark-700/80 dark:text-light-200';
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
{"@context":"https://schema.org","@type":"RealEstateListing","@id":"https://immolux.pt/houses/${property.id}#listing","name":"${(property.title || 'Propriedade ImmoLux').replace(/"/g, '\\"')}","description":"${(property.description || '').replace(/"/g, '\\"').replace(/\n/g, ' ')}","url":"https://immolux.pt/houses/${property.id}",
	${imageIds.length > 0 ? `"image":"https://immolux.pt/v1/api/images/${imageIds[0]}",` : ''}"offers": {"@type":"Offer","price": ${property.price || 0},"priceCurrency":"EUR","availability":"${property.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}"
	},"address": {"@type":"PostalAddress","streetAddress":"${(property.address || '').replace(/"/g, '\\"')}","addressLocality":"${property.municipality || ''}","addressRegion":"${property.district || ''}","postalCode":"${property.postalCode || ''}","addressCountry":"PT"
	}${
		property.areaSqm
			? `,"floorSize": {"@type":"QuantitativeValue","value": ${property.areaSqm},"unitCode":"MTK"
	}`
			: ''
	}${property.bedrooms ? `,"numberOfBedrooms": ${property.bedrooms}` : ''}${
		property.bathrooms ? `,"numberOfBathroomsTotal": ${property.bathrooms}` : ''
	}
}
</` +
					`script>` +
					`<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement": [
		{"@type":"ListItem","position": 1,"name":"ImmoLux","item":"https://immolux.pt/" },
		{"@type":"ListItem","position": 2,"name":"Properties","item":"https://immolux.pt/houses" },
		{"@type":"ListItem","position": 3,"name":"${(property.title || 'Property').replace(/"/g, '\\"')}","item":"https://immolux.pt/houses/${property.id}" }
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
		<title>{property.title || $_('properties.untitled')} - ImmoLux</title>
		<meta
			name="description"
			content={property.description
				? property.description.substring(0, 160)
				: `${getPropertyTypeLabel(property.propertyType)} em ${property.municipality}, ${property.district}. ${formatPrice(property.price)}`}
		/>
		<meta property="og:title" content="{property.title || $_('properties.untitled')} - ImmoLux" />
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
			<meta property="og:image:alt" content={property.title || $_('properties.untitled')} />
			<meta name="twitter:image" content="https://immolux.pt/v1/api/images/{imageIds[0]}" />
		{/if}
		<meta name="twitter:title" content="{property.title || $_('properties.untitled')} - ImmoLux" />
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
	<div class="flex min-h-screen items-center justify-center bg-light-50 dark:bg-dark-900">
		<div class="text-center">
			<div class="relative mx-auto mb-5 h-12 w-12">
				<div class="absolute inset-0 rounded-full border-2 border-light-300 dark:border-dark-700"></div>
				<div
					class="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary-600 dark:border-t-primary-400"
					style="animation-duration: 0.8s"
				></div>
			</div>
			<p class="text-sm font-medium text-dark-400 dark:text-light-600">{$_('houses.loading')}</p>
		</div>
	</div>
{:else if property}
	<div class="min-h-screen bg-light-50 dark:bg-dark-900">
		<!-- Breadcrumb -->
		<nav
			class="border-b border-light-300/70 bg-white/80 backdrop-blur-sm dark:border-dark-700/60 dark:bg-dark-800/80"
			aria-label={$_('common.breadcrumb')}
		>
			<div class="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
				<ol class="flex items-center gap-1.5 text-[0.8rem]">
					<li>
						<a
							href={resolve('/')}
							class="font-medium text-dark-400 transition-colors hover:text-primary-600 dark:text-light-600 dark:hover:text-primary-400"
						>
							{$_('home')}
						</a>
					</li>
					<li class="text-dark-300 dark:text-dark-500">/</li>
					<li>
						<a
							href={resolve('/houses')}
							class="font-medium text-dark-400 transition-colors hover:text-primary-600 dark:text-light-600 dark:hover:text-primary-400"
						>
							{$_('houses.title')}
						</a>
					</li>
					<li class="text-dark-300 dark:text-dark-500">/</li>
					<li class="max-w-[200px] truncate font-medium text-dark-700 sm:max-w-xs dark:text-light-300">
						{property.title || $_('properties.untitled')}
					</li>
				</ol>
			</div>
		</nav>

		<!-- ━━━ MAIN CONTENT ━━━ -->
		<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
				<!-- Left Column — Property Info -->
				<div class="lg:col-span-2">
					<!-- Image Carousel -->
					<div class="anim-fade-in mb-8 overflow-hidden shadow-lg">
						{#if imageIds.length > 0}
							<div class="relative aspect-video bg-light-200 dark:bg-dark-800">
								<img
									src="{serverUrl}/v1/api/images/{imageIds[currentImageIndex]}"
									alt={property.title || $_('properties.untitled')}
									class="h-full w-full object-cover"
								/>

								{#if imageIds.length > 1}
									<button
										type="button"
										onclick={prevImage}
										class="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/85 p-3 shadow-md backdrop-blur-sm transition-all hover:scale-105 hover:bg-white dark:bg-dark-800/85 dark:hover:bg-dark-700"
										aria-label={$_('properties.gallery.prevImage')}
									>
										<FontAwesomeIcon icon={faChevronLeft} class="h-5 w-5 text-dark-800 dark:text-light-100" />
									</button>
									<button
										type="button"
										onclick={nextImage}
										class="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/85 p-3 shadow-md backdrop-blur-sm transition-all hover:scale-105 hover:bg-white dark:bg-dark-800/85 dark:hover:bg-dark-700"
										aria-label={$_('properties.gallery.nextImage')}
									>
										<FontAwesomeIcon icon={faChevronRight} class="h-5 w-5 text-dark-800 dark:text-light-100" />
									</button>
								{/if}

								<!-- Fullscreen button -->
								<button
									type="button"
									onclick={() => (lightboxOpen = true)}
									class="absolute right-4 bottom-4 rounded-full bg-dark-900/50 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-dark-900/70"
									aria-label={$_('properties.gallery.fullscreen')}
								>
									<FontAwesomeIcon icon={faExpand} class="h-3.5 w-3.5" />
								</button>

								{#if imageIds.length > 1}
									<div
										class="absolute bottom-4 left-4 rounded-full bg-dark-900/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
									>
										{currentImageIndex + 1} / {imageIds.length}
									</div>
								{/if}

								<!-- Status Badge -->
								{#if property.status}
									<div class="absolute top-4 left-4">
										<span
											class="rounded-full px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm {getStatusColor(
												property.status
											)}"
										>
											{getStatusLabel(property.status)}
										</span>
									</div>
								{/if}
							</div>

							<!-- Thumbnails -->
							{#if imageIds.length > 1}
								<div
									class="flex gap-2 overflow-x-auto bg-light-100 p-3 dark:bg-dark-800 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-light-400 dark:[&::-webkit-scrollbar-thumb]:bg-dark-600"
								>
									{#each imageIds as imageId, index (imageId)}
										<button
											type="button"
											onclick={() => goToImage(index)}
											class="flex-shrink-0 overflow-hidden border-2 transition-all {index === currentImageIndex
												? 'border-primary-500 ring-1 ring-primary-500/30'
												: 'border-transparent opacity-70 hover:border-light-400 hover:opacity-100 dark:hover:border-dark-500'}"
										>
											<img
												src="{serverUrl}/v1/api/images/{imageId}"
												alt={$_('properties.gallery.imageAlt', {
													values: { title: property.title ?? $_('properties.untitled'), index: index + 1 }
												})}
												width="96"
												height="64"
												class="h-16 w-24 object-cover"
												loading="lazy"
											/>
										</button>
									{/each}
								</div>
							{/if}
						{:else}
							<div class="flex aspect-video items-center justify-center bg-light-200 dark:bg-dark-800">
								<FontAwesomeIcon icon={faRulerCombined} class="text-7xl text-dark-200/40 dark:text-light-700/20" />
							</div>
						{/if}
					</div>

					<!-- Title Block -->
					<div class="anim-fade-in-up mb-8" style="animation-delay: 0.1s">
						<div class="mb-4 flex flex-wrap items-center gap-2">
							<span
								class="bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
							>
								{getPropertyTypeLabel(property.propertyType)}
							</span>
							{#if property.energyRating}
								<span
									class="inline-flex items-center gap-1.5 bg-success-50 px-3 py-1 text-xs font-semibold text-success-900 dark:bg-success-950/50 dark:text-success-300"
								>
									<FontAwesomeIcon icon={faBolt} class="text-[0.6rem]" />
									<span>{getEnergyRatingLabel(property.energyRating)}</span>
								</span>
							{/if}
						</div>

						<h1
							class="mb-3 text-3xl leading-tight font-normal text-dark-900 sm:text-4xl lg:text-[2.75rem] dark:text-light-50"
						>
							{property.title || $_('properties.untitled')}
						</h1>

						<!-- Location -->
						<a
							href="https://www.google.com/maps/search/?api=1&query={encodeURIComponent(
								[property.address, property.parish, property.municipality, property.district, property.postalCode]
									.filter(Boolean)
									.join(', ')
							)}"
							target="_blank"
							rel="noopener noreferrer"
							class="group inline-flex items-center gap-2 text-sm text-dark-500 transition-colors hover:text-primary-600 dark:text-light-500 dark:hover:text-primary-400"
						>
							<FontAwesomeIcon icon={faMapMarkerAlt} class="text-xs text-primary-500 dark:text-primary-400" />
							<span>
								{#if property.address}{property.address},
								{/if}{property.parish ? `${property.parish}, ` : ''}{property.municipality
									? `${property.municipality}, `
									: ''}{property.district ?? ''}{#if property.postalCode}
									&middot; {property.postalCode}{/if}
							</span>
							<span class="text-xs opacity-0 transition-opacity group-hover:opacity-100">&#8599;</span>
						</a>
					</div>

					<!-- Price bar -->
					<div
						class="anim-fade-in-up mb-8 flex items-center justify-between border border-light-300/70 bg-white p-6 shadow-sm sm:p-7 dark:border-dark-700/60 dark:bg-dark-800"
						style="animation-delay: 0.2s"
					>
						<div>
							<p class="type-label mb-1 text-dark-400 dark:text-light-600">
								{$_('properties.price')}
							</p>
							<!-- Same display voice the homepage record and the cards set the price in -->
							<p class="type-display text-3xl text-primary-700 tabular-nums sm:text-4xl dark:text-primary-400">
								{formatPrice(property.price)}
							</p>
						</div>
						<!-- Quick stats inline -->
						<div class="hidden items-center gap-5 sm:flex">
							{#if property.bedrooms}
								<div class="text-center">
									<p class="text-lg font-semibold text-dark-900 dark:text-light-50">{property.bedrooms}</p>
									<p class="text-[0.625rem] font-medium tracking-wide text-dark-400 uppercase dark:text-light-600">
										{$_('properties.bedrooms')}
									</p>
								</div>
							{/if}
							{#if property.bathrooms}
								<div class="text-center">
									<p class="text-lg font-semibold text-dark-900 dark:text-light-50">{property.bathrooms}</p>
									<p class="text-[0.625rem] font-medium tracking-wide text-dark-400 uppercase dark:text-light-600">
										{$_('properties.bathrooms')}
									</p>
								</div>
							{/if}
							{#if property.areaSqm}
								<div class="text-center">
									<p class="text-lg font-semibold text-dark-900 dark:text-light-50">
										{property.areaSqm} m&sup2;
									</p>
									<p class="text-[0.625rem] font-medium tracking-wide text-dark-400 uppercase dark:text-light-600">
										{$_('properties.areaSqm')}
									</p>
								</div>
							{/if}
						</div>
					</div>

					<!-- Description -->
					{#if property.description}
						<div
							class="mb-8 border border-light-300/70 bg-white p-7 shadow-sm sm:p-8 dark:border-dark-700/60 dark:bg-dark-800"
							use:inview
						>
							<h2 class="reveal reveal-up mb-5 text-lg font-normal text-dark-900 dark:text-light-50">
								{$_('properties.description')}
							</h2>
							<div
								class="reveal reveal-up reveal-d1 mb-5 h-px w-12 bg-gradient-to-r from-secondary-400 to-transparent dark:from-secondary-600"
							></div>
							<p
								class="reveal reveal-up reveal-d2 text-[0.938rem] leading-relaxed whitespace-pre-wrap text-dark-500 dark:text-light-500"
							>
								{property.description}
							</p>
						</div>
					{/if}

					<!-- Property Details Grid -->
					<div
						class="mb-8 border border-light-300/70 bg-white p-7 shadow-sm sm:p-8 dark:border-dark-700/60 dark:bg-dark-800"
						use:inview
					>
						<h2 class="reveal reveal-up mb-5 text-lg font-normal text-dark-900 dark:text-light-50">
							{$_('properties.sections.propertyDetails')}
						</h2>
						<div
							class="reveal reveal-up reveal-d1 mb-6 h-px w-12 bg-gradient-to-r from-secondary-400 to-transparent dark:from-secondary-600"
						></div>
						<div class="reveal reveal-up reveal-d2 grid grid-cols-2 gap-3 sm:grid-cols-3">
							{#if property.bedrooms}
								<div
									class="flex items-center gap-3 border border-light-200/80 bg-light-50 p-4 transition-all hover:border-light-300 hover:shadow-sm dark:border-dark-700/60 dark:bg-dark-800/50 dark:hover:border-dark-600"
								>
									<div class="flex h-10 w-10 items-center justify-center bg-primary-50 dark:bg-primary-950/50">
										<FontAwesomeIcon icon={faBed} class="text-sm text-primary-600 dark:text-primary-400" />
									</div>
									<div>
										<p class="text-[0.688rem] text-dark-400 dark:text-light-600">{$_('properties.bedrooms')}</p>
										<p class="text-base font-semibold text-dark-900 dark:text-light-50">{property.bedrooms}</p>
									</div>
								</div>
							{/if}

							{#if property.bathrooms}
								<div
									class="flex items-center gap-3 border border-light-200/80 bg-light-50 p-4 transition-all hover:border-light-300 hover:shadow-sm dark:border-dark-700/60 dark:bg-dark-800/50 dark:hover:border-dark-600"
								>
									<div class="flex h-10 w-10 items-center justify-center bg-primary-50 dark:bg-primary-950/50">
										<FontAwesomeIcon icon={faBath} class="text-sm text-primary-600 dark:text-primary-400" />
									</div>
									<div>
										<p class="text-[0.688rem] text-dark-400 dark:text-light-600">{$_('properties.bathrooms')}</p>
										<p class="text-base font-semibold text-dark-900 dark:text-light-50">{property.bathrooms}</p>
									</div>
								</div>
							{/if}

							{#if property.areaSqm}
								<div
									class="flex items-center gap-3 border border-light-200/80 bg-light-50 p-4 transition-all hover:border-light-300 hover:shadow-sm dark:border-dark-700/60 dark:bg-dark-800/50 dark:hover:border-dark-600"
								>
									<div class="flex h-10 w-10 items-center justify-center bg-primary-50 dark:bg-primary-950/50">
										<FontAwesomeIcon icon={faRulerCombined} class="text-sm text-primary-600 dark:text-primary-400" />
									</div>
									<div>
										<p class="text-[0.688rem] text-dark-400 dark:text-light-600">{$_('properties.areaSqm')}</p>
										<p class="text-base font-semibold text-dark-900 dark:text-light-50">{property.areaSqm} m&sup2;</p>
									</div>
								</div>
							{/if}

							{#if property.parkingSpaces}
								<div
									class="flex items-center gap-3 border border-light-200/80 bg-light-50 p-4 transition-all hover:border-light-300 hover:shadow-sm dark:border-dark-700/60 dark:bg-dark-800/50 dark:hover:border-dark-600"
								>
									<div class="flex h-10 w-10 items-center justify-center bg-primary-50 dark:bg-primary-950/50">
										<FontAwesomeIcon icon={faCar} class="text-sm text-primary-600 dark:text-primary-400" />
									</div>
									<div>
										<p class="text-[0.688rem] text-dark-400 dark:text-light-600">{$_('properties.parkingSpaces')}</p>
										<p class="text-base font-semibold text-dark-900 dark:text-light-50">{property.parkingSpaces}</p>
									</div>
								</div>
							{/if}

							{#if property.landAreaSqm}
								<div
									class="flex items-center gap-3 border border-light-200/80 bg-light-50 p-4 transition-all hover:border-light-300 hover:shadow-sm dark:border-dark-700/60 dark:bg-dark-800/50 dark:hover:border-dark-600"
								>
									<div class="flex h-10 w-10 items-center justify-center bg-primary-50 dark:bg-primary-950/50">
										<FontAwesomeIcon icon={faRulerCombined} class="text-sm text-primary-600 dark:text-primary-400" />
									</div>
									<div>
										<p class="text-[0.688rem] text-dark-400 dark:text-light-600">{$_('properties.landAreaSqm')}</p>
										<p class="text-base font-semibold text-dark-900 dark:text-light-50">
											{property.landAreaSqm} m&sup2;
										</p>
									</div>
								</div>
							{/if}

							{#if property.yearBuilt}
								<div
									class="flex items-center gap-3 border border-light-200/80 bg-light-50 p-4 transition-all hover:border-light-300 hover:shadow-sm dark:border-dark-700/60 dark:bg-dark-800/50 dark:hover:border-dark-600"
								>
									<div class="flex h-10 w-10 items-center justify-center bg-primary-50 dark:bg-primary-950/50">
										<FontAwesomeIcon icon={faCalendar} class="text-sm text-primary-600 dark:text-primary-400" />
									</div>
									<div>
										<p class="text-[0.688rem] text-dark-400 dark:text-light-600">{$_('properties.yearBuilt')}</p>
										<p class="text-base font-semibold text-dark-900 dark:text-light-50">{property.yearBuilt}</p>
									</div>
								</div>
							{/if}

							{#if property.floor !== null && property.floor !== undefined}
								<div
									class="flex items-center gap-3 border border-light-200/80 bg-light-50 p-4 transition-all hover:border-light-300 hover:shadow-sm dark:border-dark-700/60 dark:bg-dark-800/50 dark:hover:border-dark-600"
								>
									<div class="flex h-10 w-10 items-center justify-center bg-primary-50 dark:bg-primary-950/50">
										<FontAwesomeIcon icon={faLayerGroup} class="text-sm text-primary-600 dark:text-primary-400" />
									</div>
									<div>
										<p class="text-[0.688rem] text-dark-400 dark:text-light-600">{$_('properties.floor')}</p>
										<p class="text-base font-semibold text-dark-900 dark:text-light-50">
											{property.floor}{property.totalFloors ? ` / ${property.totalFloors}` : ''}
										</p>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Amenities -->
					{#if property.hasGarage || property.hasGarden || property.hasPool || property.hasElevator}
						<div
							class="mb-8 border border-light-300/70 bg-white p-7 shadow-sm sm:p-8 dark:border-dark-700/60 dark:bg-dark-800"
							use:inview
						>
							<h2 class="reveal reveal-up mb-5 text-lg font-normal text-dark-900 dark:text-light-50">
								{$_('properties.sections.features')}
							</h2>
							<div
								class="reveal reveal-up reveal-d1 mb-6 h-px w-12 bg-gradient-to-r from-secondary-400 to-transparent dark:from-secondary-600"
							></div>
							<div class="reveal reveal-up reveal-d2 flex flex-wrap gap-3">
								{#if property.hasGarage}
									<div
										class="flex items-center gap-2.5 border border-primary-200/60 bg-primary-50/60 px-4 py-2.5 dark:border-primary-900/40 dark:bg-primary-950/30"
									>
										<FontAwesomeIcon icon={faWarehouse} class="text-sm text-primary-600 dark:text-primary-400" />
										<span class="text-sm font-medium text-dark-800 dark:text-light-200"
											>{$_('properties.hasGarage')}</span
										>
									</div>
								{/if}
								{#if property.hasGarden}
									<div
										class="flex items-center gap-2.5 border border-success-200/60 bg-success-50/60 px-4 py-2.5 dark:border-success-900/40 dark:bg-success-950/30"
									>
										<FontAwesomeIcon icon={faTree} class="text-sm text-success-600 dark:text-success-400" />
										<span class="text-sm font-medium text-dark-800 dark:text-light-200"
											>{$_('properties.hasGarden')}</span
										>
									</div>
								{/if}
								{#if property.hasPool}
									<div
										class="flex items-center gap-2.5 border border-info-200/60 bg-info-50/60 px-4 py-2.5 dark:border-info-900/40 dark:bg-info-950/30"
									>
										<FontAwesomeIcon icon={faSwimmingPool} class="text-sm text-info-600 dark:text-info-400" />
										<span class="text-sm font-medium text-dark-800 dark:text-light-200">{$_('properties.hasPool')}</span
										>
									</div>
								{/if}
								{#if property.hasElevator}
									<div
										class="flex items-center gap-2.5 border border-secondary-200/60 bg-secondary-50/60 px-4 py-2.5 dark:border-secondary-900/40 dark:bg-secondary-950/30"
									>
										<FontAwesomeIcon icon={faElevator} class="text-sm text-secondary-700 dark:text-secondary-400" />
										<span class="text-sm font-medium text-dark-800 dark:text-light-200"
											>{$_('properties.hasElevator')}</span
										>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Map -->
					{#if mapCoordinates && mapReady && LeafletMap}
						<div
							class="mb-8 overflow-hidden border border-light-300/70 bg-white shadow-sm dark:border-dark-700/60 dark:bg-dark-800"
							use:inview
						>
							<div class="p-7 pb-0 sm:p-8 sm:pb-0">
								<h2 class="reveal reveal-up mb-5 text-lg font-normal text-dark-900 dark:text-light-50">
									{$_('properties.sections.location')}
								</h2>
								<div
									class="reveal reveal-up reveal-d1 mb-6 h-px w-12 bg-gradient-to-r from-secondary-400 to-transparent dark:from-secondary-600"
								></div>
							</div>
							<div class="reveal reveal-scale reveal-d2 h-80">
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
					{/if}

					<!-- Virtual Tour -->
					{#if property.virtualTourUrl}
						<div
							class="mb-8 border border-light-300/70 bg-white p-7 shadow-sm sm:p-8 dark:border-dark-700/60 dark:bg-dark-800"
							use:inview
						>
							<h2 class="reveal reveal-up mb-5 text-lg font-normal text-dark-900 dark:text-light-50">
								{$_('properties.virtualTourUrl')}
							</h2>
							<a
								href={property.virtualTourUrl}
								data-sveltekit-reload
								target="_blank"
								rel="noopener noreferrer"
								class="reveal reveal-up reveal-d1 group inline-flex items-center gap-2.5 bg-primary-600 px-6 py-3.5 text-sm font-semibold text-light-50 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-md dark:bg-primary-700 dark:hover:bg-primary-600"
							>
								<span>{$_('properties.virtualTourUrl')}</span>
								<span class="text-xs transition-transform group-hover:translate-x-0.5">&#8594;</span>
							</a>
						</div>
					{/if}
				</div>

				<!-- Right Column — Contact Sidebar -->
				<div class="lg:col-span-1">
					<div class="anim-fade-in-up sticky top-24" style="animation-delay: 0.3s">
						{#if property.contacts && property.contacts.length > 0}
							<div class="border border-light-300/70 bg-white p-7 shadow-sm dark:border-dark-700/60 dark:bg-dark-800">
								<!-- Header — matches other card sections -->
								<h2 class="mb-2 text-lg font-normal text-dark-900 dark:text-light-50">
									{$_('properties.sections.contact')}
								</h2>
								<div
									class="mb-6 h-px w-12 bg-gradient-to-r from-secondary-400 to-transparent dark:from-secondary-600"
								></div>

								<div class="space-y-6">
									{#each property.contacts as contact, index (contact.id)}
										<div class={index > 0 ? 'border-t border-light-200/80 pt-6 dark:border-dark-700/60' : ''}>
											<!-- Contact Name -->
											<div class="mb-4 flex items-center gap-3">
												<div
													class="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-primary-50 dark:bg-primary-950/50"
												>
													<FontAwesomeIcon icon={faUser} class="text-sm text-primary-600 dark:text-primary-400" />
												</div>
												<div>
													{#if property.contacts.length > 1}
														<p
															class="text-[0.625rem] font-semibold tracking-wider text-dark-400 uppercase dark:text-light-600"
														>
															{$_('properties.contact')}
															{index + 1}
														</p>
													{/if}
													<p class="text-sm font-semibold text-dark-900 dark:text-light-50">
														{contact.name}
													</p>
												</div>
											</div>

											<!-- Contact Actions -->
											<div class="space-y-2">
												{#if contact.phone}
													<a
														href="tel:{contact.phone}"
														class="group flex items-center gap-3 border border-light-200/80 bg-light-50 p-3.5 transition-all hover:border-light-300 hover:shadow-sm dark:border-dark-700/60 dark:bg-dark-800/50 dark:hover:border-dark-600"
													>
														<div
															class="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-success-50 transition-transform group-hover:scale-105 dark:bg-success-950/40"
														>
															<FontAwesomeIcon icon={faPhone} class="text-sm text-success-600 dark:text-success-400" />
														</div>
														<div class="flex-1">
															<p
																class="text-[0.625rem] font-medium tracking-wide text-dark-400 uppercase dark:text-light-600"
															>
																{$_('contacts.phone')}
															</p>
															<p class="text-sm font-semibold text-dark-900 dark:text-light-50">
																{contact.phone}
															</p>
														</div>
													</a>
												{/if}

												{#if contact.email}
													<a
														href="mailto:{contact.email}"
														class="group flex items-center gap-3 border border-light-200/80 bg-light-50 p-3.5 transition-all hover:border-light-300 hover:shadow-sm dark:border-dark-700/60 dark:bg-dark-800/50 dark:hover:border-dark-600"
													>
														<div
															class="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-primary-50 transition-transform group-hover:scale-105 dark:bg-primary-950/40"
														>
															<FontAwesomeIcon
																icon={faEnvelope}
																class="text-sm text-primary-600 dark:text-primary-400"
															/>
														</div>
														<div class="flex-1 overflow-hidden">
															<p
																class="text-[0.625rem] font-medium tracking-wide text-dark-400 uppercase dark:text-light-600"
															>
																{$_('contacts.email')}
															</p>
															<p class="truncate text-sm font-semibold text-dark-900 dark:text-light-50">
																{contact.email}
															</p>
														</div>
													</a>
												{/if}
											</div>

											{#if contact.notes}
												<p class="mt-3 text-[0.813rem] leading-relaxed text-dark-500 dark:text-light-500">
													{contact.notes}
												</p>
											{/if}
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

	<!-- ━━━ LIGHTBOX ━━━ -->
	{#if lightboxOpen && imageIds.length > 0}
		<div
			class="anim-fade-in fixed inset-0 z-[100] flex items-center justify-center overscroll-contain bg-dark-950/95 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			style="animation-duration: 0.2s"
		>
			<!-- Close -->
			<button
				type="button"
				onclick={() => (lightboxOpen = false)}
				class="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20"
				aria-label={$_('common.close')}
			>
				<FontAwesomeIcon icon={faXmark} class="h-5 w-5" />
			</button>

			<!-- Counter -->
			<div class="absolute top-5 left-1/2 -translate-x-1/2 text-sm font-medium text-white/70">
				{currentImageIndex + 1} / {imageIds.length}
			</div>

			<!-- Navigation -->
			{#if imageIds.length > 1}
				<button
					type="button"
					onclick={prevImage}
					class="absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white transition-all hover:bg-white/20"
					aria-label={$_('properties.gallery.prevImage')}
				>
					<FontAwesomeIcon icon={faChevronLeft} class="h-6 w-6" />
				</button>
				<button
					type="button"
					onclick={nextImage}
					class="absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white transition-all hover:bg-white/20"
					aria-label={$_('properties.gallery.nextImage')}
				>
					<FontAwesomeIcon icon={faChevronRight} class="h-6 w-6" />
				</button>
			{/if}

			<!-- Image -->
			<img
				src="{serverUrl}/v1/api/images/{imageIds[currentImageIndex]}"
				alt={$_('properties.gallery.imageAlt', {
					values: { title: property.title ?? $_('properties.untitled'), index: currentImageIndex + 1 }
				})}
				class="anim-fade-in max-h-[85vh] max-w-[92vw] object-contain shadow-2xl"
				style="animation-duration: 0.15s"
			/>
		</div>
	{/if}
{/if}

<script lang="ts">
	/**
	 * The file on one house.
	 *
	 * A buyer arrives here from the catalogue, the homepage, or a shared link, and
	 * the page is laid out as the document they would be handed: the photograph
	 * beside the record, the description beside the ficha, the map, and the person
	 * to call — successive spreads of one file, in the same 7/5 duet the homepage
	 * opens with.
	 *
	 * The cover shows whichever photograph is active: its own arrows step
	 * through the set, the strip shows every one and any click opens the
	 * lightbox at that index, and closing the lightbox leaves the cover on
	 * whichever photo was last viewed there.
	 */
	import { onMount } from 'svelte';
	import { _, locale } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faChevronLeft,
		faChevronRight,
		faEnvelope,
		faExpand,
		faPhone,
		faXmark
	} from '@fortawesome/free-solid-svg-icons';
	import type { PropertyDTO } from '$lib/types/property';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { inview } from '$lib/actions/inview';
	import { formatArea, formatPrice as formatPriceIntl } from '$lib/utils/format';
	import AppAzulejo from '$lib/components/AppAzulejo.svelte';
	// Leaflet's stylesheet and marker images are bundled, not fetched from a CDN:
	// svelte-leafletjs's default marker points at cdnjs, so the page passes its own.
	import 'leaflet/dist/leaflet.css';
	import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
	import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
	import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
	import type { Icon } from 'leaflet';

	type LeafletComponent = any; // eslint-disable-line @typescript-eslint/no-explicit-any

	let { data } = $props();

	// Derived from server data — never updated client-side
	let property = $derived<PropertyDTO | null>(data.property);
	let imageIds = $derived<number[]>(data.imageIds);

	let lightboxOpen = $state(false);
	let lightboxIndex = $state(0);
	let lightboxEl = $state<HTMLDivElement>();
	let lightboxCloseBtn = $state<HTMLButtonElement>();
	let lastFocus: HTMLElement | null = null;

	// Which photograph the cover shows — independent of the lightbox so
	// browsing the cover doesn't require opening it.
	let activeIndex = $state(0);

	let mapCoordinates = $state<[number, number] | null>(null);
	let LeafletMap = $state<LeafletComponent>(null);
	let TileLayer = $state<LeafletComponent>(null);
	let Marker = $state<LeafletComponent>(null);
	let Popup = $state<LeafletComponent>(null);
	let markerIcon = $state<Icon>();
	let mapReady = $state(false);

	// Resolved at init rather than in an effect: this page is server-rendered, and
	// an effect only runs after hydration — by then the browser has already asked
	// the frontend origin for every image and been given a 404.
	const serverUrl = import.meta.env.VITE_SERVER_URL ?? '';

	const openLightbox = (index: number) => {
		activeIndex = index;
		lightboxIndex = index;
		lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		lightboxOpen = true;
	};

	// Focus goes back to whichever tile opened the lightbox, or Escape strands the
	// keyboard at the top of the document. Whatever was last viewed in the
	// lightbox becomes the cover's active photo.
	const closeLightbox = () => {
		lightboxOpen = false;
		activeIndex = lightboxIndex;
		lastFocus?.focus();
		lastFocus = null;
	};

	const nextImage = () => {
		if (imageIds.length > 0) {
			lightboxIndex = (lightboxIndex + 1) % imageIds.length;
		}
	};

	const prevImage = () => {
		if (imageIds.length > 0) {
			lightboxIndex = (lightboxIndex - 1 + imageIds.length) % imageIds.length;
		}
	};

	const nextCoverImage = () => {
		if (imageIds.length > 0) {
			activeIndex = (activeIndex + 1) % imageIds.length;
		}
	};

	const prevCoverImage = () => {
		if (imageIds.length > 0) {
			activeIndex = (activeIndex - 1 + imageIds.length) % imageIds.length;
		}
	};

	// Lightbox keys, scroll lock and focus, released together when it closes
	$effect(() => {
		if (!browser || !lightboxOpen) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closeLightbox();
			if (e.key === 'ArrowRight') nextImage();
			if (e.key === 'ArrowLeft') prevImage();
			// aria-modal hides the page from assistive tech but not from the Tab
			// key, so focus is wrapped across the dialog's own three controls.
			if (e.key === 'Tab' && lightboxEl) {
				const controls = [...lightboxEl.querySelectorAll<HTMLButtonElement>('button')];
				if (controls.length === 0) return;
				e.preventDefault();
				const current = controls.indexOf(document.activeElement as HTMLButtonElement);
				const next = e.shiftKey
					? current <= 0
						? controls.length - 1
						: current - 1
					: current === controls.length - 1 || current === -1
						? 0
						: current + 1;
				controls[next].focus();
			}
		};
		window.addEventListener('keydown', handleKey);
		const previousOverflow = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		lightboxCloseBtn?.focus();
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

	/** Same grammar as the catalogue cards: the colour rides on a dot over an ink
	    plate, which no status palette can guarantee enough contrast for. */
	const statusDot = (status?: string): string => {
		switch (status) {
			case 'available':
				return 'bg-success-500';
			case 'pending':
				return 'bg-warning-400';
			case 'sold':
				return 'bg-error-500';
			case 'rented':
				return 'bg-info-400';
			default:
				return 'bg-light-600';
		}
	};

	const getEnergyRatingLabel = (rating?: string): string | null => {
		if (!rating) return null;
		return $_(`properties.energyRatings.${rating}`);
	};

	/** "Cristelos, Lousada" — the two place names a buyer actually recognises. */
	const place = $derived(
		property ? [property.parish ?? property.municipality, property.district].filter(Boolean).join(', ') : ''
	);

	const fullAddress = $derived(
		property
			? [property.address, property.parish, property.municipality, property.district, property.postalCode]
					.filter(Boolean)
					.join(', ')
			: ''
	);

	const gmapsUrl = $derived(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`);

	/** "T3 · 2 WC · 210 m²" under the price — only the fields this house has. */
	const specLine = $derived(
		property
			? [
					property.bedrooms ? $_('properties.short.typology', { values: { count: property.bedrooms } }) : null,
					property.bathrooms ? $_('properties.short.bathrooms', { values: { count: property.bathrooms } }) : null,
					formatArea(property.areaSqm, $locale),
					property.landAreaSqm
						? $_('properties.short.land', { values: { value: formatArea(property.landAreaSqm, $locale) } })
						: null
				]
					.filter(Boolean)
					.join(' · ')
			: ''
	);

	/**
	 * The ficha: the house as its record, one row per field that exists. The real
	 * catalogue's listings mostly carry very few of these — a short record is
	 * still a record, so rows simply drop out rather than showing dashes.
	 */
	const fichaRows = $derived.by(() => {
		if (!property) return [];
		const rows: { label: string; value: string }[] = [];
		if (property.propertyType)
			rows.push({ label: $_('properties.detail.type'), value: getPropertyTypeLabel(property.propertyType) });
		if (property.bedrooms)
			rows.push({
				label: $_('properties.detail.typology'),
				value: $_('properties.short.typology', { values: { count: property.bedrooms } })
			});
		if (property.bathrooms) rows.push({ label: $_('properties.bathrooms'), value: String(property.bathrooms) });
		const area = formatArea(property.areaSqm, $locale);
		if (area) rows.push({ label: $_('properties.detail.area'), value: area });
		const plot = formatArea(property.landAreaSqm, $locale);
		if (plot) rows.push({ label: $_('properties.detail.plot'), value: plot });
		if (property.yearBuilt) rows.push({ label: $_('properties.yearBuilt'), value: String(property.yearBuilt) });
		if (property.floor !== null && property.floor !== undefined)
			rows.push({
				label: $_('properties.floor'),
				value: property.totalFloors ? `${property.floor} / ${property.totalFloors}` : String(property.floor)
			});
		if (property.parkingSpaces)
			rows.push({ label: $_('properties.parkingSpaces'), value: String(property.parkingSpaces) });
		if (property.energyRating)
			rows.push({ label: $_('properties.energyRating'), value: getEnergyRatingLabel(property.energyRating) ?? '—' });
		return rows;
	});

	const featuresLine = $derived(
		property
			? [
					property.hasGarage ? $_('properties.short.garage') : null,
					property.hasGarden ? $_('properties.short.garden') : null,
					property.hasPool ? $_('properties.short.pool') : null,
					property.hasElevator ? $_('properties.short.elevator') : null
				]
					.filter(Boolean)
					.join(' · ')
			: ''
	);

	/** The plate always has an address behind it: the first contact's, or the
	    company's when a listing carries no contact of its own. */
	const contactEmail = $derived(property?.contacts?.find((c) => c.email)?.email ?? 'info@immolux.pt');
	const contactPhone = $derived(property?.contacts?.find((c) => c.phone)?.phone ?? '+351 913 160 232');
	const contactPhoneHref = $derived(`tel:${contactPhone.replace(/\s+/g, '')}`);

	const mailtoHref = $derived.by(() => {
		const subject = $_('properties.detail.emailSubject', {
			values: { title: property?.title ?? $_('properties.untitled'), id: property?.id ?? '' }
		});
		return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}`;
	});

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
		const [leaflet, { Icon }] = await Promise.all([import('svelte-leafletjs'), import('leaflet')]);
		LeafletMap = leaflet.LeafletMap;
		TileLayer = leaflet.TileLayer;
		Marker = leaflet.Marker;
		Popup = leaflet.Popup;
		markerIcon = new Icon({
			...Icon.Default.prototype.options,
			iconUrl: markerIconUrl,
			iconRetinaUrl: markerIcon2xUrl,
			shadowUrl: markerShadowUrl
		});
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
	<!-- no-JS fallback: the page is server-rendered, so the scroll reveals must
	     not hide the record from a reader arriving without JavaScript -->
	<noscript>
		<style>
			.reveal {
				opacity: 1 !important;
				transform: none !important;
			}
		</style>
	</noscript>
</svelte:head>

{#if property}
	<div class="min-h-screen bg-light-200 pb-14 dark:bg-dark-850">
		<div class="mx-auto w-full max-w-[84rem] px-5 sm:px-8 lg:px-12">
			<!-- ── Breadcrumb ── a quiet line on the wash, not a bar of its own -->
			<nav aria-label={$_('common.breadcrumb')} class="pt-5 pb-5 sm:pt-6">
				<ol class="flex min-w-0 items-center gap-2 text-[0.8rem]">
					<li>
						<a
							href={resolve('/')}
							class="text-dark-400 transition-colors hover:text-primary-700 dark:text-light-600 dark:hover:text-primary-300"
						>
							{$_('home')}
						</a>
					</li>
					<li aria-hidden="true" class="text-dark-300 dark:text-dark-200">/</li>
					<li>
						<a
							href={resolve('/houses')}
							class="text-dark-400 transition-colors hover:text-primary-700 dark:text-light-600 dark:hover:text-primary-300"
						>
							{$_('houses.hero.eyebrow')}
						</a>
					</li>
					<li aria-hidden="true" class="text-dark-300 dark:text-dark-200">/</li>
					<li aria-current="page" class="min-w-0 truncate text-dark-700 dark:text-light-300">
						{property.title || $_('properties.untitled')}
					</li>
				</ol>
			</nav>

			<!-- ━━━ THE COVER — photograph beside record, the homepage duet at full size ━━━ -->
			<div class="azulejo-panel grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
				{#if imageIds.length > 0}
					<div
						class="azulejo-cell-image group relative min-h-[16rem] w-full overflow-hidden sm:min-h-[22rem] lg:min-h-[28rem]"
					>
						<button
							type="button"
							onclick={() => openLightbox(activeIndex)}
							class="block h-full w-full cursor-zoom-in"
							aria-label={$_('properties.gallery.fullscreen')}
						>
							<img
								src="{serverUrl}/v1/api/images/{imageIds[activeIndex]}"
								alt={property.title || $_('properties.untitled')}
								width="1600"
								height="1200"
								fetchpriority="high"
								class="hero-settle absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
							/>
							{#if property.status}
								<span
									class="type-label absolute top-0 left-0 flex items-center gap-2 bg-dark-950/90 px-3 py-2 text-light-50 backdrop-blur-sm"
								>
									<span aria-hidden="true" class="h-1.5 w-1.5 rounded-full {statusDot(property.status)}"></span>
									{getStatusLabel(property.status)}
								</span>
							{/if}
							<!-- The count marks the tile as openable; the button carries the words. -->
							<span
								aria-hidden="true"
								class="type-record absolute right-0 bottom-0 flex items-center gap-2 bg-dark-950/70 px-3 py-2 text-xs text-light-100 backdrop-blur-sm"
							>
								<FontAwesomeIcon icon={faExpand} class="text-[0.65rem]" />
								{imageIds.length}
							</span>
						</button>

						{#if imageIds.length > 1}
							<button
								type="button"
								onclick={prevCoverImage}
								class="absolute top-1/2 left-3 z-10 -translate-y-1/2 border border-light-50/30 bg-dark-950/60 p-2.5 text-light-50 transition-colors hover:bg-light-50 hover:text-dark-950 focus-visible:ring-2 focus-visible:ring-secondary-300 focus-visible:outline-none"
								aria-label={$_('properties.gallery.prevImage')}
							>
								<FontAwesomeIcon icon={faChevronLeft} class="h-4 w-4" />
							</button>
							<button
								type="button"
								onclick={nextCoverImage}
								class="absolute top-1/2 right-3 z-10 -translate-y-1/2 border border-light-50/30 bg-dark-950/60 p-2.5 text-light-50 transition-colors hover:bg-light-50 hover:text-dark-950 focus-visible:ring-2 focus-visible:ring-secondary-300 focus-visible:outline-none"
								aria-label={$_('properties.gallery.nextImage')}
							>
								<FontAwesomeIcon icon={faChevronRight} class="h-4 w-4" />
							</button>
						{/if}
					</div>
				{:else}
					<!-- No photographs yet: the drawn shelter tile holds the cover -->
					<div
						class="azulejo-cell relative flex min-h-[16rem] items-center justify-center sm:min-h-[22rem] lg:min-h-[28rem]"
					>
						<div class="aspect-square w-44 text-primary-300/70 sm:w-56 dark:text-primary-800">
							<AppAzulejo motif="abrigo" />
						</div>
						{#if property.status}
							<span
								class="type-label absolute top-0 left-0 flex items-center gap-2 bg-dark-950/90 px-3 py-2 text-light-50 backdrop-blur-sm"
							>
								<span aria-hidden="true" class="h-1.5 w-1.5 rounded-full {statusDot(property.status)}"></span>
								{getStatusLabel(property.status)}
							</span>
						{/if}
					</div>
				{/if}

				<!-- The record: a field fired in cobalt, carrying the page's one h1 -->
				<div class="azulejo-cell-ink hero-rise flex flex-col justify-center p-7 sm:p-10 lg:p-12">
					<p class="type-label text-light-300/75">
						{getPropertyTypeLabel(property.propertyType)}
						{#if place}
							<span aria-hidden="true" class="mx-2 opacity-45">·</span>{place}
						{/if}
					</p>

					<h1 class="type-display mt-4 text-[clamp(1.7rem,3.2vw,2.7rem)] text-light-50 first-letter:uppercase">
						{property.title || $_('properties.untitled')}
					</h1>

					<span aria-hidden="true" class="mt-6 block w-12 border-t border-light-50/20"></span>

					<p class="type-display mt-5 text-[clamp(1.45rem,2.6vw,2.1rem)] text-light-50 tabular-nums">
						{formatPrice(property.price)}
					</p>

					{#if specLine}
						<p class="type-record mt-3 text-sm text-light-300/85">{specLine}</p>
					{/if}

					<div class="mt-9 flex flex-wrap gap-2.5">
						<a
							href="#contact"
							class="group inline-flex items-center gap-2.5 border border-light-50/30 px-5 py-3 text-sm font-medium text-light-50 transition-colors hover:bg-light-50 hover:text-dark-950"
						>
							{$_('properties.detail.speakTo')}
							<span aria-hidden="true" class="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
						</a>
						{#if property.virtualTourUrl}
							<a
								href={property.virtualTourUrl}
								data-sveltekit-reload
								target="_blank"
								rel="noopener noreferrer"
								class="group inline-flex items-center gap-2.5 border border-light-50/30 px-5 py-3 text-sm font-medium text-light-50 transition-colors hover:bg-light-50 hover:text-dark-950"
							>
								{$_('properties.detail.virtualTour')}
								<span
									aria-hidden="true"
									class="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
								>
									↗
								</span>
							</a>
						{/if}
					</div>
				</div>

				<!-- The contact sheet: every photograph, grout-joined, each opening the
				     lightbox where it stands. Few photographs stretch into a filmstrip;
				     many scroll sideways. -->
				{#if imageIds.length > 1}
					<div
						class="col-span-full grid auto-cols-[minmax(7.5rem,1fr)] grid-flow-col gap-px overflow-x-auto bg-grout dark:bg-grout-dark"
					>
						{#each imageIds as imageId, index (imageId)}
							<button
								type="button"
								onclick={() => openLightbox(index)}
								class="group relative h-24 overflow-hidden bg-dark-950 sm:h-32"
								aria-label={$_('properties.gallery.imageAlt', {
									values: { title: property.title ?? $_('properties.untitled'), index: index + 1 }
								})}
							>
								<img
									src="{serverUrl}/v1/api/images/{imageId}"
									alt=""
									width="320"
									height="240"
									loading="lazy"
									class="absolute inset-0 h-full w-full object-cover opacity-90 transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.05] group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
								/>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- ━━━ THE DOCUMENT — the description beside the ficha ━━━ -->
			{#if property.description || fichaRows.length > 0 || featuresLine}
				<section class="mt-8 sm:mt-10" use:inview>
					<div
						class="azulejo-panel grid-cols-1 {property.description && (fichaRows.length > 0 || featuresLine)
							? 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]'
							: ''}"
					>
						{#if property.description}
							<div class="reveal reveal-up azulejo-cell p-7 sm:p-9">
								<h2 class="type-label text-primary-700 dark:text-primary-300">{$_('properties.description')}</h2>
								<span aria-hidden="true" class="azulejo-rule mt-4 block w-10 border-t"></span>
								<p
									class="mt-5 max-w-[68ch] text-[0.95rem] leading-relaxed whitespace-pre-wrap text-dark-600 dark:text-light-400"
								>
									{property.description}
								</p>
							</div>
						{/if}

						{#if fichaRows.length > 0 || featuresLine}
							<div class="reveal reveal-up reveal-d1 azulejo-cell p-7 sm:p-9">
								<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
									<h2 class="type-label text-primary-700 dark:text-primary-300">{$_('properties.detail.ficha')}</h2>
									<p class="type-record text-xs text-dark-400 dark:text-light-600">
										{$_('properties.detail.ref', { values: { id: property.id } })}
									</p>
								</div>

								<dl class="azulejo-rule mt-5 divide-y divide-grout border-y dark:divide-grout-dark">
									{#each fichaRows as row (row.label)}
										<div class="flex items-baseline justify-between gap-6 py-3">
											<dt class="type-label text-dark-400 dark:text-light-600">{row.label}</dt>
											<dd class="type-record shrink-0 text-right text-[0.95rem] text-dark-800 dark:text-light-100">
												{row.value}
											</dd>
										</div>
									{/each}
									{#if featuresLine}
										<div class="py-3">
											<dt class="type-label text-dark-400 dark:text-light-600">{$_('properties.detail.equipment')}</dt>
											<dd class="type-record mt-2 text-[0.95rem] leading-relaxed text-dark-800 dark:text-light-100">
												{featuresLine}
											</dd>
										</div>
									{/if}
								</dl>
							</div>
						{/if}
					</div>
				</section>
			{/if}

			<!-- ━━━ LOCALIZAÇÃO — the address as a record, then the map at full width ━━━ -->
			{#if fullAddress}
				<section class="mt-8 sm:mt-10" use:inview>
					<div class="azulejo-panel grid-cols-1">
						<div
							class="reveal reveal-up azulejo-cell flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 p-7 sm:px-9 sm:py-7"
						>
							<div class="min-w-0">
								<h2 class="type-label text-primary-700 dark:text-primary-300">{$_('properties.sections.location')}</h2>
								<p class="mt-3 leading-relaxed text-dark-600 dark:text-light-400">{fullAddress}</p>
							</div>
							<a
								href={gmapsUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="group type-record inline-flex items-center gap-2 text-sm text-primary-700 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-600 hover:decoration-primary-500 dark:text-primary-300 dark:decoration-primary-700 dark:hover:text-primary-200"
							>
								{$_('properties.detail.openMap')}
								<span
									aria-hidden="true"
									class="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
								>
									↗
								</span>
							</a>
						</div>

						{#if mapCoordinates && mapReady && LeafletMap}
							<div class="reveal reveal-scale azulejo-cell h-80 lg:h-[24rem]">
								<LeafletMap options={{ center: mapCoordinates, zoom: 15 }}>
									<TileLayer url={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'} />
									<Marker latLng={mapCoordinates} icon={markerIcon}>
										<Popup>
											<div class="p-2">
												<p class="font-bold">{property.title || $_('properties.untitled')}</p>
												<p class="text-sm">{property.address}</p>
											</div>
										</Popup>
									</Marker>
								</LeafletMap>
							</div>
						{/if}
					</div>
				</section>
			{/if}

			<!-- ━━━ QUEM VENDE — a cobalt field to close on, answering the cover's act ━━━ -->
			<section id="contact" class="mt-8 scroll-mt-24 sm:mt-10" use:inview>
				<div class="azulejo-panel grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
					<div class="reveal reveal-up azulejo-cell-ink p-8 sm:p-10 lg:p-12">
						<p class="type-label text-secondary-300">{$_('properties.detail.who')}</p>
						<h2 class="type-display mt-6 text-[clamp(1.7rem,3vw,2.5rem)] text-light-50">
							{$_('properties.detail.contactHeadline')}
						</h2>
						<p class="mt-5 max-w-[46ch] leading-relaxed text-light-300/80">{$_('properties.detail.contactLead')}</p>

						<!-- The one champagne field on the page: the act the whole file leads to. -->
						<a
							href={mailtoHref}
							class="group mt-9 flex w-full max-w-[30rem] flex-col items-start gap-1.5 bg-secondary-300 px-6 py-4 text-dark-950 transition-colors hover:bg-secondary-200 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
						>
							<span class="type-label shrink-0">{$_('properties.detail.writeCta')}</span>
							<span class="flex min-w-0 items-center gap-3">
								<span translate="no" class="type-record min-w-0 truncate text-base">{contactEmail}</span>
								<span aria-hidden="true" class="shrink-0 transition-transform duration-300 group-hover:translate-x-1">
									→
								</span>
							</span>
						</a>
					</div>

					{#if property.contacts && property.contacts.length > 0}
						<div class="reveal reveal-up reveal-d1 azulejo-cell divide-y divide-grout dark:divide-grout-dark">
							{#each property.contacts as contact (contact.id)}
								<div class="p-7 sm:p-9 lg:px-10">
									<h3 class="font-medium break-words text-dark-900 dark:text-light-50">{contact.name}</h3>
									{#if contact.phone}
										<p class="mt-3">
											<a
												href="tel:{contact.phone}"
												translate="no"
												class="type-record text-sm text-dark-800 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-700 hover:decoration-primary-500 dark:text-light-200 dark:decoration-primary-700 dark:hover:text-primary-300"
											>
												{contact.phone}
											</a>
										</p>
									{/if}
									{#if contact.email}
										<p class="mt-2">
											<a
												href="mailto:{contact.email}"
												translate="no"
												class="type-record text-sm break-all text-dark-800 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-700 hover:decoration-primary-500 dark:text-light-200 dark:decoration-primary-700 dark:hover:text-primary-300"
											>
												{contact.email}
											</a>
										</p>
									{/if}
									{#if contact.notes}
										<p class="mt-4 max-w-[38ch] text-sm leading-relaxed text-dark-500 dark:text-light-500">
											{contact.notes}
										</p>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="reveal reveal-up reveal-d1 azulejo-cell flex flex-col justify-center p-7 sm:p-9 lg:px-10">
							<p class="type-label text-primary-700 dark:text-primary-300">{$_('footer.contact')}</p>
							<p class="mt-4">
								<a
									href="tel:+351913160232"
									translate="no"
									class="type-record text-base text-dark-800 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-700 hover:decoration-primary-500 dark:text-light-200 dark:decoration-primary-700 dark:hover:text-primary-300"
								>
									+351 913 160 232
								</a>
							</p>
							<p translate="no" class="type-record mt-2 text-sm text-dark-400 dark:text-light-600">Lousada, Portugal</p>
						</div>
					{/if}
				</div>
			</section>

			<!-- Back into the catalogue, the same act the homepage closes its hero with -->
			<div class="mt-10 flex justify-center sm:mt-12">
				<a
					href={resolve('/houses')}
					class="group inline-flex items-center gap-3 border border-primary-700 px-7 py-3 text-sm font-medium tracking-wide text-primary-700 transition-colors hover:bg-primary-700 hover:text-light-50 dark:border-primary-400 dark:text-primary-300 dark:hover:bg-primary-600 dark:hover:text-light-50"
				>
					{$_('homepage.hero.viewAll')}
					<span aria-hidden="true" class="transition-transform duration-300 group-hover:translate-x-1">→</span>
				</a>
			</div>
		</div>
	</div>

	<!-- ━━━ FLOATING CONTACT ━━━ always on screen, so a buyer is never more
	     than a tap from calling or writing regardless of scroll position. -->
	<div
		class="anim-fade-in-up fixed inset-x-0 bottom-0 z-40 lg:inset-x-auto lg:right-6 lg:bottom-6"
		style="animation-duration: 0.3s"
	>
		<!-- Mobile / tablet: full-width bar, thumb-reachable actions -->
		<div
			class="grid grid-cols-2 divide-x divide-light-50/15 border-t border-light-50/15 bg-dark-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
		>
			<a
				href={contactPhoneHref}
				class="flex items-center justify-center gap-2 py-4 text-sm font-medium text-light-50 transition-colors active:bg-light-50/10"
			>
				<FontAwesomeIcon icon={faPhone} class="h-4 w-4" />
				{$_('properties.detail.callCta')}
			</a>
			<a
				href={mailtoHref}
				class="flex items-center justify-center gap-2 py-4 text-sm font-medium text-light-50 transition-colors active:bg-light-50/10"
			>
				<FontAwesomeIcon icon={faEnvelope} class="h-4 w-4" />
				{$_('properties.detail.messageCta')}
			</a>
		</div>

		<!-- Desktop: floating pill. Both actions are always full targets;
			     only the descriptive label expands on hover/focus. -->
		<div
			class="group hidden items-stretch overflow-hidden rounded-full border border-light-50/15 bg-dark-950/95 shadow-2xl backdrop-blur-sm lg:flex"
		>
			<a
				href={contactPhoneHref}
				aria-label={$_('properties.detail.callCta')}
				class="flex h-14 w-14 shrink-0 items-center justify-center text-light-50 transition-colors hover:bg-light-50 hover:text-dark-950 focus-visible:ring-2 focus-visible:ring-secondary-300 focus-visible:outline-none"
			>
				<FontAwesomeIcon icon={faPhone} class="h-4 w-4" />
			</a>
			<a
				href={mailtoHref}
				aria-label={$_('properties.detail.messageCta')}
				class="flex h-14 w-14 shrink-0 items-center justify-center border-x border-light-50/15 text-light-50 transition-colors hover:bg-light-50 hover:text-dark-950 focus-visible:ring-2 focus-visible:ring-secondary-300 focus-visible:outline-none"
			>
				<FontAwesomeIcon icon={faEnvelope} class="h-4 w-4" />
			</a>
			<span
				class="flex max-w-0 shrink-0 flex-col justify-center overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,padding] duration-300 ease-out group-focus-within:max-w-xs group-focus-within:px-4 group-focus-within:opacity-100 group-hover:max-w-xs group-hover:px-4 group-hover:opacity-100"
			>
				<span class="type-label text-[0.65rem] text-light-300/75">{$_('properties.detail.floatingContact')}</span>
				<span translate="no" class="type-record text-sm text-light-50">{contactPhone}</span>
			</span>
		</div>
	</div>

	<!-- ━━━ LIGHTBOX ━━━ -->
	{#if lightboxOpen && imageIds.length > 0}
		<div
			bind:this={lightboxEl}
			class="anim-fade-in fixed inset-0 z-[100] flex items-center justify-center overscroll-contain bg-dark-950/95 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-label={property.title || $_('properties.untitled')}
			style="animation-duration: 0.2s"
		>
			<button
				bind:this={lightboxCloseBtn}
				type="button"
				onclick={closeLightbox}
				class="absolute top-4 right-4 z-10 border border-light-50/30 bg-dark-950/60 p-3 text-light-50 transition-colors hover:bg-light-50 hover:text-dark-950"
				aria-label={$_('common.close')}
			>
				<FontAwesomeIcon icon={faXmark} class="h-5 w-5" />
			</button>

			<p class="type-record absolute top-6 left-1/2 -translate-x-1/2 text-sm text-light-50/80">
				{lightboxIndex + 1} / {imageIds.length}
			</p>

			{#if imageIds.length > 1}
				<button
					type="button"
					onclick={prevImage}
					class="absolute top-1/2 left-4 z-10 -translate-y-1/2 border border-light-50/30 bg-dark-950/60 p-4 text-light-50 transition-colors hover:bg-light-50 hover:text-dark-950"
					aria-label={$_('properties.gallery.prevImage')}
				>
					<FontAwesomeIcon icon={faChevronLeft} class="h-5 w-5" />
				</button>
				<button
					type="button"
					onclick={nextImage}
					class="absolute top-1/2 right-4 z-10 -translate-y-1/2 border border-light-50/30 bg-dark-950/60 p-4 text-light-50 transition-colors hover:bg-light-50 hover:text-dark-950"
					aria-label={$_('properties.gallery.nextImage')}
				>
					<FontAwesomeIcon icon={faChevronRight} class="h-5 w-5" />
				</button>
			{/if}

			<img
				src="{serverUrl}/v1/api/images/{imageIds[lightboxIndex]}"
				alt={$_('properties.gallery.imageAlt', {
					values: { title: property.title ?? $_('properties.untitled'), index: lightboxIndex + 1 }
				})}
				class="anim-fade-in max-h-[85vh] max-w-[92vw] object-contain shadow-2xl"
				style="animation-duration: 0.15s"
			/>
		</div>
	{/if}
{/if}

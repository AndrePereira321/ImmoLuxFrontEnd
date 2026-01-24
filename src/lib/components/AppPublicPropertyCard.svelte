<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faBath,
		faBed,
		faBolt,
		faCar,
		faElevator,
		faMapMarkerAlt,
		faRulerCombined,
		faSwimmingPool,
		faTree,
		faWarehouse
	} from '@fortawesome/free-solid-svg-icons';
	import { _ } from 'svelte-i18n';
	import type { PropertyDTO } from '$lib/types/property';

	interface Props {
		property: PropertyDTO;
		imageIds?: number[];
	}

	let { property, imageIds = [] }: Props = $props();

	let currentImageIndex = $state(0);

	const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;

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

	const getEnergyRatingLabel = (rating?: string): string => {
		if (!rating) return null;
		return $_(`properties.energyRatings.${rating}`);
	};

	const hasFeatures = $derived(
		!!property.bedrooms ||
			!!property.bathrooms ||
			!!property.areaSqm ||
			!!property.parkingSpaces ||
			property.hasGarage ||
			property.hasGarden ||
			property.hasPool ||
			property.hasElevator
	);
</script>

<div
	class="group relative flex h-full flex-col overflow-hidden rounded-xl border border-light-300 bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-dark-600 dark:bg-dark-700"
>
	<!-- Image carousel or placeholder -->
	<div
		class="relative h-56 w-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-light-200 to-light-300 dark:from-dark-600 dark:to-dark-700"
	>
		{#if imageIds.length > 0}
			<img
				src="{serverUrl}/v1/api/images/{imageIds[currentImageIndex]}"
				alt={property.title || 'Property'}
				class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
				loading="lazy"
			/>

			{#if imageIds.length > 1}
				<button
					type="button"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						prevImage();
					}}
					class="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-dark-900 opacity-0 shadow-lg backdrop-blur-sm transition-all group-hover:opacity-100 hover:scale-110 hover:bg-white dark:bg-dark-800/90 dark:text-light-50 dark:hover:bg-dark-800"
					aria-label="Previous image"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
				</button>

				<button
					type="button"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						nextImage();
					}}
					class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-dark-900 opacity-0 shadow-lg backdrop-blur-sm transition-all group-hover:opacity-100 hover:scale-110 hover:bg-white dark:bg-dark-800/90 dark:text-light-50 dark:hover:bg-dark-800"
					aria-label="Next image"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</button>

				<div class="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
					{#each imageIds as imageId, index (imageId)}
						<button
							type="button"
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								goToImage(index);
							}}
							class="h-2 rounded-full transition-all duration-200 {index === currentImageIndex
								? 'w-6 bg-white shadow-md'
								: 'w-2 bg-white/60 hover:bg-white/90'}"
							aria-label="Go to image {index + 1}"
						></button>
					{/each}
				</div>

				<div
					class="absolute right-3 bottom-3 rounded-full bg-dark-900/75 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
				>
					{currentImageIndex + 1} / {imageIds.length}
				</div>
			{/if}
		{:else}
			<div class="flex h-full items-center justify-center">
				<FontAwesomeIcon icon={faRulerCombined} class="text-6xl text-dark-200 opacity-30 dark:text-light-400" />
			</div>
		{/if}

		<!-- Status badge -->
		{#if property.status}
			<div class="absolute top-3 left-3">
				<span
					class="rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm {getStatusColor(
						property.status
					)}"
				>
					{getStatusLabel(property.status)}
				</span>
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="flex flex-1 flex-col p-5">
		<!-- Title and badges row -->
		<div class="mb-3">
			<h3 class="mb-2 line-clamp-2 text-xl leading-tight font-bold text-dark-900 xl:text-2xl dark:text-light-50">
				{property.title ?? $_('properties.untitled')}
			</h3>
			<div class="flex flex-wrap items-center gap-2">
				<span
					class="inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300"
				>
					{getPropertyTypeLabel(property.propertyType)}
				</span>
				{#if property.energyRating}
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-800 dark:bg-success-900 dark:text-success-200"
					>
						<FontAwesomeIcon icon={faBolt} class="text-xs" />
						<span>{getEnergyRatingLabel(property.energyRating)}</span>
					</span>
				{/if}
			</div>
		</div>

		<!-- Price -->
		<p class="mb-3 text-3xl leading-none font-extrabold text-primary-600 xl:text-4xl dark:text-primary-400">
			{formatPrice(property.price)}
		</p>

		<!-- Location -->
		<div class="mb-3 flex items-start gap-2 text-sm text-dark-600 dark:text-light-400">
			<FontAwesomeIcon icon={faMapMarkerAlt} class="mt-0.5 flex-shrink-0 text-primary-500" />
			<span class="line-clamp-2 leading-relaxed">
				{#if property.address}
					{property.address}
					{#if property.municipality || property.district}
						<br />
						<span class="font-medium text-dark-700 dark:text-light-300">
							{property.municipality
								? `${property.municipality}${property.district ? ', ' : ''}`
								: ''}{property.district ?? ''}
						</span>
					{/if}
				{:else}
					<span class="font-medium text-dark-700 dark:text-light-300">
						{property.municipality
							? `${property.municipality}${property.district ? ', ' : ''}`
							: ''}{property.district ?? '—'}
					</span>
				{/if}
			</span>
		</div>

		<!-- Main Features Grid -->
		{#if hasFeatures}
			<div class="mb-4 flex flex-wrap gap-3">
				{#if property.bedrooms}
					<div class="flex items-center gap-2 rounded-lg bg-light-100 px-3 py-2 dark:bg-dark-600">
						<FontAwesomeIcon icon={faBed} class="text-primary-600 dark:text-primary-400" />
						<span class="text-sm font-semibold text-dark-800 dark:text-light-200">{property.bedrooms}</span>
					</div>
				{/if}
				{#if property.bathrooms}
					<div class="flex items-center gap-2 rounded-lg bg-light-100 px-3 py-2 dark:bg-dark-600">
						<FontAwesomeIcon icon={faBath} class="text-primary-600 dark:text-primary-400" />
						<span class="text-sm font-semibold text-dark-800 dark:text-light-200">{property.bathrooms}</span>
					</div>
				{/if}
				{#if property.areaSqm}
					<div class="flex items-center gap-2 rounded-lg bg-light-100 px-3 py-2 dark:bg-dark-600">
						<FontAwesomeIcon icon={faRulerCombined} class="text-primary-600 dark:text-primary-400" />
						<span class="text-sm font-semibold text-dark-800 dark:text-light-200">{property.areaSqm} m²</span>
					</div>
				{/if}
				{#if property.parkingSpaces}
					<div class="flex items-center gap-2 rounded-lg bg-light-100 px-3 py-2 dark:bg-dark-600">
						<FontAwesomeIcon icon={faCar} class="text-primary-600 dark:text-primary-400" />
						<span class="text-sm font-semibold text-dark-800 dark:text-light-200">{property.parkingSpaces}</span>
					</div>
				{/if}
				{#if property.hasGarage}
					<div class="flex items-center gap-2 rounded-lg bg-light-100 px-3 py-2 dark:bg-dark-600">
						<FontAwesomeIcon icon={faWarehouse} class="text-primary-600 dark:text-primary-400" />
					</div>
				{/if}
				{#if property.hasGarden}
					<div class="flex items-center gap-2 rounded-lg bg-light-100 px-3 py-2 dark:bg-dark-600">
						<FontAwesomeIcon icon={faTree} class="text-primary-600 dark:text-primary-400" />
					</div>
				{/if}
				{#if property.hasPool}
					<div class="flex items-center gap-2 rounded-lg bg-light-100 px-3 py-2 dark:bg-dark-600">
						<FontAwesomeIcon icon={faSwimmingPool} class="text-primary-600 dark:text-primary-400" />
					</div>
				{/if}
				{#if property.hasElevator}
					<div class="flex items-center gap-2 rounded-lg bg-light-100 px-3 py-2 dark:bg-dark-600">
						<FontAwesomeIcon icon={faElevator} class="text-primary-600 dark:text-primary-400" />
					</div>
				{/if}
			</div>
		{/if}

		<!-- Contact info -->
		{#if property.contact}
			<div
				class="mt-auto flex flex-col gap-1 rounded-lg border border-light-300 bg-light-50 p-3 text-sm dark:border-dark-600 dark:bg-dark-800"
			>
				{#if property.contact.name}
					<p class="font-semibold text-dark-900 dark:text-light-100">{property.contact.name}</p>
				{/if}
				{#if property.contact.phone}
					<p class="text-dark-600 dark:text-light-400">📞 {property.contact.phone}</p>
				{/if}
				{#if property.contact.email}
					<p class="text-dark-600 dark:text-light-400">✉️ {property.contact.email}</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

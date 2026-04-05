<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faBath,
		faBed,
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
		compact?: boolean;
	}

	let { property, imageIds = [], compact = false }: Props = $props();

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
				return 'bg-success-100/90 text-success-800 dark:bg-success-900/80 dark:text-success-200';
			case 'pending':
				return 'bg-warning-100/90 text-warning-800 dark:bg-warning-900/80 dark:text-warning-200';
			case 'sold':
				return 'bg-error-100/90 text-error-800 dark:bg-error-900/80 dark:text-error-200';
			case 'rented':
				return 'bg-info-100/90 text-info-800 dark:bg-info-900/80 dark:text-info-200';
			default:
				return 'bg-light-200/90 text-dark-800 dark:bg-dark-700/80 dark:text-light-200';
		}
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
	class="group relative flex h-full flex-col overflow-hidden rounded-xl border border-light-300/70 bg-white shadow-sm transition-all duration-300 hover:border-light-400 hover:shadow-lg dark:border-dark-700/50 dark:bg-dark-800 dark:hover:border-dark-600"
>
	<!-- Image carousel or placeholder -->
	<div
		class="relative h-56 w-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-light-200 to-light-300 dark:from-dark-700 dark:to-dark-800"
	>
		{#if imageIds.length > 0}
			<img
				src="{serverUrl}/v1/api/images/{imageIds[currentImageIndex]}"
				alt={property.title || 'Property'}
				class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
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
					class="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/85 p-2 text-dark-800 opacity-0 shadow-md backdrop-blur-sm transition-all group-hover:opacity-100 hover:scale-105 hover:bg-white dark:bg-dark-800/85 dark:text-light-100 dark:hover:bg-dark-700"
					aria-label="Previous image"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
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
					class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/85 p-2 text-dark-800 opacity-0 shadow-md backdrop-blur-sm transition-all group-hover:opacity-100 hover:scale-105 hover:bg-white dark:bg-dark-800/85 dark:text-light-100 dark:hover:bg-dark-700"
					aria-label="Next image"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
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
							class="h-1.5 rounded-full transition-all duration-200 {index === currentImageIndex
								? 'w-5 bg-white shadow-sm'
								: 'w-1.5 bg-white/50 hover:bg-white/80'}"
							aria-label="Go to image {index + 1}"
						></button>
					{/each}
				</div>

				<div
					class="absolute right-3 bottom-3 rounded-full bg-dark-900/60 px-2.5 py-1 text-[0.688rem] font-medium text-white backdrop-blur-sm"
				>
					{currentImageIndex + 1} / {imageIds.length}
				</div>
			{/if}
		{:else}
			<div class="flex h-full items-center justify-center">
				<FontAwesomeIcon icon={faRulerCombined} class="text-5xl text-dark-300/40 dark:text-light-600/30" />
			</div>
		{/if}

		<!-- Status badge -->
		{#if property.status}
			<div class="absolute top-3 left-3">
				<span
					class="rounded-full px-2.5 py-1 text-[0.688rem] font-semibold shadow-sm backdrop-blur-sm {getStatusColor(
						property.status
					)}"
				>
					{getStatusLabel(property.status)}
				</span>
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="flex flex-1 flex-col {compact ? 'p-4' : 'p-5'}">
		<!-- Title and badges row -->
		<div class={compact ? 'mb-2' : 'mb-3'}>
			<h3
				class="mb-1.5 line-clamp-2 {compact
					? 'text-base'
					: 'text-lg xl:text-xl'} leading-snug font-semibold text-dark-900 dark:text-light-50"
				style="font-family: 'Playfair Display', Georgia, serif"
			>
				{property.title ?? $_('properties.untitled')}
			</h3>
			<div class="flex flex-wrap items-center gap-1.5">
				<span
					class="inline-block rounded-md bg-primary-50 px-2 py-0.5 text-[0.688rem] font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
				>
					{getPropertyTypeLabel(property.propertyType)}
				</span>
			</div>
		</div>

		<!-- Price -->
		<p
			class="{compact
				? 'mb-2 text-xl'
				: 'mb-3 text-2xl xl:text-3xl'} leading-none font-bold text-primary-700 dark:text-primary-400"
			style="font-family: 'Plus Jakarta Sans', sans-serif"
		>
			{formatPrice(property.price)}
		</p>

		<!-- Location -->
		<div class="{compact ? 'mb-2' : 'mb-3'} flex items-start gap-2 text-sm text-dark-500 dark:text-light-500">
			<FontAwesomeIcon
				icon={faMapMarkerAlt}
				class="mt-0.5 flex-shrink-0 text-xs text-primary-400 dark:text-primary-500"
			/>
			<span class="line-clamp-1 leading-relaxed">
				<span class="text-dark-600 dark:text-light-400">
					{property.municipality ? `${property.municipality}${property.district ? ', ' : ''}` : ''}{property.district ??
						'—'}
				</span>
			</span>
		</div>

		<!-- Main Features Grid -->
		{#if hasFeatures}
			<div class="flex flex-wrap gap-1.5">
				{#if property.bedrooms}
					<div
						class="flex items-center gap-1.5 rounded-md bg-light-100 {compact
							? 'px-2 py-1'
							: 'px-2.5 py-1.5'} dark:bg-dark-700/60"
					>
						<FontAwesomeIcon icon={faBed} class="text-xs text-primary-500 dark:text-primary-400" />
						<span class="text-xs font-semibold text-dark-700 dark:text-light-300">{property.bedrooms}</span>
					</div>
				{/if}
				{#if property.bathrooms}
					<div
						class="flex items-center gap-1.5 rounded-md bg-light-100 {compact
							? 'px-2 py-1'
							: 'px-2.5 py-1.5'} dark:bg-dark-700/60"
					>
						<FontAwesomeIcon icon={faBath} class="text-xs text-primary-500 dark:text-primary-400" />
						<span class="text-xs font-semibold text-dark-700 dark:text-light-300">{property.bathrooms}</span>
					</div>
				{/if}
				{#if property.areaSqm}
					<div
						class="flex items-center gap-1.5 rounded-md bg-light-100 {compact
							? 'px-2 py-1'
							: 'px-2.5 py-1.5'} dark:bg-dark-700/60"
					>
						<FontAwesomeIcon icon={faRulerCombined} class="text-xs text-primary-500 dark:text-primary-400" />
						<span class="text-xs font-semibold text-dark-700 dark:text-light-300">{property.areaSqm} m&sup2;</span>
					</div>
				{/if}
				{#if !compact}
					{#if property.parkingSpaces}
						<div class="flex items-center gap-1.5 rounded-md bg-light-100 px-2.5 py-1.5 dark:bg-dark-700/60">
							<FontAwesomeIcon icon={faCar} class="text-xs text-primary-500 dark:text-primary-400" />
							<span class="text-xs font-semibold text-dark-700 dark:text-light-300">{property.parkingSpaces}</span>
						</div>
					{/if}
					{#if property.hasGarage}
						<div class="flex items-center gap-1.5 rounded-md bg-light-100 px-2.5 py-1.5 dark:bg-dark-700/60">
							<FontAwesomeIcon icon={faWarehouse} class="text-xs text-primary-500 dark:text-primary-400" />
						</div>
					{/if}
					{#if property.hasGarden}
						<div class="flex items-center gap-1.5 rounded-md bg-light-100 px-2.5 py-1.5 dark:bg-dark-700/60">
							<FontAwesomeIcon icon={faTree} class="text-xs text-success-600 dark:text-success-400" />
						</div>
					{/if}
					{#if property.hasPool}
						<div class="flex items-center gap-1.5 rounded-md bg-light-100 px-2.5 py-1.5 dark:bg-dark-700/60">
							<FontAwesomeIcon icon={faSwimmingPool} class="text-xs text-info-600 dark:text-info-400" />
						</div>
					{/if}
					{#if property.hasElevator}
						<div class="flex items-center gap-1.5 rounded-md bg-light-100 px-2.5 py-1.5 dark:bg-dark-700/60">
							<FontAwesomeIcon icon={faElevator} class="text-xs text-secondary-700 dark:text-secondary-400" />
						</div>
					{/if}
				{/if}
			</div>
		{/if}

		<!-- Contact info (hidden in compact mode) -->
		{#if !compact && property.contacts && property.contacts.length > 0}
			<div
				class="mt-auto flex flex-col gap-1 rounded-lg border border-light-300/80 bg-light-50 p-3 text-sm dark:border-dark-700/60 dark:bg-dark-850"
			>
				{#if property.contacts[0].name}
					<p class="font-semibold text-dark-900 dark:text-light-100">{property.contacts[0].name}</p>
				{/if}
				{#if property.contacts[0].phone}
					<p class="text-dark-500 dark:text-light-500">{property.contacts[0].phone}</p>
				{/if}
				{#if property.contacts[0].email}
					<p class="text-dark-500 dark:text-light-500">{property.contacts[0].email}</p>
				{/if}
				{#if property.contacts.length > 1}
					<p class="mt-1 text-xs text-primary-600 dark:text-primary-400">
						+{property.contacts.length - 1}
						{$_('properties.moreContacts')}
					</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

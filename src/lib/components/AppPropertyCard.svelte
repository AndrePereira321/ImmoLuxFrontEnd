<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faBath,
		faBed,
		faCar,
		faCheckCircle,
		faElevator,
		faEllipsisV,
		faEye,
		faEyeSlash,
		faMapMarkerAlt,
		faPencil,
		faRulerCombined,
		faSwimmingPool,
		faTrash,
		faTree,
		faWarehouse
	} from '@fortawesome/free-solid-svg-icons';
	import { _ } from 'svelte-i18n';
	import type { PropertyDTO } from '$lib/types/property';

	interface Props {
		property: PropertyDTO;
		imageIds?: number[]; // Array of all image IDs for the property
		onEdit?: (property: PropertyDTO) => void;
		onPublish?: (property: PropertyDTO) => void;
		onUnpublish?: (property: PropertyDTO) => void;
		onDelete?: (property: PropertyDTO) => void;
	}

	let { property, imageIds = [], onEdit, onPublish, onUnpublish, onDelete }: Props = $props();

	let currentImageIndex = $state(0);
	let showMenu = $state(false);

	// Get the backend server URL for images
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

	const handleEdit = () => {
		if (onEdit) {
			onEdit(property);
		}
		showMenu = false;
	};

	const handlePublish = () => {
		if (onPublish) {
			onPublish(property);
		}
		showMenu = false;
	};

	const handleUnpublish = () => {
		if (onUnpublish) {
			onUnpublish(property);
		}
		showMenu = false;
	};

	const handleDelete = () => {
		if (onDelete) {
			onDelete(property);
		}
		showMenu = false;
	};

	const toggleMenu = (e: Event) => {
		e.stopPropagation();
		showMenu = !showMenu;
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

	// Check if any features should be displayed
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
	role="button"
	tabindex="0"
	onclick={handleEdit}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleEdit();
		}
	}}
	class="group relative flex h-full flex-col overflow-hidden rounded-xl border border-light-300 bg-white shadow-sm transition-all duration-300 hover:cursor-pointer hover:shadow-xl dark:border-dark-600 dark:bg-dark-700"
>
	<!-- Image carousel or placeholder -->
	<div
		class="relative h-56 w-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-light-200 to-light-300 dark:from-dark-600 dark:to-dark-700"
	>
		{#if imageIds.length > 0}
			<!-- Current image with lazy loading -->
			<img
				src="{serverUrl}/v1/api/images/{imageIds[currentImageIndex]}"
				alt={property.title || 'Property'}
				class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
				loading="lazy"
			/>

			<!-- Navigation buttons - only visible on hover -->
			{#if imageIds.length > 1}
				<button
					type="button"
					onclick={(e) => {
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

				<!-- Image indicators -->
				<div class="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
					{#each imageIds as imageId, index (imageId)}
						<button
							type="button"
							onclick={(e) => {
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

				<!-- Image counter - moved to bottom right -->
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

		<!-- Three-dot menu - positioned in top right corner -->
		{#if onEdit || onPublish || onUnpublish || onDelete}
			<div class="absolute top-3 right-3">
				<button
					onclick={toggleMenu}
					class="rounded-full bg-white/90 p-2.5 text-dark-900 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-dark-800/90 dark:text-light-50 dark:hover:bg-dark-800"
					aria-label="Property actions"
				>
					<FontAwesomeIcon icon={faEllipsisV} class="h-4 w-4" />
				</button>

				{#if showMenu}
					<div
						role="menu"
						tabindex="-1"
						class="absolute top-12 right-0 z-10 w-48 rounded-lg border border-light-300 bg-white shadow-xl dark:border-dark-600 dark:bg-dark-800"
						onclick={(e) => e.stopPropagation()}
						onkeydown={(e) => {
							if (e.key === 'Escape') {
								showMenu = false;
							}
						}}
					>
						{#if onEdit}
							<button
								onclick={handleEdit}
								class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-dark-900 transition-colors hover:bg-light-100 dark:text-light-50 dark:hover:bg-dark-700"
							>
								<FontAwesomeIcon icon={faPencil} class="h-4 w-4 text-primary-600 dark:text-primary-400" />
								{$_('properties.edit')}
							</button>
						{/if}

						{#if !property.isPublished && onPublish}
							<button
								onclick={handlePublish}
								class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-dark-900 transition-colors hover:bg-light-100 dark:text-light-50 dark:hover:bg-dark-700"
							>
								<FontAwesomeIcon icon={faCheckCircle} class="h-4 w-4 text-success-600 dark:text-success-400" />
								{$_('properties.publish')}
							</button>
						{/if}

						{#if property.isPublished && onUnpublish}
							<button
								onclick={handleUnpublish}
								class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-dark-900 transition-colors hover:bg-light-100 dark:text-light-50 dark:hover:bg-dark-700"
							>
								<FontAwesomeIcon icon={faEyeSlash} class="h-4 w-4 text-warning-600 dark:text-warning-400" />
								{$_('properties.unpublish')}
							</button>
						{/if}

						{#if onDelete}
							<button
								onclick={handleDelete}
								class="flex w-full items-center gap-3 rounded-b-lg border-t border-light-200 px-4 py-3 text-left text-sm font-medium text-error-600 transition-colors hover:bg-error-50 dark:border-dark-600 dark:text-error-400 dark:hover:bg-error-900/20"
							>
								<FontAwesomeIcon icon={faTrash} class="h-4 w-4" />
								{$_('properties.delete')}
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="flex flex-1 flex-col p-5">
		<!-- Title with badges -->
		<div class="mb-3 flex items-start justify-between gap-2">
			<h3 class="line-clamp-2 flex-1 text-xl leading-tight font-bold text-dark-900 dark:text-light-50">
				{property.title || $_('properties.untitled')}
			</h3>
			<div class="flex flex-shrink-0 flex-col gap-1.5">
				{#if property.isPublished}
					<span
						class="rounded-full bg-success-600 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white dark:bg-success-700"
					>
						{$_('properties.published')}
					</span>
				{:else}
					<span
						class="rounded-full bg-warning-600 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white dark:bg-warning-700"
					>
						{$_('properties.draft')}
					</span>
				{/if}
			</div>
		</div>

		<!-- Property type badge -->
		<div class="mb-3">
			<span
				class="inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300"
			>
				{getPropertyTypeLabel(property.propertyType)}
			</span>
		</div>

		<!-- Price -->
		<div class="mb-4">
			<p class="text-3xl leading-none font-extrabold text-primary-600 dark:text-primary-400">
				{formatPrice(property.price)}
			</p>
		</div>

		<!-- Location -->
		<div class="mb-4 flex items-center gap-2.5 text-sm text-dark-600 dark:text-light-400">
			<FontAwesomeIcon icon={faMapMarkerAlt} class="flex-shrink-0 text-base text-primary-500" />
			<span class="line-clamp-2 leading-relaxed">
				{#if property.address}
					{property.address}<br />
					<span class="font-medium text-dark-700 dark:text-light-300">
						{property.municipality ? `${property.municipality}, ` : ''}{property.district || ''}
					</span>
				{:else}
					<span class="font-medium text-dark-700 dark:text-light-300">
						{property.municipality ? `${property.municipality}, ` : ''}{property.district || '—'}
					</span>
				{/if}
			</span>
		</div>

		<!-- Features -->
		{#if hasFeatures}
			<div class="mb-4 flex flex-wrap gap-4 rounded-lg bg-light-100 p-3 dark:bg-dark-600">
				{#if !!property.bedrooms}
					<div class="flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
							<FontAwesomeIcon icon={faBed} class="text-sm text-primary-600 dark:text-primary-400" />
						</div>
						<span class="text-sm font-semibold text-dark-800 dark:text-light-200">{property.bedrooms}</span>
					</div>
				{/if}
				{#if !!property.bathrooms}
					<div class="flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
							<FontAwesomeIcon icon={faBath} class="text-sm text-primary-600 dark:text-primary-400" />
						</div>
						<span class="text-sm font-semibold text-dark-800 dark:text-light-200">{property.bathrooms}</span>
					</div>
				{/if}
				{#if !!property.areaSqm}
					<div class="flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
							<FontAwesomeIcon icon={faRulerCombined} class="text-sm text-primary-600 dark:text-primary-400" />
						</div>
						<span class="text-sm font-semibold text-dark-800 dark:text-light-200">{property.areaSqm} m²</span>
					</div>
				{/if}
				{#if !!property.parkingSpaces}
					<div class="flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
							<FontAwesomeIcon icon={faCar} class="text-sm text-primary-600 dark:text-primary-400" />
						</div>
						<span class="text-sm font-semibold text-dark-800 dark:text-light-200">{property.parkingSpaces}</span>
					</div>
				{/if}
				{#if property.hasGarage}
					<div class="flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
							<FontAwesomeIcon icon={faWarehouse} class="text-sm text-primary-600 dark:text-primary-400" />
						</div>
					</div>
				{/if}
				{#if property.hasGarden}
					<div class="flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
							<FontAwesomeIcon icon={faTree} class="text-sm text-primary-600 dark:text-primary-400" />
						</div>
					</div>
				{/if}
				{#if property.hasPool}
					<div class="flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
							<FontAwesomeIcon icon={faSwimmingPool} class="text-sm text-primary-600 dark:text-primary-400" />
						</div>
					</div>
				{/if}
				{#if property.hasElevator}
					<div class="flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
							<FontAwesomeIcon icon={faElevator} class="text-sm text-primary-600 dark:text-primary-400" />
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- View count -->
		{#if property.viewCount !== undefined}
			<div
				class="mt-auto flex items-center gap-2 border-t border-light-200 pt-3 text-xs text-dark-500 dark:border-dark-600 dark:text-light-400"
			>
				<FontAwesomeIcon icon={faEye} />
				<span>{property.viewCount} {$_('properties.views')}</span>
			</div>
		{/if}
	</div>
</div>

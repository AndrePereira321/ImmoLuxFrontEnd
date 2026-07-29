<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { _ } from 'svelte-i18n';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
	import AppCollapsibleSection from '$lib/components/AppCollapsibleSection.svelte';
	import AppModal from '$lib/components/AppModal.svelte';
	import AppInput from '$lib/components/AppInput.svelte';
	import AppTextarea from '$lib/components/AppTextarea.svelte';
	import AppImageUpload from '$lib/components/AppImageUpload.svelte';
	import AppLoadingSpinner from '$lib/components/AppLoadingSpinner.svelte';
	import AppAutocomplete from '$lib/components/AppAutocomplete.svelte';
	import { propertySchema } from '$lib/schemas/propertySchema';
	import { apiClient } from '$lib/api/api-client';
	import { notificationStore } from '$lib/stores/notification';
	import { locationsStore } from '$lib/stores/locations';
	import { authStore } from '$lib/stores/auth';
	import type { ServerAPIResponse } from '$lib/types/api';
	import type { EnergyRating, PropertyDTO, PropertyImageDTO, PropertyStatus, PropertyType } from '$lib/types/property';
	import type { ContactDTO } from '$lib/types/contact';

	interface Props {
		propertyId?: string;
	}

	let { propertyId }: Props = $props();

	const isEditMode = $derived(!!propertyId);
	let property = $state<PropertyDTO | null>(null);
	let contacts = $state<ContactDTO[]>([]);
	let loadingProperty = $state(false);

	// Track existing images (from server) and new images (to upload) separately
	let existingImages = $state<PropertyImageDTO[]>([]);
	let newImages = $state<{ file: File; url: string; displayOrder: number }[]>([]);
	let deletedImageIds = $state<number[]>([]);

	const locations = $derived($locationsStore);

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			if (!state.isLoading && !state.isAuthenticated) {
				goto(resolve('/'));
			} else if (state.isAuthenticated) {
				locationsStore.loadLocations();
				loadContacts();
				if (isEditMode && propertyId) {
					loadProperty();
				}
			}
		});

		return unsubscribe;
	});

	const loadProperty = async () => {
		if (!propertyId) return;
		loadingProperty = true;
		try {
			const response = await apiClient.get<PropertyDTO>(`/properties/${propertyId}`);
			const serverResponse: ServerAPIResponse<PropertyDTO> = response.data;

			if (serverResponse.success && serverResponse.data) {
				property = serverResponse.data;
				resetFormWithPropertyData(serverResponse.data);
				await loadPropertyImages(Number(propertyId));
			} else {
				notificationStore.error('Failed to load property');
				goto(resolve('/panel/properties'));
			}
		} catch (error) {
			console.error('Error loading property:', error);
			notificationStore.error('Failed to load property');
			goto(resolve('/panel/properties'));
		} finally {
			loadingProperty = false;
		}
	};

	const loadPropertyImages = async (propId: number) => {
		try {
			const response = await apiClient.get<{ images: PropertyImageDTO[] }>(`/properties/${propId}/images`);
			const serverResponse: ServerAPIResponse<{ images: PropertyImageDTO[] }> = response.data;

			if (serverResponse.success && serverResponse.data) {
				// Data is wrapped in an object with an 'images' property
				existingImages = serverResponse.data.images ?? [];
			} else {
				existingImages = [];
			}
		} catch (error) {
			console.error('Error loading property images:', error);
			existingImages = [];
		}
	};

	const loadContacts = async () => {
		try {
			const response = await apiClient.get<{ contacts: ContactDTO[] }>('/contacts');
			const serverResponse: ServerAPIResponse<{ contacts: ContactDTO[] }> = response.data;

			if (serverResponse.success && serverResponse.data) {
				contacts = serverResponse.data.contacts || [];
			}
		} catch (error) {
			console.error('Error loading contacts:', error);
		}
	};

	const translateError = (error: string | undefined): string => {
		if (!error) return '';
		return $_(`${error}`);
	};

	let isSaving = $state(false);

	const { form, errors, enhance, submitting, allErrors } = superForm(
		{
			title: '',
			description: '',
			propertyType: 'house' as PropertyType,
			price: undefined as number | undefined,
			status: 'available' as PropertyStatus,
			address: '',
			district: '',
			municipality: '',
			parish: '',
			postalCode: '',
			country: 'PT',
			latitude: undefined as number | undefined,
			longitude: undefined as number | undefined,
			bedrooms: undefined as number | undefined,
			bathrooms: undefined as number | undefined,
			areaSqm: undefined as number | undefined,
			landAreaSqm: undefined as number | undefined,
			yearBuilt: undefined as number | undefined,
			floor: undefined as number | undefined,
			totalFloors: undefined as number | undefined,
			parkingSpaces: undefined as number | undefined,
			hasGarage: false,
			hasGarden: false,
			hasPool: false,
			hasElevator: false,
			energyRating: undefined as EnergyRating | undefined,
			virtualTourUrl: '',
			contactIds: [] as number[]
		},
		{
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			validators: zodClient(propertySchema as any),
			dataType: 'json',
			resetForm: false,
			SPA: true,
			invalidateAll: false,
			onSubmit: async ({ cancel }) => {
				cancel();
				isSaving = true;

				try {
					const payload = {
						title: $form.title.trim(),
						description: $form.description.trim(),
						propertyType: $form.propertyType,
						price: $form.price,
						status: $form.status,
						address: $form.address.trim(),
						district: $form.district.trim(),
						municipality: $form.municipality.trim(),
						parish: $form.parish?.trim() || undefined,
						postalCode: $form.postalCode?.trim() || undefined,
						country: $form.country,
						latitude: $form.latitude,
						longitude: $form.longitude,
						bedrooms: $form.bedrooms,
						bathrooms: $form.bathrooms,
						areaSqm: $form.areaSqm,
						landAreaSqm: $form.landAreaSqm,
						yearBuilt: $form.yearBuilt,
						floor: $form.floor,
						totalFloors: $form.totalFloors,
						parkingSpaces: $form.parkingSpaces,
						hasGarage: $form.hasGarage,
						hasGarden: $form.hasGarden,
						hasPool: $form.hasPool,
						hasElevator: $form.hasElevator,
						energyRating: $form.energyRating,
						virtualTourUrl: $form.virtualTourUrl?.trim() || undefined,
						contacts: $form.contactIds.map((id) => ({ id }))
					};

					if (isEditMode && propertyId) {
						// Update existing property
						const response = await apiClient.put<PropertyDTO>(`/properties/${propertyId}`, payload);
						const serverResponse: ServerAPIResponse<PropertyDTO> = response.data;

						if (serverResponse.success && serverResponse.data) {
							// Handle image changes
							await deleteRemovedImages();
							await updateImageOrders();
							if (newImages.length > 0) {
								await uploadNewImages(Number(propertyId));
							}

							notificationStore.success($_('properties.updateSuccess'));
							goto(resolve('/panel/properties'));
						} else {
							notificationStore.error(serverResponse.error?.message || $_('properties.updateError'));
						}
					} else {
						// Create new property
						const response = await apiClient.post<PropertyDTO>('/properties', payload);
						const serverResponse: ServerAPIResponse<PropertyDTO> = response.data;

						if (serverResponse.success && serverResponse.data) {
							const createdPropertyId = serverResponse.data.id;
							if (createdPropertyId && newImages.length > 0) {
								await uploadNewImages(createdPropertyId);
							}
							notificationStore.success($_('properties.createSuccess'));
							goto(resolve('/panel/properties'));
						} else {
							notificationStore.error(serverResponse.error?.message || $_('properties.createError'));
						}
					}
				} catch (error) {
					notificationStore.error(isEditMode ? $_('properties.updateError') : $_('properties.createError'));
					console.error('Property submission error:', error);
				} finally {
					isSaving = false;
				}
			}
		}
	);

	const resetFormWithPropertyData = (propertyData: PropertyDTO) => {
		$form.title = propertyData.title || '';
		$form.description = propertyData.description || '';
		$form.propertyType = (propertyData.propertyType || 'house') as PropertyType;
		$form.price = propertyData.price;
		$form.status = (propertyData.status || 'available') as PropertyStatus;
		$form.address = propertyData.address || '';
		$form.district = propertyData.district || '';
		$form.municipality = propertyData.municipality || '';
		$form.parish = propertyData.parish || '';
		$form.postalCode = propertyData.postalCode || '';
		$form.country = propertyData.country || 'PT';
		$form.latitude = propertyData.latitude;
		$form.longitude = propertyData.longitude;
		$form.bedrooms = propertyData.bedrooms;
		$form.bathrooms = propertyData.bathrooms;
		$form.areaSqm = propertyData.areaSqm;
		$form.landAreaSqm = propertyData.landAreaSqm;
		$form.yearBuilt = propertyData.yearBuilt;
		$form.floor = propertyData.floor;
		$form.totalFloors = propertyData.totalFloors;
		$form.parkingSpaces = propertyData.parkingSpaces;
		$form.hasGarage = propertyData.hasGarage || false;
		$form.hasGarden = propertyData.hasGarden || false;
		$form.hasPool = propertyData.hasPool || false;
		$form.hasElevator = propertyData.hasElevator || false;
		$form.energyRating = propertyData.energyRating;
		$form.virtualTourUrl = propertyData.virtualTourUrl || '';
		$form.contactIds = propertyData.contactIds || [];
	};

	// Combined images for display in AppImageUpload
	const displayImages = $derived.by(() => {
		const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;

		// Map existing images to display format
		const existing = existingImages.map((img) => ({
			file: null as unknown as File,
			url: `${serverUrl}/v1/api/images/${img.id}`,
			displayOrder: img.displayOrder || 0,
			id: img.id
		}));

		// Map new images
		const newImgs = newImages.map((img) => ({
			file: img.file,
			url: img.url,
			displayOrder: img.displayOrder,
			id: undefined
		}));

		// Combine and sort by display order
		return [...existing, ...newImgs].sort((a, b) => a.displayOrder - b.displayOrder);
	});

	const handleImagesChange = (changedImages: { file: File; url: string; displayOrder: number; id?: number }[]) => {
		const existingImagesUpdated: PropertyImageDTO[] = [];
		const newImagesUpdated: { file: File; url: string; displayOrder: number }[] = [];
		const currentExistingIds = new Set(changedImages.filter((img) => img.id).map((img) => img.id!));

		// Find deleted images
		const newDeletedIds = existingImages.filter((img) => !currentExistingIds.has(img.id!)).map((img) => img.id!);

		deletedImageIds = [...deletedImageIds, ...newDeletedIds];

		// Process changed images
		changedImages.forEach((img, index) => {
			if (img.id) {
				// Existing image - find original and update display order
				const original = existingImages.find((e) => e.id === img.id);
				if (original) {
					existingImagesUpdated.push({
						...original,
						displayOrder: index
					});
				}
			} else {
				// New image
				newImagesUpdated.push({
					file: img.file,
					url: img.url,
					displayOrder: index
				});
			}
		});

		existingImages = existingImagesUpdated;
		newImages = newImagesUpdated;
	};

	const uploadNewImages = async (propertyId: number) => {
		for (const img of newImages) {
			const formData = new FormData();
			formData.append('image', img.file);
			formData.append('displayOrder', img.displayOrder.toString());

			try {
				await apiClient.post(`/properties/${propertyId}/images`, formData, {
					headers: { 'Content-Type': 'multipart/form-data' }
				});
			} catch (error) {
				console.error('Error uploading image:', error);
				notificationStore.error($_('properties.imageUpload.uploadError'));
			}
		}
	};

	const deleteRemovedImages = async () => {
		for (const imageId of deletedImageIds) {
			try {
				await apiClient.delete(`/images/${imageId}`);
			} catch (error) {
				console.error('Error deleting image:', error);
				notificationStore.error($_('properties.imageUpload.deleteError'));
			}
		}
		deletedImageIds = [];
	};

	const updateImageOrders = async () => {
		for (const img of existingImages) {
			try {
				await apiClient.put(`/images/${img.id}/order`, {
					displayOrder: img.displayOrder
				});
			} catch (error) {
				console.error('Error updating image order:', error);
			}
		}
	};

	const handleCancel = () => {
		goto(resolve('/panel/properties'));
	};

	const handlePublish = async () => {
		if (!propertyId || !isEditMode) return;

		try {
			const response = await apiClient.post<PropertyDTO>(`/properties/${propertyId}/publish`);
			const serverResponse: ServerAPIResponse<PropertyDTO> = response.data;

			if (serverResponse.success) {
				notificationStore.success($_('properties.publishSuccess'));
				await loadProperty();
			} else {
				notificationStore.error(serverResponse.error?.message || $_('properties.updateError'));
			}
		} catch (error) {
			console.error('Error publishing property:', error);
			notificationStore.error($_('properties.updateError'));
		}
	};

	const handleUnpublish = async () => {
		if (!propertyId || !isEditMode) return;

		try {
			const response = await apiClient.post<PropertyDTO>(`/properties/${propertyId}/unpublish`);
			const serverResponse: ServerAPIResponse<PropertyDTO> = response.data;

			if (serverResponse.success) {
				notificationStore.success($_('properties.unpublishSuccess'));
				await loadProperty();
			} else {
				notificationStore.error(serverResponse.error?.message || $_('properties.updateError'));
			}
		} catch (error) {
			console.error('Error unpublishing property:', error);
			notificationStore.error($_('properties.updateError'));
		}
	};

	/** Deleting asks first — a modal in the page's own voice, not confirm(). */
	let deleteModalOpen = $state(false);
	let deleting = $state(false);

	const handleDelete = async () => {
		if (!propertyId || !isEditMode) return;
		deleting = true;

		try {
			const response = await apiClient.delete<null>(`/properties/${propertyId}`);
			const serverResponse: ServerAPIResponse<null> = response.data;

			if (serverResponse.success) {
				notificationStore.success($_('properties.deleteSuccess'));
				deleteModalOpen = false;
				goto(resolve('/panel/properties'));
			} else {
				notificationStore.error(serverResponse.error?.message || $_('properties.deleteError'));
			}
		} catch (error) {
			console.error('Error deleting property:', error);
			notificationStore.error($_('properties.deleteError'));
		} finally {
			deleting = false;
		}
	};

	// Property type options
	const propertyTypeOptions = $derived([
		{ value: 'house', label: $_('properties.types.house') },
		{ value: 'apartment', label: $_('properties.types.apartment') },
		{ value: 'villa', label: $_('properties.types.villa') },
		{ value: 'townhouse', label: $_('properties.types.townhouse') },
		{ value: 'land', label: $_('properties.types.land') },
		{ value: 'commercial', label: $_('properties.types.commercial') }
	]);

	// Status options
	const statusOptions = $derived([
		{ value: 'available', label: $_('properties.statuses.available') },
		{ value: 'pending', label: $_('properties.statuses.pending') },
		{ value: 'sold', label: $_('properties.statuses.sold') },
		{ value: 'rented', label: $_('properties.statuses.rented') }
	]);

	// District options
	const districtOptions = $derived(locations.districts.map((d) => ({ value: d, label: d })));

	// Municipality options (all municipalities)
	const municipalityOptions = $derived(
		!locations.municipalities || locations.municipalities.length === 0
			? []
			: locations.municipalities
					.map((m) => {
						// Handle both formats: "District,Municipality" or just "Municipality"
						const parts = m.split(',');
						const municipality = parts.length > 1 ? parts[1]?.trim() : m.trim();
						return { value: municipality || '', label: municipality || '' };
					})
					.filter((opt) => opt.value && opt.label)
	);

	// Parish options (all parishes with municipality context to avoid duplicates)
	const parishOptions = $derived(
		!locations.parishes || locations.parishes.length === 0
			? []
			: locations.parishes
					.map((p) => {
						// Handle both formats: "District,Municipality,Parish" or just "Parish"
						const parts = p.split(',');
						if (parts.length > 2) {
							// Format: "District,Municipality,Parish" - show "Parish (Municipality)"
							const municipality = parts[1]?.trim();
							const parish = parts[2]?.trim();
							return {
								value: parish || '',
								label: parish && municipality ? `${parish} (${municipality})` : parish || ''
							};
						} else {
							// Just parish name - use index to make unique
							const parish = p.trim();
							return { value: parish || '', label: parish || '' };
						}
					})
					.filter((opt) => opt.value && opt.label)
	);

	// Energy rating options
	const energyRatingOptions = $derived([
		{ value: 'Aplus', label: $_('properties.energyRatings.Aplus') },
		{ value: 'A', label: $_('properties.energyRatings.A') },
		{ value: 'B', label: $_('properties.energyRatings.B') },
		{ value: 'C', label: $_('properties.energyRatings.C') },
		{ value: 'D', label: $_('properties.energyRatings.D') },
		{ value: 'E', label: $_('properties.energyRatings.E') },
		{ value: 'F', label: $_('properties.energyRatings.F') },
		{ value: 'G', label: $_('properties.energyRatings.G') }
	]);

	// Contact options
	const contactOptions = $derived(
		contacts
			.filter((contact) => contact.id !== undefined && contact.id !== null)
			.map((contact) => {
				const parts = [];
				if (contact.name) parts.push(contact.name);
				if (contact.email) parts.push(contact.email);
				if (contact.phone) parts.push(contact.phone);
				return {
					value: contact.id!,
					label: parts.join(' • ')
				};
			})
	);

	const toggleContact = (contactId: number) => {
		if ($form.contactIds.includes(contactId)) {
			$form.contactIds = $form.contactIds.filter((id) => id !== contactId);
		} else {
			$form.contactIds = [...$form.contactIds, contactId];
		}
	};

	const isFormValid = $derived($allErrors.length === 0);
</script>

<div class="min-h-screen bg-light-200 dark:bg-dark-850">
	<div class="mx-auto w-full max-w-5xl px-5 pt-8 pb-16 sm:px-8 sm:pt-10">
		<!-- ── Masthead ──
		     The way back, then the entry named in the register's own voice. -->
		<a
			href={resolve('/panel/properties')}
			class="inline-flex items-center gap-2 text-sm font-medium text-dark-500 transition-colors hover:text-primary-700 dark:text-light-500 dark:hover:text-primary-300"
		>
			<FontAwesomeIcon icon={faArrowLeft} class="text-xs" />
			{$_('properties.backToProperties')}
		</a>

		<header class="mt-7 mb-8">
			<p class="type-label text-primary-700 dark:text-primary-300">{$_('properties.eyebrow')}</p>
			<h1 class="type-display mt-3 text-[clamp(1.75rem,3.2vw,2.6rem)] text-dark-900 dark:text-light-50">
				{isEditMode ? $_('properties.editProperty') : $_('properties.newProperty')}
			</h1>
			{#if isEditMode && property}
				<!-- Fired or unfired: the entry's standing, before any button for changing it. -->
				<div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
					{#if property.isPublished}
						<span class="type-label flex items-center gap-1.5 text-primary-700 dark:text-primary-300">
							<span aria-hidden="true" class="h-1.5 w-1.5 bg-primary-600 dark:bg-primary-400"></span>
							{$_('properties.published')}
						</span>
					{:else}
						<span class="type-label flex items-center gap-1.5 text-dark-400 dark:text-light-600">
							<span aria-hidden="true" class="h-1.5 w-1.5 border border-dark-400 dark:border-light-600"></span>
							{$_('properties.draft')}
						</span>
					{/if}
					{#if property.viewCount !== undefined}
						<span class="type-record text-xs text-dark-400 dark:text-light-600">
							{property.viewCount}
							{$_('properties.views')}
						</span>
					{/if}
				</div>
			{/if}
		</header>

		{#if loadingProperty}
			<div class="flex items-center justify-center py-20">
				<AppLoadingSpinner />
			</div>
		{:else}
			<form method="POST" use:enhance class="space-y-6">
				<!-- Images Section — the same tile as the sections below, minus the hinge:
			     the photographs are never worth folding away. -->
				<div class="azulejo-cell azulejo-rule border">
					<h2 class="type-label px-5 py-4 text-primary-700 sm:px-6 dark:text-primary-300">
						{$_('properties.sections.images')}
					</h2>
					<div class="azulejo-rule border-t p-5 sm:p-6">
						<AppImageUpload images={displayImages} onImagesChange={handleImagesChange} />
					</div>
				</div>

				<!-- Basic Information -->
				<AppCollapsibleSection title={$_('properties.sections.basicInfo')}>
					<div class="grid gap-6 md:grid-cols-2">
						<div class="md:col-span-2">
							<AppInput
								label={$_('properties.title')}
								bind:value={$form.title}
								error={translateError($errors.title?.[0])}
								required
							/>
						</div>

						<div class="md:col-span-2">
							<AppTextarea
								label={$_('properties.description')}
								bind:value={$form.description}
								error={translateError($errors.description?.[0])}
								rows={5}
								required
							/>
						</div>

						<div>
							<AppAutocomplete
								id="propertyType"
								label={$_('properties.propertyType')}
								bind:value={$form.propertyType}
								options={propertyTypeOptions}
								error={translateError($errors.propertyType?.[0])}
								required
							/>
						</div>

						<div>
							<AppAutocomplete
								id="status"
								label={$_('properties.status')}
								bind:value={$form.status}
								options={statusOptions}
								error={translateError($errors.status?.[0])}
								required
							/>
						</div>

						<div class="md:col-span-2">
							<AppInput
								label={$_('properties.price')}
								type="number"
								bind:value={$form.price}
								error={translateError($errors.price?.[0])}
								required
							/>
						</div>
					</div>
				</AppCollapsibleSection>

				<!-- Location -->
				<AppCollapsibleSection title={$_('properties.sections.location')}>
					<div class="grid gap-6 md:grid-cols-3">
						<div>
							<AppAutocomplete
								id="district"
								label={$_('properties.district')}
								bind:value={$form.district}
								options={districtOptions}
								placeholder={$_('properties.selectDistrict')}
								error={translateError($errors.district?.[0])}
								required
							/>
						</div>

						<div>
							<AppAutocomplete
								id="municipality"
								label={$_('properties.municipality')}
								bind:value={$form.municipality}
								options={municipalityOptions}
								placeholder={$_('properties.selectMunicipality')}
								error={translateError($errors.municipality?.[0])}
								required
							/>
						</div>

						<div>
							<AppAutocomplete
								id="parish"
								label={$_('properties.parish')}
								bind:value={$form.parish}
								options={parishOptions}
								placeholder={$_('properties.selectParish')}
							/>
						</div>

						<div class="md:col-span-2">
							<AppInput
								label={$_('properties.address')}
								bind:value={$form.address}
								error={translateError($errors.address?.[0])}
								required
							/>
						</div>

						<div>
							<AppInput
								label={$_('properties.postalCode')}
								bind:value={$form.postalCode}
								error={translateError($errors.postalCode?.[0])}
								placeholder="1234-567"
							/>
						</div>
					</div>
				</AppCollapsibleSection>

				<!-- Property Details -->
				<AppCollapsibleSection title={$_('properties.sections.propertyDetails')} defaultOpen={false}>
					<div class="grid gap-6 md:grid-cols-3">
						<div>
							<AppInput
								label={$_('properties.bedrooms')}
								type="number"
								bind:value={$form.bedrooms}
								error={translateError($errors.bedrooms?.[0])}
							/>
						</div>

						<div>
							<AppInput
								label={$_('properties.bathrooms')}
								type="number"
								bind:value={$form.bathrooms}
								error={translateError($errors.bathrooms?.[0])}
							/>
						</div>

						<div>
							<AppInput
								label={$_('properties.areaSqm')}
								type="number"
								bind:value={$form.areaSqm}
								error={translateError($errors.areaSqm?.[0])}
							/>
						</div>

						<div>
							<AppInput
								label={$_('properties.landAreaSqm')}
								type="number"
								bind:value={$form.landAreaSqm}
								error={translateError($errors.landAreaSqm?.[0])}
							/>
						</div>

						<div>
							<AppInput
								label={$_('properties.yearBuilt')}
								type="number"
								bind:value={$form.yearBuilt}
								error={translateError($errors.yearBuilt?.[0])}
							/>
						</div>

						<div>
							<AppInput
								label={$_('properties.floor')}
								type="number"
								bind:value={$form.floor}
								error={translateError($errors.floor?.[0])}
							/>
						</div>

						<div>
							<AppInput
								label={$_('properties.totalFloors')}
								type="number"
								bind:value={$form.totalFloors}
								error={translateError($errors.totalFloors?.[0])}
							/>
						</div>

						<div>
							<AppInput
								label={$_('properties.parkingSpaces')}
								type="number"
								bind:value={$form.parkingSpaces}
								error={translateError($errors.parkingSpaces?.[0])}
							/>
						</div>

						<div>
							<AppInput
								label={$_('properties.latitude')}
								type="number"
								bind:value={$form.latitude}
								error={translateError($errors.latitude?.[0])}
								step="0.000001"
							/>
						</div>

						<div>
							<AppInput
								label={$_('properties.longitude')}
								type="number"
								bind:value={$form.longitude}
								error={translateError($errors.longitude?.[0])}
								step="0.000001"
							/>
						</div>
					</div>
				</AppCollapsibleSection>

				<!-- Features & Amenities -->
				<AppCollapsibleSection title={$_('properties.sections.features')} defaultOpen={false}>
					<div class="space-y-6">
						<div class="grid gap-4 md:grid-cols-2">
							<label class="flex items-center gap-3">
								<input
									type="checkbox"
									bind:checked={$form.hasGarage}
									class="h-4 w-4 rounded-none border-light-900 bg-light-50 text-primary-600 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800"
								/>
								<span class="text-sm font-medium text-dark-700 dark:text-light-300">{$_('properties.hasGarage')}</span>
							</label>

							<label class="flex items-center gap-3">
								<input
									type="checkbox"
									bind:checked={$form.hasGarden}
									class="h-4 w-4 rounded-none border-light-900 bg-light-50 text-primary-600 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800"
								/>
								<span class="text-sm font-medium text-dark-700 dark:text-light-300">{$_('properties.hasGarden')}</span>
							</label>

							<label class="flex items-center gap-3">
								<input
									type="checkbox"
									bind:checked={$form.hasPool}
									class="h-4 w-4 rounded-none border-light-900 bg-light-50 text-primary-600 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800"
								/>
								<span class="text-sm font-medium text-dark-700 dark:text-light-300">{$_('properties.hasPool')}</span>
							</label>

							<label class="flex items-center gap-3">
								<input
									type="checkbox"
									bind:checked={$form.hasElevator}
									class="h-4 w-4 rounded-none border-light-900 bg-light-50 text-primary-600 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800"
								/>
								<span class="text-sm font-medium text-dark-700 dark:text-light-300">{$_('properties.hasElevator')}</span
								>
							</label>
						</div>

						<div class="grid gap-6 md:grid-cols-2">
							<div>
								<AppAutocomplete
									id="energyRating"
									label={$_('properties.energyRating')}
									bind:value={$form.energyRating}
									options={energyRatingOptions}
									placeholder={$_('properties.selectEnergyRating')}
								/>
							</div>

							<div>
								<AppInput
									label={$_('properties.virtualTourUrl')}
									bind:value={$form.virtualTourUrl}
									error={translateError($errors.virtualTourUrl?.[0])}
								/>
							</div>
						</div>
					</div>
				</AppCollapsibleSection>

				<!-- Contact Information -->
				<AppCollapsibleSection title={$_('properties.sections.contact')}>
					<div class="space-y-4">
						<p class="text-sm text-dark-600 dark:text-light-400">
							{$_('properties.selectMultipleContacts')}
							{#if $form.contactIds.length > 0}
								<span class="font-semibold text-primary-600 dark:text-primary-400">
									({$form.contactIds.length}
									{$_('properties.contactsSelected')})
								</span>
							{/if}
						</p>

						{#if contactOptions.length === 0}
							<p class="text-sm text-warning-600 dark:text-warning-400">
								{$_('properties.noContactsAvailable')}
							</p>
						{:else}
							<div class="grid gap-3 sm:grid-cols-2">
								{#each contactOptions as option (option.value)}
									<label
										class="flex cursor-pointer items-center gap-3 border p-4 transition-colors {$form.contactIds.includes(
											option.value
										)
											? 'border-primary-600 bg-primary-50 dark:border-primary-500 dark:bg-primary-950/40'
											: 'azulejo-rule bg-light-50 hover:border-primary-400 dark:bg-dark-800 dark:hover:border-primary-600'}"
									>
										<input
											type="checkbox"
											checked={$form.contactIds.includes(option.value)}
											onchange={() => toggleContact(option.value)}
											class="h-4 w-4 rounded-none border-light-900 bg-light-50 text-primary-600 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800"
										/>
										<span class="flex-1 text-sm font-medium text-dark-900 dark:text-light-50">
											{option.label}
										</span>
									</label>
								{/each}
							</div>
						{/if}

						{#if $errors.contactIds?.[0]}
							<p class="text-sm text-error-600 dark:text-error-400">
								{translateError(
									Array.isArray($errors.contactIds[0]) ? $errors.contactIds[0].join(', ') : $errors.contactIds[0]
								)}
							</p>
						{/if}
					</div>
				</AppCollapsibleSection>

				<!-- ── The acts ──
			     Kept at the page's foot behind the grout line, so Save never
			     scrolls out of reach on a long record. -->
				<div
					class="azulejo-rule sticky bottom-0 z-20 -mx-5 border-t bg-light-200/95 px-5 py-4 backdrop-blur-md sm:-mx-8 sm:px-8 dark:bg-dark-850/95"
				>
					<!-- A two-column grid on a phone — Save ends bottom-right, under the
					     thumb — and a ruled row with Delete apart from sm up. -->
					<div class="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
						<!-- Delete stands alone on the left, in its own colour and no other. -->
						{#if isEditMode}
							<button
								type="button"
								onclick={() => (deleteModalOpen = true)}
								class="border border-error-600 px-5 py-2.5 text-sm font-medium text-error-600 transition-colors hover:bg-error-600 hover:text-light-50 dark:border-error-500 dark:text-error-400 dark:hover:bg-error-600 dark:hover:text-light-50"
							>
								{$_('properties.delete')}
							</button>
						{:else}
							<div class="hidden sm:block"></div>
						{/if}

						<div class="contents sm:flex sm:flex-wrap sm:items-center sm:gap-3">
							{#if isEditMode}
								{#if property?.isPublished}
									<button
										type="button"
										onclick={handleUnpublish}
										class="border border-warning-700 px-5 py-2.5 text-sm font-medium text-warning-700 transition-colors hover:bg-warning-700 hover:text-light-50 dark:border-warning-500 dark:text-warning-400 dark:hover:bg-warning-600 dark:hover:text-light-50"
									>
										{$_('properties.unpublish')}
									</button>
								{:else}
									<button
										type="button"
										onclick={handlePublish}
										class="border border-success-700 px-5 py-2.5 text-sm font-medium text-success-700 transition-colors hover:bg-success-700 hover:text-light-50 dark:border-success-500 dark:text-success-400 dark:hover:bg-success-600 dark:hover:text-light-50"
									>
										{$_('properties.publish')}
									</button>
								{/if}
							{/if}

							<button
								type="button"
								onclick={handleCancel}
								class="azulejo-rule border bg-light-50 px-5 py-2.5 text-sm font-medium text-dark-600 transition-colors hover:border-primary-600 hover:text-primary-700 dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
							>
								{$_('common.cancel')}
							</button>

							<button
								type="submit"
								disabled={$submitting || !isFormValid}
								class="bg-primary-700 px-6 py-2.5 text-sm font-medium text-light-50 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-500"
							>
								{#if $submitting}
									{$_('common.saving')}
								{:else}
									{$_('common.save')}
								{/if}
							</button>
						</div>
					</div>
				</div>
			</form>
		{/if}
	</div>
</div>

<!-- Delete confirmation -->
<AppModal
	bind:open={deleteModalOpen}
	title={$_('properties.deleteTitle')}
	size="md"
	closeOnBackdrop={false}
	onClose={() => (deleteModalOpen = false)}
>
	<p class="text-sm leading-relaxed text-dark-600 dark:text-light-400">
		{$_('properties.deleteConfirm', { values: { title: property?.title || $_('properties.untitled') } })}
	</p>
	<div class="flex justify-end gap-3 pt-1">
		<button
			type="button"
			onclick={() => (deleteModalOpen = false)}
			disabled={deleting}
			class="azulejo-rule border bg-light-50 px-5 py-2.5 text-sm font-medium text-dark-600 transition-colors hover:border-primary-600 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
		>
			{$_('common.cancel')}
		</button>
		<button
			type="button"
			onclick={handleDelete}
			disabled={deleting}
			class="border border-error-600 px-5 py-2.5 text-sm font-medium text-error-600 transition-colors hover:bg-error-600 hover:text-light-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-error-500 dark:text-error-400 dark:hover:bg-error-600 dark:hover:text-light-50"
		>
			{$_('properties.delete')}
		</button>
	</div>
</AppModal>

{#if isSaving}
	<AppLoadingSpinner message={$_('common.saving')} overlay={true} />
{/if}

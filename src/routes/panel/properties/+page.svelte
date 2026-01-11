<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBuilding, faPlus, faUserTie } from '@fortawesome/free-solid-svg-icons';
	import { _ } from 'svelte-i18n';
	import AppModal from '$lib/components/AppModal.svelte';
	import AppContactCard from '$lib/components/AppContactCard.svelte';
	import AppPropertyCard from '$lib/components/AppPropertyCard.svelte';
	import { authStore } from '$lib/stores/auth';
	import { apiClient } from '$lib/api/api-client';
	import { notificationStore } from '$lib/stores/notification';
	import type { ContactDTO } from '$lib/types/contact';
	import type { PropertyDTO, PropertyImageDTO } from '$lib/types/property';
	import type { ServerAPIResponse } from '$lib/types/api';
	import { SvelteMap } from 'svelte/reactivity';

	let properties = $state<PropertyDTO[]>([]);
	// eslint-disable-next-line svelte/no-unnecessary-state-wrap
	let propertyImages = $state(new SvelteMap<number, number[]>()); // Map property ID to array of image IDs
	let loadingProperties = $state(true);
	let contacts = $state<ContactDTO[]>([]);
	let contactModalOpen = $state(false);
	let editingContact = $state<ContactDTO | undefined>(undefined);
	let modalTitle = $derived(editingContact ? $_('contacts.editContact') : $_('contacts.addContact'));
	let loadingContacts = $state(true);

	// Load properties from API
	const loadProperties = async () => {
		loadingProperties = true;
		try {
			const response = await apiClient.get<{ properties: PropertyDTO[]; total: number }>('/my-properties');
			const serverResponse: ServerAPIResponse<{ properties: PropertyDTO[]; total: number }> = response.data;

			if (serverResponse.success && serverResponse.data) {
				properties = serverResponse.data.properties || [];
				// Load images for each property
				await loadAllPropertyImages();
			} else {
				notificationStore.error(serverResponse.error?.message || 'Failed to load properties');
				properties = [];
			}
		} catch (error) {
			console.error('Error loading properties:', error);
			notificationStore.error('Failed to load properties');
			properties = [];
		} finally {
			loadingProperties = false;
		}
	};

	// Load images for all properties
	const loadAllPropertyImages = async () => {
		const imageMap = new SvelteMap<number, number[]>();

		// Load images for each property in parallel
		await Promise.all(
			properties.map(async (property) => {
				if (property.id) {
					try {
						const response = await apiClient.get<{ images: PropertyImageDTO[] }>(`/properties/${property.id}/images`);
						const serverResponse: ServerAPIResponse<{ images: PropertyImageDTO[] }> = response.data;

						if (
							serverResponse.success &&
							serverResponse.data &&
							serverResponse.data.images &&
							serverResponse.data.images.length > 0
						) {
							// Get all image IDs (sorted by displayOrder on backend)
							const imageIds = serverResponse.data.images
								.map((img) => img.id)
								.filter((id): id is number => id !== undefined);

							if (imageIds.length > 0) {
								imageMap.set(property.id, imageIds);
							}
						}
					} catch (error) {
						console.error(`Error loading images for property ${property.id}:`, error);
					}
				}
			})
		);

		propertyImages = imageMap;
	};

	// Load contacts from API
	const loadContacts = async () => {
		loadingContacts = true;
		try {
			const response = await apiClient.get<{ contacts: ContactDTO[] }>('/contacts');
			const serverResponse: ServerAPIResponse<{ contacts: ContactDTO[] }> = response.data;

			if (serverResponse.success && serverResponse.data) {
				// Backend returns {contacts: [...]} structure
				contacts = serverResponse.data.contacts || [];
			} else {
				notificationStore.error(serverResponse.error?.message || 'Failed to load contacts');
				contacts = [];
			}
		} catch (error) {
			console.error('Error loading contacts:', error);
			notificationStore.error('Failed to load contacts');
			contacts = [];
		} finally {
			loadingContacts = false;
		}
	};

	// Check authentication and load data
	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			if (!state.isLoading && !state.isAuthenticated) {
				goto(resolve('/'));
			} else if (state.isAuthenticated) {
				loadProperties();
				loadContacts();
			}
		});

		return unsubscribe;
	});

	const handleAddProperty = () => {
		goto(resolve('/panel/properties/new'));
	};

	const handleEditProperty = (property: PropertyDTO) => {
		goto(resolve(`/panel/properties/${property.id}`));
	};

	let AppContactForm: typeof import('$lib/components/AppContactForm.svelte').default | null = $state(null);

	const openContactModal = async (contact?: ContactDTO) => {
		if (!AppContactForm) {
			const module = await import('$lib/components/AppContactForm.svelte');
			AppContactForm = module.default;
		}
		editingContact = contact;
		contactModalOpen = true;
	};

	const closeContactModal = () => {
		contactModalOpen = false;
		editingContact = undefined;
	};

	const handleContactSuccess = () => {
		// Reload contacts from API to ensure data is fresh
		loadContacts();
		closeContactModal();
	};

	const handleEditContact = (contact: ContactDTO) => {
		openContactModal(contact);
	};

	const handlePublishProperty = async (property: PropertyDTO) => {
		if (!property.id) return;

		try {
			const response = await apiClient.post<PropertyDTO>(`/properties/${property.id}/publish`);
			const serverResponse: ServerAPIResponse<PropertyDTO> = response.data;

			if (serverResponse.success) {
				notificationStore.success($_('properties.publishSuccess'));
				await loadProperties();
			} else {
				notificationStore.error(serverResponse.error?.message || $_('properties.updateError'));
			}
		} catch (error) {
			console.error('Error publishing property:', error);
			notificationStore.error($_('properties.updateError'));
		}
	};

	const handleUnpublishProperty = async (property: PropertyDTO) => {
		if (!property.id) return;

		try {
			const response = await apiClient.post<PropertyDTO>(`/properties/${property.id}/unpublish`);
			const serverResponse: ServerAPIResponse<PropertyDTO> = response.data;

			if (serverResponse.success) {
				notificationStore.success($_('properties.unpublishSuccess'));
				await loadProperties();
			} else {
				notificationStore.error(serverResponse.error?.message || $_('properties.updateError'));
			}
		} catch (error) {
			console.error('Error unpublishing property:', error);
			notificationStore.error($_('properties.updateError'));
		}
	};

	const handleDeleteProperty = async (property: PropertyDTO) => {
		if (!property.id) return;

		// Show confirmation dialog
		if (!confirm($_('properties.deleteConfirm', { values: { title: property.title || $_('properties.untitled') } }))) {
			return;
		}

		try {
			const response = await apiClient.delete(`/properties/${property.id}`);
			const serverResponse: ServerAPIResponse = response.data;

			if (serverResponse.success) {
				notificationStore.success($_('properties.deleteSuccess'));
				await loadProperties();
			} else {
				notificationStore.error(serverResponse.error?.message || $_('properties.deleteError'));
			}
		} catch (error) {
			console.error('Error deleting property:', error);
			notificationStore.error($_('properties.deleteError'));
		}
	};
</script>

<div class="min-h-screen bg-light-300 py-6 sm:py-8 dark:bg-dark-800">
	<div class="container mx-auto px-4 sm:px-6">
		<!-- Page Header -->
		<div class="mb-6 sm:mb-8">
			<h1 class="mb-2 text-3xl font-semibold tracking-tight text-dark-900 sm:text-4xl dark:text-light-50">
				{$_('properties.myProperties')}
			</h1>
			<p class="text-sm text-dark-600 sm:text-base dark:text-light-400">
				{$_('properties.manageDescription')}
			</p>
		</div>

		<div class="grid gap-4 sm:gap-6 lg:grid-cols-3">
			<!-- Main Properties Section (Takes 2 columns on large screens) -->
			<div class="lg:col-span-2">
				<div
					class="flex h-full flex-col rounded-lg bg-light-50 p-4 shadow-md transition-shadow hover:shadow-lg sm:p-6 dark:bg-dark-700"
				>
					<!-- Section Header -->
					<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div class="flex items-center gap-3">
							<FontAwesomeIcon icon={faBuilding} class="text-2xl text-primary-600 dark:text-primary-500" />
							<h2 class="text-xl font-semibold text-dark-900 sm:text-2xl dark:text-light-50">
								{$_('properties.propertiesList')}
							</h2>
						</div>
						<button
							onclick={handleAddProperty}
							class="flex flex-shrink-0 items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-light-50 transition-colors hover:bg-primary-700 sm:text-base dark:bg-primary-700 dark:hover:bg-primary-800"
						>
							<FontAwesomeIcon icon={faPlus} class="text-sm" />
							<span class="whitespace-nowrap">{$_('properties.addProperty')}</span>
						</button>
					</div>

					<!-- Property Count -->
					{#if !loadingProperties && properties.length > 0}
						<div class="mb-4 rounded-md bg-light-100 px-3 py-2 dark:bg-dark-600">
							<p class="text-sm font-medium text-dark-700 dark:text-light-300">
								{$_('properties.propertyCount', { values: { count: properties.length } })}
							</p>
						</div>
					{/if}

					<!-- Properties List -->
					<div class="flex-1">
						{#if loadingProperties}
							<div class="flex h-full items-center justify-center py-12 text-center">
								<div>
									<p class="text-dark-600 dark:text-light-400">
										{$_('properties.loadingProperties')}
									</p>
								</div>
							</div>
						{:else if properties.length === 0}
							<div class="flex h-full items-center justify-center py-12 text-center">
								<div>
									<FontAwesomeIcon icon={faBuilding} class="mb-4 text-5xl text-dark-300 dark:text-light-300" />
									<p class="mb-2 text-lg text-dark-900 dark:text-light-50">
										{$_('properties.noProperties')}
									</p>
									<p class="text-sm text-dark-300 dark:text-light-300">
										{$_('properties.noPropertiesDescription')}
									</p>
								</div>
							</div>
						{:else}
							<div class="grid gap-4 sm:grid-cols-2">
								{#each properties as property (property.id)}
									<AppPropertyCard
										{property}
										imageIds={property.id ? propertyImages.get(property.id) : undefined}
										onEdit={handleEditProperty}
										onPublish={handlePublishProperty}
										onUnpublish={handleUnpublishProperty}
										onDelete={handleDeleteProperty}
									/>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Contact Persons Section (Takes 1 column) -->
			<div class="lg:col-span-1">
				<div
					class="flex h-full flex-col rounded-lg bg-light-50 p-4 shadow-md transition-shadow hover:shadow-lg sm:p-6 dark:bg-dark-700"
				>
					<!-- Section Header -->
					<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div class="flex items-center gap-3">
							<FontAwesomeIcon icon={faUserTie} class="text-2xl text-secondary-600 dark:text-secondary-500" />
							<h2 class="text-xl font-semibold text-dark-900 sm:text-2xl dark:text-light-50">
								{$_('properties.contactPersons')}
							</h2>
						</div>
						<button
							onclick={() => openContactModal()}
							class="flex flex-shrink-0 items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-light-50 transition-colors hover:bg-secondary-700 sm:text-base dark:bg-secondary-700 dark:hover:bg-secondary-800"
						>
							<FontAwesomeIcon icon={faPlus} class="text-sm" />
							<span class="whitespace-nowrap">{$_('properties.addContact')}</span>
						</button>
					</div>

					<!-- Contact Count -->
					{#if !loadingContacts && contacts.length > 0}
						<div class="mb-4 rounded-md bg-light-100 px-3 py-2 dark:bg-dark-600">
							<p class="text-sm font-medium text-dark-700 dark:text-light-300">
								{$_('properties.contactCount', { values: { count: contacts.length } })}
							</p>
						</div>
					{/if}

					<!-- Contacts List -->
					<div class="flex-1 overflow-y-auto">
						{#if loadingContacts}
							<div class="flex h-full items-center justify-center py-12 text-center">
								<div>
									<p class="text-dark-600 dark:text-light-400">
										{$_('properties.loadingContacts')}
									</p>
								</div>
							</div>
						{:else if contacts.length === 0}
							<div class="flex h-full items-center justify-center py-12 text-center">
								<div>
									<FontAwesomeIcon icon={faUserTie} class="mb-4 text-5xl text-dark-300 dark:text-light-300" />
									<p class="mb-2 text-lg text-dark-900 dark:text-light-50">
										{$_('properties.noContacts')}
									</p>
									<p class="text-sm text-dark-300 dark:text-light-300">
										{$_('properties.noContactsDescription')}
									</p>
								</div>
							</div>
						{:else}
							<div class="space-y-3">
								{#each contacts as contact (contact.id)}
									<AppContactCard {contact} onEdit={handleEditContact} />
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Contact Modal -->
<AppModal bind:open={contactModalOpen} title={modalTitle} size="md" closeOnBackdrop={false} onClose={closeContactModal}>
	{#if AppContactForm}
		<AppContactForm contact={editingContact} onSuccess={handleContactSuccess} onCancel={closeContactModal} />
	{/if}
</AppModal>

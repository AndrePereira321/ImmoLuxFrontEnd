<script lang="ts">
	/**
	 * The workshop side of the register.
	 *
	 * The public pages show the catalogue; this page is where its entries are
	 * kept. It is laid out as a ledger: every property is one tile in a grout
	 * panel, its acts on the tile's edge, and the strip under the title draws
	 * the whole collection at a glance — a filled square for each published
	 * entry, a hollow one for each draft.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPlus } from '@fortawesome/free-solid-svg-icons';
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

	const publishedCount = $derived(properties.filter((p) => p.isPublished).length);
	const draftCount = $derived(properties.length - publishedCount);

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

	/**
	 * Deleting asks first, in the page's own voice — a modal naming the entry,
	 * not the browser's confirm() box.
	 */
	let deleteTarget = $state<PropertyDTO | null>(null);
	let deleting = $state(false);
	let deleteModalOpen = $state(false);

	const askDeleteProperty = (property: PropertyDTO) => {
		deleteTarget = property;
		deleteModalOpen = true;
	};

	const closeDeleteModal = () => {
		deleteModalOpen = false;
		deleteTarget = null;
	};

	const confirmDeleteProperty = async () => {
		if (!deleteTarget?.id) return;
		deleting = true;

		try {
			const response = await apiClient.delete(`/properties/${deleteTarget.id}`);
			const serverResponse: ServerAPIResponse = response.data;

			if (serverResponse.success) {
				notificationStore.success($_('properties.deleteSuccess'));
				closeDeleteModal();
				await loadProperties();
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
</script>

<div class="min-h-screen bg-light-200 dark:bg-dark-850">
	<div class="mx-auto w-full max-w-[84rem] px-5 sm:px-8 lg:px-12">
		<!-- ── Masthead ──
		     The same lime-washed ground as the public pages: the workshop is the
		     other side of the same wall, not a different building. -->
		<header class="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 pt-10 sm:pt-12">
			<div class="min-w-0">
				<p class="type-label text-primary-700 dark:text-primary-300">{$_('properties.eyebrow')}</p>
				<h1 class="type-display mt-4 text-[clamp(1.9rem,4vw,3rem)] text-dark-900 dark:text-light-50">
					{$_('properties.myProperties')}
				</h1>
				<p class="mt-4 max-w-[54ch] leading-relaxed text-dark-500 dark:text-light-500">
					{$_('properties.manageDescription')}
				</p>
			</div>

			<!-- The one champagne plate on the page: the act the page exists for. -->
			<a
				href={resolve('/panel/properties/new')}
				class="flex shrink-0 items-center gap-2.5 bg-secondary-300 px-5 py-3.5 text-dark-950 transition-colors hover:bg-secondary-200"
			>
				<FontAwesomeIcon icon={faPlus} class="text-xs" />
				<span class="type-label">{$_('properties.addProperty')}</span>
			</a>
		</header>

		<!-- ── The register strip ──
		     The collection drawn in its own material: one small tile per entry,
		     fired cobalt when published, unglazed while still a draft. Each square
		     is a link down to its entry in the ledger. -->
		{#if !loadingProperties && properties.length > 0}
			<nav aria-label={$_('properties.registerStrip')} class="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
				<ul class="flex flex-wrap items-center gap-1.5">
					{#each properties as property (property.id)}
						<li class="flex">
							<a
								href="#entry-{property.id}"
								aria-label="{property.title || $_('properties.untitled')} — {property.isPublished
									? $_('properties.published')
									: $_('properties.draft')}"
								title={property.title || $_('properties.untitled')}
								class="block h-3.5 w-3.5 border transition-colors {property.isPublished
									? 'border-primary-600 bg-primary-600 hover:border-primary-400 hover:bg-primary-500 dark:border-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400'
									: 'azulejo-cell azulejo-rule hover:border-primary-600 dark:hover:border-primary-400'}"
							></a>
						</li>
					{/each}
				</ul>
				<p class="type-record text-xs text-dark-500 dark:text-light-500">
					{$_('properties.registerSummary', { values: { published: publishedCount, drafts: draftCount } })}
				</p>
			</nav>
		{/if}

		<!-- ── The ledger and the rail ── -->
		<div class="grid gap-10 pt-9 pb-16 sm:pb-20 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12">
			<!-- Properties -->
			<section>
				<div class="mb-3 flex items-baseline justify-between gap-4">
					<h2 class="type-label text-dark-400 dark:text-light-600">
						{$_('properties.propertiesList')}
						{#if !loadingProperties && properties.length > 0}
							<span aria-hidden="true" class="mx-1 opacity-45">·</span><span class="type-record"
								>{properties.length}</span
							>
						{/if}
					</h2>
				</div>

				{#if loadingProperties}
					<div class="azulejo-panel grid-cols-1" aria-hidden="true">
						{#each [0, 1, 2] as i (i)}
							<div
								class="azulejo-cell grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 p-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-x-5 sm:p-5"
							>
								<div class="aspect-square animate-pulse bg-light-500 dark:bg-dark-700"></div>
								<div class="py-1">
									<div class="h-3 w-1/3 animate-pulse bg-light-500 dark:bg-dark-700"></div>
									<div class="mt-3 h-5 w-2/3 animate-pulse bg-light-500 dark:bg-dark-700"></div>
									<div class="mt-3 h-4 w-1/4 animate-pulse bg-light-500 dark:bg-dark-700"></div>
								</div>
							</div>
						{/each}
					</div>
					<p class="sr-only" aria-live="polite">{$_('properties.loadingProperties')}</p>
				{:else if properties.length === 0}
					<!-- An empty register is an invitation, and it points at the plate above. -->
					<div class="border border-dashed border-light-900 dark:border-dark-700">
						<div class="px-8 py-14 text-center">
							<svg
								viewBox="0 0 96 96"
								class="mx-auto h-14 w-14 text-primary-300/60 dark:text-primary-800"
								fill="none"
								stroke="currentColor"
								stroke-width="1.3"
								stroke-linecap="round"
								aria-hidden="true"
							>
								<path d="M17 52 L48 25 L79 52" />
								<path d="M28 52 L48 34 L68 52" />
								<path d="M36 79 L36 67 A12 12 0 0 1 60 67 L60 79" />
								<path d="M26 79 L70 79" />
							</svg>
							<h3 class="mt-5 font-display text-xl text-dark-900 dark:text-light-50">
								{$_('properties.noProperties')}
							</h3>
							<p class="mt-2 text-sm leading-relaxed text-dark-500 dark:text-light-500">
								{$_('properties.noPropertiesDescription')}
							</p>
							<a
								href={resolve('/panel/properties/new')}
								class="mt-6 inline-flex items-center gap-2 border border-primary-700 px-5 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-700 hover:text-light-50 dark:border-primary-400 dark:text-primary-300 dark:hover:bg-primary-600 dark:hover:text-light-50"
							>
								<FontAwesomeIcon icon={faPlus} class="text-xs" />
								{$_('properties.addProperty')}
							</a>
						</div>
					</div>
				{:else}
					<div class="azulejo-panel grid-cols-1">
						{#each properties as property (property.id)}
							<AppPropertyCard
								{property}
								imageIds={property.id ? propertyImages.get(property.id) : undefined}
								onPublish={handlePublishProperty}
								onUnpublish={handleUnpublishProperty}
								onDelete={askDeleteProperty}
							/>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Contact persons -->
			<section>
				<div class="mb-3 flex items-baseline justify-between gap-4">
					<h2 class="type-label text-dark-400 dark:text-light-600">
						{$_('properties.contactPersons')}
						{#if !loadingContacts && contacts.length > 0}
							<span aria-hidden="true" class="mx-1 opacity-45">·</span><span class="type-record">{contacts.length}</span
							>
						{/if}
					</h2>
					<button
						type="button"
						onclick={() => openContactModal()}
						class="azulejo-rule flex shrink-0 items-center gap-2 border bg-light-50 px-3 py-1.5 text-xs font-medium text-dark-600 transition-colors hover:border-primary-600 hover:text-primary-700 dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
					>
						<FontAwesomeIcon icon={faPlus} class="text-[0.7rem]" />
						{$_('properties.addContact')}
					</button>
				</div>

				{#if loadingContacts}
					<div class="azulejo-panel grid-cols-1" aria-hidden="true">
						{#each [0, 1] as i (i)}
							<div class="azulejo-cell p-5">
								<div class="h-4 w-1/2 animate-pulse bg-light-500 dark:bg-dark-700"></div>
								<div class="mt-4 h-3 w-2/3 animate-pulse bg-light-500 dark:bg-dark-700"></div>
								<div class="mt-2 h-3 w-1/3 animate-pulse bg-light-500 dark:bg-dark-700"></div>
							</div>
						{/each}
					</div>
					<p class="sr-only" aria-live="polite">{$_('properties.loadingContacts')}</p>
				{:else if contacts.length === 0}
					<div class="border border-dashed border-light-900 dark:border-dark-700">
						<div class="px-6 py-10 text-center">
							<h3 class="font-display text-lg text-dark-900 dark:text-light-50">
								{$_('properties.noContacts')}
							</h3>
							<p class="mt-2 text-sm leading-relaxed text-dark-500 dark:text-light-500">
								{$_('properties.noContactsDescription')}
							</p>
							<button
								type="button"
								onclick={() => openContactModal()}
								class="mt-5 inline-flex items-center gap-2 border border-primary-700 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-700 hover:text-light-50 dark:border-primary-400 dark:text-primary-300 dark:hover:bg-primary-600 dark:hover:text-light-50"
							>
								<FontAwesomeIcon icon={faPlus} class="text-xs" />
								{$_('properties.addContact')}
							</button>
						</div>
					</div>
				{:else}
					<div class="azulejo-panel grid-cols-1">
						{#each contacts as contact (contact.id)}
							<AppContactCard {contact} onEdit={handleEditContact} />
						{/each}
					</div>
				{/if}
			</section>
		</div>
	</div>
</div>

<!-- Contact Modal -->
<AppModal bind:open={contactModalOpen} title={modalTitle} size="md" closeOnBackdrop={false} onClose={closeContactModal}>
	{#if AppContactForm}
		<AppContactForm contact={editingContact} onSuccess={handleContactSuccess} onCancel={closeContactModal} />
	{/if}
</AppModal>

<!-- Delete confirmation -->
<AppModal
	bind:open={deleteModalOpen}
	title={$_('properties.deleteTitle')}
	size="md"
	closeOnBackdrop={false}
	onClose={closeDeleteModal}
>
	<p class="text-sm leading-relaxed text-dark-600 dark:text-light-400">
		{$_('properties.deleteConfirm', {
			values: { title: deleteTarget?.title || $_('properties.untitled') }
		})}
	</p>
	<div class="flex justify-end gap-3 pt-1">
		<button
			type="button"
			onclick={closeDeleteModal}
			disabled={deleting}
			class="azulejo-rule border bg-light-50 px-5 py-2.5 text-sm font-medium text-dark-600 transition-colors hover:border-primary-600 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
		>
			{$_('common.cancel')}
		</button>
		<button
			type="button"
			onclick={confirmDeleteProperty}
			disabled={deleting}
			class="border border-error-600 px-5 py-2.5 text-sm font-medium text-error-600 transition-colors hover:bg-error-600 hover:text-light-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-error-500 dark:text-error-400 dark:hover:bg-error-600 dark:hover:text-light-50"
		>
			{$_('properties.delete')}
		</button>
	</div>
</AppModal>

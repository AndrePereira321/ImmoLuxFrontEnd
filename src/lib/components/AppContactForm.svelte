<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { untrack } from 'svelte';
	import AppInput from '$lib/components/AppInput.svelte';
	import AppTextarea from '$lib/components/AppTextarea.svelte';
	import { apiClient } from '$lib/api/api-client';
	import { notificationStore } from '$lib/stores/notification';
	import type { ContactDTO } from '$lib/types/contact';
	import type { ServerAPIResponse } from '$lib/types/api';
	import { contactSchema } from '$lib/schemas/contactSchema';

	interface Props {
		contact?: ContactDTO;
		onSuccess?: (contact: ContactDTO) => void;
		onCancel?: () => void;
	}

	let { contact, onSuccess, onCancel }: Props = $props();

	// Extract initial values (untracked to avoid reactivity warnings)
	const { contactId, isEditMode, initialName, initialEmail, initialPhone, initialNotes } = untrack(() => ({
		contactId: contact?.id,
		isEditMode: !!contact?.id,
		initialName: contact?.name || '',
		initialEmail: contact?.email || '',
		initialPhone: contact?.phone || '',
		initialNotes: contact?.notes || ''
	}));

	// Translate error messages from Zod validation keys
	const translateError = (error: string | undefined): string => {
		if (!error) return '';
		// Error messages from Zod schema are i18n keys
		return $_(`${error}`);
	};

	// Initialize superForm with Zod schema
	const { form, errors, enhance, allErrors, submitting } = superForm(
		{
			name: initialName,
			email: initialEmail,
			phone: initialPhone,
			notes: initialNotes
		},
		{
			// @ts-expect-error - zodClient type mismatch with sveltekit-superforms
			validators: zodClient(contactSchema),
			dataType: 'json',
			resetForm: false,
			SPA: true,
			invalidateAll: false,
			onSubmit: async ({ cancel }) => {
				cancel();

				try {
					const payload = {
						name: $form.name.trim(),
						email: $form.email.trim(),
						phone: $form.phone.trim(),
						notes: $form.notes?.trim() || undefined
					};

					const response = isEditMode
						? await apiClient.put<ContactDTO>(`/contacts/${contactId}`, payload)
						: await apiClient.post<ContactDTO>('/contacts', payload);

					const serverResponse: ServerAPIResponse<ContactDTO> = response.data;

					if (serverResponse.success) {
						notificationStore.success($_(isEditMode ? 'contacts.updateSuccess' : 'contacts.createSuccess'));
						if (onSuccess) {
							onSuccess(serverResponse.data);
						}
					} else {
						notificationStore.error(
							serverResponse.error?.message || $_(isEditMode ? 'contacts.updateError' : 'contacts.createError')
						);
					}
				} catch (error) {
					notificationStore.error($_(isEditMode ? 'contacts.updateError' : 'contacts.createError'));
					console.error('Contact operation error:', error);
				}
			}
		}
	);

	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		}
	};
</script>

<form method="POST" use:enhance class="space-y-4">
	<AppInput
		id="contact-name"
		type="text"
		label={$_('contacts.name')}
		bind:value={$form.name}
		required
		error={translateError($errors.name?.[0])}
		disabled={$submitting}
	/>

	<AppInput
		id="contact-email"
		type="email"
		label={$_('contacts.email')}
		bind:value={$form.email}
		required
		error={translateError($errors.email?.[0])}
		disabled={$submitting}
		autocomplete="email"
	/>

	<AppInput
		id="contact-phone"
		type="tel"
		label={$_('contacts.phone')}
		bind:value={$form.phone}
		required
		error={translateError($errors.phone?.[0])}
		disabled={$submitting}
		autocomplete="tel"
	/>

	<AppTextarea
		id="contact-notes"
		label={$_('contacts.notes')}
		bind:value={$form.notes}
		error={translateError($errors.notes?.[0])}
		disabled={$submitting}
		rows={3}
	/>

	<div class="flex gap-3 pt-2">
		<button
			type="button"
			onclick={handleCancel}
			disabled={$submitting}
			class="flex-1 rounded-lg border-2 border-light-600 bg-light-50 px-4 py-2 font-medium text-dark-900 transition-colors hover:bg-light-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-light-50 dark:hover:bg-dark-600"
		>
			{$_('contacts.cancel')}
		</button>
		<button
			type="submit"
			disabled={$submitting || $allErrors.length > 0}
			class="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-light-50 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-700 dark:hover:bg-primary-800"
		>
			{#if $submitting}
				{$_(isEditMode ? 'contacts.updating' : 'contacts.creating')}
			{:else}
				{$_(isEditMode ? 'contacts.update' : 'contacts.create')}
			{/if}
		</button>
	</div>
</form>

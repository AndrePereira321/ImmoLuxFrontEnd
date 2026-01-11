<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEnvelope, faPencil, faPhone } from '@fortawesome/free-solid-svg-icons';
	import type { ContactDTO } from '$lib/types/contact';

	interface Props {
		contact: ContactDTO;
		onEdit?: (contact: ContactDTO) => void;
	}

	let { contact, onEdit }: Props = $props();

	const handleEdit = () => {
		if (onEdit) {
			onEdit(contact);
		}
	};
</script>

<div
	class="group relative rounded-lg border-2 border-light-600 bg-light-50 p-4 transition-all hover:border-primary-500 hover:shadow-md dark:border-dark-600 dark:bg-dark-700 dark:hover:border-primary-500"
>
	<div class="flex items-start gap-3">
		<div class="flex-1 space-y-2">
			<div class="flex items-start justify-between gap-2">
				<h4 class="text-lg font-semibold text-dark-900 dark:text-light-50">
					{contact.name}
				</h4>
				{#if onEdit}
					<button
						onclick={handleEdit}
						class="flex-shrink-0 rounded-lg bg-primary-600 p-2 text-light-50 transition-all hover:scale-105 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800"
						aria-label={$_('contacts.edit')}
						title={$_('contacts.edit')}
					>
						<FontAwesomeIcon icon={faPencil} class="h-3.5 w-3.5" />
					</button>
				{/if}
			</div>

			<div class="space-y-1.5">
				<div class="flex items-center gap-2 text-sm text-dark-600 dark:text-light-400">
					<FontAwesomeIcon icon={faEnvelope} class="h-4 w-4 flex-shrink-0 text-primary-600 dark:text-primary-400" />
					<a
						href="mailto:{contact.email}"
						class="break-all hover:text-primary-600 hover:underline dark:hover:text-primary-400"
					>
						{contact.email}
					</a>
				</div>

				<div class="flex items-center gap-2 text-sm text-dark-600 dark:text-light-400">
					<FontAwesomeIcon icon={faPhone} class="h-4 w-4 flex-shrink-0 text-primary-600 dark:text-primary-400" />
					<a href="tel:{contact.phone}" class="hover:text-primary-600 hover:underline dark:hover:text-primary-400">
						{contact.phone}
					</a>
				</div>
			</div>

			{#if contact.notes}
				<p class="mt-3 text-sm text-dark-500 italic dark:text-light-500">
					"{contact.notes}"
				</p>
			{/if}
		</div>
	</div>
</div>

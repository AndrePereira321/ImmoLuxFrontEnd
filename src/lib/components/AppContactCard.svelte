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

<!-- One tile of the contacts panel: name, then the two records a caller needs,
     set in mono like every other figure on the site. -->
<div class="azulejo-cell p-5">
	<div class="flex items-start justify-between gap-3">
		<h3 class="min-w-0 font-medium break-words text-dark-900 dark:text-light-50">
			{contact.name}
		</h3>
		{#if onEdit}
			<button
				onclick={handleEdit}
				class="azulejo-rule flex shrink-0 items-center gap-1.5 border bg-light-50 px-2.5 py-1 text-xs font-medium text-dark-600 transition-colors hover:border-primary-600 hover:text-primary-700 dark:bg-dark-800 dark:text-light-300 dark:hover:border-primary-400 dark:hover:text-primary-300"
			>
				<FontAwesomeIcon icon={faPencil} class="text-[0.6rem] opacity-70" />
				{$_('contacts.edit')}
			</button>
		{/if}
	</div>

	<div class="mt-3 space-y-1.5">
		<div class="flex items-baseline gap-2.5 text-sm">
			<FontAwesomeIcon icon={faEnvelope} class="h-3 w-3 flex-shrink-0 text-dark-300 dark:text-light-700" />
			<a
				href="mailto:{contact.email}"
				class="type-record min-w-0 [overflow-wrap:anywhere] text-dark-600 underline decoration-transparent underline-offset-4 transition-colors hover:text-primary-700 hover:decoration-primary-400 dark:text-light-400 dark:hover:text-primary-300 dark:hover:decoration-primary-600"
			>
				{contact.email}
			</a>
		</div>

		<div class="flex items-baseline gap-2.5 text-sm">
			<FontAwesomeIcon icon={faPhone} class="h-3 w-3 flex-shrink-0 text-dark-300 dark:text-light-700" />
			<a
				href="tel:{contact.phone}"
				class="type-record text-dark-600 underline decoration-transparent underline-offset-4 transition-colors hover:text-primary-700 hover:decoration-primary-400 dark:text-light-400 dark:hover:text-primary-300 dark:hover:decoration-primary-600"
			>
				{contact.phone}
			</a>
		</div>
	</div>

	{#if contact.notes}
		<p class="azulejo-rule mt-4 border-t pt-3 text-sm leading-relaxed text-dark-500 italic dark:text-light-500">
			{contact.notes}
		</p>
	{/if}
</div>

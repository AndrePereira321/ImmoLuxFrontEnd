<script lang="ts">
	import { notificationStore } from '$lib/stores/notification';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faCheckCircle,
		faExclamationCircle,
		faExclamationTriangle,
		faInfoCircle,
		faTimes
	} from '@fortawesome/free-solid-svg-icons';
	import { fly } from 'svelte/transition';

	const notifications = $derived($notificationStore);

	const getIcon = (type: string) => {
		switch (type) {
			case 'success':
				return faCheckCircle;
			case 'error':
				return faExclamationCircle;
			case 'warning':
				return faExclamationTriangle;
			case 'info':
				return faInfoCircle;
			default:
				return faInfoCircle;
		}
	};

	const getStyles = (type: string) => {
		switch (type) {
			case 'success':
				return 'bg-white border-success-300 dark:bg-dark-800 dark:border-success-700';
			case 'error':
				return 'bg-white border-error-300 dark:bg-dark-800 dark:border-error-700';
			case 'warning':
				return 'bg-white border-warning-300 dark:bg-dark-800 dark:border-warning-700';
			case 'info':
				return 'bg-white border-info-300 dark:bg-dark-800 dark:border-info-700';
			default:
				return 'bg-white border-info-300 dark:bg-dark-800 dark:border-info-700';
		}
	};

	const getIconColor = (type: string) => {
		switch (type) {
			case 'success':
				return 'text-success-500 dark:text-success-400';
			case 'error':
				return 'text-error-500 dark:text-error-400';
			case 'warning':
				return 'text-warning-500 dark:text-warning-400';
			case 'info':
				return 'text-info-500 dark:text-info-400';
			default:
				return 'text-info-500 dark:text-info-400';
		}
	};

	const handleDismiss = (id: string) => {
		notificationStore.remove(id);
	};
</script>

<div
	class="fixed bottom-4 left-4 z-[60] w-96 max-w-[calc(100vw-2rem)] space-y-2.5"
	role="region"
	aria-label="Notifications"
>
	{#each notifications as notification (notification.id)}
		<div
			transition:fly={{ x: -200, duration: 250 }}
			class="flex items-center gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm {getStyles(notification.type)}"
			role="alert"
		>
			<FontAwesomeIcon
				icon={getIcon(notification.type)}
				class="flex-shrink-0 text-xl {getIconColor(notification.type)}"
			/>
			<p class="flex-1 text-sm font-medium text-dark-700 dark:text-light-200">{notification.message}</p>
			<button
				onclick={() => handleDismiss(notification.id)}
				class="flex-shrink-0 rounded-lg p-1 text-dark-300 transition-colors hover:text-dark-600 dark:text-light-600 dark:hover:text-light-300"
				aria-label="Close notification"
			>
				<FontAwesomeIcon icon={faTimes} class="text-sm" />
			</button>
		</div>
	{/each}
</div>

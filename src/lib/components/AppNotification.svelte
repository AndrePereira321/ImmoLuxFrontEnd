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
				return 'bg-success-50 text-success-800 border-success-300 dark:bg-success-950 dark:text-success-200 dark:border-success-800';
			case 'error':
				return 'bg-error-50 text-error-800 border-error-300 dark:bg-error-950 dark:text-error-200 dark:border-error-800';
			case 'warning':
				return 'bg-warning-50 text-warning-800 border-warning-300 dark:bg-warning-950 dark:text-warning-200 dark:border-warning-800';
			case 'info':
				return 'bg-info-50 text-info-800 border-info-300 dark:bg-info-950 dark:text-info-200 dark:border-info-800';
			default:
				return 'bg-info-50 text-info-800 border-info-300 dark:bg-info-950 dark:text-info-200 dark:border-info-800';
		}
	};

	const getIconColor = (type: string) => {
		switch (type) {
			case 'success':
				return 'text-success-600 dark:text-success-400';
			case 'error':
				return 'text-error-600 dark:text-error-400';
			case 'warning':
				return 'text-warning-600 dark:text-warning-400';
			case 'info':
				return 'text-info-600 dark:text-info-400';
			default:
				return 'text-info-600 dark:text-info-400';
		}
	};

	const handleDismiss = (id: string) => {
		notificationStore.remove(id);
	};
</script>

<div
	class="fixed bottom-4 left-4 z-[60] w-96 max-w-[calc(100vw-2rem)] space-y-3"
	role="region"
	aria-label="Notifications"
>
	{#each notifications as notification (notification.id)}
		<div
			transition:fly={{ x: -200, duration: 300 }}
			class="flex items-center gap-3 rounded-lg border-2 p-4 shadow-xl {getStyles(notification.type)}"
			role="alert"
		>
			<FontAwesomeIcon
				icon={getIcon(notification.type)}
				class="flex-shrink-0 text-2xl {getIconColor(notification.type)}"
			/>
			<p class="flex-1 text-sm font-medium">{notification.message}</p>
			<button
				onclick={() => handleDismiss(notification.id)}
				class="flex-shrink-0 rounded-lg p-1.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
				aria-label="Close notification"
			>
				<FontAwesomeIcon icon={faTimes} class="text-base" />
			</button>
		</div>
	{/each}
</div>

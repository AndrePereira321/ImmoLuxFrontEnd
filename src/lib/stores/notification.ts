import { writable } from 'svelte/store';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
	id: string;
	type: NotificationType;
	message: string;
	duration?: number;
}

const createNotificationStore = () => {
	const { subscribe, update } = writable<Notification[]>([]);

	const show = (type: NotificationType, message: string, duration: number = 5000) => {
		const id = Math.random().toString(36).substring(2, 9);
		const notification: Notification = { id, type, message, duration };

		update((notifications) => [...notifications, notification]);

		if (duration > 0) {
			setTimeout(() => {
				remove(id);
			}, duration);
		}
	};

	const remove = (id: string) => {
		update((notifications) => notifications.filter((n) => n.id !== id));
	};

	return {
		subscribe,
		success: (message: string, duration?: number) => show('success', message, duration),
		error: (message: string, duration?: number) => show('error', message, duration),
		warning: (message: string, duration?: number) => show('warning', message, duration),
		info: (message: string, duration?: number) => show('info', message, duration),
		remove
	};
};

export const notificationStore = createNotificationStore();

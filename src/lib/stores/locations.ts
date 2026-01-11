import { writable } from 'svelte/store';
import { apiClient } from '$lib/api/api-client';
import type { LocationsResponse } from '$lib/types/property';
import type { ServerAPIResponse } from '$lib/types/api';

interface LocationsState {
	districts: string[];
	municipalities: string[];
	parishes: string[];
	isLoading: boolean;
	isLoaded: boolean;
	error: string | null;
}

const createLocationsStore = () => {
	const { subscribe, set, update } = writable<LocationsState>({
		districts: [],
		municipalities: [],
		parishes: [],
		isLoading: false,
		isLoaded: false,
		error: null
	});

	return {
		subscribe,
		loadLocations: async () => {
			// Only load once
			let currentState: LocationsState | undefined;
			subscribe((state) => (currentState = state))();

			if (currentState?.isLoaded || currentState?.isLoading) {
				return;
			}

			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const response = await apiClient.get<LocationsResponse>('/locations');
				const serverResponse: ServerAPIResponse<LocationsResponse> = response.data;

				if (serverResponse.success && serverResponse.data) {
					const districts = serverResponse.data.districts || [];
					const municipalities = serverResponse.data.municipalities || [];
					const parishes = serverResponse.data.parishes || [];

					update((state) => ({
						...state,
						districts,
						municipalities,
						parishes,
						isLoading: false,
						isLoaded: true,
						error: null
					}));
				} else {
					update((state) => ({
						...state,
						isLoading: false,
						error: serverResponse.error?.message || 'Failed to load locations'
					}));
				}
			} catch (error) {
				console.error('Error loading locations:', error);
				update((state) => ({
					...state,
					isLoading: false,
					error: 'Failed to load locations'
				}));
			}
		},
		reset: () => {
			set({
				districts: [],
				municipalities: [],
				parishes: [],
				isLoading: false,
				isLoaded: false,
				error: null
			});
		}
	};
};

export const locationsStore = createLocationsStore();

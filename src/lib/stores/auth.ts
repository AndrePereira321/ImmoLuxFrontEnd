import { writable } from 'svelte/store';
import { apiClient } from '$lib/api/api-client';
import type { IsConnectedResponse, LoginRequest, LoginResponse, LogoutResponse, User } from '$lib/types/auth';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

const createAuthStore = () => {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true
	});

	const checkAuth = async (): Promise<void> => {
		try {
			const response = await apiClient.get<IsConnectedResponse>('/isconnected', {
				withCredentials: true
			});

			if (response.data.success && response.data.data.isConnected) {
				set({
					user: response.data.data.user || null,
					isAuthenticated: true,
					isLoading: false
				});
			} else {
				set({
					user: null,
					isAuthenticated: false,
					isLoading: false
				});
			}
		} catch (error) {
			console.error('Error checking authentication:', error);
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false
			});
		}
	};

	const login = async (
		email: string,
		password: string,
		rememberMe: boolean
	): Promise<{ success: boolean; error?: string }> => {
		try {
			const loginData: LoginRequest = { email, password, rememberMe };
			const response = await apiClient.post<LoginResponse>('/login', loginData, {
				withCredentials: true
			});

			if (response.data.success) {
				set({
					user: response.data.data.user,
					isAuthenticated: true,
					isLoading: false
				});
				return { success: true };
			} else {
				return {
					success: false,
					error: response.data.error?.message || 'Login failed'
				};
			}
		} catch (error) {
			console.error('Error during login:', error);
			return {
				success: false,
				error: 'An unexpected error occurred'
			};
		}
	};

	const logout = async (): Promise<{ success: boolean; error?: string }> => {
		try {
			const response = await apiClient.post<LogoutResponse>(
				'/logout',
				{},
				{
					withCredentials: true
				}
			);

			if (response.data.success || response.status === 401) {
				set({
					user: null,
					isAuthenticated: false,
					isLoading: false
				});
				return { success: true };
			} else {
				return {
					success: false,
					error: response.data.error?.message || 'Logout failed'
				};
			}
		} catch (error) {
			console.error('Error during logout:', error);
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false
			});
			return { success: true };
		}
	};

	return {
		subscribe,
		checkAuth,
		login,
		logout
	};
};

export const authStore = createAuthStore();

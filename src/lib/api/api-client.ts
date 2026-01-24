import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ServerAPIResponse } from '$lib/types/api';
import { browser } from '$app/environment';

export class ApiClient {
	private instance: AxiosInstance;

	constructor(baseURL: string, config?: AxiosRequestConfig) {
		this.instance = axios.create({
			baseURL,
			headers: {
				'Content-Type': 'application/json'
			},
			withCredentials: true,
			validateStatus: () => true,
			...config
		});
	}

	async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ServerAPIResponse<T>>> {
		return this.instance.get<ServerAPIResponse<T>>(this.buildUrl(url), config);
	}

	async post<T = unknown>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<ServerAPIResponse<T>>> {
		return this.instance.post<ServerAPIResponse<T>>(this.buildUrl(url), data, config);
	}

	async put<T = unknown>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<ServerAPIResponse<T>>> {
		return this.instance.put<ServerAPIResponse<T>>(this.buildUrl(url), data, config);
	}

	async patch<T = unknown>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<ServerAPIResponse<T>>> {
		return this.instance.patch<ServerAPIResponse<T>>(this.buildUrl(url), data, config);
	}

	async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ServerAPIResponse<T>>> {
		return this.instance.delete<ServerAPIResponse<T>>(this.buildUrl(url), config);
	}

	getAxiosInstance(): AxiosInstance {
		return this.instance;
	}

	private buildUrl(url: string): string {
		return `/v1/api${url.startsWith('/') ? url : '/' + url}`;
	}

	private handleServerResponse<T>(response: AxiosResponse<ServerAPIResponse<T>>): ServerAPIResponse<T> {
		return response.data;
	}
}

export const apiClient = new ApiClient(import.meta.env.VITE_SERVER_URL || (browser ? window.location.origin : ''));

export interface ServerAPIError {
	code?: string;
	message: string;
}

export interface ServerAPIResponse<T = unknown> {
	success: boolean;
	data: T;
	error: ServerAPIError | null;
}

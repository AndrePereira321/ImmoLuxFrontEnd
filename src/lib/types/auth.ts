export interface User {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	phone: string;
	role: string;
}

export interface LoginRequest {
	email: string;
	password: string;
	rememberMe: boolean;
}

export interface LoginResponse {
	user: User;
}

export interface IsConnectedResponse {
	isConnected: boolean;
	user?: User;
}

export interface LogoutResponse {
	success: boolean;
	message: string;
}

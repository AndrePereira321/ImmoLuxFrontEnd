export interface User {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	isActive?: boolean;
	isSuperUser?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface LoginRequest {
	email: string;
	password: string;
	rememberMe: boolean;
}

export interface LoginResponse {
	isConnected: boolean;
	userData: User;
}

export interface IsConnectedResponse {
	isConnected: boolean;
	userData?: User;
}

export interface LogoutResponse {
	success: boolean;
	message: string;
}

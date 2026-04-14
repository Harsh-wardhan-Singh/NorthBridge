import {
	createUser,
	findUserByEmail,
	getUserById,
	listPublicUsers,
	authenticateUser,
	type PublicUser,
} from '../../../mock-data/seed-data';

export type {PublicUser};

export type ServiceResult<T> = {
	ok: boolean;
	status: number;
	data: T | null;
	message?: string;
};

export type AuthPayload = {
	email?: string;
	password?: string;
	name?: string;
	location?: string;
	userId?: string;
};

export function listUsers(): ServiceResult<PublicUser[]> {
	return {
		ok: true,
		status: 200,
		data: listPublicUsers(),
	};
}

export function getCurrentUser(payload: AuthPayload): ServiceResult<PublicUser> {
	const userId = payload.userId?.trim();
	if (!userId) {
		return {
			ok: false,
			status: 401,
			data: null,
			message: 'User is not authenticated.',
		};
	}

	const user = getUserById(userId);
	if (!user) {
		return {
			ok: false,
			status: 404,
			data: null,
			message: 'User not found.',
		};
	}

	return {
		ok: true,
		status: 200,
		data: user,
	};
}

export function login(payload: AuthPayload): ServiceResult<{ user: PublicUser; token: string }> {
	const email = payload.email?.trim().toLowerCase() ?? '';
	const password = payload.password ?? '';

	if (!email || !password) {
		return {
			ok: false,
			status: 400,
			data: null,
			message: 'Email and password are required.',
		};
	}

	const user = authenticateUser(email, password);
	if (!user) {
		return {
			ok: false,
			status: 401,
			data: null,
			message: 'Invalid email or password.',
		};
	}

	return {
		ok: true,
		status: 200,
		data: {
			user,
			token: `mock-token-${user.id}`,
		},
	};
}

export function signup(payload: AuthPayload): ServiceResult<{ user: PublicUser; token: string }> {
	const name = payload.name?.trim() ?? '';
	const location = payload.location?.trim() ?? '';
	const email = payload.email?.trim().toLowerCase() ?? '';
	const password = payload.password ?? '';

	if (!name || !location || !email || !password) {
		return {
			ok: false,
			status: 400,
			data: null,
			message: 'Name, location, email, and password are required.',
		};
	}

	if (findUserByEmail(email)) {
		return {
			ok: false,
			status: 409,
			data: null,
			message: 'Email already exists.',
		};
	}

	const user = createUser({ name, location, email, password });
	return {
		ok: true,
		status: 201,
		data: {
			user,
			token: `mock-token-${user.id}`,
		},
	};
}

export function logout(): ServiceResult<{ message: string }> {
	return {
		ok: true,
		status: 204,
		data: null,
	};
}


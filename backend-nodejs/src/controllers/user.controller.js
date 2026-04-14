const seedData = require('../../mock-data/seed-data');

function normalizeString(value) {
	return typeof value === 'string' ? value.trim() : '';
}

function cloneUser(user) {
	if (!user) {
		return null;
	}

	return {
		id: user.id,
		name: user.name,
		rating: user.rating,
		location: user.location,
	};
}

function getUserStore() {
	return seedData.users;
}

function listPublicUsers() {
	return getUserStore().map((user) => cloneUser(user));
}

function findUserByEmail(email) {
	const normalizedEmail = normalizeString(email).toLowerCase();
	return getUserStore().find((user) => user.email === normalizedEmail);
}

function getUserById(userId) {
	const normalizedUserId = normalizeString(userId);
	const user = getUserStore().find((entry) => entry.id === normalizedUserId);
	return cloneUser(user);
}

function authenticateUser(email, password) {
	const user = findUserByEmail(email);
	if (!user || user.password !== password) {
		return null;
	}

	return cloneUser(user);
}

function nextUserId() {
	const currentCount = getUserStore().length + 1000;
	return `u_${String(currentCount + 1).padStart(4, '0')}`;
}

function createUser(input) {
	const user = {
		id: nextUserId(),
		name: normalizeString(input.name),
		rating: 0,
		location: normalizeString(input.location),
		email: normalizeString(input.email).toLowerCase(),
		password: input.password || '',
	};

	getUserStore().push(user);
	return cloneUser(user);
}

function listUsersController() {
	return {
		status: 200,
		body: {
			users: listPublicUsers(),
		},
	};
}

function getCurrentUserController(body = {}) {
	const userId = normalizeString(body.userId);
	if (!userId) {
		return {
			status: 401,
			body: {
				user: null,
				message: 'User is not authenticated.',
			},
		};
	}

	const user = getUserById(userId);
	if (!user) {
		return {
			status: 404,
			body: {
				user: null,
				message: 'User not found.',
			},
		};
	}

	return {
		status: 200,
		body: {
			user,
		},
	};
}

function loginController(body = {}) {
	const email = normalizeString(body.email).toLowerCase();
	const password = normalizeString(body.password);

	if (!email || !password) {
		return {
			status: 400,
			body: {
				user: null,
				message: 'Email and password are required.',
			},
		};
	}

	const user = authenticateUser(email, password);
	if (!user) {
		return {
			status: 401,
			body: {
				user: null,
				message: 'Invalid email or password.',
			},
		};
	}

	return {
		status: 200,
		body: {
			user,
			token: `mock-token-${user.id}`,
		},
	};
}

function signupController(body = {}) {
	const name = normalizeString(body.name);
	const location = normalizeString(body.location);
	const email = normalizeString(body.email).toLowerCase();
	const password = normalizeString(body.password);

	if (!name || !location || !email || !password) {
		return {
			status: 400,
			body: {
				user: null,
				message: 'Name, location, email, and password are required.',
			},
		};
	}

	if (findUserByEmail(email)) {
		return {
			status: 409,
			body: {
				user: null,
				message: 'Email already exists.',
			},
		};
	}

	const user = createUser({ name, location, email, password });
	return {
		status: 201,
		body: {
			user,
			token: `mock-token-${user.id}`,
		},
	};
}

function logoutController() {
	return {
		status: 204,
		body: {},
	};
}

module.exports = {
	listUsersController,
	getCurrentUserController,
	loginController,
	signupController,
	logoutController,
	listPublicUsers,
	findUserByEmail,
	getUserById,
	authenticateUser,
	createUser,
};

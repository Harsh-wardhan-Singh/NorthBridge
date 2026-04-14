const {
	listPublicUsers,
	findUserByEmail,
	getPublicUserById,
	authenticateUser,
	createUser,
} = require('../repositories/user.repository');
const {
	validateCurrentUserPayload,
	validateLoginPayload,
	validateSignupPayload,
} = require('../validators/auth.validator');
const {success, failure} = require('../utils/response.util');
const {buildMockToken} = require('../utils/token.util');

function listUsers() {
	return success(200, listPublicUsers());
}

function getCurrentUser(payload = {}) {
	const validation = validateCurrentUserPayload(payload);
	if (!validation.valid) {
		return failure(401, 'User is not authenticated.');
	}

	const user = getPublicUserById(validation.value.userId);
	if (!user) {
		return failure(404, 'User not found.');
	}

	return success(200, user);
}

function login(payload = {}) {
	const validation = validateLoginPayload(payload);
	if (!validation.valid) {
		return failure(400, 'Email and password are required.');
	}

	const user = authenticateUser(validation.value.email, validation.value.password);
	if (!user) {
		return failure(401, 'Invalid email or password.');
	}

	return success(200, {user, token: buildMockToken(user.id)});
}

function signup(payload = {}) {
	const validation = validateSignupPayload(payload);
	if (!validation.valid) {
		return failure(400, 'Name, location, email, and password are required.');
	}

	if (findUserByEmail(validation.value.email)) {
		return failure(409, 'Email already exists.');
	}

	const user = createUser(validation.value);
	return success(201, {user, token: buildMockToken(user.id)});
}

function logout() {
	return success(204, null);
}

module.exports = {
	listUsers,
	getCurrentUser,
	login,
	signup,
	logout,
};

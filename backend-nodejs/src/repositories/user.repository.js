const seedData = require('../../mock-data/seed-data');
const {toPublicUser, cloneAuthUser, normalizeString} = require('../models/user.model');

function getUsersStore() {
	return seedData.users;
}

function listPublicUsers() {
	return getUsersStore().map((user) => toPublicUser(user));
}

function listAuthUsers() {
	return getUsersStore().map((user) => cloneAuthUser(user));
}

function findUserByEmail(email) {
	const normalizedEmail = normalizeString(email).toLowerCase();
	const user = getUsersStore().find((entry) => entry.email === normalizedEmail);
	return cloneAuthUser(user);
}

function getAuthUserById(userId) {
	const normalizedUserId = normalizeString(userId);
	const user = getUsersStore().find((entry) => entry.id === normalizedUserId);
	return cloneAuthUser(user);
}

function getPublicUserById(userId) {
	const user = getAuthUserById(userId);
	return toPublicUser(user);
}

function authenticateUser(email, password) {
	const normalizedEmail = normalizeString(email).toLowerCase();
	const user = getUsersStore().find(
		(entry) => entry.email === normalizedEmail && entry.password === password,
	);
	return toPublicUser(user);
}

function nextUserId() {
	const next = getUsersStore().length + 1001;
	return `u_${String(next).padStart(4, '0')}`;
}

function createUser(input) {
	const user = {
		id: nextUserId(),
		name: normalizeString(input.name),
		rating: 0,
		location: normalizeString(input.location),
		email: normalizeString(input.email).toLowerCase(),
		password: typeof input.password === 'string' ? input.password : '',
	};

	getUsersStore().push(user);
	return toPublicUser(user);
}

module.exports = {
	getUsersStore,
	listPublicUsers,
	listAuthUsers,
	findUserByEmail,
	getAuthUserById,
	getPublicUserById,
	authenticateUser,
	nextUserId,
	createUser,
};

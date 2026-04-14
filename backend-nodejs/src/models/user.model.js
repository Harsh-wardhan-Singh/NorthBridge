function normalizeString(value) {
	return typeof value === 'string' ? value.trim() : '';
}

function toPublicUser(user) {
	if (!user || typeof user !== 'object') {
		return null;
	}

	return {
		id: normalizeString(user.id),
		name: normalizeString(user.name),
		rating: typeof user.rating === 'number' ? user.rating : 0,
		location: normalizeString(user.location),
	};
}

function cloneAuthUser(user) {
	if (!user || typeof user !== 'object') {
		return null;
	}

	return {
		id: normalizeString(user.id),
		name: normalizeString(user.name),
		rating: typeof user.rating === 'number' ? user.rating : 0,
		location: normalizeString(user.location),
		email: normalizeString(user.email).toLowerCase(),
		password: typeof user.password === 'string' ? user.password : '',
	};
}

function isValidPublicUser(user) {
	return Boolean(
		user &&
			typeof user.id === 'string' &&
			typeof user.name === 'string' &&
			typeof user.rating === 'number' &&
			typeof user.location === 'string',
	);
}

module.exports = {
	normalizeString,
	toPublicUser,
	cloneAuthUser,
	isValidPublicUser,
};

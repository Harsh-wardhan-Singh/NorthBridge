function normalizeString(value) {
	return typeof value === 'string' ? value.trim() : '';
}

function createValidationResult(valid, value, errors) {
	return {
		valid,
		value,
		errors,
	};
}

function validateLoginPayload(payload = {}) {
	const email = normalizeString(payload.email).toLowerCase();
	const password = typeof payload.password === 'string' ? payload.password : '';
	const errors = [];

	if (!email) {
		errors.push({field: 'email', message: 'Email is required.'});
	}

	if (!password) {
		errors.push({field: 'password', message: 'Password is required.'});
	}

	return createValidationResult(errors.length === 0, {email, password}, errors);
}

function validateSignupPayload(payload = {}) {
	const name = normalizeString(payload.name);
	const location = normalizeString(payload.location);
	const email = normalizeString(payload.email).toLowerCase();
	const password = typeof payload.password === 'string' ? payload.password : '';
	const errors = [];

	if (!name) {
		errors.push({field: 'name', message: 'Name is required.'});
	}

	if (!location) {
		errors.push({field: 'location', message: 'Location is required.'});
	}

	if (!email) {
		errors.push({field: 'email', message: 'Email is required.'});
	}

	if (!password) {
		errors.push({field: 'password', message: 'Password is required.'});
	}

	return createValidationResult(errors.length === 0, {name, location, email, password}, errors);
}

function validateCurrentUserPayload(payload = {}) {
	const userId = normalizeString(payload.userId);
	const errors = [];

	if (!userId) {
		errors.push({field: 'userId', message: 'User ID is required.'});
	}

	return createValidationResult(errors.length === 0, {userId}, errors);
}

module.exports = {
	normalizeString,
	createValidationResult,
	validateLoginPayload,
	validateSignupPayload,
	validateCurrentUserPayload,
};

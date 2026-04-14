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

function validateCreateTaskPayload(payload = {}) {
	const value = {
		title: normalizeString(payload.title),
		description: normalizeString(payload.description),
		location: normalizeString(payload.location),
		price: payload.price,
		scheduledAt: normalizeString(payload.scheduledAt),
		postedByUserId: normalizeString(payload.postedByUserId) || 'u_1001',
		postedByName: normalizeString(payload.postedByName) || 'Aarav Sharma',
	};

	const errors = [];
	if (!value.title) {
		errors.push({field: 'title', message: 'Title is required.'});
	}
	if (!value.description) {
		errors.push({field: 'description', message: 'Description is required.'});
	}
	if (!value.location) {
		errors.push({field: 'location', message: 'Location is required.'});
	}
	if (typeof value.price !== 'number') {
		errors.push({field: 'price', message: 'Price must be a number.'});
	}
	if (!value.scheduledAt) {
		errors.push({field: 'scheduledAt', message: 'scheduledAt is required.'});
	}

	return createValidationResult(errors.length === 0, value, errors);
}

function validateAcceptTaskPayload(payload = {}) {
	const value = {
		acceptedByUserId: normalizeString(payload.acceptedByUserId) || 'u_1002',
	};

	return createValidationResult(true, value, []);
}

module.exports = {
	normalizeString,
	createValidationResult,
	validateCreateTaskPayload,
	validateAcceptTaskPayload,
};

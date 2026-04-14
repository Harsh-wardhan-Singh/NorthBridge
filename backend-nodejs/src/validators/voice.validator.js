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

function validateVoiceTaskPayload(payload = {}) {
	const transcript = normalizeString(payload.transcript);
	const errors = [];

	if (!transcript) {
		errors.push({field: 'transcript', message: 'Transcript is required.'});
	}

	return createValidationResult(errors.length === 0, {transcript}, errors);
}

module.exports = {
	normalizeString,
	createValidationResult,
	validateVoiceTaskPayload,
};

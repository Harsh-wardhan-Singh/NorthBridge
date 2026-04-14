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

function validateChatId(chatId) {
	const value = normalizeString(chatId);
	const errors = [];
	if (!value) {
		errors.push({field: 'chatId', message: 'chatId is required.'});
	}

	return createValidationResult(errors.length === 0, value, errors);
}

function validateSendMessagePayload(payload = {}) {
	const value = {
		chatId: normalizeString(payload.chatId),
		taskId: normalizeString(payload.taskId),
		senderId: normalizeString(payload.senderId) || 'u_1002',
		text: normalizeString(payload.text),
	};

	const errors = [];
	if (!value.chatId) {
		errors.push({field: 'chatId', message: 'chatId is required.'});
	}
	if (!value.taskId) {
		errors.push({field: 'taskId', message: 'taskId is required.'});
	}
	if (!value.text) {
		errors.push({field: 'text', message: 'text is required.'});
	}

	return createValidationResult(errors.length === 0, value, errors);
}

module.exports = {
	normalizeString,
	createValidationResult,
	validateChatId,
	validateSendMessagePayload,
};

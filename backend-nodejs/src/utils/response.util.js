function serviceResult(ok, status, data, message) {
	const result = {
		ok: Boolean(ok),
		status: Number.isFinite(status) ? status : 500,
		data: typeof data === 'undefined' ? null : data,
	};

	if (typeof message === 'string' && message.trim()) {
		result.message = message;
	}

	return result;
}

function success(status, data, message) {
	return serviceResult(true, status, data, message);
}

function failure(status, message, data = null) {
	return serviceResult(false, status, data, message);
}

function toControllerResult(result, bodyMapper) {
	const mappedBody = typeof bodyMapper === 'function' ? bodyMapper(result) : result.data;
	return {
		status: result.status,
		body: mappedBody,
	};
}

module.exports = {
	serviceResult,
	success,
	failure,
	toControllerResult,
};

function createHttpError(status, message, details) {
	const error = new Error(message);
	error.status = status;
	if (details !== undefined) {
		error.details = details;
	}
	return error;
}

function isHttpError(error) {
	return Boolean(error && typeof error === 'object' && typeof error.status === 'number');
}

function getErrorStatus(error) {
	if (isHttpError(error)) {
		return error.status;
	}

	return 500;
}

function getErrorMessage(error) {
	if (error && typeof error.message === 'string' && error.message.trim()) {
		return error.message;
	}

	return 'Internal server error.';
}

function errorMiddleware(error, req, res, next) {
	const status = getErrorStatus(error);
	const message = getErrorMessage(error);
	const payload = {
		message,
	};

	if (error && typeof error.details !== 'undefined') {
		payload.details = error.details;
	}

	if (res && typeof res.status === 'function' && typeof res.json === 'function') {
		return res.status(status).json(payload);
	}

	if (typeof next === 'function') {
		next(error);
	}

	return {
		status,
		body: payload,
	};
}

function asyncHandler(handler) {
	return function wrappedHandler(req, res, next) {
		try {
			const result = handler(req, res, next);
			if (result && typeof result.then === 'function') {
				return result.catch(next);
			}
			return result;
		} catch (error) {
			if (typeof next === 'function') {
				next(error);
				return undefined;
			}
			throw error;
		}
	};
}

module.exports = {
	createHttpError,
	isHttpError,
	getErrorStatus,
	getErrorMessage,
	errorMiddleware,
	asyncHandler,
};

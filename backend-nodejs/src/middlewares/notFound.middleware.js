function notFoundMiddleware(req, res, next) {
	const payload = {
		message: 'Route not found.',
	};

	if (res && typeof res.status === 'function' && typeof res.json === 'function') {
		return res.status(404).json(payload);
	}

	if (typeof next === 'function') {
		next();
	}

	return {
		status: 404,
		body: payload,
	};
}

module.exports = {
	notFoundMiddleware,
};

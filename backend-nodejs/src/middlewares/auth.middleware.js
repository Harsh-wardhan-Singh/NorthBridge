const MOCK_BEARER_PREFIX = 'bearer mock-token-';

function normalizeHeaders(headers) {
	if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
		return {};
	}

	const result = {};
	for (const [key, value] of Object.entries(headers)) {
		if (typeof value === 'string') {
			result[key.toLowerCase()] = value;
		}
	}

	return result;
}

function extractUserId(headers) {
	const normalized = normalizeHeaders(headers);
	const explicitUserId = normalized['x-user-id']?.trim();
	if (explicitUserId) {
		return explicitUserId;
	}

	const authorization = normalized.authorization?.trim();
	if (!authorization) {
		return undefined;
	}

	if (authorization.toLowerCase().startsWith(MOCK_BEARER_PREFIX)) {
		return authorization.slice(MOCK_BEARER_PREFIX.length).trim();
	}

	return undefined;
}

function getAuthContext(input = {}) {
	const headers = input.headers || input;
	const userId = extractUserId(headers);

	return {
		userId,
		isAuthenticated: Boolean(userId),
	};
}

function requireUser(input = {}) {
	const authContext = getAuthContext(input);
	if (!authContext.userId) {
		return {
			ok: false,
			status: 401,
			body: {
				message: 'User is not authenticated.',
			},
		};
	}

	return {
		ok: true,
		status: 200,
		body: {
			userId: authContext.userId,
		},
	};
}

function authMiddleware(req, res, next) {
	const authContext = getAuthContext(req?.headers || {});
	req.auth = authContext;
	if (typeof next === 'function') {
		next();
	}
	return authContext;
}

module.exports = {
	MOCK_BEARER_PREFIX,
	normalizeHeaders,
	extractUserId,
	getAuthContext,
	requireUser,
	authMiddleware,
};

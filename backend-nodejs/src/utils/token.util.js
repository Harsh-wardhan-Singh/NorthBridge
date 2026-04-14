const MOCK_TOKEN_PREFIX = 'mock-token-';
const BEARER_PREFIX = 'bearer ';

function buildMockToken(userId) {
	if (typeof userId !== 'string' || !userId.trim()) {
		return '';
	}

	return `${MOCK_TOKEN_PREFIX}${userId.trim()}`;
}

function normalizeAuthorizationHeader(value) {
	return typeof value === 'string' ? value.trim() : '';
}

function parseMockToken(value) {
	const normalized = normalizeAuthorizationHeader(value);
	if (!normalized) {
		return undefined;
	}

	const lowered = normalized.toLowerCase();
	if (!lowered.startsWith(BEARER_PREFIX)) {
		return undefined;
	}

	const bearerValue = normalized.slice(BEARER_PREFIX.length).trim();
	if (!bearerValue.toLowerCase().startsWith(MOCK_TOKEN_PREFIX)) {
		return undefined;
	}

	const userId = bearerValue.slice(MOCK_TOKEN_PREFIX.length).trim();
	return userId || undefined;
}

function extractUserIdFromHeaders(headers) {
	if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
		return undefined;
	}

	const explicit = typeof headers['x-user-id'] === 'string' ? headers['x-user-id'].trim() : '';
	if (explicit) {
		return explicit;
	}

	const authHeader =
		typeof headers.authorization === 'string'
			? headers.authorization
			: typeof headers.Authorization === 'string'
				? headers.Authorization
				: '';

	return parseMockToken(authHeader);
}

module.exports = {
	MOCK_TOKEN_PREFIX,
	BEARER_PREFIX,
	buildMockToken,
	normalizeAuthorizationHeader,
	parseMockToken,
	extractUserIdFromHeaders,
};

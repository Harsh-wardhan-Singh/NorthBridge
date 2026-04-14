import {taskRoutes, type RouteDefinition as TaskRouteDefinition} from './routes/task.routes';
import {userRoutes, type RouteDefinition as UserRouteDefinition} from './routes/user.routes';

type ApiRouteDefinition = TaskRouteDefinition | UserRouteDefinition;

export type ApiMethod = 'GET' | 'POST';

export type ApiRequest = {
	method: ApiMethod;
	path: string;
	body?: Record<string, unknown>;
	headers?: Record<string, string>;
};

export type ApiResponse = {
	status: number;
	body: unknown;
};

type RouteMatch = {
	matched: boolean;
	params: Record<string, string>;
};

const routes: ApiRouteDefinition[] = [...userRoutes, ...taskRoutes];

function normalizeBody(body: unknown): Record<string, unknown> {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return {};
	}

	return body as Record<string, unknown>;
}

function normalizeHeaders(headers: unknown): Record<string, string> {
	if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
		return {};
	}

	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
		if (typeof value === 'string') {
			result[key.toLowerCase()] = value;
		}
	}

	return result;
}

function extractUserId(headers: Record<string, string>): string | undefined {
	const explicitUserId = headers['x-user-id']?.trim();
	if (explicitUserId) {
		return explicitUserId;
	}

	const authorization = headers['authorization']?.trim();
	if (!authorization) {
		return undefined;
	}

	const bearerPrefix = 'bearer mock-token-';
	if (authorization.toLowerCase().startsWith(bearerPrefix)) {
		return authorization.slice(bearerPrefix.length).trim();
	}

	return undefined;
}

function parseQuery(path: string): Record<string, string> {
	const queryIndex = path.indexOf('?');
	if (queryIndex < 0) {
		return {};
	}

	const queryString = path.slice(queryIndex + 1).trim();
	if (!queryString) {
		return {};
	}

	const query = new URLSearchParams(queryString);
	const result: Record<string, string> = {};

	for (const [key, value] of query.entries()) {
		result[key] = value;
	}

	return result;
}

function splitPath(path: string): string[] {
	return path
		.split('?')[0]
		.split('/')
		.filter((segment) => segment.length > 0);
}

function matchRoutePath(routePath: string, requestPath: string): RouteMatch {
	const routeSegments = splitPath(routePath);
	const requestSegments = splitPath(requestPath);

	if (routeSegments.length !== requestSegments.length) {
		return { matched: false, params: {} };
	}

	const params: Record<string, string> = {};

	for (let index = 0; index < routeSegments.length; index += 1) {
		const routeSegment = routeSegments[index];
		const requestSegment = requestSegments[index];

		if (routeSegment.startsWith(':')) {
			params[routeSegment.slice(1)] = decodeURIComponent(requestSegment);
			continue;
		}

		if (routeSegment !== requestSegment) {
			return { matched: false, params: {} };
		}
	}

	return { matched: true, params };
}

function resolveRoute(method: ApiMethod, path: string): {
	route: ApiRouteDefinition | null;
	params: Record<string, string>;
} {
	for (const route of routes) {
		if (route.method !== method) {
			continue;
		}

		const match = matchRoutePath(route.path, path);
		if (match.matched) {
			return { route, params: match.params };
		}
	}

	return { route: null, params: {} };
}

function hasPathForAnyMethod(path: string): boolean {
	for (const route of routes) {
		const match = matchRoutePath(route.path, path);
		if (match.matched) {
			return true;
		}
	}

	return false;
}

export function handleApiRequest(request: ApiRequest): ApiResponse {
	const method = request.method.toUpperCase() as ApiMethod;
	const normalizedBody = normalizeBody(request.body);
	const normalizedHeaders = normalizeHeaders(request.headers);
	const query = parseQuery(request.path);
	const userIdFromHeaders = extractUserId(normalizedHeaders);
	const mergedPayload = {
		...query,
		...normalizedBody,
		...(userIdFromHeaders ? { userId: userIdFromHeaders } : {}),
	};

	if (method !== 'GET' && method !== 'POST') {
		return {
			status: 405,
			body: {
				message: `Method ${request.method} is not allowed.`,
			},
		};
	}

	const { route, params } = resolveRoute(request.method, request.path);
	if (!route) {
		if (hasPathForAnyMethod(request.path)) {
			return {
				status: 405,
				body: {
					message: `Method ${request.method} is not allowed for ${request.path}`,
				},
			};
		}

		return {
			status: 404,
			body: {
				message: `No route for ${request.method} ${request.path}`,
			},
		};
	}

	const result = route.execute(params, mergedPayload);
	if (
		result &&
		typeof result === 'object' &&
		'status' in result &&
		'body' in result
	) {
		const typed = result as {status: number; body: unknown};
		return {
			status: typed.status,
			body: typed.body,
		};
	}

	return {
		status: 500,
		body: {
			message: 'Route returned an invalid response shape.',
		},
	};
}

export function listAvailableRoutes(): Array<{method: ApiMethod; path: string}> {
	return routes.map((route) => ({
		method: route.method,
		path: route.path,
	}));
}


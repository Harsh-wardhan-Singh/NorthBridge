const {resolveLocationPoint} = require('../utils/location-resolver.util');
const {calculateRoundedDistanceKm} = require('../utils/geo.utils');

function toPointPayload(resolved) {
	if (!resolved) {
		return null;
	}

	return {
		lat: resolved.lat,
		lng: resolved.lng,
		matchType: resolved.matchType,
		resolvedName: resolved.resolvedName,
		sourceText: resolved.sourceText,
	};
}

const locationRoutes = [
	{
		method: 'GET',
		path: '/v1/locations/resolve',
		execute: (_params, body) => {
			const location = typeof body.location === 'string' ? body.location : '';
			const resolved = resolveLocationPoint(location);
			if (!resolved) {
				return {
					status: 404,
					body: {
						location: null,
						message: 'Unable to resolve location to coordinates.',
					},
				};
			}

			return {
				status: 200,
				body: {
					location: toPointPayload(resolved),
				},
			};
		},
	},
	{
		method: 'GET',
		path: '/v1/locations/distance',
		execute: (_params, body) => {
			const fromText = typeof body.from === 'string' ? body.from : '';
			const toText = typeof body.to === 'string' ? body.to : '';
			const from = resolveLocationPoint(fromText);
			const to = resolveLocationPoint(toText);
			if (!from || !to) {
				return {
					status: 404,
					body: {
						distanceKm: null,
						from: toPointPayload(from),
						to: toPointPayload(to),
						message: 'Unable to resolve one or both locations.',
					},
				};
			}

			return {
				status: 200,
				body: {
					from: toPointPayload(from),
					to: toPointPayload(to),
					distanceKm: calculateRoundedDistanceKm(from, to, 1),
				},
			};
		},
	},
];

module.exports = {
	locationRoutes,
};

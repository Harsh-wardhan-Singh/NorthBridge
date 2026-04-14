export type GeoPoint = {
	lat: number;
	lng: number;
};

const EARTH_RADIUS_KM = 6371;

export function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

export function isValidLatitude(lat: unknown): lat is number {
	return isFiniteNumber(lat) && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lng: unknown): lng is number {
	return isFiniteNumber(lng) && lng >= -180 && lng <= 180;
}

export function isValidGeoPoint(point: unknown): point is GeoPoint {
	if (!point || typeof point !== 'object') {
		return false;
	}

	const candidate = point as Partial<GeoPoint>;
	return isValidLatitude(candidate.lat) && isValidLongitude(candidate.lng);
}

export function toRadians(value: number): number {
	return (value * Math.PI) / 180;
}

export function roundTo(value: number, digits = 2): number {
	const factor = 10 ** Math.max(0, digits);
	return Math.round(value * factor) / factor;
}

export function calculateDistanceKm(from: GeoPoint, to: GeoPoint): number {
	const dLat = toRadians(to.lat - from.lat);
	const dLng = toRadians(to.lng - from.lng);
	const fromLatRad = toRadians(from.lat);
	const toLatRad = toRadians(to.lat);

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(dLng / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return EARTH_RADIUS_KM * c;
}

export function calculateRoundedDistanceKm(
	from: GeoPoint,
	to: GeoPoint,
	digits = 1,
): number {
	return roundTo(calculateDistanceKm(from, to), digits);
}


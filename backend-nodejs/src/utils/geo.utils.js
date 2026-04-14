const EARTH_RADIUS_KM = 6371;

function isFiniteNumber(value) {
	return typeof value === 'number' && Number.isFinite(value);
}

function isValidLatitude(lat) {
	return isFiniteNumber(lat) && lat >= -90 && lat <= 90;
}

function isValidLongitude(lng) {
	return isFiniteNumber(lng) && lng >= -180 && lng <= 180;
}

function isValidGeoPoint(point) {
	if (!point || typeof point !== 'object' || Array.isArray(point)) {
		return false;
	}

	return isValidLatitude(point.lat) && isValidLongitude(point.lng);
}

function toRadians(value) {
	return (value * Math.PI) / 180;
}

function roundTo(value, digits = 2) {
	const factor = 10 ** Math.max(0, Number.isFinite(digits) ? Math.floor(digits) : 2);
	return Math.round(value * factor) / factor;
}

function calculateDistanceKm(from, to) {
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

function calculateRoundedDistanceKm(from, to, digits = 1) {
	return roundTo(calculateDistanceKm(from, to), digits);
}

module.exports = {
	EARTH_RADIUS_KM,
	isFiniteNumber,
	isValidLatitude,
	isValidLongitude,
	isValidGeoPoint,
	toRadians,
	roundTo,
	calculateDistanceKm,
	calculateRoundedDistanceKm,
};

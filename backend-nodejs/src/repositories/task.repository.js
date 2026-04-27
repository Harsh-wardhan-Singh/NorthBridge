const {getRequiredFirestoreDb} = require('../config/firebase');
const {buildPrefixedId} = require('../utils/id.util');
const {toTaskRecord, normalizeString} = require('../models/task.model');
const {resolveLocationPoint} = require('../utils/location-resolver.util');

const taskWriteThroughCache = new Map();

function normalizeExecutionMode(value) {
	const normalized = normalizeString(value).toLowerCase();
	return normalized === 'online' ? 'online' : 'offline';
}

function normalizeIsoString(value, fallback = '') {
	const normalized = normalizeString(value);
	return normalized || fallback;
}

function normalizeGeoPoint(value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return undefined;
	}

	const lat = typeof value.lat === 'number' ? value.lat : undefined;
	const lng = typeof value.lng === 'number' ? value.lng : undefined;
	if (typeof lat !== 'number' || Number.isNaN(lat) || typeof lng !== 'number' || Number.isNaN(lng)) {
		return undefined;
	}

	return {lat, lng};
}

function normalizeTaskRecord(record) {
	if (!record || typeof record !== 'object') {
		return null;
	}

	const acceptedByUserId = normalizeString(record.acceptedByUserId) || undefined;
	const acceptedAt = normalizeString(record.acceptedAt) || undefined;
	const pendingAcceptanceByUserId = normalizeString(record.pendingAcceptanceByUserId) || undefined;
	const pendingAcceptanceAt = normalizeString(record.pendingAcceptanceAt) || undefined;
	const completionRequestedByUserId = normalizeString(record.completionRequestedByUserId) || undefined;
	const completionRequestedAt = normalizeString(record.completionRequestedAt) || undefined;
	const completedByUserId = normalizeString(record.completedByUserId) || undefined;
	const completedAt = normalizeString(record.completedAt) || undefined;
	const ratedAt = normalizeString(record.ratedAt) || undefined;

	return {
		id: normalizeString(record.id),
		postedByUserId: normalizeString(record.postedByUserId),
		postedByName: normalizeString(record.postedByName),
		title: normalizeString(record.title),
		description: normalizeString(record.description),
		location: normalizeString(record.location),
		price: typeof record.price === 'number' ? record.price : 0,
		distanceKm: typeof record.distanceKm === 'number' ? record.distanceKm : 0,
		locationGeo: normalizeGeoPoint(record.locationGeo),
		scheduledAt: normalizeIsoString(record.scheduledAt, new Date().toISOString()),
		executionMode: normalizeExecutionMode(record.executionMode),
		isActive: typeof record.isActive === 'boolean' ? record.isActive : true,
		completionRequestedByUserId,
		completionRequestedAt,
		completedByUserId,
		completedAt,
		isRatingPending: typeof record.isRatingPending === 'boolean' ? record.isRatingPending : false,
		completionRating: typeof record.completionRating === 'number' ? record.completionRating : undefined,
		ratedAt,
		acceptedByUserId,
		acceptedAt,
		pendingAcceptanceByUserId,
		pendingAcceptanceAt,
		status: normalizeString(record.status) || (acceptedByUserId ? 'accepted' : 'open'),
	};
}

function upsertTaskCache(record) {
	const normalized = normalizeTaskRecord(record);
	if (!normalized || !normalized.id) {
		return null;
	}

	taskWriteThroughCache.set(normalized.id, normalized);
	return normalized;
}

function mergeWithTaskCache(records) {
	const byId = new Map();
	for (const record of records) {
		if (!record || !record.id) {
			continue;
		}
		byId.set(record.id, record);
	}

	for (const [taskId, record] of taskWriteThroughCache.entries()) {
		byId.set(taskId, record);
	}

	return Array.from(byId.values());
}

async function listTaskRecords() {
	const db = getRequiredFirestoreDb();
	const snapshot = await db.collection('tasks').get();
	const records = snapshot.docs.map((doc) => normalizeTaskRecord({id: doc.id, ...doc.data()}));
	return mergeWithTaskCache(records);
}

function sanitizeTaskWritePayload(record) {
	if (!record || typeof record !== 'object' || Array.isArray(record)) {
		return record;
	}

	const sanitized = {};
	for (const [key, value] of Object.entries(record)) {
		if (typeof value === 'undefined') {
			continue;
		}

		if (value && typeof value === 'object' && !Array.isArray(value)) {
			sanitized[key] = sanitizeTaskWritePayload(value);
			continue;
		}

		sanitized[key] = value;
	}

	return sanitized;
}

function buildTaskQuery(db, query = {}) {
	let ref = db.collection('tasks');
	let canUseDirectQuery = true;

	const status = normalizeString(query.status);
	if (status) {
		if (typeof ref.where === 'function') {
			ref = ref.where('status', '==', status);
		} else {
			canUseDirectQuery = false;
		}
	}

	const executionMode = normalizeString(query.executionMode);
	if (executionMode) {
		if (typeof ref.where === 'function') {
			ref = ref.where('executionMode', '==', executionMode);
		} else {
			canUseDirectQuery = false;
		}
	}

	const postedByUserId = normalizeString(query.postedByUserId);
	if (postedByUserId) {
		if (typeof ref.where === 'function') {
			ref = ref.where('postedByUserId', '==', postedByUserId);
		} else {
			canUseDirectQuery = false;
		}
	}

	const acceptedByUserId = normalizeString(query.acceptedByUserId);
	if (acceptedByUserId) {
		if (typeof ref.where === 'function') {
			ref = ref.where('acceptedByUserId', '==', acceptedByUserId);
		} else {
			canUseDirectQuery = false;
		}
	}

	const page = typeof query.page === 'number' && query.page > 0 ? query.page : 1;
	const pageSize = typeof query.pageSize === 'number' && query.pageSize > 0 ? query.pageSize : 0;
	if (pageSize && page <= 1) {
		if (typeof ref.limit === 'function') {
			ref = ref.limit(pageSize);
		} else {
			canUseDirectQuery = false;
		}
	}

	return {ref, canUseDirectQuery};
}

function applyTaskRecordQuery(records, query = {}) {
	let filtered = [...records];

	const status = normalizeString(query.status);
	if (status) {
		filtered = filtered.filter((record) => normalizeString(record.status) === status);
	}

	const executionMode = normalizeString(query.executionMode);
	if (executionMode) {
		filtered = filtered.filter((record) => normalizeString(record.executionMode) === executionMode);
	}

	const postedByUserId = normalizeString(query.postedByUserId);
	if (postedByUserId) {
		filtered = filtered.filter((record) => normalizeString(record.postedByUserId) === postedByUserId);
	}

	const acceptedByUserId = normalizeString(query.acceptedByUserId);
	if (acceptedByUserId) {
		filtered = filtered.filter((record) => normalizeString(record.acceptedByUserId) === acceptedByUserId);
	}

	const page = typeof query.page === 'number' && query.page > 0 ? query.page : 1;
	const pageSize = typeof query.pageSize === 'number' && query.pageSize > 0 ? query.pageSize : 0;
	if (pageSize) {
		const start = (page - 1) * pageSize;
		filtered = filtered.slice(start, start + pageSize);
	}

	return filtered;
}

async function queryTaskRecords(query = {}) {
	const db = getRequiredFirestoreDb();
	const {ref, canUseDirectQuery} = buildTaskQuery(db, query);
	if (canUseDirectQuery) {
		const snapshot = await ref.get();
		const records = snapshot.docs.map((doc) => normalizeTaskRecord({id: doc.id, ...doc.data()}));
		return applyTaskRecordQuery(mergeWithTaskCache(records), query);
	}

	return applyTaskRecordQuery(await listTaskRecords(), query);
}

async function getTaskRecordById(taskId) {
	const normalizedTaskId = normalizeString(taskId);
	if (!normalizedTaskId) {
		return null;
	}

	const db = getRequiredFirestoreDb();
	const snapshot = await db.collection('tasks').doc(normalizedTaskId).get();
	if (!snapshot.exists) {
		return taskWriteThroughCache.get(normalizedTaskId) || null;
	}

	return upsertTaskCache({id: snapshot.id, ...snapshot.data()});
}

async function listTasks() {
	return (await listTaskRecords()).map((task) => toTaskRecord(task));
}

async function listTasksByQuery(query = {}) {
	return (await queryTaskRecords(query)).map((task) => toTaskRecord(task));
}

async function getTaskById(taskId) {
	return toTaskRecord(await getTaskRecordById(taskId));
}

function nextTaskId() {
	return buildPrefixedId('t');
}

async function createTask(input) {
	const resolvedLocationPoint =
		normalizeGeoPoint(input.locationGeo) || resolveLocationPoint(input.location);
	const created = normalizeTaskRecord({
		id: nextTaskId(),
		createdAt: new Date().toISOString(),
		postedByUserId: normalizeString(input.postedByUserId),
		postedByName: normalizeString(input.postedByName),
		title: normalizeString(input.title),
		description: normalizeString(input.description),
		location: normalizeString(input.location),
		price: typeof input.price === 'number' ? input.price : 0,
		distanceKm: typeof input.distanceKm === 'number' ? input.distanceKm : 0,
		locationGeo: resolvedLocationPoint
			? {lat: resolvedLocationPoint.lat, lng: resolvedLocationPoint.lng}
			: undefined,
		scheduledAt: normalizeIsoString(input.scheduledAt, new Date().toISOString()),
		executionMode: normalizeExecutionMode(input.executionMode),
		isActive: true,
		completionRequestedByUserId: undefined,
		completionRequestedAt: undefined,
		completedByUserId: undefined,
		completedAt: undefined,
		isRatingPending: false,
		completionRating: undefined,
		ratedAt: undefined,
		status: 'open',
		acceptedByUserId: undefined,
		acceptedAt: undefined,
		pendingAcceptanceByUserId: undefined,
		pendingAcceptanceAt: undefined,
	});

	const db = getRequiredFirestoreDb();
	await db.collection('tasks').doc(created.id).set(sanitizeTaskWritePayload(created));
	upsertTaskCache(created);

	return toTaskRecord(created);
}

async function updateTaskRecord(taskId, updates = {}) {
	const normalizedTaskId = normalizeString(taskId);
	if (!normalizedTaskId) {
		return null;
	}

	const db = getRequiredFirestoreDb();
	const ref = db.collection('tasks').doc(normalizedTaskId);
	const snapshot = await ref.get();
	if (!snapshot.exists) {
		return null;
	}

	await ref.set(sanitizeTaskWritePayload(updates), {merge: true});
	return upsertTaskCache({id: snapshot.id, ...snapshot.data(), ...updates});
}

async function requestTaskAcceptance(taskId, acceptedByUserId) {
	const normalizedTaskId = normalizeString(taskId);
	const acceptedBy = normalizeString(acceptedByUserId);
	if (!normalizedTaskId) {
		return null;
	}

	const updates = {
		status: 'pending_acceptance',
		pendingAcceptanceByUserId: acceptedBy,
		pendingAcceptanceAt: new Date().toISOString(),
	};
	return toTaskRecord(await updateTaskRecord(normalizedTaskId, updates));
}

async function confirmTaskAcceptance(taskId) {
	const current = await getTaskRecordById(taskId);
	if (!current) {
		return null;
	}

	const updates = {
		status: 'accepted',
		acceptedByUserId: current.pendingAcceptanceByUserId || undefined,
		acceptedAt: new Date().toISOString(),
		pendingAcceptanceByUserId: null,
		pendingAcceptanceAt: null,
	};

	return toTaskRecord(await updateTaskRecord(taskId, updates));
}

async function declineTaskAcceptance(taskId) {
	const updates = {
		status: 'open',
		pendingAcceptanceByUserId: null,
		pendingAcceptanceAt: null,
	};

	return toTaskRecord(await updateTaskRecord(taskId, updates));
}

async function requestTaskCompletion(taskId, helperUserId) {
	const updates = {
		completionRequestedByUserId: normalizeString(helperUserId),
		completionRequestedAt: new Date().toISOString(),
	};

	return toTaskRecord(await updateTaskRecord(taskId, updates));
}

async function confirmTaskCompletion(taskId) {
	const current = await getTaskRecordById(taskId);
	if (!current) {
		return null;
	}

	const updates = {
		isActive: false,
		status: 'completed',
		completedByUserId: current.completionRequestedByUserId || current.acceptedByUserId || undefined,
		completedAt: new Date().toISOString(),
		isRatingPending: true,
		completionRequestedByUserId: null,
		completionRequestedAt: null,
		pendingAcceptanceByUserId: null,
		pendingAcceptanceAt: null,
	};

	return toTaskRecord(await updateTaskRecord(taskId, updates));
}

async function declineTaskCompletion(taskId) {
	const current = await getTaskRecordById(taskId);
	if (!current) {
		return null;
	}

	const updates = {
		status: current.acceptedByUserId ? 'accepted' : 'open',
		completionRequestedByUserId: null,
		completionRequestedAt: null,
	};

	return toTaskRecord(await updateTaskRecord(taskId, updates));
}

async function submitTaskRating(taskId, rating) {
	const updates = {
		completionRating: Number(rating),
		ratedAt: new Date().toISOString(),
		isRatingPending: false,
	};

	return toTaskRecord(await updateTaskRecord(taskId, updates));
}

async function cancelTask(taskId) {
	const updates = {
		isActive: false,
		status: 'cancelled',
		completionRequestedByUserId: null,
		completionRequestedAt: null,
		isRatingPending: false,
		pendingAcceptanceByUserId: null,
		pendingAcceptanceAt: null,
	};

	return toTaskRecord(await updateTaskRecord(taskId, updates));
}

module.exports = {
	listTasks,
	listTasksByQuery,
	getTaskById,
	getTaskRecordById,
	nextTaskId,
	createTask,
	requestTaskAcceptance,
	confirmTaskAcceptance,
	declineTaskAcceptance,
	requestTaskCompletion,
	confirmTaskCompletion,
	declineTaskCompletion,
	submitTaskRating,
	cancelTask,
};

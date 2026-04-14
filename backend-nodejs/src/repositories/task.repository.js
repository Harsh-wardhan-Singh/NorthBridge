const seedData = require('../../mock-data/seed-data');
const {toTaskRecord, normalizeString} = require('../models/task.model');

function getTaskStore() {
	return seedData.tasks;
}

function listTasks() {
	return getTaskStore().map((task) => toTaskRecord(task));
}

function getTaskById(taskId) {
	const normalizedTaskId = normalizeString(taskId);
	const task = getTaskStore().find((entry) => entry.id === normalizedTaskId);
	return toTaskRecord(task);
}

function nextTaskId() {
	return `t_${String(getTaskStore().length + 1).padStart(4, '0')}`;
}

function createTask(input) {
	const created = {
		id: nextTaskId(),
		postedByUserId: normalizeString(input.postedByUserId),
		postedByName: normalizeString(input.postedByName),
		title: normalizeString(input.title),
		description: normalizeString(input.description),
		location: normalizeString(input.location),
		price: typeof input.price === 'number' ? input.price : 0,
		distanceKm: typeof input.distanceKm === 'number' ? input.distanceKm : 0,
		scheduledAt: normalizeString(input.scheduledAt),
		status: input.status === 'accepted' ? 'accepted' : 'open',
	};

	getTaskStore().unshift(created);
	return toTaskRecord(created);
}

function acceptTask(taskId, acceptedByUserId) {
	const normalizedTaskId = normalizeString(taskId);
	const task = getTaskStore().find((entry) => entry.id === normalizedTaskId);
	if (!task) {
		return null;
	}

	task.status = 'accepted';
	task.acceptedByUserId = normalizeString(acceptedByUserId);
	return toTaskRecord(task);
}

module.exports = {
	getTaskStore,
	listTasks,
	getTaskById,
	nextTaskId,
	createTask,
	acceptTask,
};

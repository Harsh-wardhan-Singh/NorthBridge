const {
	listTasks,
	getTaskById,
	createTask,
	acceptTask,
} = require('../repositories/task.repository');
const {
	validateCreateTaskPayload,
	validateAcceptTaskPayload,
} = require('../validators/task.validator');
const {success, failure} = require('../utils/response.util');

function fetchTasks() {
	return success(200, listTasks());
}

function fetchTaskById(taskId) {
	const task = getTaskById(taskId);
	if (!task) {
		return failure(404, 'Task not found.');
	}

	return success(200, task);
}

function createTaskEntry(payload = {}) {
	const validation = validateCreateTaskPayload(payload);
	if (!validation.valid) {
		return failure(400, 'Title, description, location, price, and scheduledAt are required.');
	}

	const task = createTask(validation.value);
	return success(201, task);
}

function acceptTaskEntry(taskId, payload = {}) {
	const task = getTaskById(taskId);
	if (!task) {
		return failure(404, 'Task not found.');
	}

	const validation = validateAcceptTaskPayload(payload);
	const updatedTask = acceptTask(taskId, validation.value.acceptedByUserId);
	return success(200, updatedTask);
}

module.exports = {
	fetchTasks,
	fetchTaskById,
	createTaskEntry,
	acceptTaskEntry,
};

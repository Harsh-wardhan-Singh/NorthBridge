const {fetchTaskById} = require('../services/task.service');
const {findTaskCandidates} = require('../services/matching.service');

function onTaskCreatedTrigger(taskId) {
	const taskResult = fetchTaskById(taskId);
	if (!taskResult.ok || !taskResult.data) {
		return {
			ok: false,
			status: taskResult.status,
			taskId,
			candidates: [],
			notificationCount: 0,
			message: taskResult.message || 'Task not found for trigger.',
		};
	}

	const candidates = findTaskCandidates(taskResult.data);
	return {
		ok: true,
		status: 200,
		taskId,
		candidates,
		notificationCount: candidates.length,
	};
}

module.exports = {
	onTaskCreatedTrigger,
};

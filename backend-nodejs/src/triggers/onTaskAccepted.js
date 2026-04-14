const {fetchTaskById} = require('../services/task.service');

function onTaskAcceptedTrigger(taskId) {
	const taskResult = fetchTaskById(taskId);
	if (!taskResult.ok || !taskResult.data) {
		return {
			ok: false,
			status: taskResult.status,
			taskId,
			shouldCloseOffers: false,
			message: taskResult.message || 'Task not found for acceptance trigger.',
		};
	}

	return {
		ok: true,
		status: 200,
		taskId,
		acceptedByUserId: taskResult.data.acceptedByUserId,
		shouldCloseOffers: taskResult.data.status === 'accepted',
	};
}

module.exports = {
	onTaskAcceptedTrigger,
};

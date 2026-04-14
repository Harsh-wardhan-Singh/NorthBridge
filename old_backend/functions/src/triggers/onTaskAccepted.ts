import {fetchTaskById} from '../services/task.service';

export type TaskAcceptedTriggerResult = {
	ok: boolean;
	status: number;
	taskId: string;
	acceptedByUserId?: string;
	shouldCloseOffers: boolean;
	message?: string;
};

export function onTaskAcceptedTrigger(taskId: string): TaskAcceptedTriggerResult {
	const taskResult = fetchTaskById(taskId);
	if (!taskResult.ok || !taskResult.data) {
		return {
			ok: false,
			status: taskResult.status,
			taskId,
			shouldCloseOffers: false,
			message: taskResult.message ?? 'Task not found for acceptance trigger.',
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


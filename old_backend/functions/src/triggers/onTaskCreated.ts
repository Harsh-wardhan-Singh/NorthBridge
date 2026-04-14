import {fetchTaskById} from '../services/task.service';
import {findTaskCandidates, type MatchingCandidate} from '../services/matching.service';

export type TaskCreatedTriggerResult = {
	ok: boolean;
	status: number;
	taskId: string;
	candidates: MatchingCandidate[];
	notificationCount: number;
	message?: string;
};

export function onTaskCreatedTrigger(taskId: string): TaskCreatedTriggerResult {
	const taskResult = fetchTaskById(taskId);
	if (!taskResult.ok || !taskResult.data) {
		return {
			ok: false,
			status: taskResult.status,
			taskId,
			candidates: [],
			notificationCount: 0,
			message: taskResult.message ?? 'Task not found for trigger.',
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


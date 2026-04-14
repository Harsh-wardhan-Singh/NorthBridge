import {
	acceptTask,
	createTask,
	getTaskById,
	listTasks,
	listChats,
	listMessages,
	getChatById,
	sendMessage,
	parseVoiceTaskDraft,
	type ChatRecord,
	type MessageRecord,
	type TaskRecord,
} from '../../../mock-data/seed-data';

export type {ChatRecord, MessageRecord, TaskRecord};

export type ServiceResult<T> = {
	ok: boolean;
	status: number;
	data: T | null;
	message?: string;
};

export type TaskPayload = {
	title?: string;
	description?: string;
	location?: string;
	price?: number;
	scheduledAt?: string;
	postedByUserId?: string;
	postedByName?: string;
	acceptedByUserId?: string;
	text?: string;
	taskId?: string;
	senderId?: string;
	transcript?: string;
};

export function fetchTasks(): ServiceResult<TaskRecord[]> {
	return {
		ok: true,
		status: 200,
		data: listTasks(),
	};
}

export function fetchTaskById(taskId: string): ServiceResult<TaskRecord> {
	const task = getTaskById(taskId);
	if (!task) {
		return {
			ok: false,
			status: 404,
			data: null,
			message: 'Task not found.',
		};
	}

	return {
		ok: true,
		status: 200,
		data: task,
	};
}

export function createTaskEntry(payload: TaskPayload): ServiceResult<TaskRecord> {
	const title = payload.title?.trim() ?? '';
	const description = payload.description?.trim() ?? '';
	const location = payload.location?.trim() ?? '';
	const price = payload.price;
	const scheduledAt = payload.scheduledAt?.trim() ?? '';
	const postedByUserId = payload.postedByUserId?.trim() ?? 'u_1001';
	const postedByName = payload.postedByName?.trim() ?? 'Aarav Sharma';

	if (!title || !description || !location || typeof price !== 'number' || !scheduledAt) {
		return {
			ok: false,
			status: 400,
			data: null,
			message: 'Title, description, location, price, and scheduledAt are required.',
		};
	}

	const task = createTask({
		title,
		description,
		location,
		price,
		scheduledAt,
		postedByUserId,
		postedByName,
	});

	return {
		ok: true,
		status: 201,
		data: task,
	};
}

export function acceptTaskEntry(
	taskId: string,
	payload: TaskPayload,
): ServiceResult<TaskRecord> {
	const acceptedByUserId = payload.acceptedByUserId?.trim() || 'u_1002';
	const task = acceptTask(taskId, acceptedByUserId);

	if (!task) {
		return {
			ok: false,
			status: 404,
			data: null,
			message: 'Task not found.',
		};
	}

	return {
		ok: true,
		status: 200,
		data: task,
	};
}

export function fetchChats(): ServiceResult<ChatRecord[]> {
	return {
		ok: true,
		status: 200,
		data: listChats(),
	};
}

export function fetchChatMessages(
	chatId: string,
): ServiceResult<{ chat: ChatRecord; messages: MessageRecord[] }> {
	const chat = getChatById(chatId);
	if (!chat) {
		return {
			ok: false,
			status: 404,
			data: null,
			message: 'Chat not found.',
		};
	}

	return {
		ok: true,
		status: 200,
		data: {
			chat,
			messages: listMessages(chatId),
		},
	};
}

export function createMessage(
	chatId: string,
	payload: TaskPayload,
): ServiceResult<MessageRecord> {
	const text = payload.text?.trim() ?? '';
	const taskId = payload.taskId?.trim() ?? '';
	const senderId = payload.senderId?.trim() ?? 'u_1002';

	if (!text || !taskId) {
		return {
			ok: false,
			status: 400,
			data: null,
			message: 'taskId and text are required.',
		};
	}

	const message = sendMessage({ chatId, taskId, senderId, text });
	if (!message) {
		return {
			ok: false,
			status: 404,
			data: null,
			message: 'Chat not found.',
		};
	}

	return {
		ok: true,
		status: 201,
		data: message,
	};
}

export function parseVoiceTask(
	payload: TaskPayload,
): ServiceResult<ReturnType<typeof parseVoiceTaskDraft>> {
	const transcript = payload.transcript?.trim() ?? '';
	if (!transcript) {
		return {
			ok: false,
			status: 400,
			data: null,
			message: 'Transcript is required.',
		};
	}

	return {
		ok: true,
		status: 200,
		data: parseVoiceTaskDraft(transcript),
	};
}


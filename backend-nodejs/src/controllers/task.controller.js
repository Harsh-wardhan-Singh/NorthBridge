const seedData = require('../../mock-data/seed-data');

function normalizeString(value) {
	return typeof value === 'string' ? value.trim() : '';
}

function cloneTask(task) {
	if (!task) {
		return null;
	}

	return {
		id: task.id,
		postedByUserId: task.postedByUserId,
		postedByName: task.postedByName,
		title: task.title,
		description: task.description,
		location: task.location,
		price: task.price,
		distanceKm: task.distanceKm,
		scheduledAt: task.scheduledAt,
		status: task.status,
		acceptedByUserId: task.acceptedByUserId,
	};
}

function cloneMessage(message) {
	if (!message) {
		return null;
	}

	return {
		id: message.id,
		chatId: message.chatId,
		taskId: message.taskId,
		senderId: message.senderId,
		text: message.text,
		timestamp: message.timestamp,
	};
}

function cloneChat(chat) {
	if (!chat) {
		return null;
	}

	return {
		chatId: chat.chatId,
		taskId: chat.taskId,
		taskTitle: chat.taskTitle,
		taskOwnerUserId: chat.taskOwnerUserId,
		taskOwnerName: chat.taskOwnerName,
		users: Array.isArray(chat.users) ? [...chat.users] : [],
		lastMessage: cloneMessage(chat.lastMessage),
	};
}

function getTaskStore() {
	return seedData.tasks;
}

function getChatStore() {
	return seedData.chats;
}

function getMessageStore() {
	return seedData.messages;
}

function listTasks() {
	return getTaskStore().map((task) => cloneTask(task));
}

function getTaskById(taskId) {
	const normalizedTaskId = normalizeString(taskId);
	const task = getTaskStore().find((entry) => entry.id === normalizedTaskId);
	return cloneTask(task);
}

function nextTaskId() {
	return `t_${String(getTaskStore().length + 1).padStart(4, '0')}`;
}

function createTask(input = {}) {
	const task = {
		id: nextTaskId(),
		postedByUserId: normalizeString(input.postedByUserId) || 'u_1001',
		postedByName: normalizeString(input.postedByName) || 'Aarav Sharma',
		title: normalizeString(input.title),
		description: normalizeString(input.description),
		location: normalizeString(input.location),
		price: input.price,
		distanceKm: 0,
		scheduledAt: normalizeString(input.scheduledAt),
		status: 'open',
	};

	getTaskStore().unshift(task);
	return cloneTask(task);
}

function acceptTask(taskId, acceptedByUserId) {
	const normalizedTaskId = normalizeString(taskId);
	const task = getTaskStore().find((entry) => entry.id === normalizedTaskId);
	if (!task) {
		return null;
	}

	task.status = 'accepted';
	task.acceptedByUserId = normalizeString(acceptedByUserId) || 'u_1002';
	return cloneTask(task);
}

function listChats() {
	return getChatStore().map((chat) => cloneChat(chat));
}

function getChatById(chatId) {
	const normalizedChatId = normalizeString(chatId);
	const chat = getChatStore().find((entry) => entry.chatId === normalizedChatId);
	return cloneChat(chat);
}

function listMessages(chatId) {
	const normalizedChatId = normalizeString(chatId);
	return getMessageStore()
		.filter((message) => message.chatId === normalizedChatId)
		.map((message) => cloneMessage(message));
}

function nextMessageId() {
	return `m_${String(getMessageStore().length + 5001).padStart(4, '0')}`;
}

function sendMessage(input = {}) {
	const chatId = normalizeString(input.chatId);
	const taskId = normalizeString(input.taskId);
	const senderId = normalizeString(input.senderId) || 'u_1002';
	const text = normalizeString(input.text);

	if (!chatId || !taskId || !text) {
		return null;
	}

	const chat = getChatStore().find((entry) => entry.chatId === chatId);
	if (!chat) {
		return null;
	}

	const message = {
		id: nextMessageId(),
		chatId,
		taskId,
		senderId,
		text,
		timestamp: new Date().toISOString(),
	};

	getMessageStore().push(message);
	chat.lastMessage = message;
	return cloneMessage(message);
}

function parseVoiceTaskDraft(transcript) {
	const cleaned = normalizeString(transcript);
	const words = cleaned.split(/\s+/).filter(Boolean);
	const priceMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
	const locationMatch = cleaned.match(/(?:in|at)\s+([A-Za-z0-9\s,]+)/i);

	return {
		title: words.slice(0, 6).join(' ') || 'Voice task',
		description: cleaned || 'Task details from voice input.',
		location: locationMatch?.[1]?.trim() || 'Add location',
		price: priceMatch ? Number(priceMatch[1]) : 0,
		scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
	};
}

function listTasksController() {
	return {
		status: 200,
		body: {
			tasks: listTasks(),
		},
	};
}

function getTaskController(taskId) {
	const task = getTaskById(taskId);
	if (!task) {
		return {
			status: 404,
			body: {
				task: null,
				message: 'Task not found.',
			},
		};
	}

	return {
		status: 200,
		body: {
			task,
		},
	};
}

function createTaskController(body = {}) {
	const title = normalizeString(body.title);
	const description = normalizeString(body.description);
	const location = normalizeString(body.location);
	const scheduledAt = normalizeString(body.scheduledAt);
	const postedByUserId = normalizeString(body.postedByUserId) || 'u_1001';
	const postedByName = normalizeString(body.postedByName) || 'Aarav Sharma';
	const price = body.price;

	if (!title || !description || !location || typeof price !== 'number' || !scheduledAt) {
		return {
			status: 400,
			body: {
				task: null,
				message: 'Title, description, location, price, and scheduledAt are required.',
			},
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
		status: 201,
		body: {
			task,
		},
	};
}

function acceptTaskController(taskId, body = {}) {
	const acceptedByUserId = normalizeString(body.acceptedByUserId) || 'u_1002';
	const task = acceptTask(taskId, acceptedByUserId);

	if (!task) {
		return {
			status: 404,
			body: {
				task: null,
				message: 'Task not found.',
			},
		};
	}

	return {
		status: 200,
		body: {
			task,
		},
	};
}

function listChatsController() {
	return {
		status: 200,
		body: {
			chats: listChats(),
		},
	};
}

function getChatMessagesController(chatId) {
	const chat = getChatById(chatId);
	if (!chat) {
		return {
			status: 404,
			body: {
				chat: null,
				messages: [],
				message: 'Chat not found.',
			},
		};
	}

	return {
		status: 200,
		body: {
			chat,
			messages: listMessages(chatId),
		},
	};
}

function sendMessageController(chatId, body = {}) {
	const message = sendMessage({
		chatId,
		taskId: normalizeString(body.taskId),
		senderId: normalizeString(body.senderId) || 'u_1002',
		text: normalizeString(body.text),
	});

	if (!message) {
		const normalizedChatId = normalizeString(chatId);
		const chatExists = getChatStore().some((entry) => entry.chatId === normalizedChatId);
		return {
			status: chatExists ? 400 : 404,
			body: {
				message: null,
				messageText: chatExists ? 'taskId and text are required.' : 'Chat not found.',
			},
		};
	}

	return {
		status: 201,
		body: {
			message,
			messageText: undefined,
		},
	};
}

function parseVoiceTaskController(body = {}) {
	const transcript = normalizeString(body.transcript);
	if (!transcript) {
		return {
			status: 400,
			body: {
				draft: null,
				message: 'Transcript is required.',
			},
		};
	}

	return {
		status: 200,
		body: {
			draft: parseVoiceTaskDraft(transcript),
		},
	};
}

module.exports = {
	listTasksController,
	getTaskController,
	createTaskController,
	acceptTaskController,
	listChatsController,
	getChatMessagesController,
	sendMessageController,
	parseVoiceTaskController,
	listTasks,
	getTaskById,
	createTask,
	acceptTask,
	listChats,
	getChatById,
	listMessages,
	sendMessage,
	parseVoiceTaskDraft,
};

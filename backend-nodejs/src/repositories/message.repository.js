const seedData = require('../../mock-data/seed-data');
const {toMessageRecord, normalizeString} = require('../models/message.model');

function getMessageStore() {
	return seedData.messages;
}

function listMessagesByChatId(chatId) {
	const normalizedChatId = normalizeString(chatId);
	return getMessageStore()
		.filter((message) => message.chatId === normalizedChatId)
		.map((message) => toMessageRecord(message));
}

function nextMessageId() {
	return `m_${String(getMessageStore().length + 5001).padStart(4, '0')}`;
}

function createMessage(input) {
	const created = {
		id: nextMessageId(),
		chatId: normalizeString(input.chatId),
		taskId: normalizeString(input.taskId),
		senderId: normalizeString(input.senderId),
		text: normalizeString(input.text),
		timestamp:
			typeof input.timestamp === 'string' && input.timestamp.trim()
				? input.timestamp
				: new Date().toISOString(),
	};

	getMessageStore().push(created);
	return toMessageRecord(created);
}

module.exports = {
	getMessageStore,
	listMessagesByChatId,
	nextMessageId,
	createMessage,
};

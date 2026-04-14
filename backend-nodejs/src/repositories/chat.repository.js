const seedData = require('../../mock-data/seed-data');
const {toChatRecord, normalizeString} = require('../models/chat.model');
const {toMessageRecord} = require('../models/message.model');

function getChatStore() {
	return seedData.chats;
}

function listChats() {
	return getChatStore().map((chat) => toChatRecord(chat));
}

function getChatById(chatId) {
	const normalizedChatId = normalizeString(chatId);
	const chat = getChatStore().find((entry) => entry.chatId === normalizedChatId);
	return toChatRecord(chat);
}

function updateChatLastMessage(chatId, message) {
	const normalizedChatId = normalizeString(chatId);
	const chat = getChatStore().find((entry) => entry.chatId === normalizedChatId);
	if (!chat) {
		return null;
	}

	chat.lastMessage = toMessageRecord(message);
	return toChatRecord(chat);
}

module.exports = {
	getChatStore,
	listChats,
	getChatById,
	updateChatLastMessage,
};

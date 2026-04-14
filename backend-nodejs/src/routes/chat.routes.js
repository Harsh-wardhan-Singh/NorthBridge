const {
	getChatMessagesController,
	listChatsController,
	sendMessageController,
} = require('../controllers/chat.controller');

const chatRoutes = [
	{
		method: 'GET',
		path: '/v1/chats',
		execute: () => listChatsController(),
	},
	{
		method: 'GET',
		path: '/v1/chats/:chatId/messages',
		execute: (params) => getChatMessagesController(params.chatId),
	},
	{
		method: 'POST',
		path: '/v1/chats/:chatId/messages',
		execute: (params, body) =>
			sendMessageController(params.chatId, {
				taskId: typeof body.taskId === 'string' ? body.taskId : undefined,
				senderId: typeof body.senderId === 'string' ? body.senderId : undefined,
				text: typeof body.text === 'string' ? body.text : undefined,
			}),
	},
];

module.exports = {
	chatRoutes,
};

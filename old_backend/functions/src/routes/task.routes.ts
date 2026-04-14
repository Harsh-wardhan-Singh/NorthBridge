import {
  acceptTaskController,
  createTaskController,
  getChatMessagesController,
  getTaskController,
  listChatsController,
  listTasksController,
  parseVoiceTaskController,
  sendMessageController,
} from '../controllers/task.controller';

export type ApiParams = Record<string, string>;
export type ApiBody = Record<string, unknown>;

export type RouteDefinition = {
  method: 'GET' | 'POST';
  path: string;
  execute: (params: ApiParams, body: ApiBody) => unknown;
};

export const taskRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/v1/tasks',
    execute: () => listTasksController(),
  },
  {
    method: 'GET',
    path: '/v1/tasks/:taskId',
    execute: (params) => getTaskController(params.taskId),
  },
  {
    method: 'POST',
    path: '/v1/tasks',
    execute: (_params, body) =>
      createTaskController({
        title: typeof body.title === 'string' ? body.title : undefined,
        description:
          typeof body.description === 'string' ? body.description : undefined,
        location: typeof body.location === 'string' ? body.location : undefined,
        price: typeof body.price === 'number' ? body.price : undefined,
        scheduledAt:
          typeof body.scheduledAt === 'string' ? body.scheduledAt : undefined,
        postedByUserId:
          typeof body.postedByUserId === 'string'
            ? body.postedByUserId
            : undefined,
        postedByName:
          typeof body.postedByName === 'string' ? body.postedByName : undefined,
      }),
  },
  {
    method: 'POST',
    path: '/v1/tasks/:taskId/accept',
    execute: (params, body) =>
      acceptTaskController(params.taskId, {
        acceptedByUserId:
          typeof body.acceptedByUserId === 'string'
            ? body.acceptedByUserId
            : undefined,
      }),
  },
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
  {
    method: 'POST',
    path: '/v1/voice/parse-task',
    execute: (_params, body) =>
      parseVoiceTaskController({
        transcript:
          typeof body.transcript === 'string' ? body.transcript : undefined,
      }),
  },
];

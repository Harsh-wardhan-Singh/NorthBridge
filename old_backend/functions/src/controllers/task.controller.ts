import {
  acceptTaskEntry,
  createMessage,
  createTaskEntry,
  fetchChatMessages,
  fetchChats,
  fetchTaskById,
  fetchTasks,
  parseVoiceTask,
  type ChatRecord,
  type MessageRecord,
  type TaskRecord,
} from '../services/task.service';

export type TaskRequestBody = {
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
  transcript?: string;
  chatId?: string;
  senderId?: string;
};

export type ControllerResult<T> = {
  status: number;
  body: T;
};

export function listTasksController(): ControllerResult<{ tasks: TaskRecord[] }> {
  const result = fetchTasks();
  return {
    status: result.status,
    body: {
      tasks: result.data ?? [],
    },
  };
}

export function getTaskController(taskId: string): ControllerResult<{
  task: TaskRecord | null;
}> {
  const result = fetchTaskById(taskId);
  return {
    status: result.status,
    body: { task: result.data },
  };
}

export function createTaskController(body: TaskRequestBody): ControllerResult<{
  task: TaskRecord | null;
  message?: string;
}> {
  const result = createTaskEntry(body);

  return {
    status: result.status,
    body: {
      task: result.data,
      message: result.message,
    },
  };
}

export function acceptTaskController(
  taskId: string,
  body: TaskRequestBody,
): ControllerResult<{ task: TaskRecord | null; message?: string }> {
  const result = acceptTaskEntry(taskId, body);

  return {
    status: result.status,
    body: {
      task: result.data,
      message: result.message,
    },
  };
}

export function listChatsController(): ControllerResult<{ chats: ChatRecord[] }> {
  const result = fetchChats();
  return {
    status: result.status,
    body: {
      chats: result.data ?? [],
    },
  };
}

export function getChatMessagesController(
  chatId: string,
): ControllerResult<{ messages: MessageRecord[]; chat: ChatRecord | null }> {
  const result = fetchChatMessages(chatId);
  return {
    status: result.status,
    body: {
      chat: result.data?.chat ?? null,
      messages: result.data?.messages ?? [],
    },
  };
}

export function sendMessageController(
  chatId: string,
  body: TaskRequestBody,
): ControllerResult<{ message: MessageRecord | null; messageText?: string }> {
  const result = createMessage(chatId, body);

  return {
    status: result.status,
    body: {
      message: result.data,
      messageText: result.message,
    },
  };
}

export function parseVoiceTaskController(body: TaskRequestBody): ControllerResult<{
  draft: {
    title: string;
    description: string;
    location: string;
    price: number;
    scheduledAt: string;
  } | null;
  message?: string;
}> {
  const result = parseVoiceTask(body);

  return {
    status: result.status,
    body: {
      draft: result.data,
      message: result.message,
    },
  };
}

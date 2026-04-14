export type PublicUser = {
  id: string;
  name: string;
  rating: number;
  location: string;
};

export type AuthUserRecord = PublicUser & {
  email: string;
  password: string;
};

export type TaskRecord = {
  id: string;
  postedByUserId: string;
  postedByName: string;
  title: string;
  description: string;
  location: string;
  price: number;
  distanceKm: number;
  scheduledAt: string;
  status: 'open' | 'accepted';
  acceptedByUserId?: string;
};

export type MessageRecord = {
  id: string;
  chatId: string;
  taskId: string;
  senderId: string;
  text: string;
  timestamp: string;
};

export type ChatRecord = {
  chatId: string;
  taskId: string;
  taskTitle: string;
  taskOwnerUserId: string;
  taskOwnerName: string;
  users: string[];
  lastMessage: MessageRecord;
};

const users: AuthUserRecord[] = [
  {
    id: 'u_1001',
    name: 'Aarav Sharma',
    rating: 4.8,
    location: 'Gurgaon',
    email: 'aarav@northbridge.app',
    password: 'pass1234',
  },
  {
    id: 'u_1002',
    name: 'Meera Verma',
    rating: 4.6,
    location: 'Delhi',
    email: 'meera@northbridge.app',
    password: 'pass1234',
  },
  {
    id: 'u_1003',
    name: 'Kabir Singh',
    rating: 4.7,
    location: 'Noida',
    email: 'kabir@northbridge.app',
    password: 'pass1234',
  },
  {
    id: 'u_1004',
    name: 'Riya Kapoor',
    rating: 4.5,
    location: 'Faridabad',
    email: 'riya@northbridge.app',
    password: 'pass1234',
  },
];

const tasks: TaskRecord[] = [
  {
    id: '1',
    postedByUserId: 'u_1001',
    postedByName: 'Aarav Sharma',
    title: 'Pick up groceries',
    description: 'Need help buying basic groceries for tonight.',
    location: 'Sector 21, Gurgaon',
    price: 18,
    distanceKm: 1.3,
    scheduledAt: '2026-04-13T18:30:00.000Z',
    status: 'open',
  },
  {
    id: '2',
    postedByUserId: 'u_1001',
    postedByName: 'Aarav Sharma',
    title: 'Assemble study table',
    description: 'Flat-pack table assembly with basic tools.',
    location: 'Indirapuram, Ghaziabad',
    price: 35,
    distanceKm: 2.7,
    scheduledAt: '2026-04-14T10:00:00.000Z',
    status: 'open',
  },
  {
    id: '3',
    postedByUserId: 'u_1002',
    postedByName: 'Meera Verma',
    title: 'Drop parcel at courier',
    description: 'Small package to be dropped at nearby courier point.',
    location: 'Dwarka, New Delhi',
    price: 12,
    distanceKm: 0.9,
    scheduledAt: '2026-04-12T15:15:00.000Z',
    status: 'accepted',
    acceptedByUserId: 'u_1004',
  },
];

const messages: MessageRecord[] = [
  {
    id: 'm_5001',
    chatId: 'c_9001',
    taskId: '1',
    senderId: 'u_1001',
    text: 'I can take this task and start in 20 minutes.',
    timestamp: '2026-04-12T09:30:00.000Z',
  },
  {
    id: 'm_5002',
    chatId: 'c_9001',
    taskId: '1',
    senderId: 'u_1002',
    text: 'Please confirm if tools are available on-site.',
    timestamp: '2026-04-12T09:32:00.000Z',
  },
  {
    id: 'm_5003',
    chatId: 'c_9002',
    taskId: '2',
    senderId: 'u_1001',
    text: 'Yes, tools are available at the location.',
    timestamp: '2026-04-12T10:01:00.000Z',
  },
  {
    id: 'm_5004',
    chatId: 'c_9002',
    taskId: '2',
    senderId: 'u_1003',
    text: 'Can I come at 6 PM for assembly?',
    timestamp: '2026-04-12T10:05:00.000Z',
  },
  {
    id: 'm_5005',
    chatId: 'c_9003',
    taskId: '1',
    senderId: 'u_1001',
    text: 'What is your ETA for this task?',
    timestamp: '2026-04-12T10:10:00.000Z',
  },
  {
    id: 'm_5006',
    chatId: 'c_9003',
    taskId: '1',
    senderId: 'u_1004',
    text: 'I can do this in the next 30 minutes.',
    timestamp: '2026-04-12T10:12:00.000Z',
  },
];

const chats: ChatRecord[] = [
  {
    chatId: 'c_9001',
    taskId: '1',
    taskTitle: 'Pick up groceries',
    taskOwnerUserId: 'u_1001',
    taskOwnerName: 'Aarav Sharma',
    users: ['u_1001', 'u_1002'],
    lastMessage: messages[1],
  },
  {
    chatId: 'c_9002',
    taskId: '2',
    taskTitle: 'Assemble study table',
    taskOwnerUserId: 'u_1001',
    taskOwnerName: 'Aarav Sharma',
    users: ['u_1001', 'u_1003'],
    lastMessage: messages[3],
  },
  {
    chatId: 'c_9003',
    taskId: '1',
    taskTitle: 'Pick up groceries',
    taskOwnerUserId: 'u_1001',
    taskOwnerName: 'Aarav Sharma',
    users: ['u_1001', 'u_1004'],
    lastMessage: messages[5],
  },
];

function cloneTask(task: TaskRecord): TaskRecord {
  return { ...task };
}

function cloneMessage(message: MessageRecord): MessageRecord {
  return { ...message };
}

function cloneChat(chat: ChatRecord): ChatRecord {
  return {
    ...chat,
    users: [...chat.users],
    lastMessage: cloneMessage(chat.lastMessage),
  };
}

function nextId(prefix: string, currentCount: number): string {
  return `${prefix}_${String(currentCount + 1).padStart(4, '0')}`;
}

export function listPublicUsers(): PublicUser[] {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    rating: user.rating,
    location: user.location,
  }));
}

export function getUserById(userId: string): PublicUser | undefined {
  const user = users.find((entry) => entry.id === userId);
  return user
    ? {
        id: user.id,
        name: user.name,
        rating: user.rating,
        location: user.location,
      }
    : undefined;
}

export function findUserByEmail(email: string): AuthUserRecord | undefined {
  return users.find((user) => user.email === email.trim().toLowerCase());
}

export function authenticateUser(
  email: string,
  password: string,
): PublicUser | null {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    rating: user.rating,
    location: user.location,
  };
}

export function createUser(input: {
  name: string;
  location: string;
  email: string;
  password: string;
}): PublicUser {
  const normalizedEmail = input.email.trim().toLowerCase();
  const newUser: AuthUserRecord = {
    id: nextId('u', users.length + 1000),
    name: input.name.trim(),
    rating: 0,
    location: input.location.trim(),
    email: normalizedEmail,
    password: input.password,
  };

  users.push(newUser);
  return {
    id: newUser.id,
    name: newUser.name,
    rating: newUser.rating,
    location: newUser.location,
  };
}

export function listTasks(): TaskRecord[] {
  return tasks.map(cloneTask);
}

export function getTaskById(taskId: string): TaskRecord | undefined {
  const task = tasks.find((entry) => entry.id === taskId);
  return task ? cloneTask(task) : undefined;
}

export function createTask(input: {
  title: string;
  description: string;
  location: string;
  price: number;
  scheduledAt: string;
  postedByUserId: string;
  postedByName: string;
}): TaskRecord {
  const task: TaskRecord = {
    id: nextId('t', tasks.length),
    postedByUserId: input.postedByUserId,
    postedByName: input.postedByName,
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location.trim(),
    price: input.price,
    distanceKm: 0,
    scheduledAt: input.scheduledAt,
    status: 'open',
  };

  tasks.unshift(task);
  return cloneTask(task);
}

export function acceptTask(taskId: string, acceptedByUserId: string): TaskRecord | null {
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) {
    return null;
  }

  task.status = 'accepted';
  task.acceptedByUserId = acceptedByUserId;
  return cloneTask(task);
}

export function listChats(): ChatRecord[] {
  return chats.map(cloneChat);
}

export function getChatById(chatId: string): ChatRecord | undefined {
  const chat = chats.find((entry) => entry.chatId === chatId);
  return chat ? cloneChat(chat) : undefined;
}

export function listMessages(chatId: string): MessageRecord[] {
  return messages.filter((message) => message.chatId === chatId).map(cloneMessage);
}

export function sendMessage(input: {
  chatId: string;
  taskId: string;
  senderId: string;
  text: string;
}): MessageRecord | null {
  const chat = chats.find((entry) => entry.chatId === input.chatId);
  if (!chat) {
    return null;
  }

  const message: MessageRecord = {
    id: nextId('m', messages.length + 5000),
    chatId: input.chatId,
    taskId: input.taskId,
    senderId: input.senderId,
    text: input.text.trim(),
    timestamp: new Date().toISOString(),
  };

  messages.push(message);
  chat.lastMessage = message;
  return cloneMessage(message);
}

export function parseVoiceTaskDraft(transcript: string): {
  title: string;
  description: string;
  location: string;
  price: number;
  scheduledAt: string;
} {
  const cleaned = transcript.trim();
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

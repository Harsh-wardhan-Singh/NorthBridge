const {handleApiRequest} = require('../../src/routes');

async function signupUser({name, location, email}) {
	const result = await handleApiRequest({
		method: 'POST',
		path: '/v1/auth/signup',
		body: {
			name,
			location,
			email,
			password: 'pass123',
		},
	});

	expect(result.status).toBe(201);
	return result.body.user;
}

async function listChatsForUser(userId) {
	return handleApiRequest({
		method: 'GET',
		path: '/v1/chats',
		headers: {'x-user-id': userId},
		body: {},
	});
}

describe('task acceptance lifecycle', () => {
	test('post -> accept -> message -> confirm -> completion -> rate updates task visibility and helper profile', async () => {
		const stamp = Date.now();
		const poster = await signupUser({
			name: 'Poster One',
			location: 'Delhi',
			email: `poster-one-${stamp}@northbridge.app`,
		});
		const helper = await signupUser({
			name: 'Helper One',
			location: 'Noida',
			email: `helper-one-${stamp}@northbridge.app`,
		});

		const createTask = await handleApiRequest({
			method: 'POST',
			path: '/v1/tasks',
			headers: {'x-user-id': poster.id},
			body: {
				title: 'Need package picked up',
				description: 'Collect a parcel from the front desk.',
				location: 'Delhi',
				price: 300,
				scheduledAt: new Date().toISOString(),
				executionMode: 'offline',
				postedByUserId: poster.id,
				postedByName: poster.name,
			},
		});

		expect(createTask.status).toBe(201);
		const taskId = createTask.body.task.id;

		const requestAccept = await handleApiRequest({
			method: 'POST',
			path: `/v1/tasks/${taskId}/accept`,
			headers: {'x-user-id': helper.id},
			body: {acceptedByUserId: helper.id},
		});

		expect(requestAccept.status).toBe(200);
		expect(requestAccept.body.task.pendingAcceptanceByUserId).toBe(helper.id);

		const helperChatsAfterAccept = await listChatsForUser(helper.id);
		expect(helperChatsAfterAccept.status).toBe(200);
		const taskChat = helperChatsAfterAccept.body.chats.find((chat) => chat.taskId === taskId);
		expect(taskChat).toBeTruthy();
		expect(taskChat.isClosed).toBe(false);

		const helperMessage = await handleApiRequest({
			method: 'POST',
			path: `/v1/chats/${taskChat.chatId}/messages`,
			headers: {'x-user-id': helper.id},
			body: {
				taskId,
				senderId: helper.id,
				text: 'I can handle this right away.',
			},
		});
		expect(helperMessage.status).toBe(201);

		const confirmAccept = await handleApiRequest({
			method: 'POST',
			path: `/v1/tasks/${taskId}/accept/confirm`,
			headers: {'x-user-id': poster.id},
			body: {ownerUserId: poster.id},
		});

		expect(confirmAccept.status).toBe(200);
		expect(confirmAccept.body.task.acceptedByUserId).toBe(helper.id);

		const openTasksAfterAccept = await handleApiRequest({
			method: 'GET',
			path: '/v1/tasks?status=open',
			body: {},
		});
		expect(openTasksAfterAccept.status).toBe(200);
		expect(openTasksAfterAccept.body.tasks.some((task) => task.id === taskId)).toBe(false);

		const helperHistoryOngoing = await handleApiRequest({
			method: 'GET',
			path: '/v1/tasks/history/me',
			headers: {'x-user-id': helper.id},
			body: {},
		});
		expect(helperHistoryOngoing.status).toBe(200);
		const helperOngoingTask = helperHistoryOngoing.body.tasks.find((task) => task.id === taskId);
		expect(helperOngoingTask).toBeTruthy();
		expect(helperOngoingTask.isActive).toBe(true);

		const requestCompletion = await handleApiRequest({
			method: 'POST',
			path: `/v1/tasks/${taskId}/completion/request`,
			headers: {'x-user-id': helper.id},
			body: {helperUserId: helper.id},
		});
		expect(requestCompletion.status).toBe(200);
		expect(requestCompletion.body.task.completionRequestedByUserId).toBe(helper.id);

		const confirmCompletion = await handleApiRequest({
			method: 'POST',
			path: `/v1/tasks/${taskId}/completion/confirm`,
			headers: {'x-user-id': poster.id},
			body: {ownerUserId: poster.id},
		});
		expect(confirmCompletion.status).toBe(200);
		expect(confirmCompletion.body.task.isActive).toBe(false);
		expect(confirmCompletion.body.task.isRatingPending).toBe(true);

		const submitRating = await handleApiRequest({
			method: 'POST',
			path: `/v1/tasks/${taskId}/rating`,
			headers: {'x-user-id': poster.id},
			body: {ownerUserId: poster.id, rating: 4},
		});
		expect(submitRating.status).toBe(200);
		expect(submitRating.body.task.isRatingPending).toBe(false);
		expect(submitRating.body.task.completionRating).toBe(4);

		const helperProfile = await handleApiRequest({
			method: 'GET',
			path: `/v1/users/${helper.id}`,
			body: {},
		});
		expect(helperProfile.status).toBe(200);
		expect(helperProfile.body.user.tasksDone).toBe(1);
		expect(helperProfile.body.user.rating).toBe(4);

		const helperHistoryPast = await handleApiRequest({
			method: 'GET',
			path: '/v1/tasks/history/me',
			headers: {'x-user-id': helper.id},
			body: {},
		});
		expect(helperHistoryPast.status).toBe(200);
		const helperPastTask = helperHistoryPast.body.tasks.find((task) => task.id === taskId);
		expect(helperPastTask).toBeTruthy();
		expect(helperPastTask.isActive).toBe(false);
		expect(helperPastTask.completedByUserId).toBe(helper.id);
	});

	test('denied acceptance closes chat for both users and blocks re-acceptance', async () => {
		const stamp = Date.now() + 1;
		const poster = await signupUser({
			name: 'Poster Two',
			location: 'Gurgaon',
			email: `poster-two-${stamp}@northbridge.app`,
		});
		const helper = await signupUser({
			name: 'Helper Two',
			location: 'Noida',
			email: `helper-two-${stamp}@northbridge.app`,
		});

		const createTask = await handleApiRequest({
			method: 'POST',
			path: '/v1/tasks',
			headers: {'x-user-id': poster.id},
			body: {
				title: 'Need groceries delivered',
				description: 'Pick up groceries from the store.',
				location: 'Gurgaon',
				price: 250,
				scheduledAt: new Date().toISOString(),
				executionMode: 'offline',
				postedByUserId: poster.id,
				postedByName: poster.name,
			},
		});

		expect(createTask.status).toBe(201);
		const taskId = createTask.body.task.id;

		const requestAccept = await handleApiRequest({
			method: 'POST',
			path: `/v1/tasks/${taskId}/accept`,
			headers: {'x-user-id': helper.id},
			body: {acceptedByUserId: helper.id},
		});
		expect(requestAccept.status).toBe(200);

		const helperChats = await listChatsForUser(helper.id);
		expect(helperChats.status).toBe(200);
		const taskChat = helperChats.body.chats.find((chat) => chat.taskId === taskId);
		expect(taskChat).toBeTruthy();

		const helperMessage = await handleApiRequest({
			method: 'POST',
			path: `/v1/chats/${taskChat.chatId}/messages`,
			headers: {'x-user-id': helper.id},
			body: {
				taskId,
				senderId: helper.id,
				text: 'Please consider my request.',
			},
		});
		expect(helperMessage.status).toBe(201);

		const declineAccept = await handleApiRequest({
			method: 'POST',
			path: `/v1/tasks/${taskId}/accept/decline`,
			headers: {'x-user-id': poster.id},
			body: {ownerUserId: poster.id},
		});
		expect(declineAccept.status).toBe(200);
		expect(declineAccept.body.task.pendingAcceptanceByUserId).toBeUndefined();

		const ownerChatsAfterDecline = await listChatsForUser(poster.id);
		const helperChatsAfterDecline = await listChatsForUser(helper.id);
		expect(ownerChatsAfterDecline.status).toBe(200);
		expect(helperChatsAfterDecline.status).toBe(200);

		const ownerTaskChat = ownerChatsAfterDecline.body.chats.find((chat) => chat.taskId === taskId);
		const helperTaskChat = helperChatsAfterDecline.body.chats.find((chat) => chat.taskId === taskId);
		expect(ownerTaskChat).toBeTruthy();
		expect(helperTaskChat).toBeTruthy();
		expect(ownerTaskChat.isClosed).toBe(true);
		expect(helperTaskChat.isClosed).toBe(true);

		const helperChatMessages = await handleApiRequest({
			method: 'GET',
			path: `/v1/chats/${taskChat.chatId}/messages`,
			headers: {'x-user-id': helper.id},
			body: {},
		});
		expect(helperChatMessages.status).toBe(200);
		expect(helperChatMessages.body.chat.isClosed).toBe(true);

		const retryAccept = await handleApiRequest({
			method: 'POST',
			path: `/v1/tasks/${taskId}/accept`,
			headers: {'x-user-id': helper.id},
			body: {acceptedByUserId: helper.id},
		});
		expect(retryAccept.status).toBe(409);
		expect(retryAccept.body.message).toBe('Task owner already declined this chat request.');
	});
});

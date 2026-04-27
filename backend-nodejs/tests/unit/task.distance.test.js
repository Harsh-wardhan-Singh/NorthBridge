describe('task.service distance integration', () => {
	beforeEach(() => {
		jest.resetModules();
	});

	test('fetchTasks computes distanceKm from acceptor coordinates and task locationGeo', async () => {
		jest.doMock('../../src/repositories/task.repository', () => ({
			listTasks: async () => [
				{
					id: 't_near',
					title: 'Near task',
					description: 'Walkable task',
					location: 'Nearby',
					price: 100,
					distanceKm: 0,
					locationGeo: {lat: 28.6139, lng: 77.209},
					scheduledAt: '2026-04-27T10:00:00.000Z',
					executionMode: 'offline',
					isActive: true,
					postedByUserId: 'u_owner',
					postedByName: 'Owner',
				},
				{
					id: 't_far',
					title: 'Far task',
					description: 'Farther task',
					location: 'Far away',
					price: 120,
					distanceKm: 0,
					locationGeo: {lat: 28.7041, lng: 77.1025},
					scheduledAt: '2026-04-27T10:00:00.000Z',
					executionMode: 'offline',
					isActive: true,
					postedByUserId: 'u_owner',
					postedByName: 'Owner',
				},
			],
			getTaskById: async () => null,
			createTask: async () => null,
			requestTaskAcceptance: async () => null,
			confirmTaskAcceptance: async () => null,
			declineTaskAcceptance: async () => null,
			requestTaskCompletion: async () => null,
			confirmTaskCompletion: async () => null,
			declineTaskCompletion: async () => null,
			submitTaskRating: async () => null,
			cancelTask: async () => null,
		}));

		jest.doMock('../../src/repositories/chat.repository', () => ({
			getChatByTaskAndUsers: async () => null,
			createChat: async () => null,
			updateChat: async () => null,
			updateChatLastMessage: async () => null,
		}));
		jest.doMock('../../src/repositories/message.repository', () => ({
			createMessage: async () => null,
		}));
		jest.doMock('../../src/repositories/user.repository', () => ({
			syncUserTaskStats: async () => null,
		}));
		jest.doMock('../../src/validators/task.validator', () => ({
			validateCreateTaskPayload: () => ({valid: true, value: {}}),
			validateAcceptTaskPayload: () => ({valid: true, value: {}}),
			validateRequestTaskCompletionPayload: () => ({valid: true, value: {}}),
			validateTaskOwnerPayload: () => ({valid: true, value: {}}),
			validateSubmitTaskRatingPayload: () => ({valid: true, value: {}}),
			validateTaskListPayload: (payload) => ({valid: true, value: payload}),
		}));
		jest.doMock('../../src/services/event.service', () => ({
			notifyNewMessage: async () => {},
			notifyTaskCreated: async () => {},
			notifyTaskAcceptanceRequested: async () => {},
			notifyTaskAccepted: async () => {},
			notifyTaskAcceptanceDeclined: async () => {},
			notifyTaskCompletionRequested: async () => {},
			notifyTaskCompleted: async () => {},
			notifyTaskCompletionDeclined: async () => {},
			notifyTaskCancelled: async () => {},
		}));

		const taskService = require('../../src/services/task.service');
		const result = await taskService.fetchTasks({
			sortBy: 'distance',
			acceptorLat: 28.6139,
			acceptorLng: 77.209,
		});

		expect(result.ok).toBe(true);
		expect(result.data).toHaveLength(2);
		expect(result.data[0].id).toBe('t_near');
		expect(result.data[0].distanceKm).toBe(0);
		expect(result.data[1].id).toBe('t_far');
		expect(result.data[1].distanceKm).toBeGreaterThan(0);
	});
});

const {initializeFirebaseAdmin} = require('../../src/config/firebase');

describe('Firestore client pagination', () => {
	test('listCollection returns every document across paginated Firestore responses', async () => {
		const client = initializeFirebaseAdmin({
			firebaseProjectId: 'northbridge-test',
			firebaseCredentialsJson: JSON.stringify({
				project_id: 'northbridge-test',
				client_email: 'test@northbridge.local',
				private_key: 'not-used',
				private_key_id: 'test-key',
			}),
			enableFirebaseEmulator: true,
			firestoreEmulatorHost: '127.0.0.1:8080',
		});

		const requestSpy = jest
			.spyOn(client, '_request')
			.mockResolvedValueOnce({
				documents: [
					{
						name: 'projects/northbridge-test/databases/(default)/documents/tasks/t_001',
						fields: {
							title: {stringValue: 'Task 1'},
						},
					},
				],
				nextPageToken: 'page-2',
			})
			.mockResolvedValueOnce({
				documents: [
					{
						name: 'projects/northbridge-test/databases/(default)/documents/tasks/t_002',
						fields: {
							title: {stringValue: 'Task 2'},
						},
					},
				],
			});

		const docs = await client.listCollection('tasks');

		expect(docs).toEqual([
			{id: 't_001', title: 'Task 1'},
			{id: 't_002', title: 'Task 2'},
		]);
		expect(requestSpy).toHaveBeenCalledTimes(2);
		expect(requestSpy.mock.calls[0][1]).toContain('/documents/tasks?pageSize=1000');
		expect(requestSpy.mock.calls[1][1]).toContain('pageToken=page-2');

		requestSpy.mockRestore();
	});
});

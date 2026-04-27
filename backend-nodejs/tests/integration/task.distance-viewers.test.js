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

describe('task distance with viewer-specific locations', () => {
	test('one poster and two viewers see different distances based on their own locations', async () => {
		const stamp = Date.now();
		const poster = await signupUser({
			name: 'Kamla Nagar Poster',
			location: 'Kamla Nagar, Delhi',
			email: `poster-distance-${stamp}@northbridge.app`,
		});
		const noidaViewer = await signupUser({
			name: 'Noida Viewer',
			location: 'Noida',
			email: `noida-distance-${stamp}@northbridge.app`,
		});
		const gurugramViewer = await signupUser({
			name: 'Gurugram Viewer',
			location: 'Gurugram',
			email: `gurugram-distance-${stamp}@northbridge.app`,
		});

		const createTask = await handleApiRequest({
			method: 'POST',
			path: '/v1/tasks',
			headers: {'x-user-id': poster.id},
			body: {
				title: 'Deliver notebooks',
				description: 'Drop off notebooks near the market.',
				location: 'Kamla Nagar, Delhi',
				price: 180,
				scheduledAt: new Date().toISOString(),
				executionMode: 'offline',
				postedByUserId: poster.id,
				postedByName: poster.name,
			},
		});

		expect(createTask.status).toBe(201);
		expect(createTask.body.task.locationGeo).toBeTruthy();
		const taskId = createTask.body.task.id;

		const noidaTasks = await handleApiRequest({
			method: 'GET',
			path: '/v1/tasks?status=open&sortBy=distance',
			headers: {'x-user-id': noidaViewer.id},
			body: {},
		});
		expect(noidaTasks.status).toBe(200);
		const noidaTask = noidaTasks.body.tasks.find((task) => task.id === taskId);
		expect(noidaTask).toBeTruthy();
		expect(noidaTask.distanceKm).toBeGreaterThan(0);
		expect(noidaTask.locationGeo).toBeTruthy();

		const gurugramTasks = await handleApiRequest({
			method: 'GET',
			path: '/v1/tasks?status=open&sortBy=distance',
			headers: {'x-user-id': gurugramViewer.id},
			body: {},
		});
		expect(gurugramTasks.status).toBe(200);
		const gurugramTask = gurugramTasks.body.tasks.find((task) => task.id === taskId);
		expect(gurugramTask).toBeTruthy();
		expect(gurugramTask.distanceKm).toBeGreaterThan(0);

		expect(noidaTask.distanceKm).not.toBe(gurugramTask.distanceKm);
		expect(noidaTask.distanceKm).toBeLessThan(gurugramTask.distanceKm);

		const noidaDetail = await handleApiRequest({
			method: 'GET',
			path: `/v1/tasks/${taskId}`,
			headers: {'x-user-id': noidaViewer.id},
			body: {},
		});
		const gurugramDetail = await handleApiRequest({
			method: 'GET',
			path: `/v1/tasks/${taskId}`,
			headers: {'x-user-id': gurugramViewer.id},
			body: {},
		});

		expect(noidaDetail.status).toBe(200);
		expect(gurugramDetail.status).toBe(200);
		expect(noidaDetail.body.task.distanceKm).toBe(noidaTask.distanceKm);
		expect(gurugramDetail.body.task.distanceKm).toBe(gurugramTask.distanceKm);
	});
});

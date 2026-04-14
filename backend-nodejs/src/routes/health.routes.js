const healthRoutes = [
	{
		method: 'GET',
		path: '/v1/health',
		execute: () => ({
			status: 200,
			body: {
				status: 'ok',
			},
		}),
	},
];

module.exports = {
	healthRoutes,
};

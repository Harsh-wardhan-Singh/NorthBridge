const {createFirebaseAdminConfig, hasFirestoreConnection} = require('../config/firebase');
const {getAuthDiagnostics} = require('../middlewares/auth.middleware');
const {envConfig} = require('../config/env');
const pkg = require('../../package.json');

const buildVersion = typeof pkg.version === 'string' ? pkg.version : '0.0.0';

const healthRoutes = [
	{
		method: 'GET',
		path: '/health',
		execute: () => {
			return {
				status: 200,
				body: {
					status: 'ok',
				},
			};
		},
	},
	{
		method: 'HEAD',
		path: '/health',
		execute: () => ({
			status: 200,
			body: null,
		}),
	},
	{
		method: 'GET',
		path: '/v1/health',
		execute: () => {
			const authDiagnostics = getAuthDiagnostics();
			return {
				status: 200,
				body: {
					status: 'ok',
					authMode: authDiagnostics.mode,
					auth: authDiagnostics,
					buildVersion,
					firestore: {
						configured: createFirebaseAdminConfig().configured,
						connected: hasFirestoreConnection(),
					},
					voice: {
						aiMode: envConfig.voiceAiMode,
					},
				},
			};
		},
	},
	{
		method: 'HEAD',
		path: '/v1/health',
		execute: () => ({
			status: 200,
			body: null,
		}),
	},
];

module.exports = {
	healthRoutes,
};

const {getEnvConfig} = require('./env');

function isFirebaseConfigured(env = getEnvConfig()) {
	return Boolean(env.firebaseProjectId || env.firebaseAppId);
}

function getFirebaseConfig(env = getEnvConfig()) {
	return {
		projectId: env.firebaseProjectId || null,
		databaseURL: env.firebaseDatabaseURL || null,
		storageBucket: env.firebaseStorageBucket || null,
		appId: env.firebaseAppId || null,
		enableEmulator: Boolean(env.enableFirebaseEmulator),
	};
}

function createFirebaseAdminConfig(env = getEnvConfig()) {
	return {
		configured: isFirebaseConfigured(env),
		config: getFirebaseConfig(env),
	};
}

module.exports = {
	isFirebaseConfigured,
	getFirebaseConfig,
	createFirebaseAdminConfig,
};

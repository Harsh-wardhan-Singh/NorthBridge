const {createAppHandler} = require('./app');
const {handleApiRequest, listAvailableRoutes, routes} = require('./routes');
const {envConfig, getEnvConfig} = require('./config/env');

module.exports = {
	createAppHandler,
	handleApiRequest,
	listAvailableRoutes,
	routes,
	envConfig,
	getEnvConfig,
};

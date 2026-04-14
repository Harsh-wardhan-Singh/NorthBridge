const {listUsersController} = require('../controllers/user.controller');

const userRoutes = [
	{
		method: 'GET',
		path: '/v1/users',
		execute: () => listUsersController(),
	},
];

module.exports = {
	userRoutes,
};

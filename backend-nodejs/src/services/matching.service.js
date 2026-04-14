const {listPublicUsers} = require('../repositories/user.repository');

function normalize(value) {
	return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isNearby(taskLocation, userLocation) {
	const task = normalize(taskLocation);
	const user = normalize(userLocation);
	if (!task || !user) {
		return false;
	}

	return task.includes(user) || user.includes(task);
}

function createReason(user, task) {
	if (isNearby(task.location, user.location)) {
		return `Location match near ${user.location}`;
	}

	if (user.rating >= 4.7) {
		return 'High-rated helper candidate';
	}

	return 'General helper candidate';
}

function findTaskCandidates(task, limit = 3) {
	return listPublicUsers()
		.filter((user) => user.id !== task.postedByUserId)
		.sort((a, b) => b.rating - a.rating)
		.slice(0, Math.max(1, limit))
		.map((user) => ({
			userId: user.id,
			name: user.name,
			rating: user.rating,
			reason: createReason(user, task),
		}));
}

module.exports = {
	normalize,
	isNearby,
	createReason,
	findTaskCandidates,
};

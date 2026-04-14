import {
	listPublicUsers,
	type PublicUser,
	type TaskRecord,
} from '../../../mock-data/seed-data';

export type MatchingCandidate = {
	userId: string;
	name: string;
	rating: number;
	reason: string;
};

function normalize(value: string): string {
	return value.trim().toLowerCase();
}

function isNearby(taskLocation: string, userLocation: string): boolean {
	const task = normalize(taskLocation);
	const user = normalize(userLocation);

	if (!task || !user) {
		return false;
	}

	return task.includes(user) || user.includes(task);
}

function createReason(user: PublicUser, task: TaskRecord): string {
	if (isNearby(task.location, user.location)) {
		return `Location match near ${user.location}`;
	}

	if (user.rating >= 4.7) {
		return 'High-rated helper candidate';
	}

	return 'General helper candidate';
}

export function findTaskCandidates(task: TaskRecord, limit = 3): MatchingCandidate[] {
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


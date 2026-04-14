const seedData = require('../mock-data/seed-data');

function printSeedSummary() {
	const summary = {
		users: seedData.users.length,
		tasks: seedData.tasks.length,
		messages: seedData.messages.length,
		chats: seedData.chats.length,
	};

	process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
	return summary;
}

if (require.main === module) {
	printSeedSummary();
}

module.exports = {
	seedData,
	printSeedSummary,
};

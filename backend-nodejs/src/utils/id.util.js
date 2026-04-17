const {randomUUID} = require('crypto');

function buildPrefixedId(prefix) {
	return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

module.exports = {
	buildPrefixedId,
};

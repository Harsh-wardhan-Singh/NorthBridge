const {parseVoiceTaskController} = require('../controllers/voice.controller');

const voiceRoutes = [
	{
		method: 'POST',
		path: '/v1/voice/parse-task',
		execute: (_params, body) =>
			parseVoiceTaskController({
				transcript: typeof body.transcript === 'string' ? body.transcript : undefined,
			}),
	},
];

module.exports = {
	voiceRoutes,
};

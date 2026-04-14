const http = require('http');
const {createAppHandler} = require('./app');
const {envConfig} = require('./config/env');

function startServer(options = {}) {
	const port = Number.isFinite(options.port) ? options.port : envConfig.port;
	const host = typeof options.host === 'string' && options.host.trim() ? options.host : '0.0.0.0';
	const appHandler = typeof options.handler === 'function' ? options.handler : createAppHandler();

	const server = http.createServer((req, res) => {
		Promise.resolve(appHandler(req, res)).catch(() => {
			res.statusCode = 500;
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			res.end(JSON.stringify({message: 'Internal server error.'}));
		});
	});

	return new Promise((resolve) => {
		server.listen(port, host, () => {
			resolve({server, port, host});
		});
	});
}

if (require.main === module) {
	startServer().then(({port, host}) => {
		process.stdout.write(`NorthBridge backend listening on http://${host}:${port}\n`);
	});
}

module.exports = {
	startServer,
};

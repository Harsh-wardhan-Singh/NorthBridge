const http = require('http');
const WebSocket = require('ws');
const websocketService = require('./services/websocket.service');
const authMiddleware = require('./middlewares/auth.middleware');
const {createAppHandler} = require('./app');
const {envConfig} = require('./config/env');

const initializeFirebaseAuth =
	authMiddleware && typeof authMiddleware.initializeFirebaseAuth === 'function'
		? authMiddleware.initializeFirebaseAuth
		: () => false;

const firebaseInitOk = initializeFirebaseAuth();
if (!firebaseInitOk) {
	console.warn('Firebase admin failed to initialize. WebSocket auth may be unavailable.');
}

function startServer(options = {}) {
	const port = Number.isFinite(options.port) ? options.port : envConfig.port;
	const host =
		typeof options.host === 'string' && options.host.trim()
			? options.host
			: '0.0.0.0';

	const appHandler =
		typeof options.handler === 'function'
			? options.handler
			: createAppHandler();

	const server = http.createServer((req, res) => {
		Promise.resolve(appHandler(req, res)).catch(() => {
			res.statusCode = 500;
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			res.end(JSON.stringify({message: 'Internal server error.'}));
		});
	});

	const wss = new WebSocket.Server({server});

	wss.on('connection', async (ws, req) => {
		try {
			const url = new URL(req.url, 'http://localhost');
			const token = url.searchParams.get('token');

			let userId;
			const wsAuthAvailable = Boolean(firebaseInitOk);

			if (token) {
				if (wsAuthAvailable) {
					try {
						const decoded = await authMiddleware.verifyIdToken(token);
						userId = decoded.uid;
					} catch (err) {
						console.log('Invalid token:', err.message || err);
						ws.close();
						return;
					}
				} else {
					if (process.env.ALLOW_WS_AUTH_OVERRIDE !== 'true') {
						console.log('Firebase unavailable for token verification');
						ws.close();
						return;
					}

					userId = token;
					console.log('WS token override used while Firebase is unavailable:', userId);
				}
			} else {
				const override = url.searchParams.get('x-user-id');
				if (override) {
					userId = override;
					console.log('WS auth override used for user:', userId);
				} else {
					console.log('Missing token');
					ws.close();
					return;
				}
			}

			ws.userId = userId;
			ws.isAlive = true;
			ws.on('pong', () => {
				ws.isAlive = true;
			});

			console.log(`Connected: ${userId}`);

			ws.send(
				JSON.stringify({
					type: 'CONNECTED',
					data: {userId},
				})
			);

			ws.on('message', (message) => {
				console.log(`Message from ${userId}:`, message.toString());
			});

			ws.on('close', () => {
				console.log(`Disconnected: ${userId}`);
			});
		} catch (err) {
			console.log('WS connection error:', err.message || err);
			ws.close();
		}
	});

	const heartbeatInterval = setInterval(() => {
		wss.clients.forEach((ws) => {
			if (ws.isAlive === false) {
				console.log(`Terminating stale socket for ${ws.userId}`);
				return ws.terminate();
			}

			ws.isAlive = false;
			ws.ping();
		});
	}, 30000);

	wss.on('close', () => {
		clearInterval(heartbeatInterval);
	});

	websocketService.setServer(wss);

	function stop() {
		clearInterval(heartbeatInterval);
		websocketService.setServer(null);
		for (const client of wss.clients) {
			client.terminate();
		}

		return new Promise((resolve, reject) => {
			wss.close((wssError) => {
				server.close((serverError) => {
					const error = wssError || serverError;
					if (error && error.code !== 'ERR_SERVER_NOT_RUNNING') {
						reject(error);
						return;
					}

					resolve();
				});
			});
		});
	}

	return new Promise((resolve) => {
		server.listen(port, host, () => {
			const address = server.address();
			const actualPort = address && typeof address === 'object' ? address.port : port;
			resolve({server, wss, port: actualPort, host, stop});
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

const http = require('http');
const WebSocket = require('ws');
const admin = require('firebase-admin');
const { createAppHandler } = require('./app');
const { envConfig } = require('./config/env');

// 🔥 Initialize Firebase Admin
if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.applicationDefault(),
	});
}

// WebSocket utilities (exported)
let websocketUtils = {
	broadcast: () => {},
	sendToUser: () => {},
};

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
			res.end(JSON.stringify({ message: 'Internal server error.' }));
		});
	});

	// 🔌 =========================
	// 🔌 WEBSOCKET SETUP (SECURE + STABLE)
	// 🔌 =========================
	const wss = new WebSocket.Server({ server });

	wss.on('connection', async (ws, req) => {
		try {
			const url = new URL(req.url, 'http://localhost');
			const token = url.searchParams.get('token');

			if (!token) {
				console.log('❌ Missing token');
				ws.close();
				return;
			}

			// 🔥 VERIFY TOKEN
			const decoded = await admin.auth().verifyIdToken(token);
			const userId = decoded.uid;

			ws.userId = userId;

			// 🔥 HEARTBEAT INIT
			ws.isAlive = true;
			ws.on('pong', () => {
				ws.isAlive = true;
			});

			console.log(`🔌 Connected: ${userId}`);

			// Optional: confirm connection
			ws.send(
				JSON.stringify({
					type: 'CONNECTED',
					data: { userId },
				})
			);

			ws.on('message', (message) => {
				console.log(`📩 ${userId}:`, message.toString());
			});

			ws.on('close', () => {
				console.log(`❌ Disconnected: ${userId}`);
			});
		} catch (err) {
			console.log('❌ Invalid token:', err.message);
			ws.close();
		}
	});

	// 🔥 HEARTBEAT LOOP (kill dead clients)
	const interval = setInterval(() => {
		wss.clients.forEach((ws) => {
			if (ws.isAlive === false) {
				console.log(`💀 Terminating: ${ws.userId}`);
				return ws.terminate();
			}

			ws.isAlive = false;
			ws.ping();
		});
	}, 30000);

	wss.on('close', () => {
		clearInterval(interval);
	});

	// 🔥 Send to ALL
	websocketUtils.broadcast = function (data) {
		const msg = JSON.stringify(data);
		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(msg);
			}
		});
	};

	// 🔥 Send to ONE
	websocketUtils.sendToUser = function (userId, data) {
		const msg = JSON.stringify(data);
		wss.clients.forEach((client) => {
			if (
				client.readyState === WebSocket.OPEN &&
				client.userId === userId
			) {
				client.send(msg);
			}
		});
	};

	// 🔌 =========================

	return new Promise((resolve) => {
		server.listen(port, host, () => {
			resolve({ server, port, host });
		});
	});
}

if (require.main === module) {
	startServer().then(({ port, host }) => {
		process.stdout.write(
			`NorthBridge backend listening on http://${host}:${port}\n`
		);
	});
}

module.exports = {
	startServer,
	websocketUtils,
};
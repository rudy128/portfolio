import { DurableObject } from 'cloudflare:workers';

const PRESENCE_PATH = '/presence';

function allowedOrigins(value: string): Set<string> {
	return new Set(value.split(',').map((origin) => origin.trim()).filter(Boolean));
}

function errorResponse(message: string, status: number): Response {
	return Response.json({ error: message }, { status });
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/health') {
			return Response.json({ ok: true });
		}

		if (url.pathname !== PRESENCE_PATH) {
			return errorResponse('Not found', 404);
		}

		if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
			return errorResponse('WebSocket upgrade required', 426);
		}

		const origin = request.headers.get('Origin');
		if (!origin || !allowedOrigins(env.ALLOWED_ORIGINS).has(origin)) {
			return errorResponse('Origin not allowed', 403);
		}

		try {
			return await env.PRESENCE.getByName('portfolio').fetch(request);
		} catch (error) {
			console.error(JSON.stringify({
				message: 'Presence connection failed',
				error: error instanceof Error ? error.message : String(error),
			}));
			return errorResponse('Presence service unavailable', 503);
		}
	},
} satisfies ExportedHandler<Env>;

export class Presence extends DurableObject<Env> {
	async fetch(request: Request): Promise<Response> {
		if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
			return errorResponse('WebSocket upgrade required', 426);
		}

		const [client, server] = Object.values(new WebSocketPair());
		this.ctx.acceptWebSocket(server);
		this.broadcastCount();

		return new Response(null, { status: 101, webSocket: client });
	}

	webSocketClose(socket: WebSocket): void {
		this.broadcastCount(socket);
	}

	webSocketError(socket: WebSocket): void {
		socket.close(1011, 'WebSocket error');
		this.broadcastCount(socket);
	}

	private broadcastCount(exclude?: WebSocket): void {
		const sockets = this.ctx.getWebSockets().filter((socket) => (
			socket !== exclude && socket.readyState === WebSocket.OPEN
		));
		const message = JSON.stringify({ type: 'presence', active: sockets.length });

		for (const socket of sockets) {
			try {
				socket.send(message);
			} catch (error) {
				console.error(JSON.stringify({
					message: 'Presence broadcast failed',
					error: error instanceof Error ? error.message : String(error),
				}));
				socket.close(1011, 'Broadcast failed');
			}
		}
	}
}

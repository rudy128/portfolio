import { DurableObject } from 'cloudflare:workers';

const PRESENCE_PATH = '/presence';
const CITY_HEADER = 'X-Presence-City';
const COUNTRY_HEADER = 'X-Presence-Country';

type SocketLocation = {
	city: string;
	country: string;
};

type PresenceLocation = SocketLocation & {
	active: number;
};

function cleanLocationPart(value: unknown, maxLength: number): string {
	return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function requestLocation(request: Request): SocketLocation {
	return {
		city: cleanLocationPart(request.cf?.city, 80),
		country: cleanLocationPart(request.cf?.country, 2).toUpperCase(),
	};
}

function requestWithLocation(request: Request, location: SocketLocation): Request {
	const headers = new Headers(request.headers);
	headers.set(CITY_HEADER, location.city);
	headers.set(COUNTRY_HEADER, location.country);
	return new Request(request, { headers });
}

function attachedLocation(socket: WebSocket): SocketLocation {
	const attachment: unknown = socket.deserializeAttachment();
	if (!attachment || typeof attachment !== 'object') return { city: '', country: '' };

	const location = attachment as Record<string, unknown>;
	return {
		city: cleanLocationPart(location.city, 80),
		country: cleanLocationPart(location.country, 2).toUpperCase(),
	};
}

function aggregateLocations(sockets: WebSocket[]): PresenceLocation[] {
	const grouped = new Map<string, PresenceLocation>();

	for (const socket of sockets) {
		const location = attachedLocation(socket);
		const key = `${location.city}\u0000${location.country}`;
		const current = grouped.get(key);
		if (current) {
			current.active += 1;
		} else {
			grouped.set(key, { ...location, active: 1 });
		}
	}

	return [...grouped.values()].sort((left, right) => (
		right.active - left.active
		|| (left.city || left.country).localeCompare(right.city || right.country)
	));
}

function matchesOriginPattern(origin: string, pattern: string): boolean {
	const segments = pattern.split('*');
	if (segments.length === 1) return origin === pattern;
	if (segments.length !== 2) return false;

	const [prefix, suffix] = segments;
	const wildcard = origin.slice(prefix.length, origin.length - suffix.length);
	return origin.startsWith(prefix)
		&& origin.endsWith(suffix)
		&& /^[a-z0-9-]+$/i.test(wildcard);
}

function isAllowedOrigin(value: string, configuredOrigins: string): boolean {
	let origin: string;
	try {
		origin = new URL(value).origin;
	} catch {
		return false;
	}

	return configuredOrigins
		.split(',')
		.map((pattern) => pattern.trim())
		.filter(Boolean)
		.some((pattern) => matchesOriginPattern(origin, pattern));
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
		if (!origin || !isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
			return errorResponse('Origin not allowed', 403);
		}

		try {
			const location = requestLocation(request);
			return await env.PRESENCE.getByName('portfolio').fetch(requestWithLocation(request, location));
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
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		ctx.blockConcurrencyWhile(async () => {
			this.ctx.storage.sql.exec(`
				CREATE TABLE IF NOT EXISTS counters (
					name TEXT PRIMARY KEY,
					value INTEGER NOT NULL
				);
				INSERT OR IGNORE INTO counters (name, value) VALUES ('visitors', 0);
			`);
		});
	}

	async fetch(request: Request): Promise<Response> {
		if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
			return errorResponse('WebSocket upgrade required', 426);
		}

		const totalVisitors = this.ctx.storage.sql
			.exec<{ value: number }>(`
				UPDATE counters
				SET value = value + 1
				WHERE name = 'visitors'
				RETURNING value
			`)
			.one().value;

		const [client, server] = Object.values(new WebSocketPair());
		server.serializeAttachment({
			city: cleanLocationPart(request.headers.get(CITY_HEADER), 80),
			country: cleanLocationPart(request.headers.get(COUNTRY_HEADER), 2).toUpperCase(),
		} satisfies SocketLocation);
		this.ctx.acceptWebSocket(server);
		this.broadcastPresence(undefined, totalVisitors);

		return new Response(null, { status: 101, webSocket: client });
	}

	webSocketClose(socket: WebSocket): void {
		this.broadcastPresence(socket);
	}

	webSocketError(socket: WebSocket): void {
		socket.close(1011, 'WebSocket error');
		this.broadcastPresence(socket);
	}

	private broadcastPresence(exclude?: WebSocket, totalVisitors = this.totalVisitors()): void {
		const sockets = this.ctx.getWebSockets().filter((socket) => (
			socket !== exclude && socket.readyState === WebSocket.OPEN
		));
		const message = JSON.stringify({
			type: 'presence',
			totalVisitors,
			active: sockets.length,
			locations: aggregateLocations(sockets),
		});

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

	private totalVisitors(): number {
		return this.ctx.storage.sql
			.exec<{ value: number }>("SELECT value FROM counters WHERE name = 'visitors'")
			.one().value;
	}
}

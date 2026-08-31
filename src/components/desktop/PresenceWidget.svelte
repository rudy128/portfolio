<script lang="ts">
	import { onMount } from 'svelte';
	import type { MapCountry } from '../../lib/worldMap';

	export let endpoint: string;

	type ConnectionState = 'unconfigured' | 'connecting' | 'connected' | 'reconnecting';
	type PresenceLocation = { city: string; country: string; active: number };
	type PresenceMessage = { type: 'presence'; totalVisitors: number; active: number; locations: PresenceLocation[] };
	type MapLoadState = 'idle' | 'loading' | 'ready' | 'error';

	let totalVisitors: number | null = null;
	let activeConnections: number | null = null;
	let activeLocations: PresenceLocation[] = [];
	let connectionState: ConnectionState = endpoint ? 'connecting' : 'unconfigured';
	let mapCountries: MapCountry[] = [];
	let mapLoadState: MapLoadState = 'idle';

	async function loadWorldMap(): Promise<void> {
		if (mapLoadState !== 'idle') return;
		mapLoadState = 'loading';

		try {
			const { buildWorldMap } = await import('../../lib/worldMap');
			mapCountries = buildWorldMap();
			mapLoadState = 'ready';
		} catch {
			mapLoadState = 'error';
		}
	}

	function isPresenceLocation(value: unknown): value is PresenceLocation {
		if (!value || typeof value !== 'object') return false;
		const location = value as Record<string, unknown>;
		return typeof location.city === 'string'
			&& typeof location.country === 'string'
			&& typeof location.active === 'number'
			&& Number.isInteger(location.active)
			&& location.active > 0;
	}

	function isPresenceMessage(value: unknown): value is PresenceMessage {
		if (!value || typeof value !== 'object') return false;
		const message = value as Record<string, unknown>;
		return message.type === 'presence'
			&& typeof message.totalVisitors === 'number'
			&& Number.isInteger(message.totalVisitors)
			&& message.totalVisitors >= 0
			&& typeof message.active === 'number'
			&& Number.isInteger(message.active)
			&& message.active >= 0
			&& message.totalVisitors >= message.active
			&& Array.isArray(message.locations)
			&& message.locations.every(isPresenceLocation);
	}

	onMount(() => {
		if (!endpoint) {
			connectionState = 'unconfigured';
			return;
		}

		let socket: WebSocket | undefined;
		let reconnectTimer: number | undefined;
		let reconnectDelay = 1000;
		let stopped = false;

		function connect() {
			if (stopped) return;
			connectionState = activeConnections === null ? 'connecting' : 'reconnecting';
			socket = new WebSocket(endpoint);

			socket.addEventListener('open', () => {
				connectionState = 'connected';
				reconnectDelay = 1000;
			});

			socket.addEventListener('message', (event) => {
				try {
					const message: unknown = JSON.parse(String(event.data));
					if (isPresenceMessage(message)) {
						totalVisitors = message.totalVisitors;
						activeConnections = message.active;
						activeLocations = message.locations;
						if (message.locations.some((location) => location.country)) void loadWorldMap();
					}
				} catch {
					// Ignore malformed frames and keep the last valid count.
				}
			});

			socket.addEventListener('error', () => socket?.close());
			socket.addEventListener('close', () => {
				if (stopped) return;
				connectionState = 'reconnecting';
				reconnectTimer = window.setTimeout(connect, reconnectDelay);
				reconnectDelay = Math.min(reconnectDelay * 2, 15_000);
			});
		}

		connect();

		return () => {
			stopped = true;
			if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
			socket?.close(1000, 'Portfolio closed');
		};
	});

	$: stateLabel = connectionState === 'connected'
		? 'live'
		: connectionState === 'unconfigured'
			? 'not configured'
			: connectionState;
	$: activeCountryCodes = new Set(activeLocations.map((location) => location.country));
	$: activeCountryNames = mapCountries
		.filter((country) => activeCountryCodes.has(country.code))
		.map((country) => country.name)
		.join(', ');
</script>

<section class="presence-widget" aria-labelledby="presence-title">
	<header>
		<span class="presence-title"><i aria-hidden="true"></i><strong id="presence-title">Visitor locations</strong></span>
		<span class:connected={connectionState === 'connected'} class="connection-state"><i></i>{stateLabel}</span>
	</header>
	{#if activeLocations.length > 0}
		<div class="map-panel">
			{#if mapLoadState === 'ready'}
				<svg class="world-map" viewBox="0 5 360 150" role="img" aria-label={`Active countries: ${activeCountryNames || 'unknown'}`}>
					{#each mapCountries as country}
						<path
							class:active={activeCountryCodes.has(country.code)}
							d={country.path}
							aria-hidden="true"
						/>
					{/each}
				</svg>
			{:else if mapLoadState === 'error'}
				<span class="map-error">Map unavailable</span>
			{:else}
				<div class="map-loading" aria-label="Loading active country map"><i></i><i></i><i></i></div>
			{/if}
		</div>
	{/if}
	<div class="visitor-metrics" aria-live="polite">
		<div class="visitor-metric">
			<strong>{totalVisitors ?? '—'}</strong>
			<small>{totalVisitors === 1 ? 'total visitor' : 'total visitors'}</small>
		</div>
		<i class="metric-divider" aria-hidden="true"></i>
		<div class="visitor-metric">
			<strong>{activeConnections ?? '—'}</strong>
			<small>{activeConnections === 1 ? 'active visitor' : 'active visitors'}</small>
		</div>
	</div>
</section>

<style>
	.presence-widget { padding: clamp(1rem, calc(0.75rem + 0.35vw), 1.35rem); border: 1px solid rgb(255 255 255 / 0.16); border-radius: 0.72rem; background: var(--glass-dark, rgb(20 20 18 / 0.75)); box-shadow: var(--glass-shadow, 0 0.8rem 2rem rgb(0 0 0 / 0.34)); color: #dedbd1; -webkit-backdrop-filter: var(--glass-filter, blur(22px) saturate(135%)); backdrop-filter: var(--glass-filter, blur(22px) saturate(135%)); }
	header, .presence-title, .connection-state, .visitor-metric { display: flex; align-items: center; }
	header { justify-content: space-between; gap: 0.8rem; }
	.presence-title { gap: 0.48rem; min-width: 0; }
	.presence-title > i { position: relative; width: 0.82rem; height: 0.82rem; flex: none; border: 1px solid #7892a3; border-left-color: transparent; border-radius: 50%; transform: rotate(-32deg); }
	.presence-title > i::after { position: absolute; top: 0.11rem; right: 0.02rem; width: 0.18rem; height: 0.18rem; border-radius: 50%; background: #9fb5c2; box-shadow: 0 0 0.35rem rgb(159 181 194 / 0.65); content: ''; }
	.presence-title strong { overflow: hidden; font-size: clamp(0.86rem, calc(0.76rem + 0.12vw), 0.98rem); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
	.connection-state { gap: 0.32rem; color: #8b8982; font-size: clamp(0.62rem, calc(0.56rem + 0.07vw), 0.7rem); white-space: nowrap; }
	.connection-state > i { width: 0.38rem; height: 0.38rem; border-radius: 50%; background: #817e77; box-shadow: 0 0 0 0.18rem rgb(129 126 119 / 0.12); }
	.connection-state.connected { color: #8fa88e; }
	.connection-state.connected > i { background: #72a477; box-shadow: 0 0 0 0.18rem rgb(114 164 119 / 0.14), 0 0 0.4rem rgb(114 164 119 / 0.55); }
	.map-panel { display: grid; min-height: clamp(5.1rem, calc(4rem + 1.8vw), 6.5rem); margin-top: 0.65rem; place-items: center; }
	.world-map { display: block; width: 100%; height: clamp(5.1rem, calc(4rem + 1.8vw), 6.5rem); overflow: visible; }
	.world-map path { fill: rgb(222 219 209 / 0.13); stroke: rgb(12 12 11 / 0.88); stroke-width: 0.48; vector-effect: non-scaling-stroke; transition: fill 180ms ease, stroke 180ms ease; }
	.world-map path.active { fill: #72a477; stroke: #a8c4a8; stroke-width: 0.72; filter: drop-shadow(0 0 0.18rem rgb(114 164 119 / 0.9)); }
	.map-loading { display: flex; align-items: center; gap: 0.3rem; }
	.map-loading i { width: 0.28rem; height: 0.28rem; border-radius: 50%; background: rgb(222 219 209 / 0.22); animation: map-pulse 900ms ease-in-out infinite alternate; }
	.map-loading i:nth-child(2) { animation-delay: 160ms; }
	.map-loading i:nth-child(3) { animation-delay: 320ms; }
	.map-error { color: #77746d; font-size: 0.66rem; }
	.visitor-metrics { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr); align-items: end; gap: clamp(0.4rem, 0.6vw, 0.6rem); margin-top: 0.75rem; white-space: nowrap; }
	.visitor-metric { min-width: 0; justify-content: center; align-items: flex-end; gap: 0.38rem; }
	.visitor-metric strong { font-size: clamp(2.1rem, calc(1.7rem + 0.6vw), 2.7rem); font-weight: 450; line-height: 0.9; letter-spacing: -0.07em; }
	.visitor-metric small { color: #aaa79e; font-size: clamp(0.58rem, calc(0.53rem + 0.05vw), 0.65rem); line-height: 1.1; }
	.metric-divider { width: 1px; min-height: 2.15rem; align-self: stretch; background: rgb(255 255 255 / 0.16); }
	@keyframes map-pulse { to { opacity: 0.32; transform: translateY(-0.08rem); } }
	@media (prefers-reduced-motion: reduce) { .map-loading i { animation: none; } .world-map path { transition: none; } }
</style>

<script lang="ts">
	import { onMount } from 'svelte';

	export let endpoint: string;

	type ConnectionState = 'unconfigured' | 'connecting' | 'connected' | 'reconnecting';
	type PresenceLocation = { city: string; country: string; active: number };
	type PresenceMessage = { type: 'presence'; active: number; locations: PresenceLocation[] };

	let activeConnections: number | null = null;
	let activeLocations: PresenceLocation[] = [];
	let connectionState: ConnectionState = endpoint ? 'connecting' : 'unconfigured';

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
			&& typeof message.active === 'number'
			&& Number.isInteger(message.active)
			&& message.active >= 0
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
						activeConnections = message.active;
						activeLocations = message.locations;
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
	$: statusCopy = connectionState === 'unconfigured'
		? 'Add the public WebSocket URL to enable presence.'
		: connectionState === 'connected'
			? 'Approximate locations. Nothing stored.'
			: 'Opening WebSocket link.';
</script>

<section class="presence-widget" aria-labelledby="presence-title">
	<header>
		<span class="presence-title"><i aria-hidden="true"></i><strong id="presence-title">Security system</strong></span>
		<span class:connected={connectionState === 'connected'} class="connection-state"><i></i>{stateLabel}</span>
	</header>
	{#if activeLocations.length > 0}
		<ul class="location-list" aria-label="Active connection locations">
			{#each activeLocations as location (`${location.city}:${location.country}`)}
				<li title={[location.city, location.country].filter(Boolean).join(', ') || 'Unknown location'}>
					<i aria-hidden="true"></i>
					<span>{location.city || location.country || 'Unknown'}</span>
					{#if location.country && location.city}<small>{location.country}</small>{/if}
					{#if location.active > 1}<small>×{location.active}</small>{/if}
				</li>
			{/each}
		</ul>
	{/if}
	<div class="connection-count" aria-live="polite">
		<strong>{activeConnections ?? '—'}</strong>
		<span>active now</span>
	</div>
	<p>{statusCopy}</p>
</section>

<style>
	.presence-widget { padding: clamp(1rem, calc(0.75rem + 0.35vw), 1.35rem); border: 1px solid rgb(255 255 255 / 0.16); border-radius: 0.72rem; background: var(--glass-dark, rgb(20 20 18 / 0.75)); box-shadow: var(--glass-shadow, 0 0.8rem 2rem rgb(0 0 0 / 0.34)); color: #dedbd1; -webkit-backdrop-filter: var(--glass-filter, blur(22px) saturate(135%)); backdrop-filter: var(--glass-filter, blur(22px) saturate(135%)); }
	header, .presence-title, .connection-state, .connection-count, .location-list, .location-list li { display: flex; align-items: center; }
	header { justify-content: space-between; gap: 0.8rem; }
	.presence-title { gap: 0.48rem; min-width: 0; }
	.presence-title > i { position: relative; width: 0.82rem; height: 0.82rem; flex: none; border: 1px solid #7892a3; border-left-color: transparent; border-radius: 50%; transform: rotate(-32deg); }
	.presence-title > i::after { position: absolute; top: 0.11rem; right: 0.02rem; width: 0.18rem; height: 0.18rem; border-radius: 50%; background: #9fb5c2; box-shadow: 0 0 0.35rem rgb(159 181 194 / 0.65); content: ''; }
	.presence-title strong { overflow: hidden; font-size: clamp(0.86rem, calc(0.76rem + 0.12vw), 0.98rem); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
	.connection-state { gap: 0.32rem; color: #8b8982; font-size: clamp(0.62rem, calc(0.56rem + 0.07vw), 0.7rem); white-space: nowrap; }
	.connection-state > i { width: 0.38rem; height: 0.38rem; border-radius: 50%; background: #817e77; box-shadow: 0 0 0 0.18rem rgb(129 126 119 / 0.12); }
	.connection-state.connected { color: #8fa88e; }
	.connection-state.connected > i { background: #72a477; box-shadow: 0 0 0 0.18rem rgb(114 164 119 / 0.14), 0 0 0.4rem rgb(114 164 119 / 0.55); }
	.location-list { flex-wrap: wrap; gap: 0.38rem; margin: 0.85rem 0 0; padding: 0; list-style: none; }
	.location-list li { gap: 0.28rem; min-width: 0; padding: 0.24rem 0.46rem; border: 1px solid rgb(255 255 255 / 0.09); border-radius: 999px; background: rgb(255 255 255 / 0.055); color: #bcb8ae; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: clamp(0.58rem, calc(0.53rem + 0.06vw), 0.65rem); line-height: 1; }
	.location-list li > i { width: 0.32rem; height: 0.32rem; flex: none; border-radius: 50%; background: #72a477; box-shadow: 0 0 0.35rem rgb(114 164 119 / 0.6); }
	.location-list li > span { overflow: hidden; max-width: 7.5rem; text-overflow: ellipsis; white-space: nowrap; }
	.location-list small { color: #77746d; font: inherit; }
	.connection-count { gap: 0.55rem; margin-top: 0.9rem; }
	.connection-count strong { font-size: clamp(2rem, calc(1.55rem + 0.7vw), 2.6rem); font-weight: 450; line-height: 0.9; letter-spacing: -0.06em; }
	.connection-count span { align-self: end; color: #aaa79e; font-size: clamp(0.75rem, calc(0.67rem + 0.09vw), 0.84rem); }
	p { margin: 1rem 0 0; padding-top: 0.72rem; border-top: 1px solid rgb(255 255 255 / 0.13); color: #8f8c84; font-size: clamp(0.66rem, calc(0.6rem + 0.07vw), 0.74rem); }
</style>

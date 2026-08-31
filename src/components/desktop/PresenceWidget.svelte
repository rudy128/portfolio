<script lang="ts">
	import { onMount } from 'svelte';

	export let endpoint: string;

	type ConnectionState = 'unconfigured' | 'connecting' | 'connected' | 'reconnecting';
	type PresenceMessage = { type: 'presence'; active: number };

	let activeConnections: number | null = null;
	let connectionState: ConnectionState = endpoint ? 'connecting' : 'unconfigured';

	function isPresenceMessage(value: unknown): value is PresenceMessage {
		if (!value || typeof value !== 'object') return false;
		const message = value as Record<string, unknown>;
		return message.type === 'presence'
			&& typeof message.active === 'number'
			&& Number.isInteger(message.active)
			&& message.active >= 0;
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
					if (isPresenceMessage(message)) activeConnections = message.active;
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
			? 'WebSocket link established.'
			: 'Opening WebSocket link.';
</script>

<section class="presence-widget" aria-labelledby="presence-title">
	<header>
		<span class="presence-title"><i aria-hidden="true"></i><strong id="presence-title">Security system</strong></span>
		<span class:connected={connectionState === 'connected'} class="connection-state"><i></i>{stateLabel}</span>
	</header>
	<div class="connection-count" aria-live="polite">
		<strong>{activeConnections ?? '—'}</strong>
		<span>active now</span>
	</div>
	<p>{statusCopy}</p>
</section>

<style>
	.presence-widget { padding: clamp(1rem, calc(0.75rem + 0.35vw), 1.35rem); border: 1px solid rgb(255 255 255 / 0.16); border-radius: 0.72rem; background: var(--glass-dark, rgb(20 20 18 / 0.75)); box-shadow: var(--glass-shadow, 0 0.8rem 2rem rgb(0 0 0 / 0.34)); color: #dedbd1; -webkit-backdrop-filter: var(--glass-filter, blur(22px) saturate(135%)); backdrop-filter: var(--glass-filter, blur(22px) saturate(135%)); }
	header, .presence-title, .connection-state, .connection-count { display: flex; align-items: center; }
	header { justify-content: space-between; gap: 0.8rem; }
	.presence-title { gap: 0.48rem; min-width: 0; }
	.presence-title > i { position: relative; width: 0.82rem; height: 0.82rem; flex: none; border: 1px solid #7892a3; border-left-color: transparent; border-radius: 50%; transform: rotate(-32deg); }
	.presence-title > i::after { position: absolute; top: 0.11rem; right: 0.02rem; width: 0.18rem; height: 0.18rem; border-radius: 50%; background: #9fb5c2; box-shadow: 0 0 0.35rem rgb(159 181 194 / 0.65); content: ''; }
	.presence-title strong { overflow: hidden; font-size: clamp(0.86rem, calc(0.76rem + 0.12vw), 0.98rem); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
	.connection-state { gap: 0.32rem; color: #8b8982; font-size: clamp(0.62rem, calc(0.56rem + 0.07vw), 0.7rem); white-space: nowrap; }
	.connection-state > i { width: 0.38rem; height: 0.38rem; border-radius: 50%; background: #817e77; box-shadow: 0 0 0 0.18rem rgb(129 126 119 / 0.12); }
	.connection-state.connected { color: #8fa88e; }
	.connection-state.connected > i { background: #72a477; box-shadow: 0 0 0 0.18rem rgb(114 164 119 / 0.14), 0 0 0.4rem rgb(114 164 119 / 0.55); }
	.connection-count { gap: 0.55rem; margin-top: 1.05rem; }
	.connection-count strong { font-size: clamp(2rem, calc(1.55rem + 0.7vw), 2.6rem); font-weight: 450; line-height: 0.9; letter-spacing: -0.06em; }
	.connection-count span { align-self: end; color: #aaa79e; font-size: clamp(0.75rem, calc(0.67rem + 0.09vw), 0.84rem); }
	p { margin: 1rem 0 0; padding-top: 0.72rem; border-top: 1px solid rgb(255 255 255 / 0.13); color: #8f8c84; font-size: clamp(0.66rem, calc(0.6rem + 0.07vw), 0.74rem); }
</style>

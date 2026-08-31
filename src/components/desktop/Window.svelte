<script lang="ts">
	import type { WindowState } from './types';

	export let state: WindowState;
	export let active = false;
	export let onFocus: (key: string) => void;
	export let onClose: (key: string) => void;
	export let onMinimize: (key: string) => void;
	export let onMaximize: (key: string) => void;
	export let onMove: (key: string, x: number, y: number) => void;
	export let onResize: (key: string, width: number, height: number) => void;

	function beginDrag(event: PointerEvent) {
		if (event.button !== 0 || state.maximized || window.innerWidth <= 760) return;
		if ((event.target as HTMLElement).closest('button')) return;

		event.preventDefault();
		onFocus(state.key);
		const startX = event.clientX;
		const startY = event.clientY;
		const originX = state.x;
		const originY = state.y;

		function move(next: PointerEvent) {
			const maxX = Math.max(8, window.innerWidth - state.width - 8);
			const maxY = Math.max(48, window.innerHeight - 92);
			const x = Math.max(8, Math.min(maxX, originX + next.clientX - startX));
			const y = Math.max(44, Math.min(maxY, originY + next.clientY - startY));
			onMove(state.key, x, y);
		}

		function stop() {
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', stop);
		}

		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', stop, { once: true });
	}

	function beginResize(event: PointerEvent) {
		if (event.button !== 0 || state.maximized || window.innerWidth <= 760) return;
		event.preventDefault();
		event.stopPropagation();
		onFocus(state.key);
		const startX = event.clientX;
		const startY = event.clientY;
		const originWidth = state.width;
		const originHeight = state.height;

		function resize(next: PointerEvent) {
			const maxWidth = window.innerWidth - state.x - 8;
			const maxHeight = window.innerHeight - state.y - 82;
			const width = Math.max(440, Math.min(maxWidth, originWidth + next.clientX - startX));
			const height = Math.max(300, Math.min(maxHeight, originHeight + next.clientY - startY));
			onResize(state.key, width, height);
		}

		function stop() {
			window.removeEventListener('pointermove', resize);
			window.removeEventListener('pointerup', stop);
		}

		window.addEventListener('pointermove', resize);
		window.addEventListener('pointerup', stop, { once: true });
	}
</script>

<section
	class:active
	class:maximized={state.maximized}
	class:minimized={state.minimized}
	class="app-window"
	style={`--window-x:${state.x}px;--window-y:${state.y}px;--window-width:${state.width}px;--window-height:${state.height}px;z-index:${state.z}`}
	aria-label={`${state.title} window`}
	onpointerdown={() => onFocus(state.key)}
>
	<header class="window-bar" onpointerdown={beginDrag} ondblclick={() => onMaximize(state.key)}>
		<div class="window-controls">
			<button class="close" type="button" aria-label={`Close ${state.title}`} onclick={(event) => { event.stopPropagation(); onClose(state.key); }}></button>
			<button class="minimize" type="button" aria-label={`Minimize ${state.title}`} onclick={(event) => { event.stopPropagation(); onMinimize(state.key); }}></button>
			<button class="maximize" type="button" aria-label={`Maximize ${state.title}`} onclick={(event) => { event.stopPropagation(); onMaximize(state.key); }}></button>
		</div>
		<strong>{state.title}</strong>
		<button class="window-menu" type="button" aria-label={`Toggle ${state.title} size`} onclick={(event) => { event.stopPropagation(); onMaximize(state.key); }}>↗</button>
	</header>

	<div class="window-body"><slot /></div>
	<button class="resize-handle" type="button" aria-label={`Resize ${state.title}`} onpointerdown={beginResize}></button>
</section>

<style>
	.app-window {
		position: absolute;
		left: var(--window-x);
		top: var(--window-y);
		width: var(--window-width);
		height: var(--window-height);
		min-width: 27.5rem;
		min-height: 18.75rem;
		overflow: hidden;
		border: 1px solid #22211d;
		border-radius: 0.72rem;
		background: #f1eee6;
		box-shadow: 0 1rem 2.8rem rgb(0 0 0 / 0.42);
		color: #1c1b17;
		transition: box-shadow 120ms ease, opacity 140ms ease, transform 140ms ease;
	}

	.app-window:not(.active) {
		box-shadow: 0 0.7rem 1.7rem rgb(0 0 0 / 0.3);
		filter: saturate(0.88) brightness(0.97);
	}

	.app-window.minimized {
		pointer-events: none;
		opacity: 0;
		transform: translateY(2rem) scale(0.88);
	}

	.app-window.maximized {
		left: 0.8rem;
		top: 3rem;
		width: calc(100vw - 1.6rem);
		height: calc(100svh - 8.1rem);
	}

	.window-bar {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		height: 2.65rem;
		padding: 0 0.78rem;
		border-bottom: 1px solid #d0cbc1;
		background: #e5e1d8;
		cursor: grab;
		user-select: none;
		touch-action: none;
	}

	.window-bar:active { cursor: grabbing; }
	.window-bar strong { font-size: 0.7rem; font-weight: 650; }
	.window-controls { display: flex; gap: 0.4rem; }
	.window-controls button { width: 0.7rem; height: 0.7rem; padding: 0; border: 1px solid rgb(0 0 0 / 0.17); border-radius: 50%; cursor: pointer; }
	.close { background: #c95d4f; }
	.minimize { background: #d2a84c; }
	.maximize { background: #6a9863; }
	.window-menu { justify-self: end; padding: 0.2rem; border: 0; background: none; color: #77736a; cursor: pointer; }
	.window-body { height: calc(100% - 2.65rem); overflow: auto; overscroll-behavior: contain; }

	.resize-handle {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 1.2rem;
		height: 1.2rem;
		padding: 0;
		border: 0;
		background: transparent;
		cursor: nwse-resize;
		touch-action: none;
	}

	.resize-handle::after {
		position: absolute;
		right: 0.25rem;
		bottom: 0.25rem;
		width: 0.45rem;
		height: 0.45rem;
		border-right: 1px solid #77736a;
		border-bottom: 1px solid #77736a;
		content: '';
	}

	@media (max-width: 760px) {
		.app-window,
		.app-window.maximized {
			left: 0.45rem;
			top: 8.8rem;
			width: calc(100vw - 0.9rem);
			height: calc(100svh - 14.2rem);
			min-width: 0;
			min-height: 20rem;
			border-radius: 0.6rem;
		}

		.window-bar { height: 2.35rem; }
		.window-body { height: calc(100% - 2.35rem); }
		.resize-handle { display: none; }
	}

	@media (prefers-reduced-motion: reduce) {
		.app-window { transition: none; }
	}
</style>

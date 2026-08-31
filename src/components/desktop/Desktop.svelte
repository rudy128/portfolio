<script lang="ts">
	import { onMount } from 'svelte';
	import AppContent from './AppContent.svelte';
	import Icon from './Icon.svelte';
	import PresenceWidget from './PresenceWidget.svelte';
	import Window from './Window.svelte';
	import type { AppId, GitHubCommit, Profile, Project, WindowState, XPost } from './types';

	export let profile: Profile;
	export let projects: Project[];
	export let latestXPost: XPost;
	export let latestOrgCommit: GitHubCommit;
	export let presenceWsUrl: string;

	type XWindow = Window & {
		requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
		cancelIdleCallback?: (id: number) => void;
		twttr?: { widgets?: { load: (element?: HTMLElement) => void } };
	};

	type AppDefinition = {
		id: AppId;
		label: string;
		icon: string;
		tone: string;
		x: number;
		y: number;
		width: number;
		height: number;
	};

	const applications: AppDefinition[] = [
		{ id: 'home', label: 'Home', icon: 'home', tone: 'sand', x: 225, y: 145, width: 820, height: 520 },
		{ id: 'about', label: 'About me', icon: 'about', tone: 'paper', x: 330, y: 105, width: 720, height: 515 },
		{ id: 'work', label: 'Projects', icon: 'work', tone: 'sage', x: 180, y: 85, width: 900, height: 590 },
		{ id: 'contact', label: 'Contact', icon: 'contact', tone: 'amber', x: 390, y: 155, width: 680, height: 440 },
		{ id: 'terminal', label: 'Terminal', icon: 'terminal', tone: 'terminal', x: 295, y: 205, width: 690, height: 380 },
		{ id: 'trash', label: 'Trash', icon: 'trash', tone: 'trash', x: 430, y: 210, width: 520, height: 350 },
	];

	let sequence = 1;
	let topZ = 10;
	let activeKey = 'home-1';
	let menuOpen: 'file' | 'view' | 'window' | 'help' | null = null;
	let clock = 'Chennai';
	let activityWidgetElement: HTMLElement;
	let windows: WindowState[] = [makeWindow('home', 'home-1', topZ)];

	function definition(appId: AppId) {
		return applications.find((app) => app.id === appId)!;
	}

	function makeWindow(appId: AppId, key: string, z: number): WindowState {
		const app = definition(appId);
		return {
			key,
			appId,
			title: app.label,
			x: app.x,
			y: app.y,
			width: app.width,
			height: app.height,
			z,
			minimized: false,
			maximized: false,
		};
	}

	function fitToViewport(state: WindowState): WindowState {
		if (typeof window === 'undefined' || window.innerWidth <= 760) return state;
		const width = Math.min(state.width, window.innerWidth - 32);
		const height = Math.min(state.height, window.innerHeight - 130);
		return {
			...state,
			width,
			height,
			x: Math.max(8, Math.min(state.x, window.innerWidth - width - 8)),
			y: Math.max(44, Math.min(state.y, window.innerHeight - height - 82)),
		};
	}

	function launch(appId: AppId) {
		const existing = windows.find((item) => item.appId === appId);
		topZ += 1;

		if (existing) {
			windows = windows.map((item) => item.key === existing.key ? { ...item, minimized: false, z: topZ } : item);
			activeKey = existing.key;
			menuOpen = null;
			return;
		}

		sequence += 1;
		const key = `${appId}-${sequence}`;
		const offset = (windows.length % 4) * 22;
		const next = makeWindow(appId, key, topZ);
		next.x += offset;
		next.y += offset;
		windows = [...windows, fitToViewport(next)];
		activeKey = key;
		menuOpen = null;
	}

	function focusWindow(key: string) {
		const target = windows.find((item) => item.key === key);
		if (!target || target.minimized || activeKey === key) return;
		topZ += 1;
		windows = windows.map((item) => item.key === key ? { ...item, z: topZ } : item);
		activeKey = key;
	}

	function selectTopWindow(nextWindows: WindowState[]) {
		const top = nextWindows.filter((item) => !item.minimized).sort((a, b) => b.z - a.z)[0];
		activeKey = top?.key ?? '';
	}

	function closeWindow(key: string) {
		const next = windows.filter((item) => item.key !== key);
		windows = next;
		if (activeKey === key) selectTopWindow(next);
	}

	function minimizeWindow(key: string) {
		const next = windows.map((item) => item.key === key ? { ...item, minimized: true } : item);
		windows = next;
		if (activeKey === key) selectTopWindow(next);
	}

	function maximizeWindow(key: string) {
		topZ += 1;
		windows = windows.map((item) => item.key === key ? { ...item, maximized: !item.maximized, minimized: false, z: topZ } : item);
		activeKey = key;
	}

	function moveWindow(key: string, x: number, y: number) {
		windows = windows.map((item) => item.key === key ? { ...item, x, y } : item);
	}

	function resizeWindow(key: string, width: number, height: number) {
		windows = windows.map((item) => item.key === key ? { ...item, width, height } : item);
	}

	function arrangeWindows() {
		const visible = windows.filter((item) => !item.minimized);
		windows = windows.map((item) => {
			const index = visible.findIndex((candidate) => candidate.key === item.key);
			if (index < 0) return item;
			return fitToViewport({ ...item, x: 155 + index * 42, y: 70 + index * 34, maximized: false });
		});
		menuOpen = null;
	}

	function closeActive() {
		if (activeKey) closeWindow(activeKey);
		menuOpen = null;
	}

	function toggleMenu(menu: typeof menuOpen) {
		menuOpen = menuOpen === menu ? null : menu;
	}

	function restoreOrLaunch(appId: AppId) {
		launch(appId);
	}

	function updateClock() {
		clock = new Intl.DateTimeFormat('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date());
	}

	function relativeTime(publishedAt: string) {
		const seconds = Math.max(0, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 1000));
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
		const months = Math.floor(days / 30);
		return `${months} ${months === 1 ? 'month' : 'months'} ago`;
	}

	onMount(() => {
		const browser = window as XWindow;
		let observer: IntersectionObserver | undefined;
		let idleId: number | undefined;
		let delayId: number | undefined;
		let widgetScript: HTMLScriptElement | null = null;
		let handleScriptLoad: (() => void) | undefined;

		const renderTimeline = () => browser.twttr?.widgets?.load(activityWidgetElement);
		const loadTimeline = () => {
			if (browser.twttr?.widgets) {
				renderTimeline();
				return;
			}

			widgetScript = document.querySelector<HTMLScriptElement>('script[data-x-widgets]');
			handleScriptLoad = () => renderTimeline();
			if (widgetScript) {
				widgetScript.addEventListener('load', handleScriptLoad, { once: true });
				return;
			}

			widgetScript = document.createElement('script');
			widgetScript.src = 'https://platform.twitter.com/widgets.js';
			widgetScript.async = true;
			widgetScript.charset = 'utf-8';
			widgetScript.dataset.xWidgets = 'true';
			widgetScript.addEventListener('load', handleScriptLoad, { once: true });
			document.head.append(widgetScript);
		};

		const scheduleActivity = () => {
			if (browser.requestIdleCallback) {
				idleId = browser.requestIdleCallback(loadTimeline, { timeout: 2500 });
			} else {
				delayId = window.setTimeout(loadTimeline, 1200);
			}
		};

		if ('IntersectionObserver' in window) {
			observer = new IntersectionObserver(([entry]) => {
				if (!entry.isIntersecting) return;
				observer?.disconnect();
				scheduleActivity();
			}, { rootMargin: '80px' });
			observer.observe(activityWidgetElement);
		} else {
			scheduleActivity();
		}

		windows = windows.map(fitToViewport);
		updateClock();
		const timer = window.setInterval(updateClock, 30_000);
		const handleResize = () => { windows = windows.map(fitToViewport); };
		window.addEventListener('resize', handleResize);
		return () => {
			observer?.disconnect();
			if (idleId !== undefined) browser.cancelIdleCallback?.(idleId);
			if (delayId !== undefined) window.clearTimeout(delayId);
			if (widgetScript && handleScriptLoad) widgetScript.removeEventListener('load', handleScriptLoad);
			window.clearInterval(timer);
			window.removeEventListener('resize', handleResize);
		};
	});

	$: activeTitle = windows.find((item) => item.key === activeKey)?.title ?? 'Desktop';
</script>

<main class="desktop" aria-label="Pratham's desktop portfolio" onclick={(event) => {
	if (!(event.target as HTMLElement).closest('.menu-area')) menuOpen = null;
}}>
	<h1 class="sr-only">Pratham Kamthan, full-stack software engineer</h1>

	<header class="menu-bar">
		<div class="menu-left">
			<strong>{activeTitle}</strong>
			<nav class="menu-area" aria-label="Application menu">
				<button class:selected={menuOpen === 'file'} type="button" onclick={() => toggleMenu('file')}>File</button>
				<button class:selected={menuOpen === 'view'} type="button" onclick={() => toggleMenu('view')}>View</button>
				<button class:selected={menuOpen === 'window'} type="button" onclick={() => toggleMenu('window')}>Window</button>
				<button class:selected={menuOpen === 'help'} type="button" onclick={() => toggleMenu('help')}>Help</button>
				{#if menuOpen}
					<div class="menu-popover">
						{#if menuOpen === 'file'}
							<strong>Open application</strong>
			{#each applications.filter((app) => app.id !== 'trash') as app}<button type="button" onclick={() => launch(app.id)}>{app.label}<span>↗</span></button>{/each}
						{:else if menuOpen === 'view'}
							<strong>View</strong>
							<button type="button" onclick={arrangeWindows}>Arrange open windows<span>⌘</span></button>
						{:else if menuOpen === 'window'}
							<strong>Open windows</strong>
							{#if windows.length === 0}<p>No windows open.</p>{/if}
							{#each windows as item}<button type="button" onclick={() => restoreOrLaunch(item.appId)}>{item.title}<span>{item.minimized ? 'minimized' : '•'}</span></button>{/each}
							{#if activeKey}<button class="danger" type="button" onclick={closeActive}>Close active window<span>×</span></button>{/if}
						{:else}
							<strong>Desktop help</strong>
							<p>Open several apps, then drag their title bars. Clicking a window brings it forward.</p>
						{/if}
					</div>
				{/if}
			</nav>
		</div>
		<div class="menu-right">
			<a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
			<span class="status-dot" aria-label="Available"></span><span>IN</span>
			<button class="brand-mark" type="button" aria-label="Open Home" onclick={() => launch('home')}>PK</button>
			<time>{clock}</time>
		</div>
	</header>

	<div class="wallpaper-mark" aria-hidden="true"><span>P</span><span>K</span></div>

	<nav class="desktop-shortcuts" aria-label="Desktop shortcuts">
		{#each applications.filter((app) => app.id !== 'terminal' && app.id !== 'trash') as app}
			<button class="shortcut" class:home-shortcut={app.id === 'home'} type="button" onclick={() => launch(app.id)}>
				{#if app.id === 'home'}
					<span class="icon-tile avatar-tile"><img src="https://avatars.githubusercontent.com/u/77375030?v=4&size=200" width="52" height="52" alt="" /></span>
				{:else}
					<span class={`icon-tile ${app.tone}`}><Icon name={app.icon} /></span>
				{/if}
				<span>{app.label}</span>
			</button>
		{/each}
		<button class="shortcut trash-shortcut" type="button" onclick={() => launch('trash')}>
			<span class="icon-tile trash"><Icon name="trash" /></span>
			<span>Trash</span>
		</button>
	</nav>

	<aside class="side-rail" aria-label="Desktop widgets">
		<PresenceWidget endpoint={presenceWsUrl} />
		<section class="widget now-widget">
			<div class="widget-heading"><span>NOW</span><span class="live-label"><i></i> active</span></div>
			<p class="widget-kicker">BUILDING</p><h2>Full-stack products at IndieRise.</h2>
			<p>Currently working across product, web systems, and research tooling.</p>
		</section>
		<section class="widget activity-widget" bind:this={activityWidgetElement}>
			<div class="widget-heading"><span>RECENT ACTIVITY</span></div>
			<div class="activity-list">
				<div class="x-feed">
					<a
						class="twitter-timeline activity-row x-post-fallback"
						href={profile.x}
						target="_blank"
						rel="noreferrer"
						data-tweet-limit="1"
						data-chrome="noheader nofooter noborders transparent noscrollbar"
						data-dnt="true"
						data-theme="light"
					>
						<img class="activity-image" src={latestXPost.image} alt="Image attached to the post" loading="lazy" decoding="async" />
						<span class="activity-copy">
							<strong>{latestXPost.text}</strong>
							<span>X · @{profile.xHandle}</span>
							<time datetime={latestXPost.publishedAt}>{relativeTime(latestXPost.publishedAt)}</time>
						</span>
					</a>
				</div>
				<a class="activity-row github-activity" href={latestOrgCommit.organizationUrl} target="_blank" rel="noreferrer">
					<img class="activity-image" src={latestOrgCommit.organizationAvatar} alt="" loading="lazy" decoding="async" />
					<span class="activity-copy">
						<strong>{latestOrgCommit.organization} - OSS</strong>
						<span>Contributed to {latestOrgCommit.organization}</span>
					</span>
				</a>
			</div>
		</section>
		<section class="widget links-widget">
			<div class="widget-heading"><span>QUICK LINKS</span></div>
			<div class="quick-links">
				<a class="quick-link github-link" href={profile.github} target="_blank" rel="noreferrer">
					<span class="quick-icon"><Icon name="github" /></span><strong>GitHub</strong><small>↗</small>
				</a>
				<a class="quick-link linkedin-link" href={profile.linkedin} target="_blank" rel="noreferrer">
					<span class="quick-icon"><Icon name="linkedin" /></span><strong>LinkedIn</strong><small>↗</small>
				</a>
				<a class="quick-link email-link" href={`mailto:${profile.email}`}>
					<span class="quick-icon"><Icon name="contact" /></span><strong>Email</strong><small>↗</small>
				</a>
				<a class="quick-link x-link" href={profile.x} target="_blank" rel="noreferrer" aria-label={`X profile @${profile.xHandle}`}>
					<span class="quick-icon"><Icon name="x" /></span><strong>Twitter/X</strong><small>↗</small>
				</a>
			</div>
		</section>
	</aside>

	<div class="windows-layer" aria-live="polite">
		{#each windows as item (item.key)}
			<Window
				state={item}
				active={item.key === activeKey}
				onFocus={focusWindow}
				onClose={closeWindow}
				onMinimize={minimizeWindow}
				onMaximize={maximizeWindow}
				onMove={moveWindow}
				onResize={resizeWindow}
			>
				<AppContent appId={item.appId} {profile} {projects} onLaunch={launch} />
			</Window>
		{/each}
	</div>

	<nav class="dock" aria-label="Application dock">
		{#each applications.filter((app) => app.id !== 'trash') as app}
			<button
				class:running={windows.some((item) => item.appId === app.id)}
				class:active={windows.some((item) => item.appId === app.id && item.key === activeKey && !item.minimized)}
				class="dock-item"
				type="button"
				aria-label={`Open ${app.label}`}
				onclick={() => restoreOrLaunch(app.id)}
			>
				{#if app.id === 'home'}
					<span class="icon-tile avatar-tile"><img src="https://avatars.githubusercontent.com/u/77375030?v=4&size=200" width="46" height="46" alt="" /></span>
				{:else}
					<span class={`icon-tile ${app.tone}`}><Icon name={app.icon} /></span>
				{/if}
				<small>{app.label}</small>
			</button>
		{/each}
	</nav>
</main>

<style>
	.desktop {
		--chrome-color: #0d0d0b;
		--glass-light: linear-gradient(145deg, rgb(248 246 240 / 0.82), rgb(222 218 208 / 0.7));
		--glass-light-strong: rgb(235 232 224 / 0.72);
		--glass-dark: linear-gradient(145deg, rgb(38 38 34 / 0.78), rgb(14 14 12 / 0.68));
		--glass-border: rgb(255 255 255 / 0.38);
		--glass-shadow: 0 0.8rem 2rem rgb(0 0 0 / 0.34), inset 0 1px rgb(255 255 255 / 0.42);
		--glass-filter: blur(22px) saturate(135%);
		position: relative;
		height: 100svh;
		min-height: 100svh;
		overflow: hidden;
		background: #000 url('/world-map-wallpaper.webp') center / cover no-repeat;
		color: #181815;
	}
	.desktop::before { position: absolute; inset: 3.2rem 16.5rem 5.8rem 8.5rem; border: 1px solid rgb(255 255 255 / 0.05); background: rgb(0 0 0 / 0.1); clip-path: polygon(8% 0, 100% 0, 88% 100%, 0 82%); content: ''; }
	.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }

	.menu-bar { position: fixed; inset: 0 0 auto; z-index: 1000; display: flex; align-items: center; justify-content: space-between; height: clamp(2.5rem, calc(2.25rem + 0.4vw), 3rem); padding: 0 clamp(1rem, calc(0.8rem + 0.3vw), 1.35rem); background: var(--chrome-color); color: #efede6; font-size: clamp(0.82rem, calc(0.72rem + 0.12vw), 0.96rem); box-shadow: 0 1px rgb(255 255 255 / 0.08); }
	.menu-left, .menu-right, .menu-left nav { display: flex; align-items: center; height: 100%; }
	.brand-mark, .menu-bar button, .menu-bar a { color: inherit; font: inherit; }
	.brand-mark { padding: 0; border: 0; background: none; font-weight: 800; letter-spacing: -0.08em; cursor: pointer; }
	.menu-left > strong { margin: 0 0.85rem 0 0; font-weight: 650; }
	.menu-left nav > button { height: 100%; padding: 0 0.78rem; border: 0; background: none; cursor: pointer; }
	.menu-left nav > button:hover, .menu-left nav > button.selected { background: #292924; }
	.menu-right { gap: 0.95rem; color: #c8c5bd; }
	.menu-right a { text-decoration: none; }
	.status-dot { width: 0.48rem; height: 0.48rem; border-radius: 50%; background: #79a77a; box-shadow: 0 0 0 3px rgb(121 167 122 / 0.12); }

	.menu-area { position: relative; }
	.menu-popover { position: absolute; z-index: 1100; top: calc(100% + 0.1rem); left: 0; width: 16rem; padding: 0.5rem; border: 1px solid var(--glass-border); border-radius: 0.58rem; background: var(--glass-light); color: #24231f; box-shadow: var(--glass-shadow); -webkit-backdrop-filter: var(--glass-filter); backdrop-filter: var(--glass-filter); }
	.menu-popover strong, .menu-popover p, .menu-popover button { display: flex; align-items: center; justify-content: space-between; width: 100%; margin: 0; padding: 0.58rem 0.65rem; border: 0; background: none; color: inherit; font: 0.78rem var(--font-sans); text-align: left; }
	.menu-popover strong { color: #777268; font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; }
	.menu-popover p { line-height: 1.45; }
	.menu-popover button { cursor: pointer; }
	.menu-popover button:hover { background: rgb(255 255 255 / 0.34); }
	.menu-popover button span { color: #817b70; font-size: 0.58rem; }
	.menu-popover .danger { margin-top: 0.35rem; border-top: 1px solid #d0cbc2; color: #8b3f38; }

	.wallpaper-mark { position: absolute; left: 49%; top: 49%; display: flex; gap: 0.05em; color: rgb(239 237 230 / 0.04); font-family: var(--font-sans); font-size: min(30vw, 28rem); font-weight: 500; letter-spacing: -0.16em; line-height: 1; transform: translate(-50%, -50%); user-select: none; }
	.desktop-shortcuts { position: fixed; z-index: 3; bottom: 1.15rem; left: 1.15rem; display: grid; grid-template-columns: auto auto; align-items: end; gap: 0.7rem; }
	.shortcut { display: grid; justify-items: center; gap: 0.34rem; width: 6.4rem; padding: 0.35rem; border: 1px solid transparent; border-radius: 0.3rem; background: transparent; color: #efede6; font: 500 0.69rem/1.1 var(--font-sans); cursor: pointer; }
	.shortcut:not(.home-shortcut) { gap: 0.45rem; width: clamp(7rem, calc(6.5rem + 0.8vw), 8.25rem); font-size: clamp(0.8rem, calc(0.72rem + 0.08vw), 0.9rem); }
	.desktop-shortcuts > .shortcut:not(.home-shortcut):not(.trash-shortcut) { grid-column: 1; }
	.shortcut:not(.home-shortcut) .icon-tile { width: clamp(3.75rem, calc(3.4rem + 0.7vw), 4.5rem); height: clamp(3.75rem, calc(3.4rem + 0.7vw), 4.5rem); border-radius: clamp(0.7rem, 0.8vw, 0.9rem); }
	.shortcut:not(.home-shortcut) .icon-tile :global(svg) { width: clamp(1.8rem, calc(1.55rem + 0.4vw), 2.15rem); height: clamp(1.8rem, calc(1.55rem + 0.4vw), 2.15rem); }
	.home-shortcut { position: fixed; top: 50%; left: 48.5%; transform: translate(-50%, -50%); }
	.home-shortcut .avatar-tile { width: clamp(4.25rem, calc(3.25rem + 1.8vw), 6rem); height: clamp(4.25rem, calc(3.25rem + 1.8vw), 6rem); border-radius: clamp(0.75rem, 1vw, 1.1rem); }
	.trash-shortcut { grid-row: 3; grid-column: 2; }
	.shortcut:hover, .shortcut:focus-visible { border-color: rgb(255 255 255 / 0.16); background: rgb(255 255 255 / 0.05); }
	.icon-tile { display: grid; place-items: center; width: 3.25rem; height: 3.25rem; border: 1px solid rgb(0 0 0 / 0.35); border-radius: 0.62rem; color: #23231f; box-shadow: inset 0 1px rgb(255 255 255 / 0.55), 0 0.3rem 0.62rem rgb(0 0 0 / 0.22); }
	.icon-tile :global(svg) { width: 1.58rem; height: 1.58rem; }
	.avatar-tile { overflow: hidden; background: #dedbd2; }
	.avatar-tile img { display: block; width: 100%; height: 100%; object-fit: cover; }
	.sand { background: #c9b889; } .paper { background: #efeee8; } .sage { background: #87938b; } .amber { background: #b5965f; } .terminal { background: #272722; color: #e9e6db; } .trash { background: #d9d7d0; }

	.side-rail { position: fixed; z-index: 4; top: 3.7rem; right: 1.2rem; display: grid; gap: clamp(0.7rem, 0.7vw, 0.72rem); width: clamp(16rem, 16vw, 19rem); }
	.widget { padding: clamp(1rem, calc(0.75rem + 0.35vw), 1.35rem); border: 1px solid var(--glass-border); border-radius: 0.72rem; background: var(--glass-light); box-shadow: var(--glass-shadow); -webkit-backdrop-filter: var(--glass-filter); backdrop-filter: var(--glass-filter); }
	.widget-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.9rem; color: #625f58; font-size: clamp(0.78rem, calc(0.65rem + 0.18vw), 0.92rem); font-weight: 800; letter-spacing: 0.08em; }
	.live-label { display: flex; align-items: center; gap: 0.35rem; color: #5d785d; letter-spacing: 0; text-transform: lowercase; }
	.live-label i { width: 0.45rem; height: 0.45rem; border-radius: 50%; background: #658665; }
	.widget-kicker { margin: 0 0 0.35rem; color: #8a8171; font-size: clamp(0.72rem, calc(0.63rem + 0.13vw), 0.84rem); font-weight: 700; letter-spacing: 0.09em; }
	.now-widget h2 { margin: 0; font-family: var(--font-sans); font-size: clamp(1.45rem, calc(1.1rem + 0.5vw), 1.9rem); font-weight: 500; line-height: 1.1; }
	.now-widget > p:last-child { margin: 0.65rem 0 0; color: #69665f; font-size: clamp(0.88rem, calc(0.75rem + 0.15vw), 1rem); line-height: 1.5; }
	.activity-widget { padding-bottom: clamp(0.9rem, calc(0.72rem + 0.25vw), 1.15rem); }
	.activity-widget .widget-heading { margin-bottom: 0.7rem; }
	.activity-list { display: grid; gap: 0.7rem; }
	.x-feed { min-height: 3.5rem; max-height: 8.5rem; overflow: hidden; border-radius: 0.28rem; }
	.activity-row { display: grid; grid-template-columns: 3.5rem minmax(0, 1fr); align-items: center; gap: 0.7rem; color: #24231f; text-decoration: none; }
	.github-activity { padding-top: 0.7rem; border-top: 1px solid #d1cdc3; }
	.activity-image { display: block; width: 3.5rem; height: 3.5rem; border: 1px solid #d1cdc3; border-radius: 0.48rem; background: #d8d5cc; object-fit: cover; }
	.activity-copy { display: grid; min-width: 0; }
	.activity-copy strong, .activity-copy > span { display: -webkit-box; overflow: hidden; line-height: 1.3; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
	.activity-copy strong { font-size: clamp(0.85rem, calc(0.75rem + 0.12vw), 0.96rem); font-weight: 500; }
	.activity-copy > span { margin-top: 0.18rem; color: #716d64; font-size: clamp(0.72rem, calc(0.65rem + 0.08vw), 0.8rem); }
	.activity-copy time { margin-top: 0.3rem; color: #837e74; font-size: clamp(0.66rem, calc(0.6rem + 0.07vw), 0.74rem); letter-spacing: 0.06em; text-transform: uppercase; }
	.x-feed :global(iframe) { width: 100% !important; min-width: 0 !important; margin: 0 !important; }
	.quick-links { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(0.35rem, 0.5vw, 0.55rem); }
	.quick-link { position: relative; display: grid; justify-items: center; gap: 0.42rem; min-width: 0; padding: 0; border: 0; background: transparent; color: #302f2a; font-family: var(--font-sans); text-decoration: none; cursor: pointer; }
	.quick-link .quick-icon { display: grid; place-items: center; width: clamp(2.65rem, calc(2.35rem + 0.45vw), 3rem); height: clamp(2.65rem, calc(2.35rem + 0.45vw), 3rem); border: 1px solid rgb(30 29 25 / 0.34); border-radius: clamp(0.58rem, 0.7vw, 0.72rem); box-shadow: inset 0 1px rgb(255 255 255 / 0.45), 0 0.25rem 0.55rem rgb(31 30 26 / 0.2); transition: transform 120ms ease, box-shadow 120ms ease; }
	.quick-link :global(svg) { width: clamp(1.2rem, calc(1.05rem + 0.22vw), 1.38rem); height: clamp(1.2rem, calc(1.05rem + 0.22vw), 1.38rem); }
	.quick-link strong { max-width: 100%; overflow: hidden; font-size: clamp(0.68rem, calc(0.61rem + 0.08vw), 0.76rem); font-weight: 600; line-height: 1; text-overflow: ellipsis; white-space: nowrap; }
	.quick-link small { position: absolute; top: -0.2rem; right: -0.05rem; display: grid; place-items: center; width: 1rem; height: 1rem; border: 1px solid rgb(33 32 28 / 0.22); border-radius: 50%; background: #f2efe8; color: #57544d; font-size: 0.55rem; line-height: 1; box-shadow: 0 0.12rem 0.25rem rgb(0 0 0 / 0.16); }
	.quick-link:hover .quick-icon, .quick-link:focus-visible .quick-icon { box-shadow: inset 0 1px rgb(255 255 255 / 0.5), 0 0.42rem 0.72rem rgb(31 30 26 / 0.28); transform: translateY(-0.14rem); }
	.github-link .quick-icon { background: #242421; color: #f0eee8; }
	.linkedin-link .quick-icon { background: #aabac3; color: #24333b; }
	.email-link .quick-icon { background: #c7a86d; color: #332b1f; }
	.x-link .quick-icon { background: #111; color: #fff; }
	.windows-layer { position: absolute; inset: 0; pointer-events: none; }
	.windows-layer :global(.app-window) { pointer-events: auto; }
	.dock { position: fixed; z-index: 1050; left: 50%; bottom: 1.15rem; display: flex; align-items: end; gap: 0.42rem; padding: 0.45rem; border: 1px solid rgb(255 255 255 / 0.11); border-radius: 0.85rem; background: rgb(22 22 19 / 0.95); box-shadow: 0 0.65rem 1.8rem rgb(0 0 0 / 0.4); transform: translateX(-50%); }
	.dock-item { position: relative; padding: 0; border: 0; background: none; cursor: pointer; transition: transform 110ms ease; }
	.dock-item:hover { transform: translateY(-0.2rem); }
	.dock-item .icon-tile { width: 2.9rem; height: 2.9rem; }
	.dock-item .icon-tile :global(svg) { width: 1.38rem; height: 1.38rem; }
	.dock-item small { position: absolute; left: 50%; bottom: calc(100% + 0.8rem); display: none; padding: 0.32rem 0.46rem; border-radius: 0.23rem; background: #ece9e1; color: #24231f; font-size: 0.6rem; white-space: nowrap; transform: translateX(-50%); }
	.dock-item:hover small { display: block; }
	.dock-item::after { position: absolute; left: 50%; bottom: -0.26rem; width: 0.26rem; height: 0.26rem; border-radius: 50%; background: #e3dfd5; content: ''; opacity: 0; transform: translateX(-50%); }
	.dock-item.running::after { opacity: 0.55; }
	.dock-item.active::after { opacity: 1; }

	@media (max-width: 1100px) { .side-rail { display: none; } }
	@media (min-width: 1101px) and (max-height: 920px) {
		.side-rail { bottom: 1.15rem; max-height: calc(100svh - 4.85rem); padding-right: 0.2rem; overflow-y: auto; scrollbar-width: none; }
		.side-rail::-webkit-scrollbar { display: none; }
	}
	@media (max-width: 760px) {
		.menu-bar { height: 2.85rem; padding: 0 0.65rem; font-size: 0.82rem; }
		.menu-left nav, .menu-right a, .menu-right > span:not(.status-dot) { display: none; }
		.menu-right { gap: 0.5rem; }
		.desktop::before { inset: 2.7rem 0 0; clip-path: polygon(0 0, 100% 0, 100% 78%, 0 100%); }
		.wallpaper-mark { top: 28%; font-size: 13rem; }
		.desktop-shortcuts { top: 3.5rem; right: 0.4rem; bottom: auto; left: 0.4rem; display: flex; justify-content: space-between; gap: 0; }
		.shortcut, .shortcut:not(.home-shortcut) { width: 24%; font-size: 0.66rem; }
		.home-shortcut { position: static; transform: none; }
		.shortcut .icon-tile { width: 2.7rem; height: 2.7rem; border-radius: 0.52rem; }
		.shortcut .icon-tile :global(svg) { width: 1.2rem; height: 1.2rem; }
		.shortcut:not(.home-shortcut) .icon-tile { width: 2.9rem; height: 2.9rem; border-radius: 0.56rem; }
		.shortcut:not(.home-shortcut) .icon-tile :global(svg) { width: 1.35rem; height: 1.35rem; }
		.trash-shortcut { position: fixed; right: 0.4rem; bottom: 4.5rem; width: 24%; }
		.dock { bottom: 0.5rem; gap: 0.32rem; padding: 0.36rem; }
		.dock-item .icon-tile { width: 2.62rem; height: 2.62rem; border-radius: 0.52rem; }
		.dock-item .icon-tile :global(svg) { width: 1.15rem; height: 1.15rem; }
	}

	@media (prefers-reduced-motion: reduce) { .dock-item { transition: none; } }
</style>

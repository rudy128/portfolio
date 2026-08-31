<script lang="ts">
	import type { AppId, Profile } from '../types';

	export let profile: Profile;
	export let onLaunch: (appId: AppId) => void;
</script>

<article class="home-app">
	<section class="profile-pane">
		<p class="eyebrow">FULL-STACK ENGINEER</p>
		<div class="identity">
			<img
				src="https://avatars.githubusercontent.com/u/77375030?v=4&size=200"
				width="84"
				height="84"
				alt="Pratham Kamthan's GitHub avatar"
				decoding="async"
				fetchpriority="high"
			/>
			<div><h2>{profile.name}</h2><p>@{profile.handle}</p></div>
		</div>
		<p class="roles">Product engineer <span>/</span> Systems builder</p>
		<p class="lede">I build web products end to end. Interfaces, APIs, data pipelines, and the infrastructure that keeps them running.</p>
		<div class="actions">
			<button class="button dark" type="button" onclick={() => onLaunch('work')}>View projects <span>→</span></button>
			<a class="button" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn <span>↗</span></a>
		</div>
	</section>

	<section class="welcome-pane">
		<p class="eyebrow">HELLO</p>
		<h2>Thanks for stopping by.</h2>
		<p class="welcome-copy">Open a few things. My work, background, and contact details are all here.</p>
		<ol class="desktop-guide">
			<li><span>01</span><div><strong>Open</strong><p>Use a desktop icon or the dock.</p></div></li>
			<li><span>02</span><div><strong>Arrange</strong><p>Drag windows by their title bars.</p></div></li>
			<li><span>03</span><div><strong>Focus</strong><p>Click any window to bring it forward.</p></div></li>
		</ol>
	</section>
</article>

<style>
	.home-app { display: grid; grid-template-columns: 1.16fr 0.84fr; min-height: 100%; }
	.profile-pane, .welcome-pane { padding: clamp(2rem, 4vw, 3.4rem); }
	.profile-pane { border-right: 1px solid #d5d0c6; }
	.eyebrow { margin: 0 0 1rem; color: #777066; font: 700 0.61rem/1 var(--font-sans); letter-spacing: 0.11em; }
	.identity { display: flex; align-items: center; gap: 1rem; }
	.identity img { width: 4.5rem; height: 4.5rem; border: 1px solid #c9c4ba; border-radius: 50%; object-fit: cover; background: #dedbd2; }
	h2 { margin: 0; font-family: var(--font-sans); font-weight: 500; letter-spacing: -0.045em; }
	.identity h2 { font-size: clamp(2rem, 3.5vw, 3.2rem); line-height: 0.96; }
	.identity div p { margin: 0.5rem 0 0; color: #7c776e; font: 0.7rem var(--font-sans); }
	.roles { display: flex; gap: 0.7rem; margin: 1.4rem 0 0; font-size: 0.9rem; font-weight: 700; }
	.roles span { color: #b5afa4; }
	.lede { max-width: 33rem; margin: 1.3rem 0 0; color: #656158; font-size: 0.88rem; line-height: 1.6; }
	.actions { display: flex; gap: 0.65rem; margin-top: 1.5rem; }
	.button { display: flex; align-items: center; justify-content: space-between; gap: 2rem; min-width: 8.6rem; padding: 0.78rem 0.85rem; border: 1px solid #c9c4b9; border-radius: 0.16rem; background: #f5f2eb; color: #292822; font: 650 0.7rem var(--font-sans); text-decoration: none; cursor: pointer; }
	.button.dark { border-color: #22221e; background: #22221e; color: #f4f1e8; }
	.welcome-pane h2 { font-size: clamp(1.8rem, 3vw, 2.6rem); }
	.welcome-copy { max-width: 20rem; margin: 0.7rem 0 1.35rem; color: #6d685e; font-size: 0.8rem; line-height: 1.5; }
	.desktop-guide { margin: 0; padding: 0; list-style: none; }
	.desktop-guide li { display: grid; grid-template-columns: 2rem 1fr; gap: 0.5rem; padding: 0.72rem 0; border-top: 1px solid #d5d0c6; }
	.desktop-guide li > span { color: #938d82; font-size: 0.59rem; }
	.desktop-guide strong { font-family: var(--font-sans); font-size: 0.83rem; }
	.desktop-guide p { margin: 0.15rem 0 0; color: #777269; font-size: 0.68rem; }

	@media (max-width: 760px) {
		.home-app { display: block; }
		.profile-pane, .welcome-pane { padding: 1.35rem; }
		.profile-pane { min-height: 100%; border-right: 0; }
		.welcome-pane { border-top: 1px solid #d5d0c6; }
		.identity img { width: 3.2rem; height: 3.2rem; }
		.identity h2 { font-size: 1.9rem; }
		.roles { font-size: 0.76rem; }
		.lede { font-size: 0.78rem; }
		.button { min-width: 0; gap: 1rem; padding: 0.7rem; }
	}
</style>

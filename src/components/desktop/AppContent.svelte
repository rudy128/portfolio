<script lang="ts">
	import Icon from './Icon.svelte';
	import type { AppId, Profile, Project } from './types';

	export let appId: AppId;
	export let profile: Profile;
	export let projects: Project[];
	export let onLaunch: (appId: AppId) => void;
</script>

{#if appId === 'home'}
	<article class="home-app">
		<section class="profile-pane">
			<p class="eyebrow">FULL-STACK ENGINEER</p>
			<div class="identity">
				<img src="https://avatars.githubusercontent.com/u/77375030?v=4&size=200" width="84" height="84" alt="Pratham Kamthan's GitHub avatar" />
				<div><h2>{profile.name}</h2><p>@{profile.handle}</p></div>
			</div>
			<p class="roles">Product engineer <span>/</span> Systems builder</p>
			<p class="lede">I build web products end to end. Interfaces, APIs, data pipelines, and the infrastructure that keeps them running.</p>
			<div class="actions">
				<button class="button dark" type="button" onclick={() => onLaunch('work')}>View projects <span>→</span></button>
				<a class="button" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn <span>↗</span></a>
			</div>
		</section>
	</article>
{:else if appId === 'about'}
	<article class="page-app about-app">
		<div class="app-heading"><p class="eyebrow">ABOUT ME</p><h2>I like owning the whole problem.</h2></div>
		<div class="about-layout">
			<div class="about-copy">
				<p>I am a full-stack engineer based in Chennai and a student at IIT Madras. I am most useful when a project needs someone to follow it from the first interface to the last database query.</p>
				<p>I work mostly with TypeScript, Go, and Python. Away from product work, I spend time on Linux, 3D modelling, and cybersecurity.</p>
			</div>
			<dl class="stack-list">
				<div><dt>Languages</dt><dd>TypeScript, Go, Python, C++</dd></div>
				<div><dt>Web</dt><dd>Next.js, React, Django, Astro</dd></div>
				<div><dt>Systems</dt><dd>Postgres, Redis, WebSockets, Docker</dd></div>
				<div><dt>Learning</dt><dd>Realtime software, open source, security</dd></div>
			</dl>
		</div>
	</article>
{:else if appId === 'work'}
	<article class="page-app work-app">
		<div class="app-heading work-heading">
			<div><p class="eyebrow">SELECTED PROJECTS</p><h2>Things I have built.</h2></div>
			<a href={`${profile.github}?tab=repositories`} target="_blank" rel="noreferrer">All repositories ↗</a>
		</div>
		<div class="project-list">
			{#each projects as project}
				<a class="project" href={project.liveUrl ?? project.href} target="_blank" rel="noreferrer">
					<span class="project-number">{project.number}</span>
					<div class="project-copy">
						<h3>{project.title}</h3>
						<p>{project.description}</p>
						<ul>{#each project.tools as tool}<li>{tool}</li>{/each}</ul>
					</div>
					<span class="project-year">{project.year}</span><span class="project-arrow">↗</span>
				</a>
			{/each}
		</div>
	</article>
{:else if appId === 'contact'}
	<article class="page-app contact-app">
		<div class="contact-copy">
			<p class="eyebrow">CONTACT</p><h2>Have a real problem to solve?</h2>
			<p>Send me the context, the constraint, and what success looks like. I read every useful email.</p>
			<a class="email-link" href={`mailto:${profile.email}`}>{profile.email}<span>↗</span></a>
		</div>
		<div class="contact-card">
			<p class="eyebrow">FIND ME</p>
			<a href={profile.github} target="_blank" rel="noreferrer"><span>GitHub</span><strong>@{profile.handle}</strong><i>↗</i></a>
			<a href={profile.linkedin} target="_blank" rel="noreferrer"><span>LinkedIn</span><strong>{profile.name}</strong><i>↗</i></a>
			<div><span>Timezone</span><strong>IST / UTC+5:30</strong></div>
		</div>
	</article>
{:else if appId === 'terminal'}
	<article class="terminal-app">
		<p>Last login: today on pratham.dev</p>
		<p><span>pratham@portfolio</span>:~$ whoami</p>
		<p>{profile.name}. Full-stack engineer in Chennai.</p>
		<p><span>pratham@portfolio</span>:~$ interests</p>
		<p>realtime systems · open source · security · 3d</p>
		<p><span>pratham@portfolio</span>:~$ contact</p>
		<p><a href={`mailto:${profile.email}`}>{profile.email}</a></p>
		<p class="prompt"><span>pratham@portfolio</span>:~$ <i></i></p>
	</article>
{:else}
	<article class="trash-app">
		<div class="trash-empty-icon" aria-hidden="true"><Icon name="trash" /></div>
		<p class="eyebrow">TRASH</p>
		<h2>Nothing in here.</h2>
		<p>Trash is empty.</p>
	</article>
{/if}

<style>
	:global(.window-body) { scrollbar-color: #77736a transparent; scrollbar-width: thin; }
	.eyebrow { margin: 0 0 1rem; color: #777066; font: 700 0.61rem/1 var(--font-sans); letter-spacing: 0.11em; }
	h2, h3 { margin: 0; font-family: var(--font-sans); font-weight: 500; letter-spacing: -0.045em; }

	.home-app { min-height: 100%; }
	.profile-pane { display: flex; min-height: 100%; flex-direction: column; justify-content: center; padding: clamp(2.5rem, 5.5vw, 4.5rem); }
	.identity { display: flex; align-items: center; gap: 1rem; }
	.identity img { width: clamp(4.75rem, 8vw, 6rem); height: clamp(4.75rem, 8vw, 6rem); border: 1px solid #c9c4ba; border-radius: 50%; object-fit: cover; background: #dedbd2; }
	.identity h2 { font-size: clamp(2.7rem, 5.2vw, 4rem); line-height: 0.94; }
	.identity div p { margin: 0.5rem 0 0; color: #7c776e; font: 0.7rem var(--font-sans); }
	.roles { display: flex; gap: 0.7rem; margin: 1.65rem 0 0; font-size: 1rem; font-weight: 700; }
	.roles span { color: #b5afa4; }
	.lede { max-width: 39rem; margin: 1.35rem 0 0; color: #656158; font-size: 0.92rem; line-height: 1.65; }
	.actions { display: flex; gap: 0.65rem; margin-top: 1.75rem; }
	.button { display: flex; align-items: center; justify-content: space-between; gap: 2rem; min-width: 8.6rem; padding: 0.78rem 0.85rem; border: 1px solid #c9c4b9; border-radius: 0.16rem; background: #f5f2eb; color: #292822; font: 650 0.7rem var(--font-sans); text-decoration: none; cursor: pointer; }
	.button.dark { border-color: #22221e; background: #22221e; color: #f4f1e8; }

	.page-app { min-height: 100%; padding: clamp(2rem, 4vw, 3.4rem); }
	.app-heading h2, .contact-copy h2 { font-size: clamp(2.2rem, 4.8vw, 4rem); line-height: 0.98; }
	.about-layout { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2rem, 6vw, 5rem); margin-top: 2.3rem; }
	.about-copy p { margin: 0; color: #5f5c54; font-size: 0.88rem; line-height: 1.68; }
	.about-copy p + p { margin-top: 1rem; }
	.stack-list { margin: 0; border-top: 1px solid #cfcac0; }
	.stack-list div { display: grid; grid-template-columns: 6.7rem 1fr; gap: 1rem; padding: 0.8rem 0; border-bottom: 1px solid #cfcac0; }
	.stack-list dt { color: #847f75; font-size: 0.64rem; text-transform: uppercase; }
	.stack-list dd { margin: 0; font-size: 0.74rem; line-height: 1.4; }

	.work-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
	.work-heading > a { color: #656159; font-size: 0.68rem; text-underline-offset: 0.2rem; }
	.project-list { margin-top: 2rem; border-top: 1px solid #c8c3b9; }
	.project { position: relative; display: grid; grid-template-columns: 2rem 1fr auto; gap: 1rem; padding: 1.1rem 2.2rem 1.1rem 0; border-bottom: 1px solid #c8c3b9; color: inherit; text-decoration: none; }
	.project:hover { background: #e7e2d8; }
	.project-number, .project-year { color: #8a857b; font: 0.6rem var(--font-sans); }
	.project h3 { font-size: 1.25rem; }
	.project p { max-width: 42rem; margin: 0.32rem 0 0; color: #666159; font-size: 0.7rem; line-height: 1.48; }
	.project ul { display: flex; flex-wrap: wrap; gap: 0.65rem; margin: 0.62rem 0 0; padding: 0; list-style: none; color: #817b71; font-size: 0.57rem; text-transform: uppercase; letter-spacing: 0.06em; }
	.project-arrow { position: absolute; right: 0; top: 1.05rem; transition: transform 120ms ease; }
	.project:hover .project-arrow { transform: translate(0.14rem, -0.14rem); }

	.contact-app { display: grid; grid-template-columns: 1fr minmax(14rem, 0.72fr); gap: clamp(2.5rem, 8vw, 7rem); align-items: center; }
	.contact-copy > p:not(.eyebrow) { max-width: 31rem; margin: 1.05rem 0 0; color: #676259; font-size: 0.83rem; line-height: 1.6; }
	.email-link { display: flex; align-items: center; justify-content: space-between; max-width: 31rem; margin-top: 2rem; padding: 0.95rem 0; border-top: 1px solid #c8c3b9; border-bottom: 1px solid #c8c3b9; color: #25241f; font-size: clamp(0.95rem, 2vw, 1.3rem); text-decoration: none; }
	.contact-card { border-top: 1px solid #c8c3b9; }
	.contact-card > .eyebrow { padding-top: 1rem; }
	.contact-card > a, .contact-card > div { display: grid; grid-template-columns: 4.2rem 1fr auto; gap: 0.8rem; padding: 0.82rem 0; border-top: 1px solid #d5d0c7; color: inherit; font-size: 0.68rem; text-decoration: none; }
	.contact-card span { color: #837e74; }
	.contact-card strong { font-weight: 600; }
	.contact-card i { font-style: normal; }

	.terminal-app { min-height: 100%; padding: 1.35rem; background: rgb(16 16 14 / 0.78); color: #c8c4b7; font: 0.76rem/1.7 ui-monospace, SFMono-Regular, Menlo, monospace; }
	.terminal-app p { margin: 0.12rem 0; }
	.terminal-app span { color: #90ad87; }
	.terminal-app a { color: #d5bd82; }
	.prompt i { display: inline-block; width: 0.52rem; height: 1em; vertical-align: -0.15em; background: #cbc7bb; animation: blink 1s steps(1) infinite; }
	.trash-app { display: grid; place-content: center; justify-items: center; min-height: 100%; padding: 2rem; text-align: center; }
	.trash-empty-icon { display: grid; place-items: center; width: 4.5rem; height: 4.5rem; margin-bottom: 1.2rem; border: 1px solid #c8c3b9; border-radius: 1rem; background: #e4e1d9; color: #5f5b53; }
	.trash-empty-icon :global(svg) { width: 2.15rem; height: 2.15rem; }
	.trash-app .eyebrow { margin-bottom: 0.65rem; }
	.trash-app h2 { font-size: clamp(2rem, 5vw, 3rem); }
	.trash-app > p:last-child { margin: 0.65rem 0 0; color: #777269; font-size: 0.84rem; }
	@keyframes blink { 50% { opacity: 0; } }

	@media (max-width: 760px) {
		.profile-pane, .page-app { padding: 1.35rem; }
		.profile-pane { min-height: 100%; }
		.identity img { width: 3.2rem; height: 3.2rem; }
		.identity h2 { font-size: 1.9rem; }
		.roles { font-size: 0.76rem; }
		.lede { font-size: 0.78rem; }
		.button { min-width: 0; gap: 1rem; padding: 0.7rem; }
		.app-heading h2, .contact-copy h2 { font-size: 2.15rem; }
		.about-layout, .contact-app { grid-template-columns: 1fr; gap: 1.8rem; margin-top: 1.4rem; }
		.stack-list div { grid-template-columns: 5.3rem 1fr; }
		.work-heading { align-items: start; }
		.project { grid-template-columns: 1.4rem 1fr; padding-right: 1.4rem; }
		.project-year { display: none; }
		.project p { font-size: 0.66rem; }
	}

	@media (prefers-reduced-motion: reduce) {
		.prompt i { animation: none; }
	}
</style>

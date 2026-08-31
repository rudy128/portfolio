<script lang="ts">
	import Icon from './Icon.svelte';
	import type { GitHubContributions } from './types';

	export let username: string;
	export let profileUrl: string;
	export let contributions: GitHubContributions;

	const cellSize = 5;
	const cellGap = 1.5;
	const pitch = cellSize + cellGap;
	$: startOffset = contributions.days[0]
		? new Date(`${contributions.days[0].date}T00:00:00Z`).getUTCDay()
		: 0;
	$: cells = contributions.days.map((day, index) => {
		const calendarIndex = index + startOffset;
		return {
			...day,
			x: Math.floor(calendarIndex / 7) * pitch,
			y: (calendarIndex % 7) * pitch,
		};
	});
	$: weekCount = Math.max(1, Math.ceil((contributions.days.length + startOffset) / 7));
	$: graphWidth = (weekCount - 1) * pitch + cellSize;
	const graphHeight = 6 * pitch + cellSize;
</script>

<header class="github-header">
	<span class="github-title"><Icon name="github" /><strong>GITHUB</strong></span>
	<a href={profileUrl} target="_blank" rel="noreferrer">@{username} ↗</a>
</header>

{#if cells.length > 0}
	<div class="contribution-total"><strong>{contributions.total.toLocaleString('en-US')}</strong><span>contributions in the last year</span></div>
	<svg class="contribution-graph" viewBox={`0 0 ${graphWidth} ${graphHeight}`} role="img" aria-label={`${contributions.total} GitHub contributions in the last year`}>
		{#each cells as day}
			<rect class={`level-${day.level}`} x={day.x} y={day.y} width={cellSize} height={cellSize} rx="1">
				<title>{day.label}</title>
			</rect>
		{/each}
	</svg>
	<div class="contribution-scale" aria-hidden="true"><span>Less</span>{#each [0, 1, 2, 3, 4] as level}<i class={`level-${level}`}></i>{/each}<span>More</span></div>
{:else}
	<a class="contribution-fallback" href={profileUrl} target="_blank" rel="noreferrer">View contributions on GitHub ↗</a>
{/if}

<style>
	.github-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; color: #625f58; }
	.github-title { display: flex; align-items: center; gap: 0.45rem; font-size: clamp(0.78rem, calc(0.65rem + 0.18vw), 0.92rem); letter-spacing: 0.08em; }
	.github-title :global(svg) { width: 1.05rem; height: 1.05rem; }
	.github-header a { color: #716d64; font-size: 0.72rem; text-decoration: none; }
	.contribution-total { display: flex; align-items: baseline; gap: 0.5rem; margin-top: 0.8rem; }
	.contribution-total strong { color: #24231f; font-size: clamp(1.45rem, calc(1.15rem + 0.42vw), 1.8rem); font-weight: 500; letter-spacing: -0.04em; }
	.contribution-total span { color: #716d64; font-size: 0.68rem; }
	.contribution-graph { display: block; width: 100%; height: auto; margin-top: 0.72rem; overflow: visible; }
	.contribution-graph rect, .contribution-scale i { fill: #d6d2c9; }
	.contribution-graph .level-1, .contribution-scale .level-1 { fill: #b6c8b7; background: #b6c8b7; }
	.contribution-graph .level-2, .contribution-scale .level-2 { fill: #87a88a; background: #87a88a; }
	.contribution-graph .level-3, .contribution-scale .level-3 { fill: #5e8663; background: #5e8663; }
	.contribution-graph .level-4, .contribution-scale .level-4 { fill: #31583a; background: #31583a; }
	.contribution-scale { display: flex; align-items: center; justify-content: end; gap: 0.24rem; margin-top: 0.55rem; color: #777269; font-size: 0.58rem; }
	.contribution-scale i { display: block; width: 0.48rem; height: 0.48rem; border-radius: 0.1rem; background: #d6d2c9; }
	.contribution-fallback { display: block; margin-top: 0.9rem; color: #494740; font-size: 0.76rem; text-underline-offset: 0.2rem; }
</style>

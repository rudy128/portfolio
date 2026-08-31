<script lang="ts">
	export let name: string;
</script>

<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
	{#if name === 'home'}
		<path d="M3.5 10.5 12 3l8.5 7.5" /><path d="M5.5 9v11h13V9M9.5 20v-6h5v6" />
	{:else if name === 'about'}
		<circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.6-4.1 2.8-6.1 6.5-6.1s5.9 2 6.5 6.1" />
	{:else if name === 'work'}
		<path d="M3.5 7.5h6l1.6-2h9.4v13H3.5z" /><path d="M3.5 10h17" />
	{:else if name === 'contact'}
		<rect x="3.5" y="5.5" width="17" height="13" rx="1" /><path d="m4.2 7 7.8 6 7.8-6" />
	{:else if name === 'terminal'}
		<rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="m7 9 3 3-3 3M12.5 15h4" />
	{:else if name === 'trash'}
		<path d="M4 7h16M9 7V4h6v3M6.5 7l.8 13h9.4l.8-13M10 10v7M14 10v7" />
	{:else if name === 'github'}
		<path d="M15 21v-3.4c.1-1-.4-1.8-1-2.2 3.3-.4 6.7-1.6 6.7-7.2A5.6 5.6 0 0 0 19.2 4 5.2 5.2 0 0 0 19 0s-1.2-.4-4 1.5a13.8 13.8 0 0 0-7 0C5.2-.4 4 0 4 0a5.2 5.2 0 0 0-.2 4A5.6 5.6 0 0 0 2.3 8.2c0 5.6 3.4 6.8 6.7 7.2-.4.4-.8 1.1-.9 2.1V21" /><path d="M8.1 18.5c-3 .9-3-1.5-4.2-1.9" />
	{:else if name === 'linkedin'}
		<rect x="3.5" y="9" width="3.5" height="11" /><path d="M5.25 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4M11 20v-6.1c0-2.2 1.1-3.5 3.1-3.5 2.4 0 3.4 1.5 3.4 4.2V20M11 9v11" />
	{:else if name === 'x'}
		<path d="M4.5 4.5 19.5 19.5M19.5 4.5 4.5 19.5" stroke-width="2" />
	{/if}
</svg>

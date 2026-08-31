import type { GitHubContributionDay, GitHubContributions } from '../components/desktop/types';

const emptyContributions: GitHubContributions = { total: 0, days: [] };
let request: Promise<GitHubContributions> | undefined;

function parseCount(label: string) {
	const match = label.match(/^(\d[\d,]*) contributions?/i);
	return match ? Number(match[1].replaceAll(',', '')) : 0;
}

async function loadGitHubContributions(username: string): Promise<GitHubContributions> {
	try {
		const response = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
			headers: {
				Accept: 'text/html',
				'User-Agent': `${username}-portfolio`,
			},
			signal: AbortSignal.timeout(5_000),
		});

		if (!response.ok) return emptyContributions;
		const html = await response.text();
		const totalMatch = html.match(/id="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s+contributions/i);
		const cellPattern = /<td\b(?=[^>]*data-date="([^"]+)")(?=[^>]*data-level="([0-4])")[^>]*><\/td>\s*<tool-tip\b[^>]*>([^<]*)<\/tool-tip>/g;
		const days: GitHubContributionDay[] = [...html.matchAll(cellPattern)]
			.map((match) => ({
				date: match[1],
				level: Number(match[2]),
				label: match[3].trim(),
				count: parseCount(match[3]),
			}))
			.sort((left, right) => left.date.localeCompare(right.date));

		if (days.length === 0) return emptyContributions;
		return {
			total: totalMatch ? Number(totalMatch[1].replaceAll(',', '')) : days.reduce((sum, day) => sum + day.count, 0),
			days,
		};
	} catch {
		return emptyContributions;
	}
}

export function getGitHubContributions(username: string) {
	request ??= loadGitHubContributions(username);
	return request;
}

export type AppId = 'home' | 'about' | 'work' | 'contact' | 'terminal' | 'trash';

export interface Profile {
	name: string;
	handle: string;
	location: string;
	role: string;
	jobTitle: string;
	company: string;
	email: string;
	github: string;
	linkedin: string;
	x: string;
	xHandle: string;
}

export interface XPost {
	id: string;
	text: string;
	publishedAt: string;
	href: string;
	image: string;
}

export interface GitHubCommit {
	organization: string;
	organizationUrl: string;
	organizationAvatar: string;
}

export interface Project {
	number: string;
	title: string;
	description: string;
	tools: string[];
	year: string;
	href: string;
	liveUrl?: string;
}

export interface WindowState {
	key: string;
	appId: AppId;
	title: string;
	x: number;
	y: number;
	width: number;
	height: number;
	z: number;
	minimized: boolean;
	maximized: boolean;
}

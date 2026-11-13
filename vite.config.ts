import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import markdownLinks from './src/lib/content/markdown-links.js';

const base = loadEnv('production', false, 'GITHUB_').GITHUB_PAGES === 'true' ? '/WebBasics' : '';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			extensions: ['.svelte', '.svx'],
			preprocess: mdsvex({
				extensions: ['.svx'],
				rehypePlugins: [[markdownLinks, { base }]],
				highlight: { alias: { html: 'markup' } }
			}),
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			paths: {
				base
			}
		})
	]
});

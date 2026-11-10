# WebBasics

A static web app using SvelteKit 3, Svelte 5, TypeScript, Tailwind CSS 4,
mdsvex, and `@sveltejs/adapter-static`. Dependencies are managed with npm and
locked in `package-lock.json`.

Use Node.js 22.12 or newer (Node.js 24 LTS recommended).

## Developing

```sh
npm ci
npm run dev
```

Edit `src/routes/+page.svelte` to change the course picker. The HTML welcome
page and section content are mdsvex files under `src/lib/content/html/`; fenced
code is syntax-highlighted by mdsvex. Question IDs, answer keys, feedback, and
drag-sort targets are defined in `src/lib/content/course.ts`. Keep question IDs
stable when reordering content.

The reusable quiz controls are in `src/lib/components/`. Answers are saved in
the current browser's local storage. At the end of HTML Questions, students can
download an anonymous JSON submission. `/dashboard/` analyzes multiple JSON
files locally in the browser; it does not upload or retain them.

The dashboard groups submissions by course and question ID across revisions.
Revision breakdowns retain the exported wording, options, and original grading;
MCQ options show checked/unchecked counts, with correct choices highlighted.
Revisions that differ from the current course are flagged as outdated and show
their JSON export timestamp (or export date range), not the answer time.
Questions no longer in the course remain analyzable from their exported data.

The SHA-256 checksum detects accidental file corruption only. Because the app
has no server or private signing key, it cannot prevent deliberate edits to a
submission. Content gaps and corrections from the supplied source are tracked
in [`CONTENT_ISSUES.md`](CONTENT_ISSUES.md).

## Checking and building

```sh
npm run check
node --experimental-strip-types --test tests/analysis.test.mjs
npm run build
npm run preview
```

## Static deployment

Deploy the contents of `build/` to a static web host. No Node.js server is
needed in production. All routes are prerendered through `src/routes/+layout.ts`,
with trailing slashes so nested routes produce directory-based `index.html` files.
Dynamic routes must provide prerender entries.

The static adapter and Tailwind Vite plugin are configured in `vite.config.ts`.
For deployment under a subpath, configure SvelteKit's `paths.base` there before
building.

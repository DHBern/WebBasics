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

For multiple-choice questions, an optional array of Markdown blocks can be
placed between the title and options: `mcq('id', 'Title', ['Question text',
'```html\n<p>Example</p>\n```'], [option(...)], 'Feedback')`. Each array item
is rendered inside the exercise, before the options. Existing calls without a
description remain supported. Description changes invalidate saved answers,
and descriptions are included in exported submissions.

All exercise bodies support a Markdown string with blank lines and fenced code
blocks, or an array of Markdown blocks. Keep the title short and put the body in
the third argument: `input('id', 'Title', ['First paragraph', '```html\n<p>Code</p>\n```',
'Last paragraph'], ['Feedback paragraph', '```html\n<p>Explanation</p>\n```'], 'bonus-id')`.
For `dragAndDrop(...)` and `sort(...)`, the third argument is the instructions
body; items, targets, and the answer key follow it as before. These bodies render
before the interactive controls and are retained in exported submissions.

Feedback accepts a Markdown string (including multiple paragraphs and fenced
code) or an array of Markdown blocks. Exercises can optionally link to a
separately defined bonus exercise by passing its ID as their final argument,
for example `mcq('id', 'Title', [option(...)], 'Feedback', 'bonus-id')`.
Omitting the ID means there is no linked bonus. Define the bonus in the section's
question list using `input(...)`, `mcq(...)`, or a placement exercise with that
ID; it appears after the parent is answered and is not required for completion.
Use `undefined` for omitted optional arguments before the bonus ID. `sort(...)`,
`dragAndDrop(...)`, and `input(...)` also take the bonus ID as their final argument.
Text input answers are ungraded, saved separately, and included in exports only
when submitted. Previously saved comment bonus responses are migrated.

The reusable quiz controls are in `src/lib/components/`. The HTML syntax diagram
uses SVG text, brackets, and HTML dropzones inside
`foreignObject` elements in one coordinate system. It scrolls horizontally on
narrow screens to keep the bracket endpoints aligned with the code.
The button example distinguishes the class-attribute and class names, the
style-attribute and CSS declarations, and the valueless boolean `disabled`
attribute. Separate bracket rows and gaps distinguish nested and
adjacent spans, with dropzones above and below the code.

Answers are saved in the current browser's local storage. At the end of HTML Questions, students can
download an anonymous JSON submission. `/dashboard/` analyzes multiple JSON
files locally in the browser; it does not upload or retain them.

Drag-and-drop and sorting exercises allow unlimited practice with **Try again**.
Only the first submitted attempt is saved in browser local storage and included
in the JSON export, even if a later practice attempt is correct. Practice feedback
is temporary; reopening the course restores the first attempt. **Reset progress**
clears saved attempts. As before, revising a question invalidates its saved answer.
Multiple-choice questions still allow only one submission.
**Try again** and **Remove all** sit directly below the exercise, before feedback.
**Remove all** returns every item to the item pool in its original shuffled order,
including when starting another practice attempt. Dropping an item outside all
destinations also returns it to that pool. Neither operation clears saved results;
only **Reset progress** (or a question revision) does that. Sorting exercises
retain their initially shuffled heading list and provide a pool for returned items.

Drag-and-drop and sorting exercises use the MIT-licensed `svelte-dnd-action`
library for visible drag previews, touch input, and keyboard dragging. Press
Space to pick up/drop, arrow keys to reorder, and Tab to move between areas.
Drag areas are isolated by question ID; single-item destinations swap their
existing item back to the source destination (or the item pool).

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
node --experimental-strip-types --test tests/*.test.mjs
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

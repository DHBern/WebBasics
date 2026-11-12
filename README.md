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
code is syntax-highlighted by mdsvex. Exercise Markdown uses Prism for supported
code languages, with the same dark syntax theme as lessons. Use fenced `html`
blocks for HTML examples; unhighlighted code also has a readable foreground.
Question IDs, answer keys, feedback, and
drag-sort targets are defined in `src/lib/content/course.ts`. Keep question IDs
stable when reordering content.
All multiple-choice cards show a shared "Select all correct answers" note above
the options, so prompts should not repeat it.

All exercise helpers take one object with the same shared fields:
`slug` (stable ID), `title`, optional `question` (the body), optional `feedback`,
and optional `bonusId`. Text fields accept a Markdown string or an array of
Markdown blocks, including fenced code. Keep titles short; put explanations and
examples in `question`, which renders before the controls and is included in
exports. Multiline titles remain supported. Body changes invalidate saved answers.

```ts
input({
	slug: 'semantic-definition',
	title: 'Definition with examples and motivation',
	question: [
		'Give a few examples of semantic HTML elements and explain why they are important.',
		'If unsure, read a definition and answer in your own words.'
	]
});

mcq({
	slug: 'example',
	title: 'Choose an element',
	question: ['Which element represents a paragraph?'],
	options: [
		{ id: 'p', text: '`<p>`', correct: true },
		{ id: 'span', text: '`<span>`', correct: false }
	],
	feedback: ['A paragraph uses `<p>`.']
});
```

`sort({...})` and `dragAndDrop({...})` additionally require `question`, `items`,
`targets`, and `answerKey` (an item-ID-to-target-ID dictionary). Answer keys are
defined directly in each exercise rather than looked up implicitly.
Internally, `slug` maps to the existing `id`, `title` to `prompt`, and `question`
to `description` or `instructions`; saved-answer and export formats are unchanged.

Render an exercise in the section's `.svx` file using
`<ExerciseCard question={getQuestion('semantic-definition')} />`.
The ID must match its `slug`. An optional `bonusId` links to another exercise
defined in the section's question list; it appears after the parent is answered
and is excluded from required completion. Omit unused properties entirely.
Lesson exercise types are no longer supported; existing section `lesson` strings
in `course.ts` are retained as inactive reference text.

Text input answers are ungraded, saved separately, and included in exports only
when submitted. **Edit answer** reopens a submitted input response; **Save answer**
replaces it, and JSON exports use the latest saved response. Unsaved edits do not
change the exported answer. Previously saved comment bonus responses are migrated.

Submitted exercises of every type show a large black tick overlapping the
top-left corner, regardless of
correctness. This completion marker remains while practising or editing a saved
answer and clears when the saved answer is reset or invalidated.

Dashboard exercises are ranked by the absolute total of wrong subtasks across
submissions and revisions: each mismatched MCQ selection or placement counts once.
Input responses remain ungraded. Percentages are not shown. For MCQ options,
only checked/unchecked counts are colored according to whether that action is correct.
Submitted MCQs retain the student's disabled checkboxes alongside correctness feedback.
The dashboard can also sort by section and exercise order. Dividers separate
options and text responses. Placement exercises show read-only galleries of
individual anonymous submissions with the same task layouts and feedback colors.
Exports include target labels and layout metadata; older exports use a matching
current revision or explicitly show target IDs when the old layout is unavailable.

Markdown links in sections, exercises, and feedback open in a new tab with
`rel="noopener noreferrer"`. Explicit HTML/Svelte navigation links are unchanged.

The reusable quiz controls are in `src/lib/components/`. Drag-and-drop and sort
exercises default to full-width targets. `ExerciseCard` forwards the optional
`targetWidth="short"` prop to drag-and-drop exercises for content-sized targets;
only Basic Website Structure currently opts in.

Drag-and-drop and sort
exercises show interaction hints in a shared top-right info tooltip. Hover, focus,
or tap the icon to open it; press Escape, tap again, or tap outside to dismiss it.
The HTML syntax diagram
uses SVG text, brackets, and HTML dropzones inside
`foreignObject` elements in one coordinate system. It scrolls horizontally on
narrow screens to keep the bracket endpoints aligned with the code.
Drag-and-drop cards can extend beyond the normal content width on wide screens;
on narrow screens the diagram remains horizontally scrollable.
Run `npm run lint` to check formatting with Prettier and then lint JavaScript,
TypeScript, and Svelte with ESLint. Run `npm run format` to apply formatting.
Prettier handles `.svx` section files as Markdown and `.svelte` components with
the Svelte plugin. Generated output and dependencies are excluded. Existing
formatting or lint violations must be resolved separately; installing the tools
does not rewrite source files.

Every section renders its content in `ExercisePath`, which connects consecutive
top-level exercises and bridges with curved lines and generous vertical spacing.
Start each section with a wide bridge titled "Next up:", containing
the topic as a Markdown heading and a short introduction.
Use `<ExerciseBridge title="Short title">` with one or more paragraphs for
transition or closing text. Bridges have white backgrounds and the same border as
exercises. The optional `size="small"` (default) uses one-third of the normal
exercise width; `size="wide"` uses half. Both retain a 16rem minimum where space
permits and fit smaller screens. Multiple bridges can be placed consecutively. Keep Further Reading in
its own bridge: `ExercisePath` always appends a separate navigation bridge with
the next-section or export button. Bridge alignment and exercise attachment
points (always within the middle half) are randomized once per mount. A line
leaving an exercise is grey and dashed until its first answer is submitted, then
solid black regardless of correctness. Practising or editing a saved answer does
not reset its outgoing connector.
The button example distinguishes the class-attribute and class names, the
style-attribute and CSS declarations, and the valueless boolean `disabled`
attribute. Separate bracket rows and gaps distinguish nested and
adjacent spans, with dropzones above and below the code.
To debug any exercise (including bonus questions), append `?debug=1` to its page
URL to show **Debug: fill randomly**. Course-section navigation preserves this
flag; remove it to hide the controls. Filling selects random MCQ options,
distributes all drag-and-drop or sort items, or inserts sample text. It does not
submit an answer; submitting still saves it in browser storage. Already submitted
answers remain locked: use **Try again** or **Edit answer** where available, or
**Reset progress** to debug a fresh first attempt.

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
npx tsc --ignoreConfig --noEmit --strict --target es2022 --module esnext --moduleResolution bundler --allowImportingTsExtensions tests/course-types.ts
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

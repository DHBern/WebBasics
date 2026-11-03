# HTML course content: issues and decisions

The source for this conversion was the Markdown supplied in the project conversation; it was not present as a repository file. Locations below use its section headings and exercise titles so they can be found in the original document.

## Referenced diagrams

No image files need to be located or added. The original embeds were diagram-shaped dropzones, and have been replaced with functional HTML/CSS sorting interfaces.

- **Basic Syntax (Elements and Attributes) → “Sort HTML-Parts in correct order”** refers to `Pasted image 20261009154323.png` and `Pasted image 20261009154417.png`. Their exact appearance cannot be recovered from the text. The replacement uses a nested example for the element, opening/closing tags, attribute name/value, and content.
- **Webpage Structure → “Sort Elements inside body”** refers to `Pasted image 20261010113054.png`. The replacement is an editable nested document tree with head and body dropzones.

## Incomplete source material

- **URL Structure → “URL Encoding”** says “Link a URI-Converter” but provides no link or answer. It is shown as lesson text, not an interactive question.
- **Basic Syntax → “Closing Tags and Self-closing Elements ==TODO==”** contains placeholder choices (`==...==`) and an unfinished answer. It is omitted from the student exercises.
- **Semantic HTML → “Divs vs. semantic HTML”** has `==[TODO]==`; the two promised code blocks are absent. It is omitted rather than reconstructing an unknown comparison.
- **Webpage Structure → “Sort Elements inside body” → Answer** contains `==Explain the difference between section and article==`. Add the intended explanation when ready.
- **Semantic HTML → “Definition with examples and motivation”** has an empty reference link (`[here]()`); the prompt is retained as lesson content.
- **Semantic HTML → “Bonus: Micro-Project”** begins with `==Improve this==`. The task is presented as an optional lesson activity; its title/intent may need clarification.
- **Formatting Text → “Block elements and inline elements” → Answer** ends with an incomplete lookup link (`[here](...)`); that dangling reference was not rendered.
- **Images → “Image dimensions” → Further Reading** has an empty image-formats link (`[here]()`); the surrounding explanation and other links are retained.
- **Embeddings (iframe) → Answer** cites an unfinished `[SRF article](TODO)` reference. It remains identified as TODO in the feedback.
- **Comments → “Visibility of Comments” → Report your findings** contains only `[...]`; no Wikipedia findings were supplied.
- **Forms and Buttons → “Submitting a form 2”** ends with the incomplete option “If a form contains multiple buttons inside form, the submit button”. The app uses a complete, corrected explanation of default submit-button behavior instead.

## Corrections made and source mismatches

- **Comments → “Visibility of Comments”**: the source marks “Comments in HTML are invisible to the user” as false, then explains they remain visible in source. The distinction is clarified: comments do not appear in the rendered page, but can be read in its source.
- **Basic Syntax → “Closing Tags and Self-closing Elements”**: the source recommends `<img ... />` as the “correct” syntax. HTML `img` is a void element and has no end tag; the trailing slash is optional and does not close it. The feedback now says this explicitly.
- **Webpage Structure → “Sort Elements inside body”** lists `<sidebar>`. That is not the standard semantic element; the exercise uses `<aside>`, and the dropzone places it as a sibling of `<main>`.
- **Formatting Text → “Block elements and inline elements”** lists `<quote>`, which is not an HTML element. The exercise uses `<q>` and notes the correction.
- **Forms and Buttons → “Sort Elements inside body”**: the second label example has an extra `</label>` and uses `for="pwd"` without an input with `id="pwd"`. Its original answer says both examples work. The app corrects the key to “Only the first snippet works as written” and explains the label association issue.
- **Forms and Buttons → “Submitting a form 2”**: buttons inside forms default to submit buttons unless another type is specified; an explicit `type="submit"` is not required for every submit button.
- **Embeddings (iframe) → “Information exchange (CSS and trackers)”**: iframe documents have separate styles, but an iframe is not “completely sandboxed” by default. The `sandbox` attribute adds restrictions; third-party embeds can track visitors.
- **URL Structure → “Learn and sort URL parts”**: the template contains two path blanks, while the provided element list names “subroute” once. The replacement supplies two subroute items; confirm whether that was intended.
- **Webpage Structure → “Sort Elements inside body”**: many DOM trees are valid. The supplied source references a missing diagram and does not specify all parent/child relationships. The replacement tree is an instructional example, not the only valid structure.
- **Formatting Text → “Sort the headings from small size to large size”**: the implementation interprets this as heading-level order (`h6` smallest to `h1` largest); visual size can be changed with CSS.
- **Lists and Tables → “Identify and Sort List-Elements and Table-Elements”**: the source includes “...” without defining any additional items. The interactive version uses the named standard list/table elements and leaves “Both” and “Neither” as available categories.

## Authoring and progress behavior

- Editable course sections are `.svx` files in `src/lib/content/html/sections/`; question keys, options, feedback, and sorting targets are in `src/lib/content/course.ts`.
- Each question has a stable ID. A change to its prompt, choices/items, answer key, or sorting targets changes its revision; the browser clears that question's old answer and shows a one-sentence notice. Reordering questions does not change their IDs.
- Questions with no source explanation show grading results only. Add a `feedback` string to the question in `course.ts` when an explanation becomes available.

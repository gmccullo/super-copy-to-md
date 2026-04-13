# Super Copy to Markdown — Requirements

## Context menu actions

The extension adds a **Super copy to markdown** submenu to the browser right-click context menu. The submenu is divided into four groups:

**Group 1 — copy selection as markdown** (visible when text is selected)

- **Copy as markdown** — converts the selected HTML to Markdown and writes it to the clipboard.
- **Copy as quote** — same as above, but every line is prefixed with `> `, producing a Markdown blockquote. A citation line is appended: a blank `>` line followed by `> \~ [Page Title](<url>)`.

**Group 2 — copy as link** (visible depending on context)

- **Copy as link** — uses the selected text as the caption of a Markdown inline link to the current page: `[caption](<url>)`. If the selection spans multiple lines, only the first non-empty line is used as the caption, with `…` appended. *(selection context)*
- **Copy link as markdown** — right-click a hyperlink to copy it as a Markdown inline link. The caption is the selected text if present, otherwise the link's anchor text, otherwise the URL itself. *(link context)*
- **Copy page link** — copies the current page title and URL as a Markdown inline link: `[title](<url>)`. *(all contexts)*

**Group 3 — copy image** (visible when right-clicking an image)

- **Copy image as markdown** — copies the image as a Markdown image embed: `![alt](<src>)`. The alt text is the selected text if present, otherwise the image's `alt` attribute.

**Group 4 — options**

- **Options** — opens the Options page.

## URLs

**As a user, I want all URLs to be fully qualified and human-readable** so that links work correctly when pasted into a Markdown editor that is not the original webpage.

- All URLs are resolved to absolute form (e.g. `https://example.com/page`, not `/page`).
- URLs are entered as literals between angle brackets per CommonMark convention — decoded from percent-encoding and human-readable (e.g. `<https://example.com/hello world>`, not `<https://example.com/hello%20world>`).

## Link styles

**As a user, I want links rendered as inline links by default** — `[text](<url>)` — so that the Markdown is self-contained.

**As a user, I want the option to use reference-style links** — `[text][1]` — with all definitions (`[1]: <url>`) appended after the content and citation, so that the body of the Markdown remains readable. This applies to both hyperlinks and images.

## Options page

**As a user, I want to configure the link style** without editing any files.

- The Options page is accessible via **Super copy to markdown → Options** in the right-click context menu.
- A **Reset to defaults** button restores the link style to inline.
- Settings are persisted via `chrome.storage.sync`.

## Tables

**As a user, I want HTML tables converted to GitHub Flavored Markdown (GFM) tables** so that tabular data is readable in the pasted output.

- A table is converted to GFM when it has a heading row and no merged data cells.
- GFM table columns are padded so that pipe characters align vertically.
- Tables that cannot be represented in GFM (no heading row, or data cells with `colspan`/`rowspan` > 1) are kept as raw HTML. Merged header cells (`<th>`) are tolerated.

**As a user, I want partial table selections to work sensibly** so that I do not have to select an entire table to get clean output.

- When both endpoints of a selection fall within the same table, the extension automatically includes the header row(s) plus only the data rows that intersect the selection.

## Markdown quality

**As a user, I want the output to be clean and linter-friendly** so that it does not generate warnings in tools like markdownlint.

- `<br>` tags with no meaningful content following them are dropped rather than converted to a trailing backslash.
- `<br>` tags that are followed by real content are converted to a CommonMark hard line break (a trailing `\`).
- List markers are followed by exactly one space (markdownlint MD030).
- Blank lines within list items carry no trailing spaces (markdownlint MD009).
- Emphasis uses `_` by default but switches to `*` when the emphasised text is adjacent to a word character, to avoid Markdown parse failures in contexts like *mid*word emphasis.
- Characters that have special meaning in Markdown are escaped in body text so they are not misinterpreted by parsers or linters. The following are handled: `\` `` ` `` `*` `_` `[` `]` `(` `)` `#` `+` `-` `.` `!` `|` `{` `}` `~` `<`.
- Strikethrough (`<del>`, `<s>`, `<strike>`) is converted to `~~text~~`.
- Task list checkboxes are converted to `[x]` / `[ ]`.

## Known behaviour

- List items that contain block-level children (e.g. `<div>` elements) produce multi-paragraph list item Markdown, which requires indented continuation lines. Inside a blockquote this results in lines like `>   text` (three spaces after `>`). This is valid CommonMark and is not treated as an error.

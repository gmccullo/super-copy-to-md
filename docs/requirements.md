# Super Copy to Markdown — Requirements

## Core behaviour

**As a user, I want to copy any selected text on a webpage as formatted Markdown** so that I can paste it directly into a Markdown editor without manual cleanup.

- The extension is triggered by right-clicking selected text and choosing **Super copy to markdown → Copy** from the context menu.
- The converted Markdown is written to the clipboard.

**As a user, I want every line of the copied Markdown prefixed with a blockquote marker** so that the pasted content is immediately formatted as a blockquote.

- The default prefix is `> `.
- Blank lines receive the prefix without trailing whitespace (i.e. `>` not `> `), to avoid trailing-space linting violations.

**As a user, I want a citation line appended automatically** so that the source of a quotation is always recorded alongside it.

- After the Markdown content, two additional prefixed lines are appended: a blank line, then an attribution line in the form `\~ [Page Title](<url>)`.
- Square brackets in the page title are escaped (as `\[` and `\]`) so the title is valid as Markdown link text.

## URLs

**As a user, I want all URLs to be fully qualified and human-readable** so that links work correctly when pasted into a Markdown editor that is not the original webpage.

- All URLs are resolved to absolute form (e.g. `https://example.com/page`, not `/page`).
- URLs are entered as literals between angle brackets per CommonMark convention — decoded from percent-encoding and human-readable (e.g. `<https://example.com/hello world>`, not `<https://example.com/hello%20world>`).

## Link styles

**As a user, I want links rendered as inline links by default** — `[text](<url>)` — so that the Markdown is self-contained.

**As a user, I want the option to use reference-style links** — `[text][1]` — with all definitions (`[1]: <url>`) appended after the content and citation, so that the body of the Markdown remains readable. This applies to both hyperlinks and images.

## Options

**As a user, I want to configure the prefix and link style** without editing any files.

- The Options page is accessible via **Super copy to markdown → Options** in the right-click context menu.
- The prefix field accepts any string, including an empty string (which disables prefixing entirely).
- A **Reset to defaults** button restores the prefix to `> ` and the link style to inline.
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

# Super Copy to Markdown

A Chromium extension that copies selected webpage content to the clipboard as clean, ready-to-paste Markdown — with a single right-click.

## Features

- **Blockquote prefix** — every line prefixed with `> ` by default; configurable or removable
- **Citation line** — appends `\~ [Page Title](<url>)` automatically
- **GFM tables** — HTML tables converted to aligned GitHub Flavored Markdown tables; partial table selections include the header row plus only the rows you selected
- **Full, decoded URLs** — all links use fully qualified, human-readable URLs in angle brackets
- **Inline or reference links** — `[text](<url>)` or `[text][1]` with definitions appended
- **Clean output** — markdownlint-friendly: 1 space after list markers, no trailing spaces, smart emphasis delimiters

## Usage

1. Select text on any webpage
2. Right-click → **Super copy to markdown → Copy**
3. Paste into your editor

Right-click anywhere → **Super copy to markdown → Options** to configure the prefix and link style.

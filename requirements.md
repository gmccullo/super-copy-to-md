# Chromium extensions

## name

Super copy html to markdown

## local develop location

C:\Dropbox.staging\personal.programming.vscode\super-copy-to-md

## requirements

1. copy html src of selected range to the clipboard as formatted markdown.
2. by default prefix each line of the markdown with blockquote marker, ie "> ".
3. make the prefix configurable and optional.
4. after the markdown, append a new blank line followed by another line. both lines should also be prefixed. the last line contains "\~ [<page title>](<url>)". <page title> is the title of the html page.
5. write all urls as literals inside angle brackets, (not url-encoded). all urls must be fully qualified (e.g. "https://example.com/word/lane", not "/word/lane").
6. escape appropriate characters in the markdown markup. for example, left braces that are not links.
7. by default define links as standard markdown inline links.
8. provide a configuration option to define links as reference links. for example, links to other pages or images.
9. triggered via right-click context menu on selected text ("Copy as Markdown").
10. trailing <br> tags (no meaningful content after them) are dropped rather than converted to a backslash line break.
11. html tables are converted to GFM markdown tables when possible (heading row present, no merged data cells). tables where data cells (td) have colspan/rowspan > 1, or with no heading row, are kept as raw HTML. merged header cells (th) are tolerated. all urls in table links are fully resolved against the page url.
12. strikethrough (<del>, <s>, <strike>) is converted to ~~text~~. task list checkboxes are converted to [x] / [ ].
13. known behaviour: list items containing block-level children (e.g. <div> elements) produce multi-paragraph list item markdown, which requires indented continuation lines. inside a blockquote this results in e.g. ">   text" (3 spaces). this is valid CommonMark.

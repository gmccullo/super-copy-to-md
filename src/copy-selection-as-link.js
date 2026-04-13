// copy-selection-as-link.js — Super Copy to Markdown
// Copies the selected text as the caption of a Markdown inline link to the current page.
// If the selection spans multiple lines, only the first non-empty line is used, with "…" appended.

(function () {
	const selection = window.getSelection();
	if (!selection || selection.isCollapsed) { return; }

	const lines = selection.toString().split('\n').map(l => l.trim()).filter(l => l !== '');
	if (lines.length === 0) { return; }

	const caption = lines.length > 1 ? lines[0] + '\u2026' : lines[0];
	const escaped = caption.replace(/[[\]]/g, '\\$&');
	const url = window.location.href;

	navigator.clipboard.writeText(`[${escaped}](<${url}>)`).catch(err => {
		console.error('Super Copy to Markdown: clipboard write failed', err);
	});
}());

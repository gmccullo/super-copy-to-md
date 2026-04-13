// copy-link.js — Super Copy to Markdown
// Copies the current page title and URL as a Markdown inline link.

(function () {
	const title = document.title.replace(/[[\]]/g, '\\$&');
	const url = window.location.href;
	navigator.clipboard.writeText(`[${title}](<${url}>)`).catch(err => {
		console.error('Super Copy to Markdown: clipboard write failed', err);
	});
}());

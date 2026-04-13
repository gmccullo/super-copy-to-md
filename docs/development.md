# Development

## Loading the extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `src/` folder

## Project structure

```
src/        Extension source (point "Load unpacked" here)
docs/       Requirements and development notes
design/     Source assets — icon SVG, icon export tool
```

## Tooling

```powershell
npm run lint     # ESLint
npm run build    # produces super-copy-to-md-v{version}.zip
```

ESLint is configured in `eslint.config.js`. Rules: `eslint:recommended` plus `curly`, `no-var`, `prefer-const`, `eqeqeq`. Vendored libraries (`turndown.js`, `turndown-plugin-gfm.js`) are excluded.

## Building for the Chrome Web Store

```powershell
npm run build
```

Produces `super-copy-to-md-v{version}.zip` — upload this file to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## Code notes

### Architecture

This is a Manifest V3 extension with no build step — plain JavaScript, no transpilation.

- **`background.js`** — service worker. Registers the context menu on `onInstalled`. Handles clicks by injecting scripts into the active tab via `chrome.scripting.executeScript`.
- **`content.js`** — converts the current selection to Markdown and writes it to the clipboard. Executed on demand via script injection. Reads `linkStyle` from `chrome.storage.sync` and the `window.__scmd.options` object for per-invocation options (see below).
- **`copy-link.js`** — copies the current page title and URL as a Markdown inline link. No dependencies.
- **`copy-selection-as-link.js`** — copies the selected text as the caption of a Markdown inline link to the current page.
- **`turndown.js`** — vendored [Turndown](https://github.com/mixmark-io/turndown) library (HTML → Markdown). Injected before `content.js` so `TurndownService` is available as a global.
- **`turndown-plugin-gfm.js`** — vendored GFM plugin, modified (see below).
- **`options.html` / `options.js`** — settings page (link style only). Opens as a full browser tab; this is standard Chrome MV3 behaviour when `openOptionsPage()` is called programmatically.

Scripts are injected on demand rather than declared as `content_scripts` in the manifest. This avoids the broad `<all_urls>` host permission, which triggers an in-depth review on the Chrome Web Store. The `activeTab` permission grants temporary access to the current tab when the user clicks a context menu item, which is sufficient.

### Per-invocation options (`window.__scmd`)

Some actions share the same content script (`content.js`) but need different behaviour. Options are passed via a global object set on the page's `window` before the script is injected:

```js
// In background.js — set options, then inject
chrome.scripting.executeScript({
  target: { tabId: tab.id },
  func: () => { window.__scmd = { options: { quote: false } }; }
}).then(() => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['turndown.js', 'turndown-plugin-gfm.js', 'content.js']
  });
});
```

`content.js` reads `window.__scmd?.options` with safe nullish defaults. The `.then()` chain guarantees the flag is set before the content script runs. Both "Copy as markdown" and "Copy as quote" always write an explicit options object so that a previous invocation's state on the same page cannot bleed through.

Current options:

| Key     | Type    | Default | Description                                                           |
| ------- | ------- | ------- | --------------------------------------------------------------------- |
| `quote` | boolean | `true`  | Prefix every line with `> ` (blockquote). `false` for plain Markdown. |

### Inline `func` scripts vs file-based scripts

For actions that need data from the background context (e.g. `info.linkUrl`, `info.srcUrl`, `info.selectionText`), scripts are passed as inline `func` + `args` to `executeScript`. For actions that only need page context, scripts are injected as files. The two approaches cannot be mixed in a single `executeScript` call.

Inline scripts in `background.js` that share logic (e.g. the `firstLine()` helper) duplicate it rather than sharing a module, since there is no build step.

### Escape function

Turndown's built-in `escape()` handles the standard Markdown punctuation characters. We extend it to also escape `{`, `}`, `~` (GFM strikethrough), and `<` (HTML tags / autolinks). The `escape()` function is only ever called on raw text nodes — never on rule output — so these additions cannot accidentally mangle Markdown constructs like `<url>` in link rules.

### The Turndown `about:blank` URL problem

Turndown parses the HTML string it receives into an internal `about:blank` document. This means `node.href` and `node.src` resolve relative URLs against `about:blank`, not the real page — so `/wiki/Page` becomes `about:blank/wiki/Page`.

**Fix:** always use `node.getAttribute('href')` (the raw attribute value) and resolve it manually:

```js
new URL(node.getAttribute('href'), window.location.href).href
```

This is done in `resolveAndDecodeUrl()`, which is called by every link and image rule.

### Turndown rule priority

`turndownService.addRule()` uses `unshift` internally — the **last rule added wins** for any given node. The plugin is loaded first (`td.use(...)`), then custom rules are added, so custom rules always take priority over plugin rules.

### GFM plugin modifications (`turndown-plugin-gfm.js`)

The vendored plugin has two modifications:

1. **`hasMergedCells` checks only `<td>`, not `<th>`.** The original checked all cells. Merged header cells are imperfect in GFM but still renderable; only merged data cells are truly unrepresentable. Changing this allows more tables to convert to Markdown instead of falling back to raw HTML.

2. **`rules.table.filter` logs a diagnostic** (`console.log`) explaining why each table was converted or kept as HTML. Useful during testing.

### Table handling flow

1. **Selection capture** (`maybeExtractTableRows`) — if both selection endpoints are within the same `<table>`, the function reconstructs a clean `<table>` element containing the header row(s) and only the data rows that intersect the selection. It returns an HTML string. For non-table selections it returns `null` and the normal `range.cloneContents()` path is used.

2. **Conversion** — Turndown + GFM plugin convert the table HTML to GFM. Tables that fail the GFM criteria (no heading row, or merged data cells) are kept as raw HTML by the plugin's `turndownService.keep()` rule.

3. **Alignment** (`alignTables`) — a post-processing regex pass on the Markdown string pads cell content so pipe characters line up vertically. This runs after Turndown, not inside it.

### Clipboard access

`navigator.clipboard.writeText()` requires the page to be in a secure context (HTTPS or localhost) and to have focus. This is always satisfied since the user just right-clicked the page. No special handling is needed.

### Prefix and blank lines

`applyPrefix()` trims trailing whitespace from the prefix before applying it to blank lines. This prevents lines like `> ` (with a trailing space) on blank lines, which markdownlint flags as MD009. Non-blank lines get the full prefix including any trailing space.

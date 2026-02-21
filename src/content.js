// content.js — Super Copy to Markdown

// Resolve a raw href/src attribute value against the real page URL, then decode.
// Must use getAttribute() + new URL() because Turndown parses HTML into an
// internal about:blank document, making node.href/node.src unreliable for
// relative URLs like "/wiki/Page" or "//cdn.example.com/x".
function resolveAndDecodeUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    const resolved = new URL(rawUrl, window.location.href).href;
    try { return decodeURIComponent(resolved); } catch (e) { return resolved; }
  } catch (e) {
    return rawUrl;
  }
}

function buildTurndown(linkStyle) {
  const refs = [];

  const td = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    br: '\\',           // backslash line break instead of trailing spaces (linter-clean)
    // emDelimiter defaults to '_'; smart rule below uses '*' for in-word cases
  });

  // GFM: tables (with merged-data-cell fallback to HTML), strikethrough, task lists
  td.use(turndownPluginGfm.gfm);

  // Extend the escape function to also escape { and }
  const originalEscape = td.escape.bind(td);
  td.escape = function (string) {
    return originalEscape(string)
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}');
  };

  // Drop trailing <br> tags (end of block, no following content) rather than
  // converting them to a backslash, which leaves lines ending in a bare \.
  td.addRule('lineBreak', {
    filter: 'br',
    replacement: function (content, node) {
      // Walk forward past whitespace-only text nodes to find real following content
      var next = node.nextSibling;
      while (next) {
        if (next.nodeType === 3 && /^\s*$/.test(next.textContent)) {
          next = next.nextSibling;
          continue;
        }
        return '\\\n'; // real content follows — keep as hard line break
      }
      return ''; // trailing <br> — discard
    }
  });

  // MD030: 1 space after list marker (Turndown default is 3 for ul, 2 for ol)
  td.addRule('listItem', {
    filter: 'li',
    replacement: function (content, node, options) {
      var parent = node.parentNode;
      var prefix;
      if (parent.nodeName === 'OL') {
        var start = parent.getAttribute('start');
        var index = Array.prototype.indexOf.call(parent.children, node);
        var num = start ? Number(start) + index : index + 1;
        prefix = num + '. ';
      } else {
        prefix = options.bulletListMarker + ' ';
      }
      var isParagraph = /\n$/.test(content);
      content = content.replace(/^\n+/, '').replace(/\n+$/, '') + (isParagraph ? '\n' : '');
      // Indent continuation lines but leave blank lines empty (no trailing spaces — MD009)
      var indent = ' '.repeat(prefix.length);
      content = content.split('\n').map(function (line, i) {
        return (i > 0 && line !== '') ? indent + line : line;
      }).join('\n');
      return prefix + content + (node.nextSibling ? '\n' : '');
    }
  });

  // Use _ normally; switch to * when adjacent to word characters to avoid parse failures
  td.addRule('emphasis', {
    filter: ['em', 'i'],
    replacement: function (content, node) {
      if (!content.trim()) return '';
      var prevText = node.previousSibling && node.previousSibling.nodeType === 3
        ? node.previousSibling.textContent : '';
      var nextText = node.nextSibling && node.nextSibling.nodeType === 3
        ? node.nextSibling.textContent : '';
      var inWord = /\w$/.test(prevText) || /^\w/.test(nextText);
      var d = inWord ? '*' : '_';
      return d + content + d;
    }
  });

  if (linkStyle === 'reference') {
    td.addRule('customLinks', {
      filter: function (node) {
        return node.nodeName === 'A' && node.getAttribute('href');
      },
      replacement: function (content, node) {
        const href = resolveAndDecodeUrl(node.getAttribute('href'));
        const id = refs.length + 1;
        refs.push(`[${id}]: <${href}>`);
        return `[${content}][${id}]`;
      }
    });
    td.addRule('customImages', {
      filter: 'img',
      replacement: function (content, node) {
        const src = resolveAndDecodeUrl(node.getAttribute('src'));
        const alt = node.getAttribute('alt') || '';
        if (!src) return '';
        const id = refs.length + 1;
        refs.push(`[${id}]: <${src}>`);
        return `![${alt}][${id}]`;
      }
    });
  } else {
    td.addRule('customLinks', {
      filter: function (node) {
        return node.nodeName === 'A' && node.getAttribute('href');
      },
      replacement: function (content, node) {
        const href = resolveAndDecodeUrl(node.getAttribute('href'));
        return `[${content}](<${href}>)`;
      }
    });
    td.addRule('customImages', {
      filter: 'img',
      replacement: function (content, node) {
        const src = resolveAndDecodeUrl(node.getAttribute('src'));
        const alt = node.getAttribute('alt') || '';
        if (!src) return '';
        return `![${alt}](<${src}>)`;
      }
    });
  }

  return { td, refs };
}

// If both range endpoints are inside the same <table>, reconstruct a clean
// table containing the header row(s) and only the data rows that intersect
// the selection. Returns an HTML string, or null if not a table selection.
function maybeExtractTableRows(range) {
  function tableAncestor(node) {
    let n = node.nodeType === 3 ? node.parentNode : node;
    while (n && n !== document.body) {
      if (n.nodeName === 'TABLE') return n;
      n = n.parentNode;
    }
    return null;
  }
  const startTable = tableAncestor(range.startContainer);
  const endTable   = tableAncestor(range.endContainer);
  if (!startTable || startTable !== endTable) return null;

  const allRows = Array.from(startTable.rows);

  // Header rows: everything in <thead>; or the first row if all cells are <th>
  let headerRows = allRows.filter(tr => tr.parentNode.nodeName === 'THEAD');
  if (headerRows.length === 0 && allRows.length > 0) {
    const first = allRows[0];
    if (Array.from(first.cells).every(c => c.nodeName === 'TH')) {
      headerRows = [first];
    }
  }
  const dataRows = allRows.filter(tr => !headerRows.includes(tr));

  // Only include data rows that intersect the selection
  const selectedData = dataRows.filter(tr => range.intersectsNode(tr));

  // Reconstruct a clean table: header + selected data rows
  const newTable = document.createElement('table');
  if (headerRows.length > 0) {
    const thead = document.createElement('thead');
    headerRows.forEach(tr => thead.appendChild(tr.cloneNode(true)));
    newTable.appendChild(thead);
  }
  if (selectedData.length > 0) {
    const tbody = document.createElement('tbody');
    selectedData.forEach(tr => tbody.appendChild(tr.cloneNode(true)));
    newTable.appendChild(tbody);
  }
  return newTable.outerHTML;
}

// Align GFM table columns so pipe characters line up vertically.
// Finds blocks of consecutive |-prefixed lines and pads each cell to the
// maximum width of its column.
function alignTables(text) {
  return text.replace(/((?:^\|[^\n]*\n?)+)/gm, function (block) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) return block;

    // Parse each line into an array of trimmed cell strings
    const rows = lines.map(line =>
      line.replace(/^\|\s*/, '').replace(/\s*\|\s*$/, '').split(/\s*\|\s*/)
    );
    const colCount = Math.max(...rows.map(r => r.length));
    const colWidths = new Array(colCount).fill(3); // minimum 3 for '---'

    rows.forEach(row => {
      if (row.every(c => /^:?-+:?$/.test(c))) return; // skip separator row
      row.forEach((cell, i) => {
        if (i < colCount) colWidths[i] = Math.max(colWidths[i], cell.length);
      });
    });

    return rows.map(row => {
      const isSep = row.every(c => /^:?-+:?$/.test(c));
      const cells = Array.from({ length: colCount }, (_, i) => {
        const cell = row[i] !== undefined ? row[i] : '';
        const w = colWidths[i];
        if (isSep) {
          const l = cell.startsWith(':');
          const r = cell.length > 1 && cell.endsWith(':');
          return (l ? ':' : '') + '-'.repeat(Math.max(1, w - (l ? 1 : 0) - (r ? 1 : 0))) + (r ? ':' : '');
        }
        return cell.padEnd(w);
      });
      return '| ' + cells.join(' | ') + ' |';
    }).join('\n') + '\n';
  });
}

// Prefix every line. Blank lines get the prefix with trailing whitespace trimmed
// (e.g. ">" not "> ") to avoid trailing-whitespace issues.
function applyPrefix(markdown, prefix) {
  if (!prefix) return markdown;
  const trimmedPrefix = prefix.trimEnd();
  return markdown.split('\n').map(line =>
    line === '' ? trimmedPrefix : prefix + line
  ).join('\n');
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action !== 'copy-selection') return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

  // Capture selection HTML — if selection is within a table, extract only the
  // header row(s) + the data rows that intersect the selection.
  const rawRange = selection.getRangeAt(0);
  const tableHtml = maybeExtractTableRows(rawRange);
  let html;
  if (tableHtml !== null) {
    html = tableHtml;
  } else {
    const fragment = rawRange.cloneContents();
    const div = document.createElement('div');
    div.appendChild(fragment);
    html = div.innerHTML;
  }
  if (!html.trim()) return;

  chrome.storage.sync.get({ prefix: '> ', linkStyle: 'inline' }, (settings) => {
    const { prefix, linkStyle } = settings;
    const { td, refs } = buildTurndown(linkStyle);

    const markdown = alignTables(td.turndown(html));
    let output = applyPrefix(markdown, prefix);

    // Citation: blank prefixed line + attribution line
    const title = document.title.replace(/[[\]]/g, '\\$&');
    const url = window.location.href;
    const trimmedPrefix = prefix.trimEnd();
    output += `\n${trimmedPrefix}\n${prefix}\\~ [${title}](<${url}>)`;

    // Reference definitions appended without prefix
    if (refs.length > 0) {
      output += '\n\n' + refs.join('\n');
    }

    navigator.clipboard.writeText(output).catch(err => {
      console.error('Super Copy to Markdown: clipboard write failed', err);
    });
  });
});

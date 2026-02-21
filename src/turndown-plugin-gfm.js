// turndown-plugin-gfm — vendored from https://cdn.jsdelivr.net/npm/turndown-plugin-gfm
// Modified: tables with colspan/rowspan also fall back to raw HTML (not just headingless tables)

var turndownPluginGfm = (function (exports) {
  'use strict';

  var highlightRegExp = /highlight-(?:text|source)-([a-z0-9]+)/;

  function highlightedCodeBlock (turndownService) {
    turndownService.addRule('highlightedCodeBlock', {
      filter: function (node) {
        var firstChild = node.firstChild;
        return (
          node.nodeName === 'DIV' &&
          highlightRegExp.test(node.className) &&
          firstChild &&
          firstChild.nodeName === 'PRE'
        )
      },
      replacement: function (content, node, options) {
        var className = node.className || '';
        var language = (className.match(highlightRegExp) || [null, ''])[1];
        return (
          '\n\n' + options.fence + language + '\n' +
          node.firstChild.textContent +
          '\n' + options.fence + '\n\n'
        )
      }
    });
  }

  function strikethrough (turndownService) {
    turndownService.addRule('strikethrough', {
      filter: ['del', 's', 'strike'],
      replacement: function (content) {
        return '~~' + content + '~~'
      }
    });
  }

  var indexOf = Array.prototype.indexOf;
  var every = Array.prototype.every;
  var rules = {};

  rules.tableCell = {
    filter: ['th', 'td'],
    replacement: function (content, node) {
      return cell(content, node)
    }
  };

  rules.tableRow = {
    filter: 'tr',
    replacement: function (content, node) {
      var borderCells = '';
      var alignMap = { left: ':--', right: '--:', center: ':-:' };

      if (isHeadingRow(node)) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var border = '---';
          var align = (
            node.childNodes[i].getAttribute('align') || ''
          ).toLowerCase();
          if (align) border = alignMap[align] || border;
          borderCells += cell(border, node.childNodes[i]);
        }
      }
      return '\n' + content + (borderCells ? '\n' + borderCells : '')
    }
  };

  rules.table = {
    filter: function (node) {
      if (node.nodeName !== 'TABLE') return false;
      var heading = isHeadingRow(node.rows[0]);
      var merged  = hasMergedCells(node);
      var convert = heading && !merged;
      console.log('[super-copy] Table:', convert ? '→ markdown' : '→ raw HTML',
        { hasHeadingRow: heading, hasMergedDataCells: merged,
          rows: node.rows.length, cols: node.rows[0] ? node.rows[0].cells.length : 0 });
      return convert;
    },
    replacement: function (content) {
      content = content.replace('\n\n', '\n');
      return '\n\n' + content + '\n\n'
    }
  };

  rules.tableSection = {
    filter: ['thead', 'tbody', 'tfoot'],
    replacement: function (content) {
      return content
    }
  };

  // Keep as raw HTML: tables with no heading row, OR tables with merged cells
  function tables (turndownService) {
    turndownService.keep(function (node) {
      return (
        node.nodeName === 'TABLE' &&
        (!isHeadingRow(node.rows[0]) || hasMergedCells(node))
      )
    });
    for (var key in rules) turndownService.addRule(key, rules[key]);
  }

  // A tr is a heading row if its parent is THEAD, or if it's the first child
  // of TABLE/first TBODY and every cell is a TH.
  function isHeadingRow (tr) {
    if (!tr) return false;
    var parentNode = tr.parentNode;
    return (
      parentNode.nodeName === 'THEAD' ||
      (
        parentNode.firstChild === tr &&
        (parentNode.nodeName === 'TABLE' || isFirstTbody(parentNode)) &&
        every.call(tr.childNodes, function (n) { return n.nodeName === 'TH' })
      )
    )
  }

  function isFirstTbody (element) {
    var previousSibling = element.previousSibling;
    return (
      element.nodeName === 'TBODY' && (
        !previousSibling ||
        (
          previousSibling.nodeName === 'THEAD' &&
          /^\s*$/i.test(previousSibling.textContent)
        )
      )
    )
  }

  // Returns true if any DATA cell (td) has colspan > 1 or rowspan > 1.
  // Merged header cells (th) are imperfect in GFM but still convertible;
  // merged data cells are truly unrepresentable in markdown.
  function hasMergedCells (table) {
    var cells = table.querySelectorAll('td');
    for (var i = 0; i < cells.length; i++) {
      var cs = parseInt(cells[i].getAttribute('colspan') || '1', 10);
      var rs = parseInt(cells[i].getAttribute('rowspan') || '1', 10);
      if (cs > 1 || rs > 1) return true;
    }
    return false;
  }

  function cell (content, node) {
    var index = indexOf.call(node.parentNode.childNodes, node);
    var prefix = ' ';
    if (index === 0) prefix = '| ';
    return prefix + content + ' |'
  }

  function taskListItems (turndownService) {
    turndownService.addRule('taskListItems', {
      filter: function (node) {
        return node.type === 'checkbox' && node.parentNode.nodeName === 'LI'
      },
      replacement: function (content, node) {
        return (node.checked ? '[x]' : '[ ]') + ' '
      }
    });
  }

  function gfm (turndownService) {
    turndownService.use([
      highlightedCodeBlock,
      strikethrough,
      tables,
      taskListItems
    ]);
  }

  exports.gfm = gfm;
  exports.highlightedCodeBlock = highlightedCodeBlock;
  exports.strikethrough = strikethrough;
  exports.tables = tables;
  exports.taskListItems = taskListItems;

  return exports;
}({}));

/* research.js — RDD pages: renders the embedded source in the browser.
 *
 * scripts/render.sh (or render.ps1) embeds one source in a <script> block of
 * page-shell.html.template and inlines this file. No external dependencies;
 * works from file://.
 *
 *   - doc mode (one markdown document: card, plan, notebook, analysis, infra-spec, doc):
 *     an overview ("At a glance", status stepper, gate box, "Needs your decision"),
 *     collapsible ## sections with a section nav, and per-item review controls
 *     (accept / change / reject / answer / comment) plus a page verdict, saved as
 *     <name>.feedback.md for the agent to apply.
 *   - registry mode (experiments/registry.json): the experiment dashboard.
 *
 * Markdown conventions: skills/research-workflow/doc-format.md.
 */
(function () {
  'use strict';

  /* ── Shared vocabulary ─────────────────────────────────────────── */

  // Frontmatter keys whose values render as status badges.
  var BADGE_KEYS = ['status', 'gate_result', 'approval', 'verdict', 'review_status', 'decision',
    'human_approval'];
  // Frontmatter keys whose values render as <code>.
  var CODE_KEY_SUFFIXES = ['_id', '_slug', '_path', '_command', '_date', '_ref'];
  var CODE_KEYS = ['experiment_id', 'source', 'created', 'updated', 'supersedes', 'smoke_passed'];

  // status word → badge variant
  var BADGE_VARIANTS = {
    draft: 'draft', abandoned: 'draft', superseded: 'draft', none: 'draft',
    pending: 'pending', launched: 'pending', in_progress: 'pending', todo: 'pending', running: 'pending',
    ok: 'ok', approved: 'approved', accepted: 'ok', resolved: 'ok', done: 'ok', confirmed: 'ok',
    pass: 'ok', passed: 'ok', updated: 'ok', not_required: 'ok',
    blocking: 'blocking', rejected: 'rejected', failed: 'blocking', fail: 'blocking', crashed: 'blocking',
    warning: 'warning', analyzed: 'warning', inconclusive: 'warning', needs_changes: 'warning',
    deferred: 'warning', blocked: 'warning', proposed: 'warning'
  };

  // ID prefix → .req-id variant class ('' = default)
  var REQ_ID_CLASSES = [
    [/^G\d/, 'gate'], [/^M\d/, 'metric'], [/^C\d/, 'change'], [/^H\d/, 'hyp'],
    [/^NFR/, 'nfr'], [/^(EDGE|NBK)/, 'edge'], [/^(ERR|BLK)/, 'err'], [/^AT-EDGE/, 'edge'],
    [/^AT-ERR/, 'err'], [/^(AC|AT)/, 'ac'], [/^[TP]-?\d/, 't']
  ];

  var ID_TOKEN = /^([A-Z]{1,4}(?:-[A-Z]{1,4})?-?\d+(?:\.\d+)*)$/;
  var REQ_ROW = /^([A-Z]{1,4}(?:-[A-Z]{1,4})?-?\d+(?:\.\d+)*):\s+(.+)$/;
  var INLINE_BADGE = /\[!(draft|pending|ok|approved|blocking|rejected|warning)\s+([^\]]+)\]/g;
  var CELL_VERDICT = /^!(ok|warning|blocking|pending)(?:\s+(.*))?$/;
  var ITEM_STATUS = /^\[([ x>!])\]\s+/;
  var ITEM_STATUS_CLASS = { x: 'done', '>': 'in-progress', '!': 'blocked', ' ': '' };

  var DOC_LABELS = {
    card: 'Experiment card', plan: 'Research plan', notebook: 'Lab notebook', analysis: 'Analysis',
    'infra-spec': 'Infra spec', doc: 'Document'
  };
  var CARD_STEPS = ['draft', 'approved', 'launched', 'analyzed', 'done'];
  var STATUSES = CARD_STEPS.concat(['failed', 'abandoned']);

  /* ── Small helpers ─────────────────────────────────────────────── */

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function slugify(s) {
    return s.toLowerCase().replace(/`/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function reqIdClass(id) {
    for (var i = 0; i < REQ_ID_CLASSES.length; i++) {
      if (REQ_ID_CLASSES[i][0].test(id)) return REQ_ID_CLASSES[i][1];
    }
    return '';
  }

  function reqIdSpan(id) {
    var cls = reqIdClass(id);
    return '<span class="req-id' + (cls ? ' ' + cls : '') + '" data-ref="' + escapeHtml(id) + '">' +
      escapeHtml(id) + '</span>';
  }

  function badgeSpan(word) {
    var variant = BADGE_VARIANTS[String(word).toLowerCase()] || 'draft';
    return '<span class="badge badge-' + variant + '">' + escapeHtml(String(word).replace(/_/g, ' ')) + '</span>';
  }

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { /* storage unavailable: state lives for this visit only */ }
    return null;
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  /* ── Inline markdown ───────────────────────────────────────────── */

  function inline(text) {
    var codes = [];
    var s = text.replace(/`([^`]+)`/g, function (_, code) {
      codes.push('<code>' + escapeHtml(code) + '</code>');
      return '\x00' + (codes.length - 1) + '\x00';
    });
    s = escapeHtml(s);
    s = s.replace(INLINE_BADGE, function (_, variant, label) {
      return '<span class="badge badge-' + variant + '">' + label + '</span>';
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/\x00(\d+)\x00/g, function (_, i) { return codes[Number(i)]; });
    return s;
  }

  /* ── Frontmatter ───────────────────────────────────────────────── */

  function parseFrontmatter(text) {
    var meta = [];
    if (text.indexOf('---') !== 0) return { meta: meta, body: text };
    var lines = text.split(/\r?\n/);
    var end = -1;
    for (var i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') { end = i; break; }
    }
    if (end === -1) return { meta: meta, body: text };
    for (var j = 1; j < end; j++) {
      var line = lines[j];
      if (!line.trim() || line.trim().charAt(0) === '#') continue;
      var m = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*(?:#.*)?$/);
      if (m) meta.push([m[1], m[2]]);
    }
    return { meta: meta, body: lines.slice(end + 1).join('\n') };
  }

  function metaValue(key, value) {
    if (BADGE_KEYS.indexOf(key) !== -1) return badgeSpan(value);
    var isCode = CODE_KEYS.indexOf(key) !== -1 ||
      CODE_KEY_SUFFIXES.some(function (suf) { return key.slice(-suf.length) === suf; });
    return isCode ? '<code>' + escapeHtml(value) + '</code>' : inline(value);
  }

  function metaList(meta) {
    var items = meta.filter(function (kv) { return kv[0] !== 'title' && kv[0] !== 'doc'; })
      .map(function (kv) {
        var label = kv[0].replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); });
        return '<div><dt>' + escapeHtml(label) + '</dt><dd>' + metaValue(kv[0], kv[1]) + '</dd></div>';
      });
    return items.length ? '<dl class="meta">' + items.join('') + '</dl>' : '';
  }

  /* ── Block-level markdown ──────────────────────────────────────── */

  function parseBlocks(lines, out, container) {
    var i = 0;
    var n = lines.length;
    var cardState = container && container.type === 'card' ? { headerDone: false, bodyOpen: false } : null;

    function ensureCardBody() {
      if (cardState && !cardState.bodyOpen) { out.push('<div class="card-body">'); cardState.bodyOpen = true; }
    }

    while (i < n) {
      var line = lines[i];
      var trimmed = line.trim();
      if (!trimmed) { i++; continue; }

      // HTML comment (guidance): skip, including multi-line comments.
      if (trimmed.indexOf('<!--') === 0) {
        while (i < n && lines[i].indexOf('-->') === -1) i++;
        i++;
        continue;
      }

      // Fenced code block
      if (trimmed.indexOf('```') === 0) {
        ensureCardBody();
        var lang = trimmed.slice(3).trim();
        var code = [];
        i++;
        while (i < n && lines[i].trim().indexOf('```') !== 0) { code.push(lines[i]); i++; }
        i++;
        var cls = lang ? ' class="language-' + escapeHtml(lang) + '"' : '';
        out.push('<pre><code' + cls + '>' + escapeHtml(code.join('\n')) + '</code></pre>');
        continue;
      }

      // Container: ::: name [classes...]  /  ::: closes
      if (trimmed.indexOf(':::') === 0) {
        var spec = trimmed.slice(3).replace(/<!--.*?-->/g, '').trim();
        if (!spec) { i++; continue; }
        var inner = [];
        var depth = 1;
        i++;
        while (i < n) {
          var t = lines[i].trim();
          if (t.indexOf(':::') === 0 && t.slice(3).trim()) depth++;
          else if (t === ':::') { depth--; if (depth === 0) break; }
          inner.push(lines[i]);
          i++;
        }
        i++;
        ensureCardBody();
        renderContainer(spec, inner, out);
        continue;
      }

      // Raw HTML block (passes through untouched until a blank line)
      if (/^</.test(trimmed)) {
        ensureCardBody();
        var raw = [];
        while (i < n && lines[i].trim()) { raw.push(lines[i]); i++; }
        out.push(raw.join('\n'));
        continue;
      }

      // Heading
      var h = trimmed.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        var level = h[1].length;
        var text = h[2].trim();
        if (cardState && level === 4 && !cardState.headerDone && !cardState.bodyOpen) {
          out.push(renderCardHeader(text));
          cardState.headerDone = true;
          i++;
          continue;
        }
        ensureCardBody();
        out.push('<h' + level + ' id="' + slugify(text) + '">' + inline(text) + '</h' + level + '>');
        i++;
        continue;
      }

      // Horizontal rule
      if (/^(-{3,}|\*{3,})$/.test(trimmed)) { ensureCardBody(); out.push('<hr>'); i++; continue; }

      // Table
      if (trimmed.charAt(0) === '|' && i + 1 < n && /^\|[\s:|-]+\|?$/.test(lines[i + 1].trim())) {
        ensureCardBody();
        var tbl = [];
        while (i < n && lines[i].trim().charAt(0) === '|') { tbl.push(lines[i].trim()); i++; }
        out.push(renderTable(tbl));
        continue;
      }

      // List
      if (/^(\s*)([-*]|\d+\.)\s+/.test(line)) {
        var block = [];
        while (i < n && lines[i].trim() !== '') {
          if (!/^(\s*)([-*]|\d+\.)\s+/.test(lines[i]) && !/^\s{2,}\S/.test(lines[i])) break;
          block.push(lines[i]);
          i++;
        }
        ensureCardBody();
        out.push(renderList(block, container));
        continue;
      }

      // Blockquote
      if (trimmed.charAt(0) === '>') {
        ensureCardBody();
        var quote = [];
        while (i < n && lines[i].trim().charAt(0) === '>') {
          quote.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        out.push('<blockquote><p>' + inline(quote.join(' ')) + '</p></blockquote>');
        continue;
      }

      // Requirement row: "REQ-001: text"
      var req = trimmed.match(REQ_ROW);
      if (req) {
        ensureCardBody();
        var rc = reqIdClass(req[1]);
        out.push('<div class="req-row' + (rc ? ' ' + rc : '') + '" data-item="' + escapeHtml(req[1]) + '">' +
          reqIdSpan(req[1]) + '<span class="req-text">' + inline(req[2]) + '</span></div>');
        i++;
        continue;
      }

      // Paragraph
      ensureCardBody();
      var para = [];
      while (i < n && lines[i].trim() && !/^(#{1,4}\s|```|:::|\||[-*]\s|\d+\.\s|>|<)/.test(lines[i].trim()) &&
        !REQ_ROW.test(lines[i].trim()) && !/^(-{3,}|\*{3,})$/.test(lines[i].trim())) {
        para.push(lines[i].trim());
        i++;
      }
      if (para.length) out.push('<p>' + inline(para.join(' ')) + '</p>');
      else i++;
    }

    if (cardState && cardState.bodyOpen) out.push('</div>');
  }

  /* ── Containers ────────────────────────────────────────────────── */

  function renderContainer(spec, innerLines, out) {
    var parts = spec.split(/\s+/);
    var kind = parts[0];

    if (kind === 'collapse') {
      var title = spec.slice('collapse'.length).trim() || 'Details';
      out.push('<details class="collapse"><summary>' + inline(title) + '</summary><div class="collapse-body">');
      parseBlocks(innerLines, out, { type: 'collapse' });
      out.push('</div></details>');
      return;
    }
    if (kind === 'card') {
      var extra = parts.slice(1).filter(function (c) { return /^[a-z0-9-]+$/.test(c); }).join(' ');
      out.push('<div class="card' + (extra ? ' ' + extra : '') + '">');
      parseBlocks(innerLines, out, { type: 'card' });
      out.push('</div>');
      return;
    }
    if (kind === 'note' || kind === 'diagram') {
      out.push('<div class="' + (kind === 'note' ? 'note' : 'diagram') + '">');
      parseBlocks(innerLines, out, { type: kind });
      out.push('</div>');
      return;
    }
    // Generic: the words become CSS classes.
    out.push('<div class="' + escapeHtml(spec) + '">');
    parseBlocks(innerLines, out, { type: 'generic' });
    out.push('</div>');
  }

  // "#### A1 — Title [!pending Pending]" → card header
  function renderCardHeader(text) {
    var rest = text;
    var idSpan = '';
    var id = '';
    var idMatch = rest.match(/^([A-Z]{1,4}(?:-[A-Z]{1,4})?-?\d+)\s*[—-]\s*/);
    if (idMatch) {
      id = idMatch[1];
      idSpan = reqIdSpan(id);
      rest = rest.slice(idMatch[0].length);
    }
    var badge = '';
    var badgeMatch = rest.match(/\[!(draft|pending|ok|approved|blocking|rejected|warning)\s+([^\]]+)\]\s*$/);
    if (badgeMatch) {
      badge = '<span class="badge badge-' + badgeMatch[1] + '">' + escapeHtml(badgeMatch[2]) + '</span>';
      rest = rest.slice(0, badgeMatch.index).trim();
    }
    return '<div class="card-header"' + (id ? ' data-item="' + escapeHtml(id) + '"' : '') + '>' + idSpan +
      '<span class="card-title">' + inline(rest) + '</span>' + badge + '</div>';
  }

  /* ── Tables ────────────────────────────────────────────────────── */

  function splitRow(row) {
    var cells = [];
    var cur = '';
    var inCode = false;
    var body = row.replace(/^\|/, '').replace(/\|$/, '');
    for (var k = 0; k < body.length; k++) {
      var ch = body.charAt(k);
      if (ch === '`') inCode = !inCode;
      if (ch === '|' && !inCode) { cells.push(cur.trim()); cur = ''; } else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  }

  function renderCell(raw, tag) {
    var cls = '';
    var content = raw;
    var verdict = raw.match(CELL_VERDICT);
    if (verdict) { cls = ' class="v-' + verdict[1] + '"'; content = verdict[2] || verdict[1]; }
    var idTok = content.match(ID_TOKEN);
    return '<' + tag + cls + '>' + (idTok ? reqIdSpan(idTok[1]) : inline(content)) + '</' + tag + '>';
  }

  function renderTable(rows) {
    var header = splitRow(rows[0]);
    var body = rows.slice(2).map(splitRow);
    var thead = '<thead><tr>' + header.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead>';
    var tbody = body.length ? '<tbody>' + body.map(function (r) {
      return '<tr>' + r.map(function (c) { return renderCell(c, 'td'); }).join('') + '</tr>';
    }).join('') + '</tbody>' : '';
    return '<div class="table-wrap"><table>' + thead + tbody + '</table></div>';
  }

  /* ── Lists ─────────────────────────────────────────────────────── */

  function parseListItems(lines) {
    var items = [];
    var baseIndent = null;
    lines.forEach(function (line) {
      var m = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
      if (m && (baseIndent === null || m[1].length <= baseIndent)) {
        if (baseIndent === null) baseIndent = m[1].length;
        if (m[1].length === baseIndent) { items.push({ marker: m[2], text: m[3], children: [] }); return; }
      }
      if (items.length) items[items.length - 1].children.push(line);
    });
    return items;
  }

  function dedent(lines) {
    var indents = lines.filter(function (l) { return l.trim(); }).map(function (l) { return l.match(/^\s*/)[0].length; });
    var min = indents.length ? Math.min.apply(null, indents) : 0;
    return lines.map(function (l) { return l.slice(min); });
  }

  function renderList(lines, container) {
    var items = parseListItems(lines);
    if (!items.length) return '';
    var ordered = /^\d+\.$/.test(items[0].marker);
    var allStatus = items.every(function (it) { return ITEM_STATUS.test(it.text); });

    if (ordered && allStatus) return renderTimeline(items);
    if (!ordered && allStatus) {
      return '<ul class="checklist">' + items.map(function (it) {
        var done = it.text.match(ITEM_STATUS)[1] === 'x';
        return '<li' + (done ? ' class="done"' : '') + '>' + inline(it.text.replace(ITEM_STATUS, '')) + '</li>';
      }).join('') + '</ul>';
    }
    if (container && container.type === 'card' &&
      items.every(function (it) { return /^\*\*[^*]+:\*\*\s/.test(it.text); })) {
      return '<dl class="fields">' + items.map(function (it) {
        var m = it.text.match(/^\*\*([^*]+):\*\*\s+(.*)$/);
        return '<div><dt>' + inline(m[1]) + '</dt><dd>' + inline(m[2]) + '</dd></div>';
      }).join('') + '</dl>';
    }
    var tag = ordered ? 'ol' : 'ul';
    return '<' + tag + '>' + items.map(function (it) {
      var innerHtml = inline(it.text);
      if (it.children.length) {
        var d = dedent(it.children);
        innerHtml += d.some(function (l) { return /^(\s*)([-*]|\d+\.)\s+/.test(l); })
          ? renderList(d, container) : '<p>' + inline(d.join(' ').trim()) + '</p>';
      }
      return '<li>' + innerHtml + '</li>';
    }).join('') + '</' + tag + '>';
  }

  function renderTimeline(items) {
    return '<ol class="timeline">' + items.map(function (it) {
      var status = ITEM_STATUS_CLASS[it.text.match(ITEM_STATUS)[1]];
      var rest = it.text.replace(ITEM_STATUS, '');
      var chip = '';
      var id = '';
      var idm = rest.match(/^(T-?\d+(?:\.\d+)*):\s*/);
      if (idm) { id = idm[1]; chip = reqIdSpan(id); rest = rest.slice(idm[0].length); }
      var parts = rest.split(' — ');
      var body = parts.slice(1).join(' — ');
      return '<li class="task' + (status ? ' ' + status : '') + '"' + (id ? ' data-item="' + escapeHtml(id) + '"' : '') + '>' +
        '<div class="task-head">' + chip + '<strong>' + inline(parts[0]) + '</strong></div>' +
        (body ? '<div class="task-body">' + inline(body) + '</div>' : '') + '</li>';
    }).join('') + '</ol>';
  }

  /* ── Document source ───────────────────────────────────────────── */

  function sourceText(node) {
    return node.textContent.replace(/^\n/, '').replace(/<\\\/(script)/gi, '</$1');
  }

  function readDoc() {
    var node = document.querySelector('script[type="text/markdown"]');
    if (!node) return null;
    var fm = parseFrontmatter(sourceText(node));
    var metaMap = {};
    fm.meta.forEach(function (kv) { metaMap[kv[0]] = kv[1]; });
    var out = [];
    parseBlocks(fm.body.split(/\r?\n/), out, null);
    return {
      kind: metaMap.doc || 'doc', meta: fm.meta, metaMap: metaMap,
      title: metaMap.title || node.getAttribute('data-file') || 'Document', markup: out.join('\n')
    };
  }

  // Remove the "## Summary" (or "## Resume here") section from the body and return its HTML.
  function takeSummary(body) {
    var h = null;
    each(body.children, function (n) {
      if (!h && n.tagName === 'H2' && /^(summary|at a glance|resume here)$/i.test(n.textContent.trim())) h = n;
    });
    if (!h) return null;
    var label = h.textContent.trim();
    var buf = [];
    var n = h.nextElementSibling;
    while (n && n.tagName !== 'H2') {
      var next = n.nextElementSibling;
      buf.push(n.outerHTML);
      n.parentNode.removeChild(n);
      n = next;
    }
    h.parentNode.removeChild(h);
    return { label: /summary/i.test(label) ? 'At a glance' : label, html: buf.join('') };
  }

  // Wrap each <h2> and the content up to the next <h2> in a collapsible section.
  // Sections whose whole body is "None." / "Pending …" / "Not run yet." collapse to one line.
  function sectionize(root) {
    var nodes = Array.prototype.slice.call(root.childNodes);
    var current = null;
    var frag = document.createDocumentFragment();
    nodes.forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === 'H2') {
        current = document.createElement('details');
        current.className = 'sec';
        current.open = true;
        current.id = node.id;
        var summary = document.createElement('summary');
        summary.innerHTML = node.innerHTML;
        current.appendChild(summary);
        current.body = document.createElement('div');
        current.body.className = 'sec-body';
        current.appendChild(current.body);
        frag.appendChild(current);
        root.removeChild(node);
      } else if (current) {
        current.body.appendChild(node);
      } else {
        frag.appendChild(node);
      }
    });
    root.appendChild(frag);
    each(root.querySelectorAll('details.sec'), function (sec) {
      var body = sec.querySelector('.sec-body');
      var text = body.textContent.trim();
      if (text.length < 80 && /^(none|not applicable|n\/a|no |not required|pending|not run yet|nothing)/i.test(text) &&
        !body.querySelector('table, .card, ol, ul, .req-row')) {
        var line = el('div', 'sec-empty', '<span class="sec-empty-title">' + sec.querySelector('summary').innerHTML + '</span>' +
          '<span class="sec-empty-text">' + escapeHtml(text) + '</span>');
        line.id = sec.id;
        sec.parentNode.replaceChild(line, sec);
      }
    });
  }

  /* ── Gates ─────────────────────────────────────────────────────── */

  // Which human decision the page verdict records.
  function gateFor(doc) {
    var m = doc.metaMap;
    if (doc.kind === 'card') {
      if (m.status === 'draft') return 'card_approval';
      if (m.status === 'analyzed') return 'verdict_confirmation';
      return 'none';
    }
    if (doc.kind === 'plan' && /pending|draft/i.test(m.approval || '')) return 'plan_approval';
    return 'none';
  }

  var VERDICT_LABELS = {
    card_approval: ['Approve card', 'Request changes'],
    verdict_confirmation: ['Confirm verdict', 'Dispute verdict'],
    plan_approval: ['Approve plan', 'Request changes'],
    none: ['Approve', 'Request changes']
  };

  /* ── Overview ──────────────────────────────────────────────────── */

  function stepper(status) {
    var i = CARD_STEPS.indexOf(status);
    var items = CARD_STEPS.map(function (s, k) {
      var cls = k < i ? 'past' : k === i ? 'now' : '';
      var gate = s === 'approved' || s === 'done' ? ' title="Human gate"' : '';
      return '<li class="' + cls + '"' + gate + '>' + (gate ? '⛔ ' : '') + s + '</li>';
    });
    if (i === -1 && status) items.push('<li class="now end-bad">' + escapeHtml(status) + '</li>');
    return '<ol class="stepper" aria-label="Experiment status">' + items.join('') + '</ol>';
  }

  function openCards(body) {
    var out = [];
    each(body.querySelectorAll('.card'), function (c) {
      var head = c.querySelector('.card-header[data-item]');
      if (!head || !/^[QA]\d/.test(head.getAttribute('data-item'))) return;
      var badge = head.querySelector('.badge');
      if (badge && !/badge-(pending|blocking|warning|draft)/.test(badge.className)) return;
      var sec = c.closest('details.sec');
      var secName = sec ? sec.querySelector('summary').textContent : '';
      if (/(resolved|accepted|rejected|deferred|replaced)/i.test(secName)) return;
      out.push(c);
    });
    return out;
  }

  function sectionIdFor(body, re) {
    var hit = '';
    each(body.querySelectorAll('details.sec, .sec-empty'), function (s) {
      var t = (s.querySelector('summary, .sec-empty-title') || s).textContent;
      if (!hit && re.test(t)) hit = s.id;
    });
    return hit;
  }

  function overviewHtml(doc, body, summary, gate) {
    var m = doc.metaMap;
    var parts = [];

    if (doc.kind === 'card' || summary) {
      parts.push('<section class="glance">' + (doc.kind === 'card' ? stepper(m.status) : '') +
        (summary ? '<p class="eyebrow">' + escapeHtml(summary.label) + '</p>' + summary.html : '') + '</section>');
    }

    var stats = [];
    var timeline = body.querySelectorAll('.timeline .task');
    if (doc.kind === 'card') {
      stats.push(['Gate result', badgeSpan(m.gate_result || 'pending'), sectionIdFor(body, /verdict/i)]);
      var smoke = m.smoke_passed && !/^(todo|none|null|pending|no)$/i.test(m.smoke_passed) ? escapeHtml(m.smoke_passed) : 'not yet';
      stats.push(['Smoke test', smoke, sectionIdFor(body, /setup/i)]);
      var runsId = sectionIdFor(body, /^runs/i);
      var runs = runsId ? body.querySelectorAll('#' + runsId + ' tbody tr').length : 0;
      stats.push(['Runs logged', String(runs), runsId]);
    }
    if (timeline.length) {
      stats.push(['Plan', body.querySelectorAll('.timeline .task.done').length + ' / ' + timeline.length,
        sectionIdFor(body, /plan|tasks|phases/i)]);
    }
    var open = openCards(body);
    if (open.length || body.querySelector('[data-item^="Q"], [data-item^="A"]')) {
      stats.push(['Needs decision', String(open.length), '']);
    }
    var blk = body.querySelectorAll('.req-row[data-item^="BLK"]').length;
    if (blk) stats.push(['Blocking concerns', String(blk), sectionIdFor(body, /skeptic|review|findings/i)]);
    if (stats.length) {
      parts.push('<div class="stats">' + stats.map(function (s) {
        return '<a class="stat" href="#' + (s[2] || 'overview') + '"><span class="stat-value">' + s[1] +
          '</span><span class="stat-label">' + s[0] + '</span></a>';
      }).join('') + '</div>');
    }

    if (gate === 'card_approval') {
      var rows = [];
      each(body.querySelectorAll('.req-row'), function (r) {
        if (/^[HCG]\d/.test(r.getAttribute('data-item'))) rows.push(r.outerHTML);
      });
      parts.push('<section class="gatebox"><h2>⛔ Gate 1 — approve this card</h2>' +
        '<p>Approval freezes the one change, the gate and the budget' + (m.budget ? ' (<code>' + escapeHtml(m.budget) + '</code>)' : '') +
        '. No config, launcher or run happens before it.</p>' + rows.join('') +
        '<p>Choose <strong>Approve card</strong> or <strong>Request changes</strong> below, then save your feedback.</p></section>');
    } else if (gate === 'verdict_confirmation') {
      var vid = sectionIdFor(body, /verdict/i);
      var vb = vid ? body.querySelector('#' + vid + ' .sec-body') : null;
      parts.push('<section class="gatebox"><h2>⛔ Gate 2 — confirm the verdict</h2>' +
        '<p>The agent proposes; you decide. Read Results and Skeptic before confirming.</p>' +
        (vb ? vb.innerHTML : '') +
        '<p>Choose <strong>Confirm verdict</strong> or <strong>Dispute verdict</strong> below, then save your feedback.</p></section>');
    } else if (gate === 'plan_approval') {
      parts.push('<section class="gatebox"><h2>Approve the plan</h2><p>Cards must fit an approved plan. ' +
        'Choose <strong>Approve plan</strong> or <strong>Request changes</strong> below.</p></section>');
    }

    if (open.length) {
      parts.push('<section class="decide"><h2>Needs your decision</h2>' +
        '<p class="muted">Answer or accept each item here, or in its section below. Then save your feedback.</p>' +
        open.map(function (c) { return c.outerHTML; }).join('') + '</section>');
    }
    return parts.join('');
  }

  /* ── Feedback state ────────────────────────────────────────────── */

  var ACTIONS = {
    accept: { label: 'Accept', icon: '✓', needsText: false },
    change: { label: 'Change', icon: '✎', needsText: true, prompt: 'What should change?' },
    reject: { label: 'Reject', icon: '✕', needsText: true, prompt: 'Why, and what instead?' },
    answer: { label: 'Answer', icon: '↳', needsText: true, prompt: 'Your answer' },
    comment: { label: 'Comment', icon: '💬', needsText: true, prompt: 'Your comment' }
  };

  function actionsFor(id) {
    if (/^Q\d/.test(id)) return ['answer', 'comment'];
    if (/^(A\d|BLK|NBK)/.test(id)) return ['accept', 'reject', 'comment'];
    return ['accept', 'change', 'comment'];
  }

  var state = { items: {}, verdict: 'none', general: '' };
  var stateKey = '';
  var listeners = [];

  function loadState(key) {
    stateKey = 'rdd-feedback:' + key;
    try {
      var saved = JSON.parse(store(stateKey) || 'null');
      if (saved && saved.items) state = saved;
    } catch (e) { /* ignore corrupt state */ }
  }

  function saveState() {
    store(stateKey, JSON.stringify(state));
    listeners.forEach(function (fn) { fn(); });
  }

  function feedbackMarkdown(source, gate, order) {
    var ids = Object.keys(state.items).sort(function (a, b) {
      var ia = order.indexOf(a); var ib = order.indexOf(b);
      return (ia === -1 ? 1e6 : ia) - (ib === -1 ? 1e6 : ib);
    });
    var lines = ['---', 'doc: feedback', 'source: ' + source, 'gate: ' + gate,
      'generated: ' + new Date().toISOString(), 'verdict: ' + state.verdict, '---', '', '## Items', ''];
    if (!ids.length) lines.push('None.');
    ids.forEach(function (id) {
      var it = state.items[id];
      var text = (it.text || '').replace(/\s*\n\s*/g, ' ').trim();
      lines.push('- ' + id + ': ' + it.action + (text ? ' — ' + text : ''));
    });
    lines.push('', '## General', '', state.general.trim() || 'None.', '');
    return lines.join('\n');
  }

  function countFeedback() {
    var c = { total: 0 };
    Object.keys(state.items).forEach(function (id) {
      var a = state.items[id].action;
      c[a] = (c[a] || 0) + 1;
      c.total++;
    });
    return c;
  }

  /* ── Feedback controls on items ────────────────────────────────── */

  function attachControls(itemEl, id, actions) {
    var bar = el('div', 'fb');
    var editor = el('div', 'fb-editor');
    editor.hidden = true;
    var textarea = el('textarea');
    textarea.rows = 2;
    var save = el('button', 'btn btn-primary', 'Save');
    var remove = el('button', 'btn btn-ghost', 'Clear');
    save.type = remove.type = 'button';
    var editorActions = el('div', 'fb-editor-actions');
    editorActions.appendChild(save);
    editorActions.appendChild(remove);
    editor.appendChild(textarea);
    editor.appendChild(editorActions);
    var note = el('div', 'fb-note');
    var pendingAction = null;

    actions.forEach(function (name) {
      var a = ACTIONS[name];
      var b = el('button', 'fb-btn', '<span aria-hidden="true">' + a.icon + '</span><span class="fb-label">' + a.label + '</span>');
      b.type = 'button';
      b.setAttribute('data-action', name);
      b.title = a.label + ' ' + id;
      b.setAttribute('aria-label', a.label + ' ' + id);
      b.addEventListener('click', function () {
        var cur = state.items[id];
        if (!a.needsText) {
          if (cur && cur.action === name) delete state.items[id];
          else state.items[id] = { action: name, text: '' };
          editor.hidden = true;
          saveState();
          return;
        }
        pendingAction = name;
        textarea.placeholder = a.prompt;
        textarea.value = cur && cur.action === name ? cur.text : '';
        editor.hidden = false;
        textarea.focus();
      });
      bar.appendChild(b);
    });

    save.addEventListener('click', function () {
      var text = textarea.value.trim();
      if (!text) { textarea.focus(); return; }
      state.items[id] = { action: pendingAction, text: text };
      editor.hidden = true;
      saveState();
    });
    remove.addEventListener('click', function () {
      delete state.items[id];
      editor.hidden = true;
      saveState();
    });
    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save.click();
      if (e.key === 'Escape') editor.hidden = true;
    });

    function paint() {
      var cur = state.items[id];
      each(bar.children, function (b) {
        b.classList.toggle('on', !!cur && cur.action === b.getAttribute('data-action'));
      });
      itemEl.setAttribute('data-fb', cur ? cur.action : '');
      note.hidden = !(cur && cur.text);
      note.innerHTML = cur && cur.text ? '<strong>' + ACTIONS[cur.action].label + ':</strong> ' + escapeHtml(cur.text) : '';
    }
    listeners.push(paint);
    paint();

    // Buttons sit at the end of the item's first line (card header, row, task head);
    // the note and the editor go below the item.
    var line = itemEl.querySelector('.task-head') || itemEl;
    line.appendChild(bar);
    var below = itemEl.classList.contains('card-header') ? itemEl.parentNode : itemEl;
    below.appendChild(note);
    below.appendChild(editor);
  }

  /* ── Page chrome ───────────────────────────────────────────────── */

  function themeToggle() {
    var b = el('button', 'theme-toggle', '');
    b.type = 'button';
    b.setAttribute('aria-label', 'Toggle light or dark theme');
    function current() {
      var t = document.documentElement.getAttribute('data-theme');
      if (t) return t;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function paint() { b.textContent = current() === 'dark' ? '☀︎' : '☾'; }
    b.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      store('rdd-theme', next);
      paint();
    });
    paint();
    return b;
  }

  function topbar(kind, title, badges) {
    var top = el('header', 'topbar');
    top.innerHTML = '<div class="topbar-inner"><span class="brand">RDD</span><span class="badge-label">' + escapeHtml(kind) +
      '</span><span class="topbar-title">' + escapeHtml(title) + '</span><span class="topbar-badges">' + (badges || '') +
      '</span><span class="spacer"></span></div>';
    top.firstChild.appendChild(themeToggle());
    return top;
  }

  function headerBadges(doc) {
    return BADGE_KEYS.filter(function (k) { return doc.metaMap[k]; }).map(function (k) {
      return '<span class="badge-label">' + escapeHtml(k.replace(/_/g, ' ')) + '</span>' + badgeSpan(doc.metaMap[k]);
    }).join('');
  }

  function flash(target) {
    var sec = target.closest('details');
    if (sec) sec.open = true;
    target.scrollIntoView({ block: 'center' });
    target.classList.add('flash');
    setTimeout(function () { target.classList.remove('flash'); }, 1200);
  }

  /* ── Document page ─────────────────────────────────────────────── */

  function renderDoc(app, doc, slug, source) {
    document.title = doc.title;
    var gate = gateFor(doc);
    loadState(source || slug);

    var top = topbar(DOC_LABELS[doc.kind] || 'Document', doc.title, headerBadges(doc));
    var nav = el('nav', 'secnav');
    nav.setAttribute('aria-label', 'Sections');
    top.appendChild(nav);
    app.appendChild(top);

    var main = el('main', 'page');
    var article = el('article', 'doc', '<h1>' + escapeHtml(doc.title) + '</h1>' + metaList(doc.meta) +
      '<div class="overview" id="overview"></div><div class="doc-body">' + doc.markup + '</div>');
    main.appendChild(article);
    app.appendChild(main);

    var body = article.querySelector('.doc-body');
    var summary = takeSummary(body);
    sectionize(body);
    var ov = article.querySelector('.overview');
    ov.innerHTML = overviewHtml(doc, body, summary, gate);
    if (!ov.innerHTML) ov.hidden = true;

    // Review controls on every item with an ID (overview copies share state with the original).
    var order = [];
    each(body.querySelectorAll('[data-item]'), function (item) {
      var id = item.getAttribute('data-item');
      if (order.indexOf(id) === -1) order.push(id);
    });
    each(article.querySelectorAll('[data-item]'), function (item) {
      attachControls(item, item.getAttribute('data-item'), actionsFor(item.getAttribute('data-item')));
    });

    // ID chips link to their definition.
    each(article.querySelectorAll('.req-id[data-ref]'), function (chip) {
      var id = chip.getAttribute('data-ref');
      if (chip.parentNode.getAttribute('data-item') === id) return;
      var target = body.querySelector('[data-item="' + id + '"]');
      if (!target) return;
      chip.classList.add('ref');
      chip.setAttribute('role', 'link');
      chip.tabIndex = 0;
      chip.title = 'Go to ' + id;
      chip.addEventListener('click', function () { flash(target); });
      chip.addEventListener('keydown', function (e) { if (e.key === 'Enter') flash(target); });
    });

    // Section nav with scroll-spy and per-section feedback counts.
    var secs = Array.prototype.filter.call(body.children, function (n) { return n.id && /^(DETAILS|DIV)$/.test(n.tagName); });
    if (!ov.hidden) secs.unshift(ov);
    secs.forEach(function (s) {
      var label = s === ov ? 'Overview' : (s.querySelector('summary, .sec-empty-title') || s).textContent;
      var a = el('a', '', escapeHtml(label));
      a.href = '#' + s.id;
      a.setAttribute('data-sec', s.id);
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (s.tagName === 'DETAILS') s.open = true;
        s.scrollIntoView({ block: 'start' });
        history.replaceState(null, '', '#' + s.id);
      });
      nav.appendChild(a);
    });
    if (!secs.length) nav.hidden = true;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          each(nav.children, function (a) { a.classList.toggle('active', a.getAttribute('data-sec') === en.target.id); });
        });
      }, { rootMargin: '-20% 0px -70% 0px' });
      secs.forEach(function (s) { io.observe(s); });
    }
    listeners.push(function () {
      each(nav.children, function (a) {
        var s = document.getElementById(a.getAttribute('data-sec'));
        var n = s ? s.querySelectorAll('[data-fb]:not([data-fb=""])').length : 0;
        var dot = a.querySelector('.sec-count');
        if (!n) { if (dot) dot.remove(); return; }
        if (!dot) { dot = el('span', 'sec-count'); a.appendChild(dot); }
        dot.textContent = n;
      });
    });

    if (gate !== 'none' || order.length) app.appendChild(feedbackBar(slug, source, gate, order));
    else document.body.style.paddingBottom = '32px';
    saveState();

    if (location.hash.length > 1) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) { if (target.tagName === 'DETAILS') target.open = true; target.scrollIntoView(); }
    }
  }

  function feedbackBar(slug, source, gate, order) {
    var labels = VERDICT_LABELS[gate] || VERDICT_LABELS.none;
    var bar = el('aside', 'fbbar');
    bar.setAttribute('aria-label', 'Your feedback');
    bar.innerHTML =
      '<div class="fbbar-inner">' +
      '<span class="fbbar-summary"></span>' +
      '<div class="verdict" role="group" aria-label="Verdict">' +
      '<button type="button" class="seg" data-verdict="approve">' + labels[0] + '</button>' +
      '<button type="button" class="seg" data-verdict="request_changes">' + labels[1] + '</button></div>' +
      '<button type="button" class="btn btn-ghost" data-act="note">Note</button>' +
      '<span class="spacer"></span>' +
      '<button type="button" class="btn btn-ghost" data-act="reset" title="Clear all feedback">Reset</button>' +
      '<button type="button" class="btn btn-ghost" data-act="copy">Copy</button>' +
      '<button type="button" class="btn btn-primary" data-act="save">Save<span class="hide-sm"> feedback</span></button>' +
      '</div>' +
      '<div class="fbbar-note" hidden><textarea rows="3" placeholder="General feedback for the agent"></textarea></div>' +
      '<div class="fbbar-hint" hidden></div>';

    var summary = bar.querySelector('.fbbar-summary');
    var noteBox = bar.querySelector('.fbbar-note');
    var noteArea = noteBox.querySelector('textarea');
    var hint = bar.querySelector('.fbbar-hint');
    noteArea.value = state.general;
    noteArea.addEventListener('input', function () { state.general = noteArea.value; saveState(); });

    function say(msg) { hint.innerHTML = msg; hint.hidden = false; }

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var v = b.getAttribute('data-verdict');
      if (v) { state.verdict = state.verdict === v ? 'none' : v; saveState(); return; }
      var act = b.getAttribute('data-act');
      var md = feedbackMarkdown(source || slug, gate, order);
      if (act === 'note') { noteBox.hidden = !noteBox.hidden; if (!noteBox.hidden) noteArea.focus(); }
      if (act === 'reset' && window.confirm('Clear all feedback on this page?')) {
        state = { items: {}, verdict: 'none', general: '' };
        noteArea.value = '';
        saveState();
      }
      if (act === 'copy') {
        var done = function () { say('Copied. Paste it in the chat with your agent.'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(md).then(done, function () { fallbackCopy(md); done(); });
        } else { fallbackCopy(md); done(); }
      }
      if (act === 'save') saveFile(md, slug, source, say);
    });

    listeners.push(function () {
      var c = countFeedback();
      var words = { accept: 'accepted', change: 'changed', reject: 'rejected', answer: 'answered', comment: 'comments' };
      var bits = [];
      ['accept', 'change', 'reject', 'answer', 'comment'].forEach(function (a) { if (c[a]) bits.push(c[a] + ' ' + words[a]); });
      summary.textContent = bits.length ? bits.join(' · ') : 'No feedback yet';
      each(bar.querySelectorAll('[data-verdict]'), function (s) {
        s.classList.toggle('on', s.getAttribute('data-verdict') === state.verdict);
      });
    });
    return bar;
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* nothing else to try */ }
    ta.remove();
  }

  // card.md → card.feedback.md, saved next to the source.
  function feedbackPath(source) {
    var src = source || 'document.md';
    var name = src.slice(src.lastIndexOf('/') + 1).replace(/\.md$/, '') + '.feedback.md';
    return { name: name, path: src.slice(0, src.lastIndexOf('/') + 1) + name };
  }

  function saveFile(md, slug, source, say) {
    var fp = feedbackPath(source);
    var tell = '<code>' + escapeHtml(fp.path) + '</code>';
    if (window.showSaveFilePicker) {
      window.showSaveFilePicker({
        suggestedName: fp.name,
        types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }]
      }).then(function (handle) {
        return handle.createWritable().then(function (w) { return w.write(md).then(function () { return w.close(); }); });
      }).then(function () {
        say('Saved. If you saved it as ' + tell + ', tell your agent: <em>read the feedback</em>.');
      }, function (err) {
        if (err && err.name === 'AbortError') return;
        download(md, slug, fp, say);
      });
      return;
    }
    download(md, slug, fp, say);
  }

  function download(md, slug, fp, say) {
    var name = slug + '.feedback.md';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    say('Downloaded <code>' + escapeHtml(name) + '</code>. Move it to <code>' + escapeHtml(fp.path) +
      '</code> (or tell your agent where it is), then say: <em>read the feedback</em>.');
  }

  /* ── Registry dashboard ────────────────────────────────────────── */

  function renderRegistry(app, source) {
    var node = document.querySelector('script[type="application/json"]');
    var data;
    try { data = JSON.parse(node ? node.textContent : 'null') || {}; } catch (e) {
      app.innerHTML = '<main class="page"><p>registry.json is not valid JSON: ' + escapeHtml(e.message) + '</p></main>';
      return;
    }
    var exps = Array.isArray(data.experiments) ? data.experiments : [];
    var dir = source && source.indexOf('/') !== -1 ? source.slice(0, source.lastIndexOf('/') + 1) : '';
    function href(p) {
      if (!p) return '';
      if (dir && p.indexOf(dir) === 0) p = p.slice(dir.length);
      return p.replace(/\.md$/, '.html');
    }
    var title = 'Experiment registry' + (data.project ? ' — ' + data.project : '');
    document.title = title;
    app.appendChild(topbar('Registry', title, ''));
    document.body.style.paddingBottom = '32px';

    var main = el('main', 'page');
    var count = {};
    var gates = {};
    exps.forEach(function (x) {
      count[x.status] = (count[x.status] || 0) + 1;
      if (x.gate_result && x.gate_result !== 'pending') gates[x.gate_result] = (gates[x.gate_result] || 0) + 1;
    });
    var stats = [['Experiments', exps.length]];
    STATUSES.forEach(function (s) { if (count[s]) stats.push([s, count[s]]); });
    ['pass', 'fail', 'inconclusive'].forEach(function (g) { if (gates[g]) stats.push(['gate ' + g, gates[g]]); });

    var html = '<article class="doc"><h1>' + escapeHtml(title) + '</h1>' +
      '<p class="muted">Rendered from <code>' + escapeHtml(source || 'registry.json') + '</code>, the source of truth for experiment status. ' +
      'ID convention: <code>' + escapeHtml(data.id_convention || 'E<seq>_<slug>') + '</code>.</p>' +
      '<div class="stats">' + stats.map(function (s) {
        return '<div class="stat"><span class="stat-value">' + s[1] + '</span><span class="stat-label">' + escapeHtml(s[0]) + '</span></div>';
      }).join('') + '</div>';

    if (!exps.length) {
      html += '<p class="empty">No experiments yet. Draft the first card with the <code>research-workflow</code> skill.</p></article>';
      main.innerHTML = html;
      app.appendChild(main);
      return;
    }
    var present = STATUSES.filter(function (s) { return count[s]; });
    html += '<div class="filters" role="group" aria-label="Filter by status"><button type="button" class="chip on" data-f="">All</button>' +
      present.map(function (s) { return '<button type="button" class="chip" data-f="' + s + '">' + s + '</button>'; }).join('') + '</div>';
    html += '<div class="table-wrap"><table class="reg"><thead><tr><th>Experiment</th><th>Status</th><th>Gate</th>' +
      '<th>Plan</th><th>Smoke</th><th>Budget → actual</th><th>Updated</th></tr></thead><tbody>' +
      exps.map(function (x) {
        var link = href(x.card_path);
        var id = '<a class="exp" href="' + escapeHtml(link) + '">' + escapeHtml(x.id || '?') + '</a>';
        return '<tr data-status="' + escapeHtml(x.status || '') + '"><td>' + (link ? id : escapeHtml(x.id || '?')) +
          '<div>' + escapeHtml(x.title || '') + '</div>' +
          (x.supersedes ? '<div class="muted">supersedes <code>' + escapeHtml(x.supersedes) + '</code></div>' : '') + '</td>' +
          '<td>' + badgeSpan(x.status || 'draft') + '</td><td>' + badgeSpan(x.gate_result || 'pending') + '</td>' +
          '<td>' + escapeHtml(x.plan_ref || '—') + '</td><td class="num">' + escapeHtml(x.smoke_passed || '—') + '</td>' +
          '<td class="num">' + escapeHtml((x.budget || '—') + ' → ' + (x.actual_cost || '—')) + '</td>' +
          '<td class="num">' + escapeHtml(x.updated || x.created || '—') + '</td></tr>';
      }).join('') + '</tbody></table></div></article>';
    main.innerHTML = html;
    app.appendChild(main);

    main.querySelector('.filters').addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      var f = b.getAttribute('data-f');
      each(main.querySelectorAll('.chip'), function (c) { c.classList.toggle('on', c === b); });
      each(main.querySelectorAll('tbody tr'), function (tr) { tr.hidden = !!f && tr.getAttribute('data-status') !== f; });
    });
  }

  /* ── Boot ──────────────────────────────────────────────────────── */

  function boot() {
    var app = document.getElementById('app');
    if (!app) return;
    var source = app.getAttribute('data-source') || '';
    var slug = app.getAttribute('data-slug') || 'page';
    if (app.getAttribute('data-mode') === 'registry') { renderRegistry(app, source); return; }
    var doc = readDoc();
    if (!doc) { app.innerHTML = '<main class="page"><p>No markdown source embedded.</p></main>'; return; }
    renderDoc(app, doc, slug, source);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());

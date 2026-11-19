(() => {
  'use strict';

  // Write the actual inputs into a standalone script. Wrap long datasets by row.
  function literal(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (!Array.isArray(value)) throw new TypeError('不支持的 Python 参数');
    const values = value.map(literal);
    const inline = '[' + values.join(', ') + ']';
    if (inline.length <= 80) return inline;
    const lines = [];
    let line = '';
    for (const item of values) {
      if (line && line.length + item.length > 76) {
        lines.push('    ' + line);
        line = '';
      }
      line += item + ', ';
    }
    if (line) lines.push('    ' + line.trimEnd());
    return '[\n' + lines.join('\n') + '\n]';
  }

  // Parameters contain only the Python literals emitted above. Tokenize those
  // separately so moving a slider doesn't re-lex the entire script or dataset.
  function renderLiteral(slot, text) {
    const fragment = document.createDocumentFragment();
    const literals = /"(?:\\.|[^"\\])*"|True|False|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g;
    let end = 0;
    for (const match of text.matchAll(literals)) {
      fragment.append(text.slice(end, match.index));
      const span = document.createElement('span');
      const token = match[0];
      span.className = token.startsWith('"') ? 'py-string' :
        (token === 'True' || token === 'False') ? 'py-kw' : 'py-number';
      span.textContent = token;
      fragment.append(span);
      end = match.index + token.length;
    }
    fragment.append(text.slice(end));
    slot.replaceChildren(fragment);
  }

  for (const panel of document.querySelectorAll('.py-panel')) {
    const lab = panel.closest('.lab[id]');
    const template = panel.querySelector('.py-template').content;
    const rawTemplate = template.textContent;
    const toggle = lab?.querySelector('.py-toggle');
    const code = panel.querySelector('.py-source');
    const copy = panel.querySelector('.py-copy');
    const status = panel.querySelector('.py-status');
    const pre = code.parentElement;
    const scroll = panel.querySelector('.py-scroll');
    const gutter = panel.querySelector('.py-gutter');
    let lastSource = '';

    function refresh() {
      const params = lab ? window.courseLabParams[lab.id]() : {};
      const inputs = Object.fromEntries(Object.entries(params || {}).map(([key, value]) => [key, literal(value)]));
      const source = params === null ? '' : rawTemplate.replace(/\{\{([A-Za-z0-9_]+)\}\}/g,
        (_, key) => inputs[key]);
      if (source !== lastSource) {
        if (source) {
          if (!code.hasChildNodes()) code.append(template.cloneNode(true));
          for (const slot of code.querySelectorAll('[data-py-param]')) {
            const text = inputs[slot.dataset.pyParam];
            if (slot.textContent !== text) renderLiteral(slot, text);
          }
          const lineCount = source.replace(/\n$/, '').split('\n').length;
          gutter.textContent = Array.from({length: lineCount}, (_, i) => i + 1).join('\n');
        } else {
          code.replaceChildren();
          gutter.textContent = '';
        }
        lastSource = source;
        status.textContent = '';
      }
      scroll.hidden = !source;
      copy.disabled = !source;
      if (!source) status.textContent = '请先按实验提示修正输入，代码会随有效数据更新。';
      return source;
    }

    toggle?.addEventListener('click', () => {
      const open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        status.textContent = '';
        refresh();
      }
    });

    async function copyScript() {
      const source = refresh();
      if (!source) return;
      let copied = false;
      try {
        await navigator.clipboard.writeText(source);
        copied = true;
      } catch {
        // file:// and browsers with restricted clipboard access can copy a selection.
        pre.focus({preventScroll:true});
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        try { copied = document.execCommand('copy'); } catch { /* keep selection */ }
        if (copied) {
          selection.removeAllRanges();
          copy.focus({preventScroll:true});
        }
      }
      if (source === code.textContent) {
        status.textContent = copied ? '已复制完整脚本。' : '代码已全选，请使用系统的复制操作。';
      }
    }
    copy.addEventListener('click', copyScript);

    if (!lab) {
      const details = panel.closest('details');
      if (details && !details.open) {
        details.addEventListener('toggle', () => { if (details.open) refresh(); });
      } else refresh();
      continue;
    }

    function syncWithControls(e) {
      if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) refresh();
    }
    // At bubble time the experiment has already applied slider, reset and seed changes.
    for (const event of ['input', 'change', 'click']) lab.addEventListener(event, syncWithControls);
  }
})();

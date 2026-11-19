(() => {
  'use strict';
  const find = id => document.getElementById(id);
  if (!find('edf-plot')) return;

  const samples = {
    three: [0.1, 0.4, 1.2],
    five: [0.1, 0.3, 0.6, 0.9, 1.1],
    ties: [0.1, 0.4, 0.4, 0.9, 1.2]
  };
  const svgNS = 'http://www.w3.org/2000/svg';
  const chart = find('edf-plot');
  const narrow = matchMedia('(max-width:560px)');
  narrow.addEventListener('change', renderEDF);
  function plotElement(tag, attrs, text) {
    const element = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    if (text !== undefined) element.textContent = text;
    chart.appendChild(element);
  }
  function renderEDF() {
    const values = samples[find('edf-set').value];
    const threshold = Number(find('edf-x').value);
    const count = values.filter(x => x <= threshold).length;
    const n = values.length;
    const width = narrow.matches ? 344 : 550;
    const left = 40, right = width - 22, top = 44, bottom = 173;
    const xAt = x => left + x / 1.3 * (right - left);
    const yAt = p => bottom - p * (bottom - top);
    chart.classList.add('stat-figure');
    chart.setAttribute('viewBox', '0 0 ' + width + ' 218');
    chart.replaceChildren();
    const cumulative = count + '/' + n;
    plotElement('title', {}, '阈值 ' + threshold.toFixed(2) + ' 时累计比例为 ' + cumulative);
    for (const p of [0, 0.5, 1]) {
      plotElement('line', {x1: left, x2: right, y1: yAt(p), y2: yAt(p), class: p ? 'plot-grid' : 'axis-edge'});
      plotElement('text', {x: left - 8, y: yAt(p) + 4, 'text-anchor': 'end', class: 'tick'}, String(p));
    }
    plotElement('text', {x: left, y: 19, class: 'axis-title'}, '累计比例');
    plotElement('text', {x: right, y: 19, class: 'reference-label', 'text-anchor': 'end'}, 'Fₙ(' + threshold.toFixed(2) + ') = ' + cumulative);
    for (const tick of [0, 0.4, 0.8, 1.2]) {
      plotElement('line', {x1:xAt(tick), y1:bottom, x2:xAt(tick), y2:bottom + 4, class:'axis-edge'});
      plotElement('text', {x: xAt(tick), y: bottom + 23, 'text-anchor': 'middle', class: 'tick'}, String(tick));
    }
    plotElement('text', {x: right + 6, y: bottom + 23, class: 'axis-title'}, 'x');
    const stepColor = 'var(--plot-data, #17655e)';
    let seen = 0, previous = left;
    for (const value of [...new Set(values)]) {
      const x = xAt(value), from = yAt(seen / n);
      seen += values.filter(v => v === value).length;
      const to = yAt(seen / n);
      plotElement('line', {x1: previous, y1: from, x2: x, y2: from, stroke: stepColor, 'stroke-width': 3.2});
      plotElement('line', {x1: x, y1: from, x2: x, y2: to, stroke: stepColor, 'stroke-dasharray':'2 3', opacity: 0.6});
      plotElement('circle', {cx: x, cy: from, r: 3.5, stroke: stepColor, 'stroke-width': 1.7, fill: 'var(--surface, #fff)'});
      plotElement('circle', {cx: x, cy: to, r: 3.6, fill: stepColor});
      previous = x;
    }
    plotElement('line', {x1: previous, x2: right, y1: yAt(1), y2: yAt(1), stroke: stepColor, 'stroke-width': 3.2});
    plotElement('line', {x1: xAt(threshold), x2: xAt(threshold), y1: top - 9, y2: bottom, class: 'reference-rule'});
    plotElement('circle', {cx: xAt(threshold), cy: yAt(count / n), r: 5.5, class: 'reference-point'});
    find('edf-value').textContent = '样本 {' + values.join('，') + '}。阈值 ' + threshold.toFixed(2) + '，计入 ' + count + ' 个，经验分布函数为 ' + count + '/' + n + ' = ' + (count / n).toFixed(3) + '。';
  }
  function renderDKW() {
    const eps = Number(find('dkw-eps').value);
    const confidence = Number(find('dkw-conf').value);
    const n = Math.ceil(Math.log(2 / (1 - confidence)) / (2 * eps * eps));
    const bound = Math.min(1, 2 * Math.exp(-2 * n * eps * eps));
    find('dkw-value').textContent = '允许误差 ' + eps.toFixed(2) + '，置信水平 ' + Math.round(100 * confidence) + '%：按 DKW 界，取 n ≥ ' + n + ' 即可。取 n = ' + n + ' 时，超过该误差的概率上界为 ' + bound.toFixed(4) + '。';
  }
  function readRankSample() {
    const raw = find('rank-input').value.trim();
    const tokens = raw ? raw.split(/[\s,，;；、]+/u).filter(Boolean) : [];
    if (tokens.length === 0 || tokens.length > 20 || !tokens.every(s => /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s) && Number.isFinite(Number(s)))) {
      return null;
    }
    return tokens.map(Number);
  }
  function renderRanks() {
    const result = find('rank-value');
    const values = readRankSample();
    if (!values) {
      result.textContent = '请输入 1 至 20 个有限数值，可包含负数、小数和重复值。';
      return;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const maximum = values.map(x => sorted.lastIndexOf(x) + 1);
    const middle = values.map((x, i) => (sorted.indexOf(x) + 1 + maximum[i]) / 2);
    result.replaceChildren();
    for (const [label, series] of [['升序', sorted], ['平均秩（输入顺序）', middle], ['最大秩（输入顺序）', maximum]]) {
      const row = document.createElement('div');
      row.textContent = label + '　' + series.join('，');
      result.appendChild(row);
    }
  }
  function plugInSample() {
    return [1, 2, 3, 4, Number(find('plugin-outlier').value)];
  }
  function renderPlugIn() {
    const values = plugInSample();
    const z = values[4];
    const mean = values.reduce((a,b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, item) => sum + (item - mean) ** 2, 0) / values.length;
    find('plugin-value').textContent = '第五个观测 ' + z + '　·　均值 ' + mean.toFixed(2) + '　·　中位数 3　·　插入方差 ' + variance.toFixed(2);
  }
  Object.assign(window.courseLabParams, {
    'lab-edf': () => ({ SAMPLE: samples[find('edf-set').value], THRESHOLD: Number(find('edf-x').value) }),
    'lab-dkw': () => ({ EPSILON: Number(find('dkw-eps').value), CONFIDENCE: Number(find('dkw-conf').value) }),
    'lab-rank': () => {
      const values = readRankSample();
      return values ? { SAMPLE: values } : null;
    },
    'lab-plugin': () => ({ SAMPLE: plugInSample() })
  });
  find('edf-set').addEventListener('change', renderEDF);
  find('edf-x').addEventListener('input', renderEDF);
  find('dkw-eps').addEventListener('input', renderDKW);
  find('dkw-conf').addEventListener('change', renderDKW);
  find('rank-input').addEventListener('input', renderRanks);
  find('plugin-outlier').addEventListener('input', renderPlugIn);
  renderEDF();
  renderDKW();
  renderRanks();
  renderPlugIn();
})();

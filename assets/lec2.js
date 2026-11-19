(() => {
  const input = document.getElementById('u-values');
  const shift = document.getElementById('u-shift');
  if (!input || !shift) return;

  const numbers = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 4, useGrouping: false });
  const digits = value => numbers.format(value);
  const namespace = 'http://www.w3.org/2000/svg';
  function svgNode(tag, attributes, label) {
    const node = document.createElementNS(namespace, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    if (label !== undefined) node.textContent = label;
    return node;
  }

  const kernel = document.getElementById('u-kernel');
  const chart = document.getElementById('u-pairs-chart');
  const details = document.getElementById('u-pair-detail');
  const pairResult = document.getElementById('u-pair-result');
  const defaultData = input.value;
  const narrow = matchMedia('(max-width:560px)');
  chart.classList.add('stat-figure');
  narrow.addEventListener('change', updatePairs);

  function readPairSample() {
    const raw = input.value.trim();
    const tokens = raw ? raw.split(/[\s,，;；、]+/) : [];
    const values = tokens.map(Number);
    const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
    const valid = tokens.length >= 2 && tokens.length <= 8 && tokens.every((part, i) => decimal.test(part) && Number.isFinite(values[i]) && Math.abs(values[i]) <= 1e6);
    return valid ? values : null;
  }
  function updatePairs() {
    const values = readPairSample();
    chart.replaceChildren();
    details.replaceChildren();
    input.setAttribute('aria-invalid', String(!values));
    if (!values) {
      pairResult.textContent = '请输入 2–8 个数，以空格或逗号分隔，每个数的绝对值不超过 1,000,000。';
      return;
    }
    const isVariance = kernel.value === 'variance';
    const pairs = [];
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        const difference = values[i] - values[j];
        pairs.push({ label: `(${i + 1}, ${j + 1})`, value: isVariance ? difference ** 2 / 2 : Math.abs(difference) });
      }
    }
    const average = pairs.reduce((sum, pair) => sum + pair.value, 0) / pairs.length;
    const scale = Math.max(...pairs.map(pair => pair.value)) || 1;
    const width = narrow.matches ? 352 : 560;
    const left = 54, right = width - 12, baseY = 148;
    const colWidth = (right - left) / pairs.length;
    const yFor = value => baseY - value / scale * 103;
    chart.setAttribute('viewBox', '0 0 ' + width + ' 185');
    for (const tick of [0, scale / 2, scale]) {
      chart.append(svgNode('line', {x1:left, y1:yFor(tick), x2:right, y2:yFor(tick), class: tick ? 'plot-grid' : 'axis-edge'}));
      const text = Math.abs(tick) > 1e5 ? tick.toExponential(0) : new Intl.NumberFormat('zh-CN',{maximumSignificantDigits:3,useGrouping:false}).format(tick);
      chart.append(svgNode('text',{x:left-7, y:yFor(tick)+4,class:'tick','text-anchor':'end'}, text));
    }
    pairs.forEach((pair, i) => {
      const rect = svgNode('rect', { x: left + (i + .12) * colWidth, y: yFor(pair.value), width: colWidth * .76, height: baseY - yFor(pair.value), fill: 'var(--plot-data, #17655e)' });
      rect.append(svgNode('title', {}, '下标 ' + pair.label + '，核值 ' + digits(pair.value)));
      chart.append(rect);
    });
    chart.append(svgNode('line', { x1: left, y1: yFor(average), x2: right, y2: yFor(average), class:'reference-rule' }));
    chart.append(svgNode('text', { x: left, y: 21, class:'axis-title' }, '核值'));
    chart.append(svgNode('text', { x: right, y: 21, 'text-anchor':'end', class:'reference-label' }, '平均核值　' + digits(average)));
    chart.append(svgNode('text', { x: (left+right)/2, y: 177, 'text-anchor':'middle', class:'tick' }, '样本对　1 至 ' + pairs.length));
    const averageX = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - averageX) ** 2, 0) / (values.length - 1);
    pairResult.textContent = `共 ${pairs.length} 对 · U = ${digits(average)}。` + (isVariance ? ` 由中心化公式算得样本方差 ${digits(variance)}。` : ' 这是一对不同下标的观测之间的平均绝对距离。');
    for (const pair of pairs) {
      const entry = document.createElement('span');
      const number = document.createElement('b');
      number.textContent = digits(pair.value);
      entry.append(pair.label, number);
      details.append(entry);
    }
  }

  input.addEventListener('input', updatePairs);
  kernel.addEventListener('change', updatePairs);
  document.getElementById('u-restore').addEventListener('click', () => {
    input.value = defaultData;
    kernel.value = 'variance';
    updatePairs();
  });

  const xValues = [2, 4, 6];
  const yBase = [1, 3, 5, 7];
  Object.assign(window.courseLabParams, {
    'u-pairs': () => {
      const values = readPairSample();
      return values ? { SAMPLE: values, KERNEL: kernel.value } : null;
    },
    'u-cross': () => ({ X: xValues, Y_BASE: yBase, SHIFT: Number(shift.value) })
  });
  const crossResult = document.getElementById('u-cross-result');
  function updateCross() {
    const offset = Number(shift.value);
    document.getElementById('u-shift-value').textContent = String(offset);
    const yValues = yBase.map(value => value + offset);
    const table = document.createElement('table');
    table.setAttribute('aria-label', '跨组样本对的大小比较');
    function cell(row, tag, text, outcome, scope) {
      const td = document.createElement(tag);
      td.textContent = text;
      if (scope) td.scope = scope;
      if (outcome) td.dataset.outcome = outcome;
      row.append(td);
    }
    const headings = table.createTHead().insertRow();
    cell(headings, 'th', 'X / Y', null, 'col');
    yValues.forEach(value => cell(headings, 'th', String(value), null, 'col'));
    const body = table.createTBody();
    let wins = 0;
    let ties = 0;
    for (const x of xValues) {
      const row = body.insertRow();
      cell(row, 'th', String(x), null, 'row');
      for (const y of yValues) {
        if (x > y) wins++;
        if (x === y) ties++;
        const symbol = x > y ? '>' : x < y ? '<' : '=';
        const outcome = x > y ? 'win' : x < y ? 'loss' : 'tie';
        cell(row, 'td', symbol, outcome);
      }
    }
    document.getElementById('u-cross-grid').replaceChildren(table);
    const total = xValues.length * yValues.length;
    const rankSum = xValues.length * (xValues.length + 1) / 2 + wins + .5 * ties;
    crossResult.textContent = `${total} 对中，X 大于 Y 有 ${wins} 对，相等 ${ties} 对，小于 ${total - wins - ties} 对。严格胜出比例 ${wins}/${total}，平局计半后的比例 ${digits((wins + .5 * ties) / total)}，X 组平均秩的合计 W = ${digits(rankSum)}。`;
  }
  shift.addEventListener('input', updateCross);
  updatePairs();
  updateCross();
})();

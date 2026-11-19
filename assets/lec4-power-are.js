(() => {
  'use strict';
  const get = id => document.getElementById(id);

  // With n <= 50 every coefficient and the fair-coin tail count are exact integers.
  function binomialCounts(n) {
    const counts = Array(n + 1).fill(0);
    counts[0] = 1;
    for (let m = 1; m <= n; m++) {
      for (let k = m; k > 0; k--) counts[k] += counts[k - 1];
    }
    return counts;
  }

  function upperTail(counts, critical, p) {
    const n = counts.length - 1;
    let tail = 0;
    for (let k = critical; k <= n; k++) {
      tail += counts[k] * p ** k * (1 - p) ** (n - k);
    }
    return Math.min(1, tail);
  }

  function powerInputs() {
    return {
      N: Number(get('l4-power-n').value),
      P: Number(get('l4-power-p').value),
      ALPHA: Number(get('l4-power-alpha').value)
    };
  }

  function updatePower() {
    const {N: n, P: p, ALPHA: alpha} = powerInputs();
    const counts = binomialCounts(n);
    let critical = n + 1;
    let nullCount = 0;
    for (let k = n; k >= 0; k--) {
      if ((nullCount + counts[k]) / 2 ** n > alpha) break;
      nullCount += counts[k];
      critical = k;
    }
    const size = nullCount / 2 ** n;
    const rejection = upperTail(counts, critical, p);
    const rule = critical > n ? '空拒绝域' : 'S ≥ ' + critical;
    const x = prob => 44 + (prob - 0.5) * 592;
    const y = prob => 155 - prob * 117;
    const path = [];
    for (let i = 0; i <= 100; i++) {
      const q = 0.5 + i / 200;
      path.push((i === 0 ? 'M' : 'L') + x(q).toFixed(2) + ' ' + y(upperTail(counts, critical, q)).toFixed(2));
    }
    get('l4-power-path').setAttribute('d', path.join(' '));
    get('l4-power-level').setAttribute('y1', y(alpha));
    get('l4-power-level').setAttribute('y2', y(alpha));
    get('l4-power-dot').setAttribute('cx', x(p));
    get('l4-power-dot').setAttribute('cy', y(rejection));
    get('l4-power-n-val').value = n;
    get('l4-power-p-val').value = p.toFixed(2);
    const description = '拒绝域：' + rule + '。名义水平 ' + alpha.toFixed(2) +
      '，实际水平 ' + size.toFixed(4) + '。' +
      (p === 0.5 ? '当前 p = 0.50 正是零假设边界，标记点的高度等于实际水平。' :
        '当 p = ' + p.toFixed(2) + ' 时，功效 ' + rejection.toFixed(4) + '，第二类错误概率 ' + (1 - rejection).toFixed(4) + '。');
    get('l4-power-out').textContent = description;
    get('l4-power-chart').setAttribute('aria-label', '单侧符号检验的精确功效曲线。' + description);
  }

  function areInputs() {
    return {DIST: get('l4-are-dist').value, BASE_N: Number(get('l4-are-n').value)};
  }
  // Each row: population variance, density at zero, and integral of f^2.
  const families = {
    normal: { variance: 1, f0: 1 / Math.sqrt(2 * Math.PI), integral: 1 / (2 * Math.sqrt(Math.PI)) },
    laplace: { variance: 2, f0: 0.5, integral: 0.25 },
    uniform: { variance: 1 / 3, f0: 0.5, integral: 0.5 }
  };
  function updateARE() {
    const {DIST, BASE_N: base} = areInputs();
    const {variance, f0, integral} = families[DIST];
    const signARE = 4 * variance * f0 ** 2;
    const rankARE = 12 * variance * integral ** 2;
    const signN = Math.ceil(base / signARE);
    const rankN = Math.ceil(base / rankARE);
    const largest = Math.max(base, signN, rankN);
    for (const [id, n] of [['t',base],['sign',signN],['rank',rankN]]) {
      get('l4-are-bar-' + id).setAttribute('width', 194 * n / largest);
      get('l4-are-count-' + id).textContent = n;
    }
    get('l4-are-n-val').value = base;
    const description = '以 t 检验的 ' + base + ' 个观测为基准。符号检验的 ARE 为 ' +
      signARE.toFixed(4) + '，约需 ' + signN + ' 个；Wilcoxon 符号秩检验的 ARE 为 ' +
      rankARE.toFixed(4) + '，约需 ' + rankN + ' 个。两项均按未舍入的效率换算，再向上取整。';
    get('l4-are-out').textContent = description;
    get('l4-are-chart').setAttribute('aria-label', description);
  }

  window.courseLabParams['lab4-power'] = powerInputs;
  window.courseLabParams['lab4-are'] = areInputs;
  get('l4-power-n').addEventListener('input', updatePower);
  get('l4-power-p').addEventListener('input', updatePower);
  get('l4-power-alpha').addEventListener('change', updatePower);
  get('l4-are-n').addEventListener('input', updateARE);
  get('l4-are-dist').addEventListener('change', updateARE);
  updatePower();
  updateARE();
})();

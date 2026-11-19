(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  if (!byId('lab4-perm') || !byId('lab4-likelihood')) return;
  const small = matchMedia('(max-width:560px)');
  const dataInk = 'var(--plot-data, #17655e)';
  const tailInk = 'var(--plot-reference, #80500f)';
  function svgNode(tag, attrs, text) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function board(container, name, height) {
    const width = small.matches ? 328 : 560;
    const svg = svgNode('svg', {viewBox:'0 0 '+width+' '+height, role:'img', 'aria-label':name, class:'stat-figure'});
    svg.append(svgNode('title', {}, name));
    byId(container).replaceChildren(svg);
    return {svg, width};
  }
  function addRow(body, values) {
    const row = body.insertRow();
    for (const value of values) row.insertCell().textContent = String(value);
  }

  // Enumerate index combinations, retaining multiplicities for identical statistics.
  const sample = [1, 2, 4, 5];
  const allocations = [];
  const which = byId('ch4-perm-group'), tail = byId('ch4-perm-tail');
  for (let i = 0; i < sample.length; i++) {
    for (let j = i + 1; j < sample.length; j++) {
      const a = [sample[i], sample[j]];
      const b = sample.filter((_, pos) => pos !== i && pos !== j);
      const diff = (a[0] + a[1] - b[0] - b[1]) / 2;
      which.add(new Option(a.join('、'), String(allocations.length)));
      allocations.push({indices:[i,j], a, b, diff});
    }
  }
  function renderPermutation() {
    const observed = allocations[which.selectedIndex];
    const isExtreme = value => tail.value === 'two' ? Math.abs(value) >= Math.abs(observed.diff) :
      tail.value === 'left' ? value <= observed.diff : value >= observed.diff;
    const hits = allocations.filter(item => isExtreme(item.diff)).length;
    const info = '当前 A = {'+observed.a.join(', ')+'}，B = {'+observed.b.join(', ')+'}，观测均值差为 '+observed.diff+
      '。六种标签分配中有 '+hits+' 种至少同样极端（含等号），精确 p = '+hits+'/6 = '+(hits/6).toFixed(4)+'。';
    byId('ch4-perm-result').textContent = info;
    const body = byId('ch4-perm-table');
    body.replaceChildren();
    for (const item of allocations) addRow(body, [item.a.join('、'),item.b.join('、'),item.diff,isExtreme(item.diff)?'是':'否']);
    const {svg,width} = board('ch4-perm-plot', '每个标记是一种分组；菱形表示计入尾部。'+info, 163);
    const left = 24, right = width-24, axisY=101;
    const xAt = value => left + (value+3)/6*(right-left);
    svg.append(svgNode('text',{x:10,y:20,class:'axis-title'},'每个标记代表一种分组'));
    svg.append(svgNode('text',{x:width-10,y:20,'text-anchor':'end',class:'reference-label'},'◆ 计入尾部'));
    svg.append(svgNode('line',{x1:left,y1:axisY,x2:right,y2:axisY,class:'axis-edge'}));
    for (let d=-3; d<=3; d++) {
      const x=xAt(d);
      svg.append(svgNode('line',{x1:x,y1:axisY,x2:x,y2:axisY+4,class:'axis-edge'}));
      svg.append(svgNode('text',{x,y:125,'text-anchor':'middle',class:'tick'},d));
    }
    const counts=new Map();
    for (const item of allocations) {
      const k=counts.get(item.diff)||0;
      counts.set(item.diff,k+1);
      const x=xAt(item.diff), y=axisY-13-19*k;
      const marker=isExtreme(item.diff) ?
        svgNode('path',{d:'M '+x+' '+(y-7)+' l 7 7 -7 7 -7 -7 z',fill:tailInk}) :
        svgNode('circle',{cx:x,cy:y,r:6,fill:dataInk});
      marker.append(svgNode('title',{},'A：'+item.a.join('、')+'；均值差 '+item.diff));
      svg.append(marker);
    }
    svg.append(svgNode('text',{x:width/2,y:151,'text-anchor':'middle',class:'axis-title'},'A 组均值 − B 组均值'));
  }
  which.addEventListener('change',renderPermutation);
  tail.addEventListener('change',renderPermutation);

  // Chi-square(1) survival function Q(1/2, statistic/2). Evaluate the lower
  // incomplete-gamma series near zero and the upper continued fraction in the tail.
  function chiSquareTail(statistic) {
    const x = statistic/2;
    if (x === 0) return 1;
    const factor = Math.exp(-x + .5*Math.log(x) - .5*Math.log(Math.PI));
    if (x < 1.5) {
      let sum=2, term=2;
      for (let i=1; i<=160; i++) {
        term *= x/(i+.5); sum += term;
        if (term <= 1e-15*sum) break;
      }
      return Math.max(0,1-factor*sum);
    }
    let b=x+.5, c=1e300, d=1/b, h=d;
    for (let i=1; i<=160; i++) {
      const a = -i*(i-.5);
      b += 2; d = 1/(a*d+b); c = b+a/c;
      const delta=c*d; h *= delta;
      if (Math.abs(delta-1) < 1e-15) break;
    }
    return factor*h;
  }
  function formatP(p) {
    if (p < 1e-300) return '< 10⁻³⁰⁰';
    return p < .0001 ? p.toExponential(3) : p.toFixed(4);
  }
  const sampleN = byId('ch4-lik-n'), successes=byId('ch4-lik-k'), nullP=byId('ch4-lik-null');
  const critical = 3.841458820694124;
  function renderLikelihood() {
    const n=Number(sampleN.value), k=Number(successes.value), p0=Number(nullP.value);
    const phat=k/n, delta=phat-p0;
    const lr=2*((k ? k*Math.log(phat/p0) : 0) + (n-k ? (n-k)*Math.log((1-phat)/(1-p0)) : 0));
    const wald=(k===0 || k===n) ? null : n*delta*delta/(phat*(1-phat));
    const score=n*delta*delta/(p0*(1-p0));
    const tests=[['LR', Math.max(0,lr)],['Wald',wald],['Score',score]];
    const body=byId('ch4-lik-table');
    body.replaceChildren();
    for (const [name,t] of tests) {
      const p=t===null ? null : chiSquareTail(t);
      addRow(body,[name,t===null?'未定义':t.toFixed(4),p===null?'—':formatP(p),
        t===null?'—':(p<=.05?'拒绝 H₀':'不拒绝 H₀')]);
    }
    byId('ch4-lik-k-label').textContent=String(k);
    byId('ch4-lik-null-label').textContent=p0.toFixed(2);
    const info = '样本成功比例为 '+phat.toFixed(3)+'。三种判决均参照自由度 1 的卡方近似，5% 临界值为 3.8415。'+
      (wald===null?'当前样本成功比例位于边界，代入的 Wald 方差为零，无法给出普通 Wald 检验。':'')+
      (Math.min(n*p0,n*(1-p0))<5?'零假设下至少一类期望计数小于 5，尾部近似宜用精确二项检验核查。':'有限样本中的三种 p 值均为渐近近似。');
    byId('ch4-lik-result').textContent=info;
    const {svg,width}=board('ch4-lik-plot','三种统计量与5%临界值的比较。'+info,175);
    const left=60,right=width-22, maximum=Math.max(critical,...tests.map(item=>item[1]||0))*1.13;
    const xAt=value=>left+value/maximum*(right-left);
    svg.append(svgNode('text',{x:9,y:19,class:'axis-title'},'检验统计量'));
    svg.append(svgNode('text',{x:width-7,y:19,'text-anchor':'end',class:'reference-label'},'虚线：5% 临界值'));
    tests.forEach(([name,t],i)=>{
      const y=50+32*i;
      svg.append(svgNode('text',{x:left-8,y:y+5,'text-anchor':'end',class:'tick'},name));
      if (t===null) svg.append(svgNode('text',{x:left+4,y:y+4,class:'tick'},'未定义'));
      else {
        svg.append(svgNode('line',{x1:left,y1:y,x2:xAt(t),y2:y,stroke:dataInk,'stroke-width':4}));
        svg.append(svgNode('circle',{cx:xAt(t),cy:y,r:4.7,fill:dataInk}));
      }
    });
    svg.append(svgNode('line',{x1:left,y1:134,x2:right,y2:134,class:'axis-edge'}));
    svg.append(svgNode('line',{x1:xAt(critical),y1:30,x2:xAt(critical),y2:134,class:'reference-rule'}));
    svg.append(svgNode('text',{x:left,y:157,'text-anchor':'middle',class:'tick'},'0'));
    svg.append(svgNode('text',{x:right,y:157,'text-anchor':'end',class:'tick'},maximum.toFixed(1)));
  }
  sampleN.addEventListener('change',()=>{
    const fraction=Number(successes.value)/Number(successes.max);
    successes.max=sampleN.value; successes.value=String(Math.round(fraction*Number(sampleN.value)));
    renderLikelihood();
  });
  successes.addEventListener('input',renderLikelihood);
  nullP.addEventListener('input',renderLikelihood);
  small.addEventListener('change',()=>{renderPermutation();renderLikelihood();});
  window.courseLabParams['lab4-perm']=()=>({SAMPLE:sample,A_INDICES:allocations[which.selectedIndex].indices,ALTERNATIVE:tail.value});
  window.courseLabParams['lab4-likelihood']=()=>({N:Number(sampleN.value),K:Number(successes.value),P0:Number(nullP.value)});
  renderPermutation();
  renderLikelihood();
})();

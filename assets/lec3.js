// Old Faithful (272 ordered eruption/waiting pairs), R datasets::faithful.
// Source: W. Härdle, Smoothing Techniques, 1991, as distributed with R.
(() => {
  'use strict';
  const faithful = [[3.6,79], [1.8,54], [3.333,74], [2.283,62], [4.533,85], [2.883,55], [4.7,88], [3.6,85], [1.95,51], [4.35,85], [1.833,54], [3.917,84], [4.2,78], [1.75,47], [4.7,83], [2.167,52], [1.75,62], [4.8,84], [1.6,52], [4.25,79], [1.8,51], [1.75,47], [3.45,78], [3.067,69], [4.533,74], [3.6,83], [1.967,55], [4.083,76], [3.85,78], [4.433,79], [4.3,73], [4.467,77], [3.367,66], [4.033,80], [3.833,74], [2.017,52], [1.867,48], [4.833,80], [1.833,59], [4.783,90], [4.35,80], [1.883,58], [4.567,84], [1.75,58], [4.533,73], [3.317,83], [3.833,64], [2.1,53], [4.633,82], [2,59], [4.8,75], [4.716,90], [1.833,54], [4.833,80], [1.733,54], [4.883,83], [3.717,71], [1.667,64], [4.567,77], [4.317,81], [2.233,59], [4.5,84], [1.75,48], [4.8,82], [1.817,60], [4.4,92], [4.167,78], [4.7,78], [2.067,65], [4.7,73], [4.033,82], [1.967,56], [4.5,79], [4,71], [1.983,62], [5.067,76], [2.017,60], [4.567,78], [3.883,76], [3.6,83], [4.133,75], [4.333,82], [4.1,70], [2.633,65], [4.067,73], [4.933,88], [3.95,76], [4.517,80], [2.167,48], [4,86], [2.2,60], [4.333,90], [1.867,50], [4.817,78], [1.833,63], [4.3,72], [4.667,84], [3.75,75], [1.867,51], [4.9,82], [2.483,62], [4.367,88], [2.1,49], [4.5,83], [4.05,81], [1.867,47], [4.7,84], [1.783,52], [4.85,86], [3.683,81], [4.733,75], [2.3,59], [4.9,89], [4.417,79], [1.7,59], [4.633,81], [2.317,50], [4.6,85], [1.817,59], [4.417,87], [2.617,53], [4.067,69], [4.25,77], [1.967,56], [4.6,88], [3.767,81], [1.917,45], [4.5,82], [2.267,55], [4.65,90], [1.867,45], [4.167,83], [2.8,56], [4.333,89], [1.833,46], [4.383,82], [1.883,51], [4.933,86], [2.033,53], [3.733,79], [4.233,81], [2.233,60], [4.533,82], [4.817,77], [4.333,76], [1.983,59], [4.633,80], [2.017,49], [5.1,96], [1.8,53], [5.033,77], [4,77], [2.4,65], [4.6,81], [3.567,71], [4,70], [4.5,81], [4.083,93], [1.8,53], [3.967,89], [2.2,45], [4.15,86], [2,58], [3.833,78], [3.5,66], [4.583,76], [2.367,63], [5,88], [1.933,52], [4.617,93], [1.917,49], [2.083,57], [4.583,77], [3.333,68], [4.167,81], [4.333,81], [4.5,73], [2.417,50], [4,85], [4.167,74], [1.883,55], [4.583,77], [4.25,83], [3.767,83], [2.033,51], [4.433,78], [4.083,84], [1.833,46], [4.417,83], [2.183,55], [4.8,81], [1.833,57], [4.8,76], [4.1,84], [3.966,77], [4.233,81], [3.5,87], [4.366,77], [2.25,51], [4.667,78], [2.1,60], [4.35,82], [4.133,91], [1.867,53], [4.6,78], [1.783,46], [4.367,77], [3.85,84], [1.933,49], [4.5,83], [2.383,71], [4.7,80], [1.867,49], [3.833,75], [3.417,64], [4.233,76], [2.4,53], [4.8,94], [2,55], [4.15,76], [1.867,50], [4.267,82], [1.75,54], [4.483,75], [4,78], [4.117,79], [4.083,78], [4.267,78], [3.917,70], [4.55,79], [4.083,70], [2.417,54], [4.183,86], [2.217,50], [4.45,90], [1.883,54], [1.85,54], [4.283,77], [3.95,79], [2.333,64], [4.15,75], [2.35,47], [4.933,86], [2.9,63], [4.583,85], [3.833,82], [2.083,57], [4.367,82], [2.133,67], [4.35,74], [2.2,54], [4.45,83], [3.567,73], [4.5,73], [4.15,88], [3.817,80], [3.917,71], [4.45,83], [2,56], [4.283,79], [4.767,78], [4.533,84], [1.85,58], [4.25,83], [1.983,43], [2.25,60], [4.75,75], [4.117,81], [2.15,46], [4.417,90], [1.817,46], [4.467,74]];
  const get = id => document.getElementById(id);
  const mean = values => values.reduce((sum, x) => sum + x, 0) / values.length;
  function variance(values) {
    const center = mean(values);
    return values.reduce((sum, x) => sum + (x - center) ** 2, 0) / (values.length - 1);
  }
  function quantileSorted(values, p) {
    const index = p * (values.length - 1);
    const lower = Math.floor(index);
    return values[lower] + (index - lower) * (values[Math.ceil(index)] - values[lower]);
  }
  function randomGenerator(seed) {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return (state + 0.5) / 4294967296;
    };
  }
  function node(type, attrs, label) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', type);
    for (const [key, val] of Object.entries(attrs)) el.setAttribute(key, String(val));
    if (label !== undefined) el.textContent = label;
    return el;
  }
  const colors = { data: 'var(--plot-data, #17655e)', reference: 'var(--plot-reference, #80500f)' };
  const narrow = matchMedia('(max-width:560px)');
  function chart(id, description, xl, xu, yl, yu, xticks, yticks, xlabel, ylabel) {
    const width = narrow.matches ? 350 : 540;
    const left = 44, right = width - 17, top = 41, bottom = 185;
    const x = value => left + (value - xl) / (xu - xl) * (right - left);
    const y = value => bottom - (value - yl) / (yu - yl) * (bottom - top);
    const svg = node('svg', {viewBox: '0 0 ' + width + ' 246', role: 'img', class:'stat-figure', 'aria-label': description});
    svg.append(node('title', {}, description));
    for (const tick of yticks) {
      svg.append(node('line', {x1:left,y1:y(tick),x2:right,y2:y(tick),class:'plot-grid'}));
      svg.append(node('text', {x:left-7,y:y(tick)+4,'text-anchor':'end',class:'tick'},tick.toLocaleString('zh-CN',{maximumFractionDigits:1})));
    }
    for (const tick of xticks) {
      svg.append(node('line', {x1:x(tick),y1:bottom,x2:x(tick),y2:bottom+4,class:'axis-edge'}));
      svg.append(node('text',{x:x(tick),y:bottom+22,'text-anchor':'middle',class:'tick'},tick.toLocaleString('zh-CN',{maximumFractionDigits:2})));
    }
    svg.append(node('text',{x:left,y:17,class:'axis-title'},ylabel));
    svg.append(node('text',{x:(left+right)/2,y:236,'text-anchor':'middle',class:'axis-title'},xlabel));
    svg.append(node('line',{x1:left,y1:bottom,x2:right,y2:bottom,class:'axis-edge'}));
    get(id).replaceChildren(svg);
    return {svg,x,y,left,right,top,bottom};
  }
  function histogram(id, values, xlabel, markers, interval) {
    const lo = interval[0], hi = interval[1], bins = 24;
    const counts = Array(bins).fill(0);
    for (const value of values) {
      const index = Math.max(0, Math.min(bins-1, Math.floor((value-lo)/(hi-lo)*bins)));
      counts[index]++;
    }
    const ymax = Math.max(...counts);
    const xticks = Array.from({length:5},(_,i)=>lo+(hi-lo)*i/4);
    const svgChart = chart(id,'横轴为'+xlabel+'，纵轴为各区间模拟次数。',lo,hi,0,ymax,xticks,[0,Math.ceil(ymax/2),ymax],xlabel,'次数');
    const {svg,x,y,top,bottom,right}=svgChart;
    const width = (svgChart.right - svgChart.left) / bins;
    counts.forEach((v,i)=>{
      if (!v) return;
      const bar = node('rect',{x:svgChart.left+i*width+.5,y:y(v),width:width-1,height:bottom-y(v),fill:colors.data});
      const a = lo + (hi-lo)*i/bins, b = lo + (hi-lo)*(i+1)/bins;
      bar.append(node('title',{},a.toFixed(2)+' 至 '+b.toFixed(2)+'，'+v+' 次'));
      svg.append(bar);
    });
    const caption = id === 'l3-boot-plot' ? '区间端点' : '双侧界点';
    svg.append(node('line',{x1:right-78,y1:13,x2:right-59,y2:13,class:'reference-rule'}));
    svg.append(node('text',{x:right,y:17,'text-anchor':'end',class:'reference-label'},caption));
    for (const t of new Set(markers)) {
      svg.append(node('line',{x1:x(t),y1:top,x2:x(t),y2:bottom,class:'reference-rule'}));
    }
  }
  const bootData = [2,4,10,9,1];
  const statistics = {
    mean, variance, max: values => Math.max(...values),
    median: values => quantileSorted([...values].sort((a,b)=>a-b),.5)
  };
  let bootSeed = 20261118;
  function updateBootstrap() {
    const select = get('l3-boot-stat');
    const name = select.selectedOptions[0].textContent;
    const statistic = statistics[select.value];
    const b = Number(get('l3-boot-b').value);
    const random = randomGenerator(bootSeed);
    const values = [];
    let firstSample;
    for (let i=0; i<b; i++) {
      const draw = Array.from({length:bootData.length},()=>bootData[Math.floor(random()*bootData.length)]);
      if (i===0) firstSample = draw;
      values.push(statistic(draw));
    }
    values.sort((a,b)=>a-b);
    const low = quantileSorted(values,.025), high = quantileSorted(values,.975);
    const xmin = Math.floor(values[0]), xmax = Math.ceil(values[values.length-1]);
    histogram('l3-boot-plot',values,name+'的自助估计',[low,high],[xmin,xmax]);
    get('l3-boot-out').textContent = '原样本'+name+' '+statistic(bootData).toFixed(2)+'。第一组重抽为 ['+firstSample.join('、')+']，对应'+name+' '+statistic(firstSample).toFixed(2)+'。基于 '+b+' 次重抽，估计标准误 '+Math.sqrt(variance(values)).toFixed(3)+'，95% 百分位数区间 ['+low.toFixed(2)+'，'+high.toFixed(2)+']（图中虚线）。';
  }
  get('l3-boot-stat').addEventListener('change',updateBootstrap);
  get('l3-boot-b').addEventListener('change',updateBootstrap);
  get('l3-boot-seed').addEventListener('click',()=>{bootSeed = (bootSeed+1)>>>0;updateBootstrap();});
  updateBootstrap();

  function updateFaithful() {
    const threshold = Number(get('l3-faithful-cut').value);
    get('l3-faithful-label').value = threshold.toFixed(1);
    const {svg,x,y,top,bottom,right} = chart('l3-faithful-plot','272 条观测，短喷发为菱形、长喷发为圆点。',1.5,5.25,40,100,[2,3,4,5],[40,60,80,100],'喷发持续时间（分钟）','等待时间（分钟）');
    svg.append(node('path',{d:'M '+(right-110)+' 7 l 5 5 -5 5 -5 -5 z',fill:colors.reference}));
    svg.append(node('text',{x:right-101,y:17,class:'tick'},'短组'));
    svg.append(node('circle',{cx:right-45,cy:12,r:3.8,fill:colors.data}));
    svg.append(node('text',{x:right-34,y:17,class:'tick'},'长组'));
    svg.append(node('line',{x1:x(threshold),y1:top-6,x2:x(threshold),y2:bottom,stroke:'var(--plot-axis)','stroke-width':1.6,'stroke-dasharray':'4 4'}));
    const short=[], long=[];
    for (const [duration,waiting] of faithful) {
      const xx=x(duration), yy=y(waiting);
      if (duration<=threshold) {
        short.push(waiting);
        svg.append(node('path',{d:'M '+xx+' '+(yy-3)+' l 3 3 -3 3 -3 -3 z',fill:colors.reference,opacity:.81}));
      } else {
        long.push(waiting);
        svg.append(node('circle',{cx:xx,cy:yy,r:2.95,fill:colors.data,opacity:.78}));
      }
    }
    let wins=0, ties=0;
    for (const a of short) for (const b of long) {if(a<b) wins++; if(a===b) ties++;}
    const pairs=short.length*long.length;
    get('l3-faithful-out').textContent='短组 '+short.length+' 次，平均等待 '+mean(short).toFixed(2)+' 分钟；长组 '+long.length+' 次，平均等待 '+mean(long).toFixed(2)+' 分钟。'+pairs+' 个跨组配对中有 '+wins+' 对满足短组等待较短，'+ties+' 对相等。严格小于的比例为 '+(wins/pairs).toFixed(4)+'，并列计半分为 '+((wins+ties/2)/pairs).toFixed(4)+'。';
  }
  get('l3-faithful-cut').addEventListener('input',updateFaithful);
  get('l3-faithful-reset').addEventListener('click',()=>{get('l3-faithful-cut').value='3';updateFaithful();});
  updateFaithful();

  const multData = [1,2,3,4,5,6,7,8];
  const multMean = mean(multData), sqrtN = Math.sqrt(multData.length);
  const multiplierSeed = 31415926;
  const gaussianRandom = randomGenerator(multiplierSeed);
  function normal() {
    return Math.sqrt(-2*Math.log(gaussianRandom()))*Math.cos(2*Math.PI*gaussianRandom());
  }
  const roots = Array.from({length:4000},()=>multData.reduce((sum,x)=>sum+(x-multMean)*normal(),0)/sqrtN);
  const conditionalSD = Math.sqrt(multData.reduce((sum,x)=>sum+(x-multMean)**2,0)/multData.length);
  const plotLimit = Math.ceil(Math.max(8,...roots.map(Math.abs)));
  function updateMultiplier() {
    const mu = Number(get('l3-mult-mu').value);
    get('l3-mult-label').value=mu.toFixed(1);
    const root = sqrtN*(multMean-mu);
    const hits = roots.filter(t=>Math.abs(t)>=Math.abs(root)).length;
    histogram('l3-mult-plot',roots,'中心化乘数根 T*',[-Math.abs(root),Math.abs(root)],[-plotLimit,plotLimit]);
    get('l3-mult-out').textContent='样本均值 '+multMean.toFixed(1)+'，观测根 '+root.toFixed(3)+'，条件标准差 '+conditionalSD.toFixed(3)+'。双侧尾部命中 '+hits+' / '+roots.length+'，模拟 p 值 '+(hits/roots.length).toFixed(4)+'。';
  }
  get('l3-mult-mu').addEventListener('input',updateMultiplier);
  updateMultiplier();
  narrow.addEventListener('change', () => {
    updateBootstrap();
    updateFaithful();
    updateMultiplier();
  });
  Object.assign(window.courseLabParams, {
    'lab-resample': () => ({
      SAMPLE: bootData, STAT: get('l3-boot-stat').value,
      B: Number(get('l3-boot-b').value), SEED: bootSeed
    }),
    'lab-faithful': () => ({
      PAIRS: faithful, CUTOFF: Number(get('l3-faithful-cut').value)
    }),
    'lab-multiplier': () => ({
      SAMPLE: multData, MU0: Number(get('l3-mult-mu').value),
      B: roots.length, SEED: multiplierSeed
    })
  });
})();

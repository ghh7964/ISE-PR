/* 4. 이슈 1-②: 멈추지 않는 발전 — ECI 선이 꺾여 오른다.
   기울기 차이는 '이전 속도가 이어졌다면'의 연장선과 실제 선 사이의 벌어짐으로 보여 준다.
   마지막 스텝은 예측선을 긋지 않고, 2026년에 실제로 갱신된 기록만 짚는다. */
(function () {
  const X0 = 220, X1 = 1640, YT = 300, YB = 900, VMIN = 120, VMAX = 170;
  const T0 = Date.parse('2023-01-01'), T1 = Date.parse('2026-12-31');
  const BREAK = Date.parse('2024-09-12');
  const YEAR = 365.25 * 864e5;
  const x = (t) => X0 + ((t - T0) / (T1 - T0)) * (X1 - X0);
  const y = (v) => YB - ((v - VMIN) / (VMAX - VMIN)) * (YB - YT);
  const f1 = (n) => n.toFixed(1);

  const pts = PPT.DATA.eci.map(([d, name, v]) => ({ t: Date.parse(d), name, v }));
  const pre = pts.filter((p) => p.t < BREAK);
  const post = pts.filter((p) => p.t >= BREAK);
  const fit = (arr, slope) => {
    const b = arr.reduce((s, p) => s + (p.v - slope * ((p.t - T0) / YEAR)), 0) / arr.length;
    return (t) => b + slope * ((t - T0) / YEAR);
  };
  const fPre = fit(pre, 6), fPost = fit(post, 14);
  const line = (arr) => arr.map((p, i) => `${i ? 'L' : 'M'}${f1(x(p.t))} ${f1(y(p.v))}`).join(' ');
  const preLine = line(pre.concat([post[0]]));
  const postLine = line(post);
  const first = pts[0], lastP = pts[pts.length - 1];
  const tA = Date.parse('2023-03-01'), tB = BREAK, tC = lastP.t;

  // 이전 속도(+6/년)가 그대로 이어졌다면 — 최신 모델 시점의 값
  const ghostEnd = fPre(tC);
  const gap = Math.round(lastP.v - ghostEnd);
  // 벌어진 영역: 연장선(아래) ↔ 실제 선(위)
  const wedge = `M${f1(x(tB))} ${f1(y(fPre(tB)))} L${f1(x(tC))} ${f1(y(ghostEnd))} ` +
    post.slice().reverse().map((p) => `L${f1(x(p.t))} ${f1(y(p.v))}`).join(' ') + ' Z';
  const tGap = Date.parse('2026-04-15');

  // 2026년에 갱신된 기록
  const recent = pts.filter((p) => p.t >= Date.parse('2026-01-01'));
  const md = (t) => { const d = new Date(t); return `${d.getMonth() + 1}.${d.getDate()}`; };

  const grid = [120, 130, 140, 150, 160, 170].map((v) =>
    `<line x1="${X0}" x2="${X1}" y1="${y(v)}" y2="${y(v)}"/><text x="${X0 - 20}" y="${y(v) + 8}" text-anchor="end">${v}</text>`).join('');
  const years = [2023, 2024, 2025, 2026].map((yr) => {
    const t = Date.parse(yr + '-01-01');
    return `<line x1="${x(t)}" x2="${x(t)}" y1="${YB}" y2="${YB + 12}" stroke="var(--line-strong)"/><text x="${x(t) + 8}" y="${YB + 44}">${yr}</text>`;
  }).join('');
  const dots = (arr, cls) => arr.map((p) => `<circle class="dot ${cls}" cx="${f1(x(p.t))}" cy="${f1(y(p.v))}" r="7"/>`).join('');
  // 날짜 라벨은 위아래로 엇갈려 겹치지 않게. 이틀 차이인 마지막 두 기록은 라벨 하나로 묶는다.
  const n = recent.length;
  const ticks = recent.map((p, i) => {
    const cx = f1(x(p.t)), cy = y(p.v);
    let lab = '';
    if (i === n - 1) lab = `<text x="${f1(x(p.t) - 22)}" y="${f1(cy - 22)}" text-anchor="end">${md(recent[n - 2].t)} · ${md(p.t)}</text>`;
    else if (i < n - 2) lab = `<text x="${cx}" y="${f1(i % 2 ? cy + 50 : cy - 34)}" text-anchor="middle">${md(p.t)}</text>`;
    return `<g class="rec"><circle cx="${cx}" cy="${f1(cy)}" r="15"/>${lab}</g>`;
  }).join('');

  PPT.register({
    n: 4, part: 1, steps: 4,
    pos: { x: 300, y: -4500, z: -1200, ry: -6 },
    html: `
      <div class="kicker">이슈 1 <b>멈추지 않는 발전</b></div>
      <div class="h2">AI 능력 지수, 기울기가 바뀌었다</div>
      <div class="chart">
        <svg width="1920" height="1080" viewBox="0 0 1920 1080">
          <g class="grid">${grid}</g>
          <g class="xlab">${years}</g>
          <g class="brk" data-s="2">
            <line x1="${x(BREAK)}" x2="${x(BREAK)}" y1="${YT - 10}" y2="${YB}"/>
            <text x="${x(BREAK) + 16}" y="${YT + 18}">추론 모델 등장</text>
            <text class="sub" x="${x(BREAK) + 16}" y="${YT + 52}">2024.9 · ‘생각하고 답하는’ o1</text>
          </g>
          <path class="wedge" data-s="2" style="transition-delay:.9s" d="${wedge}"/>
          <g class="trends" data-s="2">
            <path class="trend a" d="M${x(tA)} ${y(fPre(tA))} L${x(tB)} ${y(fPre(tB))}"/>
            <path class="trend ghost" d="M${x(tB)} ${y(fPre(tB))} L${x(tC)} ${y(ghostEnd)}"/>
            <text class="slope" x="${x(Date.parse('2023-07-01'))}" y="${y(fPre(Date.parse('2023-07-01'))) - 40}" fill="var(--ink-2)">+6<tspan class="slope-u" dx="10">점/년</tspan></text>
            <text class="slope" x="${x(Date.parse('2025-03-01')) - 170}" y="${y(fPost(Date.parse('2025-03-01'))) - 60}" fill="var(--ai)">+14<tspan class="slope-u" dx="10">점/년</tspan></text>
            <text class="ghost-l" x="${x(tC) + 24}" y="${y(ghostEnd) + 8}">이전 속도였다면 ${Math.round(ghostEnd)}</text>
          </g>
          <text class="gap" data-s="2" style="transition-delay:1.2s" x="${x(tGap)}" y="${y((fPre(tGap) + fPost(tGap)) / 2) + 22}" text-anchor="middle">+${gap}</text>
          <path class="frontier pre" d="${preLine}"/>
          <g class="d-pre">${dots(pre, 'pre')}</g>
          <path class="frontier post" d="${postLine}"/>
          <g class="d-post" data-s="1" style="transition-delay:1.2s">${dots(post, '')}</g>
          <g class="recs" data-s="3">${ticks}</g>
          <g class="l-first">
            <text class="lab-big" x="${x(first.t) + 6}" y="${y(first.v) + 76}" fill="var(--ink)">126</text>
            <text class="lab-sm" x="${x(first.t) + 138}" y="${y(first.v) + 70}">GPT-4 · 2023.3</text>
          </g>
          <g class="l-last" data-s="1" style="transition-delay:1.4s">
            <text class="lab-big" x="${x(lastP.t) + 24}" y="${y(lastP.v) + 22}" fill="var(--ai)">167</text>
            <text class="lab-sm" x="${x(lastP.t) + 26}" y="${y(lastP.v) + 60}">최신 모델 · 2026.9</text>
          </g>
        </svg>
        <div class="times" data-s="2" style="transition-delay:.6s">
          <div class="big">×2.3</div>
          <div class="cap">추론 모델 이후 상승 속도<br>1년에 6점 → 14점</div>
        </div>
      </div>
      <div class="still" data-s="3"><b>2026년에만 ${recent.length}번</b> 최고 기록 갱신<small>9월에만 두 번 — 1일, 3일</small></div>
      <div class="src">Epoch AI · Epoch Capabilities Index — 50개+ 벤치마크 통합 · 각 시점 최고점 모델 · 2026.9.24 기준. 점선은 2024.9 이전 추세를 연장한 것</div>
    `,
    init(ctx) {
      PPT.util.hidePath(ctx.$('.frontier.pre'));
      PPT.util.hidePath(ctx.$('.frontier.post'));
    },
    step(k, prev, ctx) {
      const U = PPT.util;
      if (k === 0 && prev == null) U.drawPath(ctx.$('.frontier.pre'), { dur: 1600, delay: 500, ctx });
      else if (k >= 0) U.drawPath(ctx.$('.frontier.pre'), { ctx: { instant: true } });
      if (k >= 1) U.drawPath(ctx.$('.frontier.post'), { dur: 1600, ctx: k === 1 ? ctx : { instant: true } });
      else U.hidePath(ctx.$('.frontier.post'));
    },
  });
})();

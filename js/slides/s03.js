/* 3. 이슈 1-①: 난제를 푸는 LLM — 유체 방정식 뒤에서 유체가 점점 '폭발'한다 */
PPT.register({
  n: 3, part: 1, steps: 5,
  pos: { x: -500, y: -3000, z: -400, ry: 8 },
  fluid: (k) => ({ mode: 'surge', opacity: k === 4 ? 0.45 : 0.95, energy: [0.3, 0.45, 0.6, 0.8, 0.3][k], cx: 0.5, cy: 1 - 440 / 1080 }),
  html: `
    <div class="base">
      <div class="kicker">이슈 1 <b>난제를 푸는 LLM</b></div>
      <div class="h2">90년 묵은 난제에, AI가 해법을 내놓다</div>
      <div class="eq-wrap">
        <math display="block">
          <mrow>
            <mfrac><mrow><mo>∂</mo><mi mathvariant="bold">u</mi></mrow><mrow><mo>∂</mo><mi>t</mi></mrow></mfrac>
            <mo>+</mo><mo>(</mo><mi mathvariant="bold">u</mi><mo>⋅</mo><mo>∇</mo><mo>)</mo><mi mathvariant="bold">u</mi>
            <mo>=</mo><mo>−</mo><mo>∇</mo><mi>p</mi><mo>+</mo><mi>ν</mi><mi>Δ</mi><mi mathvariant="bold">u</mi><mo>+</mo><mi mathvariant="bold">f</mi>
            <mspace width="1.2em"></mspace>
            <mo>∇</mo><mo>⋅</mo><mi mathvariant="bold">u</mi><mo>=</mo><mn>0</mn>
          </mrow>
        </math>
        <div class="eq-cap">나비에-스토크스 방정식 — 유체의 해는 어떤 조건에서 <b>'폭발'</b>하는가? · 2026.9.8 OpenAI 해법 발표</div>
      </div>
      <div class="metrics">
        <div class="metric panel" data-s="1">
          <div class="num"><span class="n-agents">0</span></div>
          <div class="lab">AI 에이전트 동시 실행</div>
          <div class="lab2">공개되지 않은 내부 모델</div>
          <canvas class="agents" width="180" height="240"></canvas>
        </div>
        <div class="metric panel" data-s="2">
          <div class="num"><span class="n-hours">0</span><small>시간</small></div>
          <div class="lab">만에 증명 완성</div>
          <svg class="clock" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="86" fill="none" stroke="var(--line-strong)" stroke-width="3"/>
            <g class="ticks"></g>
            <line class="hand h" x1="100" y1="100" x2="100" y2="52" stroke="var(--ink)" stroke-width="7" stroke-linecap="round"/>
            <line class="hand m" x1="100" y1="100" x2="100" y2="28" stroke="var(--ai)" stroke-width="4" stroke-linecap="round"/>
            <circle cx="100" cy="100" r="7" fill="var(--ai)"/>
          </svg>
        </div>
        <div class="metric panel" data-s="3">
          <div class="num">Lean</div>
          <div class="lab">형식 검증 완료</div>
          <div class="lab2">컴퓨터가 증명을 한 줄씩 검사</div>
          <svg class="check" viewBox="0 0 150 150"><circle cx="75" cy="75" r="64"/><path d="M44 78 L66 100 L108 54"/></svg>
        </div>
      </div>
    </div>
    <div class="heads">
      <div class="head head1 panel en">
        <div class="who"><span>Quanta Magazine</span><span>2026.9.8</span></div>
        <div class="t">“AI Has Solved One of Math's Millennium Prize Problems”</div>
      </div>
      <div class="head head2 panel">
        <div class="who"><span>인공지능신문</span><span>2026.9.10</span></div>
        <div class="t">“오픈AI 나비에-스토크스 해법 공개, 밀레니엄상 공식 해결은 아직”</div>
      </div>
      <div class="head head3 panel en warn">
        <div class="who"><span>Scientific American · 2026.9.21</span><span>논쟁 중</span></div>
        <div class="t">“Did OpenAI solve the wrong Navier-Stokes problem?”</div>
      </div>
    </div>
    <div class="caveat" data-s="4">※ 클레이 연구소 공식 인정 전 · 문제 조건(외력)을 두고 논쟁 중</div>
  `,
  init(ctx) {
    const g = ctx.$('.ticks');
    let s = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      s += `<line x1="${100 + Math.sin(a) * 74}" y1="${100 - Math.cos(a) * 74}" x2="${100 + Math.sin(a) * 82}" y2="${100 - Math.cos(a) * 82}" stroke="var(--muted)" stroke-width="3"/>`;
    }
    g.innerHTML = s;
    PPT.util.hidePath(ctx.$('.check circle'));
    PPT.util.hidePath(ctx.$('.check path'));
  },
  step(k, prev, ctx) {
    const U = PPT.util;
    // ① 에이전트 1만 개: 점 1만 개가 켜진다
    const cv = ctx.$('.agents'), c2 = cv.getContext('2d');
    const drawAgents = (frac) => {
      c2.clearRect(0, 0, 180, 240);
      const cols = 100, rows = 100;
      const col = getComputedStyle(document.documentElement).getPropertyValue('--ai').trim() || '#3fe0ff';
      c2.fillStyle = col;
      let seed = 3;
      for (let i = 0; i < cols * rows; i++) {
        seed = (seed * 16807) % 2147483647;
        if (seed / 2147483647 < frac) c2.fillRect((i % cols) * 1.8, Math.floor(i / cols) * 2.4, 1.2, 1.4);
      }
    };
    if (k >= 1) {
      if (k === 1 && !ctx.instant) {
        U.countUp(ctx.$('.n-agents'), 10000, { dur: 1800, ctx });
        const t0 = performance.now(), tok = ctx.token();
        const tick = (now) => {
          const f = Math.min(1, (now - t0) / 1800);
          drawAgents(U.easeOut(f));
          if (f < 1 && ctx.live(tok)) requestAnimationFrame(tick); else drawAgents(1);
        };
        requestAnimationFrame(tick);
      } else { ctx.$('.n-agents').textContent = '10,000'; drawAgents(1); }
    } else { ctx.$('.n-agents').textContent = '0'; drawAgents(0); }

    // ② 88시간: 분침이 빙글빙글 돌며 시간이 흐른다 (분침 4바퀴, 시침은 88시 = 4시 위치에서 멈춤)
    const hH = ctx.$('.hand.h'), hM = ctx.$('.hand.m');
    const setClock = (f) => {
      hM.setAttribute('transform', `rotate(${f * 4 * 360} 100 100)`);
      hH.setAttribute('transform', `rotate(${f * 120} 100 100)`);
    };
    if (k >= 2) {
      if (k === 2 && !ctx.instant) {
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        U.countUp(ctx.$('.n-hours'), 88, { dur: 2600, ctx, ease }); // 숫자와 시곗바늘이 같은 속도로
        const t0 = performance.now(), tok = ctx.token();
        const tick = (now) => {
          const f = Math.min(1, (now - t0) / 2600);
          setClock(ease(f));
          if (f < 1 && ctx.live(tok)) requestAnimationFrame(tick); else setClock(1);
        };
        requestAnimationFrame(tick);
      } else { ctx.$('.n-hours').textContent = '88'; setClock(1); }
    } else { ctx.$('.n-hours').textContent = '0'; setClock(0); }

    // ③ Lean ✓
    if (k >= 3) {
      // 처음 나타나는 단계(3)에서만 그려지고, 그 뒤 단계에서는 그려진 채로 둔다
      const c = k === 3 ? ctx : { instant: true };
      U.drawPath(ctx.$('.check circle'), { dur: 700, ctx: c });
      U.drawPath(ctx.$('.check path'), { dur: 500, delay: 600, ctx: c });
    } else { U.hidePath(ctx.$('.check circle')); U.hidePath(ctx.$('.check path')); }
  },
});

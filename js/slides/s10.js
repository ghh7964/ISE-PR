/* 10. 결과 1: 반전 — 암전, 추락. 막대가 천천히 오르고, '기대' 유령 막대는 산산이 부서진다. 현미경으로 0.01을 본다 */
(function () {
  const D = PPT.DATA.paper;
  const BASE = 900, K = 75; // 점수 1점 = 75px
  const ticks = [0, 2, 4, 6, 8].map((v) =>
    `<line x1="420" x2="1080" y1="${BASE - v * K}" y2="${BASE - v * K}"/><text x="400" y="${BASE - v * K + 8}" text-anchor="end">${v}</text>`).join('');

  // 유령 막대 파편: 들쭉날쭉한 가로 경계선으로 조각내기
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const rows = 8, W = 230, H = 700;
  const bounds = [];
  for (let r = 0; r <= rows; r++) {
    const y = (r / rows) * H;
    bounds.push([0, 0.25, 0.5, 0.75, 1].map((fx) => [fx * W, r === 0 || r === rows ? y : y + (rnd() - 0.5) * 50]));
  }
  const shards = [];
  for (let r = 0; r < rows; r++) {
    const split = 0.3 + rnd() * 0.4;
    const top = bounds[r], bot = bounds[r + 1];
    const mid = (arr) => [split * W, arr[2][1]];
    const leftPoly = [top[0], top[1], mid(top), mid(bot), bot[1], bot[0]];
    const rightPoly = [mid(top), top[3], top[4], bot[4], bot[3], mid(bot)];
    [leftPoly, rightPoly].forEach((poly) => {
      const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
      shards.push({ poly: poly.map(([x, y]) => `${((x / W) * 100).toFixed(1)}% ${((y / H) * 100).toFixed(1)}%`).join(','), cy });
    });
  }

  PPT.register({
    n: 10, part: 3, steps: 4,
    pos: { x: 4800, y: 2600, z: -400 },
    transition: { blackout: 1000, revealAt: 750, dur: 1700, dolly: 150, easing: 'cubic-bezier(.6,0,.9,.55)', shake: true },
    html: `
      <div class="kicker">결과 1 <b>최종평가</b></div>
      <div class="h2">AI 없이 혼자 푼 최종평가</div>
      <div class="plot">
        <svg class="axis" width="1920" height="1080" style="position:absolute;left:0;top:0">${ticks}</svg>
        <div class="ghost">
          <div class="lbl">기대</div>
          <div class="outline"></div>
          ${shards.map((s) => `<i style="inset:0;border:0;clip-path:polygon(${s.poly})" data-cy="${s.cy.toFixed(0)}"></i>`).join('')}
        </div>
        <div class="bar a"><div class="v">0.00</div><div class="n">AI 반</div></div>
        <div class="bar b"><div class="v">0.00</div><div class="n">일반 반</div></div>
      </div>
      <svg class="lens-line" width="1920" height="1080" data-s="2" data-out="3">
        <ellipse cx="745" cy="382" rx="310" ry="34" fill="none" stroke="var(--human)" stroke-width="3" stroke-dasharray="6 8"/>
        <path d="M1055 382 C 1120 382, 1150 470, 1212 500"/>
      </svg>
      <div class="lens fx-zoom" data-s="2" data-out="3">
        <div class="gl" style="top:223px"><span>6.94</span></div>
        <div class="gl" style="top:297px"><span>6.93</span></div>
        <div class="zb a" style="height:297px"></div>
        <div class="zb b" style="height:223px"></div>
        <div class="gap" style="top:240px">0.01</div>
      </div>
      <div class="stat" data-s="2" data-out="3">
        <div class="d">d = ${D.final.d}</div>
        <div class="p">p = ${D.final.p} · 차이 없음</div>
      </div>
      <div class="legend" data-s="3"><span><i style="background:var(--ai)"></i>AI 반</span><span><i style="background:var(--non)"></i>일반 반</span></div>
      <div class="units panel" data-s="3">
        <h4>AI를 넣은 4개 단원의 과제 점수<small>3개 단원은 일반 반이 약간 높음 · 모두 유의한 차이 없음</small></h4>
        ${D.units.map((u) => `
          <div class="urow">
            <div class="nm">${u.name}</div>
            <div class="b a" style="transform:scaleX(${(u.llm / 8).toFixed(3)})"></div><div class="v ${u.llm > u.non ? 'hi' : ''}">${u.llm.toFixed(2)}</div>
            <div class="b n" style="transform:scaleX(${(u.non / 8).toFixed(3)})"></div><div class="v ${u.non > u.llm ? 'hi' : ''}">${u.non.toFixed(2)}</div>
          </div>`).join('')}
      </div>
      <div class="callback" data-hands-show data-s="3">손을 든 <span class="hands-n">–</span>명의 예상과 달리</div>
      <div class="src r">Thompson et al. (2025) 표 4 · 표 5</div>
    `,
    step(k, prev, ctx) {
      const U = PPT.util;
      const ba = ctx.$('.bar.a'), bb = ctx.$('.bar.b');
      const va = ba.querySelector('.v'), vb = bb.querySelector('.v');
      const ghost = ctx.$('.ghost');
      const frags = ctx.$$('.ghost i');
      const setBars = (a, b) => { ba.style.height = a * K + 'px'; bb.style.height = b * K + 'px'; va.textContent = a.toFixed(2); vb.textContent = b.toFixed(2); };
      const resetGhost = (visible) => {
        frags.forEach((f) => { f.getAnimations().forEach((an) => an.cancel()); f.style.opacity = 0; }); // 조각은 부서질 때만 보인다(평소엔 외곽선 칸이 채움을 맡음)
        ghost.querySelector('.outline').style.opacity = visible ? 1 : 0;
        ghost.querySelector('.lbl').style.opacity = visible ? 0.8 : 0;
      };

      if (k === 0) { setBars(0, 0); resetGhost(true); return; }
      if (k === 1 && !ctx.instant) {
        resetGhost(true);
        const t0 = performance.now(), tok = ctx.token(), dur = 3600;
        const ease = (t) => 1 - Math.pow(1 - t, 4);
        const tick = (now) => {
          const t = Math.min(1, (now - t0) / dur);
          if (!ctx.live(tok)) return;
          setBars(D.final.llm * ease(t), D.final.non * ease(Math.min(1, t * 1.004)));
          if (t < 1) requestAnimationFrame(tick);
          else { setBars(D.final.llm, D.final.non); shatter(); }
        };
        requestAnimationFrame(tick);
        const shatter = () => {
          ghost.querySelector('.outline').style.opacity = 0;
          ghost.querySelector('.lbl').style.opacity = 0;
          frags.forEach((f, i) => {
            const cy = +f.dataset.cy;
            const fall = H - cy + 40 + Math.random() * 80;
            const dx = (Math.random() - 0.5) * 260;
            const rot = (Math.random() - 0.5) * 90;
            f.animate(
              [
                { transform: 'none', opacity: 1 },
                { transform: `translate(${dx * 0.2}px, ${-10 - Math.random() * 20}px) rotate(${rot * 0.1}deg)`, opacity: 1, offset: 0.12 },
                { transform: `translate(${dx}px, ${fall}px) rotate(${rot}deg)`, opacity: 0 },
              ],
              { duration: 1100 + Math.random() * 500, delay: i * 18, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'both' }
            );
          });
        };
        return;
      }
      setBars(D.final.llm, D.final.non);
      resetGhost(false);
    },
  });
})();

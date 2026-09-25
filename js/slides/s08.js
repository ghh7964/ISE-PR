/* 8. 연구 설계 — 22명이 두 반으로 갈라지고, AI 반에만 청록 '동반자'가 붙는다. 최종평가에서 동반자는 떠난다 */
(function () {
  const person = `<svg class="person" viewBox="0 0 44 66"><circle class="head" cx="22" cy="12" r="11"/><path class="body" d="M4 64 Q4 28 22 28 Q40 28 40 64 Z"/></svg>`;
  const units = [
    ['1', '질병과 진단'], ['2', '혈액학', '사례 읽고 진단'], ['3', '면역학', '사례 읽고 진단'], ['4', '호흡기학'],
    ['5', '심장학 1', '사례 직접 쓰기'], ['6', '심장학 2'], ['7', '신경학 1', '사례 직접 쓰기'], ['8', '신경학 2'], ['9', '최종평가'],
  ];
  const posAll = (i) => ({ x: 190 + i * 70, y: 360 });
  const posGroup = (i) => {
    const g = i < 11 ? 0 : 1, j = i % 11, row = j < 6 ? 0 : 1, c = row ? j - 6 : j, n = row ? 5 : 6;
    const cx = g ? 1360 : 560;
    return { x: cx - ((n - 1) * 84) / 2 + c * 84 - 22, y: 320 + row * 110 };
  };

  PPT.register({
    n: 8, part: 2, steps: 5,
    pos: { x: 2400, y: -9400, z: -1500, rx: 90 },
    html: `
      <div class="kicker">논문 <b>연구 설계</b></div>
      <div class="h2">22명, 두 반, 3주</div>
      <div class="meta" data-s="1" style="left:auto;right:140px">여름방학 3주 · 온라인 의학 심화 강좌 · <b>같은 강사</b></div>
      <div class="people">
        ${Array.from({ length: 22 }, (_, i) => `<div class="pp ${i < 11 ? 'ai' : ''}" style="--d:${-(i * 0.23).toFixed(2)}s">${person}<i class="buddy"></i></div>`).join('')}
      </div>
      <div class="grp-lab ai" data-s="1" style="left:430px">AI 반 <span class="mono">11</span>명</div>
      <div class="grp-lab" data-s="1" style="left:1225px;color:var(--ink-2)">일반 반 <span class="mono">11</span>명</div>
      <div class="all-lab abs" data-s="0" data-out="1" style="left:140px;top:470px;font:600 32px var(--font);color:var(--ink-2)">7–10학년 영재 <b class="human">22명</b> · 학년보다 약 2년 앞선 능력으로 선발</div>
      <div class="units" data-s="2">
        ${units.map(([n, nm, act]) => `<div class="u ${act ? 'ai-u' : ''}"><div class="no">${n}</div><div class="nm">${nm}</div>${act ? `<div class="act">${act}</div>` : ''}</div>`).join('')}
      </div>
      <div class="goal" data-s="2" style="transition-delay:.8s">9개 단원 중 <b>4개에 AI</b> · 목표: <span class="not">암기</span> → <b>적용 · 분석</b></div>
      <div class="rubric" data-s="3">
        <span class="lab">루브릭</span>
        <span class="chip">진단 정확도</span><span class="chip">근거 제시</span><span class="chip">추가 질문</span>
      </div>
      <div class="final" data-s="4">
        <div class="t">최종평가: AI 없이 혼자</div>
        <div class="g">채점 2명 — 강사 + <b>어느 반인지 모르는</b> 두 번째 강사</div>
      </div>
    `,
    step(k, prev, ctx) {
      const pps = ctx.$$('.pp');
      pps.forEach((p, i) => {
        const pos = k === 0 ? posAll(i) : posGroup(i);
        p.style.left = pos.x + 'px';
        p.style.top = pos.y + 'px';
        p.style.color = k >= 1 && i >= 11 ? 'var(--ink-2)' : 'var(--human)';
        if (ctx.instant) p.style.transition = 'none';
        else p.style.transition = '';
        if (!ctx.instant) p.style.transitionDelay = k >= 1 ? (i % 11) * 25 + 'ms' : '0ms';
      });
      // 최종평가: 동반자(청록 점)가 돌던 자리에서 그대로 빠져나가 위로 떠난다
      const buds = ctx.$$('.pp.ai .buddy');
      buds.forEach((b) => { b.getAnimations().forEach((a) => { if (!(a instanceof CSSAnimation)) a.cancel(); }); b.style.animation = ''; });
      if (k === 4 && prev === 3 && !ctx.instant) {
        buds.forEach((b, i) => {
          const from = getComputedStyle(b).transform;
          b.style.animation = 'none';
          b.animate(
            [{ transform: from, opacity: 1 }, { transform: `translate(${(i % 2 ? 1 : -1) * (20 + (i * 7) % 40)}px, -220px) scale(.4)`, opacity: 0 }],
            { duration: 1400, delay: i * 70, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' }
          );
        });
      }
      ctx.$$('.u.ai-u').forEach((u, i) => {
        u.classList.toggle('on-ai', k >= 2);
        u.style.transitionDelay = k >= 2 && !ctx.instant ? 400 + i * 150 + 'ms' : '0ms';
      });
    },
  });
})();

/* 6. 영재에게라면? — 호박색(영재의 요구)과 청록(LLM 튜터)이 가운데서 만나 질문이 된다
   거수 인원: H 키(또는 +/-)로 입력 → 슬라이드 10에서 다시 불러옴 */
PPT.register({
  n: 6, part: 1, steps: 4, printStep: 2,
  pos: { x: 0, y: -7700, z: 0 },
  html: `
    <div class="half l">
      <div class="k">영재의 요구</div>
      <div class="need" data-s="0">더 빠르게,<br>더 깊게</div>
      <div class="need-sub" data-s="0"><span class="not">이미 아는 내용의 반복</span> 대신 심화학습</div>
      <canvas class="dots" data-s="1" width="720" height="300"></canvas>
      <div class="dots-cap" data-s="1">
        <div class="yr"><span class="y16">2016 <b>1.84%</b></span><span class="arr">→</span><span class="y25">2025 <b>1.26%</b></span><em>영재교육을 받는 학생 비율</em></div>
        <div class="drop">학생 수 −15% 동안 영재교육 대상자 <b>−42%</b>, 학교 안 영재학급 <b>−56%</b></div>
      </div>
    </div>
    <div class="half r">
      <div class="k" data-s="2">LLM 튜터</div>
      <div class="tutor">
        <div data-s="2" style="transition-delay:.0s">24시간<small>언제든 질문을 받아준다</small></div>
        <div data-s="2" style="transition-delay:.25s">1 : 1<small>한 명 한 명의 속도에 맞춰</small></div>
        <div data-s="2" style="transition-delay:.5s">연구자급 사고력<small>나비에-스토크스 난제에 도전하는 수준</small></div>
      </div>
    </div>
    <div class="q fx-blur" data-s="3">
      <em class="ai">LLM 튜터</em>는 <em class="human">영재</em>의<br>심화학습 요구를 채울 수 있을까?
    </div>
    <div class="raise fx-fade" data-s="3" style="transition-delay:.8s">채울 수 있을 것 같다면, 손을 들어 주세요 <span class="cnt hands-n" data-hands-show>–</span></div>
    <div class="src">한국교육개발원 GED 영재교육 통계 · 이투데이 2026.7.31 (2016·2025 대상자 108,253명 → 63,176명)</div>
  `,
  step(k, prev, ctx) {
    // 점 1,000개 = 학생 1,000명. 2016년엔 18명(1.84%), 2025년엔 13명(1.26%)만 영재교육을 받는다.
    const cv = ctx.$('.dots'), c = cv.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const hu = css.getPropertyValue('--human').trim(), fa = css.getPropertyValue('--line').trim(), mu = css.getPropertyValue('--muted').trim();
    let seed = 11;
    const order = [];
    while (order.length < 18) { seed = (seed * 16807) % 2147483647; const i = seed % 1000; if (!order.includes(i)) order.push(i); }
    const draw = (lit, lost) => { // lit: 켜진 점 수, lost: 꺼지는 중인 점의 진행도(0~1)
      c.clearRect(0, 0, 720, 300);
      for (let i = 0; i < 1000; i++) {
        const x = (i % 50) * 14.4 + 6, y = Math.floor(i / 50) * 14.4 + 6;
        const r = order.indexOf(i);
        c.beginPath();
        if (r >= 0 && r < 13 && lit) { c.arc(x, y, 5.5, 0, Math.PI * 2); c.fillStyle = hu; c.fill(); }
        else if (r >= 13 && lit) {
          // 2016년엔 있었지만 2025년엔 사라진 자리: 채움 → 빈 고리
          c.arc(x, y, 5.5, 0, Math.PI * 2);
          c.globalAlpha = 1 - lost; c.fillStyle = hu; c.fill(); c.globalAlpha = 1;
          if (lost > 0) { c.lineWidth = 1.5; c.strokeStyle = mu; c.globalAlpha = lost; c.stroke(); c.globalAlpha = 1; }
        } else { c.arc(x, y, 3, 0, Math.PI * 2); c.fillStyle = fa; c.fill(); }
      }
    };
    const cap = ctx.$('.dots-cap');
    // 애니메이션은 k=1에 처음 들어올 때만. 이후 단계(튜터·질문)에서는 최종 상태를 유지한다.
    const settled = ctx.instant || (k >= 1 && prev != null && prev >= 1);
    cap.classList.toggle('late', k >= 1 && settled);
    draw(false, 0);
    if (k >= 1) {
      if (settled) draw(true, 1);
      else {
        const t = ctx.token();
        setTimeout(() => {
          if (!ctx.live(t)) return;
          draw(true, 0);
          const t0 = performance.now() + 1400;
          const tick = (now) => {
            if (!ctx.live(t)) return;
            const f = Math.max(0, Math.min(1, (now - t0) / 900));
            draw(true, f);
            if (f > 0) cap.classList.add('late');
            if (f < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }, 700);
      }
    }
  },
  onKey(key) {
    if (key === '+' || key === '=') { PPT.setHands((PPT.state.hands || 0) + 1); return true; }
    if (key === '-' || key === '_') { PPT.setHands(Math.max(0, (PPT.state.hands || 0) - 1)); return true; }
  },
});

/* 11. 결과 2: 학생은 AI를 어떻게 썼나 — 말풍선이 쏟아져 세 줄로 분류된다(말풍선 막대그래프),
   이어서 학생 11명의 산점도, 마지막엔 '짧게' 상자를 넘쳐흐르는 AI 답변 */
(function () {
  const D = PPT.DATA.paper;
  const counts = [11, 23, 6]; // 40개 말풍선을 27% · 58% · 15% 비율로
  const ROWY = [352, 552, 752], X0 = 700, DX = 40;
  const types = [];
  counts.forEach((n, t) => { for (let i = 0; i < n; i++) types.push({ t, i }); });
  let seed = 21;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const scatterPos = types.map(() => ({ x: 720 + rnd() * 1000, y: 300 + rnd() * 560, r: (rnd() - 0.5) * 40 }));
  const order = types.map((_, i) => i).sort(() => rnd() - 0.5);

  // 산점도 (그림 3 근삿값)
  const SX = (v) => 240 + (v / 100) * 840, SY = (v) => 880 - (v - 5) * 157;
  const sAxis =
    [0, 20, 40, 60, 80, 100].map((v) => `<line x1="${SX(v)}" x2="${SX(v)}" y1="${SY(5)}" y2="${SY(5) + 10}"/><text x="${SX(v)}" y="${SY(5) + 40}" text-anchor="middle">${v}</text>`).join('') +
    [5, 6, 7, 8].map((v) => `<line x1="${SX(0) - 10}" x2="${SX(100)}" y1="${SY(v)}" y2="${SY(v)}"/><text x="${SX(0) - 22}" y="${SY(v) + 8}" text-anchor="end">${v}</text>`).join('');
  const sDots = D.scatter.map(([c, s]) => `<circle class="${c === 0 ? 'zero' : ''}" cx="${SX(c)}" cy="${SY(s)}" r="0" data-r="${c === 0 || c === 94 ? 16 : 12}"/>`).join('');

  const longAnswer = Array.from({ length: 9 }, (_, i) =>
    `<b>기준 ${i * 3 + 1}</b> 환자 정보 — 충족했습니다. <b>기준 ${i * 3 + 2}</b> 증상 설명 — 대체로 충족했지만 … <b>기준 ${i * 3 + 3}</b> 검사 — (수업 범위 밖의 검사까지 언급) … 정리하면, 앞에서 말한 각 기준을 다시 문단으로 반복하면 …`).join(' ');

  PPT.register({
    n: 11, part: 3, steps: 5, printStep: 2,
    pos: { x: 7200, y: 2400, z: -1200, ry: -22 },
    html: `
      <div class="kicker">결과 2 <b>학생은 AI를 어떻게 썼나</b></div>
      <div class="h2">채팅 기록을 열어 보니</div>
      <div class="big0" data-s="0" data-out="1">채팅 기록<br><span class="ai">전수 분석</span></div>
      <div class="rain">
        ${types.map(({ t }) => `<div class="bb t${t}"></div>`).join('')}
      </div>
      <div class="rows" data-out="3">
        <div class="rowlab row0" data-s="1"><div class="nm">의도대로: 내 답 검토받기</div><div class="ex">“환자 5는 백혈병 같아요. 빠뜨린 게 있나요?”</div></div>
        <div class="rowlab row1" data-s="1" style="transition-delay:.15s"><div class="nm">배경지식 요청</div><div class="ex">“진성 적혈구증가증의 증상은?”</div></div>
        <div class="rowlab row2" data-s="1" style="transition-delay:.3s"><div class="nm">정답 요청</div><div class="ex">“진단명이 뭐예요?”</div></div>
        <div class="pct" data-s="1" style="left:${X0 + counts[0] * DX + 24}px;top:${ROWY[0] - 44}px;transition-delay:1.1s">${D.behavior.intended}%</div>
        <div class="pct ai" data-s="1" style="left:${X0 + counts[1] * DX + 24}px;top:${ROWY[1] - 44}px;transition-delay:1.2s">${D.behavior.background}%</div>
        <div class="pct human" data-s="1" style="left:${X0 + counts[2] * DX + 24}px;top:${ROWY[2] - 44}px;transition-delay:1.3s">${D.behavior.solution}%</div>
        <div class="callout ai" data-s="1" style="transition-delay:1.6s">가장 많음 → AI 튜터를 <b>검색기처럼</b></div>
        <div class="callout hu" data-s="2">가장 적음 — 베끼려 한 건 아니다</div>
        <div class="concl" data-s="2" style="transition-delay:.4s">다만, AI를 <b>‘생각을 단련하는 도구’</b>로 쓰는 법은 몰랐다</div>
        <div class="src r" data-s="1">그림 2 · 전체 활동 기준 · 말풍선 40개로 비율 표현</div>
      </div>
      <div class="sc-wrap" data-s="3">
        <svg class="scatter" width="1920" height="1080">
          <g class="ax">${sAxis}</g>
          <text class="axt" x="${SX(50)}" y="${SY(5) + 84}" text-anchor="middle">학생별 AI 튜터와 대화한 횟수</text>
          <text class="axt" transform="translate(${SX(0) - 80} ${SY(6.75)}) rotate(-90)" text-anchor="middle">최종평가 점수</text>
          ${sDots}
          <text class="pl ai" x="${SX(94) - 20}" y="${SY(8.1) - 30}" text-anchor="end" fill="var(--ai)">94회</text>
          <text class="pl" x="${SX(0) + 30}" y="${SY(7.6) + 10}" fill="var(--human)">0회 · 상위권</text>
        </svg>
        <div class="facts">
          <div class="fact panel"><div class="v">0 – 94회</div><div class="l">학생별 대화 횟수 (평균 27.8)</div></div>
          <div class="fact panel"><div class="v ai">r = .80</div><div class="l">면역학 단원만 — 다른 단원은 뚜렷한 관계 없음</div></div>
          <div class="fact panel"><div class="v human">흥미 때문?</div><div class="l">많이 쓴 건 강좌에 대한 흥미 때문일 수도 (저자 해석)</div></div>
        </div>
        <div class="src">그림 3 · 점 위치는 그림에서 읽은 근삿값</div>
      </div>
      <div class="final" data-s="4">학생도, AI도<br><span class="ai">설계대로</span> 움직이지<br>않았다.</div>
      <div class="box" data-s="4" style="transition-delay:.8s">
        <div class="bh">prompt: “짧게 답하라”</div>
        <span class="tag" style="position:absolute;right:22px;top:-16px;background:var(--bg)">답변 모양 재구성</span>
        <div class="over"></div>
      </div>
      <div class="oos" data-s="4" style="transition-delay:1.4s"><span class="chip human">사례 작성 단원: 답변이 길어지고, 수업 범위 밖 검사까지 언급</span></div>
    `,
    step(k, prev, ctx) {
      const bbs = ctx.$$('.bb');
      const instant = ctx.instant;
      bbs.forEach((b, i) => {
        const { t, i: j } = types[i];
        let x, y, r = 0, op = 1;
        if (k === 0) { ({ x, y, r } = scatterPos[i]); }
        else { x = X0 + j * DX; y = ROWY[t] - 15; }
        if (k >= 3) op = 0;
        b.style.transition = instant ? 'none' : '';
        b.style.transitionDelay = instant ? '0ms' : (k === 1 ? order.indexOf(i) * 18 : 0) + 'ms';
        b.style.left = x + 'px';
        b.style.top = y + 'px';
        b.style.transform = `rotate(${r}deg)`;
        b.style.opacity = op;
      });
      if (k === 0 && !instant) {
        // 위에서 쏟아져 내리는 등장
        bbs.forEach((b, i) => {
          b.animate([{ transform: `translateY(-${700 + Math.random() * 300}px)`, opacity: 0 }, { transform: `rotate(${scatterPos[i].r}deg)`, opacity: 1 }],
            { duration: 900 + Math.random() * 500, delay: order.indexOf(i) * 35, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'backwards' });
        });
      }
      // 산점도 점
      ctx.$$('.scatter circle').forEach((c, i) => {
        c.style.transitionDelay = instant ? '0ms' : 300 + i * 70 + 'ms';
        c.setAttribute('r', k >= 3 ? c.dataset.r : 0);
      });
      // 넘쳐흐르는 답변
      const over = ctx.$('.over');
      if (k >= 4) {
        if (instant) over.innerHTML = longAnswer;
        else {
          over.innerHTML = '';
          const words = longAnswer.split(' ');
          let n = 0; const tok = ctx.token();
          const tick = () => {
            if (!ctx.live(tok)) { over.innerHTML = longAnswer; return; }
            n += 2; over.innerHTML = words.slice(0, n).join(' ');
            if (n < words.length) setTimeout(tick, 40);
          };
          setTimeout(tick, 1300);
        }
      } else over.innerHTML = '';
    },
  });
})();

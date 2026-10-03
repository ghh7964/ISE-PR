/* 14. 마무리 — 카메라가 슬라이드 6의 자리로 돌아와 같은 질문에 답한다.
   표지의 유체가 다시 나타나지만, 이번엔 설계(물길)를 따라 흐른다 */
(function () {
  const channels = [
    { d: 'M -60 660 C 500 660, 850 680, 1150 740 S 1450 800, 1580 800', width: 64, force: 420, label: '① AI 사용법 수업', ly: 660 },
    { d: 'M -60 790 C 500 790, 850 790, 1150 795 S 1450 800, 1580 800', width: 64, force: 420, label: '② 좁고 분명한 튜터 역할', ly: 790 },
    { d: 'M -60 920 C 500 920, 850 900, 1150 850 S 1450 800, 1580 800', width: 64, force: 420, label: '③ 과정을 데이터로', ly: 920 },
  ];
  channels[0].pool = [1640, 800, 86];
  const POOL = [1640, 800];

  PPT.register({
    n: 14, part: 4, steps: 4, samePlaceAs: 6,
    pos: { x: 0, y: -7700, z: 0 },
    transition: { dur: 3200, dolly: 5200, easing: 'cubic-bezier(.7,0,.25,1)' },
    fluid: (k) =>
      k === 0 ? { mode: 'chaos', opacity: 0.5, rate: 0.8 }
        : { mode: 'channel', opacity: k === 3 ? 0 : 1, channels, pool: POOL },
    html: `
      <div class="kicker">마무리 <b>다시, 처음 질문</b></div>
      <div class="q"><em class="ai">LLM 튜터</em>는 <em class="human">영재</em>의<br>심화학습 요구를 채울 수 있을까?</div>
      <div class="ans fx-blur" data-s="1"><span class="ans-t"></span></div>
      <svg class="chan" width="1920" height="1080" data-s="1" style="transition-delay:.6s">
        <defs>
          <mask id="chan-mask" maskUnits="userSpaceOnUse" x="-100" y="0" width="2100" height="1080">
            <rect x="-100" y="0" width="2100" height="1080" fill="#fff"/>
            ${channels.map((c) => `<path d="${c.d}" stroke="#000" stroke-width="${c.width - 4}" fill="none" stroke-linecap="round"/>`).join('')}
            <circle cx="${POOL[0]}" cy="${POOL[1]}" r="82" fill="#000"/>
          </mask>
        </defs>
        <g mask="url(#chan-mask)">
          ${channels.map((c) => `<path d="${c.d}" stroke="var(--line-strong)" stroke-width="${c.width + 2}" fill="none" stroke-linecap="round"/>`).join('')}
          <circle cx="${POOL[0]}" cy="${POOL[1]}" r="88" fill="none" stroke="var(--human)" stroke-width="6"/>
        </g>
        ${channels.map((c) => `<text x="150" y="${c.ly - 48}">${c.label}</text>`).join('')}
        <text class="pl" x="${POOL[0]}" y="${POOL[1] + 140}" text-anchor="middle">생각하는 학생</text>
      </svg>
      <div class="stmt" data-s="2">
        AI가 아무리 똑똑해도,<br>그것을 <span class="ai">생각의 도구</span>로 쓰게 만드는 건<br><b>교사의 설계</b>다.
      </div>
      <div class="closing" data-s="3">
        <div class="shift">AI를 <span class="not">정답 자판기</span>가 아니라 <b>생각을 단련하는 도구</b>로</div>
        <div class="thanks"><b>감사합니다</b><span>${PPT.DATA.presenter.dept} ${PPT.DATA.presenter.name}</span></div>
      </div>
    `,
    step(k, prev, ctx) {
      const t = ctx.$('.ans-t');
      const text = '저절로는 아니다.';
      if (k === 1 && !ctx.instant) { t.textContent = ''; const tok = ctx.token(); setTimeout(() => ctx.live(tok) && PPT.util.type(t, text, { ctx, speed: 120 }), 500); }
      else t.textContent = k >= 1 ? text : '';
    },
  });
})();

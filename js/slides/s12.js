/* 12. 비판적 평가 — 결과 그래프의 유리판에 한계 하나당 균열 하나. D 키: 숨은 레이어(표준편차 불일치) */
(function () {
  const cracks = [
    'M615 300 L700 380 L690 430 L780 470 L820 560 M700 380 L760 360 L800 292 M780 470 L740 540',
    'M1305 320 L1220 390 L1240 450 L1150 500 L1110 590 M1220 390 L1180 330 M1150 500 L1200 560',
    'M620 860 L700 780 L680 720 L790 680 L840 600 M700 780 L760 820 M790 680 L740 640',
    'M1300 860 L1230 790 L1250 720 L1140 680 L1090 600 M1230 790 L1170 830 M1140 680 L1200 640',
  ];
  PPT.register({
    n: 12, part: 4, steps: 6, printStep: 4,
    pos: { x: 9600, y: 1900, z: -700, ry: -34 },
    html: `
      <div class="kicker">논의 <b>비판적 평가</b></div>
      <div class="h2">그대로 믿기엔</div>
      <div class="glass panel">
        <div class="gb a"><span class="ai">6.94</span></div>
        <div class="gb b"><span>6.93</span></div>
        <div class="cap">“효과 없음”?</div>
      </div>
      <svg class="cracks" width="1920" height="1080">${cracks.map((d, i) => `<path class="c${i + 1}" d="${d}"/>`).join('')}</svg>
      <div class="lim l1 panel" data-s="1">
        <div class="n">한계 1</div><h4>표본 크기</h4>
        <p>반별 <b>11명</b>. 두 반 점수 차가 표준편차의 절반(d = 0.5)쯤이어도, 이를 잡아내려면 반별 <b class="human">105명</b> 필요 (저자 계산)</p>
        <div class="mini">${Array.from({ length: 105 }, (_, i) => `<i class="${i < 11 ? 'real' : 'need'}"></i>`).join('')}</div>
      </div>
      <div class="lim l2 panel" data-s="2">
        <div class="n">한계 2</div><h4>집단 구성</h4>
        <p>학생이 반을 <b>스스로 선택</b> — 두 반의 학년이 달랐다</p>
        <div class="grades">
          ${[['AI 반', [7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8]], ['일반 반', [7, 7, 7, 8, 8, 8, 9, 9, 9, 9, 10]]].map(([nm, gs]) =>
            `<div><span class="gn">${nm}</span>${gs.map((g) => `<i class="${g >= 9 ? 'up' : ''}">${g}</i>`).join('')}</div>`).join('')}
        </div>
        <p class="gnote">칸 하나 = 학생 1명 · 숫자는 학년<br>평균 나이 12.9세 vs 14.0세 · 여학생 82% vs 55%</p>
      </div>
      <div class="lim l3 panel" data-s="3">
        <div class="n">한계 3</div><h4>측정</h4>
        <p><b>사전검사 없음</b> — 출발선이 같았는지 모른다</p>
        <div class="startline"><i></i><b>?</b></div>
        <p>영재라 이미 점수가 높아 차이가 드러나기 어려웠을 수도</p>
      </div>
      <div class="lim l4 panel" data-s="4">
        <div class="n">한계 4</div><h4>기간 · 운영</h4>
        <p><b>3주</b>의 짧은 강좌</p>
        <p>강사는 생성형 AI 경험 없이 <b>자기주도 연수</b>만</p>
        <p class="muted" style="font-size:20px">AI 사용에 대한 학생 흥미·인식 자료도 없음</p>
      </div>
      <div class="verdict" data-s="5">
        <div class="no">‘LLM은 효과가 없다’는 증거가 아니라</div>
        <div class="yes"><span class="ai">‘넣기만 해서는</span> 효과가 보장되지 않는다’는<br>신호다</div>
      </div>
      <div class="hidden-layer panel">
        <div class="k">각주 · 꼼꼼히 읽으면</div>
        <h4>표준편차가 두 개?</h4>
        <table>
          <tr><td>본문: 총 상호작용 SD</td><td class="x">22.00</td></tr>
          <tr><td>표 6: 총 상호작용 SD</td><td>26.20</td></tr>
          <tr><td>표 6: 중앙값</td><td class="x">22.00</td></tr>
        </table>
        <p>본문의 22.00은 중앙값을 잘못 옮긴 것으로 보인다.</p>
      </div>
      <div class="src r" data-s="1">Thompson et al. (2025) 표 1 · 표 6 · 논의</div>
    `,
    init(ctx) { ctx.$$('.cracks path').forEach((p) => PPT.util.hidePath(p)); },
    step(k, prev, ctx) {
      const U = PPT.util;
      ctx.$$('.cracks path').forEach((p, i) => {
        if (k >= i + 1) U.drawPath(p, { dur: 500, ctx: k === i + 1 ? ctx : { instant: true } });
        else U.hidePath(p);
      });
      // 필요한 105명이 하나씩 채워진다
      const need = ctx.$$('.mini i.need');
      need.forEach((d, i) => {
        d.style.transitionDelay = k === 1 && !ctx.instant ? 600 + i * 14 + 'ms' : '0ms';
        d.classList.toggle('on', k >= 1);
      });
      if (k < 1) ctx.$('.hidden-layer').classList.remove('open');
    },
    onKey(key, ctx) {
      if (key === 'd' || key === 'D') { ctx.$('.hidden-layer').classList.toggle('open'); return true; }
    },
    leave(ctx) { ctx.$('.hidden-layer').classList.remove('open'); },
  });
})();

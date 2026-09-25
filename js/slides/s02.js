/* 2. 주제 선정 이유 — 터미널 자기소개, 그리고 '영재'와 'LLM'의 충돌 */
PPT.register({
  n: 2, part: 1, steps: 3,
  pos: { x: 700, y: -1500, z: -900, ry: -8 },
  fluid: (k) => ({ mode: 'chaos', opacity: 0.22, rate: 0.5 }),
  html: `
    <div class="kicker">들어가며 <b>주제 선정 이유</b></div>
    <div class="term panel">
      <div class="bar"><i></i><i></i><i></i><span>~/me — zsh</span></div>
      <div class="body">
        <div><span class="p">$</span> whoami</div>
        <div class="out o1"></div>
        <div data-s="1" class="fx-fade"><span class="p">$</span> cat dream.txt</div>
        <div class="out hl o2"></div>
      </div>
    </div>
    <div class="collide">
      <div class="w g">영재</div>
      <div class="w x">×</div>
      <div class="w l">LLM</div>
    </div>
    <div class="theme" data-s="2" style="transition-delay:.9s">LLM을 활용한 영재교육</div>
    <div class="next-hint" data-s="2" style="transition-delay:1.3s">먼저, 요즘 AI는 어디까지 왔을까?</div>
  `,
  step(k, prev, ctx) {
    const o1 = ctx.$('.o1'), o2 = ctx.$('.o2');
    if (k === 0) { o2.textContent = ''; PPT.util.type(o1, '컴퓨터공학 전공', { ctx, speed: 70 }); }
    if (k >= 1) {
      o1.textContent = '컴퓨터공학 전공';
      if (k === 1) PPT.util.type(o2, '과학고 · 영재학교 정보 교사', { ctx, speed: 60 });
      else o2.textContent = '과학고 · 영재학교 정보 교사';
    }
  },
});

/* 9. AI 튜터 'Dr. Smith' — 소크라테스식 대화 + 시스템 프롬프트를 고친 과정을 git diff로.
   마지막에 '기대' 유령 막대를 세운다(슬라이드 10에서 부서진다) */
PPT.register({
  n: 9, part: 2, steps: 5, printStep: 3,
  pos: { x: 4800, y: -9400, z: -1500, rx: 90 },
  html: `
    <div class="kicker">논문 <b>AI 튜터 설계</b></div>
    <div class="h2">AI 튜터 ‘Dr. Smith’</div>
    <div class="tags">
      <span class="chip ai">GPT-4o</span>
      <span class="chip">개인정보가 나가지 않는 폐쇄형 환경</span>
      <span class="chip">온라인 강의실 안에 내장</span>
    </div>
    <div class="win chat panel">
      <div class="hd"><span class="av"></span>Dr. Smith · 의학 강좌 튜터<span class="st">● online</span></div>
      <div class="msgs">
        <div class="m me" data-s="1">환자 1은 철결핍성 빈혈인가요?</div>
        <div class="dots3" style="display:none"><i></i><i></i><i></i></div>
        <div class="m bot" data-s="1" style="transition-delay:1.1s"><span class="bot-t"></span></div>
      </div>
      <div class="socratic chip ai" data-s="1">정답 대신 되묻기 · 소크라테스식</div>
      <div class="foot" data-s="1">논문 표 3 · 요약 번역</div>
    </div>
    <div class="win code panel" data-s="2">
      <div class="hd"><span class="mono" style="color:var(--ink)">system_prompt.md</span><span class="tag" style="margin-left:auto">재구성 · 원문은 논문 부록</span></div>
      <div class="pre"><div class="ln cm"><span class="g">1</span><span class="c"># 역할: 의학 강좌 튜터 Dr. Smith</span></div><div class="ln"><span class="g">2</span><span class="c">진단이 맞는지 바로 말하지 않는다</span></div><div class="ln"><span class="g">3</span><span class="c">무엇을 근거로 판단했는지 되묻는다</span></div><div class="ln d1"><span class="g">4</span><span class="c">정답지: 환자1 = ██████ …</span><span class="ann ann-r" data-s="3" style="position:static;margin-left:auto">답을 흘림 → 삭제</span></div><div class="ln d2"><span class="g">5</span><span class="c">자세히 설명한다</span></div><div class="ln a1 pending"><span class="g">5</span><span class="c">짧고 간결하게 답한다</span><span class="ann ann-g" style="position:static;margin-left:auto">길면 지루해함</span></div><div class="ln a2 pending"><span class="g">6</span><span class="c">수업에서 배운 범위 안에서만</span></div><div class="ln cm"><span class="g">7</span><span class="c"># 예시 대화 ← 강사의 학생 역할극</span></div><div class="ln"><span class="g">8</span><span class="c">학생: “환자 1은 …”  튜터: “어떤 증상이 …”</span></div></div>
    </div>
    <div class="ann ann-n abs" data-s="2" data-out="3" style="left:1220px;top:960px">강사가 학생 역할극 → AI 답을 보고 프롬프트 수정</div>
    <div class="pre-edu" data-s="3"><span class="chip human">학생 사전교육 · AI 사용법과 윤리 영상 4편</span></div>
    <div class="expect fx-blur" data-s="4">여기까지 들으면,<br><span class="ai">효과가 있을 것</span><br>같지 않나요?</div>
    <div class="ghosts">
      <div class="gbar a"><em>기대</em><span>AI 반</span></div>
      <div class="gbar b"><span>일반 반</span></div>
    </div>
  `,
  step(k, prev, ctx) {
    const bot = ctx.$('.bot-t');
    const text = '철결핍성 빈혈이라고 판단한 증상은 무엇인가요? 사례 목록에 비슷한 증상을 보이는 다른 질환은 없을까요?';
    const dots = ctx.$('.dots3');
    dots.style.display = 'none';
    if (k === 1 && !ctx.instant) {
      const t = ctx.token();
      bot.textContent = '';
      setTimeout(() => { if (ctx.live(t)) dots.style.display = 'flex'; }, 450);
      setTimeout(() => { dots.style.display = 'none'; if (ctx.live(t)) PPT.util.type(bot, text, { ctx, speed: 38 }); }, 1150);
    }
    else bot.textContent = k >= 1 ? text : '';
    const d = k >= 3;
    ctx.$('.ln.d1').classList.toggle('del', d);
    ctx.$('.ln.d2').classList.toggle('del', d);
    ctx.$('.ln.a1').classList.toggle('pending', !d);
    ctx.$('.ln.a2').classList.toggle('pending', !d);
    ctx.$('.ln.a1').classList.toggle('add', d);
    ctx.$('.ln.a2').classList.toggle('add', d);
  },
});

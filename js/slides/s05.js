/* 5. 이슈 2: 교육으로 들어온 LLM 튜터 — 두 사례 카드, 그리고 '아직 모른다' 도장 */
PPT.register({
  n: 5, part: 1, steps: 3, printStep: 1,
  pos: { x: 0, y: -6200, z: -600 },
  html: `
    <div class="kicker">이슈 2 <b>교육으로 들어온 LLM 튜터</b></div>
    <div class="h2">똑똑해진 LLM, 교실로 들어오다</div>
    <div class="cards">
      <div class="card a" data-s="0">
        <div class="org">Harvard · CS50</div>
        <h3>CS50 오리</h3>
        <div class="desc">코드를 대신 써 주지 않고,<br>스스로 답에 도달하도록 이끄는 <b class="ai">24시간 AI 조교</b></div>
        <div class="chat">
          <div class="msg me"><span>학생</span>제 코드 왜 안 돼요? 그냥 고쳐 주세요.</div>
          <div class="msg bot"><span>오리</span>어느 줄부터 예상과 다르게 동작하나요? 같이 찾아봐요.</div>
        </div>
        <div class="note">대화는 연출 예시</div>
      </div>
      <div class="card b" data-s="1">
        <div class="org">부산광역시교육청</div>
        <h3>BeAT, 그리고 펜즈</h3>
        <div class="tl">
          <div class="it"><div class="d">2026.6</div><div class="t">생성형 AI 학습튜터 ‘BeAT’<br>부산 모든 고등학생에게 개방</div></div>
          <div class="it"><div class="d">2026.9</div><div class="t">통합 계정 ‘펜즈’ 개통<br>부산 초·중·고 학생 누구나 생성형 AI 무료 이용<small>챗GPT · 제미나이 · 코파일럿 등, 가입 신청 후</small></div></div>
        </div>
      </div>
    </div>
    <div class="stamp-wrap" data-s="2">
      <div class="stamp-q">그래서, 배움이 늘었을까?</div>
      <div class="stamp">아직 모른다.</div>
    </div>
    <div class="src">CS50 Docs (cs50.ai) · 아시아경제 2026.6.19 · 한국일보 2026.7.28 · 헤럴드경제 2026.8.31</div>
  `,
});

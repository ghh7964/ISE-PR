/* 13. 예비 정보교사로서의 적용안 — 다시 청사진 위. 설계 레이어 3장이 쌓이고, 하나씩 들어 올려 펼친다 */
PPT.planes = (PPT.planes || []).concat([{ x: 9600, y: 3800, z: 1100, w: 7000, h: 5200 }]);
PPT.register({
  n: 13, part: 4, steps: 4,
  pos: { x: 9600, y: 3800, z: 1100, rx: 90 },
  transition: { dur: 1800, dolly: 700 },
  html: `
    <div class="kicker">적용 <b>예비 정보교사로서의 적용안</b></div>
    <div class="h2">내가 설계한다면</div>
    <div class="sub">문제는 모델 성능이 아니라, <b>설계와 사용 방식</b></div>
    <div class="stack">
      <div class="layers">
        <div class="layer L1"><span class="n">①</span>사용법 수업</div>
        <div class="layer L2"><span class="n">②</span>역할 설계</div>
        <div class="layer L3"><span class="n">③</span>과정 데이터</div>
      </div>
    </div>

    <div class="pane panel" data-s="0" data-out="1">
      <h3>세 겹의 설계</h3>
      <div class="flow" style="flex-direction:column;align-items:stretch;gap:18px">
        <div class="node" style="text-align:left">① AI 사용법을 <span class="ai">수업으로</span> 가르친다</div>
        <div class="node" style="text-align:left">② 튜터의 역할을 <span class="ai">좁고 분명하게</span> 설계한다</div>
        <div class="node" style="text-align:left">③ 과정을 <span class="ai">데이터로</span> 본다</div>
      </div>
    </div>

    <div class="pane panel" data-s="1" data-out="2">
      <h3><span class="n">①</span>AI 사용법을 수업으로</h3>
      <div class="flow">
        <div class="node h">내 답과 근거를<br>먼저 쓴다</div><div class="arr">→</div>
        <div class="node a">AI에게<br>반론을 요청</div><div class="arr">→</div>
        <div class="node">다시<br>고친다</div>
      </div>
      <div class="contrast">
        <div class="was"><small>논문</small>영상 4편만 시청<br>→ 결국 검색기처럼 사용</div>
        <div class="will"><small class="ai">내 수업</small>사용 규칙을 <b>시범</b>으로 보여주고<br><b>연습</b>시킨다</div>
      </div>
    </div>

    <div class="pane panel" data-s="2" data-out="3">
      <h3><span class="n">②</span>역할을 좁힌 코드 리뷰 튜터</h3>
      <div class="code2">
        <pre><span class="k">def</span> <span class="f">search</span>(arr, target):
    lo, hi = 0, len(arr)
    <span class="k">while</span> lo &lt; hi:
        mid = (lo + hi) // 2
        <span class="k">if</span> arr[mid] &lt; target:
            <span class="bug">lo = mid</span>
        <span class="k">else</span>:
            hi = mid
    <span class="k">return</span> lo</pre>
        <div class="tb">
          <div class="m no">정답 코드는 제공하지 않아요.</div>
          <div class="m">이 반례에서도 멈출까요?<br><code>arr=[1, 3], target=3</code></div>
          <div class="m">시간복잡도는 얼마일까요?</div>
        </div>
      </div>
      <div class="rule"><span class="chip">기본 개념 질문엔 답하지 않도록 — 저자 제안</span></div>
    </div>

    <div class="pane panel" data-s="3">
      <span class="mock tag">구상 화면 · 가상 데이터</span>
      <h3><span class="n">③</span>과정을 데이터로</h3>
      <div class="dash">
        <div class="r hd"><span>학생</span><span>AI 사용 유형</span><span>교사 알림</span></div>
        <div class="r"><span>학생 A</span><span class="sb"><i style="flex:6"></i><i style="flex:3"></i><i style="flex:1"></i></span><span class="muted">—</span></div>
        <div class="r warn"><span>학생 B</span><span class="sb"><i style="flex:1"></i><i style="flex:9"></i><i style="flex:0"></i></span><span class="flag">검색형 → 개입</span></div>
        <div class="r"><span>학생 C</span><span class="sb"><i style="flex:4"></i><i style="flex:4"></i><i style="flex:2"></i></span><span class="muted">—</span></div>
        <div class="r warn"><span>학생 D</span><span class="sb"><i style="flex:0"></i><i style="flex:0"></i><i style="flex:0.001"></i></span><span class="flag">미사용 → 확인</span></div>
      </div>
      <div class="legend"><span><i style="background:var(--ink-2)"></i>내 답 검토</span><span><i style="background:var(--ai)"></i>배경지식</span><span><i style="background:var(--human)"></i>정답 요청</span></div>
      <div class="quote">AI는 교사를 대신하는 게 아니라,<br>교사가 <b>학생의 사고 과정을 더 깊이</b> 보게 하는 도구</div>
    </div>
  `,
  step(k, prev, ctx) {
    ctx.$$('.layer').forEach((l, i) => l.classList.toggle('cur', k === i + 1));
  },
});

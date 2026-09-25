/* 7. 논문 소개 — 카메라가 청사진 평면으로 고개를 숙이고, 논문이 날아와 설계도처럼 주석이 달린다 */
PPT.planes = (PPT.planes || []).concat([{ x: 2400, y: -9400, z: -1500, w: 10000, h: 6400 }]);
PPT.register({
  n: 7, part: 2, steps: 3,
  pos: { x: 0, y: -9400, z: -1500, rx: 90 },
  transition: { dur: 2000, dolly: 1100 },
  enter(ctx) { ctx.el.classList.add('seen'); }, // 논문이 한 번 날아와 앉으면 떠날 때도 그대로
  html: `
    <div class="paper-wrap">
      <div class="paper">
        <img src="assets/paper-p1.jpg" alt="Thompson et al. (2025) 논문 첫 페이지">
        <div class="hl h1" data-r="1"></div>
        <div class="hl h2" data-r="2"></div>
        <div class="hl h3" data-r="3"></div>
      </div>
    </div>
    <div class="right">
      <div class="k">논문 <b>Journal of Advanced Academics, 2025</b></div>
      <h2>같은 질문,<br><span class="ai">실제 실험</span>으로 답하다</h2>
      <div class="cite">Thompson, K. N., Chandler, K. L., Morgan, C., Khashabi, D., Delinski, E. A., &amp; Van Durme, B. (2025). <i>Artificial Intelligence as a Co-Tutor: Assessing the Impact in the Advanced Learning Virtual Classroom.</i> Journal of Advanced Academics, 36(4), 714–745.</div>
    </div>
    <div class="hyp panel" data-s="1" data-out="2">
      <div class="lab">저자들의 가설</div>
      <span class="same">= 우리의 질문</span>
      <div class="row"><span class="human">영재는 더 빠르고 깊은 학습이 필요</span><span class="plus">+</span></div>
      <div class="row"><span class="ai">LLM은 학생마다 맞춤 학습을 준다</span></div>
      <div class="res"><span class="muted">→</span> 영재에게 특히 도움이 될 것</div>
    </div>
    <div class="orgs" data-s="1" data-out="2">
      <span class="human">존스홉킨스대 영재센터 CTY</span><i>×</i><span class="ai">존스홉킨스대 컴퓨터과학과</span>
    </div>
    <div class="reasons" data-s="2">
      <div class="reason"><div class="n">1</div><div class="t">대상이 실제 영재 학생<small>22 students in 7th to 10th grades</small></div></div>
      <div class="reason"><div class="n">2</div><div class="t">문헌 정리가 아닌 실제 수업 실험<small>between-subjects quasi-experimental study</small></div></div>
      <div class="reason"><div class="n">3</div><div class="t">교사 × 컴퓨터과학자가 함께 설계<small>Center for Talented Youth + Dept. of Computer Science</small></div></div>
    </div>
    <svg class="leaders" width="1920" height="1080" data-s="2">
      <path d="M690 594 C 770 594, 790 580, 860 580" stroke="var(--human)"/>
      <path d="M690 576 C 770 600, 790 700, 860 724" stroke="var(--ai)"/>
      <path d="M690 812 C 770 812, 790 866, 860 868" stroke="var(--ink-2)"/>
    </svg>
  `,
  step(k, prev, ctx) {
    ctx.$$('.hl').forEach((h) => h.classList.toggle('on', k >= 2));
  },
});

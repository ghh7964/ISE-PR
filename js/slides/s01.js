/* 1. 표지 — 자유롭게 흐르는 유체(LLM의 힘) 위로 제목이 먹물처럼 번진다 */
PPT.register({
  n: 1, part: 0, steps: 1, cover: true,
  pos: { x: 0, y: 0, z: 0 },
  fluid: { mode: 'chaos', opacity: 1, burst: true, rate: 1.4 },
  html: `
    <div class="cover-kicker">${PPT.DATA.presenter.course} · 영재교육</div>
    <h1 class="title">
      <span class="ln" data-split>난제를 푸는 <em class="ai">LLM</em>,</span>
      <span class="ln" data-split><em class="human">영재</em>의 튜터가 될 수 있을까?</span>
    </h1>
    <div class="sub fade-late"><b>Thompson et al. (2025)</b> 리뷰</div>
    <div class="by fade-late">
      <span>${PPT.DATA.presenter.dept}</span>
      <span class="mono">${PPT.DATA.presenter.id}</span>
      <b>${PPT.DATA.presenter.name}</b>
    </div>
  `,
  init(ctx) {
    // 글자 단위로 쪼개 순서대로 번지게
    let i = 0;
    ctx.$$('[data-split]').forEach((ln) => {
      const walk = (node) => {
        Array.from(node.childNodes).forEach((c) => {
          if (c.nodeType === 3) {
            const frag = document.createDocumentFragment();
            for (const ch of c.textContent) {
              const s = document.createElement('span');
              s.className = 'ch';
              s.style.setProperty('--i', i++);
              s.textContent = ch === ' ' ? ' ' : ch;
              frag.appendChild(s);
            }
            node.replaceChild(frag, c);
          } else walk(c);
        });
      };
      walk(ln);
    });
  },
  enter(ctx) { ctx.el.classList.add('seen'); },
});

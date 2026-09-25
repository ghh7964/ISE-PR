/* 발표자 창: 대본, 타이머, 다음 화면 미리보기, 거수 입력 — 발표 창과 postMessage로 연결 */
(function () {
  const D = PPT.DATA;
  const main = window.opener;
  const $ = (id) => document.getElementById(id);
  const TOTAL = Object.keys(D.notes).length;
  const targets = Array.from({ length: TOTAL }, (_, i) => D.notes[i + 1].time);
  const cumEnd = targets.map((_, i) => targets.slice(0, i + 1).reduce((a, b) => a + b, 0));

  let st = null;
  let tStart = null, tSlide = null, lastN = null;

  const send = (m) => { if (main && !main.closed) main.postMessage(Object.assign({ type: 'cmd' }, m), '*'); };
  const mmss = (s) => { const a = Math.abs(Math.round(s)); return String(Math.floor(a / 60)).padStart(2, '0') + ':' + String(a % 60).padStart(2, '0'); };

  function render() {
    if (!st) return;
    const note = D.notes[st.n];
    $('n').textContent = String(st.n).padStart(2, '0');
    $('title').textContent = note.title;
    $('stepinfo').textContent = `단계 ${st.step + 1} / ${st.steps} · 목표 ${mmss(note.time)}`;
    $('script').innerHTML = note.steps.map((t, i) =>
      `<p class="${i === st.step ? 'cur' : i < st.step ? 'past' : ''}"><span class="sn">${i + 1}</span>${t}</p>`).join('');
    const cur = $('script').querySelector('.cur');
    if (cur) cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
    $('caution').style.display = note.caution ? '' : 'none';
    $('caution').textContent = note.caution ? '⚠ ' + note.caution : '';
    if (document.activeElement !== $('hands')) $('hands').value = st.hands == null ? '' : st.hands;

    // 다음 화면
    let nSlide = st.slide, nStep = st.step + 1;
    if (nStep >= st.steps) { nSlide = st.slide + 1; nStep = 0; }
    const pv = $('pv');
    if (nSlide >= TOTAL) { $('next-t').textContent = '— 마지막 화면입니다 —'; }
    else {
      const nn = D.notes[nSlide + 1];
      $('next-t').textContent = (nSlide !== st.slide ? `▶ ${nSlide + 1}. ${nn.title} — ` : '') + (nn.steps[nStep] || '').slice(0, 90) + '…';
      if (pv.contentWindow) pv.contentWindow.postMessage({ type: 'preview', slide: nSlide, step: nStep }, '*');
    }
  }

  function tick() {
    const now = Date.now();
    if (tStart) {
      const el = (now - tStart) / 1000;
      $('t-total').textContent = mmss(el);
      $('t-slide').textContent = mmss((now - tSlide) / 1000);
      if (st) {
        const note = D.notes[st.n];
        const slideEl = (now - tSlide) / 1000;
        $('t-slide').className = 'v ' + (slideEl > note.time ? 'late' : '');
        $('t-slide-l').textContent = `이 슬라이드 (목표 ${mmss(note.time)})`;
        const delta = el - cumEnd[st.n - 1];
        const d = $('t-delta');
        d.textContent = (delta > 0 ? '+' : '−') + mmss(delta);
        d.className = 'v ' + (delta > 0 ? 'late' : 'ok');
      }
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type !== 'state') return;
    st = m;
    if (lastN !== m.n) {
      tSlide = Date.now();
      if (!tStart) tStart = Date.now(); // 연결되면 바로 시작 — 발표 시작 때 T 키나 버튼으로 재시작
      lastN = m.n;
    }
    render();
  });

  $('b-next').onclick = () => send({ cmd: 'next' });
  $('b-prev').onclick = () => send({ cmd: 'prev' });
  $('b-black').onclick = () => send({ cmd: 'blackout' });
  $('b-timer').onclick = () => { tStart = Date.now(); tSlide = Date.now(); };
  $('hands').addEventListener('change', (e) => send({ cmd: 'hands', value: e.target.value === '' ? null : parseInt(e.target.value, 10) }));
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (['ArrowRight', ' ', 'PageDown', 'ArrowDown'].includes(e.key)) { e.preventDefault(); send({ cmd: 'next' }); }
    if (['ArrowLeft', 'PageUp', 'ArrowUp'].includes(e.key)) { e.preventDefault(); send({ cmd: 'prev' }); }
    if (e.key === 'b' || e.key === 'B' || e.key === '.') send({ cmd: 'blackout' });
    if (e.key === 't' || e.key === 'T') { tStart = Date.now(); tSlide = Date.now(); }
  });

  $('qa').innerHTML = D.qa.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('');
  $('pv').addEventListener('load', render);
  if (main) main.postMessage({ type: 'hello' }, '*');
  requestAnimationFrame(tick);
})();

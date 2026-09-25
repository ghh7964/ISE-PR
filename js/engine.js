/* 발표 엔진: 3D 카메라, 스텝 진행, 키보드, 개요, 발표자 창 연결 */
(function () {
  const PPT = (window.PPT = window.PPT || {});
  PPT.defs = PPT.defs || [];
  PPT.register = (def) => PPT.defs.push(def);

  const qs = new URLSearchParams(location.search);
  const MODE = qs.has('print') ? 'print' : qs.has('preview') ? 'preview' : 'show';
  PPT.mode = MODE;

  const PARTS = {
    0: '',
    1: '1 <b>이슈</b>',
    2: '2 <b>논문과 설계</b>',
    3: '3 <b>결과</b>',
    4: '4 <b>비판과 적용</b>',
  };

  let slides = [];
  let cur = -1;
  let cam = null;
  let camAnim = null;
  let presenter = null;
  let overview = false;
  let world, stage, hud;

  /* ---------------- storage (per-viewer convenience only) ---------------- */
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  PPT.state = { hands: null };
  const savedHands = store.get('ppt-hands');
  if (savedHands !== null && savedHands !== '') PPT.state.hands = +savedHands;

  /* ---------------- utilities shared by slides ---------------- */
  const U = (PPT.util = {});
  U.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  U.easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  U.fmt = (v, dec) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  /* 숫자 카운트업. ctx가 바뀌면(스텝 이동) 즉시 최종값 */
  U.countUp = (el, to, { from = 0, dur = 1400, dec = 0, ctx, ease = U.easeOut, suffix = '' } = {}) => {
    const t0 = performance.now();
    const token = ctx ? ctx.token() : 0;
    const set = (v) => { el.textContent = U.fmt(v, dec) + suffix; };
    if (!ctx || ctx.instant) { set(to); return Promise.resolve(); }
    return new Promise((res) => {
      const tick = (now) => {
        const t = U.clamp((now - t0) / dur, 0, 1);
        if (!ctx.live(token)) { set(to); return res(); }
        set(U.lerp(from, to, ease(t)));
        if (t < 1) requestAnimationFrame(tick); else res();
      };
      requestAnimationFrame(tick);
    });
  };

  /* 타이핑 효과 */
  U.type = (el, text, { speed = 42, ctx, caret = true } = {}) => {
    const token = ctx ? ctx.token() : 0;
    if (!ctx || ctx.instant) { el.textContent = text; return Promise.resolve(); }
    el.textContent = '';
    if (caret) el.classList.add('typing');
    return new Promise((res) => {
      let i = 0;
      const tick = () => {
        if (!ctx.live(token)) { el.textContent = text; el.classList.remove('typing'); return res(); }
        i++;
        el.textContent = text.slice(0, i);
        if (i < text.length) setTimeout(tick, speed * (0.6 + Math.random() * 0.8));
        else { el.classList.remove('typing'); res(); }
      };
      setTimeout(tick, speed);
    });
  };

  /* SVG path 그리기 */
  U.drawPath = (path, { dur = 1200, ctx, delay = 0 } = {}) => {
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    if (!ctx || ctx.instant) { path.style.transition = 'none'; path.style.strokeDashoffset = 0; return; }
    path.style.transition = 'none';
    path.style.strokeDashoffset = len;
    path.getBoundingClientRect();
    path.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(.65,0,.35,1) ${delay}ms`;
    path.style.strokeDashoffset = 0;
  };
  U.hidePath = (path) => {
    const len = path.getTotalLength();
    path.style.transition = 'none';
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
  };

  /* ---------------- camera ---------------- */
  const camTransform = (c) =>
    `translateZ(${c.dz || 0}px) scale3d(${c.s == null ? 1 : c.s}, ${c.s == null ? 1 : c.s}, ${c.s == null ? 1 : c.s}) rotateX(${c.orx || 0}deg) rotateY(${c.ory || 0}deg) ` +
    `rotateZ(${-(c.rz || 0)}deg) rotateY(${-(c.ry || 0)}deg) rotateX(${-(c.rx || 0)}deg) ` +
    `translate3d(${-c.x}px, ${-c.y}px, ${-(c.z || 0)}px)`;

  const slideTransform = (p) =>
    `translate3d(${p.x}px, ${p.y}px, ${p.z || 0}px) rotateX(${p.rx || 0}deg) rotateY(${p.ry || 0}deg) rotateZ(${p.rz || 0}deg)`;

  const lerpCam = (a, b, t) => {
    const o = {};
    for (const k of ['x', 'y', 'z', 'rx', 'ry', 'rz', 's', 'orx', 'ory', 'dz']) {
      const av = a[k] == null ? (k === 's' ? 1 : 0) : a[k];
      const bv = b[k] == null ? (k === 's' ? 1 : 0) : b[k];
      o[k] = U.lerp(av, bv, t);
    }
    return o;
  };

  function setCamera(target, { instant = false, dur = 1300, dolly = null, easing = 'cubic-bezier(.65,0,.35,1)' } = {}) {
    let fromTransform = null;
    if (camAnim) {
      fromTransform = getComputedStyle(world).transform;
      camAnim.cancel();
      camAnim = null;
      world.style.transform = fromTransform;
    }
    const start = cam || target;
    const full = Object.assign({ s: 1, orx: 0, ory: 0, dz: 0, rx: 0, ry: 0, rz: 0, z: 0 }, target);
    cam = full;
    if (instant || MODE !== 'show') { world.style.transform = camTransform(full); return Promise.resolve(); }
    const dist = Math.hypot(full.x - start.x, full.y - start.y, (full.z || 0) - (start.z || 0));
    const rot = Math.abs((full.rx || 0) - (start.rx || 0)) + Math.abs((full.ry || 0) - (start.ry || 0));
    const mid = lerpCam(start, full, 0.5);
    mid.dz = -(dolly != null ? dolly : Math.min(2600, dist * 0.32 + rot * 12));
    const frames = [
      { transform: fromTransform || camTransform(start) },
      { transform: camTransform(mid), offset: 0.5 },
      { transform: camTransform(full) },
    ];
    camAnim = world.animate(frames, { duration: dur, easing, fill: 'forwards' });
    return new Promise((res) => {
      const a = camAnim;
      a.onfinish = () => {
        world.style.transform = camTransform(full);
        a.cancel();
        if (camAnim === a) camAnim = null;
        res();
      };
      a.oncancel = () => res();
    });
  }

  /* ---------------- slide lifecycle ---------------- */
  function makeCtx(s) {
    return {
      el: s.el,
      def: s.def,
      instant: false,
      $: (sel) => s.el.querySelector(sel),
      $$: (sel) => Array.from(s.el.querySelectorAll(sel)),
      token: () => s.gen,
      live: (t) => t === s.gen && slides[cur] === s,
      wait: (ms) => U.wait(ms),
    };
  }

  function applyReveal(s, k, instant) {
    if (instant) s.el.classList.add('instant');
    s.el.dataset.step = k;
    s.el.querySelectorAll('[data-s]').forEach((e) => e.classList.toggle('on', k >= +e.dataset.s));
    s.el.querySelectorAll('[data-out]').forEach((e) => e.classList.toggle('gone', k >= +e.dataset.out));
    if (instant) { s.el.getBoundingClientRect(); requestAnimationFrame(() => s.el.classList.remove('instant')); }
  }

  function setStep(s, k, instant) {
    const prevK = s.step;
    s.step = k;
    s.gen++;
    const back = prevK != null && k < prevK;
    s.ctx.instant = !!instant || back;
    applyReveal(s, k, s.ctx.instant);
    if (s.def.step) s.def.step(k, prevK, s.ctx);
    applyFluid(s, k);
    updateHUD();
    broadcast();
  }

  function applyFluid(s, k) {
    if (!PPT.fluid || MODE !== 'show') return;
    let f = s.def.fluid;
    if (typeof f === 'function') f = f(k, s.ctx);
    PPT.fluid.set(f || { mode: 'off' });
  }

  async function go(i, k = 0, { instant = false, dir = 1 } = {}) {
    if (i < 0 || i >= slides.length) return;
    const s = slides[i];
    if (k === 'last') k = s.def.steps - 1;
    k = U.clamp(k, 0, s.def.steps - 1);

    if (i === cur) { setStep(s, k, instant); return; }

    const prev = slides[cur];
    slides.forEach((o) => o.el.classList.remove('leaving'));
    if (prev) {
      prev.gen++;
      if (prev.def.leave) prev.def.leave(prev.ctx);
      prev.el.classList.remove('active');
      // 불투명도가 1 아래로 내려가는 순간 브라우저가 자식의 3D를 평면으로 눌러 버린다(기울어진 카드가 정면으로 튐).
      // 그래서 카메라가 떠나는 동안은 불투명도 1을 유지하고, 도착한 뒤에 흐리게 한다.
      if (!instant && MODE === 'show') prev.el.classList.add('leaving');
    }
    cur = i;
    s.el.classList.add('active');
    slides.forEach((o) => {
      if (o.def.samePlaceAs) {
        const twin = slides.find((t) => t.def.n === o.def.samePlaceAs);
        if (twin) twin.el.classList.toggle('hidden-by', o === s);
        o.el.classList.toggle('hidden-by', twin === s);
      }
    });
    document.body.classList.toggle('cover', !!s.def.cover);
    document.body.dataset.part = s.def.part;

    const tr = Object.assign({}, s.def.transition || {});
    const forward = dir > 0 && prev && prev.def.n === s.def.n - 1;
    s.step = null;
    s.gen++;
    if (s.def.enter) s.def.enter(s.ctx);

    if (!instant && forward && tr.blackout && MODE === 'show') {
      const bo = document.getElementById('blackout');
      bo.classList.add('on');
      applyReveal(s, 0, true);
      await U.wait(tr.blackout);
      if (slides[cur] !== s) return;
      // 이전 슬라이드가 비치지 않도록, 카메라가 속도를 낸 뒤(revealAt ms)에 암전을 걷는다
      setTimeout(() => bo.classList.remove('on'), tr.revealAt || 0);
    }
    const camP = setCamera(s.def.pos, {
      instant,
      dur: forward ? tr.dur || 1300 : 1000,
      dolly: forward ? tr.dolly : null,
      easing: forward && tr.easing ? tr.easing : undefined,
    });
    if (tr.shake && forward && !instant) camP.then(() => { if (slides[cur] === s) shake(); });
    if (prev) camP.then(() => prev.el.classList.remove('leaving'));
    setStep(s, k, instant || dir < 0);
  }

  function shake() {
    stage.animate(
      [
        { transform: stage.style.transform },
        { transform: stage.style.transform + ' translate(0, 14px)' },
        { transform: stage.style.transform + ' translate(0, -6px)' },
        { transform: stage.style.transform + ' translate(0, 3px)' },
        { transform: stage.style.transform },
      ],
      { duration: 420, easing: 'ease-out' }
    );
  }

  function next() {
    if (overview) return;
    const s = slides[cur];
    if (s.step < s.def.steps - 1) setStep(s, s.step + 1, false);
    else if (cur < slides.length - 1) go(cur + 1, 0, { dir: 1 });
  }
  function prev() {
    if (overview) return;
    const s = slides[cur];
    if (s.step > 0) setStep(s, s.step - 1, true);
    else if (cur > 0) go(cur - 1, 'last', { dir: -1 });
  }
  PPT.go = go;
  PPT.next = next;
  PPT.prev = prev;
  PPT.current = () => ({ slide: cur, step: slides[cur] ? slides[cur].step : 0 });

  /* ---------------- overview ---------------- */
  function toggleOverview(force) {
    overview = force != null ? force : !overview;
    document.body.classList.toggle('overview', overview);
    if (overview) {
      const xs = slides.map((s) => s.def.pos.x), ys = slides.map((s) => s.def.pos.y), zs = slides.map((s) => s.def.pos.z || 0);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
      const w = Math.max(...xs) - Math.min(...xs) + 2600;
      const h = Math.max(...ys) - Math.min(...ys) + 2000;
      const s = Math.min(1920 / w, 1080 / h) * 0.85;
      setCamera({ x: cx, y: cy, z: cz, s, orx: -32, ory: -16 }, { dur: 1600, dolly: 600 });
      PPT.fluid && PPT.fluid.set({ mode: 'off' });
    } else {
      const s = slides[cur];
      setCamera(s.def.pos, { dur: 1400, dolly: 400 });
      applyFluid(s, s.step);
    }
  }

  /* ---------------- HUD ---------------- */
  function buildHUD() {
    hud.innerHTML =
      '<div class="part"></div><div class="num"></div><div class="bar">' +
      slides.map(() => '<i></i>').join('') + '</div>';
  }
  function updateHUD() {
    if (!hud || !hud.firstChild || cur < 0) return;
    const s = slides[cur];
    hud.querySelector('.part').innerHTML = PARTS[s.def.part] || '';
    hud.querySelector('.num').innerHTML = `<b>${String(s.def.n).padStart(2, '0')}</b> / ${slides.length}`;
    hud.querySelectorAll('.bar i').forEach((b, i) => {
      b.classList.toggle('done', i < cur);
      b.classList.toggle('cur', i === cur);
      if (i === cur) b.style.setProperty('--p', (s.step + 1) / s.def.steps);
    });
  }

  /* ---------------- hands (슬라이드 6 거수 → 슬라이드 10 회수) ---------------- */
  function setHands(n) {
    PPT.state.hands = n == null || isNaN(n) ? null : Math.max(0, Math.round(n));
    store.set('ppt-hands', PPT.state.hands == null ? '' : PPT.state.hands);
    document.querySelectorAll('.hands-n').forEach((e) => (e.textContent = PPT.state.hands == null ? '–' : PPT.state.hands));
    document.querySelectorAll('[data-hands-show]').forEach((e) => e.classList.toggle('has-hands', PPT.state.hands != null));
    updateHUD();
    broadcast();
  }
  PPT.setHands = setHands;

  function openHands() {
    const d = document.getElementById('hands-dialog');
    const inp = d.querySelector('input');
    d.classList.add('open');
    inp.value = PPT.state.hands == null ? '' : PPT.state.hands;
    inp.focus();
    inp.select();
  }

  /* ---------------- presenter window ---------------- */
  function broadcast() {
    if (MODE !== 'show' || cur < 0) return;
    const s = slides[cur];
    const msg = { type: 'state', slide: cur, n: s.def.n, step: s.step, steps: s.def.steps, hands: PPT.state.hands, total: slides.length };
    if (presenter && !presenter.closed) presenter.postMessage(msg, '*');
  }
  function openPresenter() {
    presenter = window.open('presenter.html', 'ppt-presenter', 'width=1320,height=860');
    setTimeout(broadcast, 800);
  }
  window.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type === 'hello') { presenter = e.source; broadcast(); }
    if (m.type === 'cmd') {
      if (m.cmd === 'next') next();
      if (m.cmd === 'prev') prev();
      if (m.cmd === 'goto') go(m.slide, m.step || 0, { dir: m.slide > cur ? 1 : -1 });
      if (m.cmd === 'hands') setHands(m.value);
      if (m.cmd === 'blackout') document.getElementById('blackout').classList.toggle('on');
    }
    if (m.type === 'preview' && MODE === 'preview') go(m.slide, m.step === 'last' ? 'last' : m.step, { instant: true });
  });

  /* ---------------- keyboard ---------------- */
  let jumpBuf = '';
  function onKey(e) {
    const dlg = document.getElementById('hands-dialog');
    if (dlg.classList.contains('open')) {
      if (e.key === 'Enter') { setHands(parseInt(dlg.querySelector('input').value, 10)); dlg.classList.remove('open'); }
      if (e.key === 'Escape') dlg.classList.remove('open');
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const jump = document.getElementById('jump');
    if (/^[0-9]$/.test(k)) { jumpBuf += k; jump.textContent = '→ ' + jumpBuf; jump.classList.add('open'); return; }
    if (k === 'Enter' && jumpBuf) {
      const n = parseInt(jumpBuf, 10) - 1;
      jumpBuf = ''; jump.classList.remove('open');
      if (overview) toggleOverview(false);
      go(n, 0, { dir: n > cur ? 1 : -1 });
      return;
    }
    if (jumpBuf && (k === 'Escape' || k === 'Backspace')) { jumpBuf = ''; jump.classList.remove('open'); return; }

    const s = slides[cur];
    if (s && s.def.onKey && s.def.onKey(k, s.ctx) === true) { e.preventDefault(); return; }

    switch (k) {
      case 'ArrowRight': case ' ': case 'PageDown': case 'ArrowDown':
        e.preventDefault();
        if (e.shiftKey && k === 'ArrowRight') { if (cur < slides.length - 1) go(cur + 1, 0, { dir: 1 }); }
        else next();
        break;
      case 'ArrowLeft': case 'PageUp': case 'ArrowUp':
        e.preventDefault();
        if (e.shiftKey && k === 'ArrowLeft') { if (cur > 0) go(cur - 1, 0, { dir: -1 }); }
        else prev();
        break;
      case 'Home': go(0, 0, { dir: -1 }); break;
      case 'End': go(slides.length - 1, 0, { dir: 1 }); break;
      case 'o': case 'O': case 'Escape':
        if (k === 'Escape' && !overview) { document.getElementById('help').classList.remove('open'); break; }
        toggleOverview(); break;
      case 'b': case 'B': case '.': document.getElementById('blackout').classList.toggle('on'); break;
      case 'f': case 'F': document.body.classList.toggle('lowfx'); PPT.fluid && PPT.fluid.setLow(document.body.classList.contains('lowfx')); break;
      case 'l': case 'L':
        document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'light' ? '' : 'light';
        PPT.fluid && PPT.fluid.setTheme(document.documentElement.dataset.theme === 'light');
        break;
      case 'h': case 'H': openHands(); e.preventDefault(); break;
      case 'p': case 'P': openPresenter(); break;
      case '?': document.getElementById('help').classList.toggle('open'); break;
    }
  }

  /* ---------------- layout ---------------- */
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transformOrigin = '50% 50%';
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    PPT.stageScale = s;
  }

  /* 무대 좌표(1920×1080)로 포인터 위치 변환 */
  PPT.toStage = (clientX, clientY) => {
    const r = stage.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * 1920, y: ((clientY - r.top) / r.height) * 1080 };
  };

  /* ---------------- decorations in the 3D world ---------------- */
  function addDeco() {
    const add = (cls, style, html = '') => {
      const d = document.createElement('div');
      d.className = 'deco ' + cls;
      Object.assign(d.style, style);
      d.innerHTML = html;
      world.appendChild(d);
      return d;
    };
    // Part 1 상승 구간의 고도계
    [-2500, 2500].forEach((x, i) => {
      add('ruler', {
        height: '9600px', left: x + 'px', top: '-8600px',
        transform: `translateZ(-900px) rotateY(${i ? -20 : 20}deg)`,
      });
    });
    // Part 2, Part 4 청사진 바닥
    (PPT.planes || []).forEach((p) => {
      add('grid-plane', {
        width: p.w + 'px', height: p.h + 'px', left: p.x - p.w / 2 + 'px', top: p.y - p.h / 2 + 'px',
        transform: `translate3d(0, ${p.drop || 30}px, ${p.z}px) rotateX(90deg)`,
      });
    });
    // 깊이감을 주는 먼지 입자
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 160; i++) {
      const sz = 2 + rnd() * 5;
      add('dust', {
        width: sz + 'px', height: sz + 'px',
        left: -3000 + rnd() * 16000 + 'px', top: -11000 + rnd() * 16000 + 'px',
        transform: `translateZ(${-4000 + rnd() * 5000}px)`,
        opacity: 0.12 + rnd() * 0.35,
      });
    }
  }

  /* ---------------- print ---------------- */
  // ?print        슬라이드마다 한 쪽 (내용이 가장 많이 보이는 단계, printStep)
  // ?print=steps  모든 단계를 한 쪽씩 — 단계마다 슬라이드를 새로 만들어 그 단계의 최종 상태로 둔다
  function bootPrint() {
    document.body.classList.add('print');
    const all = qs.get('print') === 'steps';
    const holder = document.getElementById('print-root');
    slides.forEach((orig, i) => {
      const ks = all ? Array.from({ length: orig.def.steps }, (_, k) => k)
        : [orig.def.printStep != null ? orig.def.printStep : orig.def.steps - 1];
      ks.forEach((k, j) => {
        const page = document.createElement('div');
        page.className = 'print-page';
        page.dataset.n = orig.def.n;
        holder.appendChild(page);
        let s = orig;
        if (j === 0) page.appendChild(s.el);
        else s = makeSlide(orig.def, page);
        if (all) {
          const tag = document.createElement('div');
          tag.className = 'print-tag';
          tag.innerHTML = `<b>${String(s.def.n).padStart(2, '0')}</b> · 단계 ${k + 1}/${s.def.steps}`;
          page.appendChild(tag);
        }
        s.el.classList.add('active');
        s.el.style.transform = 'none';
        cur = i;
        s.step = null;
        if (s.def.enter) s.def.enter(s.ctx);
        setStep(s, k, true);
        if (s.def.print) s.def.print(s.ctx);
      });
    });
    cur = -1;
    setHands(PPT.state.hands);
  }

  // 슬라이드 요소를 만들어 parent에 붙인 뒤 init (SVG 경로 길이 등은 문서에 붙어 있어야 잰다)
  function makeSlide(def, parent) {
    const el = document.createElement('section');
    el.className = 'slide s' + String(def.n).padStart(2, '0') + ' part-' + def.part;
    el.innerHTML = def.html;
    parent.appendChild(el);
    const s = { def, el, step: null, gen: 0 };
    s.ctx = makeCtx(s);
    if (def.init) def.init(s.ctx);
    return s;
  }

  /* ---------------- boot ---------------- */
  PPT.boot = function () {
    if (qs.get('theme') === 'light') document.documentElement.dataset.theme = 'light';
    stage = document.getElementById('stage');
    world = document.getElementById('world');
    hud = document.getElementById('hud');
    PPT.defs.sort((a, b) => a.n - b.n);
    slides = PPT.defs.map((def) => {
      const s = makeSlide(def, world);
      s.el.style.transform = slideTransform(def.pos);
      return s;
    });
    PPT.slides = slides;
    setHands(PPT.state.hands);

    if (MODE === 'print') { bootPrint(); return; }

    fit();
    addEventListener('resize', fit);
    buildHUD();
    addDeco();
    if (MODE === 'preview') {
      document.body.classList.add('preview');
      const n = parseInt(qs.get('preview'), 10) || 1;
      const st = qs.get('step');
      go(n - 1, st === 'last' ? 'last' : parseInt(st || '0', 10), { instant: true });
      return;
    }
    if (PPT.fluid) {
      PPT.fluid.init(document.getElementById('fluid'));
      PPT.fluid.setTheme(document.documentElement.dataset.theme === 'light');
    }
    document.addEventListener('keydown', onKey);
    world.addEventListener('click', (e) => {
      if (!overview) return;
      const sec = e.target.closest('.slide');
      if (!sec) return;
      const i = slides.findIndex((s) => s.el === sec);
      toggleOverview(false);
      go(i, 0, { dir: i > cur ? 1 : -1 });
    });
    // 마우스 커서 자동 숨김
    let idle;
    addEventListener('pointermove', () => {
      document.body.classList.remove('hide-cursor');
      clearTimeout(idle);
      idle = setTimeout(() => document.body.classList.add('hide-cursor'), 2200);
    });
    // ?s=슬라이드&k=단계 — 리허설 때 원하는 지점에서 시작
    const start = parseInt(qs.get('s') || '1', 10) - 1;
    const startStep = qs.get('k') === 'last' ? 'last' : parseInt(qs.get('k') || '0', 10);
    go(U.clamp(start, 0, slides.length - 1), startStep, { instant: true });
  };
})();

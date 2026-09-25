/* WebGL2 안정 유체(Stable Fluids) — 발표 전체의 은유: 유체 = LLM의 힘, 물길 = 교사의 설계
   모드: off | chaos(표지의 자유로운 흐름) | surge(슬라이드 3의 '폭발') | channel(슬라이드 14의 물길) */
(function () {
  const PPT = (window.PPT = window.PPT || {});
  const F = (PPT.fluid = {});

  let gl, canvas, ok = false;
  let simW, simH, dyeW, dyeH;
  let prog = {}, quad;
  let vel, dye, divg, curlT, pres, whiteMask, chanMask;
  let low = false, light = false;
  let state = { mode: 'off', opacity: 0 };
  let chanStart = 0; // 물길 모드 시작 시각 — 학생 쪽 호박색이 서서히 차오르게
  let active = false, offSince = 0;
  let last = 0, tAcc = 0;
  let channels = [];

  const CFG = () => ({
    sim: low ? 96 : 144,
    dye: low ? 480 : 900,
    pressureIt: low ? 12 : 22,
    curl: 24,
  });

  const VS = `#version 300 es
  precision highp float;
  in vec2 aPos;
  uniform vec2 texel;
  out vec2 vUv, vL, vR, vT, vB;
  void main(){
    vUv = aPos*.5+.5;
    vL = vUv - vec2(texel.x,0.); vR = vUv + vec2(texel.x,0.);
    vT = vUv + vec2(0.,texel.y); vB = vUv - vec2(0.,texel.y);
    gl_Position = vec4(aPos,0.,1.);
  }`;
  const HEAD = `#version 300 es
  precision highp float; precision highp sampler2D;
  in vec2 vUv, vL, vR, vT, vB; out vec4 o;
  `;
  const FS = {
    splat: `uniform sampler2D uT; uniform float aspect, radius; uniform vec3 color; uniform vec2 point;
      void main(){ vec2 p=vUv-point; p.x*=aspect; vec3 s=exp(-dot(p,p)/radius)*color; o=vec4(texture(uT,vUv).xyz+s,1.); }`,
    advect: `uniform sampler2D uVel, uSrc, uMask; uniform vec2 simTexel; uniform float dt, diss;
      void main(){ vec2 c=vUv-dt*texture(uVel,vUv).xy*simTexel; float m=texture(uMask,vUv).r;
        o = texture(uSrc,c)/(1.+diss*dt)*m; }`,
    divergence: `uniform sampler2D uVel;
      void main(){ float L=texture(uVel,vL).x, R=texture(uVel,vR).x, T=texture(uVel,vT).y, B=texture(uVel,vB).y;
        vec2 C=texture(uVel,vUv).xy; if(vL.x<0.)L=-C.x; if(vR.x>1.)R=-C.x; if(vT.y>1.)T=-C.y; if(vB.y<0.)B=-C.y;
        o=vec4(.5*(R-L+T-B),0.,0.,1.); }`,
    curl: `uniform sampler2D uVel;
      void main(){ float L=texture(uVel,vL).y, R=texture(uVel,vR).y, T=texture(uVel,vT).x, B=texture(uVel,vB).x;
        o=vec4(.5*(R-L-T+B),0.,0.,1.); }`,
    vorticity: `uniform sampler2D uVel, uCurl; uniform float curl, dt;
      void main(){ float L=texture(uCurl,vL).x, R=texture(uCurl,vR).x, T=texture(uCurl,vT).x, B=texture(uCurl,vB).x, C=texture(uCurl,vUv).x;
        vec2 f=.5*vec2(abs(T)-abs(B), abs(R)-abs(L)); f/=length(f)+1e-4; f*=curl*C; f.y*=-1.;
        vec2 v=texture(uVel,vUv).xy+f*dt; o=vec4(clamp(v,-420.,420.),0.,1.); }`,
    pressure: `uniform sampler2D uP, uDiv;
      void main(){ float L=texture(uP,vL).x, R=texture(uP,vR).x, T=texture(uP,vT).x, B=texture(uP,vB).x;
        o=vec4((L+R+B+T-texture(uDiv,vUv).x)*.25,0.,0.,1.); }`,
    gradient: `uniform sampler2D uP, uVel, uMask;
      void main(){ float L=texture(uP,vL).x, R=texture(uP,vR).x, T=texture(uP,vT).x, B=texture(uP,vB).x;
        vec2 v=texture(uVel,vUv).xy-vec2(R-L,T-B); o=vec4(v*texture(uMask,vUv).r,0.,1.); }`,
    scale: `uniform sampler2D uT; uniform float value; void main(){ o=value*texture(uT,vUv); }`,
    display: `uniform sampler2D uDye; uniform float light;
      void main(){ vec3 c=max(texture(uDye,vUv).rgb,0.); vec3 m=1.-exp(-c*1.5); float a=max(m.r,max(m.g,m.b));
        if(light>.5){ o=vec4(m*.78, a*.92); } else { o=vec4(m, a); } }`,
  };

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, HEAD + fs));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i).name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  }

  function fbo(w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb, w, h };
  }
  function dfbo(w, h) {
    let a = fbo(w, h), b = fbo(w, h);
    return {
      w, h,
      get read() { return a; },
      get write() { return b; },
      swap() { const t = a; a = b; b = t; },
    };
  }
  function maskTex(src) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    return tex;
  }

  function bindTex(unit, tex) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; }
  function blit(target) {
    if (target) { gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); gl.viewport(0, 0, target.w, target.h); }
    else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function use(pr, texel) {
    gl.useProgram(pr.p);
    if (pr.u.texel) gl.uniform2f(pr.u.texel, texel[0], texel[1]);
  }

  function allocate() {
    const c = CFG();
    const aspect = 1920 / 1080;
    simH = c.sim; simW = Math.round(c.sim * aspect);
    dyeH = Math.round(c.dye / aspect); dyeW = c.dye;
    canvas.width = dyeW; canvas.height = dyeH;
    vel = dfbo(simW, simH);
    dye = dfbo(dyeW, dyeH);
    divg = fbo(simW, simH);
    curlT = fbo(simW, simH);
    pres = dfbo(simW, simH);
    if (channels.length) buildMask();
  }

  F.init = function (cv) {
    canvas = cv;
    try {
      gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: false });
      if (!gl) throw new Error('no webgl2');
      if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) throw new Error('no float fbo');
      for (const k in FS) prog[k] = program(FS[k]);
      quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      whiteMask = maskTex(null);
      allocate();
      ok = true;
    } catch (e) {
      console.warn('[fluid] disabled:', e.message);
      ok = false;
      canvas.style.display = 'none';
      return;
    }
    // 포인터로 유체 젓기
    let lp = null;
    addEventListener('pointermove', (e) => {
      if (!active || state.mode === 'off' || document.body.classList.contains('overview')) { lp = null; return; }
      const p = PPT.toStage(e.clientX, e.clientY);
      const now = performance.now();
      if (lp) {
        const dt = Math.max(8, now - lp.t) / 1000;
        const dx = p.x - lp.x, dy = p.y - lp.y;
        if (Math.abs(dx) + Math.abs(dy) > 1) {
          const k = (simW / 1920) * 0.9;
          const cap = (v) => Math.max(-900, Math.min(900, v));
          const col = state.mode === 'channel' ? [0.02, 0.22, 0.3] : pick(state.palette || 'mix', 0.35);
          splat(p.x / 1920, 1 - p.y / 1080, cap((dx / dt) * k), cap((-dy / dt) * k), col, 0.0012);
        }
      }
      lp = { x: p.x, y: p.y, t: now };
    });
    requestAnimationFrame(frame);
  };

  F.setLow = function (v) { low = v; if (ok) allocate(); };
  F.setTheme = function (v) { light = v; };

  /* 슬라이드가 호출: { mode, opacity, energy, palette, channels } */
  F.set = function (cfg) {
    const next = Object.assign({ opacity: 1 }, cfg || { mode: 'off' });
    if (next.mode === 'off') next.opacity = 0;
    if (next.channels && next.channels !== state.channels) { channels = next.channels; buildMask(); }
    const modeChanged = next.mode !== state.mode;
    state = next;
    if (!ok) return;
    canvas.style.opacity = state.opacity;
    if (state.mode !== 'off') { active = true; }
    else offSince = performance.now();
    if (modeChanged && state.mode === 'channel') { clearAll(0.0); chanStart = tAcc; }
    if (modeChanged && state.mode === 'chaos' && state.burst) burst();
  };

  /* 슬라이드 14: 물길 마스크 만들기 */
  function buildMask() {
    if (!ok && !gl) return;
    const W = 480, H = 270;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = '#000';
    x.fillRect(0, 0, W, H);
    x.scale(W / 1920, H / 1080);
    x.strokeStyle = '#fff';
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.shadowColor = '#fff';
    x.shadowBlur = 10;
    channels.forEach((ch) => {
      x.lineWidth = ch.width || 70;
      x.stroke(new Path2D(ch.d));
      if (ch.pool) {
        x.beginPath();
        x.arc(ch.pool[0], ch.pool[1], ch.pool[2], 0, Math.PI * 2);
        x.fillStyle = '#fff';
        x.fill();
      }
    });
    chanMask = maskTex(c);
    // 경로 위의 점과 접선 샘플링
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
    document.body.appendChild(svg);
    channels.forEach((ch) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', ch.d);
      svg.appendChild(p);
      const L = p.getTotalLength();
      ch.pts = [];
      for (let s = 0; s <= L; s += 46) {
        const a = p.getPointAtLength(s), b = p.getPointAtLength(Math.min(L, s + 4));
        const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        ch.pts.push({ x: a.x, y: a.y, tx: (b.x - a.x) / len, ty: (b.y - a.y) / len });
      }
    });
    svg.remove();
  }

  const PAL = {
    ai: [0.05, 0.62, 0.8],
    ai2: [0.02, 0.25, 0.55],
    human: [0.85, 0.42, 0.04],
    white: [0.55, 0.62, 0.7],
  };
  function pick(p, k = 1) {
    let c;
    const r = Math.random();
    if (p === 'ai') c = r < 0.7 ? PAL.ai : PAL.ai2;
    else if (p === 'hot') c = r < 0.6 ? PAL.ai : r < 0.8 ? PAL.ai2 : PAL.human;
    else c = r < 0.5 ? PAL.ai : r < 0.72 ? PAL.ai2 : r < 0.92 ? PAL.human : PAL.white;
    return c.map((v) => v * k);
  }

  function splat(x, y, dx, dy, color, radius = 0.0016) {
    const aspect = 1920 / 1080;
    const pr = prog.splat;
    use(pr, [1 / simW, 1 / simH]);
    gl.uniform1i(pr.u.uT, bindTex(0, vel.read.tex));
    gl.uniform1f(pr.u.aspect, aspect);
    gl.uniform2f(pr.u.point, x, y);
    gl.uniform3f(pr.u.color, dx, dy, 0);
    gl.uniform1f(pr.u.radius, radius);
    blit(vel.write); vel.swap();
    if (color) {
      use(pr, [1 / dyeW, 1 / dyeH]);
      gl.uniform1i(pr.u.uT, bindTex(0, dye.read.tex));
      gl.uniform3f(pr.u.color, color[0], color[1], color[2]);
      gl.uniform1f(pr.u.radius, radius * 1.1);
      blit(dye.write); dye.swap();
    }
  }

  function clearAll(v) {
    const pr = prog.scale;
    [dye, vel].forEach((t) => {
      use(pr, [1 / t.w, 1 / t.h]);
      gl.uniform1i(pr.u.uT, bindTex(0, t.read.tex));
      gl.uniform1f(pr.u.value, v);
      blit(t.write); t.swap();
    });
  }

  function burst() {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      splat(Math.random(), Math.random(), Math.cos(a) * 700, Math.sin(a) * 700, pick(state.palette || 'mix', 0.5), 0.004);
    }
  }

  /* 모드별 힘 주기 */
  function drive(dt, t) {
    const m = state.mode;
    const f = Math.min(2, dt * 60); // 주사율(60/120Hz)과 무관하게 같은 양
    if (m === 'chaos') {
      const rate = (state.rate || 1) * (low ? 0.6 : 1);
      if (Math.random() < 0.09 * rate * f) {
        const a = Math.random() * Math.PI * 2;
        const sp = 220 + Math.random() * 520;
        splat(Math.random(), Math.random(), Math.cos(a) * sp, Math.sin(a) * sp, pick(state.palette || 'mix', 0.22 + Math.random() * 0.25), 0.0012 + Math.random() * 0.004);
      }
    } else if (m === 'surge') {
      const e = state.energy == null ? 0.3 : state.energy;
      const cx = state.cx || 0.5, cy = state.cy || 0.5;
      const n = 3;
      const r = 0.16 * (1 - e * 0.65);
      for (let i = 0; i < n; i++) {
        const a = t * (1.2 + e * 5) + (i * Math.PI * 2) / n;
        const x = cx + (Math.cos(a) * r) / (1920 / 1080), y = cy + Math.sin(a) * r;
        const sp = 120 + e * 320;
        splat(x, y, -Math.sin(a) * sp, Math.cos(a) * sp, pick(e > 0.7 ? 'hot' : 'ai', (0.022 + e * 0.02) * f), 0.0008 + e * 0.0006);
      }
      if (Math.random() < 0.02 * f) {
        const a = Math.random() * Math.PI * 2;
        splat(Math.random(), Math.random(), Math.cos(a) * 200, Math.sin(a) * 200, pick('ai', 0.05), 0.002);
      }
    } else if (m === 'channel') {
      channels.forEach((ch, ci) => {
        if (!ch.pts || !ch.pts.length) return;
        const force = (ch.force || 380) * (state.flow == null ? 1 : state.flow);
        // 물길을 따라 흐르게 하는 컨베이어 힘
        // 끝부분(학생 쪽)에서는 힘을 줄여, 뚫고 지나가지 않고 고이게 한다
        const n = ch.pts.length - 1;
        for (let i = (Math.floor(t * 30) + ci) % 2; i < n; i += 2) {
          const p = ch.pts[i];
          const ease = Math.min(1, Math.max(0.45, (1 - i / n) / 0.1));
          splat(p.x / 1920, 1 - p.y / 1080, p.tx * force * ease, -p.ty * force * ease, null, 0.0009);
        }
        // 원천: AI(청록) 잉크 주입
        const s = ch.pts[0];
        if (state.flow !== 0) splat(s.x / 1920, 1 - s.y / 1080, s.tx * force * 1.3, -s.ty * force * 1.3, (ch.color || PAL.ai).map((v) => v * 0.06 * f), 0.0014);
        // 합류 목(좁은 구간)에서 잉크가 끊겨 보이지 않도록 옅게 보충
        const nk = ch.pts[Math.floor(ch.pts.length * 0.8)];
        if (state.flow !== 0) splat(nk.x / 1920, 1 - nk.y / 1080, nk.tx * force, -nk.ty * force, (ch.color || PAL.ai).map((v) => v * 0.035 * f), 0.001);
      });
      // 합류 지점: 학생의 생각(호박색)
      const fill = Math.min(1, Math.max(0, (t - chanStart - 1.5) / 7));
      if (state.pool && Math.random() < 0.35) {
        const [px, py] = state.pool;
        const a = Math.random() * Math.PI * 2;
        splat(px / 1920, 1 - py / 1080, Math.cos(a) * 40, Math.sin(a) * 40, PAL.human.map((v) => v * 0.2 * fill * f), 0.0022);
      }
    }
  }

  function step(dt) {
    const c = CFG();
    const texel = [1 / simW, 1 / simH];
    const mask = state.mode === 'channel' && chanMask ? chanMask : whiteMask;

    use(prog.curl, texel);
    gl.uniform1i(prog.curl.u.uVel, bindTex(0, vel.read.tex));
    blit(curlT);

    use(prog.vorticity, texel);
    gl.uniform1i(prog.vorticity.u.uVel, bindTex(0, vel.read.tex));
    gl.uniform1i(prog.vorticity.u.uCurl, bindTex(1, curlT.tex));
    gl.uniform1f(prog.vorticity.u.curl, state.mode === 'surge' ? c.curl * 0.8 : state.mode === 'channel' ? 6 : c.curl);
    gl.uniform1f(prog.vorticity.u.dt, dt);
    blit(vel.write); vel.swap();

    // 물길은 입구·출구가 닫힌 관이라 압력 투영이 흐름을 상쇄한다 → 물길 모드에서는 투영 생략
    const project = state.mode !== 'channel';
    if (project) {
    use(prog.divergence, texel);
    gl.uniform1i(prog.divergence.u.uVel, bindTex(0, vel.read.tex));
    blit(divg);

    use(prog.scale, texel);
    gl.uniform1i(prog.scale.u.uT, bindTex(0, pres.read.tex));
    gl.uniform1f(prog.scale.u.value, 0.8);
    blit(pres.write); pres.swap();

    use(prog.pressure, texel);
    gl.uniform1i(prog.pressure.u.uDiv, bindTex(1, divg.tex));
    for (let i = 0; i < c.pressureIt; i++) {
      gl.uniform1i(prog.pressure.u.uP, bindTex(0, pres.read.tex));
      blit(pres.write); pres.swap();
    }

    use(prog.gradient, texel);
    gl.uniform1i(prog.gradient.u.uP, bindTex(0, pres.read.tex));
    gl.uniform1i(prog.gradient.u.uVel, bindTex(1, vel.read.tex));
    gl.uniform1i(prog.gradient.u.uMask, bindTex(2, mask));
    blit(vel.write); vel.swap();
    }

    const ad = prog.advect;
    use(ad, texel);
    gl.uniform2f(ad.u.simTexel, texel[0], texel[1]);
    gl.uniform1i(ad.u.uVel, bindTex(0, vel.read.tex));
    gl.uniform1i(ad.u.uSrc, bindTex(1, vel.read.tex));
    gl.uniform1i(ad.u.uMask, bindTex(2, mask));
    gl.uniform1f(ad.u.dt, dt);
    gl.uniform1f(ad.u.diss, state.mode === 'channel' ? 1.2 : state.mode === 'surge' ? 1.6 : 0.25);
    blit(vel.write); vel.swap();

    use(ad, [1 / dyeW, 1 / dyeH]);
    gl.uniform2f(ad.u.simTexel, texel[0], texel[1]);
    gl.uniform1i(ad.u.uVel, bindTex(0, vel.read.tex));
    gl.uniform1i(ad.u.uSrc, bindTex(1, dye.read.tex));
    gl.uniform1i(ad.u.uMask, bindTex(2, mask));
    gl.uniform1f(ad.u.diss, state.mode === 'channel' ? 0.3 : state.mode === 'surge' ? 0.9 : 0.28);
    blit(dye.write); dye.swap();
  }

  function render() {
    gl.disable(gl.BLEND);
    use(prog.display, [1 / dyeW, 1 / dyeH]);
    gl.uniform1i(prog.display.u.uDye, bindTex(0, dye.read.tex));
    gl.uniform1f(prog.display.u.light, light ? 1 : 0);
    blit(null);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!ok) return;
    const dt = Math.min((now - (last || now)) / 1000, 1 / 40) || 1 / 60;
    last = now;
    if (state.mode === 'off' && active && now - offSince > 1500) active = false;
    if (!active) return;
    tAcc += dt;
    drive(dt, tAcc);
    step(dt);
    render();
  }

  /* 인쇄/미리보기에서 쓰는 정지 이미지 */
  F.snapshot = function () {
    if (!ok) return null;
    render();
    return canvas.toDataURL('image/png');
  };
})();

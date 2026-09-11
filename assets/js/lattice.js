/*
 * Hero visual: a 2×2×2 supercell of a cubic ABX₃ perovskite drawn on <canvas>.
 * B-site cations sit at the lattice points, X anions at the octahedron
 * corners (edge midpoints), A-site cations at the cell centres. Corner-sharing
 * BX₆ octahedra are drawn as translucent faces. Pure canvas, no library.
 */
(function () {
  const canvas = document.getElementById("lattice");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const wrap = canvas.parentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- geometry -----------------------------------------------------------
  const N = 2; // cells per edge
  const B = [], X = [], A = [], octa = [];
  for (let i = 0; i <= N; i++)
    for (let j = 0; j <= N; j++)
      for (let k = 0; k <= N; k++) B.push([i, j, k]);

  const xIndex = new Map();
  const keyOf = (p) => p.map((v) => v.toFixed(1)).join(",");
  const addX = (p) => {
    const k = keyOf(p);
    if (!xIndex.has(k)) { xIndex.set(k, X.length); X.push(p); }
    return xIndex.get(k);
  };
  for (const b of B) {
    const ids = [
      addX([b[0] + 0.5, b[1], b[2]]), addX([b[0] - 0.5, b[1], b[2]]),
      addX([b[0], b[1] + 0.5, b[2]]), addX([b[0], b[1] - 0.5, b[2]]),
      addX([b[0], b[1], b[2] + 0.5]), addX([b[0], b[1], b[2] - 0.5]),
    ];
    // 8 triangular faces: one X from each axis pair (±x, ±y, ±z)
    const faces = [];
    for (const sx of [0, 1]) for (const sy of [2, 3]) for (const sz of [4, 5]) faces.push([ids[sx], ids[sy], ids[sz]]);
    // 12 edges between X atoms of the same octahedron
    const edges = [];
    for (const sx of [0, 1]) for (const sy of [2, 3]) edges.push([ids[sx], ids[sy]]);
    for (const sx of [0, 1]) for (const sz of [4, 5]) edges.push([ids[sx], ids[sz]]);
    for (const sy of [2, 3]) for (const sz of [4, 5]) edges.push([ids[sy], ids[sz]]);
    octa.push({ faces, edges });
  }
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++)
      for (let k = 0; k < N; k++) A.push([i + 0.5, j + 0.5, k + 0.5]);

  const c = N / 2;
  const all = [
    ...B.map((p) => ({ p, kind: "B" })),
    ...X.map((p) => ({ p, kind: "X" })),
    ...A.map((p) => ({ p, kind: "A" })),
  ];

  // ---- colours from CSS tokens (re-read when the theme changes) ------------
  let col = {};
  function readColours() {
    const s = getComputedStyle(document.documentElement);
    const v = (n) => s.getPropertyValue(n).trim();
    col = {
      accent: v("--accent") || "#F0B245",
      teal: v("--teal") || "#58C6BA",
      b: v("--atom-b") || "#6C7A99",
      text: v("--text") || "#fff",
      light: v("color-scheme").includes("light"),
    };
  }
  readColours();
  new MutationObserver(readColours).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", readColours);

  function hexA(hex, a) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // ---- sizing ------------------------------------------------------------
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = wrap.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  new ResizeObserver(resize).observe(wrap);

  // ---- interaction -------------------------------------------------------
  let rotX = -0.42, rotY = 0.62;
  let velY = 0.0022, velX = 0;
  let targetTiltX = 0, targetTiltY = 0, tiltX = 0, tiltY = 0;
  wrap.addEventListener("pointermove", (e) => {
    const r = wrap.getBoundingClientRect();
    targetTiltY = ((e.clientX - r.left) / r.width - 0.5) * 0.6;
    targetTiltX = ((e.clientY - r.top) / r.height - 0.5) * 0.45;
  });
  wrap.addEventListener("pointerleave", () => { targetTiltX = 0; targetTiltY = 0; });

  // ---- projection --------------------------------------------------------
  function project(p, ax, ay) {
    let x = p[0] - c, y = p[1] - c, z = p[2] - c;
    // rotate around Y
    let cx = Math.cos(ay), sx = Math.sin(ay);
    let x1 = x * cx + z * sx, z1 = -x * sx + z * cx;
    // rotate around X
    let cy = Math.cos(ax), sy = Math.sin(ax);
    let y2 = y * cy - z1 * sy, z2 = y * sy + z1 * cy;
    const f = 6.5;
    const scale = Math.min(W, H) * 0.235;
    const k = f / (f + z2);
    return { x: W / 2 + x1 * scale * k, y: H / 2 + y2 * scale * k, z: z2, k };
  }

  // ---- render ------------------------------------------------------------
  function draw(ax, ay) {
    ctx.clearRect(0, 0, W, H);
    const P = all.map((a) => ({ ...project(a.p, ax, ay), kind: a.kind }));
    const xOff = B.length; // X atoms start after B in `all`

    const items = [];
    for (const o of octa) {
      for (const f of o.faces) {
        const a = P[xOff + f[0]], b = P[xOff + f[1]], d = P[xOff + f[2]];
        items.push({ z: (a.z + b.z + d.z) / 3 - 0.02, type: "face", pts: [a, b, d] });
      }
      for (const e of o.edges) {
        const a = P[xOff + e[0]], b = P[xOff + e[1]];
        items.push({ z: (a.z + b.z) / 2 - 0.01, type: "edge", pts: [a, b] });
      }
    }
    P.forEach((q) => items.push({ z: q.z, type: "atom", q }));
    items.sort((a, b) => a.z - b.z);

    const faceFill = hexA(col.accent, col.light ? 0.07 : 0.085);
    const edgeStroke = hexA(col.accent, col.light ? 0.42 : 0.34);

    for (const it of items) {
      if (it.type === "face") {
        ctx.beginPath();
        ctx.moveTo(it.pts[0].x, it.pts[0].y);
        ctx.lineTo(it.pts[1].x, it.pts[1].y);
        ctx.lineTo(it.pts[2].x, it.pts[2].y);
        ctx.closePath();
        ctx.fillStyle = faceFill;
        ctx.fill();
      } else if (it.type === "edge") {
        ctx.beginPath();
        ctx.moveTo(it.pts[0].x, it.pts[0].y);
        ctx.lineTo(it.pts[1].x, it.pts[1].y);
        ctx.strokeStyle = edgeStroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        const q = it.q;
        const depth = (q.z + 1.8) / 3.6; // 0 far … 1 near
        let r, base;
        if (q.kind === "B") { r = 7.5; base = col.b; }
        else if (q.kind === "X") { r = 5.2; base = col.accent; }
        else { r = 4.2; base = col.teal; }
        r *= q.k * (Math.min(W, H) / 480);
        const g = ctx.createRadialGradient(q.x - r * 0.35, q.y - r * 0.35, r * 0.1, q.x, q.y, r);
        g.addColorStop(0, hexA("#ffffff", col.light ? 0.55 : 0.7));
        g.addColorStop(0.25, base);
        g.addColorStop(1, hexA(base, 0.85));
        ctx.globalAlpha = 0.55 + 0.45 * depth;
        ctx.beginPath();
        ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  let running = true;
  const io = new IntersectionObserver((entries) => { running = entries[0].isIntersecting; }, { threshold: 0 });
  io.observe(wrap);

  function frame() {
    if (running) {
      tiltX += (targetTiltX - tiltX) * 0.06;
      tiltY += (targetTiltY - tiltY) * 0.06;
      if (!reduceMotion) { rotY += velY; rotX += velX; }
      draw(rotX + tiltX, rotY + tiltY);
    }
    if (!reduceMotion || Math.abs(targetTiltX - tiltX) > 0.001) requestAnimationFrame(frame);
    else requestAnimationFrame(frame); // keep listening for pointer tilt
  }
  draw(rotX, rotY);
  requestAnimationFrame(frame);
})();

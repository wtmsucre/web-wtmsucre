// Adapted from the supplied “Cholita y la estrella” animation.
export function animateCholita(root) {
  /* ===== Ajustes rápidos ===== */
  const CONFIG = {
    SHOW_GUIDE: false, // órbita tenue punteada por donde viaja el cometa
    INTERVAL: 6.5, // segundos entre cometas
  }

  const SW = 1146 // ancho del lienzo de referencia
  const STAR = { x: 895, y: 145 } // posición de la estrella
  const MAXR = 330 // alcance de las ondas de radar
  const TAU = Math.PI * 2
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const rand = (a, b) => a + Math.random() * (b - a)
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
  let RM = motion.matches

  const back = root.querySelector("[data-comet-back]")
  const front = root.querySelector("[data-comet-front]")
  const bctx = back.getContext("2d"),
    fctx = front.getContext("2d")
  if (!bctx || !fctx) return () => {}

  /* ---------- sprites de luz (se dibujan una sola vez) ---------- */
  function sprite(stops) {
    const size = 128,
      c = document.createElement("canvas")
    c.width = c.height = size
    const g = c.getContext("2d")
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    stops.forEach(s => {
      gr.addColorStop(s[0], s[1])
    })
    g.fillStyle = gr
    g.fillRect(0, 0, size, size)
    return c
  }
  const S_GLOW = sprite([
    [0, "rgba(30,150,255,0.9)"],
    [0.3, "rgba(10,125,255,0.35)"],
    [0.7, "rgba(8,121,255,0.08)"],
    [1, "rgba(8,121,255,0)"],
  ])
  const S_LINE = sprite([
    [0, "rgba(6,110,250,1)"],
    [0.45, "rgba(8,121,255,0.75)"],
    [1, "rgba(8,121,255,0)"],
  ])
  const S_HOT = sprite([
    [0, "rgba(255,255,255,1)"],
    [0.35, "rgba(215,240,255,0.95)"],
    [0.7, "rgba(120,200,255,0.35)"],
    [1, "rgba(120,200,255,0)"],
  ])
  const S_GOLD = sprite([
    [0, "rgba(255,225,120,1)"],
    [0.3, "rgba(255,200,60,0.65)"],
    [1, "rgba(255,180,40,0)"],
  ])
  const S_GHOT = sprite([
    [0, "rgba(255,252,235,1)"],
    [0.3, "rgba(255,224,110,0.85)"],
    [1, "rgba(255,190,50,0)"],
  ])

  function spr(c, img, x, y, size, alpha) {
    if (alpha <= 0.003) return
    c.globalAlpha = alpha > 1 ? 1 : alpha
    c.drawImage(img, x - size / 2, y - size / 2, size, size)
    c.globalAlpha = 1
  }

  /* ---------- tamaño y escala ---------- */
  let dpr = 1,
    k = 1
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    k = root.clientWidth / SW
    ;[back, front].forEach(cv => {
      cv.width = Math.round(root.clientWidth * 1.4 * dpr)
      cv.height = Math.round(root.clientHeight * 1.4 * dpr)
    })
  }
  // Mirror only the effect: the original PNG faces left and stays untouched.
  const base = c =>
    c.setTransform(
      -dpr * k,
      0,
      0,
      dpr * k,
      root.clientWidth * 1.2 * dpr,
      root.clientHeight * 0.2 * dpr
    )
  const wipe = (c, cv) => {
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.clearRect(0, 0, cv.width, cv.height)
    base(c)
  }

  /* ---------- la órbita: curva suave que rodea a la cholita y termina en la estrella ---------- */
  const KEY = [
    [905, 985],
    [975, 1030],
    [1035, 1080],
    [1058, 1140],
    [1030, 1185],
    [960, 1212],
    [866, 1222],
    [700, 1196],
    [500, 1142],
    [300, 1072],
    [180, 1024],
    [122, 950],
    [125, 880],
    [200, 815],
    [330, 782],
    [480, 745],
    [640, 693],
    [790, 632],
    [880, 588],
    [960, 530],
    [1025, 470],
    [1058, 400],
    [1060, 335],
    [1035, 280],
    [990, 238],
    [940, 200],
    [905, 158],
    [STAR.x, STAR.y],
  ]
  const BEHIND = [
    [0, 2.2],
    [12.6, 15.4],
  ] // tramos que pasan por detrás de ella
  const isBehind = s => BEHIND.some(r => s >= r[0] && s <= r[1])
  const cr = (p0, p1, p2, p3, t) =>
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)

  const SAMPLES = []
  for (let i = 0; i < KEY.length - 1; i++) {
    const a = KEY[Math.max(i - 1, 0)],
      b = KEY[i],
      c = KEY[i + 1],
      d = KEY[Math.min(i + 2, KEY.length - 1)]
    for (let j = 0; j < 40; j++) {
      const t = j / 40
      SAMPLES.push({
        x: cr(a[0], b[0], c[0], d[0], t),
        y: cr(a[1], b[1], c[1], d[1], t),
        seg: i + t,
      })
    }
  }
  SAMPLES.push({ x: STAR.x, y: STAR.y, seg: KEY.length - 1 })
  let acc = 0
  SAMPLES.forEach((s, i) => {
    if (i) acc += Math.hypot(s.x - SAMPLES[i - 1].x, s.y - SAMPLES[i - 1].y)
    s.l = acc
    s.b = isBehind(s.seg)
  })
  const PLEN = acc

  function at(u) {
    // punto de la órbita a la fracción u (0 a 1) de su longitud
    const target = clamp(u, 0, 1) * PLEN
    let lo = 0,
      hi = SAMPLES.length - 1
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1
      if (SAMPLES[m].l <= target) lo = m
      else hi = m
    }
    const a = SAMPLES[lo],
      b = SAMPLES[hi]
    const f = b.l > a.l ? (target - a.l) / (b.l - a.l) : 0
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, b: a.b }
  }

  // guía punteada tenue, separada en tramo delantero y trasero
  const guideB = new Path2D(),
    guideF = new Path2D()
  SAMPLES.forEach((s, i) => {
    const p = s.b ? guideB : guideF
    if (i === 0 || SAMPLES[i - 1].b !== s.b) {
      const pr = i ? SAMPLES[i - 1] : s
      p.moveTo(pr.x, pr.y)
    }
    p.lineTo(s.x, s.y)
  })
  function drawGuide(c, path, T) {
    c.lineCap = "round"
    c.lineJoin = "round"
    c.setLineDash([])
    c.lineWidth = 11
    c.strokeStyle = "rgba(8,121,255,0.05)"
    c.stroke(path)
    c.setLineDash([12, 17])
    c.lineDashOffset = -T * 26
    c.lineWidth = 3
    c.strokeStyle = "rgba(8,121,255,0.22)"
    c.stroke(path)
    c.setLineDash([])
  }

  /* ---------- estado ---------- */
  const comets = [],
    sparks = [],
    rings = []
  let T = 0,
    flash = 0,
    kick = 0,
    nextLaunch = 0.8,
    idleTimer = 1.4,
    idleCount = 0

  function launch() {
    comets.push({ age: 0, travel: rand(4.2, 4.6), lag: 1.5, hit: false, acc: 0 })
  }
  const ease = x => clamp(x, 0, 1) ** 1.15

  function drawComet(c) {
    const hp = ease(c.age / c.travel),
      tp = ease((c.age - c.lag) / c.travel)
    if (hp - tp <= 0.0004) return
    const fade = c.age <= c.travel ? 1 : clamp(1 - (c.age - c.travel) / (c.lag + 0.05), 0, 1)
    const fadeIn = clamp(c.age / 0.5, 0, 1)
    const trailLen = PLEN * (hp - tp)
    const N = clamp(Math.round(trailLen / 2), 40, 420),
      spacing = trailLen / N
    const pts = []
    for (let i = 0; i < N; i++) pts.push(at(tp + ((hp - tp) * i) / (N - 1)))

    // pasada 1: resplandor azul
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1),
        p = pts[i],
        sg = 22 + 120 * u ** 1.15
      spr(
        p.b ? bctx : fctx,
        S_GLOW,
        p.x,
        p.y,
        sg,
        clamp((0.9 * spacing) / (0.4 * sg), 0, 1) * u ** 1.7 * fade * fadeIn
      )
    }
    // pasada 2: hilo azul saturado que se afina hacia la cola
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1),
        p = pts[i],
        sl = 9 + 34 * u ** 1.2
      spr(
        p.b ? bctx : fctx,
        S_LINE,
        p.x,
        p.y,
        sl,
        clamp((2.6 * spacing) / (0.4 * sl), 0, 1) * u ** 1.8 * fade * fadeIn
      )
    }
    // pasada 3: núcleo claro
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1),
        p = pts[i],
        sh = 5 + 18 * u ** 1.5
      spr(
        p.b ? bctx : fctx,
        S_HOT,
        p.x,
        p.y,
        sh,
        clamp((2.2 * spacing) / (0.4 * sh), 0, 1) * u ** 2.4 * fade * fadeIn
      )
    }
    // cabeza
    if (c.age < c.travel + 0.05) {
      const h = pts[N - 1],
        cx = h.b ? bctx : fctx
      spr(cx, S_GLOW, h.x, h.y, 190, 0.85 * fade * fadeIn)
      spr(cx, S_LINE, h.x, h.y, 60, 0.9 * fade * fadeIn)
      spr(cx, S_HOT, h.x, h.y, 50, fade * fadeIn)
    }
  }

  /* ---------- chispas y ondas ---------- */
  function addSpark(x, y, vx, vy, life, size, gold, b) {
    sparks.push({ x, y, vx, vy, life, age: 0, size, gold, b: !!b })
  }
  function spawnRing(delay, max, col, big) {
    rings.push({ age: -delay, life: big ? 1.6 : 3, max, col, big: !!big })
  }
  const RING_COL = { gold: [244, 178, 40], blue: [40, 140, 255], strong: [255, 196, 50] }

  function impact() {
    flash = RM ? 0.35 : 1
    kick = RM ? 0 : 1
    spawnRing(0, MAXR, "gold")
    spawnRing(0.14, MAXR * 0.9, "blue")
    spawnRing(0, MAXR * 1.2, "strong", true)
    for (let i = 0; i < 48; i++) {
      const a = rand(0, TAU),
        v = rand(120, 520)
      addSpark(
        STAR.x,
        STAR.y,
        Math.cos(a) * v,
        Math.sin(a) * v,
        rand(0.8, 1.6),
        rand(8, 18),
        Math.random() < 0.7,
        false
      )
    }
  }

  function drawRing(r) {
    if (r.age < 0) return
    const t = r.age / r.life,
      e = 1 - (1 - t) ** 2.2
    const r0 = 60,
      rad = r0 + e * (r.max - r0)
    const a = (1 - t) ** 1.6 * (r.big ? 0.85 : 0.6)
    const lw = (r.big ? 4 : 3) * (1 - t * 0.7) + 0.6,
      col = RING_COL[r.col]
    bctx.beginPath()
    bctx.arc(STAR.x, STAR.y, rad, 0, TAU)
    bctx.lineWidth = lw * 4.5
    bctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${(a * 0.16).toFixed(3)})`
    bctx.stroke()
    bctx.lineWidth = lw
    bctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${a.toFixed(3)})`
    bctx.stroke()
  }

  /* ---------- radar: rejilla y barrido ---------- */
  function drawGrid() {
    bctx.lineWidth = 1.5
    ;[0.34, 0.67, 1].forEach((f, i) => {
      bctx.setLineDash(i === 2 ? [3, 10] : [])
      bctx.strokeStyle = `rgba(8,121,255,${i === 2 ? 0.2 : 0.09})`
      bctx.beginPath()
      bctx.arc(STAR.x, STAR.y, MAXR * f * 0.92, 0, TAU)
      bctx.stroke()
    })
    bctx.setLineDash([])
  }

  const sw = document.createElement("canvas")
  sw.width = sw.height = 256
  const swc = sw.getContext("2d")
  const hasConic = typeof swc.createConicGradient === "function"
  function drawSweep() {
    if (!hasConic) return
    const rot = T * 1.1,
      wedge = Math.PI * 0.55,
      f = wedge / TAU
    swc.globalCompositeOperation = "source-over"
    swc.clearRect(0, 0, 256, 256)
    const g = swc.createConicGradient(rot - wedge, 128, 128)
    g.addColorStop(0, "rgba(255,190,60,0)")
    g.addColorStop(f * 0.55, "rgba(255,190,60,0.03)")
    g.addColorStop(f * 0.85, "rgba(255,190,60,0.12)")
    g.addColorStop(f, "rgba(255,196,70,0.34)")
    g.addColorStop(Math.min(f + 0.002, 0.999), "rgba(255,190,60,0)")
    g.addColorStop(1, "rgba(255,190,60,0)")
    swc.fillStyle = g
    swc.fillRect(0, 0, 256, 256)
    swc.globalCompositeOperation = "destination-in"
    const m = swc.createRadialGradient(128, 128, 0, 128, 128, 128)
    m.addColorStop(0, "rgba(0,0,0,0.9)")
    m.addColorStop(0.7, "rgba(0,0,0,0.5)")
    m.addColorStop(1, "rgba(0,0,0,0)")
    swc.fillStyle = m
    swc.fillRect(0, 0, 256, 256)
    const s = MAXR * 1.8
    bctx.globalAlpha = clamp(0.8 + 0.2 * flash, 0, 1)
    bctx.drawImage(sw, STAR.x - s / 2, STAR.y - s / 2, s, s)
    bctx.globalAlpha = 1
  }

  /* ---------- la estrella ---------- */
  function ray(c, L, th, alpha) {
    const g = c.createLinearGradient(-L, 0, L, 0)
    g.addColorStop(0, "rgba(255,200,70,0)")
    g.addColorStop(0.5, `rgba(255,196,60,${clamp(alpha, 0, 1).toFixed(3)})`)
    g.addColorStop(1, "rgba(255,200,70,0)")
    c.fillStyle = g
    c.beginPath()
    c.moveTo(-L, 0)
    c.quadraticCurveTo(0, -th, L, 0)
    c.quadraticCurveTo(0, th, -L, 0)
    c.fill()
  }

  function drawStar() {
    const c = fctx,
      pulse = Math.sin(T * 2.6)
    const r = 64 * (1 + 0.04 * pulse + 0.35 * kick)
    c.save()
    c.translate(STAR.x, STAR.y)

    spr(c, S_GOLD, 0, 0, r * 7, 0.3 + 0.45 * flash + 0.05 * pulse) // halo cálido

    const disc = c.createRadialGradient(0, 0, 0, 0, 0, 100) // disco suave detrás de la estrella
    disc.addColorStop(0, "rgba(255,232,160,0.95)")
    disc.addColorStop(0.75, "rgba(255,240,190,0.72)")
    disc.addColorStop(1, "rgba(255,246,210,0)")
    c.fillStyle = disc
    c.beginPath()
    c.arc(0, 0, 100, 0, TAU)
    c.fill()

    c.save()
    c.rotate(T * 0.18) // aro punteado que gira
    c.setLineDash([9, 11])
    c.lineWidth = 2.4
    c.strokeStyle = "rgba(240,185,60,0.65)"
    c.beginPath()
    c.arc(0, 0, 110, 0, TAU)
    c.stroke()
    c.setLineDash([])
    c.lineWidth = 3
    c.lineCap = "round"
    c.strokeStyle = "rgba(245,190,70,0.75)"
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8,
        long = i % 2 === 0
      c.beginPath()
      c.moveTo(Math.cos(a) * 76, Math.sin(a) * 76)
      c.lineTo(Math.cos(a) * (long ? 92 : 86), Math.sin(a) * (long ? 92 : 86))
      c.stroke()
    }
    c.restore()

    c.save()
    c.rotate(Math.sin(T * 0.7) * 0.04) // estrella de cuatro puntas
    const q = r * 0.19
    c.beginPath()
    c.moveTo(0, -r)
    c.quadraticCurveTo(q, -q, r, 0)
    c.quadraticCurveTo(q, q, 0, r)
    c.quadraticCurveTo(-q, q, -r, 0)
    c.quadraticCurveTo(-q, -q, 0, -r)
    c.closePath()
    c.lineJoin = "round"
    c.lineWidth = r * 0.1
    c.strokeStyle = "#f5a81c"
    c.stroke()
    const g = c.createRadialGradient(0, 0, 0, 0, 0, r)
    g.addColorStop(0, "#fff3c0")
    g.addColorStop(0.45, "#ffd54a")
    g.addColorStop(1, "#f7ad1f")
    c.fillStyle = g
    c.fill()
    c.restore()

    spr(c, S_GHOT, 0, 0, r * 1.2, 0.5 + 0.45 * flash) // centro brillante
    const L = r * (2.4 + 4.2 * flash + 0.5 * pulse),
      th = r * 0.16 // destellos en cruz
    c.save()
    c.rotate(T * 0.1)
    ray(c, L, th, 0.75)
    c.rotate(Math.PI / 2)
    ray(c, L, th, 0.75)
    c.rotate(Math.PI / 4)
    ray(c, L * 0.5, th * 0.7, 0.5)
    c.rotate(Math.PI / 2)
    ray(c, L * 0.5, th * 0.7, 0.5)
    c.restore()
    c.restore()
  }

  /* ---------- bucle ---------- */
  let last = performance.now()
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    T += dt

    if (T >= nextLaunch) {
      launch()
      nextLaunch = T + CONFIG.INTERVAL
    }

    idleTimer += dt
    if (idleTimer > 1.9) {
      idleTimer = 0
      idleCount++
      spawnRing(0, MAXR * 0.85, idleCount % 2 ? "gold" : "blue")
    }

    for (const c of comets) {
      c.age += dt
      if (c.age < c.travel) {
        const h = at(ease(c.age / c.travel))
        c.acc += dt * 60
        while (c.acc > 1) {
          c.acc -= 1
          addSpark(
            h.x + rand(-6, 6),
            h.y + rand(-6, 6),
            rand(-40, 40),
            rand(-40, 40),
            rand(0.4, 0.8),
            rand(7, 14),
            false,
            h.b
          )
        }
      }
      if (!c.hit && c.age >= c.travel) {
        c.hit = true
        impact()
      }
    }
    for (let i = comets.length - 1; i >= 0; i--)
      if (comets[i].age > comets[i].travel + comets[i].lag + 0.1) comets.splice(i, 1)

    for (const s of sparks) {
      s.age += dt
      s.x += s.vx * dt
      s.y += s.vy * dt
      const d = Math.exp(-2.2 * dt)
      s.vx *= d
      s.vy *= d
    }
    for (let i = sparks.length - 1; i >= 0; i--)
      if (sparks[i].age > sparks[i].life) sparks.splice(i, 1)
    for (const r of rings) r.age += dt
    for (let i = rings.length - 1; i >= 0; i--) if (rings[i].age > rings[i].life) rings.splice(i, 1)

    flash *= Math.exp(-dt * 2.6)
    kick *= Math.exp(-dt * 4.5)

    wipe(bctx, back)
    wipe(fctx, front)

    // capa trasera
    drawGrid()
    drawSweep()
    for (const r of rings) drawRing(r)
    if (CONFIG.SHOW_GUIDE) drawGuide(bctx, guideB, T)

    // capa delantera
    if (CONFIG.SHOW_GUIDE) drawGuide(fctx, guideF, T)
    for (const c of comets) drawComet(c)
    for (const s of sparks) {
      const kk = s.age / s.life,
        a = (1 - kk) ** 1.6,
        size = s.size * 3 * (1 - 0.5 * kk),
        cx = s.b ? bctx : fctx
      if (s.gold) spr(cx, S_GHOT, s.x, s.y, size, a)
      else {
        spr(cx, S_GLOW, s.x, s.y, size * 1.4, a * 0.6)
        spr(cx, S_HOT, s.x, s.y, size * 0.7, a)
      }
    }
    drawStar()

    if (flash > 0.01) {
      // destello al impactar
      const g = fctx.createRadialGradient(STAR.x, STAR.y, 0, STAR.x, STAR.y, 520)
      g.addColorStop(0, `rgba(255,228,130,${(0.6 * flash).toFixed(3)})`)
      g.addColorStop(0.4, `rgba(255,212,95,${(0.22 * flash).toFixed(3)})`)
      g.addColorStop(1, "rgba(255,212,95,0)")
      fctx.fillStyle = g
      fctx.fillRect(STAR.x - 520, STAR.y - 520, 1040, 1040)
    }

    frameId = requestAnimationFrame(frame)
  }

  // Pause outside the viewport, in hidden tabs, and for reduced motion.
  let frameId = 0
  let visible = false
  function updatePlayback() {
    cancelAnimationFrame(frameId)
    frameId = 0
    RM = motion.matches
    if (RM) {
      wipe(bctx, back)
      wipe(fctx, front)
      T = 0
      flash = 0
      kick = 0
      comets.length = 0
      sparks.length = 0
      rings.length = 0
      nextLaunch = 0.8
      drawStar()
      return
    }
    if (visible && !document.hidden) {
      last = performance.now()
      frameId = requestAnimationFrame(frame)
    }
  }
  const sizeObserver = new ResizeObserver(() => {
    resize()
    updatePlayback()
  })
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    updatePlayback()
  })
  resize()
  sizeObserver.observe(root)
  visibilityObserver.observe(root)
  motion.addEventListener("change", updatePlayback)
  document.addEventListener("visibilitychange", updatePlayback)
  return () => {
    cancelAnimationFrame(frameId)
    sizeObserver.disconnect()
    visibilityObserver.disconnect()
    motion.removeEventListener("change", updatePlayback)
    document.removeEventListener("visibilitychange", updatePlayback)
  }
}

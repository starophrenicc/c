const track = document.getElementById("jaydes");
const volume = document.getElementById("volume");
const enter = document.getElementById("enter");
const canvas = document.getElementById("viz");
const whoosh = document.getElementById("whoosh");

const TRACKS = [
  "mintbeat.mp3",
];

track.src = TRACKS[Math.floor(Math.random() * TRACKS.length)];

const volumeUi = document.getElementById("volumeUi");
let gainNode = null;
let audioCtx = null;

function setFavicon(href) {
  document.querySelectorAll('link[rel="icon"]').forEach(l => l.remove());
  const l = document.createElement("link");
  l.rel = "icon";
  l.href = href + "?v=" + Date.now();
  document.head.appendChild(l);
}

const meadowTrack = document.getElementById("meadowtrack");
const aeroTrack = document.getElementById("aerotrack");
const aeroEl = document.getElementById("aero");

function syncVolume() {
  const v = volume.value / 100;
  track.volume = v;
  if (meadowTrack) meadowTrack.volume = v;
  if (aeroTrack) aeroTrack.volume = v;
  if (gainNode) gainNode.gain.value = v;
  whoosh.volume = Math.min(1, v * 2.8);
  volumeUi.dataset.level = v === 0 ? "0" : v < 0.5 ? "1" : "2";
}

syncVolume();

let entered = false;

function debounce(fn, ms) {
  let t;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

const ctx = canvas.getContext("2d");
const VIZ_ORANGE = ["#ffffff", "#fff2dc", "#ffc078"];
const VIZ_GREEN = ["#ffffff", "#e2ffd4", "#5cc93a"];
const VIZ_BLUE = ["#ffffff", "#d9f0ff", "#3ba7ff"];
let VIZ_COLORS = VIZ_ORANGE;
let analyser, bins, gradient, W, H;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  gradient = ctx.createLinearGradient(0, H * 0.1, 0, H);
  gradient.addColorStop(0, VIZ_COLORS[0]);
  gradient.addColorStop(0.5, VIZ_COLORS[1]);
  gradient.addColorStop(1, VIZ_COLORS[2]);
}

function draw() {
  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(bins);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = gradient;

  const count = Math.max(48, Math.floor(W / 15));
  const slot = W / count;
  const barW = slot * 0.55;
  const base = H + 2;
  const maxH = H - 8;

  for (let i = 0; i < count; i++) {
    const bin = Math.floor(Math.pow(i / count, 2) * bins.length * 0.7);
    const h = Math.max(barW, (bins[bin] / 255) * maxH);
    const x = i * slot + (slot - barW) / 2;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, base - h, barW, h, [barW / 2, barW / 2, 0, 0]);
    } else {
      ctx.rect(x, base - h, barW, h);
    }
    ctx.fill();
  }
}

function startSpectrum() {
  try {
    const audio = new (window.AudioContext || window.webkitAudioContext)();
    audioCtx = audio;
    const source = audio.createMediaElementSource(track);
    gainNode = audio.createGain();
    gainNode.gain.value = volume.value / 100;
    analyser = audio.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audio.destination);
    routed.add(track);
    audio.resume();

    bins = new Uint8Array(analyser.frequencyBinCount);
    resize();
    window.addEventListener("resize", debounce(resize, 150));
    requestAnimationFrame(draw);
  } catch (e) {
    canvas.style.display = "none";
  }
}

const bomb = document.getElementById("bomb");
const bctx = bomb.getContext("2d");

if (document.fonts && document.fonts.load) {
  document.fonts.load('700 32px "Space Grotesk"');
}

const STICKERS = [".civx", "JamL"];
const CX = 104;
const CY = 46;
const PER_FRAME = 16;

function buildStickers(W, H) {
  const cols = Math.ceil(W / CX) + 2;
  const rows = Math.ceil(H / CY) + 2;
  const list = [];

  for (let y = -1; y < rows; y++) {
    for (let x = -1; x < cols; x++) {
      list.push({
        x: x * CX + (y % 2 ? CX / 2 : 0) + (Math.random() - 0.5) * CX * 0.3,
        y: y * CY + (Math.random() - 0.5) * CY * 0.3,
        r: (Math.random() * 50 - 25) * Math.PI / 180,
        alt: Math.random() < 0.5,
        text: STICKERS[Math.floor(Math.random() * STICKERS.length)],
        size: 26 + Math.random() * 16
      });
    }
  }

  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

let BOMB_ACCENT = "#f59409";

function drawSticker(ctx, st) {
  ctx.save();
  ctx.translate(st.x, st.y);
  ctx.rotate(st.r);
  ctx.font = "700 " + st.size + "px 'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif";
  const tw = ctx.measureText(st.text).width;
  const pw = Math.max(tw + st.size * 0.9, CX * 1.25);
  const ph = Math.max(st.size * 1.5, CY * 1.45);
  ctx.fillStyle = st.alt ? BOMB_ACCENT : "#ffffff";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-pw / 2, -ph / 2, pw, ph, st.size * 0.3);
  else ctx.rect(-pw / 2, -ph / 2, pw, ph);
  ctx.fill();
  ctx.fillStyle = st.alt ? "#ffffff" : BOMB_ACCENT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(st.text, 0, 1);
  ctx.restore();
}

function runBomb(done) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;

  bomb.width = W * dpr;
  bomb.height = H * dpr;
  bomb.style.width = W + "px";
  bomb.style.height = H + "px";
  bctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  requestAnimationFrame(() => bomb.classList.add("filling"));

  const list = buildStickers(W, H);
  let i = 0;

  (function step() {
    for (let k = 0; k < PER_FRAME && i < list.length; k++, i++) drawSticker(bctx, list[i]);
    if (i < list.length) requestAnimationFrame(step);
    else done();
  })();
}

function enterSite() {
  if (entered) return;
  entered = true;
  track.load();
  startSpectrum();
  enter.classList.add("gone");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("entered");
    enter.remove();
    bomb.remove();
    track.play().catch(() => { });
    return;
  }

  whoosh.play().catch(() => { });

  runBomb(() => {
    document.body.classList.add("entered");
    enter.remove();
    setTimeout(() => {
      bomb.classList.add("clear");
      track.play().catch(() => { });
    }, 260);
    setTimeout(() => bomb.remove(), 900);
  });
}

document.addEventListener("contextmenu", e => {
  if (e.target.closest("a")) return;
  e.preventDefault();
});

enter.addEventListener("click", enterSite);
document.addEventListener("keydown", enterSite);

const starEl = document.querySelector(".wordmark .star");
const meadowEl = document.getElementById("meadow");
const buddyEl = document.getElementById("buddy");
let meadowMode = false;
const MODES = ["orange", "meadow", "aero"];
let modeIndex = 0;
const routed = new Set();
let titleFrames = ["civx"];
let buddyAnim = null;

let buddyX = null;
let buddyFacing = 1;
let buddyDragging = false;

function setBuddyTransform(extra) {
  if (!buddyEl) return;
  buddyEl.style.transform = "scaleX(" + buddyFacing + ")" + (extra || "");
}

function walkBuddy() {
  if (!buddyEl) return;
  if (buddyAnim) clearTimeout(buddyAnim);
  if (buddyDragging) return;

  const minX = window.innerWidth * 0.35;
  const maxX = window.innerWidth * 0.62;
  const targetX = minX + Math.random() * (maxX - minX);
  const nowX = buddyEl.getBoundingClientRect().left;

  if (Math.abs(targetX - nowX) > 6) {
    buddyFacing = targetX > nowX ? -1 : 1;
    setBuddyTransform();
  }
  buddyX = targetX;

  const dur = 2.5 + Math.random() * 3;
  buddyEl.style.transition = "left " + dur + "s ease-in-out, opacity 0.6s ease";
  buddyEl.style.left = targetX + "px";
  buddyAnim = setTimeout(walkBuddy, dur * 1000 + 600 + Math.random() * 2000);
}

let grabDX = 0;
let grabDY = 0;
let lastPointerX = 0;

if (buddyEl) buddyEl.addEventListener("pointerdown", e => {
  if (!meadowMode) return;
  e.preventDefault();

  buddyDragging = true;
  if (buddyAnim) { clearTimeout(buddyAnim); buddyAnim = null; }

  const r = buddyEl.getBoundingClientRect();

  buddyEl.style.transition = "none";
  buddyEl.style.bottom = "auto";
  buddyEl.style.left = r.left + "px";
  buddyEl.style.top = r.top + "px";
  void buddyEl.offsetWidth;

  grabDX = e.clientX - r.left;
  grabDY = e.clientY - r.top;
  lastPointerX = e.clientX;
  buddyX = r.left;

  buddyEl.classList.add("dragging");
  buddyEl.style.transition = "opacity 0.6s ease";
  setBuddyTransform(" scale(1.12) rotate(-3deg)");
  buddyEl.setPointerCapture(e.pointerId);
});

if (buddyEl) buddyEl.addEventListener("pointermove", e => {
  if (!buddyDragging) return;

  const w = buddyEl.offsetWidth;
  const h = buddyEl.offsetHeight;
  const x = Math.max(0, Math.min(window.innerWidth - w, e.clientX - grabDX));
  const y = Math.max(0, Math.min(window.innerHeight - h, e.clientY - grabDY));

  if (Math.abs(e.clientX - lastPointerX) > 3) {
    buddyFacing = e.clientX > lastPointerX ? -1 : 1;
    lastPointerX = e.clientX;
  }

  buddyEl.style.left = x + "px";
  buddyEl.style.top = y + "px";
  buddyX = x;
  setBuddyTransform(" scale(1.12) rotate(-3deg)");
});

function buddyGroundTop() {
  return window.innerHeight * 0.72 - (buddyEl ? buddyEl.offsetHeight : 0);
}

function dropBuddy(e) {
  if (!buddyEl || !buddyDragging) return;
  buddyDragging = false;
  buddyEl.classList.remove("dragging");

  if (e && e.pointerId !== undefined) {
    try { buddyEl.releasePointerCapture(e.pointerId); } catch (err) { }
  }

  const groundY = buddyGroundTop();
  const currentY = parseFloat(buddyEl.style.top) || groundY;
  const distance = Math.abs(groundY - currentY);
  const fall = Math.min(0.8, 0.2 + distance / 1100);

  buddyEl.style.transition =
    "top " + fall + "s cubic-bezier(0.5, 0, 0.9, 0.55), transform 0.25s ease-out, opacity 0.6s ease";
  setBuddyTransform(" scale(1)");
  buddyEl.style.top = groundY + "px";

  setTimeout(() => {
    if (buddyDragging) return;
    buddyEl.style.transition = "transform 0.14s ease-out, opacity 0.6s ease";
    setBuddyTransform(" scale(1.12, 0.86)");
    setTimeout(() => {
      if (buddyDragging) return;
      buddyEl.style.transition = "transform 0.22s cubic-bezier(0.22, 1.3, 0.4, 1), opacity 0.6s ease";
      setBuddyTransform(" scale(1)");
    }, 130);
  }, fall * 1000);

  if (meadowMode) buddyAnim = setTimeout(walkBuddy, fall * 1000 + 900);
}

if (buddyEl) {
  buddyEl.addEventListener("pointerup", dropBuddy);
  buddyEl.addEventListener("pointercancel", dropBuddy);
}

function routeAudio(el) {
  if (!audioCtx || !gainNode || routed.has(el)) return;
  try {
    audioCtx.createMediaElementSource(el).connect(gainNode);
    routed.add(el);
  } catch (e) { }
}

function stopBuddy() {
  if (!buddyEl) return;
  if (buddyAnim) { clearTimeout(buddyAnim); buddyAnim = null; }
  buddyDragging = false;
  buddyEl.classList.remove("dragging");
}

function startBuddy() {
  if (!buddyEl) return;
  buddyX = window.innerWidth * 0.5;
  buddyEl.style.left = buddyX + "px";
  buddyEl.style.top = "";
  buddyEl.style.bottom = "";
  buddyFacing = 1;
  setBuddyTransform();
  buddyEl.style.transition = "opacity 0.6s ease";
  walkBuddy();
}

function applyMode(next) {
  modeIndex = next;
  const name = MODES[modeIndex];
  meadowMode = name === "meadow";

  document.getElementById("bg").style.opacity = name === "orange" ? "1" : "0";
  if (meadowEl) meadowEl.style.opacity = name === "meadow" ? "1" : "0";
  if (aeroEl) aeroEl.style.opacity = name === "aero" ? "1" : "0";

  document.body.classList.toggle("meadow", name === "meadow");
  document.body.classList.toggle("aero", name === "aero");

  if (starEl) {
    starEl.src = name === "meadow" ? "stargreen.png"
      : name === "aero" ? "starblue.png"
        : "star.png";
  }

  setFavicon(name === "meadow" ? "favicon-green.ico"
    : name === "aero" ? "favicon-blue.ico"
      : "favicon.ico");

  VIZ_COLORS = name === "meadow" ? VIZ_GREEN
    : name === "aero" ? VIZ_BLUE
      : VIZ_ORANGE;
  if (gradient) resize();

  titleFrames = buildTitleFrames(name === "meadow" ? TITLE_MEADOW
    : name === "aero" ? TITLE_AERO
      : TITLE_ORANGE);

  [track, meadowTrack, aeroTrack].forEach(a => { if (a) a.pause(); });

  const playing = name === "meadow" ? meadowTrack : name === "aero" ? aeroTrack : track;
  if (playing) {
    routeAudio(playing);
    playing.play().catch(() => { });
  }

  if (name === "meadow") startBuddy();
  else stopBuddy();
}

function toggleMeadow() {
  applyMode((modeIndex + 1) % MODES.length);
}

if (starEl) {
  starEl.addEventListener("click", e => {
    e.stopPropagation();
    if (!entered) return;

    whoosh.currentTime = 0;
    whoosh.play().catch(() => { });

    const nextName = MODES[(modeIndex + 1) % MODES.length];
    BOMB_ACCENT = nextName === "meadow" ? "#14b51f"
      : nextName === "aero" ? "#1e90ff"
        : "#f59409";

    const nb = document.createElement("canvas");
    nb.setAttribute("aria-hidden", "true");
    nb.style.cssText = "position:fixed;inset:0;z-index:22;pointer-events:none;background:transparent;transition:opacity 0.5s ease,background 0.45s ease";
    document.body.appendChild(nb);
    requestAnimationFrame(() => { nb.style.background = BOMB_ACCENT; });
    const nctx = nb.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    nb.width = W * dpr;
    nb.height = H * dpr;
    nb.style.width = W + "px";
    nb.style.height = H + "px";
    nctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const list = buildStickers(W, H);
    let si = 0;

    (function step() {
      for (let k = 0; k < PER_FRAME && si < list.length; k++, si++) drawSticker(nctx, list[si]);
      if (si < list.length) {
        requestAnimationFrame(step);
      } else {
        setTimeout(() => { nb.style.opacity = "0"; }, 300);
        setTimeout(() => nb.remove(), 900);
        try {
          toggleMeadow();
        } catch (err) {
          console.error("mode switch failed:", err);
        }
      }
    })();
  });
}

volume.addEventListener("input", syncVolume);

const prompt = document.querySelector(".enter p");

function syncPromptWidth() {
  if (!prompt) return;
  document.documentElement.style.setProperty(
    "--prompt-w", prompt.getBoundingClientRect().width + "px");
}

syncPromptWidth();
window.addEventListener("resize", debounce(syncPromptWidth, 150));

const tickerUnit = document.querySelector(".ticker .row").innerHTML;

function fillTickers() {
  document.querySelectorAll(".ticker .row, .ticker-top .row").forEach(row => {
    row.innerHTML = tickerUnit;
    let guard = 0;
    while (row.scrollWidth < window.innerWidth && guard++ < 40) row.innerHTML += tickerUnit;
    row.innerHTML += row.innerHTML;
  });
}

fillTickers();
window.addEventListener("resize", debounce(fillTickers, 200));

const TITLE_ORANGE = { text: "civx", mark: "\☀️", hold: 5 };
const TITLE_MEADOW = { text: "civx", mark: "\🌱", hold: 5 };
const TITLE_AERO = { text: "civx", mark: "💧", hold: 5 };

function buildTitleFrames(cfg) {
  const f = [];
  for (let i = 0; i <= cfg.text.length; i++) f.push(cfg.text.slice(0, i) + cfg.mark + cfg.text.slice(i));
  for (let i = cfg.text.length - 1; i > 0; i--) f.push(cfg.text.slice(0, i) + cfg.mark + cfg.text.slice(i));
  for (let i = 0; i < cfg.hold; i++) f.push(cfg.text);
  return f;
}

titleFrames = buildTitleFrames(TITLE_ORANGE);

const STEP_MS = 260;
const started = Date.now();

setInterval(() => {
  const i = Math.floor((Date.now() - started) / STEP_MS) % titleFrames.length;
  document.title = titleFrames[i];
}, STEP_MS);

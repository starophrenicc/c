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

let meadowSrc = null;
const meadowTrack = document.getElementById("meadowtrack");

function syncVolume() {
  const v = volume.value / 100;
  track.volume = v;
  meadowTrack.volume = v;
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
let titleFrames = ["civx"];
let buddyAnim = null;

let buddyX = null;

function walkBuddy() {
  if (buddyAnim) clearTimeout(buddyAnim);
  const minX = window.innerWidth * 0.35;
  const maxX = window.innerWidth * 0.62;
  const targetX = minX + Math.random() * (maxX - minX);
  const nowX = buddyEl.getBoundingClientRect().left;

  if (Math.abs(targetX - nowX) > 6) {
    buddyEl.style.transform = targetX > nowX ? "scaleX(-1)" : "scaleX(1)";
  }
  buddyX = targetX;

  const dur = 2.5 + Math.random() * 3;
  buddyEl.style.transition = "left " + dur + "s ease-in-out, opacity 0.6s ease";
  buddyEl.style.left = targetX + "px";
  buddyAnim = setTimeout(walkBuddy, dur * 1000 + 600 + Math.random() * 2000);
}

function toggleMeadow() {
  meadowMode = !meadowMode;
  if (meadowMode) {
    document.getElementById("bg").style.opacity = "0";
    meadowEl.style.opacity = "1";
    document.body.classList.add("meadow");
    if (starEl) starEl.src = "stargreen.png";
    setFavicon("favicon-green.ico");
    VIZ_COLORS = VIZ_GREEN;
    if (gradient) resize();
    titleFrames = buildTitleFrames(TITLE_MEADOW);

    track.pause();
    if (audioCtx && gainNode && !meadowSrc) {
      try {
        meadowSrc = audioCtx.createMediaElementSource(meadowTrack);
        meadowSrc.connect(gainNode);
      } catch (e) { }
    }
    meadowTrack.play().catch(() => { });
    buddyX = window.innerWidth * 0.5;
    buddyEl.style.left = buddyX + "px";
    buddyEl.style.transform = "scaleX(1)";
    buddyEl.style.transition = "opacity 0.6s ease";
    walkBuddy();
  } else {
    document.getElementById("bg").style.opacity = "1";
    meadowEl.style.opacity = "0";
    document.body.classList.remove("meadow");
    if (starEl) starEl.src = "star.png";
    setFavicon("favicon.ico");
    VIZ_COLORS = VIZ_ORANGE;
    if (gradient) resize();
    titleFrames = buildTitleFrames(TITLE_ORANGE);

    meadowTrack.pause();
    track.play().catch(() => { });
    if (buddyAnim) { clearTimeout(buddyAnim); buddyAnim = null; }
  }
}

if (starEl) {
  starEl.addEventListener("click", e => {
    e.stopPropagation();
    if (!entered) return;

    whoosh.currentTime = 0;
    whoosh.play().catch(() => { });

    BOMB_ACCENT = meadowMode ? "#f59409" : "#14b51f";

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
        toggleMeadow();
        setTimeout(() => { nb.style.opacity = "0"; }, 300);
        setTimeout(() => nb.remove(), 900);
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

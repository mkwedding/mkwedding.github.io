const params = new URLSearchParams(location.search);
const eventId = params.get("e") || "";

const grid = document.querySelector("#grid");
const statusLine = document.querySelector("#status");
const viewer = document.querySelector("#viewer");
const viewerImg = document.querySelector("#viewer-img");
const viewerCount = document.querySelector("#viewer-count");
const viewerDownload = document.querySelector("#viewer-download");

let photos = [];
let base = "";
let current = -1;

const enc = (name) => encodeURIComponent(name);
const largeUrl = (p) => `${base}/large/${enc(p.f)}`;
const thumbUrl = (p) => `${base}/thumb/${enc(p.f)}`;

function formatDate(exif) {
  // "2026:03:07 21:09:27" -> "7 March 2026"
  const m = /^(\d{4}):(\d{2}):(\d{2})/.exec(exif || "");
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" });
}

function showStatus(text) {
  statusLine.textContent = text;
  statusLine.hidden = false;
}

function buildGrid() {
  const frag = document.createDocumentFragment();
  photos.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile";
    btn.setAttribute("aria-label", `Open photo ${i + 1} of ${photos.length}`);
    const img = document.createElement("img");
    img.src = thumbUrl(p);
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = "";
    img.width = 320;
    img.height = 320;
    btn.append(img);
    btn.addEventListener("click", () => open(i, true));
    frag.append(btn);
  });
  grid.replaceChildren(frag);
}

function preload(i) {
  if (i < 0 || i >= photos.length) return;
  const img = new Image();
  img.src = largeUrl(photos[i]);
}

function show(i) {
  current = (i + photos.length) % photos.length;
  const p = photos[current];
  viewerImg.classList.remove("ready");
  viewerImg.onload = () => viewerImg.classList.add("ready");
  viewerImg.src = largeUrl(p);
  viewerImg.width = p.w;
  viewerImg.height = p.h;
  viewerCount.textContent = `${current + 1} of ${photos.length}`;
  viewerDownload.href = largeUrl(p);
  viewerDownload.setAttribute("download", p.f);
  preload(current + 1);
  preload(current - 1);
  history.replaceState({ photo: current }, "", `#${current + 1}`);
}

function open(i, push) {
  if (push) history.pushState({ photo: i }, "", `#${i + 1}`);
  viewer.hidden = false;
  document.body.classList.add("viewing");
  show(i);
  document.querySelector("#viewer-close").focus({ preventScroll: true });
}

function close(fromHistory) {
  if (viewer.hidden) return;
  viewer.hidden = true;
  document.body.classList.remove("viewing");
  const tile = grid.children[current];
  if (tile) tile.focus({ preventScroll: true });
  if (!fromHistory) history.back();
}

document.querySelector("#viewer-close").addEventListener("click", () => close(false));
document.querySelector("#viewer-prev").addEventListener("click", () => show(current - 1));
document.querySelector("#viewer-next").addEventListener("click", () => show(current + 1));

document.addEventListener("keydown", (e) => {
  if (viewer.hidden) return;
  if (e.key === "ArrowRight") show(current + 1);
  else if (e.key === "ArrowLeft") show(current - 1);
  else if (e.key === "Escape") close(false);
});

// Tap the dark area around the photo to close
document.querySelector("#viewer-stage").addEventListener("click", (e) => {
  if (e.target !== viewerImg) close(false);
});

// Swipe left/right to change photo, swipe down to close
let touchX = 0, touchY = 0;
viewer.addEventListener("touchstart", (e) => {
  touchX = e.touches[0].clientX;
  touchY = e.touches[0].clientY;
}, { passive: true });
viewer.addEventListener("touchend", (e) => {
  if (e.touches.length) return;
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
  else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close(false);
}, { passive: true });

window.addEventListener("popstate", (e) => {
  if (e.state && Number.isInteger(e.state.photo)) open(e.state.photo, false);
  else close(true);
});

async function start() {
  try {
    const res = await fetch(`gallery.json?v=${Date.now()}`, { cache: "no-store" });
    const gallery = await res.json();
    const events = gallery.events || [];
    const ev = events.find((x) => x.id === eventId);
    if (!ev || !ev.photos) {
      document.querySelector("#event-title").textContent = "Event not found";
      showStatus("Go back to all events and choose one from the list.");
      return;
    }
    document.title = `${ev.name} | Wedding Photos`;
    document.querySelector("#event-title").textContent = ev.name;

    const link = (ev.albumLinks || [])[0];
    if (link && link.url) {
      const a = document.querySelector("#originals");
      a.href = link.url;
      a.hidden = false;
    }

    base = ev.photos.replace(/\/[^/]*$/, "");
    const data = await (await fetch(ev.photos)).json();
    photos = data.photos;

    const date = formatDate(photos.find((p) => p.d)?.d);
    document.querySelector("#event-meta").textContent =
      `${photos.length.toLocaleString("en-NZ")} photos${date ? `, ${date}` : ""}`;

    buildGrid();

    const n = parseInt(location.hash.slice(1), 10);
    if (n >= 1 && n <= photos.length) {
      history.replaceState(null, "", location.pathname + location.search);
      open(n - 1, true);
    }
  } catch {
    showStatus("The photos could not load. Refresh the page to try again.");
  }
}

start();

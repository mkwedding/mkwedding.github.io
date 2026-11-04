// Anonymous visitor log: one random ID per browser, time on page while visible,
// photos opened and which event pages were visited. Data goes to a Google Sheet.
(() => {
  const ENDPOINT =
    "https://script.google.com/macros/s/AKfycbzMPmEcf66qnKgOylJRe3x3AL1UnR2MmMTNi17Qqa68tc4AIm-0pJHHh4XxNfCmtAJvuw/exec";
  const PING_MS = 30000;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  const newId = () =>
    (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`)
      .slice(0, 13);

  let id = store.get("mk-device");
  if (!id) { id = newId(); store.set("mk-device", id); }

  // ?me=Mayuresh-phone labels this device in the sheet (remembered afterwards)
  const params = new URLSearchParams(location.search);
  const me = params.get("me");
  if (me) store.set("mk-label", me.slice(0, 40));
  const label = store.get("mk-label") || "";

  const ua = navigator.userAgent;
  const type = /iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
    ? "Tablet" : /Mobi|iPhone|Android/i.test(ua) ? "Phone" : "Computer";
  const os = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "iOS"
    : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac" : "Other";
  const app = /FBAN|FBAV/.test(ua) ? "Facebook app" : /Instagram/.test(ua) ? "Instagram app"
    : /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet"
    : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) ? "Safari" : "Browser";

  const base = {
    id,
    label,
    type,
    browser: `${app} on ${os}`,
    screen: `${screen.width}x${screen.height}`,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    lang: navigator.language || "",
    event: params.get("e") || "",
  };

  function send(payload) {
    const body = JSON.stringify({ ...base, ...payload });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }))) return;
    } catch { /* fall through */ }
    fetch(ENDPOINT, { method: "POST", mode: "no-cors", keepalive: true, body, headers: { "Content-Type": "text/plain" } })
      .catch(() => {});
  }

  // Count only time the page is actually on screen
  let visibleSince = document.visibilityState === "visible" ? Date.now() : null;
  let pending = 0;
  let photos = 0;

  function collect() {
    if (visibleSince) {
      pending += (Date.now() - visibleSince) / 1000;
      visibleSince = document.visibilityState === "visible" ? Date.now() : null;
    }
  }

  function flush() {
    collect();
    const secs = Math.round(pending);
    if (secs < 1 && !photos) return;
    pending -= secs;
    send({ kind: "ping", secs, photos });
    photos = 0;
  }

  send({ kind: "open", secs: 0, photos: 0 });

  setInterval(() => { if (document.visibilityState === "visible") flush(); }, PING_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
    else visibleSince = Date.now();
  });
  window.addEventListener("pagehide", flush);

  // Called by the gallery each time a photo is opened in the viewer
  window.mkTrack = { photo() { photos += 1; } };
})();

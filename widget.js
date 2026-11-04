// Small live pill in the corner: alternates between
// "Married for …" (ticking) and the time in Auckland and India.
(() => {
  // Wedding moment: just after the antarpat, 8 March 2026, India time
  const MARRIED_AT = new Date("2026-03-08T11:40:00+05:30").getTime();
  const SWITCH_MS = 7000;

  const pill = document.createElement("div");
  pill.className = "live-pill";
  pill.setAttribute("aria-live", "off");
  pill.innerHTML = `
    <span class="live-dot" aria-hidden="true"></span>
    <span class="live-faces">
      <span class="live-face active" data-face="married">
        <span class="live-label">Married</span>
        <span class="live-value" data-married></span>
      </span>
      <span class="live-face" data-face="clocks">
        <span class="live-label">Auckland</span>
        <span class="live-value" data-akl></span>
        <span class="live-sep" aria-hidden="true">·</span>
        <span class="live-label">India</span>
        <span class="live-value" data-ind></span>
      </span>
    </span>`;
  document.body.append(pill);

  const married = pill.querySelector("[data-married]");
  const akl = pill.querySelector("[data-akl]");
  const ind = pill.querySelector("[data-ind]");
  const faces = [...pill.querySelectorAll(".live-face")];

  const two = (n) => String(n).padStart(2, "0");
  const clock = (tz) =>
    new Date().toLocaleTimeString("en-NZ", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true })
      .replace(/\s?([ap])\.?m\.?/i, (_, x) => ` ${x.toLowerCase()}m`);

  function tick() {
    let s = Math.max(0, Math.floor((Date.now() - MARRIED_AT) / 1000));
    const days = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60); s %= 60;
    married.textContent = `${days.toLocaleString("en-NZ")} days  ${two(h)}:${two(m)}:${two(s)}`;
    akl.textContent = clock("Pacific/Auckland");
    ind.textContent = clock("Asia/Kolkata");
  }

  // Size the pill to whichever face is showing, so it glides between widths
  const sizer = () => {
    const active = pill.querySelector(".live-face.active");
    pill.style.setProperty("--face-w", `${active.scrollWidth}px`);
  };

  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    faces[i].classList.remove("active");
    i = (i + 1) % faces.length;
    faces[i].classList.add("active");
    sizer();
  }, SWITCH_MS);

  tick();
  sizer();
  setInterval(tick, 1000);
  window.addEventListener("resize", sizer);
  if (document.fonts) document.fonts.ready.then(sizer);
})();

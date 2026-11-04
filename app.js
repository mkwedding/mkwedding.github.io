let gallery = { people: [] };
let activeSuggestion = -1;

const search = document.querySelector("#name-search");
const suggestions = document.querySelector("#suggestions");
const grid = document.querySelector("#folder-grid");
const empty = document.querySelector("#empty");

function validAlbumUrl(value) {
  try {
    const url = new URL(value);
    const allowed = ["icloud.com", "1drv.ms", "onedrive.live.com", "onedrive.com", "sharepoint.com"];
    return url.protocol === "https:" &&
      allowed.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function matchesFor(query) {
  const needle = query.trim().toLowerCase();
  return gallery.people.filter((person) => person.name.toLowerCase().includes(needle));
}

function albumLink(url, text, label) {
  const link = node("a", "", text);
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  if (label) link.setAttribute("aria-label", label);
  return link;
}

function folderCard(person) {
  const links = person.albumLinks.filter((link) => validAlbumUrl(link.url));
  const row = node("li", `album${links.length === 1 ? " album-single" : ""}`);
  const leader = node("span", "album-leader");
  leader.setAttribute("aria-hidden", "true");
  row.append(node("span", "album-name", person.name), leader);

  if (links.length) {
    const wrap = node("span", "album-links");
    if (links.length === 1) {
      wrap.append(albumLink(links[0].url, "View photos", `View photos: ${person.name}`));
    } else {
      links.forEach((album, index) => wrap.append(albumLink(album.url, album.label || `Part ${index + 1}`)));
    }
    row.append(wrap);
  } else {
    row.append(node("span", "album-status", "Coming soon"));
  }
  return row;
}

function renderFolders(query = "") {
  const matches = matchesFor(query);
  grid.replaceChildren(...matches.map(folderCard));
  empty.hidden = matches.length > 0;
  empty.textContent = gallery.people.length
    ? "No album with that name yet. Try your first name only."
    : "Albums will appear here once the photos are ready.";
}

function closeSuggestions() {
  suggestions.hidden = true;
  suggestions.replaceChildren();
  search.setAttribute("aria-expanded", "false");
  search.removeAttribute("aria-activedescendant");
  activeSuggestion = -1;
}

function chooseSuggestion(name) {
  search.value = name;
  renderFolders(name);
  closeSuggestions();
  search.focus();
}

function renderSuggestions(query) {
  const names = query.trim() ? matchesFor(query).slice(0, 8).map((person) => person.name) : [];
  if (!names.length) {
    closeSuggestions();
    return;
  }
  suggestions.replaceChildren(...names.map((name, index) => {
    const item = node("li", "");
    item.setAttribute("role", "option");
    item.id = `suggestion-${index}`;
    const button = node("button", "", name);
    button.type = "button";
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => chooseSuggestion(name));
    item.append(button);
    return item;
  }));
  suggestions.hidden = false;
  search.setAttribute("aria-expanded", "true");
  activeSuggestion = -1;
}

function moveSuggestion(direction) {
  const options = [...suggestions.querySelectorAll("li")];
  if (!options.length) return;
  activeSuggestion = (activeSuggestion + direction + options.length) % options.length;
  options.forEach((option, index) => option.classList.toggle("active", index === activeSuggestion));
  search.setAttribute("aria-activedescendant", options[activeSuggestion].id);
}

search.addEventListener("input", () => {
  renderFolders(search.value);
  renderSuggestions(search.value);
});
search.addEventListener("focus", () => renderSuggestions(search.value));
search.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveSuggestion(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    moveSuggestion(-1);
  } else if (event.key === "Enter" && activeSuggestion >= 0) {
    event.preventDefault();
    chooseSuggestion(suggestions.children[activeSuggestion].textContent);
  } else if (event.key === "Escape") {
    closeSuggestions();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-box")) closeSuggestions();
});

async function start() {
  try {
    const response = await fetch(`gallery.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error();
    gallery = await response.json();
    renderFolders();
  } catch {
    empty.textContent = "The album list could not load. Refresh the page to try again.";
  }
}

start();

/* ---------- Toran: a marigold garland hung across the top ---------- */
const SVG = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function drawToran() {
  const host = document.querySelector("#toran");
  if (!host) return;
  const width = host.clientWidth;
  const height = host.clientHeight;
  const small = width < 620;
  const r = small ? 7.5 : 10;          // marigold radius
  const step = r * 1.72;               // bead spacing down a strand
  const gap = small ? 30 : 42;         // spacing between strands
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "xMidYMin meet" });

  const defs = svgEl("defs", {});
  [["mg-y", "#ffd65a", "#f6b21b", "#d98a07"], ["mg-o", "#ffa54a", "#ec7a1c", "#b9500c"]].forEach(([id, a, b, c]) => {
    const g = svgEl("radialGradient", { id, cx: "42%", cy: "38%", r: "65%" });
    g.append(svgEl("stop", { offset: "0%", "stop-color": a }), svgEl("stop", { offset: "60%", "stop-color": b }), svgEl("stop", { offset: "100%", "stop-color": c }));
    defs.append(g);
  });
  svg.append(defs);

  // Rope with a row of marigolds along it
  svg.append(svgEl("rect", { x: 0, y: 0, width, height: r * .9, fill: "#7a3d12" }));

  const count = Math.floor(width / gap) + 2;
  const offset = (width - (count - 1) * gap) / 2;
  for (let i = 0; i < count; i++) {
    const x = offset + i * gap;
    const long = i % 2 === 0;
    const centre = 1 - Math.abs(i - (count - 1) / 2) / ((count - 1) / 2 || 1);
    const beads = (long ? (small ? 5 : 6) : (small ? 3 : 4)) + Math.round(centre * (small ? 1 : 2));
    const strand = svgEl("g", { class: "strand" });
    strand.style.setProperty("--d", `${(Math.abs(i - count / 2) * 0.035).toFixed(2)}s`);
    strand.style.setProperty("--r", `${i % 2 ? -4 : 5}deg`);
    strand.append(svgEl("line", { x1: x, y1: 0, x2: x, y2: r + beads * step, stroke: "#5b2c0c", "stroke-width": 1.2 }));
    for (let b = 0; b < beads; b++) {
      const y = r * 1.1 + b * step;
      const orange = (b + i) % 3 === 0;
      strand.append(svgEl("circle", { cx: x, cy: y, r, fill: `url(#${orange ? "mg-o" : "mg-y"})` }));
      // ruffled petal edge
      strand.append(svgEl("circle", { cx: x, cy: y, r: r * .82, fill: "none", stroke: orange ? "#c25f10" : "#d99a0c", "stroke-width": r * .22, "stroke-dasharray": `${r * .18} ${r * .22}`, opacity: .55 }));
    }
    // mango leaf at the end of long strands
    if (long) {
      const ly = r * 1.1 + (beads - 1) * step + r * .8;
      const lh = r * 2.6, lw = r * .95;
      strand.append(svgEl("path", { d: `M${x} ${ly} C ${x + lw} ${ly + lh * .35}, ${x + lw * .6} ${ly + lh * .8}, ${x} ${ly + lh} C ${x - lw * .6} ${ly + lh * .8}, ${x - lw} ${ly + lh * .35}, ${x} ${ly} Z`, fill: "#5f7d2c" }));
      strand.append(svgEl("line", { x1: x, y1: ly + 2, x2: x, y2: ly + lh - 3, stroke: "#88a64a", "stroke-width": 1 }));
    }
    svg.append(strand);
  }
  // top row of flowers on the rope, drawn last so it covers strand tops
  for (let x = r * .6; x < width + r; x += r * 1.65) {
    svg.append(svgEl("circle", { cx: x, cy: r * .2, r: r * .95, fill: `url(#${Math.round(x / (r * 1.65)) % 2 ? "mg-o" : "mg-y"})` }));
  }
  host.replaceChildren(svg);
}

let lastToranWidth = 0;
function maybeRedrawToran() {
  const w = document.querySelector("#toran")?.clientWidth || 0;
  if (w !== lastToranWidth) { lastToranWidth = w; drawToran(); }
}
maybeRedrawToran();
window.addEventListener("resize", () => {
  clearTimeout(maybeRedrawToran.t);
  maybeRedrawToran.t = setTimeout(maybeRedrawToran, 150);
});

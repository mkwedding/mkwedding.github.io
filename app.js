let gallery = { events: [] };

const list = document.querySelector("#folder-grid");
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

function albumLink(url, text, label) {
  const link = node("a", "", text);
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  if (label) link.setAttribute("aria-label", label);
  return link;
}

const SLIDE_MS = 5000;
const slideshows = [];

function coverCard(ev, index) {
  const row = node("li", "cover-card");
  const a = node("a", "cover-link");
  a.href = `event.html?e=${encodeURIComponent(ev.id)}`;
  a.setAttribute("aria-label", `View photos: ${ev.name}`);

  const imgs = ev.covers.map((src, i) => {
    const img = node("img", "cover-img");
    img.alt = "";
    img.decoding = "async";
    if (i === 0) {
      img.src = src;
      img.classList.add("active");
    } else {
      img.dataset.src = src; // loaded once the first photo is in
    }
    return img;
  });

  // Load the rest quietly after the first photo has arrived
  const loadRest = () => imgs.forEach((img) => { if (img.dataset.src) img.src = img.dataset.src; });
  if (imgs[0].complete) setTimeout(loadRest, 300);
  else imgs[0].addEventListener("load", () => setTimeout(loadRest, 300), { once: true });

  const text = node("span", "cover-text");
  text.append(node("span", "cover-name", ev.name), node("span", "cover-cta", "View photos"));
  a.append(...imgs, text);
  row.append(a);

  if (imgs.length > 1) slideshows.push({ imgs, current: 0, offset: index * 1700 });
  return row;
}

function advance(show) {
  const next = (show.current + 1) % show.imgs.length;
  const img = show.imgs[next];
  if (!img.complete || !img.naturalWidth) return; // not loaded yet, try next tick
  show.imgs[show.current].classList.remove("active");
  img.classList.add("active");
  show.current = next;
}

function startSlideshows() {
  // Stagger the cards so they don't all change at the same moment
  slideshows.forEach((show) => {
    setTimeout(() => {
      setInterval(() => { if (!document.hidden) advance(show); }, SLIDE_MS);
    }, show.offset);
  });
}

function eventRow(person, index) {
  if (person.covers && person.covers.length && person.photos) return coverCard(person, index);
  const links = (person.albumLinks || []).filter((link) => validAlbumUrl(link.url));
  const row = node("li", "album album-single");
  row.append(node("span", "album-name", person.name));
  const wrap = node("span", "album-links");
  if (person.photos) {
    const a = node("a", "", "View photos");
    a.href = `event.html?e=${encodeURIComponent(person.id)}`;
    a.setAttribute("aria-label", `View photos: ${person.name}`);
    wrap.append(a);
  } else if (links.length) {
    wrap.append(albumLink(links[0].url, "View photos", `View photos: ${person.name}`));
  } else {
    row.classList.remove("album-single");
    row.append(node("span", "album-status", "Coming soon"));
    return row;
  }
  row.append(wrap);
  return row;
}

function render() {
  const events = gallery.events || gallery.people || [];
  list.replaceChildren(...events.map(eventRow));
  empty.hidden = events.length > 0;
  startSlideshows();
}

async function start() {
  try {
    const response = await fetch(`gallery.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error();
    gallery = await response.json();
    render();
  } catch {
    empty.textContent = "The photos could not load. Refresh the page to try again.";
  }
}

start();

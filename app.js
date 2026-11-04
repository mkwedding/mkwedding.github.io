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

function eventRow(person) {
  const links = person.albumLinks.filter((link) => validAlbumUrl(link.url));
  const row = node("li", `album${links.length === 1 ? " album-single" : ""}`);
  row.append(node("span", "album-name", person.name));

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

function render() {
  const events = gallery.events || gallery.people || [];
  list.replaceChildren(...events.map(eventRow));
  empty.hidden = events.length > 0;
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

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


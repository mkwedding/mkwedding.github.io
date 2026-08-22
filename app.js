const tones = ["clay", "sage", "amber", "rose", "ink", "moss"];
let gallery = { event: {}, people: [] };

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function validAlbumUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "icloud.com" || url.hostname.endsWith(".icloud.com"));
  } catch {
    return false;
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function render(query = "") {
  const needle = query.trim().toLowerCase();
  const people = gallery.people.filter((person) => person.name.toLowerCase().includes(needle));
  const grid = document.querySelector("#people-grid");
  grid.replaceChildren();

  people.forEach((person, index) => {
    const card = element("article", "person-card");
    const monogram = element("div", `monogram ${tones[index % tones.length]}`);
    monogram.append(element("span", "", initials(person.name)), element("small", "", String(index + 1).padStart(2, "0")));
    const details = element("div", "person-details");
    details.append(element("h3", "", person.name), element("p", "", `${Number(person.photoCount).toLocaleString()} photographs`));

    const links = person.albumLinks.filter((link) => validAlbumUrl(link.url));
    if (links.length) {
      const linkBox = element("div", "album-links");
      links.forEach((link) => {
        const anchor = element("a", "", link.label || "Open iCloud album");
        anchor.href = link.url;
        anchor.target = "_blank";
        anchor.rel = "noreferrer";
        anchor.append(element("span", "", "↗"));
        linkBox.append(anchor);
      });
      details.append(linkBox);
    } else {
      details.append(element("span", "pending", "iCloud album being prepared"));
    }
    card.append(monogram, details);
    grid.append(card);
  });

  const empty = document.querySelector("#empty");
  empty.hidden = people.length > 0;
  empty.textContent = gallery.people.length
    ? "No matching person was found."
    : "The wedding collection is being prepared. Please check back soon.";
}

async function start() {
  try {
    const response = await fetch("gallery.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Gallery data is unavailable");
    gallery = await response.json();
    document.querySelector("#event-title").textContent = gallery.event.title;
    document.querySelector("#event-subtitle").textContent = gallery.event.subtitle;
    document.querySelector("#event-location").textContent = gallery.event.location;
    document.querySelector("#people-count").textContent = gallery.people.length
      ? `${gallery.people.length} featured people`
      : "Collection in preparation";
    render();
  } catch {
    document.querySelector("#empty").textContent = "The collection is temporarily unavailable.";
  }
}

document.querySelector("#search").addEventListener("input", (event) => render(event.target.value));
start();

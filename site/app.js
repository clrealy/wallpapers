(() => {
  const $ = (sel) => document.querySelector(sel);
  const grid = $("#grid");
  const status = $("#status");
  const filters = $("#filters");
  const search = $("#search");
  const viewer = $("#viewer");
  const viewerImg = $("#viewer-img");

  let all = [];
  let shown = [];
  let category = "all";
  let current = -1;

  // Theme toggle, remembered per browser.
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch {}
  $("#theme").addEventListener("click", () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  });

  const resLabel = (w, h) => {
    const long = Math.max(w, h);
    if (long >= 7680) return "8K";
    if (long >= 5120) return "5K";
    if (long >= 3840) return "4K";
    if (long >= 2560) return "QHD";
    if (long >= 1920) return "FHD";
    return `${w}×${h}`;
  };

  const fmtSize = (bytes) =>
    bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

  function renderFilters() {
    const cats = ["all", ...new Set(all.map((w) => w.category))];
    filters.replaceChildren(
      ...cats.map((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.textContent = c;
        b.setAttribute("aria-pressed", String(c === category));
        b.addEventListener("click", () => {
          category = c;
          filters.querySelectorAll(".chip").forEach((el) =>
            el.setAttribute("aria-pressed", String(el === b)));
          render();
        });
        return b;
      })
    );
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    shown = all.filter((w) =>
      (category === "all" || w.category === category) &&
      (!q || `${w.title} ${w.category}`.toLowerCase().includes(q)));

    grid.replaceChildren(
      ...shown.map((w, i) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "card";
        btn.setAttribute("aria-label", `Preview ${w.title}`);

        const img = document.createElement("img");
        img.loading = "lazy";
        img.decoding = "async";
        img.alt = w.title;
        img.src = w.thumb;
        if (img.complete) img.classList.add("loaded");
        else img.addEventListener("load", () => img.classList.add("loaded"), { once: true });

        const label = document.createElement("span");
        label.className = "label";
        const name = document.createElement("span");
        name.textContent = w.title;
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = resLabel(w.width, w.height);
        label.append(name, badge);

        btn.append(img, label);
        btn.addEventListener("click", () => open(i));
        li.append(btn);
        return li;
      })
    );

    status.textContent = shown.length ? "" : "No wallpapers match that 😔";
    $("#count").textContent = `${shown.length} of ${all.length} wallpapers`;
  }

  function open(i) {
    if (!shown.length) return;
    current = (i + shown.length) % shown.length;
    const w = shown[current];
    viewerImg.src = w.thumb; // instant preview, swapped for full-res once loaded
    viewerImg.alt = w.title;
    const full = new Image();
    full.onload = () => { if (shown[current] === w) viewerImg.src = w.src; };
    full.src = w.src;

    $("#viewer-title").textContent = w.title;
    $("#viewer-meta").textContent =
      `${w.category} · ${w.width}×${w.height} · ${fmtSize(w.size)}`;
    $("#viewer-open").href = w.src;
    const dl = $("#viewer-download");
    dl.href = w.src;
    dl.download = w.src.split("/").pop();

    history.replaceState(null, "", `#${encodeURIComponent(w.src)}`);
    if (!viewer.open) viewer.showModal();
  }

  function close() {
    viewer.close();
  }

  viewer.addEventListener("close", () => {
    history.replaceState(null, "", location.pathname + location.search);
  });
  viewer.querySelector(".prev").addEventListener("click", () => open(current - 1));
  viewer.querySelector(".next").addEventListener("click", () => open(current + 1));
  viewer.querySelector(".close").addEventListener("click", close);
  viewer.addEventListener("click", (e) => { if (e.target === viewer) close(); });
  viewer.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") open(current - 1);
    if (e.key === "ArrowRight") open(current + 1);
  });

  // Swipe between wallpapers on touch screens.
  let touchX = null;
  viewer.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) open(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  search.addEventListener("input", render);
  $("#shuffle").addEventListener("click", () =>
    open(Math.floor(Math.random() * shown.length)));

  fetch("wallpapers.json")
    .then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then((data) => {
      all = data;
      renderFilters();
      render();
      const hash = decodeURIComponent(location.hash.slice(1));
      const i = shown.findIndex((w) => w.src === hash);
      if (i >= 0) open(i);
    })
    .catch(() => {
      status.textContent = "Couldn't load wallpapers. Try refreshing.";
    });
})();

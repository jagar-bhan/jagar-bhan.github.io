document.addEventListener("DOMContentLoaded", () => {
  // open overlays
  document.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open");
      const panel = document.getElementById(id);
      if (panel) panel.classList.add("is-open");
    });
  });

  // close overlays
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-close");
      const panel = document.getElementById(id);
      if (panel) panel.classList.remove("is-open");
    });
  });

  // click outside overlay to close
  document.querySelectorAll(".overlay").forEach((ov) => {
    ov.addEventListener("click", (e) => {
      if (e.target === ov) ov.classList.remove("is-open");
    });
  });

  // nav panel closes when clicking a section
  document
    .querySelectorAll("#navPanel .overlay-list a")
    .forEach((link) => {
      link.addEventListener("click", () => {
        const panel = document.getElementById("navPanel");
        if (panel) panel.classList.remove("is-open");
      });
    });

  // fade-in panels on scroll (projects + about)
  const panelObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        } else {
          entry.target.classList.remove("visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".fade-panel").forEach((el) => {
    panelObserver.observe(el);
  });

  // fade-in each reading card on scroll
  const readingObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        } else {
          entry.target.classList.remove("visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".reading-card").forEach((card) => {
    readingObserver.observe(card);
  });

  // hover previews for project cards
  document.querySelectorAll(".card").forEach((card) => {
    const previewBody = card.querySelector(".preview-body");
    if (!previewBody) return;

    const defaultText =
      previewBody.getAttribute("data-default") || previewBody.textContent;

    const links = card.querySelectorAll(".link-list a");
    links.forEach((link) => {
      const msg = link.getAttribute("data-preview") || link.textContent;
      link.addEventListener("mouseenter", () => {
        previewBody.textContent = msg;
      });
      link.addEventListener("focus", () => {
        previewBody.textContent = msg;
      });
    });

    card.addEventListener("mouseleave", () => {
      previewBody.textContent = defaultText;
    });
  });
});

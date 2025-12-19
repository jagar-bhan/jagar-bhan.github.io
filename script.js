document.addEventListener("DOMContentLoaded", () => {
  // index menu
  const menuToggle = document.querySelector(".menu-toggle");
  const menuPopover = document.getElementById("menuPopover");

  if (menuToggle && menuPopover) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      menuPopover.classList.toggle("is-open");
    });

    document.addEventListener("click", (e) => {
      if (
        menuPopover.classList.contains("is-open") &&
        !menuPopover.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        menuPopover.classList.remove("is-open");
      }
    });

    menuPopover.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menuPopover.classList.remove("is-open");
      });
    });
  }

  // info menu
  const infoToggle = document.querySelector(".info-toggle");
  const infoPopover = document.getElementById("infoPopover");

  if (infoToggle && infoPopover) {
    const infoClose = infoPopover.querySelector(".info-close");

    infoToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      infoPopover.classList.toggle("is-open");
    });

    if (infoClose) {
      infoClose.addEventListener("click", (e) => {
        e.stopPropagation();
        infoPopover.classList.remove("is-open");
      });
    }

    document.addEventListener("click", (e) => {
      if (
        infoPopover.classList.contains("is-open") &&
        !infoPopover.contains(e.target) &&
        !infoToggle.contains(e.target)
      ) {
        infoPopover.classList.remove("is-open");
      }
    });
  }

  // header title appears after hero
  const hero = document.querySelector(".hero");
  const topTitle = document.querySelector(".top-title");

  if (hero && topTitle) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            topTitle.classList.remove("is-visible");
          } else {
            topTitle.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.4 }
    );

    heroObserver.observe(hero);
  }

  // fade-in panels
  const panelObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".fade-panel").forEach((el) => {
    panelObserver.observe(el);
  });

  // project hover previews
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

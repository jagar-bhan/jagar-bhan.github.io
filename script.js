document.addEventListener("DOMContentLoaded", () => {
  // small index menu popover
  const menuToggle = document.querySelector(".menu-toggle");
  const menuPopover = document.getElementById("menuPopover");

  if (menuToggle && menuPopover) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      menuPopover.classList.toggle("is-open");
    });

    // close when clicking outside
    document.addEventListener("click", (e) => {
      if (
        menuPopover.classList.contains("is-open") &&
        !menuPopover.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        menuPopover.classList.remove("is-open");
      }
    });

    // close when clicking a menu link
    menuPopover.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menuPopover.classList.remove("is-open");
      });
    });
  }

  // info popover
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

  // fade-in panels on scroll (projects, about)
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

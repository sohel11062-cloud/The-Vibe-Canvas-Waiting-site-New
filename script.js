const revealItems = document.querySelectorAll(".reveal");
const heroImage = document.querySelector(".hero__media img");
const gridStory = document.querySelector(".grid-story");
const gridImage = document.querySelector(".grid-story__image img");
const tiltItems = document.querySelectorAll(".tilt");
const magnets = document.querySelectorAll(".magnetic");
const scrollButtons = document.querySelectorAll("[data-scroll]");
const topbar = document.querySelector(".topbar");

const countdownTargets = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  daysSecondary: document.getElementById("days-secondary"),
  hoursSecondary: document.getElementById("hours-secondary"),
  minutesSecondary: document.getElementById("minutes-secondary"),
  secondsSecondary: document.getElementById("seconds-secondary")
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const prefersFinePointer = window.matchMedia("(pointer: fine)").matches;
let ticking = false;

if (document.documentElement.classList.contains("intro-active")) {
  window.setTimeout(() => {
    document.documentElement.classList.remove("intro-active");
  }, 3400);
}

function setText(node, value) {
  if (node) {
    node.textContent = value;
  }
}

function updateCountdown() {
  const launchDate = new Date("2026-06-11T06:30:00Z").getTime();
  const distance = Math.max(0, launchDate - Date.now());

  const values = {
    days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, "0"),
    hours: String(Math.floor((distance / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
    minutes: String(Math.floor((distance / (1000 * 60)) % 60)).padStart(2, "0"),
    seconds: String(Math.floor((distance / 1000) % 60)).padStart(2, "0")
  };

  setText(countdownTargets.days, values.days);
  setText(countdownTargets.hours, values.hours);
  setText(countdownTargets.minutes, values.minutes);
  setText(countdownTargets.seconds, values.seconds);
  setText(countdownTargets.daysSecondary, values.days);
  setText(countdownTargets.hoursSecondary, values.hours);
  setText(countdownTargets.minutesSecondary, values.minutes);
  setText(countdownTargets.secondsSecondary, values.seconds);
}

function initReveal() {
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px"
  });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 36, 180)}ms`;
    observer.observe(item);
  });
}

function updateScrollState() {
  if (topbar) {
    topbar.classList.toggle("is-scrolled", window.scrollY > 16);
  }

  if (!prefersReducedMotion) {
    const viewportHeight = Math.max(window.innerHeight, 1);
    const scrollRatio = Math.min(window.scrollY / viewportHeight, 1);

    if (heroImage) {
      heroImage.style.transform = `translate3d(0, ${scrollRatio * 18}px, 0) scale(1.035)`;
    }

    if (gridStory) {
      const rect = gridStory.getBoundingClientRect();
      const rawProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const progress = Math.min(1, Math.max(0, rawProgress));
      const signatureWindow = Math.sin(progress * Math.PI);
      const signatureOpacity = Math.max(0, Math.min(1, (signatureWindow - 0.22) / 0.58));

      gridStory.style.setProperty("--grid-progress", progress.toFixed(3));
      gridStory.style.setProperty("--signature-opacity", signatureOpacity.toFixed(3));
      gridStory.style.setProperty("--signature-scale", (0.9 + signatureOpacity * 0.14).toFixed(3));
      gridStory.style.setProperty("--signature-y", `${(1 - signatureOpacity) * 52 - progress * 18}px`);

      if (gridImage) {
        gridImage.style.transform = `translate3d(0, ${(0.5 - progress) * 34}px, 0) scale(${1.04 + progress * 0.035})`;
      }
    }
  }

  ticking = false;
}

function requestScrollUpdate() {
  if (!ticking) {
    window.requestAnimationFrame(updateScrollState);
    ticking = true;
  }
}

function bindTilt() {
  if (prefersReducedMotion || !prefersFinePointer) {
    return;
  }

  tiltItems.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 4;
      const rotateX = (0.5 - py) * 3;
      item.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    item.addEventListener("pointerleave", () => {
      item.style.transform = "";
    });
  });
}

function bindMagneticButtons() {
  if (prefersReducedMotion || !prefersFinePointer) {
    return;
  }

  magnets.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      item.style.transform = `translate(${dx * 0.035}px, ${dy * 0.035}px)`;
    });

    item.addEventListener("pointerleave", () => {
      item.style.transform = "";
    });
  });
}

function bindScrollButtons() {
  scrollButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selector = button.getAttribute("data-scroll");
      const target = selector ? document.querySelector(selector) : null;
      if (target) {
        target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      }
    });
  });
}

initReveal();
bindTilt();
bindMagneticButtons();
bindScrollButtons();
updateCountdown();
updateScrollState();

window.setInterval(updateCountdown, 1000);
window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);

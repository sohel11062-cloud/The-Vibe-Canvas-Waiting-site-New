const body = document.body;
const loader = document.getElementById("loader");
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
const revealItems = document.querySelectorAll(".reveal");
const parallaxItems = document.querySelectorAll("[data-depth]");
const tiltCard = document.querySelector(".tilt");
const magnets = document.querySelectorAll(".magnetic");
const scrollButtons = document.querySelectorAll("[data-scroll]");
const topbar = document.querySelector(".topbar");
const sections = document.querySelectorAll("main section");

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

body.classList.add("is-loading");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  pointerX: window.innerWidth * 0.5,
  pointerY: window.innerHeight * 0.5,
  scrollY: window.scrollY,
  running: !document.hidden
};

const particles = [];
let particleCount = Math.min(window.innerWidth < 900 ? 28 : 46, Math.round((window.innerWidth * window.innerHeight) / 34000));

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  particleCount = Math.min(window.innerWidth < 900 ? 28 : 46, Math.round((window.innerWidth * window.innerHeight) / 34000));
  canvas.width = state.width * dpr;
  canvas.height = state.height * dpr;
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createParticle() {
  return {
    x: Math.random() * state.width,
    y: Math.random() * state.height,
    size: Math.random() * 1.4 + 0.5,
    speedX: (Math.random() - 0.5) * 0.08,
    speedY: Math.random() * 0.12 + 0.04,
    hue: Math.random() > 0.5 ? 188 : 292,
    alpha: Math.random() * 0.22 + 0.06
  };
}

function initParticles() {
  particles.length = 0;
  for (let i = 0; i < particleCount; i += 1) {
    particles.push(createParticle());
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, state.width, state.height);

  const glow = ctx.createRadialGradient(
    state.pointerX,
    state.pointerY,
    0,
    state.pointerX,
    state.pointerY,
    Math.max(state.width, state.height) * 0.35
  );
  glow.addColorStop(0, "rgba(123, 246, 255, 0.05)");
  glow.addColorStop(0.45, "rgba(210, 12, 255, 0.04)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, state.width, state.height);

  for (const particle of particles) {
    particle.x += particle.speedX + (state.pointerX - state.width / 2) * 0.000004;
    particle.y += particle.speedY;

    if (particle.y > state.height + 18) {
      particle.y = -12;
      particle.x = Math.random() * state.width;
    }

    if (particle.x > state.width + 18) {
      particle.x = -18;
    } else if (particle.x < -18) {
      particle.x = state.width + 18;
    }

    ctx.beginPath();
    ctx.fillStyle = `hsla(${particle.hue}, 100%, 72%, ${particle.alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = `hsla(${particle.hue}, 100%, 72%, 0.18)`;
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

function animate() {
  if (!state.running || prefersReducedMotion) {
    return;
  }

  drawParticles();
  window.requestAnimationFrame(animate);
}

function updateCountdown() {
  const launchDate = new Date("2026-06-11T06:30:00Z").getTime();
  const now = Date.now();
  const distance = Math.max(0, launchDate - now);

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  const values = {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0")
  };

  countdownTargets.days.textContent = values.days;
  countdownTargets.hours.textContent = values.hours;
  countdownTargets.minutes.textContent = values.minutes;
  countdownTargets.seconds.textContent = values.seconds;
  countdownTargets.daysSecondary.textContent = values.days;
  countdownTargets.hoursSecondary.textContent = values.hours;
  countdownTargets.minutesSecondary.textContent = values.minutes;
  countdownTargets.secondsSecondary.textContent = values.seconds;
}

function handleReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.14,
    rootMargin: "0px 0px -10% 0px"
  });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 45, 220)}ms`;
    observer.observe(item);
  });
}

function updateParallax() {
  if (prefersReducedMotion) {
    return;
  }

  parallaxItems.forEach((item) => {
    const depth = Number(item.dataset.depth || 0);
    const x = (state.pointerX - state.width / 2) * depth * 0.03;
    const y = (state.pointerY - state.height / 2) * depth * 0.02 + state.scrollY * depth * -0.01;
    item.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
}

function updateAtmosphere() {
  const midpoint = state.scrollY + window.innerHeight * 0.5;
  let activeIndex = 0;

  sections.forEach((section, index) => {
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;
    if (midpoint >= top && midpoint < bottom) {
      activeIndex = index;
    }
  });

  const cyanAlpha = 0.08 + activeIndex * 0.01;
  const magentaAlpha = 0.12 + activeIndex * 0.008;
  body.style.background = `
    radial-gradient(circle at 18% 18%, rgba(78, 124, 255, ${cyanAlpha}), transparent 28%),
    radial-gradient(circle at 80% 18%, rgba(210, 12, 255, ${magentaAlpha}), transparent 30%),
    radial-gradient(circle at 50% 72%, rgba(123, 246, 255, 0.1), transparent 34%),
    linear-gradient(180deg, #010203 0%, #04060d 32%, #050814 100%)
  `;

  topbar.style.background = `linear-gradient(180deg, rgba(4, 8, 18, ${0.14 + activeIndex * 0.02}), rgba(4, 8, 18, 0.03))`;
}

function bindTilt() {
  if (!tiltCard || prefersReducedMotion) {
    return;
  }

  tiltCard.addEventListener("pointermove", (event) => {
    const rect = tiltCard.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 8;
    const rotateX = (0.5 - py) * 6;
    tiltCard.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
  });

  tiltCard.addEventListener("pointerleave", () => {
    tiltCard.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg)";
  });
}

function bindMagneticButtons() {
  if (prefersReducedMotion) {
    return;
  }

  magnets.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      item.style.transform = `translate(${dx * 0.05}px, ${dy * 0.05}px)`;
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

function hideLoader() {
  window.setTimeout(() => {
    loader.classList.add("is-hidden");
    body.classList.remove("is-loading");
  }, prefersReducedMotion ? 250 : 1600);
}

function onPointerMove(event) {
  state.pointerX = event.clientX;
  state.pointerY = event.clientY;
  updateParallax();
}

function onScroll() {
  state.scrollY = window.scrollY;
  updateParallax();
  updateAtmosphere();
}

resizeCanvas();
initParticles();
handleReveal();
bindTilt();
bindMagneticButtons();
bindScrollButtons();
updateCountdown();
updateAtmosphere();
hideLoader();

if (prefersReducedMotion) {
  drawParticles();
} else {
  animate();
}

window.setInterval(updateCountdown, 1000);

document.addEventListener("visibilitychange", () => {
  state.running = !document.hidden;
  if (state.running && !prefersReducedMotion) {
    animate();
  }
});

window.addEventListener("resize", () => {
  resizeCanvas();
  initParticles();
  drawParticles();
  updateParallax();
  updateAtmosphere();
});

window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("scroll", onScroll, { passive: true });

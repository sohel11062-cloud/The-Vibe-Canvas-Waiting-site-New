const body = document.body;
const loader = document.getElementById("loader");
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
const webglStage = document.getElementById("webgl-stage");
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
const isCompactDevice = window.matchMedia("(max-width: 900px)").matches;

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  pointerX: window.innerWidth * 0.5,
  pointerY: window.innerHeight * 0.5,
  scrollY: 0,
  scrollProgress: 0,
  sceneVisible: true
};

const particles = [];
let particleCount = Math.min(isCompactDevice ? 44 : 76, Math.round((window.innerWidth * window.innerHeight) / 26000));
let webgl = null;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.scrollProgress = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1);
  particleCount = Math.min(window.innerWidth < 900 ? 44 : 76, Math.round((window.innerWidth * window.innerHeight) / 26000));
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
    z: Math.random() * 0.8 + 0.2,
    size: Math.random() * 1.6 + 0.5,
    speedX: (Math.random() - 0.5) * 0.14,
    speedY: Math.random() * 0.16 + 0.08,
    hue: Math.random() > 0.5 ? 190 : 315,
    alpha: Math.random() * 0.36 + 0.1
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

  const gradient = ctx.createRadialGradient(
    state.pointerX,
    state.pointerY,
    0,
    state.pointerX,
    state.pointerY,
    Math.max(state.width, state.height) * 0.5
  );
  gradient.addColorStop(0, "rgba(244, 214, 194, 0.05)");
  gradient.addColorStop(0.35, "rgba(176, 66, 255, 0.05)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);

  for (const particle of particles) {
    particle.x += particle.speedX + (state.pointerX - state.width / 2) * 0.00001 * particle.z;
    particle.y += particle.speedY * particle.z + state.scrollY * 0.00005;

    if (particle.y > state.height + 30) {
      particle.y = -10;
      particle.x = Math.random() * state.width;
    }

    if (particle.x > state.width + 20) {
      particle.x = -20;
    } else if (particle.x < -20) {
      particle.x = state.width + 20;
    }

    ctx.beginPath();
    ctx.fillStyle = `hsla(${particle.hue}, 100%, 78%, ${particle.alpha})`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `hsla(${particle.hue}, 100%, 70%, 0.24)`;
    ctx.arc(particle.x, particle.y, particle.size * particle.z, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

function createWebGLScene() {
  if (!window.THREE || !webglStage || prefersReducedMotion || window.innerWidth < 680) {
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 7.4);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isCompactDevice,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(webglStage.clientWidth, webglStage.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  webglStage.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  scene.add(new THREE.AmbientLight(0x8899ff, 1.1));

  const pointA = new THREE.PointLight(0x77f8ff, 2.5, 24);
  pointA.position.set(5, 4, 6);
  scene.add(pointA);

  const pointB = new THREE.PointLight(0xff58d0, 2.6, 24);
  pointB.position.set(-5, -2, 6);
  scene.add(pointB);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.45, 16),
    new THREE.MeshPhysicalMaterial({
      color: 0xf1d9cb,
      emissive: 0x281435,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.25,
      transmission: 0.14,
      transparent: true,
      opacity: 0.92,
      clearcoat: 1
    })
  );
  group.add(core);

  const wire = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.95, 0.1, 140, 18, 2, 3),
    new THREE.MeshBasicMaterial({
      color: 0x77f8ff,
      transparent: true,
      opacity: 0.24,
      wireframe: true
    })
  );
  group.add(wire);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, 0.03, 12, 120),
    new THREE.MeshBasicMaterial({ color: 0xb042ff, transparent: true, opacity: 0.3 })
  );
  ring.rotation.x = Math.PI / 2.6;
  group.add(ring);

  const count = isCompactDevice ? 320 : 520;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorA = new THREE.Color(0x77f8ff);
  const colorB = new THREE.Color(0xff58d0);

  for (let i = 0; i < count; i += 1) {
    const radius = 2.5 + Math.random() * 1.2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const index = i * 3;

    positions[index] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[index + 2] = radius * Math.cos(phi);

    const mixed = colorA.clone().lerp(colorB, Math.random());
    colors[index] = mixed.r;
    colors[index + 1] = mixed.g;
    colors[index + 2] = mixed.b;
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const starfield = new THREE.Points(
    particlesGeometry,
    new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  group.add(starfield);

  return { scene, camera, renderer, group, core, wire, ring, starfield };
}

function resizeWebGL() {
  if (!webgl) {
    return;
  }

  const width = webglStage.clientWidth || 300;
  const height = webglStage.clientHeight || 300;
  webgl.camera.aspect = width / height;
  webgl.camera.updateProjectionMatrix();
  webgl.renderer.setSize(width, height);
}

function animateWebGL(time) {
  if (!webgl || !state.sceneVisible) {
    return;
  }

  const t = time * 0.00045;
  const pointerX = (state.pointerX / state.width - 0.5) * 2;
  const pointerY = (state.pointerY / state.height - 0.5) * 2;
  const scrollFactor = state.scrollProgress;

  webgl.group.rotation.y += 0.0018;
  webgl.group.rotation.x = Math.sin(t * 1.4) * 0.1 + pointerY * 0.12;
  webgl.group.position.y = Math.sin(t * 2.1) * 0.1 - scrollFactor * 0.35;

  webgl.core.rotation.x += 0.003;
  webgl.core.rotation.y += 0.004;
  webgl.core.scale.setScalar(1 + Math.sin(t * 3.2) * 0.03);

  webgl.wire.rotation.x -= 0.0024;
  webgl.wire.rotation.y += 0.002;
  webgl.ring.rotation.z += 0.0032;
  webgl.starfield.rotation.y -= 0.0009;

  webgl.camera.position.x += (pointerX * 0.45 - webgl.camera.position.x) * 0.04;
  webgl.camera.position.y += ((-pointerY * 0.36) - webgl.camera.position.y) * 0.04;
  webgl.camera.lookAt(0, 0, 0);

  webgl.renderer.render(webgl.scene, webgl.camera);
}

function animate(time = 0) {
  drawParticles();
  animateWebGL(time);
  if (!prefersReducedMotion) {
    window.requestAnimationFrame(animate);
  }
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
    item.style.transitionDelay = `${Math.min(index * 55, 260)}ms`;
    observer.observe(item);
  });
}

function updateParallax() {
  if (prefersReducedMotion) {
    return;
  }

  parallaxItems.forEach((item) => {
    const depth = Number(item.dataset.depth || 0);
    const offsetX = (state.pointerX - state.width / 2) * depth * 0.04;
    const offsetY = (state.pointerY - state.height / 2) * depth * 0.03 + state.scrollY * depth * -0.02;
    item.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
  });
}

function updateSectionAtmosphere() {
  const midpoint = state.scrollY + window.innerHeight * 0.5;
  let activeIndex = 0;

  sections.forEach((section, index) => {
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;
    if (midpoint >= top && midpoint < bottom) {
      activeIndex = index;
    }
  });

  const pink = 306 + activeIndex * 3;
  const blue = 224 + activeIndex * 6;
  body.style.background = `
    radial-gradient(circle at 20% 20%, hsla(${pink}, 100%, 62%, 0.16), transparent 30%),
    radial-gradient(circle at 80% 18%, hsla(${blue}, 100%, 64%, 0.16), transparent 28%),
    radial-gradient(circle at 50% 80%, rgba(119, 248, 255, 0.08), transparent 34%),
    linear-gradient(180deg, #03040b 0%, #050814 38%, #070c1d 100%)
  `;

  if (topbar) {
    topbar.style.background = `linear-gradient(180deg, rgba(6, 10, 24, ${0.16 + activeIndex * 0.02}), rgba(6, 10, 24, 0.04))`;
  }
}

function bindTilt() {
  if (!tiltCard || prefersReducedMotion) {
    return;
  }

  tiltCard.addEventListener("pointermove", (event) => {
    const rect = tiltCard.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 9;
    const rotateX = (0.5 - py) * 7;
    tiltCard.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
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
      item.style.transform = `translate(${dx * 0.06}px, ${dy * 0.06}px)`;
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

function updateCountdown() {
  const launchDate = new Date("2026-05-01T06:30:00Z").getTime();
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

function hideLoader() {
  window.setTimeout(() => {
    loader.classList.add("is-hidden");
    body.classList.remove("is-loading");
  }, prefersReducedMotion ? 300 : 2200);
}

function onPointerMove(event) {
  state.pointerX = event.clientX;
  state.pointerY = event.clientY;
  updateParallax();
}

function onScroll() {
  state.scrollY = window.scrollY;
  state.scrollProgress = state.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1);
  updateParallax();
  updateSectionAtmosphere();
}

resizeCanvas();
initParticles();
webgl = createWebGLScene();
if (webgl) {
  resizeWebGL();
}

handleReveal();
bindTilt();
bindMagneticButtons();
bindScrollButtons();
updateSectionAtmosphere();
updateCountdown();
hideLoader();

if (prefersReducedMotion) {
  drawParticles();
} else {
  animate();
}

window.setInterval(updateCountdown, 1000);

document.addEventListener("visibilitychange", () => {
  state.sceneVisible = !document.hidden;
});

window.addEventListener("resize", () => {
  resizeCanvas();
  initParticles();
  drawParticles();
  updateParallax();
  updateSectionAtmosphere();
  resizeWebGL();
});

window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("scroll", onScroll, { passive: true });

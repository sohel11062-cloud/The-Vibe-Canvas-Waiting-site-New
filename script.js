const body = document.body;
const loader = document.getElementById("loader");
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
const webglStage = document.getElementById("webgl-stage");
const revealItems = document.querySelectorAll(".reveal");
const parallaxItems = document.querySelectorAll("[data-depth]");
const tiltCard = document.querySelector(".tilt");
const magnets = document.querySelectorAll(".magnetic");
const waitlistForm = document.getElementById("waitlist-form");
const emailInput = document.getElementById("email");
const formMessage = document.getElementById("form-message");
const successBurst = document.getElementById("success-burst");
const scrollButtons = document.querySelectorAll("[data-scroll]");
const topbar = document.querySelector(".topbar");
const sections = document.querySelectorAll("main section");

body.classList.add("is-loading");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  pointerX: window.innerWidth * 0.5,
  pointerY: window.innerHeight * 0.5,
  scrollY: 0,
  scrollProgress: 0
};

const particles = [];
let particleCount = Math.min(120, Math.round((window.innerWidth * window.innerHeight) / 18000));
let webgl = null;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.scrollProgress = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1);
  particleCount = Math.min(120, Math.round((window.innerWidth * window.innerHeight) / 18000));
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
    size: Math.random() * 2.2 + 0.5,
    speedX: (Math.random() - 0.5) * 0.24,
    speedY: Math.random() * 0.32 + 0.12,
    hue: Math.random() > 0.5 ? 190 : 275,
    alpha: Math.random() * 0.5 + 0.15
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
  gradient.addColorStop(0, "rgba(119, 248, 255, 0.09)");
  gradient.addColorStop(0.35, "rgba(176, 66, 255, 0.06)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);

  for (const particle of particles) {
    particle.x += particle.speedX + (state.pointerX - state.width / 2) * 0.00002 * particle.z;
    particle.y += particle.speedY * particle.z + state.scrollY * 0.00015;

    if (particle.y > state.height + 40) {
      particle.y = -20;
      particle.x = Math.random() * state.width;
    }

    if (particle.x > state.width + 30) {
      particle.x = -30;
    } else if (particle.x < -30) {
      particle.x = state.width + 30;
    }

    ctx.beginPath();
    ctx.fillStyle = `hsla(${particle.hue}, 100%, 70%, ${particle.alpha})`;
    ctx.shadowBlur = 18;
    ctx.shadowColor = `hsla(${particle.hue}, 100%, 70%, 0.45)`;
    ctx.arc(particle.x, particle.y, particle.size * particle.z, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

function createWebGLScene() {
  if (!window.THREE || !webglStage || prefersReducedMotion) {
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(webglStage.clientWidth, webglStage.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  webglStage.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  const ambient = new THREE.AmbientLight(0x88aaff, 1.1);
  scene.add(ambient);

  const pointA = new THREE.PointLight(0x77f8ff, 3.2, 30);
  pointA.position.set(5, 4, 6);
  scene.add(pointA);

  const pointB = new THREE.PointLight(0xb042ff, 3.6, 32);
  pointB.position.set(-5, -2, 7);
  scene.add(pointB);

  const pointC = new THREE.PointLight(0xff58d0, 2.2, 26);
  pointC.position.set(0, 6, -2);
  scene.add(pointC);

  const coreGeometry = new THREE.IcosahedronGeometry(1.55, 32);
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xa9d7ff,
    emissive: 0x36174a,
    emissiveIntensity: 0.8,
    roughness: 0.12,
    metalness: 0.35,
    transmission: 0.18,
    transparent: true,
    opacity: 0.92,
    clearcoat: 1,
    clearcoatRoughness: 0.2
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);

  const wire = new THREE.Mesh(
    new THREE.TorusKnotGeometry(2.1, 0.11, 260, 22, 2, 3),
    new THREE.MeshBasicMaterial({
      color: 0x77f8ff,
      transparent: true,
      opacity: 0.34,
      wireframe: true
    })
  );
  group.add(wire);

  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(2.8, 0.04, 16, 180),
    new THREE.MeshBasicMaterial({ color: 0x77f8ff, transparent: true, opacity: 0.3 })
  );
  ringA.rotation.x = Math.PI / 2.6;
  group.add(ringA);

  const ringB = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.03, 16, 180),
    new THREE.MeshBasicMaterial({ color: 0xb042ff, transparent: true, opacity: 0.36 })
  );
  ringB.rotation.y = Math.PI / 3.1;
  ringB.rotation.x = Math.PI / 4.2;
  group.add(ringB);

  const count = 1200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorA = new THREE.Color(0x77f8ff);
  const colorB = new THREE.Color(0xb042ff);

  for (let i = 0; i < count; i += 1) {
    const radius = 2.8 + Math.random() * 1.7;
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

  const pointsMaterial = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const starfield = new THREE.Points(particlesGeometry, pointsMaterial);
  group.add(starfield);

  const haze = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0x4f7cff,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide
    })
  );
  group.add(haze);

  return { scene, camera, renderer, group, core, wire, ringA, ringB, starfield };
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
  if (!webgl || prefersReducedMotion) {
    return;
  }

  const t = time * 0.00045;
  const pointerX = (state.pointerX / state.width - 0.5) * 2;
  const pointerY = (state.pointerY / state.height - 0.5) * 2;
  const scrollFactor = state.scrollProgress;

  webgl.group.rotation.y += 0.0028;
  webgl.group.rotation.x = Math.sin(t * 1.4) * 0.14 + pointerY * 0.18;
  webgl.group.position.y = Math.sin(t * 2.1) * 0.16 - scrollFactor * 0.6;

  webgl.core.rotation.x += 0.004;
  webgl.core.rotation.y += 0.0055;
  webgl.core.scale.setScalar(1 + Math.sin(t * 3.4) * 0.045);

  webgl.wire.rotation.x -= 0.0044;
  webgl.wire.rotation.y += 0.0031;
  webgl.ringA.rotation.z += 0.005;
  webgl.ringB.rotation.x -= 0.004;
  webgl.starfield.rotation.y -= 0.0016;
  webgl.starfield.rotation.x = t * 0.06 + pointerY * 0.1;

  webgl.camera.position.x += (pointerX * 0.85 - webgl.camera.position.x) * 0.04;
  webgl.camera.position.y += ((-pointerY * 0.65) - webgl.camera.position.y) * 0.04;
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
    threshold: 0.18,
    rootMargin: "0px 0px -10% 0px"
  });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 70, 320)}ms`;
    observer.observe(item);
  });
}

function updateParallax() {
  if (prefersReducedMotion) {
    return;
  }

  parallaxItems.forEach((item) => {
    const depth = Number(item.dataset.depth || 0);
    const offsetX = (state.pointerX - state.width / 2) * depth * 0.06;
    const offsetY = (state.pointerY - state.height / 2) * depth * 0.05 + state.scrollY * depth * -0.04;
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

  const hue = 220 + activeIndex * 18;
  const glow = 260 + activeIndex * 12;
  body.style.background = `
    radial-gradient(circle at 20% 20%, hsla(${glow}, 100%, 62%, 0.18), transparent 30%),
    radial-gradient(circle at 80% 20%, hsla(${hue}, 100%, 64%, 0.20), transparent 28%),
    radial-gradient(circle at 50% 80%, rgba(119, 248, 255, 0.12), transparent 34%),
    linear-gradient(180deg, #03040b 0%, #050814 38%, #070c1d 100%)
  `;

  if (topbar) {
    topbar.style.background = `linear-gradient(180deg, rgba(6, 10, 24, ${0.22 + activeIndex * 0.02}), rgba(6, 10, 24, 0.05))`;
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
    const rotateY = (px - 0.5) * 12;
    const rotateX = (0.5 - py) * 10;
    tiltCard.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
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
      item.style.transform = `translate(${dx * 0.08}px, ${dy * 0.08}px)`;
    });

    item.addEventListener("pointerleave", () => {
      item.style.transform = "";
    });
  });
}

function triggerBurst() {
  successBurst.classList.remove("is-active");
  void successBurst.offsetWidth;
  successBurst.classList.add("is-active");
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function bindForm() {
  if (!waitlistForm) {
    return;
  }

  waitlistForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();

    if (!validateEmail(email)) {
      waitlistForm.classList.remove("is-success");
      formMessage.textContent = "Enter a valid email to unlock early access.";
      emailInput.focus();
      return;
    }

    waitlistForm.classList.add("is-success");
    formMessage.textContent = "You're in. Watch your inbox for first access.";
    emailInput.value = "";
    triggerBurst();
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
  }, prefersReducedMotion ? 300 : 2600);
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
bindForm();
bindScrollButtons();
hideLoader();
updateSectionAtmosphere();

if (prefersReducedMotion) {
  drawParticles();
} else {
  animate();
}

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

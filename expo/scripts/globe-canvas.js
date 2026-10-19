import { geoOrthographic, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import world from "world-atlas/countries-110m.json";

const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
const cities = [
  { lon: -74, lat: 40.7 },
  { lon: -0.1, lat: 51.5 },
  { lon: 2.3, lat: 48.8 },
  { lon: 139.7, lat: 35.7 },
  { lon: 116.4, lat: 39.9 },
  { lon: 72.8, lat: 18.9 },
  { lon: 151.2, lat: -33.8 },
  { lon: 37.6, lat: 55.7 },
  { lon: 28.9, lat: 41 },
  { lon: -99.1, lat: 19.4 },
  { lon: 103.8, lat: 1.3 },
  { lon: 55.3, lat: 25.2 },
  { lon: -79.4, lat: 43.7 },
  { lon: 77.2, lat: 28.6 },
  { lon: 126.9, lat: 37.5 },
  { lon: -43.2, lat: -22.9 },
  { lon: 174.8, lat: -36.9 },
  { lon: 18.4, lat: -33.9 },
];
const countries = feature(world, world.objects.countries);
const borders = mesh(
  world,
  world.objects.countries,
  (first, second) => first !== second,
);
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const dpr = Math.min(window.devicePixelRatio || 1, 3);
const timeoutIds = [];
let animationFrame = 0;
let active = true;
let frame = 0;
let height = 0;
let planes = [];
let radius = 0;
let rotation = 0;
let width = 0;

function resize() {
  const size = Math.min(document.documentElement.clientWidth, 520);
  width = size;
  height = size;
  radius = size * 0.435;
  canvas.width = Math.floor(size * dpr);
  canvas.height = Math.floor(size * dpr);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawnPlane() {
  if (planes.length >= (reducedMotion ? 3 : 6)) return;

  const from = cities[Math.floor(Math.random() * cities.length)];
  let to = cities[Math.floor(Math.random() * cities.length)];

  while (to === from) {
    to = cities[Math.floor(Math.random() * cities.length)];
  }

  planes.push({
    alive: true,
    from,
    speed: reducedMotion ? 0.0016 : 0.0025 + Math.random() * 0.003,
    t: 0,
    to,
    trail: [],
  });
}

function slerp(from, to, progress, currentRotation) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const lon1 = toRadians(from.lon + currentRotation);
  const lat1 = toRadians(from.lat);
  const lon2 = toRadians(to.lon + currentRotation);
  const lat2 = toRadians(to.lat);
  const x1 = Math.cos(lat1) * Math.sin(lon1);
  const y1 = -Math.sin(lat1);
  const z1 = Math.cos(lat1) * Math.cos(lon1);
  const x2 = Math.cos(lat2) * Math.sin(lon2);
  const y2 = -Math.sin(lat2);
  const z2 = Math.cos(lat2) * Math.cos(lon2);
  const dot = Math.max(-1, Math.min(1, x1 * x2 + y1 * y2 + z1 * z2));
  const omega = Math.acos(dot);

  if (omega < 0.001) {
    return {
      x: width / 2 + x1 * radius,
      y: height / 2 + y1 * radius,
      z: z1 * radius,
    };
  }

  const sinOmega = Math.sin(omega);
  const fromWeight = Math.sin((1 - progress) * omega) / sinOmega;
  const toWeight = Math.sin(progress * omega) / sinOmega;
  const interpolatedX = fromWeight * x1 + toWeight * x2;
  const interpolatedY = fromWeight * y1 + toWeight * y2;
  const interpolatedZ = fromWeight * z1 + toWeight * z2;
  const lift = Math.sin(progress * Math.PI) * 0.18;

  return {
    x: width / 2 + interpolatedX * radius * (1 + lift),
    y: height / 2 + interpolatedY * radius * (1 + lift),
    z: interpolatedZ * radius,
  };
}

function drawPaperPlane(x, y, angle, alpha, depth) {
  const scale = 0.72 + depth * 0.28;
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.globalAlpha = alpha;
  context.scale(scale, scale);
  context.beginPath();
  context.moveTo(10, 0);
  context.lineTo(-6, -5);
  context.lineTo(-4, 0);
  context.lineTo(-6, 5);
  context.closePath();
  context.fillStyle = "#ff6b6b";
  context.fill();
  context.beginPath();
  context.moveTo(-4, 0);
  context.lineTo(10, 0);
  context.strokeStyle = "rgba(255,255,255,0.55)";
  context.lineWidth = 1;
  context.stroke();
  context.restore();
  context.globalAlpha = 1;
}

function drawAmbientGlow() {
  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    radius * 0.35,
    width / 2,
    height / 2,
    radius * 1.18,
  );
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.75, "rgba(15,23,42,0.02)");
  gradient.addColorStop(1, "rgba(15,23,42,0)");
  context.beginPath();
  context.arc(width / 2, height / 2, radius * 1.12, 0, Math.PI * 2);
  context.fillStyle = gradient;
  context.fill();
}

function drawGlobe() {
  const projection = geoOrthographic()
    .scale(radius)
    .translate([width / 2, height / 2])
    .rotate([rotation, -15]);
  const path = geoPath(projection, context);

  drawAmbientGlow();
  context.beginPath();
  path({ type: "Sphere" });
  context.fillStyle = "#ffffff";
  context.fill();
  context.beginPath();
  path(countries);
  context.fillStyle = "rgba(18,24,38,0.055)";
  context.fill();
  context.beginPath();
  path(borders);
  context.strokeStyle = "rgba(18,24,38,0.18)";
  context.lineWidth = 0.7;
  context.stroke();
  context.beginPath();
  path(countries);
  context.strokeStyle = "rgba(18,24,38,0.26)";
  context.lineWidth = 0.6;
  context.stroke();
  context.beginPath();
  path({ type: "Sphere" });
  context.strokeStyle = "rgba(18,24,38,0.12)";
  context.lineWidth = 1.2;
  context.stroke();

  const shine = context.createRadialGradient(
    width / 2 - 65,
    height / 2 - 65,
    8,
    width / 2 - 30,
    height / 2 - 30,
    radius,
  );
  shine.addColorStop(0, "rgba(255,255,255,0.18)");
  shine.addColorStop(0.55, "rgba(255,255,255,0.04)");
  shine.addColorStop(1, "rgba(14,23,38,0.03)");
  context.beginPath();
  path({ type: "Sphere" });
  context.fillStyle = shine;
  context.fill();

  return projection;
}

function drawCityDots(projection) {
  cities.forEach((city) => {
    const point = projection([city.lon, city.lat]);
    if (!point) return;

    const [x, y] = point;
    const lon = ((city.lon + rotation) * Math.PI) / 180;
    const lat = (city.lat * Math.PI) / 180;
    const depth = Math.cos(lat) * Math.cos(lon);
    if (depth < 0.05) return;

    const alpha = Math.min(1, depth * 1.4);
    context.beginPath();
    context.arc(x, y, 2.5, 0, Math.PI * 2);
    context.fillStyle = `rgba(255,107,107,${alpha * 0.88})`;
    context.fill();
    context.beginPath();
    context.arc(x, y, 5.5, 0, Math.PI * 2);
    context.fillStyle = `rgba(255,107,107,${alpha * 0.18})`;
    context.fill();
  });
}

function drawPlanes() {
  planes = planes.filter((plane) => plane.alive);
  planes.forEach((plane) => {
    plane.t += plane.speed;
    const position = slerp(plane.from, plane.to, plane.t, rotation);
    const nextPosition = slerp(
      plane.from,
      plane.to,
      Math.min(1, plane.t + 0.012),
      rotation,
    );
    const depth = Math.max(0, position.z / radius);
    const visible = position.z > -radius * 0.1;

    if (visible) {
      plane.trail.push({
        depth,
        t: plane.t,
        x: position.x,
        y: position.y,
      });
    }

    const maxAge = 0.28;
    for (let index = 1; index < plane.trail.length; index += 1) {
      const age = plane.t - plane.trail[index].t;
      if (age > maxAge) continue;

      const alpha = (1 - age / maxAge) * 0.55 * plane.trail[index].depth;
      if (alpha < 0.02) continue;

      context.beginPath();
      context.moveTo(plane.trail[index - 1].x, plane.trail[index - 1].y);
      context.lineTo(plane.trail[index].x, plane.trail[index].y);
      context.strokeStyle = `rgba(255,107,107,${alpha})`;
      context.lineWidth = 1.2;
      context.setLineDash([3, 5]);
      context.stroke();
      context.setLineDash([]);
    }

    plane.trail = plane.trail.filter(
      (point) => plane.t - point.t < maxAge + 0.05,
    );

    if (visible && depth > 0.05) {
      const angle = Math.atan2(
        nextPosition.y - position.y,
        nextPosition.x - position.x,
      );
      drawPaperPlane(
        position.x,
        position.y,
        angle,
        Math.min(1, depth + 0.3),
        depth,
      );
    }

    if (plane.t >= 1) plane.alive = false;
  });
}

function tick() {
  if (!active) {
    animationFrame = 0;
    return;
  }

  context.clearRect(0, 0, width, height);
  rotation += reducedMotion ? 0.035 : 0.12;
  frame += 1;

  if (frame % (reducedMotion ? 140 : 80) === 0) spawnPlane();
  if (planes.length === 0 && frame > 20) spawnPlane();

  const projection = drawGlobe();
  drawCityDots(projection);
  drawPlanes();
  animationFrame = window.requestAnimationFrame(tick);
}

function setActive(nextActive) {
  active = nextActive;
  if (active && !animationFrame) {
    animationFrame = window.requestAnimationFrame(tick);
  }
  if (!active && animationFrame) {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
}

window.setGlobeActive = setActive;
window.addEventListener("resize", resize, { passive: true });
document.addEventListener("visibilitychange", () => {
  setActive(!document.hidden);
});
resize();
timeoutIds.push(window.setTimeout(spawnPlane, 400));
timeoutIds.push(window.setTimeout(spawnPlane, 1400));
timeoutIds.push(window.setTimeout(spawnPlane, 2400));
animationFrame = window.requestAnimationFrame(tick);


// La location fija del atributo deja compartir un solo VAO entre la sim y el papel.
export const FULLSCREEN_VERTEX = /* glsl */ `#version 300 es
layout(location = 0) in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// Estela: viaja con la hoja al hacer scroll, se difunde con sus vecinos, se desvanece
// y suma un splat alargado en la direccion del movimiento. Todo en unidades del alto
// del contenedor para que la forma no dependa del aspect.
export const SIM_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D u_prev;
uniform vec2 u_simResolution;
uniform vec2 u_shift;
uniform vec2 u_splat;
uniform vec2 u_dir;
uniform float u_aspect;
uniform float u_force;
uniform float u_radius;
uniform float u_radiusGrowth;
uniform float u_anisotropy;
uniform float u_diffusion;
uniform float u_fade;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_simResolution;
  vec2 from = uv - u_shift;
  vec2 texel = 1.0 / u_simResolution;
  float center = texture(u_prev, from).r;
  float around =
    texture(u_prev, from + vec2(texel.x, 0.0)).r +
    texture(u_prev, from - vec2(texel.x, 0.0)).r +
    texture(u_prev, from + vec2(0.0, texel.y)).r +
    texture(u_prev, from - vec2(0.0, texel.y)).r;
  float value = mix(center, around * 0.25, u_diffusion) * u_fade;

  vec2 d = (uv - u_splat) * vec2(u_aspect, 1.0);
  d -= u_dir * dot(d, u_dir) * u_anisotropy;
  float r = u_radius * (1.0 + u_force * u_radiusGrowth);
  value += u_force * exp(-dot(d, d) / (r * r));

  outColor = vec4(min(value, 1.0), 0.0, 0.0, 1.0);
}`;

// La hoja por capas. d empuja hacia la tinta (negativo, hacia el brillo), tonal es el
// tono que sale impreso como trama a 45 grados y hi es brillo puro. Pesos en PAPER_WEIGHTS.
export const PAPER_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_dpr;
// Desplazamiento del parallax en unidades del alto del contenedor.
uniform float u_scroll;
uniform float u_time8;
uniform float u_shake;
uniform float u_alive;
uniform vec3 u_paper;
uniform vec3 u_ink;
uniform vec3 u_hi;
uniform float u_strength;
uniform sampler2D u_trail;
uniform vec2 u_trailTexel;
// (x, y) en UV con y hacia arriba, radio en alto del contenedor, alpha.
uniform vec4 u_ripples[6];
uniform float u_pitch;
// (tooth, felt, crumple, emboss)
uniform vec4 u_surface;
// (warp, streak1, streak2, stain)
uniform vec4 u_marks;
// (crease, edge, sheen, halftone)
uniform vec4 u_light;
// (fleck, halfTrail, wakeDots, -)
uniform vec4 u_dots;
out vec4 outColor;

const mat2 OCTAVE = mat2(0.8, 0.6, -0.6, 0.8);
const vec2 LIGHT = vec2(0.6, 0.8);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), u.x), u.y);
}

// La rotacion entre octavas evita que las capas se alineen en una rejilla visible.
float fbm(vec2 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    sum += amp * valueNoise(p);
    p = OCTAVE * p * 2.03;
    amp *= 0.5;
  }
  return sum;
}

float trailAt(vec2 uv) {
  return texture(u_trail, uv).r;
}

float ringEnergy(vec2 uv, float aspect) {
  float total = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 ring = u_ripples[i];
    if (ring.w <= 0.0) continue;
    float r = length((uv - ring.xy) * vec2(aspect, 1.0));
    float front = (r - ring.z) / 0.05;
    float behind = ring.z - r;
    total += (exp(-front * front) + smoothstep(0.28, 0.0, behind) * step(0.0, behind) * 0.14) * ring.w;
  }
  return total;
}

// Celda de una trama a 45 grados de pitch en px de dispositivo.
vec2 latticeCoord(vec2 px, float pitch) {
  return mat2(0.7071, 0.7071, -0.7071, 0.7071) * px / pitch;
}

vec2 latticeToPx(vec2 cell, float pitch) {
  return mat2(0.7071, -0.7071, 0.7071, 0.7071) * cell * pitch;
}

float creaseInk(float t) {
  return exp(-abs(t) / 1.4) * 0.085 + exp(-max(t, 0.0) / 26.0) * 0.03;
}

float creaseHi(float t) {
  return exp(-max(-t, 0.0) / 7.0) * 0.05;
}

void main() {
  vec2 px = gl_FragCoord.xy;
  vec2 vp = px / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  float cssY = u_resolution.y / u_dpr;

  float trail = trailAt(vp) * u_alive;
  vec2 trailSlope = vec2(
    trailAt(vp + vec2(u_trailTexel.x, 0.0)) - trailAt(vp - vec2(u_trailTexel.x, 0.0)),
    trailAt(vp + vec2(0.0, u_trailTexel.y)) - trailAt(vp - vec2(0.0, u_trailTexel.y))
  ) * 0.5 * u_alive;

  // Espacio de la hoja: normalizado al alto, sube con el scroll y la estela lo refracta.
  vec2 sp = vec2(vp.x * aspect, vp.y - u_scroll) + trailSlope * u_marks.x;
  sp += (vec2(valueNoise(sp * 2.3 + u_time8), valueNoise(sp * 2.3 + u_time8 + 7.0)) - 0.5) * u_shake;

  float d = 0.0;
  float tonal = 0.0;
  float hi = 0.0;

  d += (fbm(sp * 900.0, 2) - 0.5) * u_surface.x;
  // Ruido de sensor del escaner: fijo a la pantalla, no a la hoja.
  d += (hash(px * 1.013) - 0.5) * 0.022;
  d += (fbm(sp * 46.0, 3) - 0.5) * u_surface.y;

  float relief = fbm(sp * 4.6, 3);
  tonal += dot(LIGHT, vec2(dFdx(relief), dFdy(relief)) * u_resolution.y) * u_surface.z;

  tonal += dot(LIGHT, trailSlope) * u_surface.w + trail * u_dots.y * 0.14;
  hi += trail * u_light.z;
  d += (hash(px * 2.31) - 0.5) * trail * u_dots.y * 0.25;

  // Plume: puntos de la trama que se encienden donde la estela o un anillo tienen energia.
  if (u_alive > 0.0) {
    float pitch = u_pitch * u_dpr;
    vec2 lattice = latticeCoord(px, pitch);
    vec2 cellId = floor(lattice);
    vec2 cellUv = latticeToPx(cellId + 0.5, pitch) / u_resolution;
    float energy = trailAt(cellUv) + ringEnergy(cellUv, aspect);
    float on = step(hash(cellId + 0.7) * 0.85 + 0.06, energy);
    d += on * smoothstep(0.36, 0.27, length(fract(lattice) - 0.5)) * u_dots.z;
  }

  vec2 fleckCell = floor(sp * u_resolution.y * 0.5);
  d += step(0.9985, hash(fleckCell + 3.7)) * u_dots.x * 0.5;
  hi += step(0.9993, hash(fleckCell + 9.1)) * u_dots.x;

  // Rayas de presion: ridged y con umbral alto, salen pocas y largas.
  float ridge1 = 1.0 - abs(2.0 * valueNoise(vec2(sp.x * 1.3, sp.y * 15.0)) - 1.0);
  vec2 rotated = mat2(0.9659, 0.2588, -0.2588, 0.9659) * sp;
  float ridge2 = 1.0 - abs(2.0 * valueNoise(vec2(rotated.x * 17.0, rotated.y * 1.5)) - 1.0);
  d += smoothstep(0.963, 1.0, ridge1) * u_marks.y + smoothstep(0.963, 1.0, ridge2) * u_marks.z;

  float stain = smoothstep(0.62, 1.0, fbm(sp * 1.1 + 17.0, 3));
  tonal += stain * stain * u_marks.w;

  // Pliegues: dos horizontales y uno vertical, ondulados; t en px CSS con signo.
  float wobbleX = (sin(sp.x * 3.1) * 0.5 + valueNoise(vec2(sp.x * 2.0, 3.0)) - 0.5) * 0.012;
  float wobbleY = (sin(sp.y * 2.7) * 0.5 + valueNoise(vec2(5.0, sp.y * 2.0)) - 0.5) * 0.012;
  float t1 = (vp.y - 0.34 - wobbleX) * cssY;
  float t2 = (vp.y - 0.71 - wobbleX) * cssY;
  float t3 = (vp.x * aspect - 0.56 * aspect - wobbleY) * cssY;
  d += (creaseInk(t1) + creaseInk(t2) * 0.85 + creaseInk(t3) * 0.6) * u_light.x;
  hi += (creaseHi(t1) + creaseHi(t2) * 0.85 + creaseHi(t3) * 0.6) * u_light.x;

  vec2 cssPx = px / u_dpr;
  vec2 cssSize = u_resolution / u_dpr;
  float rim = min(min(cssPx.x, cssSize.x - cssPx.x), min(cssPx.y, cssSize.y - cssPx.y));
  d += exp(-min(rim, 90.0) / 30.0) * 0.05 * u_light.y;
  tonal += smoothstep(0.55, 0.95, distance(vp, vec2(0.5))) * 0.04 * u_light.y;

  // Print pass: el tono no se pinta continuo, se imprime como trama.
  float tone = clamp(0.5 + tonal * 9.0, 0.0, 1.0);
  float cellD = length(fract(latticeCoord(px, u_pitch * u_dpr)) - 0.5);
  float dotR = mix(0.08, 0.66, tone);
  float halftone = smoothstep(dotR + 0.16, dotR - 0.16, cellD);
  float amount = (0.18 + 0.82 * smoothstep(0.0, 0.14, abs(tone - 0.5))) * u_light.w;
  d += mix(tonal, (halftone - 0.5) * 0.16, amount);

  float inkA = clamp(max(d, 0.0) * u_strength, 0.0, 0.35);
  float hiA = clamp((max(-d, 0.0) + hi) * u_strength, 0.0, 0.3);
  vec3 color = mix(mix(u_paper, u_ink, inkA), u_hi, hiA);
  // Dither de un nivel: sin el, los degradados suaves del papel hacen bandas.
  color += (hash(px * 1.7) - 0.5) / 255.0;

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

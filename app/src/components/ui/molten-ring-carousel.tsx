"use client";

// A carousel whose cards behave like drops of liquid held on glass.
//
// The circle is far larger than the frame and its centre sits well off to the
// left, so only a sliver of it ever crosses the viewport - which reads as a
// tall arc of work sweeping past with one card square to the viewer. Scroll,
// drag or swipe turns it.
//
// There is no mesh here and there are no image elements. Each card is a
// rounded-box distance field and the frame is one fullscreen pass taking a
// smooth minimum over the lot. That single operator buys the physics: two cards
// approaching never overlap, their fields fuse; two separating leave a strand
// behind, because the strand is one more term in the same field and narrows,
// hangs and finally parts of its own accord as the distance grows.
//
// The cursor is never painted. It widens the fusion radius beneath itself, tips
// nearby cards toward it, elbows their neighbours aside, and draws strands out
// between them.
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface MoltenRingItem {
  /** Cover art. Cross-origin sources must send CORS headers. */
  image: string;
  /** Shown to the left of the ring while this card is at the front. */
  title: string;
  /** The line to the right of the ring - discipline, year, whatever. */
  meta?: string;
  /** Casual short description / tagline */
  description?: string;
  /** Destination route or external URL */
  href?: string;
  /** Optional badge */
  badge?: string;
}

export interface MoltenRingCarouselProps extends Omit<
  React.ComponentPropsWithoutRef<"section">,
  "children" | "onSelect"
> {
  items: MoltenRingItem[];
  /** Wordmark in the top-left. Omit to drop it. @default undefined */
  brand?: string;
  /** Ring radius, in stage widths. Larger flattens the arc. @default 1.35 */
  arc?: number;
  /** Card long edge, as a fraction of the stage width. @default 0.58 */
  cardSize?: number;
  /** Card long edge / short edge. Art is cover-fitted into it. @default 1.5 */
  cardRatio?: number;
  /** Fusion radius between neighbours, in card long-edges. @default 0.087 */
  fuse?: number;
  /** String threads between cards as they pull apart. @default true */
  threads?: boolean;
  /** Optical band that bends the image at the upper and lower borders. @default true */
  glass?: boolean;
  /** Optional callback when an item is selected */
  onSelect?: (item: MoltenRingItem, index: number) => void;
  /** Controlled rotation index / progress from page scroll */
  controlledIndex?: number;
  /** When true, wheel events are not intercepted with preventDefault() */
  scrollControlled?: boolean;
  /** Callback whenever the active card index changes */
  onActiveChange?: (index: number) => void;
  /** Explicit trigger for entry animation @default undefined */
  activeInView?: boolean;
  /** Show built-in side captions @default true */
  showFlanks?: boolean;
  /** Extra classes on the root surface. @default undefined */
  className?: string;
}

/** Each uniform-array element occupies a vec4 register; WebGL2 guarantees only
    224. Two dozen already exceeds what the visible arc can hold. */
const MAX_CARDS = 24;
const MAX_STRANDS = 24;

/* Every figure below is expressed as a multiple of the card's long edge, so
   proportions survive any viewport instead of being tuned to one screen. */
const FUSE = 0.016; // minimal resting blend: cards stay distinct and readable, not sticky goo
const CORNER = 0.02;
const CROSSFADE = 0.02;
const SPACING = 1.95; // generous arc spacing so cards don't clump or crowd each other

/* Cursor. Subtle tilt and swell, keeping the card rock-solid centered when not hovered. */
const CURSOR_FUSE = 0.014;
const CURSOR_REACH = 0.45;
const PULL = 0.016; // subtle responsive tilt towards cursor
const SWELL = 0.04;
const REACH = 0.7; // only reacts when cursor is near the card
const GRAB = 0.12;
const RELEASE = 0.05;
const NEIGHBOUR_PUSH = 0.012; // minimal neighbor push to prevent jarring shifts
const NEIGHBOUR_SCALE = 0.015;
const NEIGHBOUR_DIM = 0.12;
const NEIGHBOUR_REACH = 1.8;
const WAVE = 0.005;
const WAVE_FREQ = 16;
const WAVE_SPEED = 5;

/* Strands. Delicate thin liquid threads instead of heavy sticky bridges. */
const STRAND = 0.07;
const STRAND_SNAP = 1.15;
const WAIST = 0.22;
const SAG = 0.01;
const WELD = 0.02;

/* Optical band running across the upper and lower borders. */
const BAND = 0.06;
const REFRACT = 0.12;
const SQUEEZE = 0.04;
const RIPPLE = 0.01;
const RIPPLE_FREQ = 8;
const FRINGE = 0.003;
const SHEEN = 0.04;

const WOBBLE = 0.004;

/* Turn. */
const WHEEL = 0.0022;
const DRAG = 0.007;
const EASE = 0.08;
const SNAP_IDLE = 260;
const SNAP_EASE = 0.06;
const CLICK_SLOP = 6;
const CLICK_MS = 700;

/* Arrival. Blooms outward from a single central droplet/dot when entering view. */
const ENTRY_MS = 1800;

const THEME_EVERY = 20;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const inOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const outCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

const QUAD_VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos;
  gl_Position = vec4(aPos * 2.0 - 1.0, 0.0, 1.0);
}`;

const RING_FRAG = /* glsl */ `#version 300 es
precision highp float;

#define MAX_CARDS ${MAX_CARDS}
#define MAX_STRANDS ${MAX_STRANDS}

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uResolution;   // px
uniform vec2  uSize;         // resting card size in px - long edge, short edge
uniform float uCorner;

uniform float uCount;
uniform vec2  uCentre[MAX_CARDS];   // centre in px, origin at the stage centre
uniform float uAngle[MAX_CARDS];   // radians
// xy = per-axis scale, z = brightness, w = atlas cell index.
uniform vec4  uCardState[MAX_CARDS];

uniform float uStrandCount;
uniform vec2  uStrandA[MAX_STRANDS];
uniform vec2  uStrandB[MAX_STRANDS];
uniform vec4  uStrandPar[MAX_STRANDS];  // end thickness, waist, hang, weld width

uniform float uFuse;            // blend strength, px
uniform float uJitter;
uniform float uTime;
uniform vec3  uColor;        // untextured fallback, and the loading silhouette

uniform sampler2D uAtlas;    // one sheet; sampler arrays need a constant index
uniform vec2  uGrid;         // cells across, down
uniform float uCrossfade;        // px over which neighbouring art crossfades
uniform float uHasArt;

uniform vec4  uCursor;        // xy in px, z = engaged 0..1, w = added fusion
uniform vec4  uWake;         // radius px, amplitude px, spatial freq, rate

uniform float uLipDepth;         // glass lip depth, px - 0 turns it off
uniform vec4  uLip;        // refract px, squeeze, ripple px, ripple frequency
uniform float uFringe;
uniform float uSheen;

vec2 atlasUV(vec2 uv, float idx) {
  return (vec2(mod(idx, uGrid.x), floor(idx / uGrid.x)) + uv) / uGrid;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  ) * 2.0 - 1.0;
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float sdStrand(vec2 p, vec2 a, vec2 b, float rEnd, float rMid, float sag) {
  vec2 ba = b - a;
  float len = length(ba);
  if (len < 0.001) return 1e6;

  vec2 dir = ba / len;
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 q = p - (a + b) * 0.5;
  float along = dot(q, dir);
  float across = dot(q, nrm);

  float h = clamp(along / len + 0.5, 0.0, 1.0);
  float bell = sin(3.14159265 * h);
  across += sag * bell * nrm.y;
  float r = mix(rMid, rEnd, pow(1.0 - bell, 1.7));

  return max(abs(along) - len * 0.5, abs(across) - r);
}

float smin(float a, float b, float k) {
  if (k <= 0.0001) return min(a, b);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float lipWarp(inout vec2 p) {
  if (uLipDepth <= 0.5) return 0.0;
  float dy = abs(p.y) - (uResolution.y * 0.5 - uLipDepth);
  if (dy <= 0.0) return 0.0;

  float t = clamp(dy / uLipDepth, 0.0, 1.0);
  float bend = 1.0 - sqrt(max(0.0, 1.0 - t * t));

  p.y -= sign(p.y) * bend * (uLip.x + sin(p.x * uLip.w) * uLip.z);
  p.x *= 1.0 - bend * uLip.y;
  return bend;
}

void main() {
  vec2 p = (vUv - 0.5) * uResolution;
  float bend = lipWarp(p);

  float toCursor = length(p - uCursor.xy);

  float k = uFuse;
  if (uCursor.z > 0.001) {
    float t = 1.0 - smoothstep(0.0, max(uWake.x, 1.0), toCursor);
    k += uCursor.w * uCursor.z * t * t;
  }

  float d = 1e6;

  float d0 = 1e6, d1 = 1e6;
  vec2 uv0 = vec2(0.5), uv1 = vec2(0.5);
  float im0 = 0.0, im1 = 0.0;
  float dm0 = 1.0, dm1 = 1.0;

  float halfSpan = length(uSize) * 0.5;

  for (int i = 0; i < MAX_CARDS; i++) {
    if (float(i) >= uCount) break;

    vec4 st = uCardState[i];
    float grown = max(st.x, st.y);
    if (grown <= 0.0001) continue;

    vec2 q = p - uCentre[i];
    float cull = halfSpan * grown + k + uJitter + 8.0;
    if (dot(q, q) > cull * cull) continue;

    float ca = cos(uAngle[i]), sa = sin(uAngle[i]);
    q = vec2(q.x * ca + q.y * sa, -q.x * sa + q.y * ca);

    vec2 halfSize = max(uSize * 0.5 * st.xy, vec2(0.0001));
    float rMax = min(halfSize.x, halfSize.y);
    float r = min(rMax, mix(rMax, uCorner, smoothstep(0.30, 1.0, min(st.x, st.y))));

    float di = sdRoundBox(q, halfSize, r);
    d = smin(d, di, k);

    vec2 luv = clamp(q / (2.0 * halfSize) + 0.5, 0.004, 0.996);
    luv.y = 1.0 - luv.y;

    if (di < d0) {
      d1 = d0; uv1 = uv0; im1 = im0; dm1 = dm0;
      d0 = di; uv0 = luv; im0 = st.w; dm0 = st.z;
    } else if (di < d1) {
      d1 = di; uv1 = luv; im1 = st.w; dm1 = st.z;
    }
  }

  for (int i = 0; i < MAX_STRANDS; i++) {
    if (float(i) >= uStrandCount) break;
    vec4 par = uStrandPar[i];
    if (par.x <= -3.0) continue;
    vec2 a = uStrandA[i], b = uStrandB[i];
    vec2 mid = (a + b) * 0.5;
    float span = length(b - a) * 0.5 + par.x + par.w + 8.0;
    if (dot(p - mid, p - mid) > span * span) continue;
    d = smin(d, sdStrand(p, a, b, par.x, par.y, par.z), par.w);
  }

  if (uJitter > 0.001) {
    d += noise(p * 0.012 + vec2(uTime * 0.22, uTime * -0.17)) * uJitter;
  }

  if (uWake.y > 0.001) {
    d += sin(toCursor * uWake.z - uTime * uWake.w)
       * uWake.y * exp(-toCursor / max(uWake.x, 1.0));
  }

  float aa = clamp(fwidth(d), 0.5, 2.0);
  float alpha = 1.0 - smoothstep(-aa, aa, d);
  if (alpha <= 0.001) discard;

  float nearest = smoothstep(-uCrossfade, uCrossfade, d1 - d0);

  vec3 col = uColor;
  if (uHasArt > 0.5) {
    vec2 fr = vec2(uFringe * bend, 0.0);
    vec3 c0 = vec3(
      texture(uAtlas, atlasUV(uv0 + fr, im0)).r,
      texture(uAtlas, atlasUV(uv0, im0)).g,
      texture(uAtlas, atlasUV(uv0 - fr, im0)).b
    );
    vec3 c1 = vec3(
      texture(uAtlas, atlasUV(uv1 + fr, im1)).r,
      texture(uAtlas, atlasUV(uv1, im1)).g,
      texture(uAtlas, atlasUV(uv1 - fr, im1)).b
    );
    col = mix(c1, c0, nearest);
  }

  col *= mix(dm1, dm0, nearest);
  col += bend * uSheen;

  fragColor = vec4(col, alpha);
}`;

function build(gl: WebGL2RenderingContext, vert: string, frag: string) {
  const program = gl.createProgram();
  if (!program) return null;
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vert],
    [gl.FRAGMENT_SHADER, frag],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function uniforms(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const cache = new Map<string, WebGLUniformLocation | null>();
  return (name: string) => {
    let loc = cache.get(name);
    if (loc === undefined) {
      loc = gl.getUniformLocation(program, name);
      cache.set(name, loc);
    }
    return loc;
  };
}

function colorReader() {
  const probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  return (css: string): [number, number, number] => {
    if (!ctx) return [0, 0, 0];
    ctx.fillStyle = "#000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255];
  };
}

/** A single sheet, each cell cover-fitted at crisp 1024px cell resolution. */
function packAtlas(
  images: HTMLImageElement[],
  cols: number,
  cell: number,
  ratio: number,
) {
  const rows = Math.ceil(images.length / cols);
  const sheet = document.createElement("canvas");
  sheet.width = cols * cell;
  sheet.height = rows * Math.round(cell / ratio);
  const ctx = sheet.getContext("2d");
  if (!ctx) return sheet;
  const cellH = Math.round(cell / ratio);
  images.forEach((image, i) => {
    if (!image.naturalWidth || !image.naturalHeight) return;
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * cellH;
    const scale = Math.max(
      cell / image.naturalWidth,
      cellH / image.naturalHeight,
    );
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, cell, cellH);
    ctx.clip();
    ctx.drawImage(image, x + (cell - w) / 2, y + (cellH - h) / 2, w, h);
    ctx.restore();
  });
  return sheet;
}

export function MoltenRingCarousel({
  items,
  brand,
  arc = 1.35,
  cardSize = 0.58,
  cardRatio = 1.5,
  fuse = FUSE,
  threads = true,
  glass = true,
  onSelect,
  controlledIndex,
  scrollControlled = false,
  onActiveChange,
  activeInView,
  showFlanks = true,
  className,
  ...props
}: MoltenRingCarouselProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [active, setActive] = React.useState(0);
  const [reduced, setReduced] = React.useState(false);
  const [supported, setSupported] = React.useState(true);
  const navigate = useNavigate();

  const settings = React.useRef({
    arc,
    cardSize,
    cardRatio,
    fuse,
    threads,
    glass,
  });
  const onSelectRef = React.useRef(onSelect);
  const onActiveChangeRef = React.useRef(onActiveChange);
  const activeInViewRef = React.useRef(activeInView);
  const controlledRef = React.useRef(controlledIndex);
  const navigateRef = React.useRef(navigate);
  const itemsRef = React.useRef(items);

  React.useEffect(() => {
    settings.current = { arc, cardSize, cardRatio, fuse, threads, glass };
    onSelectRef.current = onSelect;
    onActiveChangeRef.current = onActiveChange;
    activeInViewRef.current = activeInView;
    controlledRef.current = controlledIndex;
    navigateRef.current = navigate;
    itemsRef.current = items;
  });

  const step = React.useRef<(by: number) => void>(() => {});

  const count = Math.min(items.length, MAX_CARDS);
  const sources = items.map((item) => item.image).join(" ");

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !count) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) {
      setSupported(false);
      return;
    }

    const readColor = colorReader();
    const program = build(gl, QUAD_VERT, RING_FRAG);
    if (!program) return;
    const u = uniforms(gl, program);

    const quad = gl.createVertexArray();
    gl.bindVertexArray(quad);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // --- art (High-Res 1024px cells for Retina Display) -------------------
    const COLS = Math.min(3, count);
    const CELL = 1024;
    let atlas: WebGLTexture | null = null;
    let loaded = 0;
    const images = items.slice(0, count).map((item) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      const settle = () => {
        if (++loaded < count) return;
        atlas = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, atlas);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          packAtlas(images, COLS, CELL, settings.current.cardRatio),
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };
      image.onload = settle;
      image.onerror = () => {
        console.warn(`molten-ring-carousel: ${item.image} failed to load`);
        settle();
      };
      image.src = item.image;
      return image;
    });

    // --- state ------------------------------------------------------------
    const FRONT = Math.floor(count / 2);
    // Start with card 0 in the front slot
    let width = 0;
    let height = 0;
    let progress = -FRONT;
    let goal = -FRONT;
    let lastInput = 0;
    let snapped = true;
    let hovered = -1;
    let pointerX = -1;
    let pointerY = -1;
    let pointerSpeed = 0;
    let entry = 0;
    let clock = 0;
    let previous = 0;
    let ticks = 0;
    let frame = 0;
    let tween: { from: number; to: number; at: number } | null = null;
    let ink: [number, number, number] = [0, 0, 0];

    const leanX = new Float32Array(count);
    const leanY = new Float32Array(count);
    const swell = new Float32Array(count);
    const dim = new Float32Array(count);

    const pos = new Float32Array(MAX_CARDS * 2);
    const rot = new Float32Array(MAX_CARDS);
    const scale = new Float32Array(MAX_CARDS * 4);
    const strandA = new Float32Array(MAX_STRANDS * 2);
    const strandB = new Float32Array(MAX_STRANDS * 2);
    const strandPar = new Float32Array(MAX_STRANDS * 4);

    const at = Array.from({ length: count }, () => ({
      x: 0,
      y: 0,
      angle: 0,
      scale: 1,
    }));

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let hasEntered = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          hasEntered = true;
        }
      },
      { threshold: 0.1 }
    );
    io.observe(canvas);

    // --- input ------------------------------------------------------------
    const onWheel = (event: WheelEvent) => {
      if (scrollControlled) return; // Allow natural page scroll to drive the carousel
      event.preventDefault();
      tween = null;
      goal += event.deltaY * WHEEL;
      lastInput = performance.now();
      snapped = false;
    };
    canvas.addEventListener("wheel", onWheel, { passive: scrollControlled });

    step.current = (by: number) => {
      tween = { from: goal, to: Math.round(goal) + by, at: performance.now() };
      lastInput = performance.now();
      snapped = true;
    };

    let dragFrom: number | null = null;
    let dragTravel = 0;
    const onDown = (event: PointerEvent) => {
      dragFrom = event.clientY;
      dragTravel = 0;
      tween = null;
      canvas.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const nx = event.clientX - box.left;
      const ny = event.clientY - box.top;
      pointerSpeed = Math.hypot(nx - pointerX, ny - pointerY);
      pointerX = nx;
      pointerY = ny;
      if (dragFrom !== null) {
        const travel = dragFrom - event.clientY;
        dragTravel += Math.abs(travel);
        dragFrom = event.clientY;
        goal += travel * DRAG;
        lastInput = performance.now();
        snapped = false;
      }
    };
    const onUp = () => {
      const wasClick = dragFrom !== null && dragTravel < CLICK_SLOP;
      dragFrom = null;
      if (!wasClick || hovered < 0) return;

      const activeIdx = (((Math.round(progress) + FRONT) % count) + count) % count;

      if (hovered === activeIdx) {
        const targetItem = itemsRef.current[hovered];
        if (targetItem) {
          if (onSelectRef.current) {
            onSelectRef.current(targetItem, hovered);
          } else if (targetItem.href) {
            if (targetItem.href.startsWith("http")) {
              window.open(targetItem.href, "_blank", "noopener,noreferrer");
            } else if (targetItem.href.startsWith("#")) {
              const el = document.querySelector(targetItem.href);
              el?.scrollIntoView({ behavior: "smooth" });
            } else {
              navigateRef.current(targetItem.href);
            }
          }
        }
        return;
      }

      // Rotate to front slot
      const want = hovered - FRONT;
      tween = {
        from: goal,
        to: want + Math.round((goal - want) / count) * count,
        at: performance.now(),
      };
      snapped = true;
    };
    const onLeave = () => {
      pointerX = -1;
      pointerY = -1;
      hovered = -1;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);

    // --- frame ------------------------------------------------------------
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (!width || !height) return;
      const dt = previous ? Math.min((now - previous) / 1000, 1 / 20) : 0;
      previous = now;
      clock += dt;
      const config = settings.current;

      if (ticks++ % THEME_EVERY === 0)
        ink = readColor(getComputedStyle(canvas).color);

      const shouldBloom = atlas && (hasEntered || activeInViewRef.current);
      if (shouldBloom)
        entry = reduced ? 1 : Math.min(1, entry + (dt * 1000) / ENTRY_MS);
      const spread = inOutCubic(entry);

      // --- turn -----------------------------------------------------------
      if (controlledRef.current !== undefined) {
        goal = -FRONT + controlledRef.current;
        tween = null;
      } else if (tween) {
        const t = clamp((now - tween.at) / CLICK_MS, 0, 1);
        goal = tween.from + (tween.to - tween.from) * outCubic(t);
        if (t >= 1) tween = null;
      } else if (!snapped && now - lastInput > SNAP_IDLE) {
        goal = Math.round(goal);
        snapped = true;
      }

      progress +=
        (goal - progress) * (reduced ? 1 : controlledRef.current !== undefined ? 0.12 : snapped ? SNAP_EASE : EASE);
      const speed = Math.abs(goal - progress);

      const near = (((Math.round(progress) + FRONT) % count) + count) % count;
      setActive((prev) => {
        if (prev !== near) {
          onActiveChangeRef.current?.(near);
          return near;
        }
        return prev;
      });

      // --- geometry: HEROIC CENTERPIECE SCALE -----------------------------
      // Up to ~58% of viewport width and ~70% of viewport height (widescreen 1.5:1 ratio)
      const maxLongByHeight = height * 0.70 * config.cardRatio;
      const maxLongByWidth = width * (width < 768 ? 0.90 : config.cardSize);
      const long = Math.min(maxLongByWidth, maxLongByHeight);
      const short = long / config.cardRatio;
      const radius = width * config.arc;
      const angleStep = (short * SPACING) / radius;
      const centreX = -radius;

      for (let i = 0; i < count; i++) {
        const slot = ((((i - progress) % count) + count) % count) - FRONT;
        const angle = slot * angleStep * spread;
        at[i].angle = angle;
        at[i].x = centreX + Math.cos(angle) * radius;
        at[i].y = Math.sin(angle) * radius;
      }

      // --- pointer ---------------------------------------------------------
      const mx = pointerX >= 0 ? pointerX - width / 2 : 0;
      const my = pointerY >= 0 ? height / 2 - pointerY : 0;
      const present = pointerX >= 0 ? 1 : 0;

      if (present && pointerSpeed < 24) {
        hovered = -1;
        let best = Infinity;
        for (let i = 0; i < count; i++) {
          const dx = Math.abs(mx - at[i].x);
          const dy = Math.abs(my - at[i].y);
          if (dx > long / 2 || dy > short / 2) continue;
          const distance = dx + dy;
          if (distance < best) {
            best = distance;
            hovered = i;
          }
        }
      }
      pointerSpeed *= 0.85;

      let strands = 0;
      for (let i = 0; i < count; i++) {
        const dx = mx - at[i].x;
        const dy = my - at[i].y;
        const pull = present
          ? Math.max(0, 1 - Math.hypot(dx, dy) / (long * REACH))
          : 0;
        const isHovered = i === hovered ? 1 : 0;

        const towardX = dx * (pull * pull) * PULL * long * 0.02;
        const towardY = dy * (pull * pull) * PULL * long * 0.02;
        leanX[i] += (towardX - leanX[i]) * (pull > 0 ? GRAB : RELEASE);
        leanY[i] += (towardY - leanY[i]) * (pull > 0 ? GRAB : RELEASE);

        let push = 0;
        let dimTarget = 0;
        if (hovered >= 0 && i !== hovered) {
          let gap = Math.abs(i - hovered);
          gap = Math.min(gap, count - gap);
          const off = Math.max(0, 1 - gap / NEIGHBOUR_REACH);
          push =
            Math.sign(at[i].y - at[hovered].y || 1) *
            off *
            NEIGHBOUR_PUSH *
            long;
          dimTarget = off * NEIGHBOUR_DIM;
        }
        dim[i] += (dimTarget - dim[i]) * (dimTarget > dim[i] ? GRAB : RELEASE);

        const wantSwell =
          pull * pull * SWELL +
          isHovered * NEIGHBOUR_SCALE -
          dimTarget * (NEIGHBOUR_SCALE / NEIGHBOUR_DIM);
        swell[i] +=
          (wantSwell - swell[i]) * (wantSwell > swell[i] ? GRAB : RELEASE);

        at[i].x += leanX[i];
        at[i].y += leanY[i] + push;
        at[i].scale = (0.01 + 0.99 * spread) * (1 + swell[i]);

        pos[i * 2] = at[i].x;
        pos[i * 2 + 1] = at[i].y;
        rot[i] = at[i].angle;
        scale[i * 4] = at[i].scale;
        scale[i * 4 + 1] = at[i].scale;
        scale[i * 4 + 2] = 1 - dim[i];
        scale[i * 4 + 3] = i;
      }

      // --- strands ----------------------------------------------------------
      if (config.threads) {
        for (let i = 0; i < count && strands < MAX_STRANDS; i++) {
          const j = (i + 1) % count;
          const gap = Math.hypot(at[j].x - at[i].x, at[j].y - at[i].y);
          const opening = (gap - short) / (short * STRAND_SNAP);
          if (opening > 1 || opening < -1) continue;
          const strength = Math.max(
            1 - spread,
            hovered === i || hovered === j ? 1 : 0,
          );
          if (strength < 0.02) continue;
          const rEnd =
            short * 0.5 * STRAND * strength * (1 - clamp(opening, 0, 1));
          if (rEnd <= 0.5) continue;
          strandA[strands * 2] = at[i].x;
          strandA[strands * 2 + 1] = at[i].y;
          strandB[strands * 2] = at[j].x;
          strandB[strands * 2 + 1] = at[j].y;
          strandPar[strands * 4] = rEnd;
          strandPar[strands * 4 + 1] = rEnd * WAIST;
          strandPar[strands * 4 + 2] = SAG * long * clamp(opening, 0, 1);
          strandPar[strands * 4 + 3] = WELD * long;
          strands++;
        }
      }

      // --- draw -------------------------------------------------------------
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(quad);

      gl.uniform2f(u("uResolution"), width, height);
      gl.uniform2f(u("uSize"), long, short);
      gl.uniform1f(u("uCorner"), CORNER * long);
      gl.uniform1f(u("uCount"), count);
      gl.uniform2fv(u("uCentre"), pos);
      gl.uniform1fv(u("uAngle"), rot);
      gl.uniform4fv(u("uCardState"), scale);
      gl.uniform1f(u("uStrandCount"), strands);
      gl.uniform2fv(u("uStrandA"), strandA);
      gl.uniform2fv(u("uStrandB"), strandB);
      gl.uniform4fv(u("uStrandPar"), strandPar);
      gl.uniform1f(u("uFuse"), config.fuse * long);
      gl.uniform1f(
        u("uJitter"),
        reduced ? 0 : WOBBLE * long * clamp(speed * 2 + (1 - spread), 0, 1),
      );
      gl.uniform1f(u("uTime"), reduced ? 0 : clock);
      gl.uniform3fv(u("uColor"), ink);
      gl.uniform1f(u("uCrossfade"), CROSSFADE * long);
      gl.uniform1f(u("uHasArt"), atlas ? 1 : 0);
      gl.uniform2f(u("uGrid"), COLS, Math.ceil(count / COLS));
      gl.uniform4f(u("uCursor"), mx, my, present, CURSOR_FUSE * long);
      gl.uniform4f(
        u("uWake"),
        CURSOR_REACH * long,
        reduced ? 0 : WAVE * long * clamp(pointerSpeed / 40, 0, 1),
        WAVE_FREQ / long,
        WAVE_SPEED,
      );
      gl.uniform1f(u("uLipDepth"), config.glass ? BAND * height : 0);
      gl.uniform4f(
        u("uLip"),
        REFRACT * long,
        SQUEEZE,
        RIPPLE * long,
        RIPPLE_FREQ / long,
      );
      gl.uniform1f(u("uFringe"), FRINGE);
      gl.uniform1f(u("uSheen"), SHEEN);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.uniform1i(u("uAtlas"), 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      for (const image of images) image.onload = null;
      if (atlas) gl.deleteTexture(atlas);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(quad);
      gl.deleteProgram(program);
    };
  }, [sources, count, reduced, scrollControlled, items]);

  const item = items[active];

  // No WebGL2 fallback
  if (!supported) {
    return (
      <section
        aria-roledescription="carousel"
        aria-label={brand ?? "Gallery"}
        className={cn(
          "bg-background text-foreground relative h-full min-h-[28rem] w-full",
          className,
        )}
        {...props}
      >
        <ul className="flex h-full snap-y snap-mandatory flex-col items-center gap-6 overflow-y-auto py-8 px-4">
          {items.map((entry) => (
            <li key={entry.image} className="w-full max-w-xl shrink-0 snap-center">
              {entry.href ? (
                <Link
                  to={entry.href}
                  className="block group rounded-2xl overflow-hidden border border-border bg-card p-4 transition-all hover:border-primary/50 shadow-lg"
                >
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="w-full rounded-xl object-cover"
                    style={{ aspectRatio: cardRatio }}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground text-lg">{entry.title}</h4>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{entry.description}</p>
                      )}
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ) : (
                <div className="rounded-2xl overflow-hidden border border-border bg-card p-4">
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="w-full rounded-xl object-cover"
                    style={{ aspectRatio: cardRatio }}
                  />
                  <div className="mt-3">
                    <h4 className="font-semibold text-foreground text-lg">{entry.title}</h4>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{entry.description}</p>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label={brand ?? "Gallery"}
      className={cn(
        "bg-background text-foreground relative h-full min-h-[30rem] w-full overflow-hidden select-none",
        className,
      )}
      {...props}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="listbox"
        aria-label={brand ?? "Gallery"}
        aria-activedescendant={`molten-ring-${active}`}
        className="text-foreground focus-visible:outline-foreground absolute inset-0 h-full w-full cursor-grab touch-pan-x outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 active:cursor-grabbing"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowRight") step.current(1);
          else if (event.key === "ArrowUp" || event.key === "ArrowLeft") step.current(-1);
          else if (event.key === "Enter" && item?.href) {
            navigate(item.href);
          } else return;
          event.preventDefault();
        }}
      />

      {/* Screen-reader list */}
      <ul className="sr-only">
        {items.map((entry, i) => (
          <li
            key={entry.image}
            id={`molten-ring-${i}`}
            role="option"
            aria-selected={i === active}
          >
            {entry.title}
            {entry.meta ? `. ${entry.meta}` : ""}
            {entry.description ? `. ${entry.description}` : ""}
          </li>
        ))}
      </ul>

      {/* Optional Top Left Brand / Tagline */}
      {brand ? (
        <div className="pointer-events-none absolute top-6 left-6 md:left-10 z-10 flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold tracking-wider uppercase text-foreground/80 font-mono">
            {brand}
          </span>
        </div>
      ) : null}

      {/* Flanks (Only rendered if showFlanks is true) */}
      {showFlanks ? (
        <>
          <div className="absolute top-1/2 left-6 md:left-12 -translate-y-1/2 z-10 max-w-[260px] sm:max-w-[320px] pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-muted-foreground text-xs font-mono tabular-nums px-2 py-0.5 rounded-full border border-border/70 bg-surface/70">
                {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
              {item?.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/10 uppercase tracking-widest font-mono font-semibold">
                  {item.badge}
                </span>
              )}
            </div>

            <h3 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-foreground drop-shadow-md">
              {item?.title}
            </h3>

            {item?.description && (
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            )}

            {item?.href && (
              <div className="mt-4 pointer-events-auto">
                <Link
                  to={item.href}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-foreground bg-surface/80 hover:bg-surface border border-border/80 hover:border-primary/50 shadow-md transition-all group backdrop-blur-md"
                >
                  <span>Check it out</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-primary" />
                </Link>
              </div>
            )}
          </div>

          {item?.meta ? (
            <div className="pointer-events-none absolute top-1/2 right-6 md:right-12 -translate-y-1/2 text-right z-10 hidden sm:block max-w-[200px]">
              <div className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground/70 mb-1">
                Tier &amp; Status
              </div>
              <div className="text-foreground text-xs sm:text-sm font-semibold">
                {item.meta}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export default MoltenRingCarousel;

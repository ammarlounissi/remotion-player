import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { resolveAsset } from "../../lib/resolveAsset";

export type MosaicReframeProps = {
  /** مسارات داخل public أو روابط http(s). تُكرَّر/تُقصّ لتصبح 12 بلاطة. */
  images: string[];
  /** بذرة الخلط: نفس البذرة = نفس الترتيب والتأخير دائمًا (حتمي لكل إطار). */
  seed?: number;
  /** ثبات كل تخطيط قبل الانتقال (ثوانٍ). */
  holdSeconds?: number;
  /** مدة الانتقال بين تخطيطين (ثوانٍ). */
  transitionSeconds?: number;
  /** نسبة تفاوت بدء البلاطات داخل الانتقال (0 = كلها معًا). */
  stagger?: number;
  /** فهرس البلاطة الموسّعة في التخطيط الثاني؛ تجاهله ليُختار بالبذرة. */
  featureIndex?: number;
  padding?: number;
  gap?: number;
  borderRadius?: number;
  backgroundColor?: string;
};

export const TILE_COUNT = 12;
const LAYOUT_COUNT = 3;

type Rect = { x: number; y: number; w: number; h: number; z: number };

/** مولّد عشوائي حتمي (mulberry32). */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = <T,>(items: T[], rand: () => number): T[] => {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** مدة الفيديو لدورة كاملة متصلة (3 تخطيطات ثم العودة للأول). */
export const mosaicDuration = (
  holdSeconds: number,
  transitionSeconds: number,
  fps: number,
): number =>
  Math.max(1, Math.round(LAYOUT_COUNT * (holdSeconds + transitionSeconds) * fps));

// ---- التخطيطات: كل واحد يرجع مستطيلًا لكل بلاطة (فهرس 0..11) ----

/** 1) شبكة منتظمة 4×3. */
const gridLayout = (W: number, H: number, pad: number, gap: number): Rect[] => {
  const cols = 4;
  const rows = 3;
  const w = (W - pad * 2 - gap * (cols - 1)) / cols;
  const h = (H - pad * 2 - gap * (rows - 1)) / rows;
  return Array.from({ length: TILE_COUNT }, (_, i) => ({
    x: pad + (i % cols) * (w + gap),
    y: pad + Math.floor(i / cols) * (h + gap),
    w,
    h,
    z: 0,
  }));
};

/** 2) فسيفساء: بلاطة موسّعة يسارًا (كامل الارتفاع) والباقي (11) على شبكة 4×3 يمينًا، آخرها بعرض خليتين. */
const featureLayout = (
  W: number,
  H: number,
  pad: number,
  gap: number,
  feature: number,
): Rect[] => {
  const innerW = W - pad * 2;
  const featW = innerW * 0.4;
  const rx = pad + featW + gap;
  const cols = 4;
  const rows = 3;
  const cw = (W - pad - rx - gap * (cols - 1)) / cols;
  const ch = (H - pad * 2 - gap * (rows - 1)) / rows;

  // خلايا الجهة اليمنى لـ 11 بلاطة: الصفان الأولان 4+4، والثالث 1+1+عريضة(2).
  const cells: Array<[number, number, number]> = []; // [col, row, span]
  for (let r = 0; r < 2; r++) for (let c = 0; c < cols; c++) cells.push([c, r, 1]);
  cells.push([0, 2, 1], [1, 2, 1], [2, 2, 2]);

  let k = 0;
  return Array.from({ length: TILE_COUNT }, (_, i) => {
    if (i === feature) return { x: pad, y: pad, w: featW, h: H - pad * 2, z: 100 };
    const [c, r, span] = cells[k++];
    return {
      x: rx + c * (cw + gap),
      y: pad + r * (ch + gap),
      w: cw * span + gap * (span - 1),
      h: ch,
      z: 1,
    };
  });
};

/** 3) شلال قطري: بلاطات متراكبة من أعلى اليسار إلى أسفل اليمين، اللاحقة فوق السابقة. */
const cascadeLayout = (
  W: number,
  H: number,
  pad: number,
  order: number[],
): Rect[] => {
  const w = W * 0.27;
  const h = w * 0.75;
  const out: Rect[] = new Array(TILE_COUNT);
  order.forEach((tile, rank) => {
    const t = rank / (TILE_COUNT - 1);
    out[tile] = {
      x: pad + (W - pad * 2 - w) * t,
      y: pad + (H - pad * 2 - h) * t,
      w,
      h,
      z: 10 + rank,
    };
  });
  return out;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const MosaicReframe: React.FC<MosaicReframeProps> = ({
  images,
  seed = 7,
  holdSeconds = 2.2,
  transitionSeconds = 1.3,
  stagger = 0.5,
  featureIndex,
  padding = 40,
  gap = 16,
  borderRadius = 14,
  backgroundColor = "#101512",
}) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();

  if (images.length === 0) return <AbsoluteFill style={{ backgroundColor }} />;

  const rand = mulberry32(seed);
  // ترتيب الصور على البلاطات (يُملأ بالتكرار إذا كانت أقل من 12).
  const pool = Array.from({ length: TILE_COUNT }, (_, i) => images[i % images.length]);
  const tiles = shuffle(pool, rand);
  const delays = Array.from({ length: TILE_COUNT }, () => rand());
  const cascadeOrder = shuffle(
    Array.from({ length: TILE_COUNT }, (_, i) => i),
    rand,
  );
  const feature =
    featureIndex !== undefined
      ? Math.min(TILE_COUNT - 1, Math.max(0, Math.floor(featureIndex)))
      : Math.floor(rand() * TILE_COUNT);

  const layouts: Rect[][] = [
    gridLayout(W, H, padding, gap),
    featureLayout(W, H, padding, gap, feature),
    cascadeLayout(W, H, padding, cascadeOrder),
  ];

  const hold = Math.max(0, holdSeconds * fps);
  const trans = Math.max(1, transitionSeconds * fps);
  const phaseLen = hold + trans;
  const phaseIndex = Math.floor(frame / phaseLen) % LAYOUT_COUNT;
  const local = frame % phaseLen;
  const from = layouts[phaseIndex];
  const to = layouts[(phaseIndex + 1) % LAYOUT_COUNT];

  const spread = Math.min(0.8, Math.max(0, stagger)) * trans;
  const transFrame = local - hold; // سالب أثناء الثبات

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      {tiles.map((src, i) => {
        const start = delays[i] * spread;
        const p = interpolate(transFrame, [start, start + (trans - spread)], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.cubic),
        });
        const a = from[i];
        const b = to[i];
        // البلاطة المتحركة ترتفع فوق غيرها أثناء انتقالها.
        const moving = p > 0 && p < 1;
        const z = (p < 0.5 ? a.z : b.z) + (moving ? 50 : 0);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: lerp(a.x, b.x, p),
              top: lerp(a.y, b.y, p),
              width: lerp(a.w, b.w, p),
              height: lerp(a.h, b.h, p),
              zIndex: Math.round(z),
              borderRadius,
              overflow: "hidden",
              backgroundColor: "#1c231e",
              boxShadow:
                z > 5 ? "0 14px 40px rgba(0,0,0,0.45)" : "0 6px 18px rgba(0,0,0,0.25)",
            }}
          >
            <Img
              src={resolveAsset(src)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { resolveAsset } from "../../lib/resolveAsset";

export type Carousel3DProps = {
  /** مسارات داخل public أو روابط http(s). */
  images: string[];
  /** مدة دورة كاملة (360°) بالثواني. */
  secondsPerRotation?: number;
  /** 1: يدور باتجاه عقارب الساعة (من الأعلى)، -1: عكسه. */
  direction?: 1 | -1;
  /** عرض البطاقة كنسبة من عرض الإطار. */
  cardWidthRatio?: number;
  /** نسبة عرض/ارتفاع البطاقة. */
  cardAspect?: number;
  /** 1 = البطاقات متلاصقة تقريبًا، أكبر = حلقة أوسع بمسافات بينها. */
  radiusScale?: number;
  /** البعد المنظوري بالبكسل (أصغر = منظور أقوى). */
  perspective?: number;
  /** ميل الكاميرا للأسفل بالدرجات (لرؤية الحلقة من فوق قليلًا). */
  tilt?: number;
  /** شفافية البطاقات عند الجانبين (الأمامية = 1). */
  sideOpacity?: number;
  /** إظهار ظهر البطاقات الخلفية من الداخل. */
  showBack?: boolean;
  /** انعكاس خفيف تحت الحلقة. */
  reflection?: boolean;
  borderRadius?: number;
  backgroundColor?: string;
};

/** مدة الفيديو لدورة كاملة متصلة. */
export const carousel3DDuration = (
  secondsPerRotation: number,
  fps: number,
): number => Math.max(1, Math.round(secondsPerRotation * fps));

export const Carousel3D: React.FC<Carousel3DProps> = ({
  images,
  secondsPerRotation = 14,
  direction = 1,
  cardWidthRatio = 0.22,
  cardAspect = 3 / 4,
  radiusScale = 1.15,
  perspective = 1800,
  tilt = 8,
  sideOpacity = 0.35,
  showBack = false,
  reflection = true,
  borderRadius = 20,
  backgroundColor = "#0e1411",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  if (images.length === 0) return <AbsoluteFill style={{ backgroundColor }} />;

  // 3 بطاقات على الأقل ليكوّن "الدائرة" شكلًا مقروءًا.
  const repeat = Math.ceil(6 / images.length);
  const cards = Array.from({ length: repeat }, () => images).flat();
  const n = cards.length;

  const cardW = width * cardWidthRatio;
  const cardH = cardW / cardAspect;
  const step = 360 / n;
  // نصف قطر المضلع المنتظم الذي ضلعه عرض البطاقة: R = (w/2) / tan(π/n)
  const radius = (cardW / 2 / Math.tan(Math.PI / n)) * radiusScale;

  const rotation =
    direction *
    interpolate(frame, [0, secondsPerRotation * fps], [0, 360]);

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.08), rgba(0,0,0,0) 60%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          perspective,
          perspectiveOrigin: "50% 45%",
        }}
      >
        {/* الحلقة: تُدار كلها حول المحور الرأسي، ومركزها خلف الإطار بمقدار نصف القطر */}
        <div
          style={{
            position: "absolute",
            left: width / 2 - cardW / 2,
            top: height / 2 - cardH / 2 - (reflection ? cardH * 0.08 : 0),
            width: cardW,
            height: cardH,
            transformStyle: "preserve-3d",
            transform: `translateZ(${-radius}px) rotateX(${-tilt}deg) rotateY(${-rotation}deg)`,
          }}
        >
          {cards.map((src, i) => {
            const angle = i * step;
            // الزاوية الظاهرة للكاميرا: 0 = أمام الكاميرا مباشرة.
            const world = (((angle - rotation) % 360) + 360) % 360;
            const facing = Math.cos((world * Math.PI) / 180); // 1 أمامي، -1 خلفي
            const opacity = interpolate(
              facing,
              [-1, 0, 1],
              [showBack ? sideOpacity * 0.5 : 0, sideOpacity, 1],
            );
            const dim = interpolate(facing, [-1, 1], [0.45, 1]);

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: showBack ? "visible" : "hidden",
                  opacity,
                  filter: `brightness(${dim})`,
                  borderRadius,
                  overflow: "hidden",
                  backgroundColor: "#1c231e",
                  boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
                  // انعكاس على الأرضية (WebKit/Chromium).
                  WebkitBoxReflect: reflection
                    ? "below 14px linear-gradient(transparent 65%, rgba(255,255,255,0.22))"
                    : undefined,
                }}
              >
                <Img
                  src={resolveAsset(src)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

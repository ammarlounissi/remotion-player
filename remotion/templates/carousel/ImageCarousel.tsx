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

export type ImageCarouselProps = {
  /** مسارات داخل public أو روابط http(s). */
  images: string[];
  /** مدة بقاء كل صورة في المركز (بالثواني) = سرعة الانزلاق. */
  secondsPerImage?: number;
  /** نسبة وقت الثبات على الصورة المركزية من كل دورة (0 = حركة مستمرة بلا توقف). */
  holdRatio?: number;
  /** 1: تنزلق الصور نحو اليسار، -1: نحو اليمين. */
  direction?: 1 | -1;
  /** عرض البطاقة المركزية كنسبة من عرض الإطار. */
  centerWidthRatio?: number;
  /** نسبة عرض/ارتفاع البطاقة (عرض ÷ ارتفاع). */
  cardAspect?: number;
  /** حجم الصور الجانبية نسبةً للمركزية. */
  sideScale?: number;
  /** شفافية الصور الجانبية (المركزية دائمًا 1). */
  sideOpacity?: number;
  /** المسافة بين البطاقات كنسبة من عرض البطاقة المركزية. */
  gapRatio?: number;
  borderRadius?: number;
  backgroundColor?: string;
  /** لون ظل خفيف تحت البطاقة المركزية. */
  shadow?: boolean;
};

/** مدة الفيديو لدورة كاملة متصلة: كل الصور تمر بالمركز مرة واحدة. */
export const carouselDuration = (
  imageCount: number,
  secondsPerImage: number,
  fps: number,
): number => Math.max(1, Math.round(imageCount * secondsPerImage * fps));

const MIN_SLIDES = 5;

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  secondsPerImage = 2.5,
  holdRatio = 0.45,
  direction = 1,
  centerWidthRatio = 0.5,
  cardAspect = 3 / 4,
  sideScale = 0.7,
  sideOpacity = 0.4,
  gapRatio = 0.08,
  borderRadius = 28,
  backgroundColor = "#101512",
  shadow = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  if (images.length === 0) return <AbsoluteFill style={{ backgroundColor }} />;

  // نكرّر القائمة حتى لا تظهر الصور بشكل مفاجئ عند التفاف قليلة العدد.
  const repeat = Math.ceil(MIN_SLIDES / images.length);
  const slides = Array.from({ length: repeat }, () => images).flat();
  const n = slides.length;

  const framesPerSlide = Math.max(1, secondsPerImage * fps);
  const hold = Math.min(0.9, Math.max(0, holdRatio));

  // موضع الشريط بوحدة "صور": الجزء الصحيح = الصورة المركزية، والكسري = الانتقال.
  const cycle = frame / framesPerSlide;
  const index = Math.floor(cycle);
  const local = cycle - index;
  // يبقى ثابتًا في أول وآخر hold/2 ثم ينتقل بتسارع وتباطؤ ناعمين.
  const moveFrac = interpolate(local, [hold / 2, 1 - hold / 2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: hold === 0 ? Easing.linear : Easing.inOut(Easing.cubic),
  });
  const position = index + moveFrac;

  const centerW = width * centerWidthRatio;
  const centerH = centerW / cardAspect;
  const gap = centerW * gapRatio;
  // مسافة مركز البطاقة المركزية إلى مركز الجانبية.
  const step = (centerW + centerW * sideScale) / 2 + gap;

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      {slides.map((src, i) => {
        // الإزاحة عن المركز ملتفّة إلى [-n/2, n/2).
        let d = (((i - position) % n) + n) % n;
        if (d >= n / 2) d -= n;

        const dist = Math.abs(d);
        const scale = interpolate(dist, [0, 1, 2], [1, sideScale, sideScale * 0.85], {
          extrapolateRight: "clamp",
        });
        const opacity = interpolate(dist, [0, 1, 2], [1, sideOpacity, 0], {
          extrapolateRight: "clamp",
        });
        if (opacity <= 0.001) return null;

        // translateX: 0 للمركزية، ±step للجانبيتين، وتتابع خطي بعدهما.
        const sign = Math.sign(d) * -direction;
        const translateX =
          sign *
          interpolate(dist, [0, 1, 2], [0, step, step + (centerW * sideScale * 0.85) + gap], {
            extrapolateRight: "extend",
          });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: width / 2 - centerW / 2,
              top: height / 2 - centerH / 2,
              width: centerW,
              height: centerH,
              opacity,
              zIndex: Math.round(100 - dist * 10),
              transform: `translateX(${translateX}px) scale(${scale})`,
              borderRadius,
              overflow: "hidden",
              boxShadow:
                shadow && dist < 1
                  ? `0 ${30 * (1 - dist)}px ${80 * (1 - dist)}px rgba(0,0,0,${0.55 * (1 - dist)})`
                  : "none",
              backgroundColor: "#1c231e",
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

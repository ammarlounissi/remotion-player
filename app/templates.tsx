import type { ReactNode, Ref } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  BookShowcase,
  type BookShowcaseProps,
} from "@/remotion/templates/book/BookShowcase";
import {
  ImageCarousel,
  carouselDuration,
  type ImageCarouselProps,
} from "@/remotion/templates/carousel/ImageCarousel";
import carouselTemplate from "@/remotion/templates/carousel/carousel-template.json";
import {
  Carousel3D,
  carousel3DDuration,
  type Carousel3DProps,
} from "@/remotion/templates/carousel3d/Carousel3D";
import carousel3dTemplate from "@/remotion/templates/carousel3d/carousel3d-template.json";
import {
  MosaicReframe,
  mosaicDuration,
  type MosaicReframeProps,
} from "@/remotion/templates/mosaic/MosaicReframe";
import mosaicTemplate from "@/remotion/templates/mosaic/mosaic-template.json";
import { StoneBrandReveal } from "@/remotion/templates/stone/StoneBrandReveal";
import stoneTemplate from "@/remotion/templates/stone/stone-template.json";

/**
 * سجل القوالب: لإضافة قالب جديد أضف عنصرًا هنا فقط (لا تعدّل page.tsx).
 * thumb: "page" لصورة كتاب، أو عدد الأعمدة الصغيرة المرسومة في المصغّرة.
 */
export type TemplateEntry = {
  id: string;
  name: string;
  description: string;
  /** عرض ÷ ارتفاع التركيبة، لضبط إطار المعاينة. */
  aspect: number;
  thumb: { kind: "book" } | { kind: "bars"; className: string; count: number };
  /** false = معطّل مؤقتًا (مثل انتظار تحميل الصور). */
  enabled: boolean;
  /** رسالة تُعرض بدل المشهد (خطأ/تحميل). */
  notice?: { text: string; role: "alert" | "status" };
  renderPlayer: (ref: Ref<PlayerRef>) => ReactNode;
};

const fill = { width: "100%", height: "100%" } as const;

export const buildTemplates = (
  bookImages: string[] | null,
  bookError: string | null,
): TemplateEntry[] => {
  const carouselProps = carouselTemplate.defaultProps as unknown as ImageCarouselProps;
  const carousel3dProps = carousel3dTemplate.defaultProps as unknown as Carousel3DProps;
  const mosaicProps = mosaicTemplate.defaultProps as unknown as MosaicReframeProps;

  const bookProps: BookShowcaseProps = {
    images: bookImages ?? [],
    coverColor: "#25392f",
    title: "بسم الله الرحمن الرحيم",
    subtitle: "الحمد لله رب العالمين",
    titleFont: "fonts/Cairo-Bold.ttf",
    titleColor: "#1d2a24",
    music: null,
  };

  return [
    {
      id: "stone-brand",
      name: "حجرة بلادي",
      description: "إعلان حجري عمودي · 20 ثانية",
      aspect: 1080 / 1920,
      thumb: { kind: "bars", className: "stone-thumbnail", count: 1 },
      enabled: true,
      renderPlayer: (ref) => (
        <Player
          key="stone-brand"
          ref={ref}
          acknowledgeRemotionLicense
          component={StoneBrandReveal}
          inputProps={{ text: stoneTemplate.text }}
          durationInFrames={20 * 30}
          compositionWidth={1080}
          compositionHeight={1920}
          fps={30}
          loop
          controls={false}
          style={fill}
        />
      ),
    },
    {
      id: "book-showcase",
      name: "عرض الكتاب",
      description: "مشهد كتاب متحرك",
      aspect: 16 / 9,
      thumb: { kind: "book" },
      enabled: Boolean(bookImages) && !bookError,
      notice: bookError
        ? { text: bookError, role: "alert" }
        : !bookImages
          ? { text: "جارٍ تحميل المعاينة…", role: "status" }
          : undefined,
      renderPlayer: (ref) => (
        <Player
          key="book-showcase"
          ref={ref}
          acknowledgeRemotionLicense
          component={BookShowcase}
          inputProps={bookProps}
          durationInFrames={51 * 30}
          compositionWidth={1920}
          compositionHeight={1080}
          fps={30}
          loop
          controls={false}
          style={fill}
        />
      ),
    },
    {
      id: "image-carousel",
      name: carouselTemplate.name,
      description: carouselTemplate.description,
      aspect: carouselTemplate.width / carouselTemplate.height,
      thumb: { kind: "bars", className: "carousel-thumbnail", count: 3 },
      enabled: true,
      renderPlayer: (ref) => (
        <Player
          key="image-carousel"
          ref={ref}
          acknowledgeRemotionLicense
          component={ImageCarousel}
          inputProps={carouselProps}
          durationInFrames={carouselDuration(
            carouselProps.images.length,
            carouselProps.secondsPerImage ?? 2.5,
            carouselTemplate.fps,
          )}
          compositionWidth={carouselTemplate.width}
          compositionHeight={carouselTemplate.height}
          fps={carouselTemplate.fps}
          loop
          controls={false}
          style={fill}
        />
      ),
    },
    {
      id: "carousel-3d",
      name: carousel3dTemplate.name,
      description: carousel3dTemplate.description,
      aspect: carousel3dTemplate.width / carousel3dTemplate.height,
      thumb: { kind: "bars", className: "carousel3d-thumbnail", count: 5 },
      enabled: true,
      renderPlayer: (ref) => (
        <Player
          key="carousel-3d"
          ref={ref}
          acknowledgeRemotionLicense
          component={Carousel3D}
          inputProps={carousel3dProps}
          durationInFrames={carousel3DDuration(
            carousel3dProps.secondsPerRotation ?? 14,
            carousel3dTemplate.fps,
          )}
          compositionWidth={carousel3dTemplate.width}
          compositionHeight={carousel3dTemplate.height}
          fps={carousel3dTemplate.fps}
          loop
          controls={false}
          style={fill}
        />
      ),
    },
    {
      id: "mosaic-reframe",
      name: mosaicTemplate.name,
      description: mosaicTemplate.description,
      aspect: mosaicTemplate.width / mosaicTemplate.height,
      thumb: { kind: "bars", className: "mosaic-thumbnail", count: 4 },
      enabled: true,
      renderPlayer: (ref) => (
        <Player
          key="mosaic-reframe"
          ref={ref}
          acknowledgeRemotionLicense
          component={MosaicReframe}
          inputProps={mosaicProps}
          durationInFrames={mosaicDuration(
            mosaicProps.holdSeconds ?? 2.2,
            mosaicProps.transitionSeconds ?? 1.3,
            mosaicTemplate.fps,
          )}
          compositionWidth={mosaicTemplate.width}
          compositionHeight={mosaicTemplate.height}
          fps={mosaicTemplate.fps}
          loop
          controls={false}
          style={fill}
        />
      ),
    },
  ];
};

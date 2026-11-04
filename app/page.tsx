"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
import { StoneBrandReveal } from "@/remotion/templates/stone/StoneBrandReveal";
import stoneTemplate from "@/remotion/templates/stone/stone-template.json";

type BookImagesFile = {
  images: string[];
};

export default function Home() {
  const playerRef = useRef<PlayerRef>(null);
  const [images, setImages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState("stone-brand");
  const playOnSelection = useRef(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/book-images.json", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`تعذّر تحميل ملف الصور (${response.status})`);
        }
        return (await response.json()) as BookImagesFile;
      })
      .then((data) => {
        if (!Array.isArray(data.images) || data.images.length === 0) {
          throw new Error("ملف JSON لا يحتوي قائمة صور صالحة");
        }
        if (!cancelled) setImages(data.images);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "حدث خطأ أثناء تحميل الصور");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    player.addEventListener("play", handlePlay);
    player.addEventListener("pause", handlePause);
    setIsPlaying(player.isPlaying());

    return () => {
      player.removeEventListener("play", handlePlay);
      player.removeEventListener("pause", handlePause);
    };
  }, [activeTemplate, images]);

  useEffect(() => {
    if (!playOnSelection.current) return;
    playerRef.current?.play();
    playOnSelection.current = false;
  }, [activeTemplate]);

  const carouselProps = carouselTemplate.defaultProps as unknown as ImageCarouselProps;
  const carouselFps = carouselTemplate.fps;

  const bookProps: BookShowcaseProps = {
    images: images ?? [],
    coverColor: "#25392f",
    title: "بسم الله الرحمن الرحيم",
    subtitle: "الحمد لله رب العالمين",
    titleFont: "fonts/Cairo-Bold.ttf",
    titleColor: "#1d2a24",
    music: null,
  };

  const togglePlayback = () => {
    if (isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }
  };

  const selectTemplate = (template: string) => {
    if (template === activeTemplate) {
      playerRef.current?.play();
      return;
    }
    playOnSelection.current = true;
    setActiveTemplate(template);
  };

  return (
    <main className="workspace-shell">
      <section className="preview-shell" aria-label="معاينة القالب">
        <div
          className={`preview-frame${activeTemplate === "stone-brand" ? " is-portrait" : ""}`}
        >
          <Suspense fallback={<div className="player-fallback" role="status">جارٍ تجهيز المشهد…</div>}>
            {activeTemplate === "stone-brand" ? (
              <Player
                key="stone-brand"
                ref={playerRef}
                acknowledgeRemotionLicense
                component={StoneBrandReveal}
                inputProps={{ text: stoneTemplate.text }}
                durationInFrames={20 * 30}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={30}
                loop
                controls={false}
                style={{ width: "100%", height: "100%" }}
              />
            ) : activeTemplate === "image-carousel" ? (
              <Player
                key="image-carousel"
                ref={playerRef}
                acknowledgeRemotionLicense
                component={ImageCarousel}
                inputProps={carouselProps}
                durationInFrames={carouselDuration(
                  carouselProps.images.length,
                  carouselProps.secondsPerImage ?? 2.5,
                  carouselFps,
                )}
                compositionWidth={carouselTemplate.width}
                compositionHeight={carouselTemplate.height}
                fps={carouselFps}
                loop
                controls={false}
                style={{ width: "100%", height: "100%" }}
              />
            ) : error ? (
              <div className="player-fallback" role="alert">{error}</div>
            ) : images ? (
              <Player
                key="book-showcase"
                ref={playerRef}
                acknowledgeRemotionLicense
                component={BookShowcase}
                inputProps={bookProps}
                durationInFrames={51 * 30}
                compositionWidth={1920}
                compositionHeight={1080}
                fps={30}
                loop
                controls={false}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div className="player-fallback" role="status">جارٍ تحميل المعاينة…</div>
            )}
          </Suspense>
        </div>
      </section>

      <aside className="sidebar" aria-label="تحكم القوالب">
        <div className="sidebar-heading">
          <span className="sidebar-kicker">REMOTION PLAYER</span>
          <h1>استوديو المعاينة</h1>
        </div>

        <button
          className="playback-button"
          type="button"
          onClick={togglePlayback}
          disabled={activeTemplate === "book-showcase" && (!images || Boolean(error))}
          aria-label={isPlaying ? "إيقاف المعاينة مؤقتًا" : "تشغيل المعاينة"}
        >
          <span className="playback-icon" aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span>
          <span>{isPlaying ? "إيقاف مؤقت" : "تشغيل المعاينة"}</span>
        </button>

        <div className="template-section">
          <h2>القوالب</h2>
          <button
            className={`template-item${activeTemplate === "stone-brand" ? " is-active" : ""}`}
            type="button"
            onClick={() => selectTemplate("stone-brand")}
            aria-pressed={activeTemplate === "stone-brand"}
          >
            <span className="template-thumbnail stone-thumbnail" aria-hidden="true">
              <span />
            </span>
            <span className="template-copy">
              <span className="template-name">حجرة بلادي</span>
              <span className="template-description">إعلان حجري عمودي · 20 ثانية</span>
            </span>
            <span className="template-play" aria-hidden="true">▶</span>
          </button>
          <button
            className={`template-item${activeTemplate === "book-showcase" ? " is-active" : ""}`}
            type="button"
            onClick={() => selectTemplate("book-showcase")}
            disabled={!images || Boolean(error)}
            aria-pressed={activeTemplate === "book-showcase"}
          >
            <span className="template-thumbnail" aria-hidden="true">
              <span />
            </span>
            <span className="template-copy">
              <span className="template-name">عرض الكتاب</span>
              <span className="template-description">مشهد كتاب متحرك</span>
            </span>
            <span className="template-play" aria-hidden="true">▶</span>
          </button>
          <button
            className={`template-item${activeTemplate === "image-carousel" ? " is-active" : ""}`}
            type="button"
            onClick={() => selectTemplate("image-carousel")}
            aria-pressed={activeTemplate === "image-carousel"}
          >
            <span className="template-thumbnail carousel-thumbnail" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="template-copy">
              <span className="template-name">{carouselTemplate.name}</span>
              <span className="template-description">{carouselTemplate.description}</span>
            </span>
            <span className="template-play" aria-hidden="true">▶</span>
          </button>
        </div>
      </aside>
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  BookShowcase,
  type BookShowcaseProps,
} from "@/remotion/templates/book/BookShowcase";

type BookImagesFile = {
  images: string[];
};

export default function Home() {
  const playerRef = useRef<PlayerRef>(null);
  const [images, setImages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState("book-showcase");

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
  }, [images]);

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

  return (
    <main className="workspace-shell">
      <section className="preview-shell" aria-label="معاينة القالب">
        <div className="preview-frame">
          {error ? (
            <div className="player-fallback" role="alert">{error}</div>
          ) : images ? (
            <Player
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
          disabled={!images || Boolean(error)}
          aria-label={isPlaying ? "إيقاف المعاينة مؤقتًا" : "تشغيل المعاينة"}
        >
          <span className="playback-icon" aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span>
          <span>{isPlaying ? "إيقاف مؤقت" : "تشغيل المعاينة"}</span>
        </button>

        <div className="template-section">
          <h2>القوالب</h2>
          <button
            className={`template-item${activeTemplate === "book-showcase" ? " is-active" : ""}`}
            type="button"
            onClick={() => {
              setActiveTemplate("book-showcase");
              playerRef.current?.play();
            }}
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
        </div>
      </aside>
    </main>
  );
}

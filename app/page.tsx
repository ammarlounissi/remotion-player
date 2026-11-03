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
  const [started, setStarted] = useState(false);

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

  const bookProps: BookShowcaseProps = {
    images: images ?? [],
    coverColor: "#25392f",
    title: "بسم الله الرحمن الرحيم",
    subtitle: "الحمد لله رب العالمين",
    titleFont: "fonts/Cairo-Bold.ttf",
    titleColor: "#1d2a24",
    music: null,
  };

  const startPreview = () => {
    playerRef.current?.play();
    setStarted(true);
  };

  return (
    <main className="preview-shell">
      <div className="preview-frame">
        {error ? (
          <div className="player-fallback" role="alert">{error}</div>
        ) : images ? (
          <>
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
            {!started && (
              <button
                className="preview-start-button"
                type="button"
                onClick={startPreview}
              >
                تشغيل المعاينة
              </button>
            )}
          </>
        ) : (
          <div className="player-fallback" role="status">جارٍ تحميل المعاينة…</div>
        )}
      </div>
    </main>
  );
}

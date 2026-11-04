"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { buildTemplates } from "./templates";

type BookImagesFile = {
  images: string[];
};

export default function Home() {
  const playerRef = useRef<PlayerRef>(null);
  const [images, setImages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeId, setActiveId] = useState("stone-brand");
  const [menuOpen, setMenuOpen] = useState(false);
  const playOnSelection = useRef(false);

  const templates = useMemo(() => buildTemplates(images, error), [images, error]);
  const active = templates.find((t) => t.id === activeId) ?? templates[0];
  const canPlay = active.enabled && !active.notice;

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
  }, [activeId, images]);

  useEffect(() => {
    if (!playOnSelection.current) return;
    playerRef.current?.play();
    playOnSelection.current = false;
  }, [activeId]);

  // Escape يغلق الدرج على الهاتف.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const togglePlayback = () => {
    if (isPlaying) playerRef.current?.pause();
    else playerRef.current?.play();
  };

  const selectTemplate = (id: string) => {
    setMenuOpen(false);
    if (id === activeId) {
      playerRef.current?.play();
      return;
    }
    playOnSelection.current = true;
    setActiveId(id);
  };

  const playLabel = isPlaying ? "إيقاف مؤقت" : "تشغيل المعاينة";

  return (
    <main className="workspace-shell">
      <section className="preview-shell" aria-label="معاينة القالب">
        <div
          className="preview-frame"
          style={{ "--aspect": active.aspect } as React.CSSProperties}
        >
          <Suspense fallback={<div className="player-fallback" role="status">جارٍ تجهيز المشهد…</div>}>
            {active.notice ? (
              <div className="player-fallback" role={active.notice.role}>
                {active.notice.text}
              </div>
            ) : (
              active.renderPlayer(playerRef)
            )}
          </Suspense>
        </div>
      </section>

      {/* أزرار عائمة تظهر على الهاتف فقط */}
      <div className="mobile-bar">
        <button
          className="mobile-button"
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-controls="template-sidebar"
        >
          <span aria-hidden="true">☰</span>
          <span>القوالب</span>
        </button>
        <button
          className="mobile-button mobile-button-icon"
          type="button"
          onClick={togglePlayback}
          disabled={!canPlay}
          aria-label={playLabel}
        >
          <span aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span>
        </button>
      </div>

      <div
        className={`sidebar-backdrop${menuOpen ? " is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="template-sidebar"
        className={`sidebar${menuOpen ? " is-open" : ""}`}
        aria-label="تحكم القوالب"
      >
        <div className="sidebar-top">
          <div className="sidebar-heading">
            <div>
              <span className="sidebar-kicker">REMOTION PLAYER</span>
              <h1>استوديو المعاينة</h1>
            </div>
            <button
              className="sidebar-close"
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="طيّ قائمة القوالب"
            >
              ✕
            </button>
          </div>

          <button
            className="playback-button"
            type="button"
            onClick={togglePlayback}
            disabled={!canPlay}
            aria-label={playLabel}
          >
            <span className="playback-icon" aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span>
            <span>{playLabel}</span>
          </button>
        </div>

        <div className="template-section">
          <h2>القوالب ({templates.length})</h2>
          <div className="template-list">
            {templates.map((template) => (
              <button
                key={template.id}
                className={`template-item${template.id === active.id ? " is-active" : ""}`}
                type="button"
                onClick={() => selectTemplate(template.id)}
                disabled={!template.enabled}
                aria-pressed={template.id === active.id}
              >
                <span
                  className={`template-thumbnail ${
                    template.thumb.kind === "book" ? "" : template.thumb.className
                  }`}
                  aria-hidden="true"
                >
                  {template.thumb.kind === "book" ? (
                    <span />
                  ) : (
                    Array.from({ length: template.thumb.count }, (_, i) => <i key={i} />)
                  )}
                </span>
                <span className="template-copy">
                  <span className="template-name">{template.name}</span>
                  <span className="template-description">{template.description}</span>
                </span>
                <span className="template-play" aria-hidden="true">▶</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}

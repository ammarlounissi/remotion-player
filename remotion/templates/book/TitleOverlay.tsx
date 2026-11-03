import React from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { TITLE_FADE, TITLE_IN, TITLE_OUT } from "./showcaseTimeline";

/** عنوان فوق المشهد. الخط من input_Remotion/fonts/ ويُحمَّل قبل رسم أول إطار. */

const FAMILY = "TitleFont";

export type TitleOverlayProps = {
  title: string;
  subtitle?: string;
  fontFile: string; // مثل fonts/Cairo-Bold.ttf
  color: string;
};

const useTitleFont = (fontFile: string) => {
  const [handle] = React.useState(() => delayRender("title font"));
  React.useEffect(() => {
    loadFont({ family: FAMILY, url: staticFile(fontFile) })
      .then(() => continueRender(handle))
      .catch((err) => {
        console.error("تعذّر تحميل الخط:", fontFile, err);
        continueRender(handle);
      });
  }, [fontFile, handle]);
};

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  title,
  subtitle,
  fontFile,
  color,
}) => {
  useTitleFont(fontFile);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const opacity = interpolate(
    t,
    [TITLE_IN, TITLE_IN + TITLE_FADE, TITLE_OUT, TITLE_OUT + TITLE_FADE],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  if (!title || opacity <= 0) return null;

  // حجم يصغر مع طول العنوان (العنوان الطويل يلتف على سطرين)
  const len = Array.from(title).length;
  const size = Math.max(72, Math.min(150, 150 * Math.sqrt(14 / Math.max(len, 1))));
  const rise = interpolate(opacity, [0, 1], [24, 0]);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: `translateY(${rise}px)`,
      }}
    >
      <div
        dir="auto"
        style={{
          maxWidth: 1500,
          textAlign: "center",
          fontFamily: `${FAMILY}, sans-serif`,
          color,
          fontSize: size,
          lineHeight: 1.25,
          textWrap: "balance" as React.CSSProperties["textWrap"],
          textShadow: "0 2px 24px rgba(255,255,255,0.7)",
        }}
      >
        {title}
        {subtitle ? (
          <div
            style={{
              marginTop: 18,
              fontSize: Math.round(size * 0.38),
              opacity: 0.8,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

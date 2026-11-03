import { useEffect } from "react";
import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

const FONT_FAMILY = "StoneBrandFont";

const useBrandFont = () => {
  useEffect(() => {
    loadFont({ family: FONT_FAMILY, url: staticFile("fonts/Cairo-Bold.ttf") })
      .catch((reason: unknown) => {
        console.error("تعذّر تحميل خط قالب الأحجار", reason);
      });
  }, []);
};

export const StoneBrandReveal: React.FC<{ text: string }> = ({ text }) => {
  useBrandFont();
  const frame = useCurrentFrame();
  const [brandName = text, descriptor = ""] = text.split("   ");

  const panelReveal = interpolate(frame, [0, 40, 78], [0, 0.65, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const headlineReveal = interpolate(frame, [28, 82], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const descriptorReveal = interpolate(frame, [90, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const closingFade = interpolate(frame, [565, 600], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepPosition = interpolate(frame, [24, 210], [-125, 125], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const slowZoom = interpolate(frame, [0, 600], [1.035, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        color: "#f3eddf",
        background: "#11120f",
        fontFamily: `${FONT_FAMILY}, sans-serif`,
      }}
    >
      <AbsoluteFill
        style={{
          transform: `scale(${slowZoom})`,
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(116, 100, 67, .28), transparent 46%), linear-gradient(155deg, #292820 0%, #171815 45%, #0c0e0c 100%)",
        }}
      >
        <AbsoluteFill
          style={{
            opacity: 0.45,
            background:
              "repeating-linear-gradient(92deg, transparent 0 58px, rgba(231, 218, 183, .06) 59px, transparent 61px 114px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "7% 7%",
            border: "1px solid rgba(208, 183, 125, .35)",
            opacity: panelReveal * closingFade,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "12%",
            right: "12%",
            top: "20%",
            bottom: "19%",
            border: "1px solid rgba(255, 246, 220, .12)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,.075), transparent 32%, rgba(0,0,0,.24) 72%), repeating-linear-gradient(0deg, rgba(226,214,188,.025) 0 2px, transparent 2px 9px), linear-gradient(145deg, #454237, #24241f 52%, #171815)",
            boxShadow: "0 35px 100px rgba(0,0,0,.5), inset 0 0 55px rgba(0,0,0,.42)",
            transform: `translateY(${(1 - panelReveal) * 70}px) scale(${0.96 + panelReveal * 0.04})`,
            opacity: panelReveal * closingFade,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "25%",
            left: "50%",
            width: "62%",
            height: "1px",
            transform: "translateX(-50%)",
            background: "linear-gradient(90deg, transparent, #c9ad70, transparent)",
            opacity: panelReveal * closingFade,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${sweepPosition}%`,
            top: "8%",
            width: "24%",
            height: "84%",
            transform: "skewX(-18deg)",
            background:
              "linear-gradient(90deg, transparent, rgba(248, 224, 167, .15), rgba(255, 246, 220, .36), rgba(248, 224, 167, .08), transparent)",
            filter: "blur(12px)",
            opacity: panelReveal * closingFade,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          opacity: closingFade,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "29%",
            display: "grid",
            justifyItems: "center",
            gap: 20,
            opacity: panelReveal,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              border: "1px solid #d5bd85",
              transform: "rotate(45deg)",
              boxShadow: "0 0 24px rgba(213,189,133,.4)",
            }}
          />
          <div
            style={{
              color: "#d8c697",
              fontFamily: "ui-monospace, monospace",
              fontSize: 24,
              letterSpacing: 7,
              direction: "ltr",
            }}
          >
            NATURAL STONE
          </div>
        </div>

        <div
          dir="rtl"
          style={{
            width: "78%",
            transform: `translateY(${(1 - headlineReveal) * 54}px)`,
            opacity: headlineReveal,
            filter: `blur(${(1 - headlineReveal) * 12}px)`,
          }}
        >
          <div
            style={{
              color: "#f5efdf",
              fontSize: 138,
              lineHeight: 1.3,
              fontWeight: 700,
              textShadow: "0 6px 38px rgba(0,0,0,.48)",
            }}
          >
            {brandName}
          </div>
          <div
            style={{
              width: `${descriptorReveal * 72}%`,
              height: 2,
              margin: "28px auto 30px",
              background: "linear-gradient(90deg, transparent, #cfb477, transparent)",
              boxShadow: "0 0 22px rgba(207,180,119,.42)",
            }}
          />
          <div
            style={{
              overflow: "hidden",
              color: "#d7c69d",
              fontSize: 65,
              lineHeight: 1.55,
              fontWeight: 700,
              clipPath: `inset(0 0 0 ${(1 - descriptorReveal) * 100}%)`,
              textShadow: "0 3px 24px rgba(0,0,0,.55)",
            }}
          >
            {descriptor}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "22%",
            color: "rgba(239, 230, 207, .56)",
            fontSize: 26,
            letterSpacing: 2,
            opacity: descriptorReveal * closingFade,
          }}
        >
          أناقةٌ تنبض من قلب الحجر
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
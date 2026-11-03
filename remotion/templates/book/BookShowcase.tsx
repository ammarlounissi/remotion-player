import { resolveAsset } from "../../lib/resolveAsset";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TitleOverlay } from "./TitleOverlay";
import { PAGE_H, PAGE_W, cameraAt, leafProgress } from "./showcaseTimeline";

/**
 * عرض كتاب: كاميرا تتحرك، غلاف يُفتح، صفحات تنثني وتنقلب، كتاب يطفو.
 * الصور: images[0] غلاف، ثم كل ورقة وجهان (images[2k] أمامي، images[2k+1] خلفي).
 * الحركة كلها في showcaseTimeline.ts.
 */

export type BookShowcaseProps = {
  images: string[];
  coverColor: string; // (غير مستعمل الآن؛ أُبقي للتوافق مع ملفات البيانات)
  endImage?: string | null; // الصفحة الأخيرة (داخل الغلاف الخلفي)؛ بلا صورة = ورقة بيضاء
  music?: string | null; // مسار الصوت (مثلاً audio/2.mp3) أو رابط؛ null = بلا صوت
  musicVolume?: number; // 0..1
  musicFadeIn?: number; // ثوانٍ
  musicFadeOut?: number; // ثوانٍ
  title?: string; // العنوان؛ فارغ = بلا عنوان
  subtitle?: string;
  titleFont?: string; // مثل fonts/Cairo-Bold.ttf
  titleColor?: string;
  dataFile?: string; // مثل data/B001.json: يملأ الخصائص التي لم تُمرَّر صراحة
};

const SLICES = 28; // شرائح الورقة أثناء الانحناء
const BEND_DEGREES = 80; // انحناء الورقة أثناء القلب
// قوس جناح الطائر: تصعد الصفحة من الكعب بزاوية REST_TILT_DEGREES، يعلو وسطها،
// ثم تنزل حافتها الحرة. الزاوية النهائية = REST_BEND_DEGREES - REST_TILT_DEGREES (نزول).
const REST_TILT_DEGREES = 22; // زاوية الصعود عند الكعب
const REST_BEND_DEGREES = 52; // مجموع الانحناء على عرض الصفحة
const REST_SLICES = 18; // شرائح الورقة الساكنة المنحنية
const LIFT_BOW = 0.9; // زيادة الانحناء حين يطفو الكتاب
const PAPER = "#f6f1e7";
const PAGE_INSET = 0; // بلا هوامش حول الصور
const LIFT_PX = 170; // أقصى ارتفاع للكتاب الطافي
const PERSPECTIVE = 3200;

const smoother = (t: number) => t * t * t * (t * (6 * t - 15) + 10);

// ---------- وجه الورقة: الصورة كاملة بقصّ cover، تظهر منها شريحة فقط ----------
const Face: React.FC<{ src: string | null; xOffset: number; inset: number }> = ({
  src,
  xOffset,
  inset,
}) => {
  if (!src) {
    return <div style={{ position: "absolute", inset: 0, background: PAPER }} />;
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: inset > 0 ? "#ffffff" : undefined,
      }}
    >
      <Img
        src={resolveAsset(src)}
        style={{
          position: "absolute",
          left: inset - xOffset,
          top: inset,
          width: PAGE_W - 2 * inset,
          height: PAGE_H - 2 * inset,
          maxWidth: "none",
          objectFit: "cover",
        }}
      />
    </div>
  );
};

type SliceProps = {
  j: number;
  slices: number;
  theta: number;
  delta: number;
  front: string | null;
  back: string | null;
  extraFront: number;
  extraBack: number;
  frontInset: number;
  backInset: number;
};

const Slice: React.FC<SliceProps> = (props) => {
  const { j, slices, theta, delta, front, back } = props;
  const sw = PAGE_W / slices;
  // تُترك وجوه الصفحات بلا طبقة تظليل لتفادي ظهور حافة داكنة حول الصور.

  return (
    <div
      style={{
        position: "absolute",
        left: j === 0 ? PAGE_W - sw : -sw,
        top: 0,
        width: sw + 1.2,
        height: PAGE_H,
        transformOrigin: "right center",
        transformStyle: "preserve-3d",
        transform: `rotateY(${j === 0 ? 0 : -delta}deg)`,
      }}
    >
      <div
        style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}
      >
        <Face
          src={front}
          xOffset={PAGE_W - (j + 1) * sw}
          inset={props.frontInset}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000",
            opacity: 0,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
        }}
      >
        <Face src={back} xOffset={j * sw} inset={props.backInset} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000",
            opacity: 0,
          }}
        />
      </div>
      {j < slices - 1 ? <Slice {...props} j={j + 1} /> : null}
    </div>
  );
};

const Leaf: React.FC<{
  k: number;
  total: number;
  p: number;
  pPrev: number;
  pNext: number;
  front: string | null;
  back: string | null;
  open: number; // 0 = كتاب مغلق (مستقيم)، 1 = مفتوح (منحنٍ)
  bow: number; // مضاعف الانحناء
}> = ({ k, total, p, pPrev, pNext, front, back, open, bow }) => {
  const flipping = p > 0.001 && p < 0.999;
  const theta = -180 * smoother(p);
  // انحناء القلب: يتبدّل اتجاهه في منتصف القلبة
  const flipDelta = -(BEND_DEGREES / SLICES) * Math.sin(2 * Math.PI * p);
  // انحناء السكون: الحافة الحرّة ترتفع نحو المشاهد على الجهتين (cos يعكس الإشارة عند اليسار)
  const restAmount = open * bow * Math.cos((theta * Math.PI) / 180);
  const slices = flipping ? SLICES : open > 0.02 ? REST_SLICES : 1;
  const restDelta = (REST_BEND_DEGREES / slices) * restAmount;
  const restTilt = -REST_TILT_DEGREES * restAmount;
  const delta = flipping ? flipDelta + restDelta : restDelta;
  const rootAngle = theta + restTilt;

  const extraFront = 0;
  const extraBack = 0;

  // ترتيب العمق: أوراق اليمين بحسب k، وأوراق اليسار بالعكس
  const lift = 3 + (p < 0.5 ? (total - k) * 0.8 : k * 0.8);

  return (
    <div
      style={{
        position: "absolute",
        left: -PAGE_W,
        top: -PAGE_H / 2,
        width: PAGE_W,
        height: PAGE_H,
        transformOrigin: "right center",
        transformStyle: "preserve-3d",
        transform: `translateZ(${lift}px) rotateY(${-rootAngle}deg)`,
      }}
    >
      <Slice
        j={0}
        slices={slices}
        theta={rootAngle}
        delta={delta}
        front={front}
        back={back}
        extraFront={extraFront}
        extraBack={extraBack}
        frontInset={k === 0 ? 0 : PAGE_INSET}
        backInset={PAGE_INSET}
      />
    </div>
  );
};

// كتلة أوراق وهمية ثابتة: 150 طبقة رقيقة، لا تقلب منفردة، وتتبع فتح الغلاف.
const DUMMY_SHEET_COUNT = 150;
const DUMMY_SHEET_DEPTH = 0.34;
const DummyPaperStack: React.FC<{ open: number; lift: number }> = ({ open, lift }) => {
  const angle = -180 * open;
  const tilt = -REST_TILT_DEGREES * open * (1 + lift * LIFT_BOW);
  return (
    <>
      {Array.from({ length: DUMMY_SHEET_COUNT }, (_, i) => (
        <div
          key={`dummy-sheet-${i}`}
          style={{
            position: "absolute",
            left: -PAGE_W,
            top: -PAGE_H / 2,
            width: PAGE_W,
            height: PAGE_H,
            boxSizing: "border-box",
            transformOrigin: "right center",
            transform: `translateZ(${-2 - i * DUMMY_SHEET_DEPTH}px) rotateY(${-(angle + tilt)}deg)`,
            background: i % 5 === 0 ? "#eee8dc" : PAPER,
            border: "1px solid rgba(110, 96, 76, 0.10)",
            borderRadius: "1px 0 0 1px",
            backfaceVisibility: "hidden",
          }}
        />
      ))}
    </>
  );
};

// ---------- المشهد ----------
export const BookShowcase: React.FC<BookShowcaseProps> = ({
  images,
  endImage = null,
  music = null,
  musicVolume = 0.8,
  musicFadeIn = 1,
  musicFadeOut = 2,
  title = "",
  subtitle = "",
  titleFont = "fonts/Cairo-Bold.ttf",
  titleColor = "#1d2a24",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t);

  const leaves = Math.ceil(images.length / 2);
  const prog = (k: number) =>
    k < 0 ? 1 : k >= leaves ? 0 : leafProgress(k, t);
  const open = smoother(prog(0));
  const items = Array.from({ length: leaves }, (_, k) => k);
  const z = cam.zoom;

  // صوت: تلاشٍ في البداية والنهاية
  const fadeInF = Math.max(1, Math.round(musicFadeIn * fps));
  const fadeOutF = Math.max(1, Math.round(musicFadeOut * fps));
  const volume = (f: number) =>
    musicVolume *
    interpolate(
      f,
      [0, fadeInF, durationInFrames - fadeOutF, durationInFrames],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 30% 22%, #ffffff 0%, #ececee 45%, #cfcfd3 100%)",
      }}
    >
      <AbsoluteFill
        style={{ filter: cam.blur > 0.05 ? `blur(${cam.blur}px)` : "none" }}
      >
        <AbsoluteFill style={{ perspective: PERSPECTIVE }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 0,
              height: 0,
              transformOrigin: "0 0",
              transformStyle: "preserve-3d",
              transform:
                `translate(${width / 2}px, ${height / 2}px) ` +
                `rotateX(${cam.rx}deg) rotateZ(${cam.rz}deg) ` +
                `scale3d(${z}, ${z}, ${z}) translate(${-cam.cx}px, ${-cam.cy}px)`,
            }}
          >
            {/* ظل تماس صغير وثابت نسبيًا؛ لا يحاكي مساحة كتاب مفتوح عندما يكون مغلقًا. */}
            <div
              style={{
                position: "absolute",
                left: -PAGE_W + 10,
                top: -PAGE_H / 2 + PAGE_H * 0.88 + cam.lift * 18,
                width: PAGE_W * (1 + 0.25 * open) - 20,
                height: PAGE_H * 0.1,
                background: "rgba(0,0,0,0.14)",
                opacity: (0.65 + 0.2 * open) * (1 - 0.5 * cam.lift),
                filter: `blur(${10 + cam.lift * 12}px)`,
                borderRadius: "50%",
              }}
            />
            {/* الكتاب نفسه، يرتفع عن السطح بحسب lift */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 0,
                height: 0,
                transformStyle: "preserve-3d",
                transform: `translateZ(${cam.lift * LIFT_PX}px)`,
              }}
            >
              <DummyPaperStack open={open} lift={cam.lift} />
              {items.map((k) => (
                <Leaf
                  key={k}
                  k={k}
                  total={leaves}
                  p={prog(k)}
                  pPrev={prog(k - 1)}
                  pNext={prog(k + 1)}
                  open={open}
                  bow={1 + cam.lift * LIFT_BOW}
                  front={images[2 * k] ?? null}
                  back={images[2 * k + 1] ?? null}
                />
              ))}
              {/* لا تُضاف ورقة ختامية فارغة؛ تُعرض فقط عند توفير صورة فعلية لها. */}
              {endImage ? (
                <Leaf
                  key="end"
                  k={leaves}
                  total={leaves}
                  p={0}
                  pPrev={prog(leaves - 1)}
                  pNext={0}
                  open={open}
                  bow={1 + cam.lift * LIFT_BOW}
                  front={endImage}
                  back={null}
                />
              ) : null}
              {/* ظل الكعب حين يكون الكتاب مفتوحًا */}
              <div
                style={{
                  position: "absolute",
                  left: -18,
                  top: -PAGE_H / 2,
                  width: 36,
                  height: PAGE_H,
                  opacity: open,
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,0.24) 50%, rgba(0,0,0,0))",
                  transform: "translateZ(4px)",
                }}
              />
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {/* تعتيم خفيف عند الأطراف */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.16) 100%)",
        }}
      />
      {title ? (
        <TitleOverlay
          title={title}
          subtitle={subtitle}
          fontFile={titleFont}
          color={titleColor}
        />
      ) : null}
      {music ? <Audio src={resolveAsset(music)} volume={volume} /> : null}
    </AbsoluteFill>
  );
};

/**
 * جدول زمني لقالب BookShowcase: حركة الكاميرا + قلب الصفحات.
 * كل الأزمنة بالثواني. عدّل الأرقام هنا فقط دون لمس المكوّن.
 *
 * إحداثيات الكاميرا (cx, cy) بوحدة بكسل في فضاء الكتاب:
 *   (0,0) = وسط الكعب. يمين الكعب x موجب (مثلاً 280 = وسط الصفحة اليمنى)،
 *   ويسارها x سالب (-280 = وسط الصفحة اليسرى). y موجب = نحو أسفل الصفحة.
 * zoom: 1 = حجم عادي، 2.5 = تقريب كبير.
 * rx: ميلان الكاميرا (0 = من الأعلى تمامًا، 60 = زاوية منخفضة).
 * rz: لفّ الكتاب حول نفسه. blur: تمويه (بكسل). lift: ارتفاع الكتاب عن الطاولة (0..1).
 */

export const PAGE_W = 560;
export const PAGE_H = 740;
export const FPS = 30;
export const DURATION_SECONDS = 51;

export type Key = {
  t: number;
  cx: number;
  cy: number;
  zoom: number;
  rx: number;
  rz: number;
  blur: number;
  lift: number;
};

const k = (
  t: number,
  cx: number,
  cy: number,
  zoom: number,
  rx: number,
  rz: number,
  blur: number,
  lift: number,
): Key => ({ t, cx, cy, zoom, rx, rz, blur, lift });

export const CAMERA: Key[] = [
  // 0–6s: كشف الغلاف، ثم تقريب مع تمويه، ثم انزلاق على الغلاف
  k(0.0, -1000, 0, 0.9, 32, -16, 0, 0.5), // شاشة بيضاء وزاوية الغلاف عند الحافة
  k(0.5, 280, 0, 0.9, 32, -16, 0, 0.5), // الكتاب المغلق في الوسط
  k(1.2, 280, 0, 0.72, 32, -16, 0, 0.5),
  k(2.0, 280, 0, 0.66, 32, -16, 0, 0.5),
  k(2.5, 280, -200, 1.6, 26, -10, 8, 0.2), // دفع الكاميرا مع تمويه
  k(3.0, 280, -240, 2.3, 22, -7, 0.5, 0),
  k(4.0, 280, -200, 2.5, 22, -7, 0, 0),
  k(6.0, 280, 230, 2.6, 22, -7, 0, 0), // انزلاق نحو أسفل الغلاف
  // 6–13s: يُفتح الغلاف، لقطات قريبة منخفضة على الصفحات الأولى
  k(6.5, 150, 0, 0.8, 38, -12, 2, 0.2),
  k(7.2, 40, 0, 0.78, 40, -8, 0, 0.2),
  k(7.8, 200, 30, 1.4, 48, -4, 1, 0),
  k(8.5, 270, 60, 1.9, 54, -3, 0, 0),
  k(10.6, 280, 40, 2.0, 54, -2, 0, 0),
  k(11.0, 280, 60, 2.0, 55, -2, 2, 0),
  k(13.0, 270, 50, 2.1, 56, -2, 0, 0),
  // 13–21s: لقطة واسعة لقلب صفحة، ثم صفحات القصة، ثم لقطة منخفضة جدًا
  k(13.6, 80, 0, 0.9, 40, 0, 0, 0),
  k(15.0, 40, 0, 0.95, 38, 0, 3.5, 0),
  k(15.5, -230, -80, 2.0, 40, 3, 0, 0),
  k(17.0, -250, 40, 2.2, 44, 4, 0, 0),
  k(17.6, -180, 200, 2.6, 66, 2, 2, 0),
  k(19.8, -100, 220, 2.6, 66, 0, 2, 0),
  k(20.4, 0, 0, 0.9, 38, 0, 3, 0),
  k(21.2, 120, 0, 1.4, 34, 0, 4, 0),
  // 21–33s: صفحة تملأ الشاشة، مرور صفحة أمام الكاميرا، ثم لقطات مائلة
  k(21.8, 270, 0, 1.7, 22, -2, 0, 0),
  k(23.0, 270, 0, 1.9, 20, -2, 0, 0),
  k(23.8, 150, 150, 1.5, 15, 4, 0, 0),
  k(25.4, 200, 100, 1.5, 28, -8, 0, 0),
  k(26.2, 260, 0, 1.8, 36, -14, 0, 0),
  k(27.6, -250, 20, 1.8, 46, 10, 0, 0),
  k(30.0, -250, 100, 1.9, 48, 10, 0, 0),
  k(30.6, 270, 0, 1.8, 40, -10, 0, 0),
  k(32.6, 260, 40, 1.8, 40, -10, 0, 0),
  // 33–43s: تراجع، يُغلق الكتاب ثم يُفتح طافيًا وتتقلب صفحاته تباعًا
  k(33.4, 40, 0, 0.9, 36, 0, 1, 0.2),
  k(34.2, 0, 0, 0.8, 38, 0, 2, 0.3),
  k(35.2, 280, 0, 1.5, 30, -6, 5, 0),
  k(35.8, 280, -80, 1.9, 26, -6, 0, 0),
  k(36.4, 0, 0, 0.78, 40, -10, 1, 0.7),
  k(38.0, 0, -30, 0.8, 46, 8, 0, 1),
  k(40.5, 0, 0, 0.8, 46, -12, 0, 1),
  k(42.0, 0, 0, 0.75, 40, 0, 0, 0.6),
  // 43–51s: الكتاب مغلق صغيرًا في زاوية الإطار، ثم فراغ أبيض (مكان العنوان لاحقًا)
  k(43.4, -400, -250, 0.6, 38, -14, 0, 0.3),
  k(44.5, -630, -450, 0.55, 38, -14, 0, 0.2),
  k(51.0, -630, -450, 0.55, 38, -14, 0, 0.2),
];

type Channel = "cx" | "cy" | "zoom" | "rx" | "rz" | "blur" | "lift";

// استيفاء Hermite ناعم يمر بكل المفاتيح دون توقف عند كل واحد
const sample = (keys: Key[], t: number, ch: Channel): number => {
  const n = keys.length;
  if (t <= keys[0].t) return keys[0][ch];
  if (t >= keys[n - 1].t) return keys[n - 1][ch];
  let i = 0;
  while (keys[i + 1].t < t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const pa = i > 0 ? keys[i - 1] : a;
  const pb = i + 2 < n ? keys[i + 2] : b;
  const h = b.t - a.t;
  const s = (t - a.t) / h;
  const ma = ((b[ch] - pa[ch]) / (b.t - pa.t)) * h;
  const mb = ((pb[ch] - a[ch]) / (pb.t - a.t)) * h;
  const s2 = s * s;
  const s3 = s2 * s;
  return (
    (2 * s3 - 3 * s2 + 1) * a[ch] +
    (s3 - 2 * s2 + s) * ma +
    (-2 * s3 + 3 * s2) * b[ch] +
    (s3 - s2) * mb
  );
};

const rawCamera = (t: number): Key => ({
  t,
  cx: sample(CAMERA, t, "cx"),
  cy: sample(CAMERA, t, "cy"),
  zoom: Math.max(0.2, sample(CAMERA, t, "zoom")),
  rx: sample(CAMERA, t, "rx"),
  rz: sample(CAMERA, t, "rz"),
  blur: Math.max(0, sample(CAMERA, t, "blur")),
  lift: Math.min(1.2, Math.max(0, sample(CAMERA, t, "lift"))),
});

// ---------- تمويه الحركة التلقائي ----------
// يُضاف تمويه على الحركات السريعة ليختفي التقطّع (الإطار الحاد بين قفزتين كبيرتين).
// MOTION_BLUR = 0 يعطّله. ارفعه لتمويه أقوى، وخفّضه إن بدت الحركة ضبابية.
export const MOTION_BLUR = 0.1; // بكسل تمويه لكل بكسل/إطار فوق العتبة
const BLUR_THRESHOLD = 25; // بكسل/إطار (على 1080p وبمعدل 30 إطارًا/ثانية)
const MAX_EXTRA_BLUR = 8; // أقصى تمويه يضيفه هذا النظام (بكسل)

export const cameraAt = (t: number): Key => {
  const c = rawCamera(t);
  const dt = 1 / 30;
  const a = rawCamera(t - dt);
  const b = rawCamera(t + dt);
  // سرعة تقريبية على الشاشة (بكسل/إطار): تحريك + تقريب + دوران + ميلان
  const pan = (c.zoom * Math.hypot(b.cx - a.cx, b.cy - a.cy)) / 2;
  const zoomSpeed = (600 * Math.abs(b.zoom - a.zoom)) / 2 / c.zoom;
  const rollSpeed = (600 * Math.abs(b.rz - a.rz) * Math.PI) / 180 / 2;
  const tiltSpeed = (300 * Math.abs(b.rx - a.rx) * Math.PI) / 180 / 2;
  const speed = pan + zoomSpeed + rollSpeed + tiltSpeed;
  const extra = Math.min(
    MAX_EXTRA_BLUR,
    Math.max(0, (speed - BLUR_THRESHOLD) * MOTION_BLUR),
  );
  // لا نجمع مع التمويه اليدوي في المفاتيح، نأخذ الأكبر
  // كتاب من اليمين لليسار: الكعب على اليمين، فتنعكس الكاميرا أفقيًا
  return { ...c, cx: -c.cx, rz: -c.rz, blur: Math.max(c.blur, extra) };
};

// ---------- قلب الصفحات ----------
// leaf: رقم الورقة (0 = الغلاف). to: 1 = تنقلب إلى اليسار، 0 = ترجع إلى اليمين.
// لكل ورقة، رتّب مقاطعها زمنيًا.
export type Flip = { leaf: number; start: number; dur: number; to: 0 | 1 };

const cascade = (
  leaves: number[],
  start: number,
  step: number,
  dur: number,
  to: 0 | 1,
): Flip[] =>
  leaves.map((leaf, i) => ({ leaf, start: start + i * step, dur, to }));

export const FLIPS: Flip[] = [
  { leaf: 0, start: 6.1, dur: 1.5, to: 1 }, // فتح الغلاف
  { leaf: 1, start: 10.6, dur: 0.6, to: 1 },
  { leaf: 2, start: 13.6, dur: 1.6, to: 1 }, // لقطة واسعة
  { leaf: 3, start: 20.2, dur: 1.4, to: 1 },
  { leaf: 4, start: 23.4, dur: 1.8, to: 1 }, // مرور صفحة أمام الكاميرا
  { leaf: 5, start: 30.0, dur: 1.1, to: 1 },
  { leaf: 6, start: 33.0, dur: 1.3, to: 1 },
  // إغلاق الكتاب سريعًا (من الأخيرة إلى الغلاف)
  ...cascade([6, 5, 4, 3, 2, 1, 0], 34.4, 0.07, 0.6, 0),
  // يُفتح الكتاب وهو طافٍ، ثم تتقلب الصفحات تباعًا
  { leaf: 0, start: 36.0, dur: 1.1, to: 1 },
  ...cascade([1, 2, 3, 4, 5, 6], 37.3, 0.45, 0.9, 1),
  // إغلاق أخير
  ...cascade([6, 5, 4, 3, 2, 1, 0], 41.8, 0.12, 0.8, 0),
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// تقدم الورقة 0..1 (خطي؛ التنعيم يُطبَّق في المكوّن)
export const leafProgress = (leaf: number, t: number): number => {
  let p = 0;
  for (const f of FLIPS) {
    if (f.leaf !== leaf) continue;
    if (t >= f.start + f.dur) {
      p = f.to;
    } else if (t > f.start) {
      return p + (f.to - p) * clamp01((t - f.start) / f.dur);
    } else {
      break;
    }
  }
  return p;
};

// ---------- العنوان ----------
export const TITLE_IN = 0.5; // بدء الظهور (ثانية)
export const TITLE_OUT = 4; // بدء الاختفاء
export const TITLE_FADE = 0.6; // مدة الظهور/الاختفاء

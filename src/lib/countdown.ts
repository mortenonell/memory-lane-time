export type TimeUnit = "days" | "weeks" | "months" | "years";

export type BackgroundKind = "color" | "gradient" | "image";

export type WidgetEvent = {
  id: string;
  title: string;
  date: string; // ISO
  unit: TimeUnit;
  background: string; // css color / gradient / image url
  backgroundKind: BackgroundKind;
  textColor: string;
  notify: boolean;
  notifyLeadMinutes: number;
  source: "local" | "google";
};

export type WallpaperInterval = "1" | "5" | "10" | "15" | "launch";

export type WallpaperSettings = {
  enabled: boolean;
  interval: WallpaperInterval;
  album: string[]; // image urls
  current: string | null;
};

export const UNIT_LABELS: Record<TimeUnit, [string, string]> = {
  days: ["day", "days"],
  weeks: ["week", "weeks"],
  months: ["month", "months"],
  years: ["year", "years"],
};

const MS_DAY = 86_400_000;

export function amountUntil(iso: string, unit: TimeUnit, now = Date.now()) {
  const target = new Date(iso).getTime();
  const diff = target - now;
  const days = diff / MS_DAY;
  switch (unit) {
    case "days":
      return Math.ceil(days);
    case "weeks":
      return Math.ceil(days / 7);
    case "months":
      return Math.ceil(days / 30.4375);
    case "years":
      return Math.ceil(days / 365.25);
  }
}

export function countdownLabel(event: WidgetEvent, now = Date.now()) {
  const raw = amountUntil(event.date, event.unit, now);
  const past = raw < 0;
  const amount = Math.abs(raw);
  const [one, many] = UNIT_LABELS[event.unit];
  const unit = amount === 1 ? one : many;
  return { amount, unit, past };
}

export function preciseRemaining(iso: string, now = Date.now()) {
  let diff = Math.max(0, new Date(iso).getTime() - now);
  const d = Math.floor(diff / MS_DAY);
  diff -= d * MS_DAY;
  const h = Math.floor(diff / 3_600_000);
  diff -= h * 3_600_000;
  const m = Math.floor(diff / 60_000);
  const s = Math.floor((diff - m * 60_000) / 1000);
  return `${d}d ${h}h ${m}m ${s}s`;
}

export const PRESET_BACKGROUNDS = [
  { kind: "gradient" as const, value: "linear-gradient(135deg, #0f2027, #2c5364)" },
  { kind: "gradient" as const, value: "linear-gradient(135deg, #f7971e, #ffd200)" },
  { kind: "gradient" as const, value: "linear-gradient(135deg, #654ea3, #eaafc8)" },
  { kind: "gradient" as const, value: "linear-gradient(135deg, #11998e, #38ef7d)" },
  { kind: "gradient" as const, value: "linear-gradient(135deg, #ee0979, #ff6a00)" },
  { kind: "color" as const, value: "#111318" },
  { kind: "color" as const, value: "#f4f1ea" },
  { kind: "color" as const, value: "#1d4ed8" },
];

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

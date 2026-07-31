import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ url: z.string().url().max(2000) });

function parseIcsDate(value: string): string | null {
  const v = value.trim();
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(v);
  if (!m) return null;
  const [, y, mo, d, hh = "09", mm = "00", ss = "00", z] = m;
  const iso = `${y}-${mo}-${d}T${hh}:${mm}:${ss}${z ? "Z" : ""}`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export const importIcsCalendar = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const url = data.url.replace(/^webcal:/i, "https:");
    const res = await fetch(url, { headers: { Accept: "text/calendar" } });
    if (!res.ok) {
      throw new Error(`Calendar request failed [${res.status}]: ${await res.text()}`);
    }
    const text = await res.text();
    const unfolded = text.replace(/\r?\n[ \t]/g, "");
    const blocks = unfolded.split("BEGIN:VEVENT").slice(1);
    const now = Date.now();

    const events = blocks
      .map((block) => {
        const summary = /\nSUMMARY[^:]*:(.*)/.exec(block)?.[1]?.trim();
        const start = /\nDTSTART[^:]*:(.*)/.exec(block)?.[1];
        if (!summary || !start) return null;
        const iso = parseIcsDate(start);
        if (!iso) return null;
        return { title: summary.replace(/\\,/g, ","), date: iso };
      })
      .filter((e): e is { title: string; date: string } => !!e)
      .filter((e) => new Date(e.date).getTime() > now)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 25);

    return { events };
  });

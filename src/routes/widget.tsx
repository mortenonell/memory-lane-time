import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocalState } from "@/lib/store";
import { countdownLabel, preciseRemaining, type WidgetEvent } from "@/lib/countdown";

export const Route = createFileRoute("/widget")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? search["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Widget View — Countdown Widgets" },
      {
        name: "description",
        content:
          "A full-screen countdown widget you can pin to your home screen or keep open as a live event display.",
      },
      { property: "og:title", content: "Widget View — Countdown Widgets" },
      {
        property: "og:description",
        content: "Full-screen live countdown widget for a single event.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WidgetView,
});

function WidgetView() {
  const { id } = Route.useSearch();
  const [events] = useLocalState<WidgetEvent[]>("cw:events", []);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const event = (id ? events.find((e) => e.id === id) : sorted[0]) ?? null;

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">No widget to show</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create a countdown first.</p>
          <Link to="/" className="mt-4 inline-block text-sm underline">
            Back to app
          </Link>
        </div>
      </main>
    );
  }

  const { amount, unit, past } = countdownLabel(event, now);
  const bg =
    event.backgroundKind === "image"
      ? {
          backgroundImage: `url(${event.background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : { background: event.background };

  return (
    <main className="relative min-h-screen" style={bg}>
      {event.backgroundKind === "image" && (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.6))]" />
      )}
      <div
        className="relative flex min-h-screen flex-col justify-between p-8"
        style={{ color: event.textColor }}
      >
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold opacity-70">
          <ArrowLeft className="size-4" /> Back to app
        </Link>
        <div>
          <p className="font-display text-6xl leading-none font-bold tracking-tight sm:text-8xl">
            {amount} {unit} {past ? "since" : "to"}
          </p>
          <h1 className="font-display mt-2 text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
            {event.title}
          </h1>
          <p className="mt-4 text-sm font-medium opacity-80">
            {new Date(event.date).toLocaleString()}
            {!past && ` · ${preciseRemaining(event.date, now)}`}
          </p>
        </div>
        <span className="text-[0.65rem] font-semibold tracking-[0.25em] uppercase opacity-60">
          Live widget
        </span>
      </div>
    </main>
  );
}

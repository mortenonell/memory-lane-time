import { Bell, BellOff, Maximize2, Pencil, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { countdownLabel, preciseRemaining, type WidgetEvent } from "@/lib/countdown";

type Props = {
  event: WidgetEvent;
  now: number;
  onEdit: (event: WidgetEvent) => void;
  onDelete: (id: string) => void;
};

export function WidgetCard({ event, now, onEdit, onDelete }: Props) {
  const { amount, unit, past } = countdownLabel(event, now);
  const bg =
    event.backgroundKind === "image"
      ? { backgroundImage: `url(${event.background})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: event.background };

  return (
    <div className="group relative overflow-hidden rounded-3xl shadow-widget" style={bg}>
      {event.backgroundKind === "image" && (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.55))]" />
      )}
      <div className="relative flex min-h-52 flex-col justify-between p-6" style={{ color: event.textColor }}>
        <div className="flex items-start justify-between gap-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] opacity-70">
            {event.source === "google" ? "Google Calendar" : "Widget"}
          </span>
          <span className="opacity-70">
            {event.notify ? <Bell className="size-4" /> : <BellOff className="size-4" />}
          </span>
        </div>

        <div>
          <p className="font-display text-4xl leading-none font-bold tracking-tight sm:text-5xl">
            {amount} {unit} {past ? "since" : "to"}
          </p>
          <p className="font-display mt-1 text-3xl leading-tight font-bold tracking-tight opacity-95 sm:text-4xl">
            {event.title}
          </p>
          <p className="mt-3 text-xs font-medium opacity-75">
            {new Date(event.date).toLocaleString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {!past && ` · ${preciseRemaining(event.date, now)}`}
          </p>
        </div>
      </div>

      <div className="absolute right-3 bottom-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Link
          to="/widget"
          search={{ id: event.id }}
          aria-label={`Open ${event.title} as a full-screen widget`}
          className="rounded-full bg-black/35 p-2 text-white backdrop-blur transition-colors hover:bg-black/55"
        >
          <Maximize2 className="size-4" />
        </Link>
        <button
          aria-label={`Edit ${event.title}`}

          onClick={() => onEdit(event)}
          className="rounded-full bg-black/35 p-2 text-white backdrop-blur transition-colors hover:bg-black/55"
        >
          <Pencil className="size-4" />
        </button>
        <button
          aria-label={`Delete ${event.title}`}
          onClick={() => onDelete(event.id)}
          className="rounded-full bg-black/35 p-2 text-white backdrop-blur transition-colors hover:bg-black/55"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

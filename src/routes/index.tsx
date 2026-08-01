import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarPlus,
  Link2,
  Loader2,
  CalendarDays,
  Smartphone,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WidgetCard } from "@/components/WidgetCard";
import { EventDialog } from "@/components/EventDialog";
import { WallpaperPanel } from "@/components/WallpaperPanel";
import { useLocalState } from "@/lib/store";
import { PRESET_BACKGROUNDS, uid, type WallpaperSettings, type WidgetEvent } from "@/lib/countdown";
import { importIcsCalendar } from "@/lib/ics.functions";
import {
  cancelNativeNotification,
  isNative,
  notificationId,
  requestNativeNotifications,
  scheduleNativeNotification,
} from "@/lib/native";
import wall1 from "@/assets/wall-1.jpg";
import wall2 from "@/assets/wall-2.jpg";
import wall3 from "@/assets/wall-3.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Countdown Widgets — Calendar & Event Countdowns" },
      {
        name: "description",
        content:
          "Build countdown widgets for your events, sync a Google Calendar, set per-event notifications and rotate wallpapers from your own album.",
      },
      { property: "og:title", content: "Countdown Widgets — Calendar & Event Countdowns" },
      {
        property: "og:description",
        content:
          "Countdown widgets with custom backgrounds, colours, Google Calendar sync and rotating wallpapers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const DEFAULT_ALBUM = [wall1, wall2, wall3];

const seedEvents = (): WidgetEvent[] => {
  const soon = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
  return [
    {
      id: uid(),
      title: "Summer holiday",
      date: soon(64),
      unit: "weeks",
      background: PRESET_BACKGROUNDS[1]!.value,
      backgroundKind: "gradient",
      textColor: "#231400",
      notify: true,
      notifyLeadMinutes: 1440,
      source: "local",
    },
    {
      id: uid(),
      title: "Mum's birthday",
      date: soon(12),
      unit: "days",
      background: PRESET_BACKGROUNDS[2]!.value,
      backgroundKind: "gradient",
      textColor: "#ffffff",
      notify: false,
      notifyLeadMinutes: 60,
      source: "local",
    },
    {
      id: uid(),
      title: "Graduation",
      date: soon(420),
      unit: "months",
      background: PRESET_BACKGROUNDS[0]!.value,
      backgroundKind: "gradient",
      textColor: "#e8fbff",
      notify: false,
      notifyLeadMinutes: 10080,
      source: "local",
    },
  ];
};

function Home() {
  const [events, setEvents] = useLocalState<WidgetEvent[]>("cw:events", []);
  const [seeded, setSeeded] = useLocalState<boolean>("cw:seeded", false);
  const [wallpaper, setWallpaper, wallpaperHydrated] = useLocalState<WallpaperSettings>(
    "cw:wallpaper",
    DEFAULT_WALLPAPER,
  );
  const [now, setNow] = useState(() => Date.now());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WidgetEvent | null>(null);
  const [icsUrl, setIcsUrl] = useState("");
  const [syncing, setSyncing] = useState(false);
  const notified = useRef<Set<string>>(new Set());
  const installPrompt = useRef<{ prompt: () => Promise<void> } | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      installPrompt.current = e as unknown as { prompt: () => Promise<void> };
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const installApp = async () => {
    if (installPrompt.current) {
      await installPrompt.current.prompt();
      installPrompt.current = null;
      setCanInstall(false);
      return;
    }
    toast.info("Use your browser's Share → Add to Home Screen to pin the widget.");
  };

  const askNotifications = async () => {
    if (isNative()) {
      const ok = await requestNativeNotifications();
      toast[ok ? "success" : "error"](ok ? "Notifications enabled" : "Notification permission denied");
      return;
    }
    if (typeof Notification === "undefined") {
      toast.error("This browser doesn't support notifications");
      return;
    }
    const result = await Notification.requestPermission();
    if (result === "granted") toast.success("Notifications enabled");
    else toast.error("Notification permission denied");
  };

  // Android: hand each reminder to the OS so it fires with the app closed.
  useEffect(() => {
    if (!isNative()) return;
    for (const e of events) {
      const id = notificationId(e.id);
      if (!e.notify) {
        void cancelNativeNotification(id).catch(() => {});
        continue;
      }
      void scheduleNativeNotification({
        id,
        title: e.title,
        body: `Starts ${new Date(e.date).toLocaleString()}`,
        at: new Date(new Date(e.date).getTime() - e.notifyLeadMinutes * 60_000),
      }).catch(() => {});
    }
  }, [events]);



  useEffect(() => {
    if (!seeded) {
      setEvents(seedEvents());
      setSeeded(true);
    }
  }, [seeded, setEvents, setSeeded]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const shuffle = useCallback(() => {
    setWallpaper((prev) => {
      if (prev.album.length === 0) return prev;
      const pool = prev.album.filter((a) => a !== prev.current);
      const next = (pool.length ? pool : prev.album)[
        Math.floor(Math.random() * (pool.length ? pool.length : prev.album.length))
      ]!;
      return { ...prev, current: next };
    });
  }, [setWallpaper]);

  // Wallpaper rotation: timed intervals, or on app open / tab unlock.
  useEffect(() => {
    if (!wallpaper.enabled) return;
    if (wallpaper.interval === "launch") {
      shuffle();
      const onVisible = () => document.visibilityState === "visible" && shuffle();
      document.addEventListener("visibilitychange", onVisible);
      return () => document.removeEventListener("visibilitychange", onVisible);
    }
    const ms = Number(wallpaper.interval) * 60_000;
    const t = setInterval(shuffle, ms);
    return () => clearInterval(t);
  }, [wallpaper.enabled, wallpaper.interval, shuffle]);

  // Per-event notifications.
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    for (const e of events) {
      if (!e.notify) continue;
      const fireAt = new Date(e.date).getTime() - e.notifyLeadMinutes * 60_000;
      const key = `${e.id}:${fireAt}`;
      if (notified.current.has(key)) continue;
      if (now >= fireAt && now < fireAt + 60_000) {
        notified.current.add(key);
        new Notification(e.title, {
          body: `Starts ${new Date(e.date).toLocaleString()}`,
        });
      }
    }
  }, [now, events]);

  const sorted = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );

  const saveEvent = (event: WidgetEvent) =>
    setEvents((prev) =>
      prev.some((e) => e.id === event.id)
        ? prev.map((e) => (e.id === event.id ? event : e))
        : [...prev, event],
    );

  const syncGoogle = async () => {
    if (!icsUrl.trim()) return;
    setSyncing(true);
    try {
      const { events: imported } = await importIcsCalendar({ data: { url: icsUrl.trim() } });
      setEvents((prev) => {
        const existing = new Set(prev.map((e) => `${e.title}|${e.date}`));
        const fresh = imported
          .filter((e) => !existing.has(`${e.title}|${e.date}`))
          .map<WidgetEvent>((e, i) => ({
            id: uid(),
            title: e.title,
            date: e.date,
            unit: "days",
            background: PRESET_BACKGROUNDS[i % PRESET_BACKGROUNDS.length]!.value,
            backgroundKind: PRESET_BACKGROUNDS[i % PRESET_BACKGROUNDS.length]!.kind,
            textColor: "#ffffff",
            notify: false,
            notifyLeadMinutes: 60,
            source: "google",
          }));
        toast.success(`Synced ${fresh.length} new event${fresh.length === 1 ? "" : "s"}`);
        return [...prev, ...fresh];
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that calendar");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="relative min-h-screen">
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center transition-[background-image] duration-700"
        style={
          wallpaper.enabled && wallpaper.current
            ? { backgroundImage: `url(${wallpaper.current})` }
            : { background: "var(--color-background)" }
        }
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-background/80 backdrop-blur-xl" />

      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
              <CalendarDays className="size-4" /> Countdown widgets
            </p>
            <h1 className="font-display mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Everything you're waiting for
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={askNotifications}>
              <BellRing className="size-4" /> Allow notifications
            </Button>
            <Button variant="secondary" className="gap-2" onClick={installApp}>
              <Smartphone className="size-4" /> {canInstall ? "Install app" : "Add to home screen"}
            </Button>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <CalendarPlus className="size-4" /> New widget
            </Button>
          </div>
        </header>


        <section className="mt-10 grid gap-5 sm:grid-cols-2">
          {sorted.map((event) => (
            <WidgetCard
              key={event.id}
              event={event}
              now={now}
              onEdit={(e) => {
                setEditing(e);
                setDialogOpen(true);
              }}
              onDelete={(id) => setEvents((prev) => prev.filter((e) => e.id !== id))}
            />
          ))}
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No widgets yet — create your first countdown.
            </p>
          )}
        </section>

        <section className="mt-10 rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
          <h2 className="font-display text-xl font-bold">Link Google Calendar</h2>
          <p className="text-sm text-muted-foreground">
            In Google Calendar open Settings → your calendar → “Secret address in iCal format”, then
            paste the link here to pull upcoming events in as widgets.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="ics" className="sr-only">
                Calendar iCal URL
              </Label>
              <Input
                id="ics"
                value={icsUrl}
                placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                onChange={(e) => setIcsUrl(e.target.value)}
              />
            </div>
            <Button onClick={syncGoogle} disabled={syncing} className="gap-2">
              {syncing ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Sync
            </Button>
          </div>
        </section>

        <div className="mt-6">
          <WallpaperPanel
            settings={wallpaper}
            onChange={(next) => setWallpaper(next)}
            onShuffle={shuffle}
          />
        </div>
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={saveEvent}
      />
      <Toaster />
    </main>
  );
}

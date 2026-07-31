import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRESET_BACKGROUNDS, uid, type TimeUnit, type WidgetEvent } from "@/lib/countdown";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: WidgetEvent | null;
  onSave: (event: WidgetEvent) => void;
};

function blank(): WidgetEvent {
  const d = new Date(Date.now() + 7 * 86_400_000);
  d.setMinutes(0, 0, 0);
  return {
    id: uid(),
    title: "",
    date: d.toISOString(),
    unit: "days",
    background: PRESET_BACKGROUNDS[0]!.value,
    backgroundKind: "gradient",
    textColor: "#ffffff",
    notify: false,
    notifyLeadMinutes: 60,
    source: "local",
  };
}

function toInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventDialog({ open, onOpenChange, initial, onSave }: Props) {
  const [draft, setDraft] = useState<WidgetEvent>(blank);

  useEffect(() => {
    if (open) setDraft(initial ?? blank());
  }, [open, initial]);

  const set = <K extends keyof WidgetEvent>(key: K, value: WidgetEvent[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? "Edit widget" : "New countdown widget"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Event</Label>
            <Input
              id="title"
              value={draft.title}
              placeholder="Summer trip"
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date &amp; time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={toInputValue(draft.date)}
                onChange={(e) => {
                  const v = new Date(e.target.value);
                  if (!Number.isNaN(v.getTime())) set("date", v.toISOString());
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Count in</Label>
              <Select value={draft.unit} onValueChange={(v) => set("unit", v as TimeUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Widget background</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.value}
                  type="button"
                  aria-label={`Background ${bg.value}`}
                  onClick={() => {
                    set("background", bg.value);
                    set("backgroundKind", bg.kind);
                  }}
                  className={`size-9 rounded-xl border-2 transition-transform hover:scale-105 ${
                    draft.background === bg.value ? "border-ring" : "border-border"
                  }`}
                  style={{ background: bg.value }}
                />
              ))}
              <label className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-2 border-border text-xs">
                <input
                  type="color"
                  className="size-0 opacity-0"
                  value={draft.backgroundKind === "color" ? draft.background : "#222222"}
                  onChange={(e) => {
                    set("background", e.target.value);
                    set("backgroundKind", "color");
                  }}
                />
                +
              </label>
            </div>
            <Input
              placeholder="…or paste an image URL"
              value={draft.backgroundKind === "image" ? draft.background : ""}
              onChange={(e) => {
                set("background", e.target.value);
                set("backgroundKind", e.target.value ? "image" : "color");
              }}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <Label htmlFor="text-color">Text colour</Label>
            <input
              id="text-color"
              type="color"
              value={draft.textColor}
              onChange={(e) => set("textColor", e.target.value)}
              className="h-9 w-16 cursor-pointer rounded-md border border-border bg-transparent"
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify">Notify me</Label>
              <Switch
                id="notify"
                checked={draft.notify}
                onCheckedChange={(v) => {
                  set("notify", v);
                  if (v && typeof Notification !== "undefined") void Notification.requestPermission();
                }}
              />
            </div>
            {draft.notify && (
              <Select
                value={String(draft.notifyLeadMinutes)}
                onValueChange={(v) => set("notifyLeadMinutes", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">At event time</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                  <SelectItem value="10080">1 week before</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!draft.title.trim()}
            onClick={() => {
              onSave({ ...draft, title: draft.title.trim() });
              onOpenChange(false);
            }}
          >
            Save widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

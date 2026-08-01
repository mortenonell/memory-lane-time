import { Images, Plus, Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { WallpaperInterval, WallpaperSettings } from "@/lib/countdown";
import { isNative, pickNativePhotos } from "@/lib/native";

type Props = {
  settings: WallpaperSettings;
  onChange: (next: WallpaperSettings) => void;
  onShuffle: () => void;
};

const MAX_BYTES = 2_500_000;

export function WallpaperPanel({ settings, onChange, onShuffle }: Props) {
  const [url, setUrl] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const readFiles = async (files: FileList) => {
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const tooBig = picked.filter((f) => f.size > MAX_BYTES);
    const usable = picked.filter((f) => f.size <= MAX_BYTES);
    const dataUrls = await Promise.all(
      usable.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
      ),
    );
    if (dataUrls.length) {
      onChange({ ...settings, album: [...settings.album, ...dataUrls] });
      toast.success(`Added ${dataUrls.length} photo${dataUrls.length === 1 ? "" : "s"}`);
    }
    if (tooBig.length) toast.error(`${tooBig.length} photo(s) skipped — over 2.5 MB`);
  };

  return (
    <section className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Wallpaper album</h2>
          <p className="text-sm text-muted-foreground">
            Rotate a random wallpaper from your album on a schedule.
          </p>
        </div>
        <Switch
          aria-label="Enable wallpaper rotation"
          checked={settings.enabled}
          onCheckedChange={(v) => onChange({ ...settings, enabled: v })}
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label>Change wallpaper</Label>
          <Select
            value={settings.interval}
            onValueChange={(v) => onChange({ ...settings, interval: v as WallpaperInterval })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Every 1 minute</SelectItem>
              <SelectItem value="5">Every 5 minutes</SelectItem>
              <SelectItem value="10">Every 10 minutes</SelectItem>
              <SelectItem value="15">Every 15 minutes</SelectItem>
              <SelectItem value="launch">Every time the app is opened / unlocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="secondary" onClick={onShuffle} className="gap-2">
          <Shuffle className="size-4" /> Shuffle now
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void readFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button className="gap-2" onClick={() => fileInput.current?.click()}>
            <Images className="size-4" /> Allow photo access
          </Button>
          <p className="text-xs text-muted-foreground">
            Pick photos from your device — your browser asks for permission and the images stay on
            this device.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={url}
            placeholder="…or paste an image URL"
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button
            variant="outline"
            className="gap-1"
            onClick={() => {
              if (!url.trim()) return;
              onChange({ ...settings, album: [...settings.album, url.trim()] });
              setUrl("");
            }}
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {settings.album.map((src) => (
          <div key={src} className="group relative aspect-square overflow-hidden rounded-xl">
            <img src={src} alt="Album wallpaper" loading="lazy" className="size-full object-cover" />
            <button
              aria-label="Remove wallpaper"
              onClick={() =>
                onChange({
                  ...settings,
                  album: settings.album.filter((a) => a !== src),
                  current: settings.current === src ? null : settings.current,
                })
              }
              className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

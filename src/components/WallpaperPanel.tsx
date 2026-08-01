import { FolderPlus, Images, Plus, Shuffle, Trash2, X } from "lucide-react";
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
import {
  activeAlbumPhotos,
  uid,
  type WallpaperAlbum,
  type WallpaperInterval,
  type WallpaperSettings,
} from "@/lib/countdown";
import { isNative, pickNativePhotos } from "@/lib/native";

type Props = {
  settings: WallpaperSettings;
  onChange: (next: WallpaperSettings) => void;
  onShuffle: () => void;
};

const MAX_BYTES = 2_500_000;

export function WallpaperPanel({ settings, onChange, onShuffle }: Props) {
  const [url, setUrl] = useState("");
  const folderInput = useRef<HTMLInputElement>(null);

  const active = settings.albums.find((a) => a.id === settings.activeAlbumId) ?? null;
  const photos = activeAlbumPhotos(settings);

  const addAlbum = (name: string, pics: string[]) => {
    const album: WallpaperAlbum = { id: uid(), name, photos: pics };
    onChange({ ...settings, albums: [...settings.albums, album], activeAlbumId: album.id });
    toast.success(`Album “${name}” added with ${pics.length} photo${pics.length === 1 ? "" : "s"}`);
  };

  const patchActive = (patch: Partial<WallpaperAlbum>) => {
    if (!active) return;
    onChange({
      ...settings,
      albums: settings.albums.map((a) => (a.id === active.id ? { ...a, ...patch } : a)),
    });
  };

  const readFolder = async (files: FileList) => {
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!picked.length) {
      toast.error("That folder has no images in it");
      return;
    }
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
    const rel = (picked[0] as File & { webkitRelativePath?: string }).webkitRelativePath ?? "";
    const name = rel.split("/")[0] || "New album";
    if (dataUrls.length) addAlbum(name, dataUrls);
    if (tooBig.length) toast.error(`${tooBig.length} photo(s) skipped — over 2.5 MB`);
  };

  return (
    <section className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Wallpaper albums</h2>
          <p className="text-sm text-muted-foreground">
            Pick one album — a random wallpaper from it rotates on your schedule.
          </p>
        </div>
        <Switch
          aria-label="Enable wallpaper rotation"
          checked={settings.enabled}
          onCheckedChange={(v) => onChange({ ...settings, enabled: v })}
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Album</Label>
          <Select
            value={settings.activeAlbumId ?? ""}
            onValueChange={(v) => onChange({ ...settings, activeAlbumId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="No albums yet" />
            </SelectTrigger>
            <SelectContent>
              {settings.albums.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} · {a.photos.length}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input
          ref={folderInput}
          type="file"
          accept="image/*"
          multiple
          // @ts-expect-error non-standard but supported by Chromium/Android browsers
          webkitdirectory=""
          directory=""
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void readFolder(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          className="gap-2"
          onClick={async () => {
            if (isNative()) {
              try {
                const pics = await pickNativePhotos(50);
                if (pics.length) addAlbum(`Album ${settings.albums.length + 1}`, pics);
              } catch {
                toast.error("Photo access was denied");
              }
              return;
            }
            folderInput.current?.click();
          }}
        >
          <FolderPlus className="size-4" /> Choose album
        </Button>
        <Button variant="secondary" onClick={onShuffle} className="gap-2">
          <Shuffle className="size-4" /> Shuffle now
        </Button>
        {active && (
          <Button
            variant="ghost"
            className="gap-2 text-destructive"
            onClick={() => {
              const rest = settings.albums.filter((a) => a.id !== active.id);
              onChange({
                ...settings,
                albums: rest,
                activeAlbumId: rest[0]?.id ?? null,
                current: null,
              });
            }}
          >
            <Trash2 className="size-4" /> Delete album
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          <Images className="mr-1 inline size-3" />
          Pick a whole gallery album/folder — Android asks for the photo permission and the images
          stay on this device.
        </p>
      </div>

      {active && (
        <div className="mt-5 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="album-name">Album name</Label>
            <Input
              id="album-name"
              value={active.name}
              onChange={(e) => patchActive({ name: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Input
              value={url}
              placeholder="…or paste an image URL to add to this album"
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => {
                if (!url.trim()) return;
                patchActive({ photos: [...active.photos, url.trim()] });
                setUrl("");
              }}
            >
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {photos.map((src) => (
          <div key={src} className="group relative aspect-square overflow-hidden rounded-xl">
            <img src={src} alt="Album wallpaper" loading="lazy" className="size-full object-cover" />
            <button
              aria-label="Remove wallpaper"
              onClick={() => {
                patchActive({ photos: photos.filter((p) => p !== src) });
                if (settings.current === src) onChange({ ...settings, current: null });
              }}
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

import { Capacitor } from "@capacitor/core";

export const isNative = () => Capacitor.isNativePlatform();

/** Pick photos from the Android gallery (asks for the OS media permission). */
export async function pickNativePhotos(limit = 10): Promise<string[]> {
  const { Camera } = await import("@capacitor/camera");
  const result = await Camera.pickImages({ quality: 80, limit });
  return result.photos.map((p) => p.webPath).filter((p): p is string => Boolean(p));
}

/** Ask for the Android 13+ POST_NOTIFICATIONS runtime permission. */
export async function requestNativeNotifications(): Promise<boolean> {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const { display } = await LocalNotifications.requestPermissions();
  return display === "granted";
}

/** Schedule an OS-level notification that fires even when the app is closed. */
export async function scheduleNativeNotification(opts: {
  id: number;
  title: string;
  body: string;
  at: Date;
}) {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  if (opts.at.getTime() <= Date.now()) return;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: opts.id,
        title: opts.title,
        body: opts.body,
        schedule: { at: opts.at, allowWhileIdle: true },
      },
    ],
  });
}

export async function cancelNativeNotification(id: number) {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.cancel({ notifications: [{ id }] });
}

/** Stable positive 32-bit id derived from an event id. */
export function notificationId(eventId: string) {
  let hash = 0;
  for (const ch of eventId) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(hash) % 2_000_000_000;
}

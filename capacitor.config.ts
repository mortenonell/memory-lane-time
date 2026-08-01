import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android packaging config (Capacitor).
 * Target: Android 13 (API 33) and above — covers OxygenOS 13.1+.
 *
 * The app is served from the Lovable deployment so the countdown widgets,
 * calendar sync and wallpaper album stay in sync with the web build.
 * To ship a fully offline bundle instead, remove the `server` block and
 * point `webDir` at a static export.
 */
const config: CapacitorConfig = {
  appId: "app.lovable.cb3b83154a6f44688ca80260229df629",
  appName: "Countdown Widgets",
  webDir: ".output/public",
  android: {
    allowMixedContent: false,
    backgroundColor: "#0f1115",
  },
  server: {
    url: "https://id-preview--cb3b8315-4a6f-4468-8ca8-0260229df629.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#0f1115",
      androidScaleType: "CENTER_CROP",
      launchAutoHide: true,
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#f59e0b",
    },
  },
};

export default config;

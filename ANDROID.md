# Android export (OxygenOS 13.1+ / Android 13+)

The app is packaged with Capacitor. Everything needed is already in the repo —
run the native steps on your own machine.

## Requirements

- Node 20+, Android Studio (Hedgehog or newer), JDK 17
- Android SDK Platform 33+ (OxygenOS 13.1 is Android 13 = API 33)

## Steps

```bash
git clone <your repo>   # export to GitHub from Lovable first
cd <repo>
npm install
npx cap add android
npm run build
npx cap sync android
npx cap open android
```

Then press Run in Android Studio (device or emulator), or
`Build > Generate Signed Bundle / APK` for a release `.aab`/`.apk`.

## Required native settings

In `android/variables.gradle` (created by `cap add android`):

```gradle
ext {
    minSdkVersion = 33        // Android 13 — OxygenOS 13.1 and above
    compileSdkVersion = 35
    targetSdkVersion = 35
}
```

In `android/app/src/main/AndroidManifest.xml` add, inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.INTERNET" />
```

## What is native

- **Photos**: the wallpaper album uses the Android gallery picker
  (`@capacitor/camera`) with the OxygenOS media permission prompt.
- **Reminders**: each event's reminder is scheduled with
  `@capacitor/local-notifications`, so it fires with the app closed.
- **Home-screen widget view**: `/widget?id=...` is a full-screen live
  countdown. Android's real home-screen widgets need a Java/Kotlin
  `AppWidgetProvider`; Capacitor apps can't provide one from web code.

## Live vs bundled content

`capacitor.config.ts` currently loads the hosted Lovable build (`server.url`),
so app updates ship without a Play Store release. For a self-contained APK,
delete the `server` block and point `webDir` at a static build output.

## Get a downloadable APK without Android Studio

The repo ships a GitHub Actions workflow at
`.github/workflows/android-apk.yml` that builds the APK in the cloud.

1. Export the project to GitHub from Lovable (top-right **GitHub** button).
2. In your repo open **Actions > Build Android APK > Run workflow**.
3. When it finishes (~5–8 min), download the APK either from:
   - the run's **Artifacts** section (`countdown-widgets-apk`), or
   - **Releases**, where the run publishes `app-debug.apk`.
4. Copy the `.apk` to your OnePlus, tap it, and allow
   *Install unknown apps* when OxygenOS asks.

The workflow already sets `minSdkVersion = 33` and injects the notification,
media and exact-alarm permissions, so nothing has to be edited by hand.

It produces a **debug-signed** APK — perfect for installing on your own
device, but not accepted by Google Play. For Play, use
`Build > Generate Signed Bundle / AAB` in Android Studio with your own keystore.

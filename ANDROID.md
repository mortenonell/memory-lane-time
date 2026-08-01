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

# Android TV Build Guide

This guide covers building the Prayer Time Android TV APK from the web application.

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Node.js | 22+ LTS | [nodejs.org](https://nodejs.org) or `brew install node` |
| Java JDK | 17+ | `brew install openjdk@17` |
| Android Studio | Latest | [developer.android.com/studio](https://developer.android.com/studio) |

### macOS Environment Setup

Add to `~/.zshrc` or `~/.bash_profile`:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

Reload shell:
```bash
source ~/.zshrc
```

### Android SDK Components

Install via Android Studio > Settings > SDK Manager:
- Android SDK Platform 33+ (or latest)
- Android SDK Build-Tools
- Android SDK Command-line Tools
- Android SDK Platform-Tools
- (Optional) Android TV system image for emulator testing

## Project Structure

```
android/
├── app/
│   ├── build.gradle              # App build config
│   └── src/main/
│       ├── AndroidManifest.xml   # TV support configured
│       ├── java/.../MainActivity.java  # Fullscreen/immersive mode
│       ├── res/
│       │   ├── drawable/tv_banner.xml  # TV launcher banner
│       │   ├── values/colors.xml       # Theme colors
│       │   └── values/styles.xml       # App themes
│       └── assets/public/        # Built web assets
├── build.gradle                  # Root build config
└── variables.gradle              # SDK versions
```

## Build Commands

### Quick Build

```bash
# Build web assets and sync to Android
npm run android:sync

# Open in Android Studio
npm run android:open
```

### Manual Steps

```bash
# 1. Build web assets
npm run build

# 2. Sync to Android project
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

### Building the APK

From Android Studio:

1. **Debug APK** (for testing):
   - Menu: Build > Build Bundle(s) / APK(s) > Build APK(s)
   - Output: `android/app/build/outputs/apk/debug/app-debug.apk`

2. **Release APK** (for distribution):
   - Menu: Build > Generate Signed Bundle / APK
   - Select APK
   - Create/select signing keystore
   - Build type: release
   - Output: `android/app/build/outputs/apk/release/app-release.apk`

## Installation on Android TV

### Via ADB (Recommended)

```bash
# Connect to TV over USB or WiFi
adb connect <TV_IP_ADDRESS>:5555

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or for release APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Via USB Drive

1. Copy APK to USB drive
2. Insert USB into Android TV
3. Use file manager app to install
4. Enable "Install from unknown sources" if prompted

## TV Launcher Configuration

The app is configured to appear in the Android TV launcher with:
- App banner (320x180 dp) for TV home screen
- Leanback launcher support
- Landscape orientation lock
- Fullscreen/immersive mode

## TV Remote Navigation

Since there's no URL bar in the APK, use these methods to access settings:

### Method 1: Settings Button
- A subtle **gear icon** appears in the bottom-right corner
- Navigate to it using the D-pad and press OK/Select

### Method 2: Keyboard Shortcuts
| Key | Action |
|-----|--------|
| **Menu** button | Opens Config page |
| **Triple-tap OK** | Opens Config page (tap 3 times within 1 second) |
| **F2** | Opens Config page (for testing with keyboard) |
| **F3** | Opens Admin Config (for testing with keyboard) |

### Navigation Flow
```
Main Display → Config Page → Admin Config
     ↑              ↓              ↓
     └──── Back ────┴───── Back ───┘
```

From the Config page, tap "Admin Configuration" link at the bottom to access admin settings.

## Customizing the TV Banner

Replace the placeholder banner with a proper image:

1. Create a PNG image: 320x180 pixels
2. Save as `android/app/src/main/res/drawable-xhdpi/tv_banner.png`
3. For multiple densities:
   - `drawable-mdpi`: 160x90 px
   - `drawable-hdpi`: 240x135 px
   - `drawable-xhdpi`: 320x180 px
   - `drawable-xxhdpi`: 480x270 px

Or keep the XML drawable at `android/app/src/main/res/drawable/tv_banner.xml`.

## Signing for Release

### Create Keystore (First Time)

```bash
keytool -genkey -v -keystore prayer-time.keystore \
  -alias prayer-time \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Store the keystore file and password securely.

### Configure Signing in Gradle

Add to `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file("../prayer-time.keystore")
            storePassword "your_store_password"
            keyAlias "prayer-time"
            keyPassword "your_key_password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Troubleshooting

### App not appearing in TV launcher
- Verify `AndroidManifest.xml` has `LEANBACK_LAUNCHER` intent filter
- Ensure `android:banner` attribute points to valid drawable
- Check `uses-feature` for leanback has `android:required="false"`

### WebView errors
- Update Android System WebView from Play Store
- Check minimum WebView version in device settings

### Build fails
- Run `./gradlew clean` in android/ directory
- Verify ANDROID_HOME environment variable
- Check Java version: `java -version` (needs 17+)

### API/Network issues
- Ensure `android.permission.INTERNET` in manifest
- Check `cleartext` traffic allowed in capacitor.config.ts

## Testing

### On Emulator

1. Create Android TV emulator in Android Studio:
   - Tools > Device Manager > Create Device
   - Category: TV
   - Select system image (API 33+)

2. Run app:
   ```bash
   npx cap run android
   ```

### On Physical TV

1. Enable Developer Options on TV
2. Enable USB Debugging
3. Connect via ADB
4. Install and test

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-20 | Initial Android TV support |

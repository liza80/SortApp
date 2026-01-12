# Android Emulator Debug Guide for React Native

## 📱 How to Debug Errors on Android Emulator

### 1. Enable Debug Mode in Chrome DevTools

#### Method A: Using Metro Bundler

1. **Start Metro bundler:**
   ```bash
   npx react-native start
   ```
2. In the Metro terminal, press `d` to open developer menu
3. Or in emulator: Press `Ctrl + M` (Windows) or `Cmd + M` (Mac)
4. Select **"Debug with Chrome"**

#### Method B: Using Emulator Keyboard

1. In emulator, press `Ctrl + M` (or `Cmd + M` on Mac)
2. Select **"Debug"** or **"Debug JS Remotely"**
3. Chrome will open with debugging console

### 2. View Console Logs

#### Option 1: React Native Debugger

```bash
# Install React Native Debugger
# Download from: https://github.com/jhen0409/react-native-debugger/releases
```

#### Option 2: Chrome Developer Tools

1. Open Chrome DevTools (F12)
2. Go to **Console** tab
3. All `console.log()` statements will appear here

#### Option 3: Terminal Logs

```bash
# View Android logs in terminal
npx react-native log-android

# Or use ADB directly
adb logcat *:S ReactNative:V ReactNativeJS:V
```

### 3. Common Debugging Commands

```bash
# Check if emulator is connected
adb devices

# Install APK on emulator
adb install android/app/build/outputs/apk/release/app-release.apk

# Clear app data
adb shell pm clear com.cheetah.sortapp

# View all logs
adb logcat

# Filter React Native logs only
adb logcat | grep "ReactNativeJS"

# View crash logs
adb logcat | grep -E "AndroidRuntime|FATAL"
```

### 4. Debug Network Requests

#### Enable Network Inspection:

1. Open Chrome DevTools
2. Go to **Network** tab
3. All API calls will be visible

#### For API issues, add to your code:

```javascript
// Add this to see API errors
console.log("API Error:", error);
console.log("API Response:", response);
```

### 5. Debug Camera Issues (Your Current Problem)

Add these debug statements to `AppBarcodeScanner.tsx`:

```javascript
useEffect(() => {
  console.log("Platform:", Platform.OS);
  console.log("Is Fallback Mode:", shouldUseFallback());
  console.log("Has Camera Permission:", hasPermission);
  console.log("Camera Device:", device);
  console.log("Camera Available:", !!Camera);
}, []);
```

### 6. Enable Detailed Error Messages

In your `App.tsx` or index file:

```javascript
import { LogBox } from "react-native";

// Show all warnings
LogBox.ignoreAllLogs(false);

// Or ignore specific warnings
LogBox.ignoreLogs(["Warning: ..."]);
```

### 7. Debug Build Issues

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx react-native run-android

# Build with verbose logging
cd android
./gradlew assembleDebug --info

# Check for build errors
./gradlew assembleDebug --stacktrace
```

### 8. Shake to Open Dev Menu

In emulator:

- **Windows/Linux**: Press `Ctrl + M`
- **Mac**: Press `Cmd + M`
- **Alternative**: Click menu button (⋮) in emulator toolbar

Dev Menu Options:

- **Reload** - Refresh the app
- **Debug** - Enable Chrome debugging
- **Enable Hot Reloading** - Auto-reload on save
- **Show Inspector** - Visual element inspector
- **Show Perf Monitor** - Performance metrics

### 9. Debug Your Stuck Emulator Issue

Run these commands to diagnose:

```bash
# 1. Check if Metro is running
npx react-native start --reset-cache

# 2. In new terminal, run the app
npx react-native run-android

# 3. If stuck, check logs
adb logcat | grep -E "ReactNative|AndroidRuntime"

# 4. Clear Metro cache
npx react-native start --reset-cache

# 5. If still stuck, try:
adb reverse tcp:8081 tcp:8081
```

### 10. Common Error Solutions

#### "Unable to load script from assets"

```bash
# Create assets folder
mkdir android/app/src/main/assets

# Bundle manually
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
```

#### "Could not connect to development server"

```bash
# Reset ADB
adb kill-server
adb start-server
adb reverse tcp:8081 tcp:8081
```

#### App Crashes on Launch

```bash
# Check crash logs
adb logcat | grep AndroidRuntime

# Common fix: Clear app data
adb shell pm clear com.cheetah.sortapp
```

### 11. Visual Studio Code Debugging

1. Install extension: **React Native Tools**
2. Add to `.vscode/launch.json`:

```json
{
  "name": "Debug Android",
  "type": "reactnative",
  "request": "launch",
  "platform": "android"
}
```

3. Press F5 to start debugging

### 12. Your Specific Camera Issue

To debug why camera shows blank/stuck:

```javascript
// Add to AppBarcodeScanner.tsx
console.log("=== CAMERA DEBUG ===");
console.log("Platform.OS:", Platform.OS);
console.log("Camera module exists:", !!Camera);
console.log("useCameraDevice exists:", !!useCameraDevice);
console.log("Device info:", device);
console.log("Has permission:", hasPermission);
console.log("Should use fallback:", shouldUseFallback());
console.log("Use fallback mode:", useFallbackMode);
```

Then check logs:

```bash
adb logcat | grep "CAMERA DEBUG" -A 7
```

## Quick Fix for Your Stuck Issue

1. **Kill all processes:**

```bash
# Windows
taskkill /F /IM node.exe
taskkill /F /IM java.exe

# Mac/Linux
killall -9 node
```

2. **Clean everything:**

```bash
cd android
./gradlew clean
cd ..
npx react-native start --reset-cache
```

3. **Reinstall app:**

```bash
adb uninstall com.cheetah.sortapp
npx react-native run-android
```

4. **If still stuck, wipe emulator:**

- In Android Studio: AVD Manager → Wipe Data
- Or: Create new emulator

## Enable Flipper Debugging (Advanced)

Flipper provides advanced debugging:

1. Download Flipper: https://fbflipper.com/
2. It's already configured in React Native
3. Just run your app and open Flipper
4. Features:
   - Network inspector
   - Layout inspector
   - Database browser
   - Log viewer

## Test the Fallback Mode

Since your app should show manual input on emulator:

1. Check if fallback UI appears
2. If not, the app might be crashing before rendering
3. Check logs: `adb logcat | grep -E "crash|error|exception"`

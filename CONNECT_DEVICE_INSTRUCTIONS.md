# How to Connect Your Android Device to Metro Bundler

## Current Status

- ✅ Metro bundler is running at: http://localhost:8081
- ✅ Your computer's IP address: 192.168.3.12
- ❌ Device can't connect to bundler

## Solution: Configure Device to Connect via WiFi

### Method 1: Shake Device to Open Dev Menu

1. **Make sure your Android device and computer are on the same WiFi network**
2. Open the app on your Android device
3. **Shake the device** to open the React Native developer menu
4. Select **"Settings"** (or "Dev Settings")
5. Under **"Debug server host & port for device"**, enter:
   ```
   192.168.3.12:8081
   ```
6. Go back and select **"Reload"** from the dev menu

### Method 2: If Shake Doesn't Work

If shaking doesn't open the menu, you can:

1. **For physical devices**: Press the menu button or volume up button
2. **Alternative**: Connect device via USB and run:
   ```
   adb shell input keyevent 82
   ```

### Method 3: Build a Standalone APK (No Metro Required)

If you want an APK that works without Metro bundler:

1. First, bundle the JavaScript:

   ```
   npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
   ```

2. Then build release APK:
   ```
   cd android
   gradlew.bat assembleRelease
   ```

This creates a standalone APK at:
`android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### If you see "Network request failed":

- Check Windows Firewall - allow Node.js through firewall
- Make sure port 8081 is not blocked
- Try using a different port if needed

### To check if Metro is accessible:

Open browser on your phone and go to:

```
http://192.168.3.12:8081
```

You should see the Metro bundler page.

### USB Debugging (Alternative)

If WiFi doesn't work, enable USB debugging:

1. Connect device via USB
2. Enable Developer Options on device
3. Enable USB Debugging
4. Run `adb devices` to verify connection
5. Then run `adb reverse tcp:8081 tcp:8081`

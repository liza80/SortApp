# How to Run SortApp on Android Emulator

## Method 1: Install APK on Emulator (Recommended)

### Step 1: Start Android Emulator

```bash
# Option A: From Android Studio
1. Open Android Studio
2. Click "AVD Manager" (phone icon in toolbar)
3. Click green play button on your emulator

# Option B: From command line
emulator -list-avds
emulator -avd YOUR_AVD_NAME
```

### Step 2: Install APK

```bash
# Make sure emulator is running, then:
adb devices
# You should see your emulator listed

# Install the APK
adb install android/app/build/outputs/apk/release/app-release.apk

# Or drag and drop the APK file onto the emulator window
```

### Step 3: Run the App

- Find "SortApp" icon in emulator's app drawer
- Click to open

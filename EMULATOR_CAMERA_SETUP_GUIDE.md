# Android Emulator Camera Setup Guide

## Why Camera Doesn't Work in Android Emulator

The camera might not work in your Android emulator for several reasons:

### Common Issues:

1. **Camera not enabled in AVD settings**
2. **Emulator using wrong camera source**
3. **Camera permissions not granted**
4. **Emulator system image doesn't support camera**

## How to Fix Camera in Android Emulator

### Step 1: Configure AVD Camera Settings

1. **Open Android Studio**
2. Go to **Tools > AVD Manager**
3. Click **Edit** (pencil icon) on your emulator
4. Click **Show Advanced Settings**
5. Find **Camera** section:
   - **Front Camera**: Set to `Webcam0` or `Emulated`
   - **Back Camera**: Set to `Webcam0` or `Emulated`

### Step 2: Choose the Right Option

#### Option A: Use Your Computer's Webcam

- Set cameras to `Webcam0`
- This uses your actual computer camera
- Best for testing real camera functionality

#### Option B: Use Emulated Camera

- Set cameras to `Emulated`
- Shows a moving checkerboard pattern
- Good for testing camera permissions and UI

### Step 3: Create New AVD (If Needed)

If editing doesn't work, create a new AVD:

1. **AVD Manager > Create Virtual Device**
2. Choose device (e.g., Pixel 4)
3. Select system image with **Google APIs** (not Google Play)
   - Example: `Android 11.0 (Google APIs)`
4. In **Advanced Settings**:
   - Enable both cameras
   - Set to `Webcam0` or `Emulated`
5. Finish creating AVD

### Step 4: Grant Camera Permission

1. Start your emulator
2. Install your APK
3. Go to **Settings > Apps > Your App > Permissions**
4. Enable **Camera** permission

### Step 5: Test Camera

1. Open your app
2. Navigate to barcode scanner
3. You should see:
   - Your webcam feed (if using Webcam0)
   - Moving pattern (if using Emulated)

## Troubleshooting

### Camera Still Not Working?

1. **Check Emulator Settings**:

   ```
   Extended Controls (3 dots) > Camera
   - Verify camera is enabled
   - Try switching between Front/Back
   ```

2. **Use Command Line**:

   ```bash
   # List available cameras
   emulator -avd YOUR_AVD_NAME -camera-back webcam0

   # Or for emulated camera
   emulator -avd YOUR_AVD_NAME -camera-back emulated
   ```

3. **Check AVD Config File**:
   - Location: `~/.android/avd/YOUR_AVD.avd/config.ini`
   - Look for:
     ```
     hw.camera.back=webcam0
     hw.camera.front=webcam0
     ```

### Alternative Solutions

#### 1. Use Different System Image

Some system images work better:

- **Recommended**: Android 11 or 12 with Google APIs
- **Avoid**: Google Play system images (camera often disabled)

#### 2. Use Physical Device

For best camera testing:

1. Enable Developer Options on your phone
2. Enable USB Debugging
3. Connect via USB
4. Run: `adb devices` to verify connection
5. Install APK directly to phone

#### 3. Use Genymotion Emulator

Alternative emulator with better camera support:

- Download from genymotion.com
- Better performance than standard emulator
- Camera usually works out of the box

## Quick Checklist

- [ ] AVD has camera enabled in settings
- [ ] Using Google APIs system image (not Google Play)
- [ ] Camera set to Webcam0 or Emulated
- [ ] Camera permission granted in app
- [ ] Emulator extended controls show camera enabled
- [ ] Try both front and back camera options

## Expected Behavior

### With Webcam0:

- Shows your computer's camera feed
- Can scan real barcodes

### With Emulated:

- Shows moving colored squares
- Won't scan real barcodes but tests UI

### Important Notes:

- Some emulators may show blank/black screen even with camera enabled
- Physical devices always provide the most reliable testing
- VisionCamera library may have compatibility issues with some emulators

## Your Current Setup

Based on your screenshot showing a blank white screen:

1. Your emulator likely has camera disabled
2. Follow Step 1 above to enable camera
3. Restart emulator after changes
4. Reinstall your APK

The camera works on your physical device, which confirms your code is correct. The issue is purely emulator configuration.

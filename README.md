# OilTrack Mobile (Android)

Professional Oil Change Management System converted to a mobile application using **Capacitor**.

## Mobile Features
- **Android Support**: Native Android project files included in the `/android` directory.
- **RTL Language Support**: Full Arabic interface with Right-to-Left layout.
- **QR/Barcode Scanning**: Integrated camera support for scanning vehicle and operation codes.
- **Thermal Printer Preparation**: Ready for integration with mobile thermal printers.
- **Modern Dark UI**: Optimized for mobile screens with high-contrast dark dashboard.

## How to Build the APK
1. **Prerequisites**: Ensure you have Android Studio and Java JDK installed on your machine.
2. **Open Project**: Open the `/android` folder in Android Studio.
3. **Build APK**:
   - In Android Studio, go to `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
   - Alternatively, run `./gradlew assembleDebug` from the `/android` terminal.
4. **Locate APK**: The generated APK will be found in `android/app/build/outputs/apk/debug/app-debug.apk`.

## Web Development
The core application continues to run as a React Vite app.
- Development: `npm run dev`
- Web Build: `npm run build`
- Sync Mobile: `npm run mobile:sync`

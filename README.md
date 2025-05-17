# Variable Interval Timer App

A mobile application that sets random timers between minimum and maximum durations, varying around an average duration.

## Features

- Set variable interval timers with customizable average, minimum, and maximum durations
- Visual distinction for average, minimum, and maximum values
- Light and dark mode support
- Runs in the background and continues timing when the app is closed or the device is sleeping
- Friendly, school-appropriate audio alerts
- Persistent settings using local storage
- Session history with detailed interval breakdown and export options

## Usage

1. Set your desired average duration (in hours/minutes/seconds)
2. Set minimum duration (in hours/minutes/seconds)
3. Set maximum duration (in hours/minutes/seconds)
4. Press "Start Timer" to begin
5. The app will automatically set random timers that average out to your specified average duration
6. Audio cues will play when each timer completes
7. Press "Stop Timer" to end the timer sequence

## Technical Details

This app is built using:
- React Native
- Expo
- AsyncStorage for persistence
- Expo Audio for sound playback
- Expo Notifications for alerts
- Expo Background Fetch for background operation

## Installation

### Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npx expo start
   ```

## Mobile

### [Development Builds for iOS Simulators](https://docs.expo.dev/build-reference/simulators/)

*  Running the latest build:
   ```
   eas build:run -p ios --latest
   ```
*  Generate iOS build artifacts - can be opened in Xcode to create development builds
   ```
   npx expo prebuild --platform ios
   ```

### [Development Build](https://docs.expo.dev/develop/development-builds/create-a-build/)

### Production Build

1. Install EAS CLI:
   ```
   npm install -g eas-cli
   ```
2. Configure EAS build:
   ```
   eas build:configure
   ```
3. Build for Android:
   ```
   eas build -p android
   ```
4. Build for iOS:
   ```
   eas build -p ios
   ```

## Web Deploys

1. Create web artifacts to deploy
   ```npx expo export -p web```
2. Verify everything works locally
   ```npx expo serve```
3. Deploy to staging/test
   1. Alias a specific deploy id
      ```eas deploy:alias --id=th8acisjl9```
   2. Creates new deployment, aliased by "test"
      `eas deploy --alias test`
4. Deploy to prod
   ```eas deploy --prod```

## Requirements

- Node.js 14 or higher
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Notes on Background Operation

- iOS and Android handle background tasks differently
- On iOS, background fetch is limited to periodic checks (minimum interval is 15 minutes in production)
- On Android, the app uses foreground services and boot receivers to ensure timer operation
- Notifications are used to ensure the user is alerted even when the app is in the background

## Sound Credits

The app uses school-friendly alert sounds stored in the assets directory.

## TODO
* [x] Find and update mp3 files for sound types other than 'bell'
* [x] Fix bug where subsequent interval durations after the first or second do not respect the min/max. Also starts occurring when the question is answered.
* [x] Redo list view
  * [x] Clicking on session takes you to a new page that has each interval displayed clearly and give ability to export in new page
  * [x] Session view should allow bulk exporting by selecting sessions
* [ ] Different colors for Average, minimum, and maximum so that it is a little clearer to use.
* [ ] Look into improving the look and feel of the UI
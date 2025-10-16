# App Update System - Setup Guide

## Overview
Your app now has an automatic update notification system that prompts users to update when a new version is available on the Play Store.

## How It Works

1. **Version Check**: App checks Firebase Firestore on startup for the latest version
2. **Update Types**:
   - **Optional Update**: User can choose "Update Now" or "Maybe Later"
   - **Force Update**: User must update to continue using the app (no "Maybe Later" button)
3. **Store Redirect**: Clicking "Update Now" opens the Play Store

---

## Setup Instructions

### Step 1: Configure Firebase Firestore

You need to add a version configuration document to your Firebase Firestore:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Create a new collection called: `appConfig`
5. Create a document with ID: `version`
6. Add the following fields:

```
Document ID: version

Fields:
├─ latestVersion (string): "1.0.1"
├─ latestVersionCode (number): 2
├─ minimumVersion (string): "1.0.0"
├─ minimumVersionCode (number): 1
├─ forceUpdate (boolean): false
├─ updateMessage (string): "New features and bug fixes are available. Update now for the best experience!"
├─ playStoreUrl (string): "https://play.google.com/store/apps/details?id=com.kharchasplit"
└─ appStoreUrl (string): "https://apps.apple.com/app/idYOUR_APP_ID" (for future iOS support)
```

**Important**: Replace `com.kharchasplit` in the `playStoreUrl` with your actual package name if different.

---

### Step 2: Update Firebase Rules (Security)

Add read permission for the `appConfig` collection in your Firestore Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... your existing rules ...

    // Allow all users to read app configuration
    match /appConfig/{document=**} {
      allow read: if true;
      allow write: if false; // Only allow manual updates from Firebase Console
    }
  }
}
```

---

### Step 3: Build and Upload New Version

1. **Build the release APK/AAB**:
   ```bash
   cd android
   ./gradlew bundleRelease
   # or
   ./gradlew assembleRelease
   ```

2. **Upload to Play Store**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Select your app
   - Go to "Production" → "Create new release"
   - Upload the AAB/APK (found in `android/app/build/outputs/`)
   - Version: **1.0.1 (2)**
   - Release notes: Describe your bug fixes
   - Submit for review

3. **Wait for approval** (usually 1-3 days)

---

## How to Trigger Updates for Users

### For Next Update (Version 1.0.2 and beyond)

1. **Update your code**:
   - Increment version in `android/app/build.gradle`:
     ```gradle
     versionCode 3
     versionName "1.0.2"
     ```
   - Update `src/services/versionCheckService.ts`:
     ```typescript
     private readonly CURRENT_VERSION_CODE = 3;
     private readonly CURRENT_VERSION_NAME = '1.0.2';
     ```

2. **Build and upload to Play Store**

3. **Update Firebase Firestore**:
   - Go to Firestore → `appConfig` → `version` document
   - Update:
     ```
     latestVersion: "1.0.2"
     latestVersionCode: 3
     ```

4. **All users on v1.0.1 or earlier will now see the update prompt!**

---

## Update Types

### Optional Update (Recommended for minor updates)
```javascript
// In Firebase:
forceUpdate: false
minimumVersionCode: 1 // Users on v1 can still use the app
latestVersionCode: 3  // But v3 is available
```
**Result**: User sees "Update Available" with "Update Now" and "Maybe Later" buttons

### Force Update (For critical bug fixes or breaking changes)
```javascript
// In Firebase:
forceUpdate: true
minimumVersionCode: 3 // Users must have at least v3
latestVersionCode: 3
```
**Result**: User sees "Update Required" - must update to continue (back button disabled)

---

## Testing the Update System

### Test 1: Optional Update
1. Set in Firebase:
   ```
   latestVersionCode: 99
   minimumVersionCode: 1
   forceUpdate: false
   updateMessage: "Test update available!"
   ```
2. Open your app
3. You should see "Update Available" modal with both buttons

### Test 2: Force Update
1. Set in Firebase:
   ```
   latestVersionCode: 99
   minimumVersionCode: 99
   forceUpdate: true
   updateMessage: "Critical update required!"
   ```
2. Open your app
3. You should see "Update Required" modal with only "Update Now" button
4. Back button should not close the modal

### Test 3: No Update
1. Set in Firebase:
   ```
   latestVersionCode: 2 (same as current)
   minimumVersionCode: 1
   ```
2. Open your app
3. No modal should appear

---

## Current Version Status

- **Current Version**: 1.0.1 (versionCode: 2)
- **Previous Version on Play Store**: 1.0.0 (versionCode: 1)

After uploading version 1.0.1 to the Play Store, users on version 1.0.0 will see the update prompt when you configure Firebase as described above.

---

## Troubleshooting

### Update modal not showing?
1. Check Firebase Firestore document exists: `appConfig/version`
2. Check Firestore rules allow reading `appConfig`
3. Check `latestVersionCode` is greater than current `CURRENT_VERSION_CODE`
4. Check console logs for errors

### "Update Now" button not working?
1. Verify `playStoreUrl` in Firebase is correct
2. Check device can access Play Store
3. Ensure URL format is: `https://play.google.com/store/apps/details?id=YOUR_PACKAGE_ID`

### Users still on old version?
- Updates are not automatic - users must manually update from Play Store
- This system only notifies them, doesn't auto-update
- Play Store auto-updates can take hours/days depending on user settings

---

## Firebase Document Example (Copy-Paste)

```json
{
  "latestVersion": "1.0.1",
  "latestVersionCode": 2,
  "minimumVersion": "1.0.0",
  "minimumVersionCode": 1,
  "forceUpdate": false,
  "updateMessage": "We've fixed bugs and improved performance. Update now for the best experience!",
  "playStoreUrl": "https://play.google.com/store/apps/details?id=com.kharchasplit",
  "appStoreUrl": "https://apps.apple.com/app/idYOUR_APP_ID"
}
```

---

## Files Modified

1. ✅ `android/app/build.gradle` - Updated to version 1.0.1 (versionCode 2)
2. ✅ `src/services/versionCheckService.ts` - New service for version checking
3. ✅ `src/components/UpdatePromptModal.tsx` - New update UI modal
4. ✅ `App.tsx` - Integrated update check on app startup

---

## Future Enhancements

- Add analytics to track how many users update
- Schedule periodic update checks (every 24 hours)
- Show "What's New" changelog in update modal
- Add iOS support with App Store URLs

---

**Need Help?** Check the Firebase Console logs and app console for error messages.

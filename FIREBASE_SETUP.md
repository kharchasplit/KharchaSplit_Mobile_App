# Firebase Setup Instructions

## 1. Firestore Security Rules

Copy the contents of `firestore.rules` to your Firebase Console:

1. Go to Firebase Console → Firestore Database → Rules
2. Replace existing rules with the content from `firestore.rules` file
3. Publish the rules

## 2. Required Collections

### Users Collection (`users`)
```
- id (auto-generated document ID)
- phoneNumber (string)
- name (string) 
- email (string, optional)
- createdAt (timestamp)
- updatedAt (timestamp)
- isActive (boolean)
```

## 3. Current Permission Issue

The error `firestore/permission-denied` occurs because:
- Firestore rules are restrictive by default
- User authentication might not be properly set up
- The app is trying to write without proper permissions

## 4. Quick Fix Options

### Option A: Development Mode (Testing Only)
```javascript
// For testing only - allows all reads/writes
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Option B: Production Ready (Recommended)
Use the rules in `firestore.rules` file and set up proper authentication.

## 5. WhatsApp API Configuration

- **API Endpoint**: `https://live-mt-server.wati.io/427966/api/v1/sendTemplateMessage`
- **Template Name**: `kharchasplit_login`
- **Authorization**: Bearer token (already configured)

## 6. Dependencies Installed

- `@react-native-firebase/app`
- `@react-native-firebase/firestore` 
- `@react-native-firebase/messaging`
- `@react-native-async-storage/async-storage`
- `@react-navigation/native`
- `@react-navigation/native-stack`

## 7. Next Steps

1. Update Firestore rules in Firebase Console
2. Test the authentication flow
3. Run `npm run ios` to test on device
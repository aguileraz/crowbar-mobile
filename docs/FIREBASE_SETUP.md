# Firebase Setup Guide

## Overview
This guide explains how to configure Firebase for the Crowbar Mobile app.

## Current Status
- ✅ React Native Firebase packages installed
- ✅ Placeholder configuration files created
- ✅ Firebase service wrapper implemented
- ⚠️ **REQUIRES REAL FIREBASE PROJECT SETUP**

## Required Steps to Complete Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `crowbar-mobile-dev` (for development)
4. Enable Google Analytics (optional)
5. Complete project creation

### 2. Configure Android App
1. In Firebase Console, click "Add app" → Android
2. Enter package name: `com.crowbarmobile`
3. Download `google-services.json`
4. Replace the placeholder file at `android/app/google-services.json`

### 3. Configure iOS App
1. In Firebase Console, click "Add app" → iOS
2. Enter bundle ID: `com.crowbarmobile`
3. Download `GoogleService-Info.plist`
4. Replace the placeholder file at `ios/GoogleService-Info.plist`

### 4. Update Environment Variables
Update the following variables in your `.env` files:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_APP_ID=your-actual-app-id
FIREBASE_API_KEY=your-actual-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
```

### 5. Enable Firebase Services
In Firebase Console, enable the following services:
- **Authentication**: Enable Email/Password and Google Sign-In
- **Firestore Database**: Create database in test mode
- **Cloud Messaging**: For push notifications
- **Analytics**: For app analytics (optional)

### 6. Configure Authentication
1. Go to Authentication → Sign-in method
2. Enable Email/Password
3. Enable Google Sign-In (optional)
4. Configure authorized domains

### 7. Configure Firestore Rules
Set up basic security rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add other collection rules as needed
  }
}
```

## Testing Firebase Connection

After completing the setup, test the connection:

```bash
npm run start
# In your app, the Firebase connection test will run automatically
# Check the console for success/error messages
```

## Troubleshooting

### Common Issues
1. **Build errors**: Ensure google-services.json and GoogleService-Info.plist are properly placed
2. **Connection errors**: Verify environment variables are correctly set
3. **Permission errors**: Check Firestore security rules

### Debug Commands
```bash
# Check Firebase configuration
npx react-native info

# Clear cache if needed
npx react-native start --reset-cache
```

## Security Notes
- Never commit real Firebase configuration files to version control
- Use different Firebase projects for development, staging, and production
- Implement proper Firestore security rules before production
- Regularly rotate API keys and tokens

## Next Steps
1. Replace placeholder configuration files with real ones
2. Update environment variables
3. Test authentication flow
4. Test Firestore operations
5. Configure push notifications
6. Set up analytics tracking

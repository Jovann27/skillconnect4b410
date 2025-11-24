# FCM V1 Push Notifications Setup

This guide will help you set up Firebase Cloud Messaging (FCM) V1 for push notifications in your Expo React Native app.

## Prerequisites

1. A Google Cloud Platform (GCP) project
2. Firebase project linked to your GCP project
3. FCM enabled in your Firebase project

## Step 1: Create a Google Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to "IAM & Admin" > "Service Accounts"
4. Click "Create Service Account"
5. Enter a name (e.g., "fcm-service-account")
6. Grant the following role: "Firebase Cloud Messaging Admin"
7. Click "Done"

## Step 2: Generate Service Account Key

1. In the Service Accounts list, click on your newly created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Click "Create"

This will download a JSON file with your service account credentials.

## Step 3: Configure Your App

1. Replace the placeholder content in `google-services.json` with the actual JSON content from your downloaded service account key file
2. Rename the file to match the expected name (the error message shows `api-0000000000000000000-111111-aaaaaabbbbbb.json` - use this exact name)
3. Place the file in the `mobile-frontend/` directory

## Step 4: Update EAS Build Configuration

If you're using EAS Build, you may need to configure the service account file path in your `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "resourceClass": "m1"
      }
    }
  }
}
```

## Step 5: Test the Setup

1. Build your app: `eas build --platform android` (or ios)
2. Install the build on a device
3. Test push notifications using the updated notification helper

## Backend Integration

For production use, you'll need to implement server-side push notification sending using the Firebase Admin SDK. The current setup uses Expo's push service for development/testing.

### Example Backend Implementation (Node.js):

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const sendFCMNotification = async (token, title, body, data = {}) => {
  const message = {
    token,
    notification: {
      title,
      body,
    },
    data,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.log('Error sending message:', error);
    return null;
  }
};
```

## Troubleshooting

- Ensure your service account has the correct permissions
- Verify the JSON file is properly formatted
- Check that FCM is enabled in your Firebase project
- Make sure the package name in `app.json` matches your Firebase project configuration

## Resources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Creating Google Service Accounts](https://expo.fyi/creating-google-service-account)

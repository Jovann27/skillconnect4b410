// /helpers/notificationHelper.js
import * as Notifications from "expo-notifications";

// Check if notifications are available
const notificationsAvailable = !!Notifications && typeof Notifications.scheduleNotificationAsync === 'function';

// Configure foreground notification handler (show alert & sound)
if (notificationsAvailable) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Schedule a push notification
export const sendNotification = async ({ title, body }) => {
  if (!notificationsAvailable) {
    console.log("Notifications not available");
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.log("Notification Error:", error);
  }
};

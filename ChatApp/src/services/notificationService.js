import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// This controls how notification appears when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {

  // Ask user for permission and get token
  async registerForPushNotifications() {
    if (!Device.isDevice) {
      alert('Push notifications only work on real device!');
      return null;
    }

    // Ask permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Permission denied for notifications!');
      return null;
    }

    // Get the token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    console.log('📱 Push Token:', token.data);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
      });
    }

    return token.data;
  }

  // Listen for notifications when app is open
  onForegroundNotification(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Listen for when user taps notification
  onNotificationTapped(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Remove listeners when done
  removeListeners(foregroundSub, tapSub) {
    Notifications.removeNotificationSubscription(foregroundSub);
    Notifications.removeNotificationSubscription(tapSub);
  }
}

export default new NotificationService();

import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/services/notificationService';
import { useChatStore } from './src/store/chatStore';

export default function App() {
  const setCurrentUser = useChatStore((s) => s.setCurrentUser);

  useEffect(() => {
    registerNotifications();
  }, []);

  const registerNotifications = async () => {
    // Get push token
    const token = await notificationService.registerForPushNotifications();
    console.log('Token:', token);

    // Listen for notification when app is open
    const foregroundSub = notificationService.onForegroundNotification(
      (notification) => {
        console.log('🔔 Notification received:', notification);
      }
    );

    // Listen for when user taps notification
    const tapSub = notificationService.onNotificationTapped(
      (response) => {
        console.log('👆 Notification tapped:', response);
      }
    );

    return () => {
      notificationService.removeListeners(foregroundSub, tapSub);
    };
  };

  return <AppNavigator />;
}

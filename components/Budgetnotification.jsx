import { useEffect, useCallback, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Custom hook for budget notifications
export const useBudgetNotifications = () => {
  const [notificationData, setNotificationData] = useState({}); // Track last notification time and count for each category

  const requestNotificationPermissions = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const channelResult = await Notifications.setNotificationChannelAsync('budget-alerts', {
          name: 'Budget Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        console.log('Notification channel created:', channelResult); // Log channel creation
      }
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('Existing notification status:', existingStatus); // Log existing status
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get notification permissions');
        return false;
      }
      console.log('Notification permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    requestNotificationPermissions();
  }, [requestNotificationPermissions]);

  const sendBudgetNotification = async (budget, spentByCategory = {}) => { // Default to empty object
    try {
      const spent = spentByCategory[budget.category] || 0; // Ensure spentByCategory is defined
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

      console.log(`Sending notification for budget: ${budget.title}, spent: ${spent}, limit: ${budget.limit}, percentage: ${percentage}`); // Log notification details

      // Check if enough time has passed since the last notification
      const now = Date.now();
      const { lastSentTime = 0, count = 0 } = notificationData[budget.category] || {};
      const notificationInterval = 2 * 60 * 1000; // 2 minutes

      if (percentage >= 75 && (now - lastSentTime) > notificationInterval && count < 2) { // Adjust the threshold as needed
        const notificationContent = {
          title: percentage >= 100 ? '🚨 Budget Exceeded!' : '⚠️ Budget Alert',
          body: `Your ${budget.title} budget is at ${percentage.toFixed(0)}% used.`,
          priority: 'high',
          sound: 'default',
          badge: 1,
          channelId: 'budget-alerts',
        };

        await Notifications.scheduleNotificationAsync({
          content: {
            ...notificationContent,
            data: {
              category: budget.category,
              percentage: percentage,
              title: budget.title,
            },
          },
          trigger: null, // Send immediately
        });
        console.log('Notification scheduled successfully'); // Log successful scheduling

        // Update the last notification time and count for this category
        setNotificationData((prev) => ({
          ...prev,
          [budget.category]: {
            lastSentTime: now,
            count: (prev[budget.category]?.count || 0) + 1, // Increment count
          },
        }));
      } else {
        console.log(`No notification to send for budget: ${budget.title}, percentage: ${percentage}`); // Log if no notification
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const checkBudgetThresholds = useCallback((budgets, spentByCategory = {}) => { // Default to empty object
    if (!Array.isArray(budgets)) {
      console.error('Budgets is not an array:', budgets);
      return; 
    }
  
    budgets.forEach((budget) => {
      const spent = spentByCategory[budget.category] || 0; // Ensure spentByCategory is defined
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      // console.log(`Checking budget: ${budget.title}, spent: ${spent}, limit: ${budget.limit}, percentage: ${percentage}`); // Log budget check
      if (percentage >= 75) {
        sendBudgetNotification(budget, spentByCategory);
      }
    });
  }, [sendBudgetNotification]);

  return {
    checkBudgetThresholds,
    sendBudgetNotification,
    requestNotificationPermissions,
  };
};

// Notification listener component
export const BudgetNotificationListener = ({ onNotificationReceived }) => {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification); // Log received notification
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification interaction:', response);
    });
    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, [onNotificationReceived]);
  return null;};

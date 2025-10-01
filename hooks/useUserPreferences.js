import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCE_KEYS = {
  HAS_SEEN_WELCOME: 'hasSeenWelcome',
  THEME: 'userTheme',
  NOTIFICATION_SETTINGS: 'notificationSettings',
};

export const useUserPreferences = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    hasSeenWelcome: false,
    theme: 'light',
    notificationSettings: {
      budgetAlerts: true,
      weeklyReports: true,
    },
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const storedPreferences = await AsyncStorage.multiGet(Object.values(PREFERENCE_KEYS));
      const loadedPreferences = {};
      
      storedPreferences.forEach(([key, value]) => {
        if (value !== null) {
          loadedPreferences[key] = JSON.parse(value);
        }
      });

      setPreferences(prev => ({
        ...prev,
        ...loadedPreferences,
      }));
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      setPreferences(prev => ({
        ...prev,
        [key]: value,
      }));
    } catch (error) {
      console.error('Error updating preference:', error);
      throw error;
    }
  };

  const markWelcomeAsSeen = async () => {
    await updatePreference(PREFERENCE_KEYS.HAS_SEEN_WELCOME, true);
  };

  return {
    isLoading,
    preferences,
    updatePreference,
    markWelcomeAsSeen,
    PREFERENCE_KEYS,
  };
};
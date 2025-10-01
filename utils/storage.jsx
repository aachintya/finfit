import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  TRANSACTIONS: 'transactions',
  USER_PREFERENCES: 'userPreferences',
  CATEGORIES: 'categories',
  BUDGETS: 'budgets'
};

export const storage = {

    async save(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  },

  async load(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error loading data:', error);
      return null;
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
};
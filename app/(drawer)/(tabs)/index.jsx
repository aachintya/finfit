//index.jsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import MoneyTracker from '../../../components/MoneyTracker'; 

const IndexScreen = () => {
  return (
      <MoneyTracker />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default IndexScreen;

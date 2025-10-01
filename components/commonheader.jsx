//commonheader.jsx
import React from 'react';
import { View, TouchableOpacity, SafeAreaView, Image, StatusBar, Alert ,StyleSheet} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export default function Header({ searchIconShown }) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent={false} backgroundColor={COLORS.background} barStyle="light-content" />
      <View style={styles.header}>
        {/* Left side: Menu button */}
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={wp('6%')} color={COLORS.text.primary} />
        </TouchableOpacity>

        {/* Center: Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Right side: Search icon or placeholder for consistent spacing */}
        {searchIconShown ? (
          <TouchableOpacity
            onPress={() => Alert.alert(t('Search'))}
            style={styles.searchButton}
          >
            <Ionicons name="search" size={wp('6%')} color={COLORS.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.searchButtonPlaceholder} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('4%'),
    backgroundColor: COLORS.background,
  },
  menuButton: {
    width: wp('10%'), // Fixed width to keep the layout stable
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: wp('20%'),
    height: wp('8%'),
  },
  searchButton: {
    width: wp('10%'), // Fixed width to keep the layout stable
    alignItems: 'center',
  },
  searchButtonPlaceholder: {
    width: wp('10%'), // Fixed width to ensure consistency when search icon is not shown
  },
});
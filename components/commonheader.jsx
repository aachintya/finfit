// components/CommonHeader.jsx
import React from 'react';
import { View, TouchableOpacity, SafeAreaView, Image, StatusBar, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';

export default function Header({ 
  searchIconShown, 
  onSearchPress,
  filterIconShown,
  onFilterPress,
  showFilterBadge = false
}) {
  const navigation = useNavigation();

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

        {/* Right side: Search and Filter icons */}
        <View style={styles.rightButtons}>
          {searchIconShown ? (
            <TouchableOpacity
              onPress={onSearchPress}
              style={styles.iconButton}
            >
              <Ionicons name="search" size={wp('6%')} color={COLORS.text.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButtonPlaceholder} />
          )}

          {filterIconShown ? (
            <TouchableOpacity
              onPress={onFilterPress}
              style={styles.iconButton}
            >
              <Ionicons name="funnel-outline" size={wp('6%')} color={COLORS.text.primary} />
              {showFilterBadge && (
                <View style={styles.filterBadge} />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButtonPlaceholder} />
          )}
        </View>
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
    justifyContent: 'space-between',
    padding: wp('4%'),
    backgroundColor: COLORS.background,
  },
  menuButton: {
    width: wp('20%'),
    alignItems: 'flex-start',
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  logo: {
    width: wp('20%'),
    height: wp('8%'),
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    width: wp('20%'),
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: wp('10%'),
    alignItems: 'center',
    position: 'relative',
  },
  iconButtonPlaceholder: {
    width: wp('10%'),
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: wp('2%'),
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
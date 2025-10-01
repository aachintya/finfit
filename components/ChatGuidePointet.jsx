import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const BUTTON_SIZE = wp('12%');
const SPOTLIGHT_PADDING = wp('4%');
const TOTAL_SPOTLIGHT_SIZE = BUTTON_SIZE + SPOTLIGHT_PADDING;

const ChatSpotlightGuide = ({ onDismiss }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [messageAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(messageAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(messageAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ])
    ]).start(() => onDismiss?.());
  }, []);

  return (
    <>
      {/* Semi-transparent overlay */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      
      {/* Spotlight cutout */}
      <Animated.View 
        style={[
          styles.spotlightContainer, 
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.spotlight} />
      </Animated.View>

      {/* Message */}
      <Animated.View style={[styles.messageContainer, {
        opacity: messageAnim,
        transform: [{
          translateY: messageAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-20, 0]
          })
        }]
      }]}>
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            Chat with our AI financial assistant!
          </Text>
        </View>
        <View style={styles.arrow} />
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  spotlightContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  spotlight: {
    position: 'absolute',
    right: wp('4%') - SPOTLIGHT_PADDING/2,
    bottom: hp('3%') - SPOTLIGHT_PADDING/2,
    width: TOTAL_SPOTLIGHT_SIZE,
    height: TOTAL_SPOTLIGHT_SIZE,
    borderRadius: TOTAL_SPOTLIGHT_SIZE/2,
    backgroundColor: '#00000000',
    // Add a subtle glow effect
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  messageContainer: {
    position: 'absolute',
    bottom: hp('3%') + BUTTON_SIZE + hp('4%'),
    right: wp('4%') + (BUTTON_SIZE / 2),
    alignItems: 'center',
    width: wp('50%'),
    transform: [{ translateX: wp('25%') }],
  },
  messageBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    maxWidth: wp('50%'),
  },
  messageText: {
    color: 'white',
    fontSize: wp('3.5%'),
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: wp('5%'),
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: wp('2%'),
    borderRightWidth: wp('2%'),
    borderTopWidth: wp('3%'),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 0, 0, 0.9)',
    alignSelf: 'center',
    marginTop: -1,
  },
});

export default ChatSpotlightGuide;
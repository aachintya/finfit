// import * as LocalAuthentication from 'expo-local-authentication';

// export class BiometricAuth {
//   static async isBiometricAvailable() {
//     try {
//       const compatible = await LocalAuthentication.hasHardwareAsync();
//       const enrolled = await LocalAuthentication.isEnrolledAsync();

//       return {
//         compatible,
//         available: compatible && enrolled
//       };
//     } catch (error) {
//       console.error('Biometric check error:', error);
//       return { compatible: false, available: false };
//     }
//   }

//   static async authenticate() {
//     try {
//       const result = await LocalAuthentication.authenticateAsync({
//         promptMessage: 'Verify your identity',
//         fallbackLabel: 'Use passcode',
//         cancelLabel: 'Cancel',
//         disableDeviceFallback: false,
//       });

//       return result.success;
//     } catch (error) {
//       console.error('Authentication error:', error);
//       return false;
//     }
//   }
// }

// utils/biometricAuth.js
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export class BiometricAuth {
  static async getBiometricType() {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (Platform.OS === 'ios') {
        // Prefer Face ID on iOS
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          return {
            available: true,
            type: 'FACE_ID',
            name: 'Face ID'
          };
        }
      } else if (Platform.OS === 'android') {
        // Prefer Fingerprint on Android
        if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          return {
            available: true,
            type: 'FINGERPRINT',
            name: 'Fingerprint'
          };
        }
      }

      return {
        available: false,
        type: null,
        name: null
      };
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return {
        available: false,
        type: null,
        name: null
      };
    }
  }

  static async isBiometricAvailable() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const biometricType = await this.getBiometricType();
      return {
        compatible,
        enrolled,
        available: compatible && enrolled && biometricType.available,
        ...biometricType
      };
    } catch (error) {
      console.error('Biometric check error:', error);
      return {
        compatible: false,
        enrolled: false,
        available: false,
        type: null,
        name: null
      };
    }
  }

  static async authenticate() {
    try {
      const { type, name } = await this.getBiometricType();
      if (!type) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: Platform.select({
          ios: 'Authenticate with Face ID',
          android: 'Authenticate with Fingerprint'
        }),
        fallbackLabel: Platform.select({
          ios: 'Use Passcode',
          android: 'Use PIN'
        }),
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return {
        success: result.success,
        error: result.error,
        type,
        name
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
        type: null,
        name: null
      };
    }
  }
} 
// ExpenseCalculator.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp
} from 'react-native-responsive-screen';
import { useGlobalContext } from '../components/globalProvider';
import { useNavigation } from '@react-navigation/native';
import * as IntentLauncher from 'expo-intent-launcher';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

// UPI Apps Data
const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', package: 'com.google.android.apps.nbu.paisa.user', uriSchema: 'tez' },
  { id: 'phonepe', name: 'PhonePe', package: 'com.phonepe.app', uriSchema: 'phonepe' },
  { id: 'paytm', name: 'Paytm', package: 'net.one97.paytm', uriSchema: 'paytmmp' },
  // Add other UPI apps as needed
];

// Function to open UPI apps
function openApp(platformSpecificLink) {
  if (Platform.OS === 'android') {
    // For Android, use package names with expo-intent-launcher
    try {
      IntentLauncher.startActivityAsync(IntentLauncher.ACTION_VIEW, {
        packageName: platformSpecificLink.android,
      });
    } catch (error) {
      console.error("Failed to open app on Android:", error);
    }
  } else if (Platform.OS === 'ios') {
    // For iOS, use deep link URLs
    Linking.openURL(platformSpecificLink.ios).catch((err) =>
      console.error("Failed to open app on iOS:", err)
    );
  }
}

const CATEGORIES = {
  EXPENSE: [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Health & Fitness',
    'Travel',
    'Other'
  ],
  INCOME: [
    'Salary',
    'Business',
    'Investments',
    'Freelance',
    'Gift',
    'Other'
  ],
  TRANSFER: [
    'Account Transfer',
    'Investment Transfer',
    'Debt Payment',
    'Other'
  ]
};

const ACCOUNTS = [
  'Cash',
  'Bank Account',
  'Credit Card',
  'Savings',
  'Investment'
];

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash' },
  { id: 'upi', name: 'UPI Payment' }
];

const MERCHANT_UPI = "blurofficialchannel@okaxis"; // Replace with your UPI ID

const MAX_DIGITS = 9;
const DECIMAL_PLACES = 2;

const ExpenseCalculator = ({ onClose, initialData }) => {
  const { t } = useTranslation();
  const isEditMode = Boolean(initialData);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialData?.date ? new Date(initialData.date) : new Date());
  const [type, setType] = useState(initialData?.type || 'EXPENSE');
  const [expression, setExpression] = useState('');
  const [note, setNote] = useState(initialData?.note || '');
  const [account, setAccount] = useState(initialData?.account || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUPIAppsModal, setShowUPIAppsModal] = useState(false);
  const [availableUPIApps, setAvailableUPIApps] = useState([]);
  const [paymentPending, setPaymentPending] = useState(false);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [amount, setAmount] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const { onSave, state } = useGlobalContext();
  const [currency, setCurrency] = useState(initialData?.currency || state?.defaultCurrency || 'USD');
  const [originalAmount, setOriginalAmount] = useState('');
  const [originalCurrency, setOriginalCurrency] = useState('');

  // Get currencies and defaultCurrency from global state
  const { currencies, defaultCurrency } = state;

  // Function to get currency symbol
  const getCurrencySymbol = (currencyCode) => {
    return currencies?.[currencyCode]?.symbol || currencyCode;
  };
  
  // Transfer-specific states
  const [fromAccount, setFromAccount] = useState(initialData?.fromAccount || '');
  const [toAccount, setToAccount] = useState(initialData?.toAccount || '');
  const [showFromAccountModal, setShowFromAccountModal] = useState(false);
  const [showToAccountModal, setShowToAccountModal] = useState(false);

  const validateAmount = useCallback((value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    const wholeNumberPart = Math.floor(Math.abs(numValue)).toString();
    return wholeNumberPart.length <= MAX_DIGITS;
  }, []);

  useEffect(() => {
    // Only check for UPI apps if we're not in edit mode
    if (!isEditMode) {
      checkInstalledApps();
    }
  }, [isEditMode]);

  useEffect(() => {
    // Only proceed if we're in edit mode and have initial data
    if (isEditMode && initialData) {
      console.log('Editing Transaction:', initialData);
      console.log('Default Currency:', state?.defaultCurrency);
      console.log('Conversion Rates:', state?.conversionRates);
      
      // Validate initialData
      if (!initialData.amount || !initialData.currency) {
        console.error('initialData is missing required fields:', initialData);
        Alert.alert(
          t('invalidDataTitle'),
          t('invalidDataMessage'),
          [{ text: t('ok'), onPress: onClose }]
        );
        return;
      }
  
      // Store the original amount and currency
      setOriginalAmount(initialData.amount?.toString() || '0');
      setOriginalCurrency(initialData.currency || state?.defaultCurrency || 'USD');
      
      // If currencies are different and we need to convert
      if (initialData.currency !== state?.defaultCurrency) {
        // Check if we have convertedAmount from the initial data
        if (initialData.convertedAmount !== undefined) {
          // Use the pre-calculated converted amount
          setAmount(parseFloat(initialData.convertedAmount).toFixed(DECIMAL_PLACES));
        } else if (state?.conversionRates && 
                   state.conversionRates[state.defaultCurrency] && 
                   state.conversionRates[initialData.currency]) {
          // Calculate conversion if rates are available
          const conversionRate = state.conversionRates[state.defaultCurrency] / state.conversionRates[initialData.currency];
          const convertedAmount = (initialData.amount * conversionRate).toFixed(DECIMAL_PLACES);
          setAmount(convertedAmount);
        } else {
          // If no conversion is possible, use original amount and show warning
          console.warn(`Conversion rates are missing. Using original amount.`);
          setAmount(parseFloat(initialData.amount).toFixed(DECIMAL_PLACES));
          Alert.alert(
            t('currencyConversionUnavailableTitle'),
            t('currencyConversionUnavailableMessage', { currency: initialData.currency }),
            [{ text: t('ok') }]
          );
        }
      } else {
        // Same currency, no conversion needed
        setAmount(parseFloat(initialData.amount).toFixed(DECIMAL_PLACES));
      }
    }
  }, [isEditMode, initialData, state?.defaultCurrency, state?.conversionRates, onClose, t]);

  const formatDate = (date) => {
    return date.toLocaleDateString(t('locale'), { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString(t('locale'), { 
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const checkInstalledApps = () => {
    setIsLoadingApps(true);
    setAvailableUPIApps(UPI_APPS); // Directly show all UPI apps
    setIsLoadingApps(false);
  };

  // Date change handler
  const onDateChange = (event, selectedDateValue) => {
    const currentDate = selectedDateValue || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    if (currentDate) {
      const newDate = new Date(currentDate);
      // Preserve the time from the existing selectedDate
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      setSelectedDate(newDate);
    }
  };

  // Time change handler
  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || selectedDate;
    setShowTimePicker(Platform.OS === 'ios');
    if (currentTime) {
      const newDate = new Date(selectedDate);
      newDate.setHours(currentTime.getHours());
      newDate.setMinutes(currentTime.getMinutes());
      setSelectedDate(newDate);
    }
  };

  const handlePayment = (paymentMethod) => {
    setShowPaymentModal(false);
    if (paymentMethod === 'cash') {
      setTimeout(() => {
        saveTransaction();
      }, 100);
    } else if (paymentMethod === 'upi') {
      setShowUPIAppsModal(true);
    }
  };

  const handleUPIApp = async (app) => {
    try {
      setShowUPIAppsModal(false); // Close any modal if needed
      setPaymentPending(true);    // Set loading state to true (if using)
  
      if (Platform.OS === 'android') {
        // Android-specific handling with IntentLauncher
        const activity = {
          packageName: app.package,
          flags: [
            IntentLauncher.FLAG_ACTIVITY_NEW_TASK,
            IntentLauncher.FLAG_ACTIVITY_SINGLE_TOP,
          ],
        };
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', activity);
      } else {
        // iOS-specific handling
        const appSpecificUrl = `${app.uriSchema}://`; // Make sure to append '://' on iOS
        await Linking.openURL(appSpecificUrl);
      }
  
      setPaymentPending(false);
      saveTransaction(); // Reset loading state and proceed to save transaction
    } catch (error) {
      console.error('Error opening app:', error);
      setPaymentPending(false);    // Reset loading state on error
    }
  };

  const handleNumber = useCallback((num) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      setAmount(prevAmount => {
        const newAmount = prevAmount === '0' ? num : prevAmount + num;
        
        // Handle decimal places
        if (newAmount.includes('.')) {
          const [whole, decimal] = newAmount.split('.');
          if (decimal && decimal.length > DECIMAL_PLACES) {
            return prevAmount;
          }
        }
        
        // Validate digit count
        const wholeNumber = newAmount.split('.')[0];
        if (wholeNumber.length > MAX_DIGITS) {
          Alert.alert(t('invalidAmountTitle'), t('maxDigitsAllowed'));
          return prevAmount;
        }
        
        return newAmount;
      });
      setIsProcessing(false);
    }, 100); // Debounce time for multi-touch handling
  }, [isProcessing, t]);

  const handleOperator = useCallback((operator) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      if (amount !== '0') {
        setExpression(amount + operator);
        setAmount('0');
      }
      setIsProcessing(false);
    }, 100);
  }, [amount, isProcessing]);

  const calculate = useCallback(() => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      if (expression) {
        try {
          // Handle division by zero
          if (expression.endsWith('/') && parseFloat(amount) === 0) {
            Alert.alert(t('invalidOperationTitle'), t('divisionByZeroMessage'));
            handleClear();
            setIsProcessing(false);
            return;
          }

          // Replace multiplication symbol for evaluation
          const evalExpression = expression.replace(/×/g, '*');
          const result = eval(evalExpression + amount);
          
          // Handle invalid results
          if (!isFinite(result)) {
            Alert.alert(t('invalidAmountTitle'), t('invalidAmountMessage'));
            handleClear();
            setIsProcessing(false);
            return;
          }

          // Format result to fixed decimal places
          const formattedResult = parseFloat(result.toFixed(DECIMAL_PLACES)).toString();
          
          // Validate result length
          if (!validateAmount(formattedResult)) {
            Alert.alert(t('invalidAmountTitle'), t('maxDigitsAllowed'));
            handleClear();
          } else {
            setAmount(formattedResult);
            setExpression('');
          }
        } catch (error) {
          Alert.alert(t('errorTitle'), t('invalidCalculationMessage'));
          handleClear();
        }
      }
      setIsProcessing(false);
    }, 100);
  }, [expression, amount, isProcessing, validateAmount, handleClear, t]);

  // Enhanced clear function
  const handleClear = useCallback(() => {
    setAmount('0');
    setExpression('');
  }, []);

  // Enhanced backspace handling
  const handleBackspace = useCallback(() => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      setAmount(prevAmount => {
        if (prevAmount.length > 1) {
          return prevAmount.slice(0, -1);
        }
        return '0';
      });
      setIsProcessing(false);
    }, 100);
  }, [isProcessing]);

  // Save Transaction function
  const saveTransaction = useCallback(() => {
    setShowUPIAppsModal(false);
    setPaymentPending(false);
  
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount === 0) {
      Alert.alert(t('invalidAmountTitle'), t('amountCannotBeZero'));
      return;
    }
  
    if (!validateAmount(amount)) {
      Alert.alert(t('invalidAmountTitle'), t('amountIsInvalid'));
      return;
    }
  
    let finalAmount = numAmount;
    let finalCurrency = state?.defaultCurrency || 'USD';
    let convertedAmount;
  
    // If we're in edit mode and dealing with different currencies
    if (isEditMode && originalCurrency && originalCurrency !== state?.defaultCurrency) {
      if (state?.conversionRates &&
          state.conversionRates[originalCurrency] &&
          state.conversionRates[state.defaultCurrency]) {
        // Convert back to original currency
        const conversionRate = state.conversionRates[originalCurrency] / state.conversionRates[state.defaultCurrency];
        finalAmount = parseFloat((numAmount * conversionRate).toFixed(DECIMAL_PLACES));
        finalCurrency = originalCurrency;
        // Store the converted amount in default currency
        convertedAmount = numAmount;
      } else {
        // If conversion rates are missing, keep the original amount and currency
        finalAmount = parseFloat(amount);
        finalCurrency = originalCurrency;
        console.warn(`Conversion rates are missing. Saving amount in ${originalCurrency}.`);
        Alert.alert(
          t('currencyConversionUnavailableTitle'),
          t('currencyConversionUnavailableMessage', { currency: originalCurrency }),
          [{ text: t('ok') }]
        );
      }
    }

    const transactionData = {
      id: initialData?.id || Date.now(),
      amount: parseFloat(finalAmount.toFixed(DECIMAL_PLACES)), // Ensure amount is rounded
      currency: finalCurrency,
      convertedAmount: convertedAmount ? parseFloat(convertedAmount.toFixed(DECIMAL_PLACES)) : undefined, // Rounded converted amount
      type,
      category: type === 'TRANSFER' ? t('transfer') : category, // Translate 'Transfer' if needed
      account: type === 'TRANSFER' ? fromAccount : account,
      toAccount: type === 'TRANSFER' ? toAccount : undefined,
      note,
      date: selectedDate.toISOString(),
      lastModified: new Date().toISOString(),
      isUpdate: isEditMode,
    };
  
    onSave(transactionData);
    onClose();
  }, [
    amount, type, category, account, fromAccount, toAccount, note, selectedDate,
    initialData, isEditMode, onSave, onClose, validateAmount, originalCurrency,
    state?.defaultCurrency, state?.conversionRates, originalAmount, t
  ]);

  const handleSave = () => {
    if (type === 'TRANSFER') {
      if (!fromAccount) {
        Alert.alert(t('errorTitle'), t('selectSourceAccount'));
        return;
      }
      if (!toAccount) {
        Alert.alert(t('errorTitle'), t('selectDestinationAccount'));
        return;
      }
      if (fromAccount === toAccount) {
        Alert.alert(t('errorTitle'), t('sameSourceDestinationAccount'));
        return;
      }
    } else if (!account) {
      Alert.alert(t('errorTitle'), t('selectAccount'));
      return;
    }
    
    if (!category && type !== 'TRANSFER') {
      Alert.alert(t('errorTitle'), t('selectCategory'));
      return;
    }

    if (isEditMode || type === 'INCOME' || type === 'TRANSFER') {
      saveTransaction();
    } else {
      setShowPaymentModal(true);
    }
  };

  // Render transfer-specific input fields
  const renderTransferFields = () => (
    <>
      <TouchableOpacity 
        style={styles.inputField}
        onPress={() => setShowFromAccountModal(true)}
      >
        <Text style={{ color: fromAccount ? COLORS.text.primary : COLORS.text.secondary }}>
          {fromAccount || t('fromAccount')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.inputField}
        onPress={() => setShowToAccountModal(true)}
      >
        <Text style={{ color: toAccount ? COLORS.text.primary : COLORS.text.secondary }}>
          {toAccount || t('toAccount')}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderDisplay = () => {
    const displayAmount = () => {
      // If the amount is a valid number, format it
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        return numAmount.toFixed(DECIMAL_PLACES);
      }
      return amount;
    };

    return (
      <View style={styles.displaySection}>
        {expression && <Text style={styles.expression}>{expression}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.amount, { marginRight: wp('2%') }]}>
            {displayAmount()}
          </Text>
          <TouchableOpacity onPress={handleBackspace} style={{ marginLeft: wp('4%') }}>
            <Ionicons name="backspace-outline" size={wp('6%')} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDateTime = () => (
    <View style={dateTimeStyles.dateTimeContainer}>
      <TouchableOpacity 
        style={dateTimeStyles.dateTimeButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons 
          name="calendar-outline" 
          size={wp('5%')} 
          color={COLORS.text.primary}
          style={dateTimeStyles.iconStyle}
        />
        <Text style={dateTimeStyles.dateTimeText}>
          {formatDate(selectedDate)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={dateTimeStyles.dateTimeButton}
        onPress={() => setShowTimePicker(true)}
      >
        <Ionicons 
          name="time-outline" 
          size={wp('5%')} 
          color={COLORS.text.primary}
          style={dateTimeStyles.iconStyle}
        />
        <Text style={dateTimeStyles.dateTimeText}>
          {formatTime(selectedDate)}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderKeypad = () => (
    <View style={styles.keypad}>
      {[
        ['7', '8', '9', '+'],
        ['4', '5', '6', '-'],
        ['1', '2', '3', '×'],
        ['0', '.', '=', '/']
      ].map((row, i) => (
        <View key={i} style={styles.keypadRow}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.key,
                ['+', '-', '×', '/', '='].includes(key) && styles.operatorKey
              ]}
              onPress={() => {
                if (isProcessing) return;
                
                if (key === '=') {
                  calculate();
                } else if (['+', '-', '×', '/'].includes(key)) {
                  const operator = key === '×' ? '*' : key;
                  handleOperator(operator);
                } else if (key === '.') {
                  if (!amount.includes('.')) {
                    handleNumber(key);
                  }
                } else {
                  handleNumber(key);
                }
              }}
            >
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );

  const renderUPIAppsModal = () => (
    <Modal
      visible={showUPIAppsModal}
      animationType="slide"
      transparent={false}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('selectUPIApp')}</Text>
          <TouchableOpacity onPress={() => {
            setShowUPIAppsModal(false);
            setShowPaymentModal(true);
          }}>
            <Text style={{ color: COLORS.primary }}>{t('back')}</Text>
          </TouchableOpacity>
        </View>
        {isLoadingApps ? (
          <View style={additionalStyles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={additionalStyles.loadingText}>{t('checkingInstalledApps')}</Text>
          </View>
        ) : (
          <FlatList
            data={availableUPIApps}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.listItem}
                onPress={() => handleUPIApp(item)}
              >
                <Text style={styles.listItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={additionalStyles.emptyContainer}>
                <Text style={additionalStyles.emptyText}>{t('noUPIAppsInstalled')}</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.headerButton, styles.cancelButton]}>{t('cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.headerButton, styles.saveButton]}>{t('save')}</Text>
          </TouchableOpacity>
        </View>

        {/* Type Selector */}
        <View style={styles.typeSelector}>
          {['INCOME', 'EXPENSE', 'TRANSFER'].map((typeOption) => (
            <TouchableOpacity 
              key={typeOption}
              style={[styles.typeButton, type === typeOption && styles.activeType]}
              onPress={() => setType(typeOption)}
            >
              <Text style={[styles.typeText, type === typeOption && styles.activeTypeText]}>
                {t(typeOption.toLowerCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
                  
        {/* Input Section */}
        <View style={styles.inputSection}>
          {type === 'TRANSFER' ? (
            renderTransferFields()
          ) : (
            <>
              <TouchableOpacity 
                style={styles.inputField}
                onPress={() => setShowAccountModal(true)}
              >
                <Text style={{ color: account ? COLORS.text.primary : COLORS.text.secondary }}>
                  {account || t('selectAccount')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.inputField}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={{ color: category ? COLORS.text.primary : COLORS.text.secondary }}>
                  {category || t('selectCategory')}
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          <View style={styles.inputField}>
            <TextInput
              placeholder={t('addNotes')}
              placeholderTextColor={COLORS.text.secondary}
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
            />
          </View>
        </View>

        {/* Date and Time Pickers */}
        {renderDateTime()}

        {/* Display Section */}
        {renderDisplay()}

        {/* Keypad */}
        {renderKeypad()}

        {/* Date Time Picker Modals */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
          />
        )}

        {showTimePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={onTimeChange}
          />
        )}
        
        {Platform.OS === 'ios' && (showDatePicker || showTimePicker) && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker || showTimePicker}
          >
            <View style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}>
              <View style={{
                backgroundColor: '#FFFFFF',
                padding: wp('4%'),
                borderTopLeftRadius: wp('4%'),
                borderTopRightRadius: wp('4%'),
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: wp('4%'),
                }}>
                  <TouchableOpacity onPress={() => {
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                  }}>
                    <Text style={{ color: COLORS.primary, fontSize: wp('4%') }}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                  }}>
                    <Text style={{ color: COLORS.primary, fontSize: wp('4%') }}>{t('done')}</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode={showDatePicker ? "date" : "time"}
                  display="spinner"
                  onChange={showDatePicker ? onDateChange : onTimeChange}
                  style={{ height: hp('25%') }}
                  textColor="#000000"
                  themeVariant="light"
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Category Selection Modal */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          transparent={false}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectCategory')}</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Text style={{ color: COLORS.primary }}>{t('done')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={CATEGORIES[type]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.listItem}
                  onPress={() => {
                    setCategory(item);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.listItemText}>{t(item.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_'))}</Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* Account Selection Modal */}
        <Modal
          visible={showAccountModal}
          animationType="slide"
          transparent={false}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectAccount')}</Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <Text style={{ color: COLORS.primary }}>{t('done')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
                data={ACCOUNTS}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.listItem}
                    onPress={() => {
                      setAccount(item);
                      setShowAccountModal(false);
                    }}
                  >
                    <Text style={styles.listItemText}>{t(item.toLowerCase().replace(/ /g, '_'))}</Text>
                  </TouchableOpacity>
                )}
              />
            </SafeAreaView>
          </Modal>
        
        {/* From Account Selection Modal */}
        <Modal
          visible={showFromAccountModal}
          animationType="slide"
          transparent={false}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectSourceAccount')}</Text>
              <TouchableOpacity onPress={() => setShowFromAccountModal(false)}>
                <Text style={{ color: COLORS.primary }}>{t('done')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={ACCOUNTS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.listItem}
                  onPress={() => {
                    setFromAccount(item);
                    setShowFromAccountModal(false);
                  }}
                >
                  <Text style={styles.listItemText}>{t(item.toLowerCase().replace(/ /g, '_'))}</Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* To Account Selection Modal */}
        <Modal
          visible={showToAccountModal}
          animationType="slide"
          transparent={false}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectDestinationAccount')}</Text>
              <TouchableOpacity onPress={() => setShowToAccountModal(false)}>
                <Text style={{ color: COLORS.primary }}>{t('done')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={ACCOUNTS.filter(acc => acc !== fromAccount)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.listItem}
                  onPress={() => {
                    setToAccount(item);
                    setShowToAccountModal(false);
                  }}
                >
                  <Text style={styles.listItemText}>{t(item.toLowerCase().replace(/ /g, '_'))}</Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* Payment Method Selection Modal */}
        <Modal
          visible={showPaymentModal}
          animationType="slide"
          transparent={false}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectPaymentMethod')}</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={{ color: COLORS.primary }}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={PAYMENT_METHODS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.listItem}
                  onPress={() => handlePayment(item.id)}
                >
                  <Text style={styles.listItemText}>{t(item.name.toLowerCase().replace(/ /g, '_'))}</Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* UPI Apps Selection Modal */}
        {renderUPIAppsModal()}

        {/* Loading Overlay for Payment Processing */}
        {paymentPending && (
          <View style={[StyleSheet.absoluteFill, {
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center'
          }]}>
            <View style={{
              backgroundColor: COLORS.background,
              padding: wp('5%'),
              borderRadius: wp('2%'),
              alignItems: 'center'
            }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.modalTitle, { marginTop: wp('2%') }]}>
                {t('processingPayment')}
              </Text>
            </View>
          </View>
        )}

      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default ExpenseCalculator;

// Styles
const additionalStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: wp('2%'),
    color: COLORS.text.primary,
    fontSize: wp('4%'),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('4%'),
  },
  emptyText: {
    color: COLORS.text.secondary,
    fontSize: wp('4%'),
  },
});

const dateTimeStyles = StyleSheet.create({
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: wp('3%'),
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.lightbackground,
    marginBottom: wp('2%'),
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    backgroundColor: COLORS.lightbackground,
    minWidth: wp('40%'), // Set minimum width for consistency
    justifyContent: 'center',
  },
  dateTimeText: {
    color: COLORS.text.primary,
    fontSize: wp('4%'),
    marginLeft: wp('2%'),
    fontWeight: '500',
  },
  iconStyle: {
    marginRight: wp('2%'),
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightbackground,
  },
  paymentMethodText: {
    fontSize: wp('4%'),
    color: COLORS.text.primary,
    marginLeft: wp('3%'),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightbackground
  },
  headerButton: {
    fontSize: wp('4%'),
    fontWeight: '500'
  },
  cancelButton: {
    color: '#ff6b6b'
  },
  saveButton: {
    color: '#51cf66'
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: wp('4%'),
    gap: wp('4%')
  },
  typeButton: {
    padding: wp('2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('4%')
  },
  activeType: {
    backgroundColor: COLORS.primary,
  },
  typeText: {
    color: COLORS.text.primary,
    fontSize: wp('4%')
  },
  activeTypeText: {
    color: COLORS.whiteBg
  },
  inputSection: {
    padding: wp('4%'),
    gap: wp('4%')
  },
  inputField: {
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: COLORS.lightbackground,
    borderRadius: wp('2%'),
    fontSize: wp('4%'),
    justifyContent: 'center'
  },
  displaySection: {
    padding: wp('4%'),
    alignItems: 'flex-end',
    backgroundColor: COLORS.lightbackground,
    minHeight: hp('15%')
  },
  expression: {
    fontSize: wp('5%'),
    color: COLORS.text.secondary
  },
  amount: {
    fontSize: wp('8%'),
    color: COLORS.text.primary,
    fontWeight: '500'
  },
  originalAmount: {
    fontSize: wp('4%'),
    color: COLORS.text.secondary,
    marginLeft: wp('2%'),
  },
  keypad: {
    flex: 1,
    padding: wp('2%')
  },
  keypadRow: {
    flexDirection: 'row',
    flex: 1
  },
  key: {
    flex: 1,
    margin: wp('1%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightbackground,
    borderRadius: wp('2%')
  },
  operatorKey: {
    backgroundColor: COLORS.primary + '20'
  },
  keyText: {
    fontSize: wp('6%'),
    color: COLORS.text.primary
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightbackground,
  },
  modalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  listItem: {
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightbackground,
  },
  listItemText: {
    fontSize: wp('4%'),
    color: COLORS.text.primary,
  },
  noteInput: {
    color: COLORS.text.primary,
    fontSize: wp('4%'),
    padding: 0,
  },
  ...additionalStyles,
});

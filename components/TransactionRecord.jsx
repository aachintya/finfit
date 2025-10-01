import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp
} from 'react-native-responsive-screen';
import { format, parseISO, isValid } from 'date-fns';
import { useGlobalContext } from './globalProvider';
import { currencies } from '../utils/currencyService';

const TransactionRecord = ({ transaction, onEdit }) => {
  const { deleteExpense, loadExpensesFromDB, state, convertAmount } = useGlobalContext();

  // Validate transaction data
  const validateTransaction = useCallback((transaction) => {
    if (!transaction) return false;
    const requiredFields = ['id', 'amount', 'type', 'category', 'currency'];
    return requiredFields.every(field => transaction.hasOwnProperty(field));
  }, []);

  // Format date with validation
  const formatDateTime = useCallback((dateString) => {
    try {
      if (!dateString) return 'No date';
      
      let date;
      if (typeof dateString === 'string') {
        date = parseISO(dateString);
      } else if (dateString instanceof Date) {
        date = dateString;
      } else {
        return 'Invalid date';
      }

      if (!isValid(date)) {
        return 'Invalid date';
      }

      return format(date, 'MMM dd, yyyy hh:mm a');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  }, []);

  // Simplified amount formatting with currency conversion
  const formattedAmount = useMemo(() => {
    try {
      if (!validateTransaction(transaction)) {
        return `${currencies[state.defaultCurrency]?.symbol || '$'}0.00`;
      }

      const amount = Number(transaction.amount);
      if (isNaN(amount)) {
        return `${currencies[state.defaultCurrency]?.symbol || '$'}0.00`;
      }

      // Convert amount if currencies are different
      const convertedAmount = transaction.currency !== state.defaultCurrency
        ? convertAmount(amount, transaction.currency, state.defaultCurrency)
        : amount;

      return `${currencies[state.defaultCurrency]?.symbol || '$'}${convertedAmount.toFixed(2)}`;
    } catch (error) {
      console.error('Amount formatting error:', error);
      return `${currencies[state.defaultCurrency]?.symbol || '$'}0.00`;
    }
  }, [
    transaction,
    state.defaultCurrency,
    state.exchangeRates,
    convertAmount,
    validateTransaction
  ]);

  const handleDelete = useCallback(async (e) => {
    e.stopPropagation();
    
    if (!validateTransaction(transaction)) {
      Alert.alert("Error", "Invalid transaction data");
      return;
    }

    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteExpense(transaction.id);
              await loadExpensesFromDB();
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert("Error", "Failed to delete transaction. Please try again.");
            }
          },
          style: "destructive"
        }
      ]
    );
  }, [transaction, deleteExpense, loadExpensesFromDB, validateTransaction]);

  if (!validateTransaction(transaction)) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid transaction data</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onEdit && onEdit(transaction)}
      activeOpacity={0.7}
    >
      <View style={styles.mainContent}>
        <View style={styles.leftContent}>
          <Text style={styles.category}>
            {transaction.category || 'Uncategorized'}
          </Text>
        </View>
        <Text
          style={[
            styles.amount,
            { color: transaction.type === 'EXPENSE' ? '#ff6b6b' : '#51cf66' },
          ]}
        >
          {formattedAmount}
        </Text>
      </View>

      <Text style={styles.note}>
        {transaction.note?.trim() || 'No note'}
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.leftInfo}>
          <Text style={styles.account}>
            {transaction.account || 'No account'}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.date}>
            {formatDateTime(transaction.date)}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.deleteButton}
        >
          <Ionicons 
            name="trash-outline" 
            size={wp('3.8%')} 
            color={COLORS.text.secondary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp('4%'),
    backgroundColor: COLORS.pri,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightbackground,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp('0.5%'),
  },
  leftContent: {
    flex: 1,
    marginRight: wp('2%'),
  },
  category: {
    fontSize: wp('4%'),
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  amount: {
    fontSize: wp('4%'),
    fontWeight: '500',
  },
  note: {
    fontSize: wp('3.5%'),
    color: COLORS.text.secondary,
    marginBottom: hp('1%'),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  account: {
    fontSize: wp('3.2%'),
    color: COLORS.text.secondary,
  },
  dot: {
    fontSize: wp('3.2%'),
    color: COLORS.text.secondary,
    marginHorizontal: wp('1.5%'),
  },
  date: {
    fontSize: wp('3.2%'),
    color: COLORS.text.secondary,
  },
  deleteButton: {
    opacity: 0.6,
    padding: wp('1%'),
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: wp('3.5%'),
    textAlign: 'center',
    padding: wp('2%'),
  }
});

export default React.memo(TransactionRecord);
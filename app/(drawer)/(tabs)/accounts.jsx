import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView 
} from 'react-native';
import { Link } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/theme';
import { 
  widthPercentageToDP as wp, 
  heightPercentageToDP as hp 
} from 'react-native-responsive-screen';
// Import useNavigation to handle navigation actions
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/commonheader';
import { useGlobalContext } from '../../../components/globalProvider';
import { useTranslation } from 'react-i18next';
const AccountsScreen = () => {
  // No useNavigation hook needed!
  const { fetchExpenses, state, convertAmount } = useGlobalContext();
  const { defaultCurrency, currencies } = state;
  const currencySymbol = currencies[defaultCurrency]?.symbol || defaultCurrency;
  const [accountBalances, setAccountBalances] = useState({
    'Credit Card': 0, 'Cash': 0, 'Savings': 0, 'Bank Account': 0, 'Investment': 0
  });
  const [summary, setSummary] = useState({ totalExpense: 0, totalIncome: 0 });
  const { t } = useTranslation();

  useEffect(() => {
    loadAccountData();
  }, [state.transactions, defaultCurrency]);

  const loadAccountData = async () => {
    try {
      const transactions = await fetchExpenses();
      const balances = { 'Credit Card': 0, 'Cash': 0, 'Savings': 0, 'Bank Account': 0, 'Investment': 0 };
      let totalExpense = 0;
      let totalIncome = 0;

      transactions.forEach(transaction => {
        const amount = convertAmount(parseFloat(transaction.amount), transaction.currency, defaultCurrency);
        let accountType = transaction.account;
        if (accountType === 'Card') accountType = 'Credit Card';
        if (accountType === 'Bank') accountType = 'Bank Account';
        if (!balances.hasOwnProperty(accountType)) accountType = 'Cash';

        if (transaction.type === 'EXPENSE') {
          balances[accountType] -= amount;
          totalExpense += amount;
        } else if (transaction.type === 'INCOME') {
          balances[accountType] += amount;
          totalIncome += amount;
        } // ... transfer logic remains the same
      });
      setAccountBalances(balances);
      setSummary({ totalExpense, totalIncome });
    } catch (error) {
      console.error(t('errorLoadingAccountData'), error);
    }
  };

  const accounts = [
    { id: 1, type: 'Credit Card', balance: accountBalances['Credit Card'], icon: 'card-outline' },
    { id: 2, type: 'Cash', balance: accountBalances['Cash'], icon: 'cash-outline' },
    { id: 3, type: 'Savings', balance: accountBalances['Savings'], icon: 'wallet-outline' },
    { id: 4, type: 'Bank Account', balance: accountBalances['Bank Account'], icon: 'home-outline' },
    { id: 5, type: 'Investment', balance: accountBalances['Investment'], icon: 'trending-up' }
  ];

  const totalBalance = Object.values(accountBalances).reduce((sum, balance) => sum + balance, 0);

  // We will no longer need handleAccountPress. We link directly in the JSX.
  const renderAccountCard = (account) => (
    <Link
      href={{
        pathname: "/accountDetails", // This corresponds to the file app/accountDetails.js
        params: { accountType: account.type } // We pass the account type as a parameter
      }}
      key={account.id}
      asChild // This makes the Link component pass its props to the child (TouchableOpacity)
    >
      <TouchableOpacity style={styles.accountCard}>
        <View style={styles.accountInfo}>
          <View style={styles.accountIconContainer}>
            <Ionicons name={account.icon} size={wp('6%')} color={COLORS.text.primary} />
          </View>
          <View style={styles.accountDetails}>
            <Text style={styles.accountType}>{t(account.type)}</Text>
            <Text style={[
              styles.accountBalance,
              { color: account.balance >= 0 ? '#51cf66' : '#ff6b6b' }
            ]}>
              {currencySymbol}{Math.abs(account.balance).toFixed(2)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward-outline" size={wp('6%')} color={COLORS.text.secondary} />
      </TouchableOpacity>
    </Link>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header searchIconShown={false} />
      <ScrollView style={styles.content}>
        {/* ... The rest of your JSX for total balance and summary remains the same ... */}
         <View style={styles.totalBalance}>
          <Text style={styles.totalBalanceLabel}>{t('All Accounts')}</Text>
          <Text style={[
            styles.totalBalanceAmount,
            { color: totalBalance >= 0 ? '#51cf66' : '#ff6b6b' }
          ]}>
            {currencySymbol}{Math.abs(totalBalance).toFixed(2)}
          </Text>
        </View>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('Expense Amount')}</Text>
            <Text style={[styles.summaryAmount, { color: '#ff6b6b' }]}>
              {currencySymbol}{summary.totalExpense.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('Income Amount')}</Text>
            <Text style={[styles.summaryAmount, { color: '#51cf66' }]}>
              {currencySymbol}{summary.totalIncome.toFixed(2)}
            </Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>{t('Accounts')}</Text>
        <View style={styles.accountsList}>
          {accounts.map(renderAccountCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// All styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  totalBalance: { alignItems: 'center', padding: wp('4%'), backgroundColor: COLORS.background },
  totalBalanceLabel: { fontSize: wp('4%'), color: COLORS.text.primary, marginBottom: hp('1%') },
  totalBalanceAmount: { fontSize: wp('7%'), fontWeight: '600' },
  summary: { flexDirection: 'row', justifyContent: 'space-around', padding: wp('4%'), backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.lightbackground },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: wp('3%'), color: COLORS.text.secondary, marginBottom: hp('0.5%') },
  summaryAmount: { fontSize: wp('4%'), fontWeight: '500' },
  sectionTitle: { fontSize: wp('5%'), fontWeight: '500', color: COLORS.text.primary, padding: wp('4%'), paddingBottom: wp('2%') },
  accountsList: { padding: wp('4%') },
  accountCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: wp('4%'), backgroundColor: COLORS.lightbackground, borderRadius: wp('3%'), marginBottom: wp('3%') },
  accountInfo: { flexDirection: 'row', alignItems: 'center' },
  accountIconContainer: { width: wp('12%'), height: wp('12%'), borderRadius: wp('6%'), backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: wp('3%') },
  accountDetails: { justifyContent: 'center' },
  accountType: { fontSize: wp('4.5%'), color: COLORS.text.primary, fontWeight: '500', marginBottom: hp('0.5%') },
  accountBalance: { fontSize: wp('4%'), fontWeight: '500' },
});


export default AccountsScreen;
// components/MoneyTracker.js

import ReceiptParser from "../utils/ReceiptParser";
import LottieView from "lottie-react-native";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import * as ImagePicker from "expo-image-picker";
import { formatCurrency, convertAmount } from "../utils/currencyService";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import ExpenseCalculator from "./ExpenseCalculator";
import TransactionRecord from "./TransactionRecord";
import { useNavigation } from "@react-navigation/native";
import { useGlobalContext } from "./globalProvider";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { useTranslation } from "react-i18next";

const MoneyTracker = () => {
  const { onSave, state, dispatch, convertAmount, loadExpensesFromDB } =
    useGlobalContext();
  const navigation = useNavigation();
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const { t, i18n } = useTranslation();

  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadExpensesFromDB();
  }, []);

  useEffect(() => {
    if (state.language && i18n.language !== state.language) {
      i18n.changeLanguage(state.language);
    } else {
      i18n.changeLanguage(state.language);
    }
  }, [state.language]);

  // Filter transactions for current month and search term
  const currentMonthTransactions = state.transactions.filter((transaction) => {
    const transactionDate = parseISO(transaction.date);
    const monthStart = startOfMonth(parseISO(state.currentMonth));
    const monthEnd = endOfMonth(parseISO(state.currentMonth));

    const isInCurrentMonth = isWithinInterval(transactionDate, {
      start: monthStart,
      end: monthEnd,
    });

    let matchesSearch = true;
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      const noteMatch =
        transaction.note &&
        transaction.note.toLowerCase().includes(searchLower);
      const categoryMatch =
        transaction.category &&
        transaction.category.toLowerCase().includes(searchLower);
      const accountMatch =
        transaction.account &&
        transaction.account.toLowerCase().includes(searchLower);
      matchesSearch = noteMatch || categoryMatch || accountMatch;
    }

    // Exclude 'TRANSFER' transactions
    return (
      isInCurrentMonth && matchesSearch && transaction.type !== "TRANSFER"
    );
  });

  // Calculate summary for current month with currency conversion
  const currentMonthSummary = currentMonthTransactions.reduce(
    (summary, transaction) => {
      const amount = parseFloat(transaction.amount);
      const convertedAmount = convertAmount(
        amount,
        transaction.currency || "USD",
        state.defaultCurrency
      );

      // Skip if convertedAmount is NaN
      if (isNaN(convertedAmount)) return summary;

      if (transaction.type === "EXPENSE") {
        summary.expense += convertedAmount;
      } else if (transaction.type === "INCOME") {
        summary.income += convertedAmount;
      }
      return summary;
    },
    { expense: 0, income: 0 }
  );

  currentMonthSummary.total =
    currentMonthSummary.income - currentMonthSummary.expense;

  const showImageSourceOptions = () => {
    Alert.alert(
      "Select Image Source",
      "Choose where you want to pick the image from",
      [
        {
          text: "Camera",
          onPress: () => pickImage("camera"),
        },
        {
          text: "Gallery",
          onPress: () => pickImage("gallery"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const pickImage = async (source) => {
    try {
      let permissionResult;
      let result;

      if (source === "camera") {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert(
            "Permission Error",
            "Permission to access camera is required!"
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.01,
          base64: true,
          aspect: [4, 3],
          maxWidth: 600,
          maxHeight: 450,
        });
      } else {
        permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert(
            "Permission Error",
            "Permission to access gallery is required!"
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.01,
          base64: true,
          aspect: [4, 3],
          maxWidth: 600,
          maxHeight: 450,
        });
      }

      if (!result.canceled) {
        await handleOCR(result.assets[0].base64);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to capture/select image");
    }
  };

  const handleOCR = async (base64Image) => {
    try {
      const parser = new ReceiptParser();
      const details = await parser.parseReceipt(base64Image);

      Alert.alert(
        "Receipt Processed",
        `Amount: ${formatCurrency(
          details.amount,
          state.defaultCurrency
        )}\nCategory: ${details.category}\nAccount: ${
          details.account
        }\n\n${details.notes}`,
        [
          {
            text: "Add Transaction",
            onPress: async () => {
              const formattedTransaction = {
                amount: parseFloat(details.amount),
                type: "EXPENSE",
                date: new Date().toISOString(),
                category: details.category,
                account: details.account,
                note: details.notes || "",
                currency: state.defaultCurrency, // Ensure currency is set correctly
              };

              try {
                await onSave(formattedTransaction);
                Alert.alert("Success", "Transaction added successfully!", [
                  { text: "OK" },
                ]);
              } catch (error) {
                console.error("Error saving transaction:", error);
                Alert.alert(
                  "Error",
                  "Failed to save transaction. Please try again."
                );
              }
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      console.error("Receipt Processing Error:", error);
      Alert.alert(
        "Error",
        "Failed to process receipt. Please try again or enter details manually."
      );
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowCalculator(true);
  };

  const handleSaveTransaction = async (transactionData) => {
    try {
      // Add currency to transaction data if not present
      const transactionWithCurrency = {
        ...transactionData,
        currency: transactionData.currency || state.defaultCurrency,
      };

      await onSave(transactionWithCurrency);
      if (editingTransaction) {
        dispatch({
          type: "EDIT_TRANSACTION",
          payload: { id: editingTransaction.id, ...transactionWithCurrency },
        });
        setEditingTransaction(null);
      } else {
        const newTransaction = {
          id: Date.now(),
          ...transactionWithCurrency,
        };
        dispatch({ type: "ADD_TRANSACTION", payload: newTransaction });
      }
      setShowCalculator(false);
    } catch (error) {
      console.error("Error saving transaction:", error);
      Alert.alert("Error", "Failed to save transaction. Please try again.");
    }
  };

  const handlePreviousMonth = () => {
    dispatch({ type: "PREVIOUS_MONTH" });
  };

  const handleNextMonth = () => {
    dispatch({ type: "NEXT_MONTH" });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={false}
        backgroundColor={COLORS.background}
        barStyle="light-content"
      />
      {/* Header */}
      <View style={styles.header}>
        {/* Left side: Menu button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu" size={wp("6%")} color={COLORS.text.primary} />
        </TouchableOpacity>

        {/* Center: Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Right side: Search icon or placeholder for consistent spacing */}
        {showSearchBar ? (
          <TouchableOpacity
            onPress={() => setShowSearchBar(false)}
            style={styles.searchButton}
          >
            <Ionicons
              name="close"
              size={wp("6%")}
              color={COLORS.text.primary}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setShowSearchBar(true)}
            style={styles.searchButton}
          >
            <Ionicons
              name="search"
              size={wp("6%")}
              color={COLORS.text.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Input */}
      {showSearchBar && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="white"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      )}

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={handlePreviousMonth}>
          <Ionicons
            name="chevron-back"
            size={wp("6%")}
            color={COLORS.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {format(parseISO(state.currentMonth), "MMMM, yyyy")}
        </Text>
        <TouchableOpacity onPress={handleNextMonth}>
          <Ionicons
            name="chevron-forward"
            size={wp("6%")}
            color={COLORS.text.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Summary Section with formatted currency */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t("Expenses")}</Text>
          <Text style={[styles.summaryAmount, { color: "#ff6b6b" }]}>
            {formatCurrency(
              currentMonthSummary.expense,
              state.defaultCurrency
            )}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t("Income")}</Text>
          <Text style={[styles.summaryAmount, { color: "#51cf66" }]}>
            {formatCurrency(
              currentMonthSummary.income,
              state.defaultCurrency
            )}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t("Total")}</Text>
          <Text
            style={[
              styles.summaryAmount,
              {
                color:
                  currentMonthSummary.total >= 0 ? "#51cf66" : "#ff6b6b",
              },
            ]}
          >
            {formatCurrency(
              currentMonthSummary.total,
              state.defaultCurrency
            )}
          </Text>
        </View>
      </View>

      {/* Transaction List */}
      <ScrollView style={styles.transactionList}>
        {currentMonthTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <LottieView
              source={require("../assets/animation/empty.json")}
              autoPlay
              loop
              style={styles.animation}
            />
          </View>
        ) : (
          currentMonthTransactions.map((transaction) => (
            <TransactionRecord
              key={transaction.id}
              transaction={{
                ...transaction,
                convertedAmount: convertAmount(
                  parseFloat(transaction.amount),
                  transaction.currency || "USD",
                  state.defaultCurrency
                ),
              }}
              onEdit={handleEdit}
              defaultCurrency={state.defaultCurrency}
            />
          ))
        )}
      </ScrollView>

      {/* Add Transaction Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowCalculator(true)}
        onLongPress={showImageSourceOptions}
      >
        <LottieView
          source={require("../assets/animation/camera_add.json")}
          autoPlay
          loop={false}
          style={styles.animationAdd}
        />
      </TouchableOpacity>

      <Modal
        visible={showCalculator}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCalculator(false);
          setEditingTransaction(null);
        }}
      >
        <ExpenseCalculator
          onClose={() => {
            setShowCalculator(false);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
          initialData={editingTransaction}
          defaultCurrency={state.defaultCurrency}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp("4%"),
    backgroundColor: COLORS.background,
  },
  menuButton: {
    width: wp("10%"),
    alignItems: "center",
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
  },
  logo: {
    width: wp("20%"),
    height: wp("8%"),
  },
  searchButton: {
    width: wp("10%"),
    alignItems: "center",
  },
  searchContainer: {
    padding: wp("4%"),
    backgroundColor: COLORS.lightbackground,
  },
  searchInput: {
    height: hp("6%"),
    borderColor: COLORS.text.secondary,
    borderWidth: 1,
    color: COLORS.text.primary,
    borderRadius: 5,
    paddingHorizontal: wp("2%"),
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: wp("4%"),
    backgroundColor: COLORS.lightbackground,
  },
  monthText: {
    fontSize: wp("4.5%"),
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
    color: COLORS.text.primary,
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: wp("4%"),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightbackground,
    backgroundColor: COLORS.background,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: {
    fontSize: wp("3%"),
    color: COLORS.text.secondary,
    marginBottom: hp("0.5%"),
  },
  summaryAmount: { fontSize: wp("4%"), fontWeight: "500" },
  transactionList: { flex: 1, backgroundColor: COLORS.background },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp("8%"),
    backgroundColor: COLORS.background,
    minHeight: hp("50%"),
  },
  animation: {
    width: wp(50),
    height: wp(50),
  },
  addButton: {
    position: "absolute",
    right: wp("7%"),
    bottom: hp("8%"),
    width: wp("14%"),
    height: wp("14%"),
    borderRadius: wp("7%"),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  animationAdd: {
    width: wp("14%"),
    height: wp("14%"),
  },
});

export default MoneyTracker;

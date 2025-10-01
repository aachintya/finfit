import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { COLORS } from "../../../constants/theme";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import Header from "../../../components/commonheader";
import { useGlobalContext } from "../../../components/globalProvider";
import { useTranslation } from "react-i18next";
import {
  useBudgetNotifications,
  BudgetNotificationListener,
} from "../../../components/Budgetnotification";

const BudgetsScreen = () => {
  const { state, updateBudget, fetchSpentByCategory, convertAmount } = useGlobalContext();
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [newLimit, setNewLimit] = useState("");
  const [budgets, setBudgets] = useState([]);
  const [spentByCategory, setSpentByCategory] = useState({});

  const {
    checkBudgetThresholds,
    sendBudgetNotification,
    requestNotificationPermissions,
  } = useBudgetNotifications();

  // Get the default currency and symbol
  const defaultCurrency = state.defaultCurrency || 'USD';
  const currencySymbol = state.currencies[defaultCurrency]?.symbol || defaultCurrency;

  // Initialize budgets for all categories
  useEffect(() => {
    const initializeBudgets = async () => {
      try {
        const allCategories = [
          ...state.categories.EXPENSE,
          ...state.categories.TRANSFER,
        ];

        let currentBudgets = state.budgets || [];

        // Create default budgets for categories that don't have one
        const newBudgets = allCategories.map((category) => {
          const existingBudget = currentBudgets.find(
            (b) => b.category === category
          );
          if (existingBudget) {
            return existingBudget;
          }
          return {
            id: Date.now().toString() + category,
            category: category,
            title: category,
            limit: 0,
            icon: getCategoryIcon(category),
            type: state.categories.EXPENSE.includes(category)
              ? "EXPENSE"
              : "TRANSFER",
          };
        });

        setBudgets(newBudgets);
        if (!state.budgets || state.budgets.length === 0) {
          updateBudget(newBudgets);
        }
      } catch (error) {
        console.error("Error initializing budgets:", error);
      }
    };

    initializeBudgets();
  }, [state.categories]);

  useEffect(() => {
    if (state.language && i18n.language !== state.language) {
      i18n.changeLanguage(state.language);
    }
  }, [state.language]);

  useEffect(() => {
    if (state.budgets) {
      setBudgets(state.budgets);
    }
  }, [state.budgets]);

  useEffect(() => {
    checkBudgetThresholds(budgets, spentByCategory);
  }, [budgets, spentByCategory, checkBudgetThresholds]);

  useEffect(() => {
    const requestPermissionsAndCheckBudgets = async () => {
      const permissionsGranted = await requestNotificationPermissions();
      console.log("Notification permissions granted:", permissionsGranted);
      if (permissionsGranted) {
        checkBudgetThresholds(budgets);
      }
    };

    requestPermissionsAndCheckBudgets();
  }, [budgets, checkBudgetThresholds]);

  useEffect(() => {
    const fetchSpentData = async () => {
      try {
        const spentData = await fetchSpentByCategory();
        const spentMap = spentData.reduce((acc, { category, totalSpent, currency }) => {
          const convertedSpent = convertAmount(totalSpent, currency, defaultCurrency);
          acc[category] = (acc[category] || 0) + convertedSpent;
          return acc;
        }, {});
        setSpentByCategory(spentMap);
      } catch (error) {
        console.error("Error fetching spent by category:", error);
      }
    };

    fetchSpentData();
  }, [fetchSpentByCategory, convertAmount, defaultCurrency]);

  const getCategoryIcon = (category) => {
    const iconMap = {
      "Food & Dining": "utensils",
      Transportation: "car",
      Shopping: "shopping-bag",
      Entertainment: "film",
      "Bills & Utilities": "file-invoice-dollar",
      "Health & Fitness": "heartbeat",
      Travel: "plane",
      "Account Transfer": "exchange-alt",
      "Investment Transfer": "chart-line",
      "Debt Payment": "credit-card",
      Other: "dot-circle",
    };

    return iconMap[category] || "dot-circle";
  };

  // Total budget and spent calculations with proper currency handling
  const totalBudget = budgets.reduce(
    (total, budget) => total + budget.limit,
    0
  );

  const totalSpent = Object.values(spentByCategory).reduce(
    (total, spent) => total + spent,
    0
  );

  const totalRemaining = totalBudget - totalSpent;
  const spentPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleNotificationReceived = (notification) => {
    const { percentage, category, title } = notification.request.content.data;
    console.log(
      `Received notification: ${title} in category ${category} at ${percentage}%`
    );
  };

  const openEditModal = (budget) => {
    setSelectedBudget(budget);
    setNewLimit(budget.limit.toString());
    setModalVisible(true);
  };

  const saveBudgetChange = () => {
    if (selectedBudget && newLimit) {
      const updatedBudget = {
        ...selectedBudget,
        limit: parseFloat(newLimit),
      };

      const updatedBudgets = budgets.map((budget) =>
        budget.id === selectedBudget.id ? updatedBudget : budget
      );
      setBudgets(updatedBudgets);
      updateBudget(updatedBudgets);
      sendBudgetNotification(updatedBudget);

      setModalVisible(false);
      setSelectedBudget(null);
      setNewLimit("");
    }
  };

  const handleLimitChange = (text) => {
    const numericValue = text.replace(/[^0-9.]/g, "");
    setNewLimit(numericValue);
  };

  const getBudgetStatus = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 90) return { color: "#ff6b6b", message: "Critical" };
    if (percentage >= 75) return { color: "#ffd43b", message: "Warning" };
    return { color: "#51cf66", message: "On Track" };
  };

  const renderProgressBar = (spent, limit) => {
    const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const status = getBudgetStatus(spent, limit);

    return (
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${percentage}%`, backgroundColor: status.color },
          ]}
        />
      </View>
    );
  };

  const renderBudgetCard = (budget) => {
    const spent = spentByCategory[budget.category] || 0;
    const status = getBudgetStatus(spent, budget.limit);
    const percentageUsed = budget.limit > 0 ? ((spent / budget.limit) * 100).toFixed(0) : 0;

    return (
      <TouchableOpacity key={budget.id} style={styles.budgetCard}>
        <View style={styles.budgetInfo}>
          <View
            style={[styles.budgetIconContainer, { borderColor: status.color }]}
          >
            <FontAwesome5
              name={budget.icon}
              size={wp("6%")}
              color={COLORS.text.primary}
            />
          </View>

          <View style={styles.budgetDetails}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.budgetType}>{budget.title}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(budget)}
              >
                <Ionicons
                  name="pencil-outline"
                  size={wp("5%")}
                  color={COLORS.text.primary}
                />
                <Text style={styles.editButtonText}>Edit </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.budgetProgressInfo}>
              <Text style={styles.budgetProgress}>
                {currencySymbol}
                {spent.toFixed(2).toLocaleString()} / {currencySymbol}
                {budget.limit.toLocaleString()}
              </Text>
              <Text style={[styles.budgetStatus, { color: status.color }]}>
                {status.message}
              </Text>
            </View>
            {renderProgressBar(spent, budget.limit)}
            <Text style={styles.percentageText}>
              {percentageUsed}% {t("used")}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <BudgetNotificationListener
        onNotificationReceived={handleNotificationReceived}
      />
      <Header seachIconShown={false} />
      <ScrollView style={styles.content}>
        <View style={styles.overviewContainer}>
          <View style={styles.overviewHeader}>
            <View style={styles.overviewTitleContainer}>
              <Text style={styles.overviewLabel}>
                {t("Monthly Budget Overview")}
              </Text>
            </View>
            <Text style={styles.totalBalanceAmount}>
              {currencySymbol}
              {totalBudget.toLocaleString()}
            </Text>
          </View>

          <View style={styles.overviewProgress}>
            {renderProgressBar(totalSpent, totalBudget)}
            <Text style={styles.overviewProgressText}>
              {spentPercentage.toFixed(0)}% {t("ofTotalBudgetUsed")}
            </Text>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t("spent")}</Text>
              <Text style={[styles.summaryAmount, { color: "#ff6b6b" }]}>
                {currencySymbol}
                {totalSpent.toFixed(2).toLocaleString()}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t("remaining")}</Text>
              <Text style={[styles.summaryAmount, { color: "#51cf66" }]}>
                {currencySymbol}
                {totalRemaining.toFixed(2).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t("Expenses")}</Text>
        <View style={styles.budgetsList}>
          {state.categories && state.categories.EXPENSE ? (
            state.categories.EXPENSE.map((category) => {
              const budget = budgets.find((b) => b.category === category) || {
                id: Date.now().toString() + category,
                category: category,
                title: category,
                limit: 0,
                icon: getCategoryIcon(category),
              };
              return renderBudgetCard(budget);
            })
          ) : (
            <Text>{t("No expense categories available")}</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t("Transfers")}</Text>
        <View style={styles.budgetsList}>
          {state.categories && state.categories.TRANSFER ? (
            state.categories.TRANSFER.map((category) => {
              const budget = budgets.find((b) => b.category === category) || {
                id: Date.now().toString() + category,
                category: category,
                title: category,
                limit: 0,
                icon: getCategoryIcon(category),
              };
              return renderBudgetCard(budget);
            })
          ) : (
            <Text>{t("No transfer categories available")}</Text>
          )}
        </View>
        
        {/* Modal for editing budget limit */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Budget Limit</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons
                    name="close"
                    size={wp("6%")}
                    color={COLORS.text.primary}
                  />
                </TouchableOpacity>
              </View>

              {selectedBudget && (
                <>
                  <View style={styles.modalBudgetInfo}>
                    <View
                      style={[
                        styles.modalIconContainer,
                        {
                          borderColor: getBudgetStatus(
                            spentByCategory[selectedBudget.category] || 0,
                            selectedBudget.limit
                          ).color,
                        },
                      ]}
                    >
                      <FontAwesome5
                        name={selectedBudget.icon}
                        size={wp("6%")}
                        color={COLORS.text.primary}
                      />
                    </View>
                    <Text style={styles.modalBudgetTitle}>
                      {selectedBudget.title}
                    </Text>
                  </View>

                  <View style={styles.modalInputContainer}>
                    <Text style={styles.modalInputLabel}>Budget Limit</Text>
                    <View style={styles.modalInputWrapper}>
                      <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                      <TextInput
                        style={styles.modalInput}
                        keyboardType="numeric"
                        value={newLimit}
                        onChangeText={handleLimitChange}
                        placeholderTextColor={COLORS.text.secondary}
                        selectionColor={COLORS.primary}
                      />
                    </View>
                  </View>

                  <View style={styles.modalCurrentInfo}>
                    <Text style={styles.modalInfoText}>Current Spent</Text>
                    <Text style={styles.modalInfoValue}>
                      {currencySymbol}
                      {(
                        spentByCategory[selectedBudget.category] || 0
                      ).toFixed(2).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalCancelButton]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.modalCancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalSaveButton]}
                      onPress={saveBudgetChange}
                    >
                      <Text style={styles.modalSaveButtonText}>
                        Save Changes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  totalBalance: {
    alignItems: "center",
    padding: wp("4%"),
    backgroundColor: COLORS.background,
  },
  totalBalanceLabel: {
    fontSize: wp("4%"),
    color: COLORS.text.primary,
    marginBottom: hp("1%"),
  },
  totalBalanceAmount: {
    fontSize: wp("7%"),
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: hp("2%"),
  },
  overallProgress: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: wp("4%"),
  },
  overallProgressText: {
    fontSize: wp("3.5%"),
    color: COLORS.text.secondary,
    marginTop: hp("1%"),
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: wp("4%"),
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightbackground,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: wp("3%"),
    color: COLORS.text.secondary,
    marginBottom: hp("0.5%"),
  },
  summaryAmount: {
    fontSize: wp("4%"),
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: wp("5%"),
    fontWeight: "500",
    color: COLORS.text.primary,
    padding: wp("4%"),
    paddingBottom: wp("2%"),
  },
  budgetsList: {
    paddingHorizontal: wp("4%"),
  },
  budgetCard: {
    padding: wp("4%"),
    backgroundColor: COLORS.lightbackground,
    borderRadius: wp("3%"),
    marginBottom: wp("3%"),
  },
  budgetInfo: {
    flexDirection: "row",
  },
  budgetIconContainer: {
    width: wp("12%"),
    height: wp("12%"),
    borderRadius: wp("6%"),
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp("3%"),
    borderWidth: 2,
  },
  budgetDetails: {
    flex: 1,
    justifyContent: "center",
  },
  budgetType: {
    fontSize: wp("4.5%"),
    color: COLORS.text.primary,
    fontWeight: "500",
    marginBottom: hp("0.5%"),
  },
  budgetProgressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp("1%"),
  },
  budgetProgress: {
    fontSize: wp("4%"),
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  budgetStatus: {
    fontSize: wp("3.5%"),
    fontWeight: "500",
  },
  progressBarContainer: {
    height: hp("1%"),
    backgroundColor: COLORS.background,
    borderRadius: wp("1%"),
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: wp("1%"),
  },
  percentageText: {
    fontSize: wp("3.5%"),
    color: COLORS.text.secondary,
    marginTop: hp("0.5%"),
  },
  addBudgetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: wp("4%"),
    backgroundColor: COLORS.lightbackground,
    borderRadius: wp("3%"),
    margin: wp("4%"),
  },
  addBudgetText: {
    color: COLORS.text.primary,
    fontSize: wp("4%"),
    fontWeight: "500",
    marginLeft: wp("2%"),
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: wp("5%"),
    borderTopRightRadius: wp("5%"),
    padding: wp("5%"),
    paddingBottom: Platform.OS === "ios" ? hp("8%") : hp("4%"),
  },
  modalTitle: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    marginBottom: hp("2%"),
    color: COLORS.text.primary,
  },
  modalLabel: {
    fontSize: wp("4%"),
    marginBottom: hp("1%"),
    color: COLORS.text.primary,
  },
  modalInput: {
    flex: 1,
    fontSize: wp("5%"),
    color: COLORS.text.primary,
    padding: 0,
  },
  modalButtons: {
    flexDirection: "row",
    gap: wp("8%"),
    justifyContent: "center",
    marginTop: hp("2%"),
  },
  modalButton: {
    padding: wp("2%"),
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  modalButtonText: {
    color: COLORS.text.secondary,
    fontSize: wp("4%"),
  },
  editButton: {
    marginTop: hp("1%"),
    flexDirection: "row",
    alignItems: "center",
    padding: wp("1%"),
    paddingBottom: hp("1%"),
  },
  editButtonText: {
    marginLeft: wp("1%"),
    color: COLORS.text.primary,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp("3%"),
  },
  modalCloseButton: {
    padding: wp("2%"),
  },
  modalBudgetInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp("3%"),
  },
  modalIconContainer: {
    width: wp("12%"),
    height: wp("12%"),
    borderRadius: wp("6%"),
    backgroundColor: COLORS.lightbackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp("3%"),
    borderWidth: 2,
  },
  modalBudgetTitle: {
    fontSize: wp("4.5%"),
    fontWeight: "500",
    color: COLORS.text.primary,
  },
  modalInputContainer: {
    marginBottom: hp("3%"),
  },
  modalInputLabel: {
    fontSize: wp("3.5%"),
    color: COLORS.text.secondary,
    marginBottom: hp("1%"),
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightbackground,
    borderRadius: wp("3%"),
    paddingHorizontal: wp("4%"),
    height: hp("7%"),
  },
  currencySymbol: {
    fontSize: wp("5%"),
    color: COLORS.text.primary,
    marginRight: wp("2%"),
  },
  modalCurrentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.lightbackground,
    padding: wp("4%"),
    borderRadius: wp("3%"),
    marginBottom: hp("3%"),
  },
  modalInfoText: {
    fontSize: wp("3.5%"),
    color: COLORS.text.secondary,
  },
  modalInfoValue: {
    fontSize: wp("4%"),
    fontWeight: "500",
    color: COLORS.text.primary,
  },
  modalCancelButton: {
    backgroundColor: COLORS.lightbackground,
    paddingVertical: hp("2%"),
    paddingHorizontal: wp("5%"),
    borderRadius: wp("6%"),
  },
  modalSaveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: hp("2%"),
    paddingHorizontal: wp("5%"),
    borderRadius: wp("6%"),
  },
  modalCancelButtonText: {
    color: COLORS.text.primary,
    fontSize: wp("4%"),
    fontWeight: "500",
  },
  modalSaveButtonText: {
    color: "#FFFFFF",
    fontSize: wp("4%"),
    fontWeight: "500",
  },
  overviewContainer: {
    backgroundColor: COLORS.lightbackground,
    margin: wp("4%"),
    borderRadius: wp("4%"),
    padding: wp("4%"),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overviewHeader: {
    marginBottom: hp("2%"),
  },
  overviewTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp("1%"),
  },
  overviewLabel: {
    fontSize: wp("3.5%"),
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  infoButton: {
    padding: wp("1%"),
  },
  overviewProgress: {
    marginBottom: hp("2%"),
  },
  overviewProgressText: {
    fontSize: wp("3.5%"),
    color: COLORS.text.secondary,
    marginTop: hp("1%"),
    textAlign: "center",
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: hp("2%"),
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: hp("4%"),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  summaryLabel: {
    fontSize: wp("3.5%"),
    color: COLORS.text.secondary,
    marginBottom: hp("0.5%"),
  },
  summaryAmount: {
    fontSize: wp("4.5%"),
    fontWeight: "600",
  },
  // New Add Budget Button Styles
  addBudgetButton: {
    margin: wp("4%"),
    marginTop: 0,
    backgroundColor: COLORS.lightbackground,
    borderRadius: wp("4%"),
    overflow: "hidden",
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp("4%"),
  },
  addIconContainer: {
    width: wp("12%"),
    height: wp("12%"),
    borderRadius: wp("6%"),
    backgroundColor: "rgba(66, 153, 225, 0.1)", // Using primary color with opacity
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp("3%"),
  },
  addButtonTextContainer: {
    flex: 1,
  },
  addBudgetTitle: {
    fontSize: wp("4%"),
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: hp("0.5%"),
  },
  addBudgetSubtext: {
    fontSize: wp("3.5%"),
    color: COLORS.text.secondary,
  },
});

export default BudgetsScreen;
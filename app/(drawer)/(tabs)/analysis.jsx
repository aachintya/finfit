import React, { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { COLORS } from "../../../constants/theme";
import ChatInterface from "../../../components/ChatInterface";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import Header from "../../../components/commonheader";
import { useGlobalContext } from "../../../components/globalProvider";
import ChatGuidePointer from "../../../components/ChatGuidePointet";
import LottieView from "lottie-react-native";

const TIMEFRAMES = ["month", "quarter", "year"];

const Analysis = () => {
  // Get necessary data and functions from the global context
  const { state, convertAmount } = useGlobalContext();
  const { summary, transactions, budgets, defaultCurrency, currencies } = state;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("month");
  const screenWidth = Dimensions.get("window").width;
  const [showSpotlight, setShowSpotlight] = useState(true);

  // Get the symbol of the default currency
  const currencySymbol = currencies[defaultCurrency]?.symbol || defaultCurrency;

  // Enhanced data processing with currency conversion
  const processedData = useMemo(() => {
    const today = new Date();
    const periods = {
      month: 6,
      quarter: 4,
      year: 5,
    };

    const getPeriodLabel = (date, timeframe) => {
      switch (timeframe) {
        case "month":
          return date.toLocaleString("default", { month: "short" });
        case "quarter":
          return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
        case "year":
          return date.getFullYear().toString();
        default:
          return "";
      }
    };

    const periodCount = periods[selectedTimeframe];
    const periodData = [];
    const categoryData = {};
    let totalSpent = 0;
    let totalBudget = 0;

    // Initialize period data
    for (let i = periodCount - 1; i >= 0; i--) {
      let periodStartDate, periodEndDate;
      if (selectedTimeframe === "month") {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        periodStartDate = new Date(date);
        periodEndDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      } else if (selectedTimeframe === "quarter") {
        const monthsBack = i * 3;
        const date = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
        const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
        periodStartDate = new Date(date.getFullYear(), quarterStartMonth, 1);
        periodEndDate = new Date(date.getFullYear(), quarterStartMonth + 3, 0);
      } else if (selectedTimeframe === "year") {
        const year = today.getFullYear() - i;
        periodStartDate = new Date(year, 0, 1);
        periodEndDate = new Date(year, 11, 31);
      }

      periodData.push({
        label: getPeriodLabel(periodStartDate, selectedTimeframe),
        startDate: periodStartDate,
        endDate: periodEndDate,
        expenses: 0,
        income: 0,
        savings: 0,
      });
    }

    // Process transactions with currency conversion
    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      const convertedAmount = convertAmount(
        transaction.amount,
        transaction.currency,
        defaultCurrency
      );
      for (let i = 0; i < periodData.length; i++) {
        const period = periodData[i];
        if (
          transactionDate >= period.startDate &&
          transactionDate <= period.endDate
        ) {
          if (transaction.type === "EXPENSE") {
            period.expenses += convertedAmount;
            totalSpent += convertedAmount;

            // Category aggregation
            if (!categoryData[transaction.category]) {
              categoryData[transaction.category] = {
                amount: 0,
                budget:
                  budgets.find(
                    (b) =>
                      b.title.toLowerCase() ===
                      transaction.category.toLowerCase()
                  )?.limit || 0,
              };
            }
            categoryData[transaction.category].amount += convertedAmount;
          } else if (transaction.type === "INCOME") {
            period.income += convertedAmount;
          }
          break;
        }
      }
    });

    // Calculate savings rate and budget utilization
    periodData.forEach((period) => {
      period.savings =
        period.income !== 0
          ? ((period.income - period.expenses) / period.income) * 100
          : 0;
    });

    // Process budgets (assumed to be in default currency)
    budgets.forEach((budget) => {
      totalBudget += budget.limit;
    });

    const budgetUtilization = totalBudget !== 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      periodData,
      categoryData,
      totalSpent,
      totalBudget,
      budgetUtilization,
    };
  }, [transactions, selectedTimeframe, budgets, defaultCurrency, convertAmount]);

  // Prepare chart data
  const spendingTrendData = {
    labels: processedData.periodData.map((d) => d.label),
    datasets: [
      {
        data: processedData.periodData.map((d) => d.expenses),
        color: () => COLORS.secondary,
        strokeWidth: 2,
      },
      {
        data: processedData.periodData.map((d) => d.income),
        color: () => COLORS.accent,
        strokeWidth: 2,
      },
    ],
    legend: ["Expenses", "Income"],
  };

  // Consistent color assignment for categories
  const categoryNames = Object.keys(processedData.categoryData);
  const colors = COLORS.chartColors;

  const categoryChartData = categoryNames.map((category, index) => {
    const data = processedData.categoryData[category];
    return {
      name:
        category.length > 10 ? category.substring(0, 8) + "..." : category,
      amount: data.amount,
      color: colors[index % colors.length],
      legendFontColor: COLORS.text.primary,
      legendFontSize: wp("3%"),
      percentageUsed:
        data.budget !== 0 ? (data.amount / data.budget) * 100 : 0,
    };
  });

  // Category legend component
  const CategoryLegend = ({ data }) => (
    <View style={styles.legendContainer}>
      {data.map((item) => (
        <View key={item.name} style={styles.legendItem}>
          <View
            style={[styles.legendColor, { backgroundColor: item.color }]}
          />
          <Text style={styles.legendText}>
            {item.name} (
            {((item.amount / processedData.totalSpent) * 100).toFixed(1)}%)
          </Text>
        </View>
      ))}
    </View>
  );

  // Timeframe selector component
  const TimeframeSelector = () => (
    <View style={styles.timeframeContainer}>
      {TIMEFRAMES.map((timeframe) => (
        <TouchableOpacity
          key={timeframe}
          style={[
            styles.timeframeButton,
            selectedTimeframe === timeframe && styles.timeframeButtonActive,
          ]}
          onPress={() => setSelectedTimeframe(timeframe)}
        >
          <Text
            style={[
              styles.timeframeText,
              selectedTimeframe === timeframe && styles.timeframeTextActive,
            ]}
          >
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <Header seachIconShown={false} />

      <ScrollView style={styles.content}>
        <TimeframeSelector />

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>
              {currencySymbol}
              {processedData.totalSpent.toFixed(2).toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Budget Utilized</Text>
            <Text style={styles.summaryValue}>
              {processedData.budgetUtilization.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Spending Trend Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Income vs Expenses Trend</Text>
          <LineChart
            data={spendingTrendData}
            width={screenWidth - wp("12%")}
            height={220}
            yAxisLabel={currencySymbol}
            chartConfig={{
              backgroundColor: COLORS.primary,
              backgroundGradientFrom: COLORS.primary,
              backgroundGradientTo: COLORS.primary,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: COLORS.primary,
              },
              propsForLabels: {
                fontSize: wp("3%"),
              },
              spacing: wp("2%"),
              formatYLabel: (value) =>
                parseFloat(value)
                  .toFixed(2)
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
            }}
            bezier
            style={[
              styles.chart,
              {
                marginVertical: hp("1%"),
                paddingRight: wp("4%"),
              },
            ]}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            segments={5}
          />
        </View>

        {/* Category Analysis */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <View style={styles.pieChartContainer}>
            <PieChart
              data={categoryChartData}
              width={screenWidth - wp("40%")}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft={0}
              absolute
              hasLegend={false}
              center={[50, 0]}
            />
            <CategoryLegend data={categoryChartData} />
          </View>
        </View>

        {/* Category Budget Progress */}
        <View style={styles.categoryProgressContainer}>
          <Text style={styles.chartTitle}>Budget Progress</Text>
          {categoryChartData.map((category) => (
            <View key={category.name} style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.percentageUsed}>
                  {category.percentageUsed.toFixed(1)}% used
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(category.percentageUsed, 100)}%`,
                      backgroundColor:
                        category.percentageUsed > 100
                          ? COLORS.danger
                          : COLORS.secondary,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* AI Chat Button */}
      {showSpotlight && (
        <ChatGuidePointer onDismiss={() => setShowSpotlight(false)} />
      )}

      <TouchableOpacity
        style={[
          styles.chatButton,
          showSpotlight && styles.chatButtonSpotlight,
        ]}
        onPress={() => setIsChatOpen(true)}
      >
        <LottieView
          source={require("../../../assets/animation/ai.json")}
          loop
          style={{ width: wp("16%"), height: wp("16%") }}
          autoPlay
        />
      </TouchableOpacity>

      {isChatOpen && (
        <View style={StyleSheet.absoluteFill}>
          <ChatInterface
            summary={summary}
            transactions={transactions}
            onClose={() => setIsChatOpen(false)}
          />
        </View>
      )}
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
    padding: wp("4%"),
  },
  timeframeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp("2%"),
    backgroundColor: COLORS.lightbackground,
    borderRadius: wp("4%"),
    padding: wp("1%"),
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: hp("1%"),
    alignItems: "center",
    borderRadius: wp("3%"),
  },
  timeframeButtonActive: {
    backgroundColor: COLORS.secondary,
  },
  timeframeText: {
    color: COLORS.text.secondary,
    fontSize: wp("3.5%"),
    fontWeight: "500",
  },
  timeframeTextActive: {
    color: COLORS.background,
    fontWeight: "bold",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp("2%"),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: wp("4%"),
    padding: wp("4%"),
    marginHorizontal: wp("1%"),
  },
  summaryLabel: {
    color: COLORS.text.secondary,
    fontSize: wp("3.5%"),
    marginBottom: hp("0.5%"),
  },
  summaryValue: {
    color: COLORS.text.primary,
    fontSize: wp("4.5%"),
    fontWeight: "bold",
  },
  chartContainer: {
    marginBottom: hp("3%"),
    backgroundColor: COLORS.primary,
    borderRadius: wp("4%"),
    padding: wp("4%"),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pieChartContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: hp("2%"),
  },
  chartTitle: {
    fontSize: wp("4%"),
    color: COLORS.text.primary,
    fontWeight: "bold",
    marginBottom: hp("1%"),
  },
  chart: {
    marginVertical: hp("1%"),
    borderRadius: wp("4%"),
    paddingTop: hp("1%"),
  },
  categoryProgressContainer: {
    marginBottom: hp("3%"),
  },
  progressCard: {
    marginBottom: hp("2%"),
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp("1%"),
  },
  categoryName: {
    fontSize: wp("3.5%"),
    color: COLORS.text.primary,
    fontWeight: "500",
  },
  percentageUsed: {
    fontSize: wp("3%"),
    color: COLORS.text.secondary,
  },
  progressBar: {
    height: hp("1.5%"),
    backgroundColor: COLORS.lightbackground,
    borderRadius: wp("2%"),
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: wp("2%"),
  },
  chatButton: {
    position: "absolute",
    bottom: hp("3%"),
    right: wp("4%"),
    width: wp("12%"),
    height: wp("12%"),
    borderRadius: wp("6%"),
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chatButtonSpotlight: {
    elevation: 25,
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  legendContainer: {
    flex: 1,
    marginLeft: wp("4%"),
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp("0.5%"),
  },
  legendColor: {
    width: wp("3%"),
    height: wp("3%"),
    borderRadius: wp("1.5%"),
    marginRight: wp("2%"),
  },
  legendText: {
    color: COLORS.text.primary,
    fontSize: wp("3%"),
    flex: 1,
  },
});

export default Analysis;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { firebaseService, PersonalExpense } from '../services/firebaseService';
import { typography } from '../utils/typography';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

interface PersonalExpensesScreenProps {
  navigation: any;
}

export const PersonalExpensesScreen: React.FC<PersonalExpensesScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Responsive setup
  const { width: screenWidth } = useWindowDimensions();
  const baseWidth = 375;
  const scale = (size: number) => (screenWidth / baseWidth) * size;

  const scaledFontSize = {
    lg: scale(typography.fontSize.lg),
    xl: scale(typography.fontSize.xl),
    '2xl': scale(typography.fontSize['2xl']),
    header: scale(typography.text.header.fontSize),
    headerLarge: scale(typography.text.headerLarge.fontSize),
    title: scale(typography.text.title.fontSize),
    subtitle: scale(typography.text.subtitle.fontSize),
    body: scale(typography.text.body.fontSize),
    caption: scale(typography.text.caption.fontSize),
  };

  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const loadExpenses = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const personalExpenses = await firebaseService.getPersonalExpenses(user.id);
      setExpenses(personalExpenses);

      // Calculate total
      const total = personalExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      setTotalAmount(total);
    } catch (error) {
      Alert.alert('Error', 'Failed to load personal expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      loadExpenses();
    }, [user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deletePersonalExpense(expenseId);
              await loadExpenses();
              Alert.alert('Success', 'Expense deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const styles = createStyles(colors, scale, scaledFontSize);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={scaledFontSize.xl} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Expenses</Text>
          <View style={{ width: scaledFontSize.xl }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryButton} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scaledFontSize.xl} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Expenses</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddPersonalExpense', {
            onReturn: () => loadExpenses()
          })}
        >
          <Ionicons name="add" size={scaledFontSize.xl} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Personal Expenses</Text>
        <Text style={styles.summaryAmount}>₹{totalAmount.toFixed(2)}</Text>
        <Text style={styles.summaryCount}>{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: scale(100) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {expenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={scaledFontSize.headerLarge * 2} color={colors.secondaryText} />
            <Text style={styles.emptyText}>No personal expenses yet</Text>
            <Text style={styles.emptySubtext}>Add your first personal expense to start tracking!</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddPersonalExpense', {
                onReturn: () => loadExpenses()
              })}
            >
              <Text style={styles.addButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        ) : (
          expenses.map((expense) => (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={styles.expenseHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: expense.category.color }]}>
                  <Text style={styles.categoryEmoji}>{expense.category.emoji}</Text>
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  <Text style={styles.expenseCategory}>{expense.category.name}</Text>
                  <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                </View>
                <View style={styles.expenseActions}>
                  <Text style={styles.expenseAmount}>₹{expense.amount.toFixed(2)}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteExpense(expense.id!)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={scaledFontSize.lg} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              {expense.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{expense.notes}</Text>
                </View>
              )}
              {expense.receiptBase64 && (
                <View style={styles.receiptIndicator}>
                  <Ionicons name="receipt" size={scaledFontSize.caption} color={colors.primaryButton} />
                  <Text style={styles.receiptText}>Receipt attached</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('AddPersonalExpense', {
          onReturn: () => loadExpenses()
        })}
      >
        <Ionicons name="add" size={scaledFontSize.headerLarge} color={colors.primaryButtonText} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  scale: (size: number) => number,
  fonts: { [key: string]: number }
) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    backgroundColor: colors.cardBackground,
  },
  headerTitle: {
    fontSize: fonts.header,
    fontWeight: "600",
    color: colors.primaryText,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: colors.primaryButton,
    margin: scale(16),
    padding: scale(20),
    borderRadius: scale(12),
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fonts.caption,
    color: colors.primaryButtonText,
    opacity: 0.9,
  },
  summaryAmount: {
    fontSize: fonts.headerLarge,
    fontWeight: '700',
    color: colors.primaryButtonText,
    marginTop: scale(8),
  },
  summaryCount: {
    fontSize: fonts.caption,
    color: colors.primaryButtonText,
    opacity: 0.8,
    marginTop: scale(4),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(60),
    paddingHorizontal: scale(40),
  },
  emptyText: {
    fontSize: fonts.title,
    color: colors.primaryText,
    marginTop: scale(16),
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fonts.body,
    color: colors.secondaryText,
    marginTop: scale(8),
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: colors.primaryButton,
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(8),
    marginTop: scale(20),
  },
  addButtonText: {
    color: colors.primaryButtonText,
    fontSize: fonts.body,
    fontWeight: '600',
  },
  expenseCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: scale(16),
    marginVertical: scale(8),
    padding: scale(16),
    borderRadius: scale(12),
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryBadge: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  categoryEmoji: {
    fontSize: fonts['2xl'],
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: fonts.title,
    color: colors.primaryText,
    fontWeight: '600',
  },
  expenseCategory: {
    fontSize: fonts.caption,
    color: colors.secondaryText,
    marginTop: scale(4),
  },
  expenseDate: {
    fontSize: fonts.caption,
    color: colors.secondaryText,
    marginTop: scale(2),
  },
  expenseActions: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: fonts.subtitle,
    color: colors.primaryText,
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: scale(8),
    padding: scale(4),
  },
  notesContainer: {
    marginTop: scale(12),
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  notesLabel: {
    fontSize: fonts.caption,
    color: colors.secondaryText,
    fontWeight: '600',
  },
  notesText: {
    fontSize: fonts.body,
    color: colors.primaryText,
    marginTop: scale(4),
  },
  receiptIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(8),
    gap: scale(4),
  },
  receiptText: {
    fontSize: fonts.caption,
    color: colors.primaryButton,
  },
  floatingButton: {
    position: 'absolute',
    right: scale(24),
    bottom: scale(24),
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: colors.primaryButton,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.25,
    shadowRadius: scale(4),
    elevation: 5,
  },
});

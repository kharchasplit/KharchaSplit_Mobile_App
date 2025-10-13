import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebaseService, Group, GroupMember, GroupExpense } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { typography } from '../utils/typography';

type Props = {
  route: { params: { group: Group } };
  navigation: any;
};

interface Balance {
  userId: string;
  name: string;
  totalOwed: number;
  totalOwes: number;
  netBalance: number;
  details: Array<{
    toUserId: string;
    toUserName: string;
    amount: number;
  }>;
}

interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  firebaseSettlement?: {
    id: string;
    status: 'unpaid' | 'pending' | 'paid';
    createdAt: string;
    paidAt?: string;
  };
}

export const GroupDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { group: initialGroup } = route.params || {};
  
  
  // Responsive setup
  const { width: screenWidth } = useWindowDimensions();
  const baseWidth = 375;
  const scale = (size: number) => (screenWidth / baseWidth) * size;
  
  const scaledFontSize = {
    xs: scale(typography.fontSize.xs),
    sm: scale(typography.fontSize.sm),
    base: scale(typography.fontSize.base),
    lg: scale(typography.fontSize.lg),
    xl: scale(typography.fontSize.xl),
    '2xl': scale(typography.fontSize['2xl']),
    header: scale(typography.text.header.fontSize),
    body: scale(typography.text.body.fontSize),
    caption: scale(typography.text.caption.fontSize),
  };

  // State
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlement'>('expenses');
  const [group, setGroup] = useState<Group>(initialGroup);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firebaseSettlements, setFirebaseSettlements] = useState<any[]>([]);

  const loadGroupData = useCallback(async () => {
    if (!group?.id) {
      console.error('GroupDetailsScreen: No group ID provided');
      Alert.alert('Error', 'Group information is missing. Please try again.');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);

      // Load all data in parallel for faster loading
      const [updatedGroup, groupExpenses, settlementHistory] = await Promise.all([
        firebaseService.getGroupById(group.id),
        firebaseService.getGroupExpenses(group.id),
        firebaseService.getGroupSettlements(group.id)
      ]);

      // Update state in batch
      if (updatedGroup) {
        setGroup(updatedGroup);
        const members = updatedGroup.members;

        // Calculate balances
        calculateBalances(groupExpenses, members);
      }

      setExpenses(groupExpenses);
      setFirebaseSettlements(settlementHistory);

    } catch (error) {
      console.error('Error loading group data:', error);
      Alert.alert('Error', 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  }, [group.id]);

  // Load data only once on mount
  useEffect(() => {
    loadGroupData();
  }, []); // Empty dependency array - load only once

  // Recalculate settlements when firebase settlements change
  useEffect(() => {
    if (balances.length > 0) {
      calculateSettlements(balances, firebaseSettlements);
    }
  }, [firebaseSettlements, balances]);

  // Refresh data when screen comes into focus ONLY if navigating back
  const hasLoadedOnce = React.useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnce.current && !loading) {
        // Only reload on subsequent focuses (e.g., coming back from another screen)
        loadGroupData();
      } else {
        hasLoadedOnce.current = true;
      }
    }, [loading])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  }, [loadGroupData]);

  const calculateSettlements = useCallback((balances: Balance[], fbSettlements: any[] = []) => {
    const settlements: Settlement[] = [];
    
    
    
    // Create arrays of creditors and debtors
    const creditors = balances.filter(b => b.netBalance > 0)
      .map(b => ({ userId: b.userId, name: b.name, amount: b.netBalance }))
      .sort((a, b) => b.amount - a.amount);
    
    const debtors = balances.filter(b => b.netBalance < 0)
      .map(b => ({ userId: b.userId, name: b.name, amount: Math.abs(b.netBalance) }))
      .sort((a, b) => b.amount - a.amount);
      
    
    // Greedy algorithm to minimize transactions
    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const settleAmount = Math.min(creditor.amount, debtor.amount);
      
      if (settleAmount > 0.01) { // Ignore tiny amounts
        // Check if there's an existing Firebase settlement for this pair
        const existingSettlement = fbSettlements.find(s => 
          s.fromUserId === debtor.userId && s.toUserId === creditor.userId && 
          Math.abs(s.amount - settleAmount) < 0.01
        );
        
        settlements.push({
          from: debtor.userId,
          fromName: debtor.name,
          to: creditor.userId,
          toName: creditor.name,
          amount: settleAmount,
          firebaseSettlement: existingSettlement ? {
            id: existingSettlement.id,
            status: existingSettlement.status,
            createdAt: existingSettlement.createdAt,
            paidAt: existingSettlement.paidAt
          } : undefined
        });
      }
      
      creditor.amount -= settleAmount;
      debtor.amount -= settleAmount;
      
      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }
    
    setSettlements(settlements);
  }, [user?.id]);

  const calculateBalances = useCallback((expenses: GroupExpense[], members: GroupMember[]) => {
    
    // Initialize balance tracking
    const balanceMap = new Map<string, Balance>();
    const owesMap = new Map<string, Map<string, number>>();
    
    // Initialize for all members
    members.forEach(member => {
      balanceMap.set(member.userId, {
        userId: member.userId,
        name: member.name,
        totalOwed: 0,
        totalOwes: 0,
        netBalance: 0,
        details: []
      });
      owesMap.set(member.userId, new Map());
    });

    // Process each expense
    expenses.forEach(expense => {
      const payerId = expense.paidBy.id;
      
      expense.participants.forEach(participant => {
        if (participant.id !== payerId) {
          // Update what participant owes to payer
          const currentOwes = owesMap.get(participant.id)?.get(payerId) || 0;
          owesMap.get(participant.id)?.set(payerId, currentOwes + participant.amount);
          
          // Update balances
          const participantBalance = balanceMap.get(participant.id);
          const payerBalance = balanceMap.get(payerId);
          
          if (participantBalance) {
            participantBalance.totalOwes += participant.amount;
          }
          if (payerBalance) {
            payerBalance.totalOwed += participant.amount;
          }
        }
      });
    });

    // Calculate net balances and simplify debts
    const calculatedBalances: Balance[] = [];
    
    members.forEach(member => {
      const balance = balanceMap.get(member.userId);
      if (balance) {
        balance.netBalance = balance.totalOwed - balance.totalOwes;
        
        // Add details of who owes whom
        const owesDetails = owesMap.get(member.userId);
        if (owesDetails) {
          owesDetails.forEach((amount, toUserId) => {
            const toUser = members.find(m => m.userId === toUserId);
            if (toUser && amount > 0) {
              balance.details.push({
                toUserId,
                toUserName: toUser.name,
                amount
              });
            }
          });
        }
        
        calculatedBalances.push(balance);
      }
    });
    
    setBalances(calculatedBalances);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSettlePayment = async (settlement: Settlement) => {
    try {
      await firebaseService.createSettlement({
        groupId: group.id,
        fromUserId: settlement.from,
        fromUserName: settlement.fromName,
        toUserId: settlement.to,
        toUserName: settlement.toName,
        amount: settlement.amount,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      Alert.alert('Success', 'Payment marked as pending. Waiting for confirmation from receiver.');
      await loadGroupData();
    } catch (error) {
      console.error('Error creating settlement:', error);
      Alert.alert('Error', 'Failed to mark payment as done');
    }
  };

  const handleConfirmPayment = async (settlement: Settlement) => {
    if (!settlement.firebaseSettlement?.id) return;
    
    try {
      await firebaseService.confirmSettlement(group.id, settlement.firebaseSettlement.id);
      Alert.alert('Success', 'Payment confirmed successfully!');
      await loadGroupData();
    } catch (error) {
      console.error('Error confirming settlement:', error);
      Alert.alert('Error', 'Failed to confirm payment');
    }
  };

  const handleAddExpense = () => {
    navigation.navigate('AddExpense', { 
      group: { id: group.id, name: group.name },
      onReturn: () => {
        // This will trigger when returning from AddExpense
        loadGroupData();
      }
    });
  };

  const handleExpensePress = (expense: GroupExpense) => {
    // Navigate to ExpenseDetailScreen for better user experience
    navigation.navigate('ExpenseDetail', { 
      expense, 
      group 
    });
  };


  const renderExpenseItem = ({ item }: { item: GroupExpense }) => {
    const isCurrentUserPayer = item.paidBy.id === user?.id;
    const currentUserParticipant = item.participants.find(p => p.id === user?.id);
    const currentUserAmount = currentUserParticipant?.amount || 0;
    
    return (
      <TouchableOpacity style={styles.expenseItem} onPress={() => handleExpensePress(item)}>
        <View style={styles.expenseLeft}>
          <View style={[styles.categoryIcon, { backgroundColor: item.category.color }]}>
            <Text style={styles.categoryEmoji}>{item.category.emoji}</Text>
          </View>
          <View style={styles.expenseDetails}>
            <Text style={styles.expenseDescription}>{item.description}</Text>
            <Text style={styles.expenseInfo}>
              Paid by {isCurrentUserPayer ? 'You' : item.paidBy.name}
            </Text>
            <Text style={styles.expenseDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
          {!isCurrentUserPayer && currentUserAmount > 0 && (
            <Text style={styles.youOwe}>you owe ₹{currentUserAmount.toFixed(2)}</Text>
          )}
          {isCurrentUserPayer && currentUserAmount < item.amount && (
            <Text style={styles.youLent}>
              you lent ₹{(item.amount - currentUserAmount).toFixed(2)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderBalanceItem = ({ item }: { item: Balance }) => {
    const isCurrentUser = item.userId === user?.id;
    const colorStyle = item.netBalance > 0 ? styles.positiveAmount : 
                       item.netBalance < 0 ? styles.negativeAmount : 
                       styles.neutralAmount;
    
    return (
      <View style={styles.balanceItem}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceName}>
            {isCurrentUser ? 'You' : item.name}
          </Text>
          <Text style={[styles.balanceAmount, colorStyle]}>
            {item.netBalance > 0 ? '+' : ''}₹{Math.abs(item.netBalance).toFixed(2)}
          </Text>
        </View>
        {item.netBalance !== 0 && (
          <Text style={styles.balanceSubtext}>
            {item.netBalance > 0 
              ? `Gets back ₹${item.netBalance.toFixed(2)}` 
              : `Owes ₹${Math.abs(item.netBalance).toFixed(2)}`}
          </Text>
        )}
        {item.details.length > 0 && (
          <View style={styles.balanceDetails}>
            {item.details.map((detail, index) => (
              <Text key={index} style={styles.balanceDetailText}>
                owes ₹{detail.amount.toFixed(2)} to {detail.toUserName}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSettlementItem = ({ item }: { item: Settlement }) => {
    const isCurrentUserFrom = item.from === user?.id;
    const isCurrentUserTo = item.to === user?.id;
    const settlementStatus = item.firebaseSettlement?.status;
    
    
    return (
      <View style={styles.settlementItem}>
        <View style={styles.settlementContent}>
          <View style={styles.settlementLeft}>
            <Ionicons 
              name="arrow-forward-circle-outline" 
              size={scaledFontSize['2xl']} 
              color={colors.primaryButton} 
            />
            <View style={styles.settlementDetails}>
              <Text style={styles.settlementText}>
                <Text style={styles.settlementName}>
                  {isCurrentUserFrom ? 'You' : item.fromName}
                </Text>
                {' pays '}
                <Text style={styles.settlementName}>
                  {isCurrentUserTo ? 'You' : item.toName}
                </Text>
              </Text>
              <Text style={styles.settlementAmount}>₹{item.amount.toFixed(2)}</Text>
              
              {/* Show status if exists */}
              {settlementStatus === 'pending' && (
                <Text style={styles.pendingText}>
                  {isCurrentUserFrom ? 'Awaiting confirmation' : 'Pending your confirmation'}
                </Text>
              )}
              {settlementStatus === 'paid' && (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={scale(16)} color={colors.success} />
                  <Text style={styles.paidText}>Paid</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Action buttons */}
          <View style={styles.settlementActions}>
            {/* Show Settle button for payer if not already settled */}
            {isCurrentUserFrom && !settlementStatus && (
              <TouchableOpacity 
                style={styles.settleButton} 
                onPress={() => {
                  Alert.alert(
                    'Confirm Payment',
                    `Have you paid ₹${item.amount.toFixed(2)} to ${item.toName}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Yes', onPress: () => handleSettlePayment(item) }
                    ]
                  );
                }}
              >
                <Text style={styles.settleButtonText}>Settle</Text>
              </TouchableOpacity>
            )}
            
            {/* Show Pending status for payer */}
            {isCurrentUserFrom && settlementStatus === 'pending' && (
              <View style={styles.pendingButton}>
                <Text style={styles.pendingButtonText}>Pending</Text>
              </View>
            )}
            
            {/* Show Confirm button for receiver */}
            {isCurrentUserTo && settlementStatus === 'pending' && (
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={() => {
                  Alert.alert(
                    'Confirm Receipt',
                    `Have you received ₹${item.amount.toFixed(2)} from ${item.fromName}?`,
                    [
                      { text: 'No', style: 'cancel' },
                      { text: 'Yes', onPress: () => handleConfirmPayment(item) }
                    ]
                  );
                }}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };


  const styles = createStyles(colors, scale, scaledFontSize);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={scaledFontSize.xl} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ManageGroup', { group })}>
            <Ionicons name="settings-outline" size={scaledFontSize.xl} color={colors.primaryText} />
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>{group.name}</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity onPress={() => loadGroupData()}>
            <Ionicons name="refresh-outline" size={scaledFontSize.xl} color={colors.primaryText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ManageGroup', { group })}>
            <Ionicons name="settings-outline" size={scaledFontSize.xl} color={colors.primaryText} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'balances' && styles.activeTab]}
          onPress={() => setActiveTab('balances')}
        >
          <Text style={[styles.tabText, activeTab === 'balances' && styles.activeTabText]}>
            Balances
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settlement' && styles.activeTab]}
          onPress={() => setActiveTab('settlement')}
        >
          <Text style={[styles.tabText, activeTab === 'settlement' && styles.activeTabText]}>
            Settlement
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'expenses' && (
          <>
            <FlatList
              data={expenses}
              renderItem={renderExpenseItem}
              keyExtractor={(item) => item.id || ''}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="receipt-outline" size={scale(64)} color={colors.secondaryText} />
                  <Text style={styles.emptyText}>No expenses yet</Text>
                  <Text style={styles.emptySubtext}>Add your first expense to get started</Text>
                </View>
              }
              contentContainerStyle={expenses.length === 0 && styles.emptyList}
            />
            <TouchableOpacity style={styles.fab} onPress={handleAddExpense}>
              <Ionicons name="add" size={scaledFontSize['2xl']} color={colors.primaryButtonText} />
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'balances' && (
          <FlatList
            data={balances}
            renderItem={renderBalanceItem}
            keyExtractor={(item) => item.userId}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="wallet-outline" size={scale(64)} color={colors.secondaryText} />
                <Text style={styles.emptyText}>No balances</Text>
                <Text style={styles.emptySubtext}>Add expenses to see balances</Text>
              </View>
            }
            contentContainerStyle={balances.length === 0 && styles.emptyList}
          />
        )}

        {activeTab === 'settlement' && (
          <>
            <FlatList
              data={settlements}
              renderItem={renderSettlementItem}
              keyExtractor={(item, index) => `${item.from}-${item.to}-${index}`}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-circle-outline" size={scale(64)} color={colors.secondaryText} />
                  <Text style={styles.emptyText}>All settled up!</Text>
                  <Text style={styles.emptySubtext}>No payments needed</Text>
                </View>
              }
              contentContainerStyle={settlements.length === 0 && styles.emptyList}
            />
          </>
        )}
      </View>

    </SafeAreaView>
  );
};

const createStyles = (colors: any, scale: (size: number) => number, fonts: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(16),
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  headerTitle: {
    fontSize: fonts.header,
    fontWeight: '600',
    color: colors.primaryText,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  tab: {
    flex: 1,
    paddingVertical: scale(12),
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryButton,
  },
  tabText: {
    fontSize: fonts.body,
    color: colors.secondaryText,
  },
  activeTabText: {
    color: colors.primaryButton,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(80),
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: scale(16),
  },
  emptySubtext: {
    fontSize: fonts.body,
    color: colors.secondaryText,
    marginTop: scale(8),
  },
  
  // Expense Item Styles
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: scale(16),
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  expenseLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  categoryEmoji: {
    fontSize: fonts.xl,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: fonts.body,
    fontWeight: '500',
    color: colors.primaryText,
  },
  expenseInfo: {
    fontSize: fonts.caption,
    color: colors.secondaryText,
    marginTop: scale(2),
  },
  expenseDate: {
    fontSize: fonts.caption,
    color: colors.secondaryText,
    marginTop: scale(2),
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.primaryText,
  },
  youOwe: {
    fontSize: fonts.caption,
    color: colors.error,
    marginTop: scale(4),
  },
  youLent: {
    fontSize: fonts.caption,
    color: colors.success,
    marginTop: scale(4),
  },
  
  // Balance Item Styles
  balanceItem: {
    padding: scale(16),
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceName: {
    fontSize: fonts.body,
    fontWeight: '600',
    color: colors.primaryText,
  },
  balanceAmount: {
    fontSize: fonts.lg,
    fontWeight: '600',
  },
  positiveAmount: {
    color: colors.success,
  },
  negativeAmount: {
    color: colors.error,
  },
  neutralAmount: {
    color: colors.secondaryText,
  },
  balanceSubtext: {
    fontSize: fonts.caption,
    color: colors.secondaryText,
    marginTop: scale(4),
  },
  balanceDetails: {
    marginTop: scale(8),
  },
  balanceDetailText: {
    fontSize: fonts.caption,
    color: colors.secondaryText,
    marginTop: scale(2),
  },
  
  // Settlement Item Styles
  settlementItem: {
    padding: scale(16),
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  settlementContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settlementLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  settlementDetails: {
    marginLeft: scale(12),
    flex: 1,
  },
  settlementText: {
    fontSize: fonts.body,
    color: colors.primaryText,
  },
  settlementName: {
    fontWeight: '600',
  },
  settlementAmount: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.primaryButton,
    marginTop: scale(4),
  },
  settlementActions: {
    marginLeft: scale(12),
  },
  settleButton: {
    backgroundColor: colors.primaryButton,
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(6),
  },
  settleButtonText: {
    color: colors.primaryButtonText,
    fontSize: fonts.body,
    fontWeight: '600',
  },
  pendingButton: {
    backgroundColor: colors.warning + '20', // 20% opacity
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(6),
  },
  pendingButtonText: {
    color: colors.warning,
    fontSize: fonts.body,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.success,
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(6),
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.body,
    fontWeight: '600',
  },
  pendingText: {
    fontSize: fonts.caption,
    color: colors.warning,
    marginTop: scale(4),
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(4),
  },
  paidText: {
    fontSize: fonts.caption,
    color: colors.success,
    marginLeft: scale(4),
    fontWeight: '500',
  },
  
  // FAB
  fab: {
    position: 'absolute',
    bottom: scale(16),
    right: scale(16),
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: colors.primaryButton,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: scale(16),
  },
});
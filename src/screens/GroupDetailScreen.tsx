import React, {useEffect, useState, useCallback} from 'react'; // Added useCallback
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  // --- RESPONSIVE / ANIMATION ---
  useWindowDimensions,
  UIManager,
  Platform,
  LayoutAnimation,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ensureDataUri, debugImageData } from '../utils/imageUtils';
// --- RESPONSIVE ---
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import { typography } from '../utils/typography'; // Assuming this path is correct

// --- ANIMATION ---
// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- TYPES ---
type Group = any;
type Member = any;
type Expense = any;

interface Settlement {
  id?: string;
  groupId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  status: 'unpaid' | 'pending' | 'paid';
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  confirmedAt?: string;
  paymentNote?: string;
}

interface Props {
  route: {
    params: {
      group: Group;
      expenses?: Expense[];
      members?: Member[];
      balances?: Record<string, {net: number}>;
      currentUserId?: string | null;
      reload?: boolean;
    };
  };
  navigation: any;
}

export const GroupDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {group} = route.params;
  const currentUserId = user?.id || route.params?.currentUserId || null;

  // --- RESPONSIVE ---
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets(); // For modal padding
  const baseWidth = 375;
  const scale = (size: number) => (screenWidth / baseWidth) * size;

  // Create scaled font sizes
  const scaledFontSize = {
    xs: scale(typography.fontSize.xs),
    sm: scale(typography.fontSize.sm),
    base: scale(typography.fontSize.base),
    lg: scale(typography.fontSize.lg),
    xl: scale(typography.fontSize.xl),
    '2xl': scale(typography.fontSize['2xl']),
    header: scale(typography.text.header.fontSize),
    headerLarge: scale(typography.text.headerLarge.fontSize),
    title: scale(typography.text.title.fontSize),
    subtitle: scale(typography.text.subtitle.fontSize),
    body: scale(typography.text.body.fontSize),
    caption: scale(typography.text.caption.fontSize),
    button: scale(typography.text.button.fontSize),
  };
  // --- END RESPONSIVE ---

  // Dynamic tab configuration
  const TAB_CONFIG = [
    {
      id: 'expenses',
      label: 'Expenses',
      icon: 'receipt-outline',
      activeIcon: 'receipt',
    },
    {
      id: 'balances',
      label: 'Balances', 
      icon: 'wallet-outline',
      activeIcon: 'wallet',
    },
    {
      id: 'settlement',
      label: 'Settlement',
      icon: 'swap-horizontal-outline',
      activeIcon: 'swap-horizontal',
    },
  ] as const;

  type TabId = typeof TAB_CONFIG[number]['id'];

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<TabId>('expenses');
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(group); // Track current group data locally
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [balances, setBalances] = useState<Record<string, {net: number}>>({});
  const [settlements, setSettlements] = useState<any[]>([]);
  const [firebaseSettlements, setFirebaseSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [settlementLoading, setSettlementLoading] = useState(false);

  
  // --- LOGIC (Wrapped in useCallback) ---

  const loadGroupData = useCallback(async () => {
    const groupId = currentGroup?.id || group?.id;
    if (!groupId) {
      console.log('No group ID available for loading data');
      return;
    }

    console.log('Loading dynamic group data for:', groupId);
    setLoading(true);
    
    try {
      // Import Firebase service dynamically
      const { firebaseService } = await import('../services/firebaseService');
      
      // Load real group data
      const [updatedGroup, groupExpenses] = await Promise.all([
        firebaseService.getGroupById(groupId),
        firebaseService.getGroupExpenses(groupId)
      ]);

      if (updatedGroup) {
        console.log('Loaded group members:', updatedGroup.members.length);
        console.log('Updated group cover image:', updatedGroup.coverImageBase64 ? 'present' : 'not present');
        
        // Update the main group object with fresh data (including cover image)
        const updatedGroupData = {
          ...currentGroup,
          ...updatedGroup,
          coverImageBase64: updatedGroup.coverImageBase64
        };
        
        // Update the local group state to reflect fresh data
        setCurrentGroup(updatedGroupData);
        
        // Update the group object in parent navigation params for consistency
        navigation.setParams({ group: updatedGroupData });
        
        const members = updatedGroup.members.map(member => ({
          userId: member.userId,
          name: member.name,
          email: member.phoneNumber,
          avatar: member.profileImage,
          isAdmin: member.role === 'admin',
          isCreator: updatedGroup.createdBy === member.userId,
          role: member.role
        }));
        
        setGroupMembers(members);
        setIsGroupAdmin(
          updatedGroup.createdBy === currentUserId || 
          members.some(m => m.userId === currentUserId && m.isAdmin)
        );
      }

      console.log('Loaded expenses:', groupExpenses.length);
      // Transform Firebase expenses to component format with proper member mapping
      const transformedExpenses = groupExpenses.map(expense => {
        // Map participants with proper member data
        const enrichedParticipants = expense.participants.map(participant => {
          const member = updatedGroup?.members.find(m => m.userId === participant.id);
          console.log('Enriching participant:', participant.id, participant.name);
          console.log('Found member:', member ? member.name : 'not found');
          
          return {
            ...participant,
            userId: participant.id, // Ensure userId field exists
            name: participant.name || member?.name || 'Unknown User',
            email: member?.phoneNumber || '',
            avatar: member?.profileImage || '',
          };
        });

        // Debug receipt data transformation
        if (expense.receiptBase64) {
          debugImageData(expense.receiptBase64, `Receipt for ${expense.description}`);
        }

        return {
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          paidBy: expense.paidBy.id,
          paidByName: expense.paidBy.name,
          participants: enrichedParticipants,
          createdAt: { toDate: () => new Date(expense.createdAt) },
          receiptBase64: expense.receiptBase64,
          // Add receiptUrl for compatibility with ExpenseDetailScreen
          receiptUrl: ensureDataUri(expense.receiptBase64),
        };
      });
      
      setExpenses(transformedExpenses);

      // Load Firebase settlements first
      let loadedFirebaseSettlements: Settlement[] = [];
      try {
        loadedFirebaseSettlements = await firebaseService.getGroupSettlements(currentGroup.id);
        setFirebaseSettlements(loadedFirebaseSettlements);
        console.log('Loaded Firebase settlements:', loadedFirebaseSettlements.length);
      } catch (settlementError) {
        console.error('Error loading settlements:', settlementError);
      }

      // Calculate balances dynamically, excluding paid settlements
      const paidSettlements = loadedFirebaseSettlements.filter(s => s.status === 'paid');
      const calculatedBalances = calculateBalancesFromExpenses(
        groupExpenses, 
        updatedGroup?.members || [], 
        paidSettlements
      );
      setBalances(calculatedBalances);

      // Calculate settlements from remaining balances
      const calculatedSettlements = calculateOptimalSettlements(calculatedBalances, updatedGroup?.members || []);
      setSettlements(calculatedSettlements);
      
      console.log('Paid settlements excluded from calculation:', paidSettlements.length);
      console.log('New settlements calculated:', calculatedSettlements.length);

      console.log('Group data loaded successfully');
    } catch (err) {
      console.error('Error loading group data:', err);
      Alert.alert('Error', 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data once on mount
  useEffect(() => {
    loadGroupData();
  }, []); // Only run once on mount

  // Refresh data when screen comes into focus (e.g., returning from ManageGroup)
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused - refreshing group data');
      loadGroupData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  }, [loadGroupData]); // Depends on the stable loadGroupData

  // Handlers for group options
  const handleAddMember = useCallback(() => {
    navigation.navigate('AddMember', {group: currentGroup});
  }, [navigation, currentGroup]);

  const handleManageGroup = useCallback(() => {
    navigation.navigate('ManageGroup', {group: currentGroup});
  }, [navigation, currentGroup]);

  const handleCompleteGroup = useCallback(async () => {
    try {
      // Check if there are any pending settlements
      const allSettlements = calculateOptimalSettlements(balances, groupMembers);
      const pendingSettlements = allSettlements.length > 0;
      
      // Also check firebase settlements for pending status
      const firebasePendingSettlements = firebaseSettlements.filter(s => s.status === 'pending' || s.status === 'unpaid');
      
      if (pendingSettlements || firebasePendingSettlements.length > 0) {
        Alert.alert(
          'Cannot Complete Group',
          'This group has pending settlements. Please settle all balances before completing the group.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
      
      Alert.alert(
        'Complete Group',
        'Are you sure you want to complete this group? Once completed, no new expenses can be added, but you can still view the history.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            style: 'default',
            onPress: async () => {
              try {
                setLoading(true);
                const { firebaseService } = await import('../services/firebaseService');
                await firebaseService.completeGroup(currentGroup.id, currentUserId || undefined);
                Alert.alert(
                  'Group Completed',
                  'The group has been completed successfully. You can view its history from the "See All Groups" section.',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    }
                  ]
                );
              } catch (error) {
                console.error('Error completing group:', error);
                Alert.alert('Error', 'Failed to complete group. Please try again.');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error checking settlements:', error);
      Alert.alert('Error', 'Failed to check group status. Please try again.');
    }
  }, [balances, groupMembers, firebaseSettlements, currentGroup.id, navigation]);

  // Settlement Actions
  const handleSettlePayment = useCallback(async (settlement: any) => {
    Alert.alert(
      'Settle Payment',
      `Mark payment of ₹${settlement.amount.toFixed(0)} to ${settlement.to} as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: async () => {
            try {
              setSettlementLoading(true);
              const { firebaseService } = await import('../services/firebaseService');
              
              const timestamp = new Date().toISOString();
              await firebaseService.createSettlement({
                groupId: currentGroup.id,
                fromUserId: settlement.fromUserId,
                fromUserName: settlement.from.replace(' (You)', ''),
                toUserId: settlement.toUserId,
                toUserName: settlement.to.replace(' (You)', ''),
                amount: settlement.amount,
                status: 'pending' as const,
                createdAt: timestamp,
                updatedAt: timestamp,
                paidAt: timestamp,
              });
              
              // Reload settlements
              const updatedSettlements = await firebaseService.getGroupSettlements(currentGroup.id);
              setFirebaseSettlements(updatedSettlements);
              
              Alert.alert('Success', 'Payment marked as pending. Waiting for confirmation from receiver.');
            } catch (error) {
              console.error('Error creating settlement:', error);
              Alert.alert('Error', 'Failed to mark payment. Please try again.');
            } finally {
              setSettlementLoading(false);
            }
          }
        }
      ]
    );
  }, [currentGroup.id]);

  const handleConfirmPayment = useCallback(async (settlement: Settlement) => {
    Alert.alert(
      'Confirm Payment',
      `Confirm that you received ₹${settlement.amount.toFixed(0)} from ${settlement.fromUserName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Received',
          onPress: async () => {
            if (!settlement.id) {
              Alert.alert('Error', 'Settlement ID not found');
              return;
            }
            
            try {
              setSettlementLoading(true);
              const { firebaseService } = await import('../services/firebaseService');
              
              await firebaseService.confirmSettlement(currentGroup.id, settlement.id);
              
              // Reload settlements
              const updatedSettlements = await firebaseService.getGroupSettlements(currentGroup.id);
              setFirebaseSettlements(updatedSettlements);
              
              Alert.alert('Success', 'Payment confirmed!');
            } catch (error) {
              console.error('Error confirming settlement:', error);
              Alert.alert('Error', 'Failed to confirm payment. Please try again.');
            } finally {
              setSettlementLoading(false);
            }
          }
        }
      ]
    );
  }, [currentGroup.id]); // No dependencies

  const handleLeaveGroup = useCallback(async () => {
    try {
      // Check if the current user has any pending settlements
      const userPendingSettlements = settlements.filter(settlement => 
        settlement.fromUserId === currentUserId || settlement.toUserId === currentUserId
      );
      
      // Also check Firebase settlements for pending status involving the current user
      const userFirebasePendingSettlements = firebaseSettlements.filter(settlement => 
        (settlement.fromUserId === currentUserId || settlement.toUserId === currentUserId) &&
        (settlement.status === 'pending' || settlement.status === 'unpaid')
      );
      
      // Check if user has any outstanding balance
      const userBalance = balances[currentUserId || ''];
      const hasOutstandingBalance = userBalance && Math.abs(userBalance.net) > 0.01;
      
      if (userPendingSettlements.length > 0 || userFirebasePendingSettlements.length > 0 || hasOutstandingBalance) {
        Alert.alert(
          'Cannot Leave Group',
          'You have pending settlements or outstanding balances in this group. Please settle all your dues before leaving the group.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
      
      // If no pending settlements, show confirmation dialog
      Alert.alert(
        'Leave Group',
        'Are you sure you want to leave this group? You will no longer have access to group expenses and will need to be re-added to participate again.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                const { firebaseService } = await import('../services/firebaseService');
                await firebaseService.removeGroupMember(currentGroup.id, currentUserId || '');
                Alert.alert(
                  'Left Group',
                  'You have successfully left the group.',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    }
                  ]
                );
              } catch (error) {
                console.error('Error leaving group:', error);
                Alert.alert('Error', 'Failed to leave group. Please try again.');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error checking user settlements:', error);
      Alert.alert('Error', 'Failed to check settlement status. Please try again.');
    }
  }, [settlements, firebaseSettlements, balances, currentUserId, currentGroup.id, navigation]);

  // Helper function to calculate balances from expenses
  const calculateBalancesFromExpenses = useCallback((expenses: any[], members: any[], paidSettlements: Settlement[] = []) => {
    const balances: Record<string, {net: number}> = {};
    
    // Initialize balances for all members
    members.forEach(member => {
      balances[member.userId] = { net: 0 };
    });

    // Process each expense
    expenses.forEach(expense => {
      const payerId = expense.paidBy.id;
      
      expense.participants.forEach((participant: any) => {
        const participantId = participant.id || participant.userId;
        if (participantId !== payerId) {
          // Participant owes payer
          if (balances[participantId]) {
            balances[participantId].net -= participant.amount;
          }
          if (balances[payerId]) {
            balances[payerId].net += participant.amount;
          }
        }
      });
    });

    // Subtract paid settlements from balances
    paidSettlements.forEach(settlement => {
      if (settlement.status === 'paid') {
        const fromUserId = settlement.fromUserId;
        const toUserId = settlement.toUserId;
        const amount = settlement.amount;
        
        // Reduce debt for payer and credit for receiver
        if (balances[fromUserId]) {
          balances[fromUserId].net += amount; // Reduce debt (move towards positive)
        }
        if (balances[toUserId]) {
          balances[toUserId].net -= amount; // Reduce credit (move towards zero)
        }
        
        console.log(`Applied paid settlement: ${settlement.fromUserName} → ${settlement.toUserName} (₹${amount})`);
      }
    });

    return balances;
  }, []);

  // Helper function to calculate optimal settlements
  const calculateOptimalSettlements = useCallback((balances: Record<string, {net: number}>, members: any[]) => {
    const settlements: any[] = [];
    
    // Create arrays of creditors and debtors
    const creditors = Object.entries(balances)
      .filter(([, balance]) => balance.net > 0)
      .map(([userId, balance]) => {
        const member = members.find(m => m.userId === userId);
        return { 
          userId, 
          name: member?.name || 'Unknown',
          amount: balance.net 
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const debtors = Object.entries(balances)
      .filter(([, balance]) => balance.net < 0)
      .map(([userId, balance]) => {
        const member = members.find(m => m.userId === userId);
        return { 
          userId, 
          name: member?.name || 'Unknown',
          amount: Math.abs(balance.net) 
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Greedy algorithm to minimize transactions
    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const settleAmount = Math.min(creditor.amount, debtor.amount);
      
      if (settleAmount > 0.01) {
        settlements.push({
          id: `${debtor.userId}-${creditor.userId}`,
          fromUserId: debtor.userId,
          toUserId: creditor.userId,
          from: debtor.name + (debtor.userId === currentUserId ? ' (You)' : ''),
          to: creditor.name + (creditor.userId === currentUserId ? ' (You)' : ''),
          amount: settleAmount
        });
      }
      
      creditor.amount -= settleAmount;
      debtor.amount -= settleAmount;
      
      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }
    
    return settlements;
  }, [currentUserId]);

  const categoryMapping: Record<number | string, {emoji: string; color: string}> = {
    1: {emoji: '🍽️', color: '#FEF3C7'},
    2: {emoji: '🚗', color: '#FECACA'},
    3: {emoji: '🛍️', color: '#E0E7FF'},
    default: {emoji: '💰', color: '#F3F4F6'},
  };

  const toggleUserExpansion = useCallback((userId: string) => {
    // --- UI IMPROVEMENT ---
    // Animate the expansion
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedUsers(prev => ({...prev, [userId]: !prev[userId]}));
  }, []); // setExpandedUsers is stable

  const getBalanceBreakdown = useCallback((targetUserId: string) => {
    const breakdown: any[] = [];
    Object.entries(balances).forEach(([userId, balance]) => {
      if (userId === targetUserId || balance.net === 0) return;
      const member = groupMembers.find(m => m.userId === userId);
      const target = groupMembers.find(m => m.userId === targetUserId);
      if (!member || !target) return;

      const targetBalance = balances[targetUserId];
      if (!targetBalance) return;

      if (targetBalance.net < 0 && balance.net > 0) {
        const settleAmount = Math.min(Math.abs(targetBalance.net), balance.net);
        if (settleAmount > 0) {
          breakdown.push({
            type: 'owes',
            text: `${target.name}${
              targetUserId === currentUserId ? ' (You)' : ''
            } owes ₹${settleAmount.toFixed(0)} to ${member.name}${
              userId === currentUserId ? ' (You)' : ''
            }`,
            amount: settleAmount,
            avatar: member.avatar,
          });
        }
      } else if (targetBalance.net > 0 && balance.net < 0) {
        const settleAmount = Math.min(targetBalance.net, Math.abs(balance.net));
        if (settleAmount > 0) {
          breakdown.push({
            type: 'owed',
            text: `${member.name}${
              userId === currentUserId ? ' (You)' : ''
            } owes ₹${settleAmount.toFixed(0)} to ${target.name}${
              targetUserId === currentUserId ? ' (You)' : ''
            }`,
            amount: settleAmount,
            avatar: member.avatar,
          });
        }
      }
    });

    return breakdown;
  }, [balances, groupMembers, currentUserId]); // Dependencies for getBalanceBreakdown

  // Helper function to calculate expense payment status based on settlement status
  const getExpensePaymentStatus = useCallback((expense: any) => {
    if (!currentUserId) {
      return { status: 'unknown', label: '', color: colors.secondaryText };
    }

    const isPaidByUser = expense.paidBy === currentUserId;
    const userParticipant = expense.participants?.find((p: any) => 
      (p.userId === currentUserId || p.id === currentUserId)
    );
    
    if (!userParticipant) {
      return { status: 'not_involved', label: '', color: colors.secondaryText };
    }

    const userShare = userParticipant.amount || 0;
    const expenseTotal = expense.amount || 0;

    // Check settlement status for this expense-related payment
    if (isPaidByUser) {
      // User paid the expense
      if (userShare === expenseTotal) {
        // Only user's expense
        return { status: 'self_paid', label: 'You Paid', color: colors.secondaryText };
      } else {
        // Others owe user money - check if they've settled
        // Check if there are any unpaid amounts owed to user
        const userBalance = balances[currentUserId]?.net || 0;
        
        if (userBalance > 0) {
          // Still owed money
          return { status: 'to_receive', label: 'To Receive', color: colors.primaryButton };
        } else {
          // Received or settled
          return { status: 'received', label: 'Received', color: colors.success || '#10B981' };
        }
      }
    } else {
      // Someone else paid the expense - user owes money
      if (userShare > 0) {
        // Check if user has settled this with the payer
        const settlementWithPayer = firebaseSettlements.find(settlement => 
          settlement.fromUserId === currentUserId && 
          settlement.toUserId === expense.paidBy
        );
        
        if (!settlementWithPayer) {
          // No settlement record - unpaid
          return { status: 'unpaid', label: 'Unpaid', color: colors.error || '#EF4444' };
        } else if (settlementWithPayer.status === 'pending') {
          // Settlement initiated but not confirmed
          return { status: 'pending', label: 'Pending', color: colors.warning || '#FFA500' };
        } else if (settlementWithPayer.status === 'paid') {
          // Fully paid
          return { status: 'paid', label: 'Paid', color: colors.success || '#10B981' };
        }
      }
    }

    return { status: 'settled', label: 'Settled', color: colors.success || '#10B981' };
  }, [currentUserId, colors, firebaseSettlements, balances]);

  // --- RENDER FUNCTIONS ---
  
  const renderExpenses = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryButton} />
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      );
    }

    if (!expenses || expenses.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="receipt" size={scale(48)} color={colors.secondaryText} />
          <Text style={styles.noDataText}>No expenses yet</Text>
          <Text style={styles.noDataSubtext}>
            Add your first expense to get started
          </Text>
        </View>
      );
    }

    return (
      <>
        {expenses.map((expense: Expense) => {
          const category =
            categoryMapping[expense.category?.id] || categoryMapping.default;
          const yourShare =
            expense.participants?.find((p: any) => 
              (p.userId === currentUserId || p.id === currentUserId)
            )?.amount || 0;
          const date = expense.createdAt?.toDate
            ? expense.createdAt.toDate().toLocaleDateString()
            : 'Recent';
          
          // Get payment status for this expense
          const paymentStatus = getExpensePaymentStatus(expense);

          return (
            <TouchableOpacity
              key={expense.id}
              style={styles.expenseItem}
              onPress={() =>
                navigation.navigate('ExpenseDetail', {
                  expense, 
                  group: {
                    ...group,
                    members: groupMembers
                  }
                })
              }>
              <View
                style={[styles.expenseIcon, {backgroundColor: category.color}]}>
                <Text style={styles.expenseIconText}>{category.emoji}</Text>
              </View>
              <View style={styles.expenseDetails}>
                <View style={styles.expenseTitleRow}>
                  <Text style={styles.expenseTitle} numberOfLines={1}>{expense.description}</Text>
                  {paymentStatus.label && (
                    <View style={[styles.statusTag, { backgroundColor: paymentStatus.color + '20', borderColor: paymentStatus.color }]}>
                      <Text style={[styles.statusTagText, { color: paymentStatus.color }]}>
                        {paymentStatus.label}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.expenseSubtitle}>
                  Paid by {expense.paidBy === currentUserId ? 'You' : expense.paidByName}
                </Text>
                <Text style={styles.expenseDate}>{date}</Text>
              </View>
              <View style={styles.expenseAmounts}>
                <Text style={styles.expenseAmount}>
                  ₹{(expense.amount || 0).toFixed(0)}
                </Text>
                <Text style={styles.expenseShare}>₹{yourShare.toFixed(0)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  const renderBalance = () => {
    const balanceList = Object.entries(balances)
      .map(([userId, balance]) => {
        const member = groupMembers.find(m => m.userId === userId);
        if (!member) return null;
        return {userId, member, balance, isYou: userId === currentUserId};
      })
      .filter(Boolean) as any[];

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryButton} />
          <Text style={styles.loadingText}>Loading balances...</Text>
        </View>
      );
    }

    if (!balanceList.length) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="wallet" size={scale(48)} color={colors.secondaryText} />
          <Text style={styles.noDataText}>No balances yet</Text>
          <Text style={styles.noDataSubtext}>Add expenses to see balances</Text>
        </View>
      );
    }

    return (
      <>
        {balanceList.map(item => {
          const isExpanded = !!expandedUsers[item.userId];
          const breakdown = getBalanceBreakdown(item.userId);
          const totalAmount = Math.abs(item.balance.net);

          return (
            <View key={item.userId} style={styles.balanceSection}>
              <TouchableOpacity
                style={styles.balanceHeader}
                onPress={() => toggleUserExpansion(item.userId)}
                disabled={breakdown.length === 0}>
                {(() => {
                  const imageUri = ensureDataUri(item.member.avatar);
                  return imageUri ? (
                    <Image 
                      source={{uri: imageUri}} 
                      style={styles.balanceAvatar}
                      onError={() => {
                        console.log('Failed to load balance avatar:', item.member.name);
                        debugImageData(item.member.avatar, `Balance ${item.member.name} Avatar`);
                      }}
                    />
                  ) : (
                    <View style={styles.balanceAvatarPlaceholder}>
                      <Text style={styles.balanceAvatarText}>
                        {item.member.name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  );
                })()}

                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceName} numberOfLines={2}>
                    {item.member.name}
                    {item.isYou ? ' (You)' : ''}{' '}
                    {item.balance.net < 0 ? 'owes in total' : 'gets back in total'}
                  </Text>
                </View>

                <View style={styles.balanceAmountContainer}>
                  <Text
                    style={[
                      styles.balanceAmount,
                      {color: item.balance.net >= 0 ? '#10B981' : '#EF4444'},
                    ]}>
                    ₹{totalAmount.toFixed(0)}
                  </Text>
                  {breakdown.length > 0 && (
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={scale(20)}
                      color={colors.secondaryText}
                      style={styles.expandIcon}
                    />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && breakdown.length > 0 && (
                <View style={styles.breakdownContainer}>
                  {breakdown.map((b, idx) => (
                    <View key={idx} style={styles.breakdownItem}>
                      {(() => {
                        const imageUri = ensureDataUri(b.avatar);
                        return imageUri ? (
                          <Image 
                            source={{uri: imageUri}} 
                            style={styles.breakdownAvatar}
                            onError={() => {
                              console.log('Failed to load breakdown avatar:', b.fromUser || b.toUser);
                              debugImageData(b.avatar, `Breakdown ${b.fromUser || b.toUser} Avatar`);
                            }}
                          />
                        ) : (
                          <View style={styles.breakdownAvatarPlaceholder}>
                            <Text style={styles.breakdownAvatarText}>
                              {(b.fromUser || b.toUser || 'U').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        );
                      })()}
                      <Text style={styles.breakdownText} numberOfLines={2}>{b.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </>
    );
  };

  const renderSettlement = () => {
    // Debug logging
    console.log('=== SETTLEMENT DEBUG ===');
    console.log('Current User ID:', currentUserId);
    console.log('Active Settlements:', settlements.length);
    console.log('Total Firebase Settlements:', firebaseSettlements.length);
    console.log('Paid Settlements:', firebaseSettlements.filter(s => s.status === 'paid').length);
    
    if (loading || groupMembers.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryButton} />
          <Text style={styles.loadingText}>Loading settlements...</Text>
        </View>
      );
    }

    if (settlements.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="checkmark-circle" size={scale(48)} color={colors.success} />
          <Text style={styles.noDataText}>All settled up!</Text>
          <Text style={styles.noDataSubtext}>No pending settlements</Text>
          <Text style={styles.noDataSubtext}>Add some expenses to see settlements</Text>
        </View>
      );
    }

    // Separate active and completed settlements
    const activeSettlements = settlements; // These are calculated from current balances
    const completedSettlements = firebaseSettlements.filter(fs => fs.status === 'paid');
    
    return (
      <>
        {/* Active Settlements - Need to be paid */}
        {activeSettlements.length > 0 && (
          <Text style={styles.sectionHeader}>Pending Settlements</Text>
        )}
        {activeSettlements.map((settlement) => {
          // Check if this settlement has a Firebase tracking record
          const firebaseSettlement = firebaseSettlements.find(fs => 
            fs.fromUserId === settlement.fromUserId && 
            fs.toUserId === settlement.toUserId &&
            Math.abs(fs.amount - settlement.amount) < 0.01
          );

          const isCurrentUserPayer = settlement.fromUserId === currentUserId;
          const isCurrentUserReceiver = settlement.toUserId === currentUserId;
          
          // Debug logging for each settlement
          console.log(`Settlement ${settlement.id}: ${settlement.from} → ${settlement.to} (₹${settlement.amount})`);
          console.log(`Current user is payer: ${isCurrentUserPayer}, receiver: ${isCurrentUserReceiver}`);
          
          return (
            <View key={settlement.id} style={styles.settlementItem}>
              <View style={styles.settlementInfo}>
                <Ionicons 
                  name="arrow-forward-circle" 
                  size={scale(24)} 
                  color={colors.primaryButton} 
                  style={styles.settlementIcon}
                />
                <View style={styles.settlementTextContainer}>
                  <Text style={styles.settlementText}>
                    <Text style={styles.settlementName}>{settlement.from}</Text>
                    {' pays '}
                    <Text style={styles.settlementName}>{settlement.to}</Text>
                  </Text>
                  <Text style={styles.settlementStatus}>
                    Status: {
                      !firebaseSettlement ? 'Unpaid' :
                      firebaseSettlement.status === 'pending' ? 'Pending Confirmation' : 'Paid'
                    }
                  </Text>
                </View>
              </View>
              
              <View style={styles.settlementActions}>
                <Text style={styles.settlementAmount}>₹{settlement.amount.toFixed(0)}</Text>
                
                {/* Show appropriate button based on user role and status */}
                {!firebaseSettlement && isCurrentUserPayer && (
                  <TouchableOpacity 
                    style={styles.settleButton}
                    onPress={() => handleSettlePayment(settlement)}
                    disabled={settlementLoading}
                  >
                    <Text style={styles.settleButtonText}>
                      {settlementLoading ? 'Processing...' : 'Settle'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {firebaseSettlement?.status === 'pending' && isCurrentUserPayer && (
                  <View style={styles.pendingButton}>
                    <Text style={styles.pendingButtonText}>Pending</Text>
                  </View>
                )}
                
                {firebaseSettlement?.status === 'pending' && isCurrentUserReceiver && (
                  <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={() => handleConfirmPayment(firebaseSettlement)}
                    disabled={settlementLoading}
                  >
                    <Text style={styles.confirmButtonText}>
                      {settlementLoading ? 'Processing...' : 'Confirm'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {firebaseSettlement?.status === 'paid' && (
                  <View style={styles.paidButton}>
                    <Ionicons name="checkmark-circle" size={scale(16)} color={colors.success} />
                    <Text style={styles.paidButtonText}>Paid</Text>
                  </View>
                )}
                
                {/* Show unpaid status for non-current users */}
                {!isCurrentUserPayer && !isCurrentUserReceiver && !firebaseSettlement && (
                  <View style={styles.unpaidButton}>
                    <Text style={styles.unpaidButtonText}>Unpaid</Text>
                  </View>
                )}
                
                {/* Fallback for edge cases */}
                {!isCurrentUserPayer && !isCurrentUserReceiver && firebaseSettlement && (
                  <Text style={styles.noActionText}>-</Text>
                )}
              </View>
            </View>
          );
        })}
        
        {/* Completed Settlements - Already paid */}
        {completedSettlements.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Completed Settlements</Text>
            {completedSettlements.map((settlement) => (
              <View key={`completed-${settlement.id}`} style={[styles.settlementItem, styles.completedSettlementItem]}>
                <View style={styles.settlementInfo}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={scale(24)} 
                    color={colors.success} 
                    style={styles.settlementIcon}
                  />
                  <View style={styles.settlementTextContainer}>
                    <Text style={styles.settlementText}>
                      <Text style={styles.settlementName}>{settlement.fromUserName}</Text>
                      {' paid '}
                      <Text style={styles.settlementName}>{settlement.toUserName}</Text>
                    </Text>
                    <Text style={styles.settlementStatus}>
                      Completed on {new Date(settlement.confirmedAt || settlement.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.settlementActions}>
                  <Text style={styles.settlementAmount}>₹{settlement.amount.toFixed(0)}</Text>
                  <View style={styles.paidButton}>
                    <Ionicons name="checkmark-circle" size={scale(16)} color={colors.success} />
                    <Text style={styles.paidButtonText}>Paid</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'expenses':
        return renderExpenses();
      case 'balances':
        return renderBalance();
      case 'settlement':
        return renderSettlement();
      default:
        return renderExpenses();
    }
  };

  const handleTabPress = useCallback((tabId: TabId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tabId);
  }, []);

  // --- RESPONSIVE ---
  // Call createStyles with all the required args
  const styles = createStyles(colors, scale, scaledFontSize, insets);

  // --- JSX ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scale(24)} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Details</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowGroupOptions(true)}>
          {/* --- ICON FIX --- */}
          <Ionicons name="settings" size={scale(20)} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primaryButton]}
            tintColor={colors.primaryButton}
          />
        }>
        <View style={styles.groupInfo}>
          <View style={styles.groupImageContainer}>
            {(() => {
              const imageUri = ensureDataUri(currentGroup?.coverImageBase64);
              return imageUri ? (
                <Image source={{uri: imageUri}} style={styles.groupCoverImage} />
              ) : (
                <View style={styles.groupAvatarContainer}>
                  <Text style={styles.groupAvatar}>{currentGroup?.avatar || '🎭'}</Text>
                </View>
              );
            })()}

            <View style={styles.membersPreview}>
              {groupMembers.slice(0, 3).map((member, index) => (
                <View key={member.id || index} style={[styles.memberAvatarContainer, {marginLeft: scale(index * -8)}]}>
                  {(() => {
                    const imageUri = ensureDataUri(member.avatar);
                    return imageUri ? (
                      <Image 
                        source={{uri: imageUri}} 
                        style={styles.memberAvatar}
                        onError={() => {
                          console.log('Failed to load member avatar:', member.name);
                          debugImageData(member.avatar, `Member ${member.name} Avatar`);
                        }}
                      />
                    ) : (
                      <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberAvatarText}>{member.name?.charAt(0).toUpperCase() || 'U'}</Text>
                      </View>
                    );
                  })()}
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.groupName}>{currentGroup?.name}</Text>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Group Summary</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primaryButton} />
          ) : balances[currentUserId || ''] ? (
            (() => {
              const userBalance = balances[currentUserId || ''];
              // Note: This helper is defined outside the component render
              const settlementsList = calculateSettlementsPlaceholder(balances, groupMembers, currentUserId);
              const youOwe = settlementsList.filter((s: any) => s.fromUserId === currentUserId);
              const owedToYou = settlementsList.filter((s: any) => s.toUserId === currentUserId);

              return (
                <View>
                  {userBalance.net === 0 ? (
                    <Text style={styles.summaryText}>You are all settled up in {currentGroup?.name}! 🎉</Text>
                  ) : userBalance.net > 0 ? (
                    <Text style={styles.summaryText}>
                      You get back total <Text style={styles.owedAmount}>₹{userBalance.net.toFixed(0)}</Text> in {currentGroup?.name}
                    </Text>
                  ) : (
                    <Text style={styles.summaryText}>
                      You owe total <Text style={styles.oweAmount}>₹{Math.abs(userBalance.net).toFixed(0)}</Text> in {currentGroup?.name}
                    </Text>
                  )}

                  {owedToYou.length > 0 && owedToYou.map((s: any) => (
                    <Text key={s.id} style={styles.summaryText}>
                      {s.from.replace(' (You)', '')} owes you <Text style={styles.owedAmount}>₹{s.amount.toFixed(0)}</Text>
                    </Text>
                  ))}

                  {youOwe.length > 0 && youOwe.map((s: any) => (
                    <Text key={s.id} style={styles.summaryText}>
                      You owe {s.to.replace(' (You)', '')} <Text style={styles.oweAmount}>₹{s.amount.toFixed(0)}</Text>
                    </Text>
                  ))}
                </View>
              );
            })()
          ) : (
            <Text style={styles.summaryText}>No expense data available</Text>
          )}
        </View>

        <View style={styles.tabContainer}>
          {TAB_CONFIG.map(tab => (
            <TouchableOpacity 
              key={tab.id} 
              style={[styles.tab, activeTab === tab.id && styles.activeTab]} 
              onPress={() => handleTabPress(tab.id)}
            >
              <View style={styles.tabContent}>
                <Ionicons 
                  name={activeTab === tab.id ? tab.activeIcon as any : tab.icon as any} 
                  size={scale(16)} 
                  color={activeTab === tab.id ? colors.primaryButton : colors.secondaryText}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContentContainer}>{renderTabContent()}</View>
      </ScrollView>

      <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('AddExpense', {group: currentGroup})}>
        <Ionicons name="add" size={scale(28)} color="#FFFFFF" />
      </TouchableOpacity>

      {/* --- UI IMPROVEMENT: MODAL ---
       Changed to a slide-up Bottom Sheet
      --- */}
      <Modal 
        visible={showGroupOptions} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setShowGroupOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPressOut={() => setShowGroupOptions(false)} // Use onPressOut to close
        >
          <View 
            style={styles.optionsMenu}
            onStartShouldSetResponder={() => true} // Prevents taps from closing modal
          >
            {/* Handle for Bottom Sheet */}
            <View style={styles.modalHandle} />

            <TouchableOpacity style={styles.optionItem} onPress={() => { setShowGroupOptions(false); handleAddMember(); }}>
              <MaterialIcons name="person-add" size={scale(20)} color={colors.secondaryText} style={styles.optionIconStyle} />
              <Text style={styles.optionText}>Add Member</Text>
            </TouchableOpacity>

            {isGroupAdmin ? (
              <>
                <TouchableOpacity style={styles.optionItem} onPress={() => { setShowGroupOptions(false); handleManageGroup(); }}>
                  <MaterialIcons name="group" size={scale(20)} color={colors.secondaryText} style={styles.optionIconStyle} />
                  <Text style={styles.optionText}>Manage Group</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionItem} onPress={() => { setShowGroupOptions(false); handleCompleteGroup(); }}>
                  <MaterialIcons name="check-circle" size={scale(20)} color={colors.success ?? '#10B981'} style={styles.optionIconStyle} />
                  <Text style={[styles.optionText, styles.completeText]}>Complete Group</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.optionItem} onPress={() => { setShowGroupOptions(false); handleLeaveGroup(); }}>
                <MaterialIcons name="logout" size={scale(20)} color={colors.error ?? '#EF4444'} style={styles.optionIconStyle} />
                <Text style={[styles.optionText, styles.leaveText]}>Leave Group</Text>
              </TouchableOpacity>
            )}

            {/* Cancel Button */}
            <View style={styles.cancelButtonContainer}>
              <TouchableOpacity 
                style={[styles.optionItem, styles.cancelButton]} 
                onPress={() => setShowGroupOptions(false)}
              >
                <Text style={[styles.optionText, styles.cancelText]}>Cancel</Text>
              </TouchableOpacity>
            </View>

          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// --- HELPER FUNCTION ---
// (Moved outside component for stability)
function calculateSettlementsPlaceholder(
  balances: Record<string, {net: number}>,
  members: Member[],
  currentUserId: string | null,
) {
  const arr: any[] = [];
  const entries = Object.entries(balances || {});
  
  // Create mutable copies for calculation
  const debtors = entries
    .filter(([, b]) => b.net < 0)
    .map(([id, b]) => ({id, net: b.net}));
  const creditors = entries
    .filter(([, b]) => b.net > 0)
    .map(([id, b]) => ({id, net: b.net}));

  debtors.forEach(d => {
    let remaining = Math.abs(d.net);
    for (const c of creditors) {
      if (remaining <= 0) break;
      const amt = Math.min(remaining, c.net);
      if (amt > 0) {
        const fromMember = members.find(m => m.userId === d.id) || {name: 'Unknown'};
        const toMember = members.find(m => m.userId === c.id) || {name: 'Unknown'};
        arr.push({
          id: `${d.id}-${c.id}`,
          fromUserId: d.id,
          toUserId: c.id,
          from: (fromMember.name || 'Unknown') + (d.id === currentUserId ? ' (You)' : ''),
          to: (toMember.name || 'Unknown') + (c.id === currentUserId ? ' (You)' : ''),
          amount: amt,
        });
        remaining -= amt;
        c.net -= amt; // This mutates the copy, which is correct for this algorithm
      }
    }
  });

  return arr;
}

// --- RESPONSIVE STYLESHEET ---
const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  scale: (size: number) => number,
  fonts: { [key: string]: number },
  insets: { top: number, bottom: number, left: number, right: number }
) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.background},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scale(16),
      paddingVertical: scale(12),
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0,
      borderBottomColor: colors.secondaryText,
    },
    headerTitle: {
      fontSize: fonts.header,
      fontWeight: '600',
      color: colors.primaryText,
    },
    backButton: {padding: scale(8)},
    settingsButton: {padding: scale(8)},
    groupInfo: {alignItems: 'center', paddingVertical: scale(20)},
    groupImageContainer: {position: 'relative', marginBottom: scale(12)},
    groupCoverImage: {width: scale(80), height: scale(80), borderRadius: scale(40)},
    groupAvatarContainer: {
      width: scale(80),
      height: scale(80),
      borderRadius: scale(40),
      backgroundColor: '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    groupAvatar: {fontSize: scale(40), textAlign: 'center'},
    membersPreview: {flexDirection: 'row', position: 'absolute', bottom: scale(-10), right: scale(-10)},
    memberAvatarContainer: {
      width: scale(24),
      height: scale(24),
      borderRadius: scale(12),
      borderWidth: scale(2),
      borderColor: '#FFFFFF',
      backgroundColor: '#FFFFFF',
      overflow: 'hidden', // Add overflow hidden
    },
    memberAvatar: {width: '100%', height: '100%'}, // Use 100%
    memberAvatarPlaceholder: {
      width: '100%', // Use 100%
      height: '100%', // Use 100%
      backgroundColor: colors.primaryButton,
      justifyContent: 'center',
      alignItems: 'center',
    },
    memberAvatarText: {fontSize: scale(10), fontWeight: 'bold', color: '#FFFFFF'},
    groupName: {fontSize: fonts.xl, fontWeight: '600', color: colors.primaryText}, // Scaled
    summarySection: {
      paddingHorizontal: scale(16),
      paddingVertical: scale(16),
      backgroundColor: colors.cardBackground,
      marginHorizontal: scale(16),
      borderRadius: scale(8),
      marginBottom: scale(20),
    },
    summaryTitle: {fontSize: fonts.subtitle, fontWeight: '600', color: colors.primaryText, marginBottom: scale(8)},
    summaryText: {fontSize: fonts.caption, color: colors.secondaryText, marginBottom: scale(4), lineHeight: fonts.caption * 1.5},
    oweAmount: {color: colors.error ?? '#EF4444', fontWeight: '600'},
    owedAmount: {color: colors.success ?? '#10B981', fontWeight: '600'},
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.inputBackground ?? '#E5E7EB',
      marginHorizontal: scale(16),
      backgroundColor: colors.cardBackground,
      borderRadius: scale(8),
      marginBottom: scale(16),
    },
    tab: {flex: 1, paddingVertical: scale(12), alignItems: 'center'},
    activeTab: {
      backgroundColor: colors.primaryButton + '20',
      borderRadius: scale(6),
      margin: scale(2),
    },
    tabContent: {
      alignItems: 'center',
    },
    tabIcon: {
      marginBottom: scale(4),
    },
    tabText: {fontSize: fonts.caption, color: colors.secondaryText},
    activeTabText: {color: colors.primaryButton, fontWeight: '600'},
    scrollContainer: {flex: 1},
    tabContentContainer: {paddingHorizontal: scale(16), paddingBottom: scale(100)},
    expenseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: scale(12),
      borderBottomWidth: 1,
      borderBottomColor: colors.background,
    },
    expenseIcon: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: scale(12),
    },
    expenseIconText: {fontSize: scale(18)},
    expenseDetails: {flex: 1, marginRight: scale(8)},
    expenseTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: scale(2),
    },
    expenseTitle: {fontSize: fonts.body, fontWeight: '500', color: colors.primaryText, flex: 1},
    statusTag: {
      paddingHorizontal: scale(8),
      paddingVertical: scale(2),
      borderRadius: scale(12),
      borderWidth: 1,
      marginLeft: scale(8),
    },
    statusTagText: {
      fontSize: fonts.xs,
      fontWeight: '600',
      textAlign: 'center',
    },
    expenseSubtitle: {fontSize: fonts.xs, color: colors.secondaryText, marginTop: scale(2)},
    expenseDate: {fontSize: fonts.xs, color: colors.secondaryText, marginTop: scale(2)},
    expenseAmounts: {alignItems: 'flex-end'},
    expenseAmount: {fontSize: fonts.body, fontWeight: '600', color: colors.primaryText},
    expenseShare: {fontSize: fonts.caption, color: colors.primaryButton, marginTop: scale(2)},
    balanceSection: {marginVertical: scale(8), backgroundColor: colors.cardBackground, borderRadius: scale(8)},
    balanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: scale(16),
      paddingHorizontal: scale(16),
    },
    balanceAvatar: {width: scale(40), height: scale(40), borderRadius: scale(20), marginRight: scale(12)},
    balanceInfo: {flex: 1, marginLeft: scale(4)},
    balanceName: {fontSize: fonts.body, color: colors.primaryText, fontWeight: '500'},
    balanceAmount: {fontSize: fonts.xl, fontWeight: '700'},
    balanceAvatarPlaceholder: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      backgroundColor: colors.primaryButton,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: scale(12),
    },
    balanceAvatarText: {color: '#FFFFFF', fontSize: fonts.body, fontWeight: 'bold'},
    balanceAmountContainer: {flexDirection: 'row', alignItems: 'center'},
    expandIcon: {marginLeft: scale(8)},
    breakdownContainer: {paddingLeft: scale(68), paddingRight: scale(16), paddingBottom: scale(16)}, // Aligned with name
    breakdownItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: scale(8)},
    breakdownAvatar: {width: scale(32), height: scale(32), borderRadius: scale(16), marginRight: scale(12)},
    breakdownAvatarPlaceholder: {
      width: scale(32),
      height: scale(32),
      borderRadius: scale(16),
      backgroundColor: colors.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: scale(12),
    },
    breakdownAvatarText: {fontSize: fonts.caption, fontWeight: '600', color: colors.primaryText},
    breakdownText: {fontSize: fonts.caption, color: colors.secondaryText, flex: 1},
    
    // Settlement styles
    settlementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: scale(16),
      paddingHorizontal: scale(16),
      backgroundColor: colors.cardBackground,
      borderRadius: scale(8),
      marginVertical: scale(4),
    },
    settlementInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settlementIcon: {
      marginRight: scale(12),
    },
    settlementText: {
      fontSize: fonts.body,
      color: colors.primaryText,
      flex: 1,
    },
    settlementName: {
      fontWeight: '600',
    },
    settlementAmount: {
      fontSize: fonts.lg,
      fontWeight: '600',
      color: colors.primaryButton,
      marginBottom: scale(4),
    },
    settlementTextContainer: {
      flex: 1,
    },
    settlementStatus: {
      fontSize: fonts.caption,
      color: colors.secondaryText,
      marginTop: scale(2),
    },
    settlementActions: {
      alignItems: 'flex-end',
    },
    settleButton: {
      backgroundColor: colors.primaryButton,
      paddingHorizontal: scale(16),
      paddingVertical: scale(6),
      borderRadius: scale(6),
      marginTop: scale(4),
    },
    settleButtonText: {
      color: colors.primaryButtonText,
      fontSize: fonts.caption,
      fontWeight: '600',
    },
    pendingButton: {
      backgroundColor: colors.warning || '#FFA500',
      paddingHorizontal: scale(16),
      paddingVertical: scale(6),
      borderRadius: scale(6),
      marginTop: scale(4),
    },
    pendingButtonText: {
      color: colors.primaryButtonText,
      fontSize: fonts.caption,
      fontWeight: '600',
    },
    confirmButton: {
      backgroundColor: colors.success || '#10B981',
      paddingHorizontal: scale(16),
      paddingVertical: scale(6),
      borderRadius: scale(6),
      marginTop: scale(4),
    },
    confirmButtonText: {
      color: colors.primaryButtonText,
      fontSize: fonts.caption,
      fontWeight: '600',
    },
    paidButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success || '#10B981',
      paddingHorizontal: scale(12),
      paddingVertical: scale(6),
      borderRadius: scale(6),
      marginTop: scale(4),
    },
    paidButtonText: {
      color: colors.primaryButtonText,
      fontSize: fonts.caption,
      fontWeight: '600',
      marginLeft: scale(4),
    },
    unpaidButton: {
      backgroundColor: colors.error || '#EF4444',
      paddingHorizontal: scale(12),
      paddingVertical: scale(6),
      borderRadius: scale(6),
      marginTop: scale(4),
    },
    unpaidButtonText: {
      color: colors.primaryButtonText,
      fontSize: fonts.caption,
      fontWeight: '600',
    },
    noActionText: {
      fontSize: fonts.caption,
      color: colors.secondaryText,
      fontStyle: 'italic',
    },
    sectionHeader: {
      fontSize: fonts.lg,
      fontWeight: '600',
      color: colors.primaryText,
      marginTop: scale(20),
      marginBottom: scale(12),
      paddingHorizontal: scale(16),
    },
    completedSettlementItem: {
      opacity: 0.7,
      borderLeftWidth: scale(3),
      borderLeftColor: colors.success,
    },
    
    floatingButton: {
      position: 'absolute',
      bottom: scale(20),
      right: scale(20),
      width: scale(56),
      height: scale(56),
      borderRadius: scale(28),
      backgroundColor: colors.primaryButton,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
    },
    
    // --- MODAL UI IMPROVEMENT ---
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    optionsMenu: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: scale(16),
      borderTopRightRadius: scale(16),
      paddingHorizontal: scale(16),
      paddingTop: scale(12), // Padding for the handle
      // Use safe area insets for bottom padding
      paddingBottom: insets.bottom === 0 ? scale(16) : insets.bottom, 
    },
    modalHandle: {
      width: scale(40),
      height: scale(5),
      backgroundColor: colors.secondaryText,
      borderRadius: scale(2.5),
      alignSelf: 'center',
      marginBottom: scale(16),
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: scale(16),
    },
    optionIconStyle: {marginRight: scale(16)},
    optionText: {fontSize: fonts.body, color: colors.primaryText},
    leaveText: {color: colors.error ?? '#EF4444'},
    deleteText: {color: colors.error ?? '#EF4444', fontWeight: '600'},
    completeText: {color: colors.success ?? '#10B981', fontWeight: '600'},
    cancelButtonContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.background,
      marginTop: scale(12),
      marginHorizontal: scale(-16), // Extend border to edges
    },
    cancelButton: {
      justifyContent: 'center',
      paddingHorizontal: scale(16), // Re-apply padding
    },
    cancelText: {
      color: colors.primaryButton, // Use primary color for cancel
      fontWeight: '600',
      textAlign: 'center',
      width: '100%',
    },
    // --- END MODAL UI IMPROVEMENT ---

    loadingContainer: {alignItems: 'center', paddingVertical: scale(32)},
    loadingText: {fontSize: fonts.body, color: colors.secondaryText, marginTop: scale(16)},
    noDataContainer: {alignItems: 'center', paddingVertical: scale(40)},
    noDataText: {fontSize: fonts.header, fontWeight: '600', color: colors.secondaryText, marginTop: scale(16)},
    noDataSubtext: {fontSize: fonts.caption, color: colors.secondaryText, marginTop: scale(8)},
  });
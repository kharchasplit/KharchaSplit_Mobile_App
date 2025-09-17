import React, {useEffect, useState, useCallback} from 'react'; // Added useCallback
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
  const {group} = route.params;
  const currentUserId = route.params?.currentUserId ?? null;

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

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'Expenses' | 'Balance' | 'Settlement'>(
    'Expenses',
  );
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>(route.params?.expenses || []);
  const [groupMembers, setGroupMembers] = useState<Member[]>(route.params?.members || []);
  const [balances, setBalances] = useState<Record<string, {net: number}>>(route.params?.balances || {});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);

  
  // --- LOGIC (Wrapped in useCallback) ---

  const loadGroupData = useCallback(async () => {
    setLoading(true);
    try {
      // keep route-provided data; in-app callers can pass real data
      setExpenses(route.params?.expenses || []);
      setGroupMembers(route.params?.members || []);
      setBalances(route.params?.balances || {});

      // simple admin heuristic: first member is admin (caller can override)
      const admin = (route.params?.members || [])[0];
      setIsGroupAdmin(admin?.userId === currentUserId);
    } catch (err) {
      console.error('Error loading group data (mock):', err);
      Alert.alert('Error', 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  }, [route.params, currentUserId]); // Dependencies for loadGroupData

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData, group]); // 'group' is still a trigger

  useEffect(() => {
    if (route.params?.reload) loadGroupData();
  }, [route.params?.reload, loadGroupData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  }, [loadGroupData]); // Depends on the stable loadGroupData

  // Handlers for group options
  const handleAddMember = useCallback(() => {
    navigation.navigate('AddMember', {group});
  }, [navigation, group]);

  const handleGroupDetails = useCallback(() => {
    navigation.navigate('GroupDetails', {group});
  }, [navigation, group]);

  const handleManageGroup = useCallback(() => {
    navigation.navigate('ManageGroup', {group});
  }, [navigation, group]);

  const handleDeleteGroup = useCallback(() => {
    Alert.alert('Delete Group', 'This will delete the group (not implemented in this mock).');
  }, []); // No dependencies

  const handleLeaveGroup = useCallback(() => {
    Alert.alert('Leave Group', 'You will leave the group (not implemented in this mock).');
  }, []); // No dependencies

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
            expense.participants?.find((p: any) => p.userId === currentUserId)
              ?.amount || 0;
          const date = expense.createdAt?.toDate
            ? expense.createdAt.toDate().toLocaleDateString()
            : 'Recent';

          return (
            <TouchableOpacity
              key={expense.id}
              style={styles.expenseItem}
              onPress={() =>
                navigation.navigate('ExpenseDetail', {expense, group})
              }>
              <View
                style={[styles.expenseIcon, {backgroundColor: category.color}]}>
                <Text style={styles.expenseIconText}>{category.emoji}</Text>
              </View>
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseTitle} numberOfLines={1}>{expense.description}</Text>
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
                {item.member.avatar ? (
                  <Image source={{uri: item.member.avatar}} style={styles.balanceAvatar} />
                ) : (
                  <View style={styles.balanceAvatarPlaceholder}>
                    <Text style={styles.balanceAvatarText}>
                      {item.member.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}

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
                      {b.avatar ? (
                        <Image source={{uri: b.avatar}} style={styles.breakdownAvatar} />
                      ) : (
                        <View style={styles.breakdownAvatarPlaceholder}>
                          <Text style={styles.breakdownAvatarText}>
                            {(b.fromUser || b.toUser || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
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
    if (loading || groupMembers.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryButton} />
          <Text style={styles.loadingText}>Loading settlements...</Text>
        </View>
      );
    }

    const expenseSettlements = []; // simplified placeholder
    if (expenseSettlements.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="checkmark-circle" size={scale(48)} color={colors.success} />
          <Text style={styles.noDataText}>All settled up!</Text>
          <Text style={styles.noDataSubtext}>No pending settlements</Text>
        </View>
      );
    }

    return <View><Text>Settlements</Text></View>; // Placeholder
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Expenses':
        return renderExpenses();
      case 'Balance':
        return renderBalance();
      case 'Settlement':
        return renderSettlement();
      default:
        return renderExpenses();
    }
  };

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
            {group?.coverImageUrl ? (
              <Image source={{uri: group.coverImageUrl}} style={styles.groupCoverImage} />
            ) : (
              <View style={styles.groupAvatarContainer}>
                <Text style={styles.groupAvatar}>{group?.avatar || '🎭'}</Text>
              </View>
            )}

            <View style={styles.membersPreview}>
              {groupMembers.slice(0, 3).map((member, index) => (
                <View key={member.id || index} style={[styles.memberAvatarContainer, {marginLeft: scale(index * -8)}]}>
                  {member.avatar ? (
                    <Image source={{uri: member.avatar}} style={styles.memberAvatar} />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Text style={styles.memberAvatarText}>{member.name?.charAt(0).toUpperCase() || 'U'}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.groupName}>{group?.name}</Text>
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
                    <Text style={styles.summaryText}>You are all settled up in {group?.name}! 🎉</Text>
                  ) : userBalance.net > 0 ? (
                    <Text style={styles.summaryText}>
                      You get back total <Text style={styles.owedAmount}>₹{userBalance.net.toFixed(0)}</Text> in {group?.name}
                    </Text>
                  ) : (
                    <Text style={styles.summaryText}>
                      You owe total <Text style={styles.oweAmount}>₹{Math.abs(userBalance.net).toFixed(0)}</Text> in {group?.name}
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
          {['Expenses', 'Balance', 'Settlement'].map(tab => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab as any)}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>{renderTabContent()}</View>
      </ScrollView>

      <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('AddExpense', {group})}>
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

            <TouchableOpacity style={styles.optionItem} onPress={() => { setShowGroupOptions(false); handleGroupDetails(); }}>
              <MaterialIcons name="info" size={scale(20)} color={colors.secondaryText} style={styles.optionIconStyle} />
              <Text style={styles.optionText}>Group Details</Text>
            </TouchableOpacity>

            {isGroupAdmin && (
              <TouchableOpacity style={styles.optionItem} onPress={() => { setShowGroupOptions(false); handleManageGroup(); }}>
                <MaterialIcons name="group" size={scale(20)} color={colors.secondaryText} style={styles.optionIconStyle} />
                <Text style={styles.optionText}>Manage Group</Text>
              </TouchableOpacity>
            )}

            {isGroupAdmin && (
              <TouchableOpacity style={styles.optionItem} onPress={() => { setShowGroupOptions(false); handleDeleteGroup(); }}>
                <MaterialIcons name="delete" size={scale(20)} color={colors.error ?? '#EF4444'} style={styles.optionIconStyle} />
                <Text style={[styles.optionText, styles.deleteText]}>Delete Group</Text>
              </TouchableOpacity>
            )}

            {!isGroupAdmin && (
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
    },
    tab: {flex: 1, paddingVertical: scale(12), alignItems: 'center'},
    activeTab: {borderBottomWidth: 2, borderBottomColor: colors.primaryButton},
    tabText: {fontSize: fonts.caption, color: colors.secondaryText},
    activeTabText: {color: colors.primaryButton, fontWeight: '600'},
    scrollContainer: {flex: 1},
    tabContent: {paddingHorizontal: scale(16), paddingBottom: scale(100)},
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
    expenseTitle: {fontSize: fonts.body, fontWeight: '500', color: colors.primaryText},
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
    
    // (Other settlement styles omitted for brevity)
    
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
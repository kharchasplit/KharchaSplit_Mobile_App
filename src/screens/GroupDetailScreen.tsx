import React, {useEffect, useState} from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {colors} from '../utils/colors';
import {SafeAreaView} from 'react-native-safe-area-context';

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
  const {group} = route.params;
  const currentUserId = route.params?.currentUserId ?? null;

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

  useEffect(() => {
    // load from route params (no firebase here)
    loadGroupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  useEffect(() => {
    if (route.params?.reload) loadGroupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.reload]);

  const loadGroupData = async () => {
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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  };

  // Handlers for group options (kept simple so screen is self-contained)
  const handleAddMember = () => {
    navigation.navigate('AddMember', {group});
  };

  const handleGroupDetails = () => {
    navigation.navigate('GroupDetails', {group});
  };

  const handleManageGroup = () => {
    navigation.navigate('ManageGroup', {group});
  };

  const handleDeleteGroup = () => {
    Alert.alert('Delete Group', 'This will delete the group (not implemented in this mock).');
  };

  const handleLeaveGroup = () => {
    Alert.alert('Leave Group', 'You will leave the group (not implemented in this mock).');
  };

  const categoryMapping: Record<number | string, {emoji: string; color: string}> = {
    1: {emoji: '🍽️', color: '#FEF3C7'},
    2: {emoji: '🚗', color: '#FECACA'},
    3: {emoji: '🛍️', color: '#E0E7FF'},
    default: {emoji: '💰', color: '#F3F4F6'},
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev => ({...prev, [userId]: !prev[userId]}));
  };

  const getBalanceBreakdown = (targetUserId: string) => {
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
  };

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
          <Ionicons name="receipt" size={48} color={colors.secondaryText} />
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
                <Text style={styles.expenseTitle}>{expense.description}</Text>
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
          <Ionicons name="wallet" size={48} color={colors.secondaryText} />
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
                  <Text style={styles.balanceName}>
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
                      size={20}
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
                      <Text style={styles.breakdownText}>{b.text}</Text>
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
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          <Text style={styles.noDataText}>All settled up!</Text>
          <Text style={styles.noDataSubtext}>No pending settlements</Text>
        </View>
      );
    }

    return <View><Text>Settlements</Text></View>;
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

  const styles = createStyles();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Details</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowGroupOptions(true)}>
          <Ionicons name="settings" size={20} color={colors.secondaryText} />
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
                <View key={member.id || index} style={[styles.memberAvatarContainer, {marginLeft: index * -8}]}>
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
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={showGroupOptions} transparent animationType="fade" onRequestClose={() => setShowGroupOptions(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowGroupOptions(false)}>
          <View style={styles.optionsMenu}>
            <TouchableOpacity style={styles.optionItem} onPress={() => { setShowGroupOptions(false); handleAddMember(); }}>
              <MaterialIcons name="person-add" size={16} color={colors.secondaryText} style={styles.optionIconStyle} />
              <Text style={styles.optionText}>Add Member</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={() => { setShowGroupOptions(false); handleGroupDetails(); }}>
              <MaterialIcons name="info" size={16} color={colors.secondaryText} style={styles.optionIconStyle} />
              <Text style={styles.optionText}>Group Details</Text>
            </TouchableOpacity>

            {isGroupAdmin && (
              <TouchableOpacity style={styles.optionItem} onPress={() => { setShowGroupOptions(false); handleManageGroup(); }}>
                <MaterialIcons name="group" size={16} color={colors.secondaryText} style={styles.optionIconStyle} />
                <Text style={styles.optionText}>Manage Group</Text>
              </TouchableOpacity>
            )}

            {isGroupAdmin && (
              <TouchableOpacity style={styles.optionItem} onPress={() => { setShowGroupOptions(false); handleDeleteGroup(); }}>
                <MaterialIcons name="delete" size={16} color={colors.error ?? '#EF4444'} style={styles.optionIconStyle} />
                <Text style={[styles.optionText, styles.deleteText]}>Delete Group</Text>
              </TouchableOpacity>
            )}

            {!isGroupAdmin && (
              <TouchableOpacity style={styles.optionItem} onPress={() => { setShowGroupOptions(false); handleLeaveGroup(); }}>
                <MaterialIcons name="logout" size={16} color={colors.error ?? '#EF4444'} style={styles.optionIconStyle} />
                <Text style={[styles.optionText, styles.leaveText]}>Leave Group</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// small helper: simple settlement placeholder used in summary section
function calculateSettlementsPlaceholder(
  balances: Record<string, {net: number}>,
  members: Member[],
  currentUserId: string | null,
) {
  const arr: any[] = [];
  const entries = Object.entries(balances || {});
  const debtors = entries.filter(([, b]) => b.net < 0).map(([id, b]) => ({id, net: b.net}));
  const creditors = entries.filter(([, b]) => b.net > 0).map(([id, b]) => ({id, net: b.net}));

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
        c.net -= amt;
      }
    }
  });

  return arr;
}

const createStyles = () =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.background},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondaryText,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primaryText,
    },
    backButton: {padding: 8},
    settingsButton: {padding: 8},
    groupInfo: {alignItems: 'center', paddingVertical: 20},
    groupImageContainer: {position: 'relative', marginBottom: 12},
    groupCoverImage: {width: 80, height: 80, borderRadius: 40},
    groupAvatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    groupAvatar: {fontSize: 40, textAlign: 'center'},
    membersPreview: {flexDirection: 'row', position: 'absolute', bottom: -10, right: -10},
    memberAvatarContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      backgroundColor: '#FFFFFF',
    },
    memberAvatar: {width: 20, height: 20, borderRadius: 10},
  memberAvatarPlaceholder: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.primaryButton,
      justifyContent: 'center',
      alignItems: 'center',
    },
    memberAvatarText: {fontSize: 10, fontWeight: 'bold', color: '#FFFFFF'},
    groupName: {fontSize: 20, fontWeight: '600', color: colors.primaryText},
    summarySection: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: colors.cardBackground,
      marginHorizontal: 16,
      borderRadius: 8,
      marginBottom: 20,
    },
  summaryTitle: {fontSize: 16, fontWeight: '600', color: colors.primaryText, marginBottom: 8},
  summaryText: {fontSize: 14, color: colors.secondaryText, marginBottom: 4},
    oweAmount: {color: '#EF4444', fontWeight: '600'},
    owedAmount: {color: '#10B981', fontWeight: '600'},
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      marginHorizontal: 16,
    },
    tab: {flex: 1, paddingVertical: 12, alignItems: 'center'},
    activeTab: {borderBottomWidth: 2, borderBottomColor: '#4F46E5'},
    tabText: {fontSize: 14, color: '#6B7280'},
    activeTabText: {color: '#4F46E5', fontWeight: '600'},
    scrollContainer: {flex: 1},
    tabContent: {paddingHorizontal: 16, paddingBottom: 100},
    expenseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    expenseIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    expenseIconText: {fontSize: 18},
    expenseDetails: {flex: 1},
    expenseTitle: {fontSize: 16, fontWeight: '500', color: '#2D3748'},
    expenseSubtitle: {fontSize: 12, color: '#6B7280', marginTop: 2},
    expenseDate: {fontSize: 12, color: '#9CA3AF', marginTop: 2},
    expenseAmounts: {alignItems: 'flex-end'},
    expenseAmount: {fontSize: 16, fontWeight: '600', color: '#2D3748'},
    expenseShare: {fontSize: 12, color: '#4F46E5', marginTop: 2},
    balanceSection: {marginVertical: 8},
    balanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    balanceAvatar: {width: 40, height: 40, borderRadius: 20, marginRight: 12},
    balanceInfo: {flex: 1, marginLeft: 4},
    balanceName: {fontSize: 16, color: '#374151', fontWeight: '500'},
    balanceAmount: {fontSize: 20, fontWeight: '700'},
    balanceAvatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
  backgroundColor: colors.primaryButton,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    balanceAvatarText: {color: '#FFFFFF', fontSize: 16, fontWeight: 'bold'},
    balanceAmountContainer: {flexDirection: 'row', alignItems: 'center'},
  expandIcon: {marginLeft: 8},
    breakdownContainer: {paddingLeft: 32, paddingRight: 16, paddingBottom: 16},
    breakdownItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8},
    breakdownAvatar: {width: 32, height: 32, borderRadius: 16, marginRight: 12},
    breakdownAvatarPlaceholder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    breakdownAvatarText: {fontSize: 14, fontWeight: '600', color: '#374151'},
    breakdownText: {fontSize: 14, color: '#6B7280', flex: 1},
  settlementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginVertical: 4,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      shadowColor: colors.primaryText,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    settlementAvatar: {width: 40, height: 40, borderRadius: 20, marginRight: 12},
    settlementDetails: {flex: 1},
    settlementText: {fontSize: 16, color: '#2D3748', fontWeight: '500'},
    settleButton: {
      backgroundColor: '#4F46E5',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    settleButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '600'},
    sectionHeaderText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primaryText,
      marginTop: 16,
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    settlementAmount: {color: '#EF4444', fontWeight: '700'},
    settlementAmountGreen: {color: '#10B981', fontWeight: '700'},
    settledItem: {opacity: 0.7, backgroundColor: '#F9FAFB'},
    settledText: {color: '#6B7280'},
    settledTimestamp: {fontSize: 12, color: '#9CA3AF', marginTop: 4},
    settledBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F0FDF4',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    settledBadgeText: {
      fontSize: 12,
      color: '#10B981',
      fontWeight: '600',
      marginLeft: 4,
    },
    floatingButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#4F46E5',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionsMenu: {
  backgroundColor: colors.cardBackground,
      borderRadius: 8,
      paddingVertical: 8,
      minWidth: 200,
      elevation: 8,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    optionIconStyle: {marginRight: 12},
    optionText: {fontSize: 14, color: colors.primaryText},
    leaveText: {color: '#EF4444'},
    deleteText: {color: '#EF4444', fontWeight: '600'},
    loadingContainer: {alignItems: 'center', paddingVertical: 32},
  loadingText: {fontSize: 16, color: colors.secondaryText, marginTop: 16},
    noDataContainer: {alignItems: 'center', paddingVertical: 40},
  noDataText: {fontSize: 18, fontWeight: '600', color: colors.secondaryText, marginTop: 16},
  noDataSubtext: {fontSize: 14, color: colors.secondaryText, marginTop: 8},
  });


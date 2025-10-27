import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebaseService, Settlement } from '../services/firebaseService';
import { useFocusEffect } from '@react-navigation/native';

interface PaymentHistoryItem {
  id: string;
  type: 'paid' | 'received';
  amount: number;
  date: Date;
  groupName: string;
  groupId: string;
  fromUser: string;
  toUser: string;
  fromUserId: string;
  toUserId: string;
  status: 'unpaid' | 'pending' | 'paid';
  settlement: Settlement;
}

interface Props {
  navigation: any;
}

export const PaymentHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const baseWidth = 375;
  const scale = (size: number) => (screenWidth / baseWidth) * size;
  const styles = createStyles(colors, scale);
  
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'paid' | 'received' | 'pending'>('all');

  const loadPaymentHistory = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      
      // Get all settlements for the user
      const settlements = await firebaseService.getAllUserSettlements(user.id);
      
      // Get all user groups to get group names
      const userGroups = await firebaseService.getUserGroups(user.id);
      const groupMap = new Map(userGroups.map(group => [group.id, group.name]));
      
      // Transform settlements to payment history items
      const payments: PaymentHistoryItem[] = settlements.map(settlement => {
        const isUserPayer = settlement.fromUserId === user.id;
        const isUserReceiver = settlement.toUserId === user.id;
        
        return {
          id: settlement.id || '',
          type: isUserPayer ? 'paid' : 'received',
          amount: settlement.amount,
          date: new Date(settlement.createdAt),
          groupName: groupMap.get(settlement.groupId) || 'Unknown Group',
          groupId: settlement.groupId,
          fromUser: isUserPayer ? 'You' : settlement.fromUserName,
          toUser: isUserReceiver ? 'You' : settlement.toUserName,
          fromUserId: settlement.fromUserId,
          toUserId: settlement.toUserId,
          status: settlement.status,
          settlement,
        };
      });
      
      setPaymentHistory(payments);
    } catch (error) {
      console.error('Error loading payment history:', error);
      Alert.alert('Error', 'Failed to load payment history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPaymentHistory();
  }, [loadPaymentHistory]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadPaymentHistory();
      }
    }, [loadPaymentHistory, loading])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPaymentHistory();
  }, [loadPaymentHistory]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getFilteredPayments = () => {
    if (filterType === 'all') return paymentHistory;
    if (filterType === 'paid') return paymentHistory.filter(p => p.type === 'paid' && p.status === 'paid');
    if (filterType === 'received') return paymentHistory.filter(p => p.type === 'received' && p.status === 'paid');
    if (filterType === 'pending') return paymentHistory.filter(p => p.status === 'pending');
    return paymentHistory;
  };

  const generatePaymentSummary = () => {
    const totalPaid = paymentHistory
      .filter(p => p.type === 'paid' && p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalReceived = paymentHistory
      .filter(p => p.type === 'received' && p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalPending = paymentHistory
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPaid,
      totalReceived,
      totalPending,
      netBalance: totalReceived - totalPaid,
    };
  };

  const shareIndividualPayment = async (payment: PaymentHistoryItem) => {
    try {
      const otherUser = payment.type === 'paid' ? payment.toUser : payment.fromUser;
      const action = payment.type === 'paid' ? 'Paid to' : 'Received from';
      const amountSymbol = payment.type === 'paid' ? '-' : '+';
      const statusText = payment.status === 'paid' ? 'Completed' : payment.status === 'pending' ? 'Pending Confirmation' : 'Unpaid';

      let shareText = `💰 Payment Transaction - KharchaSplit\n\n`;
      shareText += `📄 Transaction Details:\n`;
      shareText += `• ${action}: ${otherUser}\n`;
      shareText += `• Amount: ${amountSymbol}₹${payment.amount.toFixed(2)}\n`;
      shareText += `• Group: ${payment.groupName}\n`;
      shareText += `• Status: ${statusText}\n`;
      shareText += `• Date: ${formatDate(payment.date)}\n`;
      shareText += `\n🚀 Manage expenses easily with KharchaSplit app!`;

      await Share.share({
        message: shareText,
        title: `Payment ${payment.type === 'paid' ? 'Sent' : 'Received'} - KharchaSplit`,
      });
    } catch (error) {
      console.error('Error sharing payment:', error);
      Alert.alert('Error', 'Failed to share payment details');
    }
  };
  
  const handlePaymentPress = (payment: PaymentHistoryItem) => {
    // Navigate to group detail screen
    navigation.navigate('GroupDetail', {
      group: { id: payment.groupId, name: payment.groupName },
      currentUserId: user?.id,
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return colors.success;
      case 'pending': return colors.warning;
      case 'unpaid': return colors.error;
      default: return colors.secondaryText;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Completed';
      case 'pending': return 'Pending';
      case 'unpaid': return 'Unpaid';
      default: return status;
    }
  };

  const filteredPayments = getFilteredPayments();
  const summary = generatePaymentSummary();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.statusBarBackground} 
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scale(24)} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={loading || refreshing}
        >
          <MaterialIcons 
            name="refresh" 
            size={scale(24)} 
            color={loading || refreshing ? colors.secondaryText : colors.primaryButton} 
          />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={[styles.summaryAmount, { color: colors.error }]}>
            ₹{summary.totalPaid.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Received</Text>
          <Text style={[styles.summaryAmount, { color: colors.success }]}>
            ₹{summary.totalReceived.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryAmount, { color: colors.warning }]}>
            ₹{summary.totalPending.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Net Balance</Text>
          <Text
            style={[
              styles.summaryAmount,
              { color: summary.netBalance >= 0 ? colors.success : colors.error },
            ]}>
            {summary.netBalance >= 0 ? '+' : ''}₹{summary.netBalance.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'paid', 'received', 'pending'].map(type => {
          let count = 0;
          if (type === 'all') {
            count = paymentHistory.length;
          } else if (type === 'paid') {
            count = paymentHistory.filter(p => p.type === 'paid' && p.status === 'paid').length;
          } else if (type === 'received') {
            count = paymentHistory.filter(p => p.type === 'received' && p.status === 'paid').length;
          } else if (type === 'pending') {
            count = paymentHistory.filter(p => p.status === 'pending').length;
          }
          
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterTab,
                filterType === type && styles.activeFilterTab,
              ]}
              onPress={() => setFilterType(type as 'all' | 'paid' | 'received' | 'pending')}>
              <Text
                style={[
                  styles.filterText,
                  filterType === type && styles.activeFilterText,
                ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primaryButton]}
            tintColor={colors.primaryButton}
          />
        }>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryButton} />
            <Text style={styles.loadingText}>Loading payment history...</Text>
          </View>
        ) : filteredPayments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="payment" size={scale(64)} color={colors.secondaryText} />
            <Text style={styles.emptyText}>No {filterType === 'all' ? 'payment history' : `${filterType} payments`}</Text>
            <Text style={styles.emptySubtext}>
              {filterType === 'all' 
                ? 'Your payment history will appear here once you start settling expenses'
                : `No ${filterType} payments found`
              }
            </Text>
          </View>
        ) : (
          filteredPayments.map(payment => (
            <TouchableOpacity 
              key={payment.id} 
              style={styles.paymentCard}
              onPress={() => handlePaymentPress(payment)}
              activeOpacity={0.7}
            >
              <View style={styles.paymentHeader}>
                <View
                  style={[
                    styles.paymentIcon,
                    { backgroundColor: payment.type === 'paid' ? '#FEE2E2' : '#DCFCE7' },
                  ]}>
                  <MaterialIcons
                    name={payment.type === 'paid' ? 'arrow-upward' : 'arrow-downward'}
                    size={scale(24)}
                    color={payment.type === 'paid' ? colors.error : colors.success}
                  />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>
                    {payment.type === 'paid' ? 'Paid to' : 'Received from'}{' '}
                    {payment.type === 'paid' ? payment.toUser : payment.fromUser}
                  </Text>
                  <Text style={styles.paymentGroup}>in {payment.groupName}</Text>
                  <View style={styles.paymentMeta}>
                    <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                        {getStatusText(payment.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.paymentAmount}>
                  <Text
                    style={[
                      styles.amountText,
                      { color: payment.type === 'paid' ? colors.error : colors.success },
                    ]}>
                    {payment.type === 'paid' ? '-' : '+'}₹{payment.amount.toFixed(0)}
                  </Text>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      shareIndividualPayment(payment);
                    }}
                    activeOpacity={0.6}>
                    <Ionicons
                      name="share-outline"
                      size={scale(18)}
                      color={colors.primaryButton}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors'], scale: (size: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 0,
    borderBottomColor: colors.secondaryText,
  },
  backButton: { padding: scale(8) },
  headerTitle: { fontSize: scale(18), fontWeight: '600', color: colors.primaryText },
  refreshButton: { padding: scale(8) },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    backgroundColor: colors.cardBackground,
  },
  summaryCard: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: scale(12), color: colors.secondaryText, marginBottom: scale(4) },
  summaryAmount: { fontSize: scale(16), fontWeight: 'bold' },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
  },
  filterTab: { flex: 1, padding: 8, borderRadius: 20, alignItems: 'center' },
  activeFilterTab: { backgroundColor: colors.primaryButton },
  filterText: { fontSize: 14, color: colors.secondaryText },
  activeFilterText: { color: colors.primaryButtonText },
  scrollView: { flex: 1 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 16, color: colors.secondaryText, marginTop: 16 },
  emptyContainer: { alignItems: 'center', paddingVertical: scale(60) },
  emptyText: { fontSize: scale(18), fontWeight: '600', color: colors.secondaryText, marginTop: scale(16) },
  emptySubtext: { fontSize: scale(14), color: colors.secondaryText, textAlign: 'center', marginTop: scale(8), paddingHorizontal: scale(40) },
  paymentCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: scale(16),
    marginVertical: scale(6),
    padding: scale(16),
    borderRadius: scale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentHeader: { flexDirection: 'row', alignItems: 'center' },
  paymentIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  paymentInfo: { flex: 1 },
  paymentTitle: { fontSize: scale(16), fontWeight: '600', color: colors.primaryText },
  paymentGroup: { fontSize: scale(14), color: colors.secondaryText, marginTop: scale(2) },
  paymentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: scale(4) },
  paymentDate: { fontSize: scale(12), color: colors.secondaryText },
  statusBadge: { paddingHorizontal: scale(8), paddingVertical: scale(2), borderRadius: scale(10) },
  statusText: { fontSize: scale(10), fontWeight: '600', textTransform: 'uppercase' },
  paymentAmount: { alignItems: 'flex-end' },
  amountText: { fontSize: scale(18), fontWeight: 'bold', marginBottom: scale(8) },
  shareButton: {
    padding: scale(6),
    borderRadius: scale(15),
    borderWidth: 1,
    borderColor: colors.primaryButton + '40',
    backgroundColor: colors.primaryButton + '10',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    backgroundColor: colors.cardBackground,
  },
  filterTab: { flex: 1, padding: scale(8), borderRadius: scale(20), alignItems: 'center', marginHorizontal: scale(2) },
  activeFilterTab: { backgroundColor: colors.primaryButton },
  filterText: { fontSize: scale(12), color: colors.secondaryText, fontWeight: '500' },
  activeFilterText: { color: colors.primaryButtonText, fontWeight: '600' },
});


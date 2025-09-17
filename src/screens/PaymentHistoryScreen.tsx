import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Payment {
  id: string;
  type: 'paid' | 'received';
  amount: number;
  date: Date;
  groupName: string;
  fromUser: string;
  toUser: string;
  description?: string;
  isPaid: boolean;
  isReceived: boolean;
}

interface Props {
  onClose: () => void;
}

export const PaymentHistoryScreen: React.FC<Props> = ({ onClose }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [paymentHistory] = useState<Payment[]>([
    {
      id: '1',
      type: 'paid',
      amount: 500,
      date: new Date(),
      groupName: 'Flatmates',
      fromUser: 'You',
      toUser: 'Ravi',
      description: 'Dinner',
      isPaid: true,
      isReceived: false,
    },
    {
      id: '2',
      type: 'received',
      amount: 300,
      date: new Date(),
      groupName: 'Trip',
      fromUser: 'Aman',
      toUser: 'You',
      description: 'Snacks',
      isPaid: false,
      isReceived: true,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'paid' | 'received'>(
    'all',
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000); // mock refresh
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getFilteredPayments = () => {
    if (filterType === 'all') return paymentHistory;
    if (filterType === 'paid') return paymentHistory.filter(p => p.isPaid);
    if (filterType === 'received') return paymentHistory.filter(p => p.isReceived);
    return paymentHistory;
  };

  const generatePaymentSummary = () => {
    const totalPaid = paymentHistory
      .filter(p => p.isPaid)
      .reduce((sum, p) => sum + p.amount, 0);

    const totalReceived = paymentHistory
      .filter(p => p.isReceived)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPaid,
      totalReceived,
      netBalance: totalReceived - totalPaid,
    };
  };

  const shareIndividualPayment = async (payment: Payment) => {
    try {
      const otherUser = payment.isPaid ? payment.toUser : payment.fromUser;
      const action = payment.isPaid ? 'Paid to' : 'Received from';
      const amountSymbol = payment.isPaid ? '-' : '+';

      let shareText = `💰 Payment Transaction - Splitzy\n\n`;
      shareText += `📄 Transaction Details:\n`;
      shareText += `• ${action}: ${otherUser}\n`;
      shareText += `• Amount: ${amountSymbol}₹${payment.amount.toFixed(2)}\n`;
      shareText += `• Group: ${payment.groupName}\n`;
      shareText += `• Date: ${formatDate(payment.date)}\n`;
      shareText += `\n🚀 Manage expenses easily with Splitzy app!`;

      await Share.share({
        message: shareText,
        title: `Payment ${payment.isPaid ? 'Sent' : 'Received'} - Splitzy`,
      });
    } catch (error) {
      console.error('Error sharing payment:', error);
    }
  };

  const filteredPayments = getFilteredPayments();
  const summary = generatePaymentSummary();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={[styles.summaryAmount, { color: colors.warning }]}>
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
          <Text style={styles.summaryLabel}>Net Balance</Text>
          <Text
            style={[
              styles.summaryAmount,
              { color: summary.netBalance >= 0 ? colors.success : colors.warning },
            ]}>
            ₹{Math.abs(summary.netBalance).toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'paid', 'received'].map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterTab,
              filterType === type && styles.activeFilterTab,
            ]}
            onPress={() => setFilterType(type as 'all' | 'paid' | 'received')}>
            <Text
              style={[
                styles.filterText,
                filterType === type && styles.activeFilterText,
              ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)} (
              {type === 'all'
                ? paymentHistory.length
                : paymentHistory.filter(p =>
                    type === 'paid' ? p.isPaid : p.isReceived,
                  ).length}
              )
            </Text>
          </TouchableOpacity>
        ))}
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
            <MaterialIcons name="payment" size={64} color={colors.secondaryText} />
            <Text style={styles.emptyText}>No payment history</Text>
          </View>
        ) : (
          filteredPayments.map(payment => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View
                  style={[
                    styles.paymentIcon,
                    { backgroundColor: payment.isPaid ? '#FEF3C7' : '#D1FAE5' },
                  ]}>
                  <MaterialIcons
                    name={payment.isPaid ? 'arrow-upward' : 'arrow-downward'}
                    size={24}
                    color={payment.isPaid ? colors.warning : colors.success}
                  />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>
                    {payment.isPaid ? 'Paid to' : 'Received from'}{' '}
                    {payment.isPaid ? payment.toUser : payment.fromUser}
                  </Text>
                  <Text style={styles.paymentGroup}>in {payment.groupName}</Text>
                  <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
                </View>
                <View style={styles.paymentAmount}>
                  <Text
                    style={[
                      styles.amountText,
                      { color: payment.isPaid ? colors.warning : colors.success },
                    ]}>
                    {payment.isPaid ? '-' : '+'}₹{payment.amount.toFixed(0)}
                  </Text>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => shareIndividualPayment(payment)}
                    activeOpacity={0.6}>
                    <Ionicons
                      name="share-outline"
                      size={22}
                      color={colors.primaryButton}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {payment.description && (
                <Text style={styles.paymentDescription}>{payment.description}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
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
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText },
  headerSpacer: { width: 40 },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
  },
  summaryCard: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: colors.secondaryText, marginBottom: 4 },
  summaryAmount: { fontSize: 18, fontWeight: 'bold' },
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
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.secondaryText },
  paymentCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
  },
  paymentHeader: { flexDirection: 'row', alignItems: 'center' },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: { flex: 1 },
  paymentTitle: { fontSize: 16, fontWeight: '600', color: colors.primaryText },
  paymentGroup: { fontSize: 14, color: colors.secondaryText },
  paymentDate: { fontSize: 12, color: colors.inactiveIcon },
  paymentAmount: { alignItems: 'flex-end' },
  amountText: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  shareButton: {
    padding: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primaryButton,
  },
  paymentDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.inactiveIcon,
  },
});


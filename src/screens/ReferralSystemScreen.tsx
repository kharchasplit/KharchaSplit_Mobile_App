import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebaseService, ReferralData } from '../services/firebaseService';
import { userStorage } from '../services/userStorage';

type Props = {
  onClose: () => void;
};

export const ReferralSystemScreen: React.FC<Props> = ({ onClose }) => {
  const { colors } = useTheme();
  const { user, login } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Generate a default referral code when Firebase data is not available
  const generateDefaultReferralCode = useCallback((): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'KS'; // Prefix for KharchaSplit
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  const loadReferralData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // TEMPORARY: Skip Firebase referral collection completely and use fallback approach

    try {
      // Check if user already has a referral code in their profile
      let referralCode = user.referralCode;

      // If user doesn't have a referral code, generate one and save to Firebase
      if (!referralCode) {
        referralCode = generateDefaultReferralCode();

        try {
          // Save the generated referral code to user profile in Firebase
          const updatedUser = await firebaseService.updateUser(user.id, { referralCode });

          // Update local storage and AuthContext to include the new referral code
          await userStorage.saveUser(updatedUser);
          login(updatedUser);
        } catch (updateError) {
          console.error('Failed to save referral code to Firebase:', updateError);
          // Continue with local display even if Firebase save fails
        }
      }

      // Try to load referral history directly from users collection as fallback
      let referralHistory: any[] = [];
      let totalReferrals = 0;
      let successfulReferrals = 0;
      let pendingReferrals = 0;

      try {
        const referredUsersSnapshot = await firebaseService.usersCollection
          .where('referredBy', '==', user.id)
          .where('isActive', '==', true)
          .get();

        referredUsersSnapshot.docs.forEach((doc) => {
          const userData = doc.data() as any;
          referralHistory.push({
            id: doc.id,
            referredUserId: doc.id,
            referredUserName: userData.firstName || userData.name || 'New User',
            referredUserPhone: userData.phoneNumber,
            createdAt: userData.createdAt,
            status: 'completed', // All existing users are considered completed
            updatedAt: userData.updatedAt,
          });
        });

        // Calculate statistics from actual data
        totalReferrals = referralHistory.length;
        successfulReferrals = referralHistory.filter(r => r.status === 'completed').length;
        pendingReferrals = referralHistory.filter(r => r.status === 'pending').length;

      } catch (historyError) {
        console.error('Failed to load referral history from users collection:', historyError);
        // Keep default empty values
      }

      // Create default referral data with the referral code and actual history (if loaded)
      const defaultReferralData: ReferralData = {
        userId: user.id,
        referralCode,
        totalReferrals,
        successfulReferrals,
        pendingReferrals,
        referralHistory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setReferralData(defaultReferralData);
    } catch (fallbackError) {
      console.error('Error in fallback referral data loading:', fallbackError);

      // Even if everything fails, show basic referral code
      const basicReferralData: ReferralData = {
        userId: user.id,
        referralCode: user.referralCode || generateDefaultReferralCode(),
        totalReferrals: 0,
        successfulReferrals: 0,
        pendingReferrals: 0,
        referralHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setReferralData(basicReferralData);
    } finally {
      setLoading(false);
    }
  }, [user, generateDefaultReferralCode, login]);

  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadReferralData();
    } catch (error) {
      console.error('Error during refresh:', error);
      // loadReferralData already handles errors by setting default data
    } finally {
      setRefreshing(false);
    }
  };

  const copyReferralCode = () => {
    if (!referralData) return;

    try {
      Clipboard.setString(referralData.referralCode);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const shareReferralCode = async () => {
    if (!referralData) return;

    try {
      const shareMessage = `🎉 Join me on KharchaSplit!\n\nUse my referral code: ${referralData.referralCode}`;
      await Share.share({
        message: shareMessage,
        title: 'Join KharchaSplit with my referral code!',
      });
    } catch (error) {
      console.error('Error sharing referral code:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'failed':
        return colors.error;
      default:
        return colors.secondaryText;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral System</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryButton} />
            <Text style={styles.loadingText}>Loading referral data...</Text>
          </View>
        ) : referralData ? (
          <>
            {/* Referral Code Card */}
            <View style={styles.codeCard}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeTitle}>Your Referral Code</Text>
                <View style={styles.giftIcon}>
                  <MaterialIcons
                    name="card-giftcard"
                    size={24}
                    color={colors.primaryButton}
                  />
                </View>
              </View>

              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{referralData.referralCode}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyReferralCode}
                >
                  <MaterialIcons
                    name="content-copy"
                    size={20}
                    color={colors.primaryButton}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={shareReferralCode}
              >
                <Ionicons name="share" size={20} color={colors.primaryButtonText} />
                <Text style={styles.shareButtonText}>Share with Friends</Text>
              </TouchableOpacity>
            </View>

            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {referralData.totalReferrals}
                </Text>
                <Text style={styles.statLabel}>Total Referrals</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: colors.success }]}>
                  {referralData.successfulReferrals}
                </Text>
                <Text style={styles.statLabel}>Successful</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: colors.warning }]}>
                  {referralData.pendingReferrals}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            {/* Referral History */}
            <View style={styles.historyCard}>
              <Text style={styles.sectionTitle}>Referral History</Text>

              {referralData.referralHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons
                    name="people"
                    size={64}
                    color={colors.secondaryText}
                  />
                  <Text style={styles.emptyText}>No referrals yet</Text>
                  <Text style={styles.emptySubtext}>
                    Share your code to start earning referrals!
                  </Text>
                </View>
              ) : (
                referralData.referralHistory.map((referral) => (
                  <View key={referral.id} style={styles.referralItem}>
                    <View style={styles.referralInfo}>
                      <Text style={styles.referralName}>
                        {referral.referredUserName || 'New User'}
                      </Text>
                      <Text style={styles.referralDate}>
                        Joined {formatDate(referral.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.referralStatus}>
                      <Ionicons
                        name={getStatusIcon(referral.status)}
                        size={20}
                        color={getStatusColor(referral.status)}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(referral.status) },
                        ]}
                      >
                        {referral.status}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <MaterialIcons name="error-outline" size={64} color={colors.secondaryText} />
            <Text style={styles.loadingText}>Unable to load referral data</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadReferralData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
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
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primaryText,
    },
    headerSpacer: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 16,
      color: colors.secondaryText,
      marginTop: 16,
    },
    codeCard: {
      backgroundColor: colors.cardBackground,
      margin: 16,
      padding: 20,
      borderRadius: 16,
    },
    codeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    codeTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primaryText,
    },
    giftIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primaryButton}30`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    codeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    codeText: {
      flex: 1,
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primaryButton,
      letterSpacing: 2,
      textAlign: 'center',
    },
    copyButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
    },
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryButton,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    shareButtonText: {
      color: colors.primaryButtonText,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      alignItems: 'center',
      paddingVertical: 20,
      marginHorizontal: 4,
      borderRadius: 12,
    },
    statNumber: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primaryButton,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.secondaryText,
      fontWeight: '500',
    },
    historyCard: {
      backgroundColor: colors.cardBackground,
      margin: 16,
      padding: 20,
      borderRadius: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.secondaryText,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 8,
      textAlign: 'center',
    },
    referralItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.inputBackground,
    },
    referralInfo: {
      flex: 1,
    },
    referralName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 4,
    },
    referralDate: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    referralStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 4,
      textTransform: 'capitalize',
    },
    retryButton: {
      marginTop: 20,
      backgroundColor: colors.primaryButton,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: colors.primaryButtonText,
      fontSize: 16,
      fontWeight: '600',
    },
  });

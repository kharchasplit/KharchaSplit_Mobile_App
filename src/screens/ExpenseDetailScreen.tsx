import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ensureDataUri } from '../utils/imageUtils';
import { ExpenseDetailSkeleton } from '../components/SkeletonLoader';

interface ExpenseDetailScreenProps {
  route: {
    params: {
      expense: any;
      group: any;
    };
  };
  navigation: {
    goBack: () => void;
    // FIX 1: Added navigate to the navigation prop type
    navigate: (screen: string, params?: object) => void;
  };
}

export const ExpenseDetailScreen: React.FC<ExpenseDetailScreenProps> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { expense, group } = route.params;
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  const categoryMapping: Record<string | number, { name: string; emoji: string; color: string }> = {
    1: { name: 'Food & Dining', emoji: '🍔', color: '#FEF3C7' },
    2: { name: 'Transportation', emoji: '🚌', color: '#FECACA' },
    3: { name: 'Shopping', emoji: '🛒', color: '#E0E7FF' },
    4: { name: 'Entertainment', emoji: '🎮', color: '#FED7AA' },
    5: { name: 'Movies', emoji: '🎬', color: '#F3E8FF' },
    6: { name: 'Healthcare', emoji: '💊', color: '#FECACA' },
    7: { name: 'General', emoji: '📌', color: '#F3F4F6' },
    default: { name: 'Other', emoji: '❓', color: '#F3F4F6' },
  };

  useEffect(() => {
    loadExpenseDetails();
  }, []);


  const loadExpenseDetails = async () => {
    setLoading(true);
    try {
      
      setExpenseData(expense);
      
      let members = group.members || [];
      
      if (members.length > 0 && members[0].userId && !members[0].id) {
        members = members.map((member: any) => ({
          ...member,
          id: member.userId,
          email: member.phoneNumber || member.email,
          avatar: member.profileImage || member.avatar,
        }));
      } else {
        members = members.map((member: any) => ({
          ...member,
          avatar: member.profileImage || member.avatar,
        }));
      }
      
      setGroupMembers(members);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  const renderParticipant = (participant: any) => {
    const participantId = participant.userId || participant.id;
    const member = groupMembers.find((m) => 
      m.userId === participantId || m.id === participantId
    );

    const displayName = member?.name || participant.name || 'Unknown User';
    const displayEmail = member?.email || member?.phoneNumber || participant.email || '';
    const displayAvatar = member?.avatar || participant.avatar;

    return (
      <View key={participantId} style={styles(colors).participantItem}>
        {(() => {
          const imageUri = ensureDataUri(displayAvatar);
          return imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              style={styles(colors).participantAvatar}
              onError={() => {
                // Handle avatar loading error
              }}
            />
          ) : (
            <View style={styles(colors).participantAvatarPlaceholder}>
              <Text style={styles(colors).participantAvatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          );
        })()}
        <View style={styles(colors).participantInfo}>
          <Text style={styles(colors).participantName}>{displayName}</Text>
          {displayEmail && (
            <Text style={styles(colors).participantEmail}>{displayEmail}</Text>
          )}
        </View>
        <View style={styles(colors).participantAmount}>
          <Text style={styles(colors).participantAmountText}>₹{participant.amount.toFixed(0)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles(colors).container}>
        <ExpenseDetailSkeleton />
      </SafeAreaView>
    );
  }

  const currentExpense = expenseData || expense;
  const category =
    categoryMapping[currentExpense.category?.id] || categoryMapping.default;
    
  // FIX 2: Made the user lookup consistent by checking both `userId` and `id`
  const paidByMember = groupMembers.find(
    (m) => m.userId === currentExpense.paidBy || m.id === currentExpense.paidBy
  );


  return (
    <SafeAreaView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <TouchableOpacity style={styles(colors).backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles(colors).headerTitle}>Expense Details</Text>
        <View style={styles(colors).headerRight} />
      </View>

      <ScrollView style={styles(colors).scrollView} showsVerticalScrollIndicator={false}>
        {/* Expense Header */}
        <View style={styles(colors).expenseHeader}>
          <View style={[styles(colors).categoryIcon, { backgroundColor: category.color }]}>
            <Text style={styles(colors).categoryEmoji}>{category.emoji}</Text>
          </View>
          <View style={styles(colors).expenseInfo}>
            <Text style={styles(colors).expenseTitle}>{currentExpense.description}</Text>
            <Text style={styles(colors).categoryName}>{category.name}</Text>
            <Text style={styles(colors).expenseDate}>{formatDate(currentExpense.createdAt)}</Text>
          </View>
          <View style={styles(colors).expenseAmount}>
            <Text style={styles(colors).expenseAmountText}>₹{currentExpense.amount.toFixed(0)}</Text>
          </View>
        </View>

        {/* Paid By Section */}
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>Paid By</Text>
          <View style={styles(colors).paidByContainer}>
            {(() => {
              const imageUri = ensureDataUri(paidByMember?.avatar);
              return imageUri ? (
                <Image 
                  source={{ uri: imageUri }} 
                  style={styles(colors).paidByAvatar}
                  onError={() => {
                    // Handle avatar loading error
                  }}
                />
              ) : (
                <View style={styles(colors).paidByAvatarPlaceholder}>
                  <Text style={styles(colors).paidByAvatarText}>
                    {paidByMember?.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              );
            })()}
            <View style={styles(colors).paidByInfo}>
              <Text style={styles(colors).paidByName}>{paidByMember?.name || 'Unknown User'}</Text>
              <Text style={styles(colors).paidByEmail}>{paidByMember?.email || 'No email'}</Text>
            </View>
          </View>
        </View>

        {/* Split Details */}
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>Split Details</Text>
          <View style={styles(colors).splitTypeContainer}>
            <MaterialIcons name="pie-chart" size={20} color={colors.activeIcon} />
            <Text style={styles(colors).splitTypeText}>
              {currentExpense.splitType === 'equal'
                ? 'Split Equally'
                : currentExpense.splitType === 'unequal'
                ? 'Split Unequally'
                : currentExpense.splitType === 'percentage'
                ? 'Split by Percentage'
                : currentExpense.splitType === 'shares'
                ? 'Split by Shares'
                : 'Custom Split'}
            </Text>
          </View>
        </View>

        {/* Participants */}
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>
            Participants ({currentExpense.participants?.length || 0})
          </Text>
          {currentExpense.participants?.map((participant: any) =>
            renderParticipant(participant),
          )}
        </View>

        {/* Receipt */}
        {(currentExpense.receiptUrl || currentExpense.receiptBase64) && (
          <View style={styles(colors).section}>
            <Text style={styles(colors).sectionTitle}>Receipt</Text>
            <TouchableOpacity 
              style={styles(colors).receiptContainer}
              onPress={() => {
                const receiptData = currentExpense.receiptUrl || currentExpense.receiptBase64;
                const formattedReceipt = ensureDataUri(receiptData);
                                
                if (formattedReceipt) {
                  navigation.navigate('ViewReceipt', {
                    receiptBase64: formattedReceipt,
                    expenseDescription: currentExpense.description
                  });
                } else {
                  Alert.alert('Error', 'Receipt image not available');
                }
              }}
            >
              <Image 
                source={{ 
                  uri: ensureDataUri(currentExpense.receiptUrl || currentExpense.receiptBase64) || ''
                }} 
                style={styles(colors).receiptImage}
                onError={(error) => {
                  // Handle image load error
                }}
              />
              <View style={styles(colors).receiptOverlay}>
                <Ionicons name="eye" size={24} color="#FFFFFF" />
                <Text style={styles(colors).receiptText}>View Receipt</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes */}
        {currentExpense.notes && (
          <View style={styles(colors).section}>
            <Text style={styles(colors).sectionTitle}>Notes</Text>
            <Text style={styles(colors).notesText}>{currentExpense.notes}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ... (styles remain the same)
const styles = (colors: any) =>
  StyleSheet.create({
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
    headerRight: { width: 40 },
    scrollView: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 16, color: colors.secondaryText, marginTop: 16 },

    expenseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.cardBackground,
      marginBottom: 8,
    },
    categoryIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    categoryEmoji: { fontSize: 30 },
    expenseInfo: { flex: 1 },
    expenseTitle: { fontSize: 20, fontWeight: '600', color: colors.primaryText, marginBottom: 4 },
    categoryName: { fontSize: 14, color: colors.secondaryText, marginBottom: 4 },
    expenseDate: { fontSize: 12, color: colors.secondaryText },
    expenseAmount: { alignItems: 'flex-end' },
    expenseAmountText: { fontSize: 24, fontWeight: '700', color: colors.primaryText },

    section: { backgroundColor: colors.cardBackground, marginVertical: 4, padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.primaryText, marginBottom: 4 },
    sectionSubtitle: { fontSize: 12, color: colors.secondaryText, marginBottom: 12 },

    paidByContainer: { flexDirection: 'row', alignItems: 'center' },
    paidByAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
    paidByAvatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primaryButton,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    paidByAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    paidByInfo: { flex: 1 },
    paidByName: { fontSize: 16, fontWeight: '500', color: colors.primaryText, marginBottom: 4 },
    paidByEmail: { fontSize: 14, color: colors.secondaryText },

    splitTypeContainer: { flexDirection: 'row', alignItems: 'center' },
    splitTypeText: { fontSize: 16, color: colors.primaryText, marginLeft: 8 },

    participantItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBackground,
    },
    participantAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    participantAvatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryButton,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    participantAvatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    participantInfo: { flex: 1 },
    participantName: { fontSize: 16, fontWeight: '500', color: colors.primaryText, marginBottom: 2 },
    participantEmail: { fontSize: 12, color: colors.secondaryText },
    participantAmount: { alignItems: 'flex-end' },
    participantAmountText: { fontSize: 16, fontWeight: '600', color: colors.primaryButton },

    receiptContainer: { position: 'relative', borderRadius: 8, overflow: 'hidden' },
    receiptImage: { width: '100%', height: 200, resizeMode: 'cover' },
    receiptOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    receiptText: { color: '#fff', fontSize: 14, fontWeight: '500', marginTop: 8 },

    notesText: { fontSize: 14, color: colors.primaryText, lineHeight: 20 },
  });
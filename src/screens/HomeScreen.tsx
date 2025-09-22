import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  // --- RESPONSIVE ---
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateNewGroupScreen } from './CreateNewGroupScreen';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { firebaseService, Group as FirebaseGroup } from '../services/firebaseService';
// --- RESPONSIVE ---
// We now use this object to create scaled sizes
import { typography } from '../utils/typography';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ensureDataUri } from '../utils/imageUtils';

// (Interfaces remain the same)
interface GroupDetail {
  text: string;
  amount: number;
  type: 'owe' | 'owed';
}

interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string | null;
  coverImageUrl?: string | null;
  youOwe: number;
  youAreOwed: number;
  details: GroupDetail[];
  moreBalances?: number | null;
  members?: any[];
  createdAt?: any;
  totalExpenses?: number;
}

interface OverallBalance {
  netBalance: number;
  totalYouOwe: number;
  totalYouAreOwed: number;
  groupBalanceDetails: any[];
}

interface HomeScreenProps {
  navigation: any;
}

// Helper function to calculate user's balance in a specific group
const calculateUserGroupBalance = (expenses: any[], userId: string, members: any[]) => {
  let netBalance = 0;
  const details: GroupDetail[] = [];
  const memberBalances: { [key: string]: number } = {};

  // Initialize member balances
  members.forEach(member => {
    memberBalances[member.userId] = 0;
  });

  // Process each expense
  expenses.forEach(expense => {
    const payerId = expense.paidBy.id;
    
    expense.participants.forEach((participant: any) => {
      const participantId = participant.id || participant.userId;
      
      if (participantId !== payerId) {
        // Participant owes payer
        memberBalances[participantId] -= participant.amount;
        memberBalances[payerId] += participant.amount;
      }
    });
  });

  // Calculate net balance for current user
  netBalance = memberBalances[userId] || 0;

  // Generate balance details for current user
  members.forEach(member => {
    if (member.userId !== userId) {
      const memberBalance = memberBalances[member.userId] || 0;
      const userBalance = memberBalances[userId] || 0;
      
      // If user owes this member
      if (userBalance < 0 && memberBalance > 0) {
        const amount = Math.min(Math.abs(userBalance), memberBalance);
        if (amount > 0.01) {
          details.push({
            text: `you owe ${member.name}`,
            amount: amount,
            type: 'owe'
          });
        }
      }
      
      // If this member owes user
      if (userBalance > 0 && memberBalance < 0) {
        const amount = Math.min(userBalance, Math.abs(memberBalance));
        if (amount > 0.01) {
          details.push({
            text: `${member.name} owes you`,
            amount: amount,
            type: 'owed'
          });
        }
      }
    }
  });

  return { netBalance, details };
};


export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  // --- STATUS BAR FIX ---
  // Assuming your theme context provides an isDarkMode boolean
  // If it provides a string like `mode`, you can do:
  // const { colors, mode } = useTheme();
  // const isDarkMode = mode === 'dark';
  const { colors } = useTheme();
  const { user } = useAuth();
  // --- END FIX ---

  // --- RESPONSIVE ---
  // Get screen width
  const { width: screenWidth } = useWindowDimensions();
  
  // Define base width and scaling function
  const baseWidth = 375;
  const scale = (size: number) => (screenWidth / baseWidth) * size;

  // Create an object of scaled font sizes using the imported typography file
  const scaledFontSize = {
    lg: scale(typography.fontSize.lg),
    '2xl': scale(typography.fontSize['2xl']),
    headerLarge: scale(typography.text.headerLarge.fontSize),
    header: scale(typography.text.header.fontSize),
    title: scale(typography.text.title.fontSize),
    subtitle: scale(typography.text.subtitle.fontSize),
    body: scale(typography.text.body.fontSize),
    caption: scale(typography.text.caption.fontSize),
  };
  // --- END RESPONSIVE ---

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [firebaseGroups, setFirebaseGroups] = useState<FirebaseGroup[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [overallBalance, setOverallBalance] = useState<OverallBalance>({
    netBalance: 0,
    totalYouOwe: 0,
    totalYouAreOwed: 0,
    groupBalanceDetails: [],
  });
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const loadGroupsFromFirebase = async () => {
    if (!user) {
      console.log('No user authenticated, skipping group load');
      return;
    }

    try {
      setGroupsLoading(true);
      console.log('Loading groups for user:', user.id);
      
      const userGroups = await firebaseService.getUserGroups(user.id);
      setFirebaseGroups(userGroups);
      
      // Calculate balances for each group
      const convertedGroups: Group[] = await Promise.all(
        userGroups.map(async (group) => {
          let youOwe = 0;
          let youAreOwed = 0;
          let details: GroupDetail[] = [];
          
          try {
            // Get expenses for this group
            const groupExpenses = await firebaseService.getGroupExpenses(group.id);
            console.log(`Group ${group.name} has ${groupExpenses.length} expenses`);
            
            // Calculate user's balance in this group
            const balance = calculateUserGroupBalance(groupExpenses, user.id, group.members);
            youOwe = Math.max(0, -balance.netBalance);
            youAreOwed = Math.max(0, balance.netBalance);
            details = balance.details;
            
          } catch (expenseError) {
            console.error(`Error loading expenses for group ${group.id}:`, expenseError);
          }

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            avatar: group.coverImageBase64 ? null : '🎭',
            coverImageUrl: group.coverImageBase64 || null,
            youOwe,
            youAreOwed,
            details,
            moreBalances: details.length > 3 ? details.length - 3 : 0,
            members: group.members,
            createdAt: group.createdAt,
            totalExpenses: group.totalExpenses,
          };
        })
      );
      
      setGroups(convertedGroups);
      
      // Calculate overall balance
      calculateOverallBalance(convertedGroups);
      
      console.log(`Loaded ${userGroups.length} groups from Firebase`);
    } catch (error: any) {
      console.error('Error loading groups from Firebase:', error);
      
      // Show user-friendly error message for specific cases
      if (error.message.includes('index required')) {
        console.log('Database configuration needed - using fallback');
        // For now, keep existing groups and don't show error to user
      } else if (error.message.includes('permission denied')) {
        console.log('Permission denied - check Firebase rules');
      } else {
        console.log('General error loading groups:', error.message);
      }
      
      // Keep existing groups on error - don't clear the state
    } finally {
      setGroupsLoading(false);
    }
  };

  const calculateOverallBalance = (groups: Group[]) => {
    let totalYouOwe = 0;
    let totalYouAreOwed = 0;
    const groupBalanceDetails: any[] = [];

    groups.forEach(group => {
      totalYouOwe += group.youOwe;
      totalYouAreOwed += group.youAreOwed;
      
      // Add group balance details
      if (group.youOwe > 0 || group.youAreOwed > 0) {
        groupBalanceDetails.push({
          groupName: group.name,
          groupId: group.id,
          youOwe: group.youOwe,
          youAreOwed: group.youAreOwed,
          netBalance: group.youAreOwed - group.youOwe,
          details: group.details
        });
      }
    });

    const netBalance = totalYouAreOwed - totalYouOwe;

    setOverallBalance({
      netBalance,
      totalYouOwe,
      totalYouAreOwed,
      groupBalanceDetails
    });
  };

  const loadGroupsAndBalance = async () => {
    setBalanceLoading(true);
    
    // Load groups from Firebase with real expense calculations
    await loadGroupsFromFirebase();
    
    setBalanceLoading(false);
  };

  useEffect(() => {
    loadGroupsAndBalance();
  }, []);

  const handleAddGroup = () => setShowCreateGroup(true);
  const handleCloseCreateGroup = () => setShowCreateGroup(false);

  const handleSaveNewGroup = (newGroup: FirebaseGroup) => {
    console.log('New group created:', newGroup);
    
    // Convert Firebase group to legacy format for display
    const transformedGroup: Group = {
      id: newGroup.id,
      name: newGroup.name,
      description: newGroup.description,
      avatar: newGroup.coverImageBase64 ? null : '🎭',
      coverImageUrl: newGroup.coverImageBase64 || null,
      youOwe: 0,
      youAreOwed: 0,
      details: [],
      members: newGroup.members || [],
      createdAt: newGroup.createdAt,
      totalExpenses: newGroup.totalExpenses,
    };
    
    // Add to both Firebase groups and legacy groups
    setFirebaseGroups(prev => [newGroup, ...prev]);
    setGroups(prev => [transformedGroup, ...prev]);
    setShowCreateGroup(false);
  };

  const handleSearch = () => {
    setShowSearchBar(!showSearchBar);
    if (showSearchBar) setSearchQuery('');
  };

  const filteredGroups = groups.filter(
    group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.details.some(detail =>
        detail.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupsAndBalance();
    setRefreshing(false);
  };

  // --- RESPONSIVE ---
  // createStyles is now called with the scale function and fonts object
  const styles = createStyles(colors, scale, scaledFontSize);

  // --- STATUS BAR FIX ---
  // Use dynamic status bar style from theme colors
  // --- END FIX ---

  return (
    <SafeAreaView style={styles.container}>
       {/* --- STATUS BAR FIX --- */}
       {/* Use dynamic status bar style from theme colors */}
       <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.statusBarBackground} />
       {/* --- END FIX --- */}
       
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleSearch}>
            <MaterialIcons
              name={showSearchBar ? 'close' : 'search'}
              // --- RESPONSIVE --- Correctly uses scaled size
              size={scaledFontSize.lg}
              color={colors.primaryText}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddGroup}>
            <MaterialIcons
              name="add"
              // --- RESPONSIVE --- Correctly uses scaled size
              size={scaledFontSize.lg}
              color={colors.primaryText}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearchBar && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search groups or members..."
            placeholderTextColor={colors.secondaryText}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              {/* --- RESPONSIVE --- Correctly uses scaled size */}
              <Text style={{ fontSize: scaledFontSize.lg }}>✖</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        // --- RESPONSIVE --- Correctly uses scaled size
        contentContainerStyle={{ paddingBottom: scale(120) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overall Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.sectionTitle}>Overall Balance</Text>
          {balanceLoading ? (
            <ActivityIndicator color={colors.primaryButton} />
          ) : (
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Net Balance</Text>
                <Text style={styles.balanceValue}>₹{overallBalance.netBalance}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>You Owe</Text>
                <Text style={styles.balanceValue}>₹{overallBalance.totalYouOwe}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>You Are Owed</Text>
                <Text style={styles.balanceValue}>₹{overallBalance.totalYouAreOwed}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Groups List */}
        {groupsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryButton} />
            <Text style={styles.loadingText}>Loading groups...</Text>
          </View>
        ) : filteredGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="group" size={scaledFontSize.headerLarge * 2} color={colors.secondaryText} />
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>Create your first group to start splitting expenses!</Text>
          </View>
        ) : (
          <>
            {filteredGroups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => navigation.navigate('GroupDetail', { group })}
              >
                <View style={styles.groupHeader}>
                  <View style={styles.avatarContainer}>
                    {group.coverImageUrl ? (
                      <Image source={{ uri: ensureDataUri(group.coverImageUrl) || '' }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatar}>{group.avatar}</Text>
                    )}
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.description && (
                      <Text style={styles.groupDescription}>{group.description}</Text>
                    )}
                    <Text style={styles.membersCount}>{group.members?.length || 0} members</Text>
                  </View>
                </View>
                <View style={styles.groupDetails}>
                  {group.details.length > 0 ? (
                    group.details.map((detail, idx) => (
                      <View key={idx} style={styles.detailRow}>
                        <Text style={styles.detailText}>{detail.text}</Text>
                        <Text style={styles.detailText}>
                          {detail.type === 'owe' ? '-' : '+'}₹{detail.amount}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noExpensesText}>No expenses yet</Text>
                  )}
                  {group.moreBalances ? (
                    <Text style={styles.moreBalances}>+ {group.moreBalances} more</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
            
            {/* See All Groups Button */}
            {filteredGroups.length > 0 && (
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => navigation.navigate('AllGroups')}
              >
                <MaterialIcons
                  name="view-list"
                  size={scaledFontSize.lg}
                  color={colors.primaryButton}
                />
                <Text style={styles.seeAllButtonText}>See All Groups</Text>
                <MaterialIcons
                  name="chevron-right"
                  size={scaledFontSize.lg}
                  color={colors.primaryButton}
                />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddGroup}>
        <MaterialIcons
          name="add"
          // --- RESPONSIVE --- Correctly uses scaled size
          size={scaledFontSize.headerLarge}
          color={colors.primaryButtonText}
        />
      </TouchableOpacity>

      {/* Create New Group Modal */}
      <Modal visible={showCreateGroup} animationType="slide" presentationStyle="pageSheet">
        <CreateNewGroupScreen onClose={handleCloseCreateGroup} onSave={handleSaveNewGroup} />
      </Modal>
    </SafeAreaView>
  );
};

// --- RESPONSIVE ---
// (createStyles function remains unchanged)
const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  scale: (size: number) => number,
  fonts: { [key: string]: number } // The scaledFontSize object
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
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
      ...typography.text.headerLarge,
      color: colors.primaryText,
      fontSize: fonts.headerLarge, // Use passed-in font
    },
    headerActions: { flexDirection: 'row' },
    headerButton: { padding: scale(8), marginLeft: scale(12) },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      paddingHorizontal: scale(12),
      margin: scale(12),
      borderRadius: scale(12),
    },
    searchInput: {
      flex: 1,
      height: scale(40),
      color: colors.inputText,
      fontSize: fonts.body, // Use passed-in font
    },
    scrollView: {
      flex: 1,
    },
    balanceSection: {
      backgroundColor: colors.cardBackground,
      margin: scale(16),
      padding: scale(12),
      borderRadius: scale(8),
    },
    sectionTitle: {
      ...typography.text.header,
      marginBottom: scale(8),
      color: colors.primaryText,
      fontSize: fonts.header, // Use passed-in font
    },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-around' },
    balanceItem: { alignItems: 'center' },
    balanceLabel: {
      ...typography.text.caption,
      color: colors.secondaryText,
      fontSize: fonts.caption, // Use passed-in font
    },
    balanceValue: {
      ...typography.text.subtitle,
      color: colors.primaryText,
      fontSize: fonts.subtitle, // Use passed-in font
    },
    groupCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: scale(16),
      marginVertical: scale(8),
      padding: scale(12),
      borderRadius: scale(8),
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: scale(8),
    },
    avatarContainer: {
      width: scale(50),
      height: scale(50),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: scale(12),
    },
    avatar: {
      fontSize: fonts['2xl'], // Use passed-in font
    },
    avatarImage: {
      width: scale(50),
      height: scale(50),
      borderRadius: scale(25),
    },
    groupInfo: {
      flex: 1,
      marginLeft: scale(12),
    },
    groupName: {
      ...typography.text.title,
      color: colors.primaryText,
      fontSize: fonts.title, // Use passed-in font
    },
    groupDescription: {
      ...typography.text.caption,
      color: colors.secondaryText,
      fontSize: fonts.caption,
      marginTop: scale(2),
    },
    membersCount: {
      ...typography.text.caption,
      color: colors.secondaryText,
      fontSize: fonts.caption,
      marginTop: scale(4),
    },
    groupDetails: {
      paddingLeft: scale(8),
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: scale(2),
    },
    detailText: {
      ...typography.text.body,
      color: colors.primaryText,
      fontSize: fonts.body, // Use passed-in font
    },
    moreBalances: {
      ...typography.text.caption,
      color: colors.secondaryText,
      fontSize: fonts.caption, // Use passed-in font
    },
    noExpensesText: {
      ...typography.text.caption,
      color: colors.secondaryText,
      fontSize: fonts.caption,
      fontStyle: 'italic',
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: scale(40),
    },
    loadingText: {
      ...typography.text.body,
      color: colors.secondaryText,
      fontSize: fonts.body,
      marginTop: scale(8),
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: scale(60),
      paddingHorizontal: scale(40),
    },
    emptyText: {
      ...typography.text.title,
      color: colors.primaryText,
      fontSize: fonts.title,
      marginTop: scale(16),
      textAlign: 'center',
    },
    emptySubtext: {
      ...typography.text.body,
      color: colors.secondaryText,
      fontSize: fonts.body,
      marginTop: scale(8),
      textAlign: 'center',
      lineHeight: scale(20),
    },
    floatingButton: {
      position: 'absolute',
      bottom: scale(24),
      right: scale(24),
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
    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBackground,
      marginHorizontal: scale(16),
      marginVertical: scale(12),
      paddingVertical: scale(16),
      paddingHorizontal: scale(20),
      borderRadius: scale(8),
      borderWidth: 1,
      borderColor: colors.primaryButton,
    },
    seeAllButtonText: {
      ...typography.text.body,
      color: colors.primaryButton,
      fontSize: fonts.body,
      fontWeight: '600',
      marginHorizontal: scale(8),
    },
  });
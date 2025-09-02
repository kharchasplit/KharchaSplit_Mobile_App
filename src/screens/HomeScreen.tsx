import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import CreateNewGroupScreen from './CreateNewGroupScreen';

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
  route?: {
    params?: {
      reload?: boolean;
      timestamp?: number;
    };
  };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const theme = {
    colors: {
      background: '#F9FAFB',
      surface: '#FFFFFF',
      border: '#E5E7EB',
      borderLight: '#F3F4F6',
      text: '#111827',
      textSecondary: '#6B7280',
      textMuted: '#9CA3AF',
      primary: '#4A90E2',
    },
  };

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [overallBalance, setOverallBalance] = useState<OverallBalance>({
    netBalance: 0,
    totalYouOwe: 0,
    totalYouAreOwed: 0,
    groupBalanceDetails: [],
  });
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Mock loading function
  const loadGroupsAndBalance = () => {
    setLoading(true);
    setBalanceLoading(true);
    setTimeout(() => {
      const mockGroups: Group[] = [
        {
          id: '1',
          name: 'Trip to Goa',
          avatar: '🎭',
          youOwe: 500,
          youAreOwed: 0,
          details: [
            { text: 'You owe Alice', amount: 300, type: 'owe' },
            { text: 'You owe Bob', amount: 200, type: 'owe' },
          ],
          moreBalances: 1,
          totalExpenses: 1000,
          members: [],
        },
        {
          id: '2',
          name: 'Birthday Party',
          avatar: '🎉',
          youOwe: 0,
          youAreOwed: 600,
          details: [{ text: 'Charlie owes you', amount: 600, type: 'owed' }],
          moreBalances: 0,
          totalExpenses: 600,
          members: [],
        },
      ];

      const mockBalance: OverallBalance = {
        netBalance: 100,
        totalYouOwe: 500,
        totalYouAreOwed: 600,
        groupBalanceDetails: [],
      };

      setGroups(mockGroups);
      setOverallBalance(mockBalance);
      setLoading(false);
      setBalanceLoading(false);
    }, 1000);
  };

  useEffect(() => {
    loadGroupsAndBalance();
  }, []);

  const handleAddGroup = () => setShowCreateGroup(true);
  const handleCloseCreateGroup = () => setShowCreateGroup(false);

  const handleSaveNewGroup = (newGroup: any) => {
    const transformedGroup: Group = {
      id: newGroup.id,
      name: newGroup.name,
      description: newGroup.description,
      avatar: newGroup.coverImageUrl ? null : '🎭',
      coverImageUrl: newGroup.coverImageUrl,
      youOwe: 0,
      youAreOwed: 0,
      details: [],
      members: newGroup.members || [],
      createdAt: newGroup.createdAt,
      totalExpenses: 0,
    };
    setGroups(prev => [transformedGroup, ...prev]);
    setShowCreateGroup(false);
  };

  const handleSearch = () => {
    setShowSearchBar(!showSearchBar);
    if (showSearchBar) setSearchQuery('');
  };

  const handleSearchQueryChange = (query: string) => setSearchQuery(query);

  const filteredGroups = groups.filter(
    group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.details.some(detail =>
        detail.text.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadGroupsAndBalance();
    setRefreshing(false);
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleSearch}>
            <Text style={{ fontSize: 20 }}>{showSearchBar ? '🔍' : '🔎'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddGroup}>
            <Text style={{ fontSize: 20 }}>➕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearchBar && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            placeholder="Search groups or members..."
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ fontSize: 18 }}>✖</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overall Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.sectionTitle}>Overall Balance</Text>
          {balanceLoading ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text>Net Balance</Text>
                <Text>{overallBalance.netBalance}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text>You Owe</Text>
                <Text>{overallBalance.totalYouOwe}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text>You Are Owed</Text>
                <Text>{overallBalance.totalYouAreOwed}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Groups List */}
        {filteredGroups.map(group => (
          <TouchableOpacity key={group.id} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={styles.avatarContainer}>
                {group.coverImageUrl ? (
                  <Image source={{ uri: group.coverImageUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatar}>{group.avatar}</Text>
                )}
              </View>
              <Text style={styles.groupName}>{group.name}</Text>
            </View>
            <View style={styles.groupDetails}>
              {group.details.map((detail, idx) => (
                <View key={idx} style={styles.detailRow}>
                  <Text>{detail.text}</Text>
                  <Text>
                    {detail.type === 'owe' ? '-' : '+'}₹{detail.amount}
                  </Text>
                </View>
              ))}
              {group.moreBalances ? <Text>+ {group.moreBalances} more</Text> : null}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Floating Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddGroup}>
        <Text style={{ color: '#fff', fontSize: 28 }}>➕</Text>
      </TouchableOpacity>

      {/* Create New Group Modal */}
      <Modal visible={showCreateGroup} animationType="slide" presentationStyle="pageSheet">
        <CreateNewGroupScreen onClose={handleCloseCreateGroup} onSave={handleSaveNewGroup} />
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text },
    headerActions: { flexDirection: 'row' },
    headerButton: { padding: 8, marginLeft: 12 },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.borderLight,
      paddingHorizontal: 12,
      margin: 12,
      borderRadius: 12,
    },
    searchInput: { flex: 1, height: 40, color: theme.colors.text },
    scrollView: { flex: 1 },
    balanceSection: {
      backgroundColor: theme.colors.surface,
      margin: 16,
      padding: 12,
      borderRadius: 8,
    },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-around' },
    balanceItem: { alignItems: 'center' },
    groupCard: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 12,
      borderRadius: 8,
    },
    groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    avatarContainer: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatar: { fontSize: 24 },
    avatarImage: { width: 50, height: 50, borderRadius: 25 },
    groupName: { fontSize: 18, fontWeight: '600' },
    groupDetails: { paddingLeft: 8 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    floatingButton: {
      position: 'absolute',
      bottom: 40,
      right: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default HomeScreen;

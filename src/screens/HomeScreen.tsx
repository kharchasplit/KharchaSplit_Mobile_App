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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateNewGroupScreen } from './CreateNewGroupScreen';
import { colors } from '../utils/colors';
import { typography } from '../utils/typography';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
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
  const [balanceLoading, setBalanceLoading] = useState(false);

  const loadGroupsAndBalance = () => {
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

  const filteredGroups = groups.filter(
    group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.details.some(detail =>
        detail.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadGroupsAndBalance();
    setRefreshing(false);
  };

  const styles = createStyles();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleSearch}>
            <MaterialIcons
              name={showSearchBar ? 'close' : 'search'}
              size={24}
              color={colors.primaryText}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddGroup}>
            <MaterialIcons name="add" size={24} color={colors.primaryText} />
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
              <Text style={{ fontSize: typography.fontSize.lg }}>✖</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
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
                <Text style={styles.balanceValue}>{overallBalance.netBalance}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>You Owe</Text>
                <Text style={styles.balanceValue}>{overallBalance.totalYouOwe}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>You Are Owed</Text>
                <Text style={styles.balanceValue}>{overallBalance.totalYouAreOwed}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Groups List */}
        {filteredGroups.map(group => (
          <TouchableOpacity
            key={group.id}
            style={styles.groupCard}
            onPress={() => navigation.navigate('GroupDetail', { group })}
          >
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
                  <Text style={styles.detailText}>{detail.text}</Text>
                  <Text style={styles.detailText}>
                    {detail.type === 'owe' ? '-' : '+'}₹{detail.amount}
                  </Text>
                </View>
              ))}
              {group.moreBalances ? (
                <Text style={styles.moreBalances}>+ {group.moreBalances} more</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Floating Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddGroup}>
        <MaterialIcons name="add" size={28} color={colors.primaryButtonText} />
      </TouchableOpacity>

      {/* Create New Group Modal */}
      <Modal visible={showCreateGroup} animationType="slide" presentationStyle="pageSheet">
        <CreateNewGroupScreen onClose={handleCloseCreateGroup} onSave={handleSaveNewGroup} />
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = () =>
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
      borderBottomWidth: 1,
      borderBottomColor: colors.secondaryText,
    },
    headerTitle: { ...typography.text.headerLarge, color: colors.primaryText },
    headerActions: { flexDirection: 'row' },
    headerButton: { padding: 8, marginLeft: 12 },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      paddingHorizontal: 12,
      margin: 12,
      borderRadius: 12,
    },
    searchInput: { flex: 1, height: 40, color: colors.inputText },
    scrollView: {
      flex: 1,
    },
    balanceSection: {
      backgroundColor: colors.cardBackground,
      margin: 16,
      padding: 12,
      borderRadius: 8,
    },
    sectionTitle: { ...typography.text.header, marginBottom: 8, color: colors.primaryText },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-around' },
    balanceItem: { alignItems: 'center' },
    balanceLabel: { ...typography.text.caption, color: colors.secondaryText },
    balanceValue: { ...typography.text.subtitle, color: colors.primaryText },
    groupCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 12,
      borderRadius: 8,
    },
    groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    avatarContainer: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatar: { fontSize: typography.fontSize['2xl'] },
    avatarImage: { width: 50, height: 50, borderRadius: 25 },
    groupName: { ...typography.text.title, color: colors.primaryText },
    groupDetails: { paddingLeft: 8 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    detailText: { ...typography.text.body, color: colors.primaryText },
    moreBalances: { ...typography.text.caption, color: colors.secondaryText },
    floatingButton: {
      position: 'absolute',
      bottom: 5, // Changed from 80 to 24 to move it closer to bottom
      right: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primaryButton,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

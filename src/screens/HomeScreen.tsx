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
// --- RESPONSIVE ---
// We now use this object to create scaled sizes
import { typography } from '../utils/typography';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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


export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  // --- STATUS BAR FIX ---
  // Assuming your theme context provides an isDarkMode boolean
  // If it provides a string like `mode`, you can do:
  // const { colors, mode } = useTheme();
  // const isDarkMode = mode === 'dark';
  const { colors, isDarkMode } = useTheme();
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
  const [refreshing, setRefreshing] = useState(false);
  const [overallBalance, setOverallBalance] = useState<OverallBalance>({
    netBalance: 0,
    totalYouOwe: 0,
    totalYouAreOwed: 0,
    groupBalanceDetails: [],
  });
  const [balanceLoading, setBalanceLoading] = useState(false);

  // (All logic functions: loadGroupsAndBalance, handleAddGroup, etc. remain the same)
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

  // --- RESPONSIVE ---
  // createStyles is now called with the scale function and fonts object
  const styles = createStyles(colors, scale, scaledFontSize);

  // --- STATUS BAR FIX ---
  // Set the status bar content color based on the active theme
  // 'dark-content' (black text) for light mode
  // 'light-content' (white text) for dark mode
  const statusBarTheme = isDarkMode ? 'light-content' : 'dark-content';
  // --- END FIX ---

  return (
    <SafeAreaView style={styles.container}>
       {/* --- STATUS BAR FIX --- */}
       {/* Use the new dynamic statusBarTheme variable */}
       <StatusBar barStyle={statusBarTheme} backgroundColor={colors.background} />
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
      alignItems: 'center',
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
    groupName: {
      ...typography.text.title,
      color: colors.primaryText,
      fontSize: fonts.title, // Use passed-in font
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
  });
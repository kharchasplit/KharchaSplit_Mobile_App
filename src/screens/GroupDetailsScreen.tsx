import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

type Member = {
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
  isAdmin?: boolean;
  isCreator?: boolean;
  role?: string;
};

type Group = {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  avatar?: string;
  createdAt?: any;
  createdBy?: string;
  adminIds?: string[];
  totalExpenses?: number;
};

type Props = {
  route: { params: { group: Group } };
  navigation: any;
};

export const GroupDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { group } = route.params || {};
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [adminUsers, setAdminUsers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroupData();
  }, [group]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      // Placeholder for members (replace with API or local data source)
      const members: Member[] = [
        { userId: '1', name: 'Alice', email: 'alice@example.com', isAdmin: true },
        { userId: '2', name: 'Bob', email: 'bob@example.com' },
      ];

      setGroupMembers(members);

      // Find admins
      let admins: Member[] = [];
      if (group.adminIds?.length) {
        admins = members.filter(
          (m) => group.adminIds?.includes(m.userId) || m.userId === group.createdBy
        );
      }
      if (!admins.length) {
        admins = members.filter((m) => m.isAdmin || m.isCreator || m.role === 'admin');
      }
      if (!admins.length && members.length) {
        admins = [members[0]]; // fallback
      }
      setAdminUsers(
        admins.filter((a, i, self) => i === self.findIndex((x) => x.userId === a.userId))
      );
    } catch (error) {
      console.error('Error loading group details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    let date: Date;
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
    });
  };

  const styles = createStyles(colors);

  const renderMemberItem = (member: Member, isAdmin = false) => (
    <View key={member.userId} style={styles.memberItem}>
      {member.avatar ? (
        <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
      ) : (
        <View style={styles.memberAvatarPlaceholder}>
          <Text style={styles.memberAvatarText}>
            {member.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberEmail}>{member.email || 'No email'}</Text>
      </View>
      {isAdmin && (
        <View style={styles.adminBadge}>
          <MaterialIcons name="admin-panel-settings" size={16} color={colors.activeIcon} />
          <Text style={styles.adminText}>Admin</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryButton} />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Group Info */}
        <View style={styles.section}>
          <View style={styles.groupHeader}>
            {group.coverImageUrl ? (
              <Image source={{ uri: group.coverImageUrl }} style={styles.groupImage} />
            ) : (
              <View style={styles.groupImagePlaceholder}>
                <Text style={styles.groupImageText}>{group.avatar || '🎭'}</Text>
              </View>
            )}
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupDescription}>
                {group.description || 'No description'}
              </Text>
            </View>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="group" size={20} color={colors.inactiveIcon} />
            <Text style={styles.infoLabel}>Total Members</Text>
            <Text style={styles.infoValue}>{groupMembers.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="admin-panel-settings" size={20} color={colors.inactiveIcon} />
            <Text style={styles.infoLabel}>Total Admins</Text>
            <Text style={styles.infoValue}>{adminUsers.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="date-range" size={20} color={colors.inactiveIcon} />
            <Text style={styles.infoLabel}>Created On</Text>
            <Text style={styles.infoValue}>{formatDate(group.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="currency-rupee" size={20} color={colors.inactiveIcon} />
            <Text style={styles.infoLabel}>Total Expenses</Text>
            <Text style={styles.infoValue}>
              ₹{group.totalExpenses?.toFixed(0) || '0'}
            </Text>
          </View>
        </View>

        {/* Admins */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Admins</Text>
          {adminUsers.length > 0 ? (
            adminUsers.map((m) => renderMemberItem(m, true))
          ) : (
            <Text style={styles.noDataText}>No admins found</Text>
          )}
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Members</Text>
          {groupMembers.length > 0 ? (
            groupMembers.map((m) => renderMemberItem(m))
          ) : (
            <Text style={styles.noDataText}>No members found</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 🎨 Theme-aware styles
const createStyles = (colors: any) =>
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
    section: {
      backgroundColor: colors.cardBackground,
      marginVertical: 8,
      marginHorizontal: 16,
      borderRadius: 12,
      padding: 16,
    },
    groupHeader: { flexDirection: 'row', alignItems: 'center' },
    groupImage: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
    groupImagePlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.secondaryText,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    groupImageText: { fontSize: 30 },
    groupInfo: { flex: 1 },
    groupName: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 4,
    },
    groupDescription: { fontSize: 14, color: colors.secondaryText },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 16,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    infoLabel: {
      fontSize: 14,
      color: colors.secondaryText,
      marginLeft: 12,
      flex: 1,
    },
    infoValue: { fontSize: 14, fontWeight: '500', color: colors.primaryText },
    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondaryText,
    },
    memberAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    memberAvatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryButton,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    memberAvatarText: {
      color: colors.primaryButtonText,
      fontSize: 16,
      fontWeight: 'bold',
    },
    memberInfo: { flex: 1 },
    memberName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.primaryText,
      marginBottom: 2,
    },
    memberEmail: { fontSize: 12, color: colors.secondaryText },
    adminBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    adminText: {
      fontSize: 12,
      color: colors.activeIcon,
      fontWeight: '500',
      marginLeft: 4,
    },
    noDataText: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
      paddingVertical: 16,
    },
  });

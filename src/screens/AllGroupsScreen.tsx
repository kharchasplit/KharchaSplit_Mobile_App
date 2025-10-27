import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebaseService } from '../services/firebaseService';
import { ensureDataUri } from '../utils/imageUtils';

interface AllGroupsScreenProps {
  navigation: any;
}

export const AllGroupsScreen: React.FC<AllGroupsScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const baseWidth = 375;
  const scale = (size: number) => (screenWidth / baseWidth) * size;

  const [activeGroups, setActiveGroups] = useState<any[]>([]);
  const [completedGroups, setCompletedGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');

  const loadGroups = useCallback(async (showRefresh = false) => {
    if (!user?.id) return;

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Load both active and completed groups in parallel
      const [activeGroupsData, completedGroupsData] = await Promise.all([
        firebaseService.getUserGroups(user.id),
        firebaseService.getCompletedGroups(user.id),
      ]);

      setActiveGroups(activeGroupsData);
      setCompletedGroups(completedGroupsData);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleRefresh = () => {
    loadGroups(true);
  };

  const handleGroupPress = (group: any) => {
    navigation.navigate('GroupDetail', { 
      group,
      currentUserId: user?.id,
    });
  };

  const renderGroupCard = (group: any, isCompleted = false) => {
    const imageUri = ensureDataUri(group.coverImageBase64);
    
    return (
      <TouchableOpacity
        key={group.id}
        style={[styles(colors, scale).groupCard, isCompleted && styles(colors, scale).completedGroupCard]}
        onPress={() => handleGroupPress(group)}
      >
        <View style={styles(colors, scale).groupHeader}>
          <View style={styles(colors, scale).groupImageContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles(colors, scale).groupImage} />
            ) : (
              <View style={styles(colors, scale).groupImagePlaceholder}>
                <Text style={styles(colors, scale).groupImageText}>
                  {group.name?.charAt(0)?.toUpperCase() || 'G'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles(colors, scale).groupInfo}>
            <View style={styles(colors, scale).groupTitleRow}>
              <Text style={styles(colors, scale).groupName} numberOfLines={1}>
                {group.name}
              </Text>
              {isCompleted && (
                <View style={styles(colors, scale).completedBadge}>
                  <MaterialIcons name="check-circle" size={scale(16)} color="#10B981" />
                  <Text style={styles(colors, scale).completedBadgeText}>Completed</Text>
                </View>
              )}
            </View>
            
            <Text style={styles(colors, scale).groupMembers} numberOfLines={1}>
              {group.members?.length || 0} members
            </Text>
            
            <Text style={styles(colors, scale).groupExpenses}>
              ₹{group.totalExpenses?.toFixed(0) || '0'} total expenses
            </Text>
            
            {isCompleted && group.completedAt && (
              <Text style={styles(colors, scale).completedDate}>
                Completed on {new Date(group.completedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
          
          <Ionicons 
            name="chevron-forward" 
            size={scale(20)} 
            color={colors.secondaryText} 
          />
        </View>
        
        {/* Member avatars preview */}
        <View style={styles(colors, scale).membersPreview}>
          {group.members?.slice(0, 4).map((member: any, index: number) => {
            const memberImageUri = ensureDataUri(member.profileImage || member.avatar);
            return (
              <View key={member.userId || index} style={[
                styles(colors, scale).memberAvatar,
                { marginLeft: index > 0 ? scale(-8) : 0 }
              ]}>
                {memberImageUri ? (
                  <Image source={{ uri: memberImageUri }} style={styles(colors, scale).memberAvatarImage} />
                ) : (
                  <View style={styles(colors, scale).memberAvatarPlaceholder}>
                    <Text style={styles(colors, scale).memberAvatarText}>
                      {member.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
          {group.members && group.members.length > 4 && (
            <View style={[styles(colors, scale).memberAvatar, { marginLeft: scale(-8) }]}>
              <View style={styles(colors, scale).memberAvatarPlaceholder}>
                <Text style={styles(colors, scale).memberAvatarText}>
                  +{group.members.length - 4}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type: 'active' | 'completed') => (
    <View style={styles(colors, scale).emptyState}>
      <MaterialIcons 
        name={type === 'active' ? 'group' : 'history'} 
        size={scale(80)} 
        color={colors.secondaryText} 
      />
      <Text style={styles(colors, scale).emptyStateTitle}>
        {type === 'active' ? 'No Active Groups' : 'No Completed Groups'}
      </Text>
      <Text style={styles(colors, scale).emptyStateDescription}>
        {type === 'active' 
          ? 'Create your first group to start splitting expenses'
          : 'Completed groups will appear here for your reference'
        }
      </Text>
    </View>
  );

  const currentGroups = selectedTab === 'active' ? activeGroups : completedGroups;

  return (
    <SafeAreaView style={styles(colors, scale).container}>
      {/* Header */}
      <View style={styles(colors, scale).header}>
        <TouchableOpacity 
          style={styles(colors, scale).backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={scale(24)} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles(colors, scale).headerTitle}>All Groups</Text>
        <View style={styles(colors, scale).headerRight} />
      </View>

      {/* Tab Switcher */}
      <View style={styles(colors, scale).tabContainer}>
        <TouchableOpacity
          style={[
            styles(colors, scale).tabButton,
            selectedTab === 'active' && styles(colors, scale).activeTabButton
          ]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[
            styles(colors, scale).tabButtonText,
            selectedTab === 'active' && styles(colors, scale).activeTabButtonText
          ]}>
            Active ({activeGroups.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles(colors, scale).tabButton,
            selectedTab === 'completed' && styles(colors, scale).activeTabButton
          ]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[
            styles(colors, scale).tabButtonText,
            selectedTab === 'completed' && styles(colors, scale).activeTabButtonText
          ]}>
            Completed ({completedGroups.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles(colors, scale).loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryButton} />
          <Text style={styles(colors, scale).loadingText}>Loading groups...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles(colors, scale).scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primaryButton]}
              tintColor={colors.primaryButton}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {currentGroups.length > 0 ? (
            <View style={styles(colors, scale).groupsList}>
              {currentGroups.map((group) => renderGroupCard(group, selectedTab === 'completed'))}
            </View>
          ) : (
            renderEmptyState(selectedTab)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = (colors: any, scale: (size: number) => number) =>
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
      borderBottomWidth: 0.5,
      borderBottomColor: colors.secondaryText + '20',
    },
    backButton: {
      padding: scale(8),
    },
    headerTitle: {
      fontSize: scale(18),
      fontWeight: '600',
      color: colors.primaryText,
    },
    headerRight: {
      width: scale(40),
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      paddingHorizontal: scale(16),
      paddingBottom: scale(12),
    },
    tabButton: {
      flex: 1,
      paddingVertical: scale(12),
      paddingHorizontal: scale(16),
      marginHorizontal: scale(4),
      borderRadius: scale(8),
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    activeTabButton: {
      backgroundColor: colors.primaryButton,
    },
    tabButtonText: {
      fontSize: scale(14),
      fontWeight: '500',
      color: colors.secondaryText,
    },
    activeTabButtonText: {
      color: '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: scale(16),
      color: colors.secondaryText,
      marginTop: scale(16),
    },
    scrollView: {
      flex: 1,
    },
    groupsList: {
      padding: scale(16),
    },
    groupCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: scale(12),
      padding: scale(16),
      marginBottom: scale(12),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    completedGroupCard: {
      opacity: 0.8,
      borderWidth: 1,
      borderColor: '#10B981' + '30',
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: scale(12),
    },
    groupImageContainer: {
      marginRight: scale(12),
    },
    groupImage: {
      width: scale(50),
      height: scale(50),
      borderRadius: scale(25),
    },
    groupImagePlaceholder: {
      width: scale(50),
      height: scale(50),
      borderRadius: scale(25),
      backgroundColor: colors.primaryButton,
      justifyContent: 'center',
      alignItems: 'center',
    },
    groupImageText: {
      fontSize: scale(20),
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    groupInfo: {
      flex: 1,
    },
    groupTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: scale(4),
    },
    groupName: {
      fontSize: scale(16),
      fontWeight: '600',
      color: colors.primaryText,
      flex: 1,
      marginRight: scale(8),
    },
    completedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#10B981' + '20',
      paddingHorizontal: scale(8),
      paddingVertical: scale(2),
      borderRadius: scale(12),
    },
    completedBadgeText: {
      fontSize: scale(10),
      fontWeight: '500',
      color: '#10B981',
      marginLeft: scale(4),
    },
    groupMembers: {
      fontSize: scale(14),
      color: colors.secondaryText,
      marginBottom: scale(2),
    },
    groupExpenses: {
      fontSize: scale(14),
      color: colors.secondaryText,
      marginBottom: scale(2),
    },
    completedDate: {
      fontSize: scale(12),
      color: '#10B981',
      fontStyle: 'italic',
    },
    membersPreview: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    memberAvatar: {
      borderWidth: 2,
      borderColor: colors.cardBackground,
      borderRadius: scale(16),
    },
    memberAvatarImage: {
      width: scale(32),
      height: scale(32),
      borderRadius: scale(16),
    },
    memberAvatarPlaceholder: {
      width: scale(32),
      height: scale(32),
      borderRadius: scale(16),
      backgroundColor: colors.primaryButton,
      justifyContent: 'center',
      alignItems: 'center',
    },
    memberAvatarText: {
      fontSize: scale(12),
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: scale(40),
      marginTop: scale(100),
    },
    emptyStateTitle: {
      fontSize: scale(20),
      fontWeight: '600',
      color: colors.primaryText,
      marginTop: scale(16),
      marginBottom: scale(8),
    },
    emptyStateDescription: {
      fontSize: scale(14),
      color: colors.secondaryText,
      textAlign: 'center',
      lineHeight: scale(20),
    },
  });
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebaseService, Group as FirebaseGroup, GroupMember } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { ensureDataUri } from '../utils/imageUtils';

// Types
interface Member {
  userId: string;
  name: string;
  avatar?: string;
  role?: 'admin' | 'member';
  isYou?: boolean;
  joinedAt?: { seconds: number };
}

interface Group {
  id: string;
  name: string;
  description: string;
  coverImageUrl?: string | null;
}

interface ManageGroupScreenProps {
  route: { params?: { group?: Group } };
  navigation: any;
}

export const ManageGroupScreen: React.FC<ManageGroupScreenProps> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { group } = route.params || {};

  const [firebaseGroup, setFirebaseGroup] = useState<FirebaseGroup | null>(null);
  const [groupData, setGroupData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    coverImage: group?.coverImageUrl || group?.coverImageBase64 || null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [originalData, setOriginalData] = useState({
    name: '',
    description: '',
    coverImage: null as string | null,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [group]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = 
      groupData.name !== originalData.name ||
      groupData.description !== originalData.description ||
      groupData.coverImage !== originalData.coverImage;
    
    setHasUnsavedChanges(hasChanges);
  }, [groupData, originalData]);

  const loadGroupData = async () => {
    if (!group?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {

      // Load real Firebase data
      const groupDetails = await firebaseService.getGroupById(group.id);
      
      if (groupDetails) {
        setFirebaseGroup(groupDetails);
        const loadedData = {
          name: groupDetails.name,
          description: groupDetails.description || '',
          coverImage: groupDetails.coverImageBase64 
            ? ensureDataUri(groupDetails.coverImageBase64) 
            : null,
        };
        
        setGroupData(loadedData);
        setOriginalData(loadedData);
        
        setGroupMembers(groupDetails.members || []);
        
        // Check if current user is admin
        const currentUserMember = groupDetails.members.find(m => m.userId === user?.id);
        setIsGroupAdmin(
          groupDetails.createdBy === user?.id || 
          currentUserMember?.role === 'admin'
        );
        
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      Alert.alert('Error', 'Failed to load group data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  };

  const handleInputChange = (field: keyof typeof groupData, value: string) => {
    setGroupData(prev => ({ ...prev, [field]: value }));
  };

  const handleUploadCoverImage = () => {
    if (!isGroupAdmin) return;

    Alert.alert('Update Cover Image', 'Choose an option', [
      { text: 'Gallery', onPress: () => openImagePicker() },
      { text: 'Remove Image', onPress: () => removeCoverImage(), style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openImagePicker = () => {
    const options: ImageLibraryOptions = { 
      mediaType: 'photo', 
      quality: 0.8, 
      maxWidth: 1000, 
      maxHeight: 1000,
      includeBase64: true 
    };
    launchImageLibrary(options, response => {
      if (response.assets && response.assets[0]) {
        uploadCoverImage(response.assets[0]);
      }
    });
  };

  const uploadCoverImage = async (asset: any) => {
    setUploadingImage(true);
    try {
      
      if (!asset.base64) {
        Alert.alert('Error', 'Failed to process image. Please try again.');
        return;
      }

      // Check file size (base64 is ~1.33x larger than original)
      const sizeInBytes = (asset.base64.length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      if (sizeInMB > 5) {
        Alert.alert('Image Too Large', 'Please select an image smaller than 5MB');
        return;
      }

      // Create data URI from base64
      const mimeType = asset.type || 'image/jpeg';
      const imageDataUri = `data:${mimeType};base64,${asset.base64}`;
      
      setGroupData(prev => ({ ...prev, coverImage: imageDataUri }));
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeCoverImage = () => {
    Alert.alert(
      'Remove Cover Image',
      'Are you sure you want to remove the group cover image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setGroupData(prev => ({ ...prev, coverImage: null }));
          }
        }
      ]
    );
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (!isGroupAdmin) return;
    if (member.userId === user?.id) {
      Alert.alert('Error', 'You cannot remove yourself from the group');
      return;
    }

    Alert.alert('Remove Member', `Remove ${member.name} from the group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (!group?.id) return;
          
          try {
            await firebaseService.removeGroupMember(group.id, member.userId);
            setGroupMembers(prev => prev.filter(m => m.userId !== member.userId));
            Alert.alert('Success', `${member.name} has been removed from the group`);
          } catch (error) {
            console.error('Error removing member:', error);
            Alert.alert('Error', 'Failed to remove member. Please try again.');
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!groupData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!group?.id) {
      Alert.alert('Error', 'Group ID not found');
      return;
    }

    setSaving(true);
    try {
      
      // Prepare update data
      const updateData: any = {
        name: groupData.name.trim(),
        description: groupData.description.trim(),
      };

      // Handle cover image
      if (groupData.coverImage) {
        // Extract base64 data from data URI if needed
        const base64Data = groupData.coverImage.startsWith('data:') 
          ? groupData.coverImage.split(',')[1] 
          : groupData.coverImage;
        updateData.coverImageBase64 = base64Data;
      } else {
        // Explicitly set to null to remove image
        updateData.coverImageBase64 = null;
      }


      // Update group in Firebase
      await firebaseService.updateGroup(group.id, updateData);
      
      // Update original data to reflect saved state
      setOriginalData(groupData);
      
      Alert.alert('Success', 'Group updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating group:', error);
      Alert.alert('Error', 'Failed to update group. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = groupMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const styles = StyleSheet.create({
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
    headerTitleContainer: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center',
      flex: 1,
    },
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText },
    unsavedIndicator: { 
      marginLeft: 8,
    },
    unsavedText: { 
      fontSize: 24, 
      color: colors.primaryButton,
      lineHeight: 24,
    },
    headerSaveButton: {
      backgroundColor: colors.primaryButton,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      minWidth: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSaveButtonText: {
      color: colors.primaryButtonText,
      fontSize: 14,
      fontWeight: '600',
    },
    placeholder: { width: 40 },
    scrollView: { flex: 1 },
    coverImageSection: { alignItems: 'center', paddingVertical: 24 },
    coverImageContainer: { borderRadius: 60, overflow: 'hidden' },
    coverImage: { width: 120, height: 120, borderRadius: 60 },
    placeholderContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    groupAvatar: { fontSize: 40 },
    placeholderText: { fontSize: 12, color: colors.secondaryText },
    inputGroup: { paddingHorizontal: 16, marginBottom: 16 },
    label: { fontSize: 14, color: colors.secondaryText, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.secondaryText,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.inputText,
      backgroundColor: colors.inputBackground,
    },
    descriptionInput: { height: 80, textAlignVertical: 'top' },
    statsSection: { 
      padding: 16,
      backgroundColor: colors.cardBackground,
      marginVertical: 8,
    },
    statItem: { 
      flexDirection: 'row', 
      justifyContent: 'space-between',
      marginVertical: 4,
    },
    statLabel: { fontSize: 14, color: colors.secondaryText },
    statValue: { fontSize: 14, fontWeight: '500', color: colors.primaryText },
    membersSection: { padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.primaryText, marginBottom: 12 },
    memberItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
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
    memberAvatarText: { color: colors.primaryText, fontWeight: 'bold' },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 14, fontWeight: '500', color: colors.primaryText },
    memberRole: { fontSize: 12, color: colors.secondaryText, marginTop: 2 },
    memberContact: { fontSize: 12, color: colors.secondaryText, marginTop: 2 },
    saveButton: {
      backgroundColor: colors.primaryButton,
      margin: 16,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButtonHighlighted: {
      backgroundColor: colors.primaryButton,
      shadowColor: colors.primaryButton,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    saveButtonInactive: {
      backgroundColor: colors.secondaryText,
      opacity: 0.6,
    },
    saveButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonText: { color: colors.primaryButtonText, fontWeight: '600' },
    saveButtonTextInactive: { 
      color: colors.primaryText, 
      opacity: 0.7 
    },
    unsavedDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primaryButtonText,
      marginLeft: 8,
    },
    saveButtonDisabled: { backgroundColor: colors.secondaryText },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: colors.secondaryText, marginTop: 12 },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Group</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryButton} />
          <Text style={styles.loadingText}>Loading group data...</Text>
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Manage Group</Text>
          {hasUnsavedChanges && (
            <View style={styles.unsavedIndicator}>
              <Text style={styles.unsavedText}>•</Text>
            </View>
          )}
        </View>
        {isGroupAdmin && hasUnsavedChanges ? (
          <TouchableOpacity
            style={styles.headerSaveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primaryButtonText} />
            ) : (
              <Text style={styles.headerSaveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Cover Image */}
        <View style={styles.coverImageSection}>
          <TouchableOpacity
            style={styles.coverImageContainer}
            onPress={handleUploadCoverImage}
            disabled={uploadingImage || !isGroupAdmin}
          >
            {uploadingImage ? (
              <ActivityIndicator size="large" color={colors.primaryButton} />
            ) : groupData.coverImage ? (
              <Image source={{ uri: ensureDataUri(groupData.coverImage) || '' }} style={styles.coverImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.groupAvatar}>🎭</Text>
                <Text style={styles.placeholderText}>Group Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Group Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            value={groupData.name}
            onChangeText={value => handleInputChange('name', value)}
            placeholder="Enter group name"
            placeholderTextColor={colors.inputPlaceholder}
            editable={isGroupAdmin}
          />
        </View>

        {/* Group Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Description</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={groupData.description}
            onChangeText={value => handleInputChange('description', value)}
            placeholder="Add short description"
            placeholderTextColor={colors.inputPlaceholder}
            multiline
            editable={isGroupAdmin}
          />
        </View>

        {/* Group Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Group Information</Text>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Members:</Text>
            <Text style={styles.statValue}>{groupMembers.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Expenses:</Text>
            <Text style={styles.statValue}>₹{firebaseGroup?.totalExpenses?.toFixed(0) || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Created On:</Text>
            <Text style={styles.statValue}>
              {firebaseGroup?.createdAt ? new Date(firebaseGroup.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Group Members */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Group Members ({groupMembers.length})</Text>
          {filteredMembers.map(member => (
            <View key={member.userId} style={styles.memberItem}>
              {member.profileImage ? (
                <Image source={{ uri: ensureDataUri(member.profileImage) || '' }} style={styles.memberAvatar} />
              ) : (
                <View style={styles.memberAvatarPlaceholder}>
                  <Text style={styles.memberAvatarText}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>
                  {member.userId === firebaseGroup?.createdBy ? 'Creator' : 
                   member.role === 'admin' ? 'Admin' : 'Member'}
                </Text>
                <Text style={styles.memberContact}>{member.phoneNumber || member.email || ''}</Text>
              </View>
              {isGroupAdmin && member.userId !== user?.id && (
                <TouchableOpacity onPress={() => handleRemoveMember(member)}>
                  <Ionicons name="person-remove" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Save Button - Only for Admins */}
        {isGroupAdmin && (
          <TouchableOpacity
            style={[
              styles.saveButton, 
              saving && styles.saveButtonDisabled,
              hasUnsavedChanges && styles.saveButtonHighlighted,
              !hasUnsavedChanges && styles.saveButtonInactive
            ]}
            onPress={handleSave}
            disabled={saving || !hasUnsavedChanges}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primaryButtonText} />
            ) : (
              <View style={styles.saveButtonContent}>
                <Text style={[
                  styles.saveButtonText,
                  !hasUnsavedChanges && styles.saveButtonTextInactive
                ]}>
                  {hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
                </Text>
                {hasUnsavedChanges && (
                  <View style={styles.unsavedDot} />
                )}
              </View>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

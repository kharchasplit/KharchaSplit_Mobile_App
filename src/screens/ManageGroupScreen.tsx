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
  const { group } = route.params || {};

  const [groupData, setGroupData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    coverImage: group?.coverImageUrl || null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(true); // Mocked as true for demo
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [group]);

  const loadGroupData = async () => {
    if (!group?.id) {
      console.log('⚠️ Missing group data');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('📂 Loading group data for:', group.id);

      // Mocked group members (replace with API call)
      const members: Member[] = [
        { userId: '1', name: 'Alice', role: 'admin', joinedAt: { seconds: 1620000000 } },
        { userId: '2', name: 'Bob', role: 'member', joinedAt: { seconds: 1630000000 } },
      ];
      setGroupMembers(members);
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
    const options: ImageLibraryOptions = { mediaType: 'photo', quality: 0.8, maxWidth: 1000, maxHeight: 1000 };
    launchImageLibrary(options, response => {
      if (response.assets && response.assets[0]) {
        uploadCoverImage(response.assets[0].uri ?? '');
      }
    });
  };

  const uploadCoverImage = async (imageUri: string) => {
    setUploadingImage(true);
    try {
      console.log('🖼️ Uploading cover image for group:', group?.id);
      // Mock upload URL
      const imageUrl = imageUri;
      setGroupData(prev => ({ ...prev, coverImage: imageUrl }));
      Alert.alert('Success', 'Cover image updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeCoverImage = async () => {
    setGroupData(prev => ({ ...prev, coverImage: null }));
    Alert.alert('Success', 'Cover image removed successfully!');
  };

  const handleRemoveMember = async (member: Member) => {
    if (!isGroupAdmin) return;
    if (member.isYou) return;

    Alert.alert('Remove Member', `Remove ${member.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setGroupMembers(prev => prev.filter(m => m.userId !== member.userId));
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!groupData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setSaving(true);
    try {
      console.log('💾 Saving group changes:', groupData);
      Alert.alert('Success', 'Group updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
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
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText },
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
    memberName: { flex: 1, fontSize: 14, color: colors.primaryText },
    saveButton: {
      backgroundColor: colors.primaryButton,
      margin: 16,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButtonText: { color: colors.primaryButtonText, fontWeight: '600' },
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
        <Text style={styles.headerTitle}>Manage Group</Text>
        <View style={styles.placeholder} />
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
              <Image source={{ uri: groupData.coverImage }} style={styles.coverImage} />
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
          />
        </View>

        {/* Group Members */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Group Members ({groupMembers.length})</Text>
          {filteredMembers.map(member => (
            <View key={member.userId} style={styles.memberItem}>
              {member.avatar ? (
                <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
              ) : (
                <View style={styles.memberAvatarPlaceholder}>
                  <Text style={styles.memberAvatarText}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.memberName}>{member.name}</Text>
              {isGroupAdmin && !member.isYou && (
                <TouchableOpacity onPress={() => handleRemoveMember(member)}>
                  <Ionicons name="person-remove" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryText} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

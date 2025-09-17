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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, ImageLibraryOptions, Asset } from 'react-native-image-picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Contacts, { Contact } from 'react-native-contacts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GroupData {
  name: string;
  description: string;
  coverImage: string | null;
}

interface CreateNewGroupScreenProps {
  onClose?: () => void;
  onSave?: (group: any) => void;
}

export const CreateNewGroupScreen: React.FC<CreateNewGroupScreenProps> = ({ onClose, onSave }) => {
  const { colors } = useTheme();
  const [groupData, setGroupData] = useState<GroupData>({
    name: '',
    description: '',
    coverImage: null,
  });

  const [selectedMembers, setSelectedMembers] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [hasContactsPermission, setHasContactsPermission] = useState(false);

  useEffect(() => {
    requestContactsPermission();
  }, []);

  const requestContactsPermission = async () => {
    try {
      let permissionResult;
      if (Platform.OS === 'android') {
        permissionResult = await request(PERMISSIONS.ANDROID.READ_CONTACTS);
      } else {
        permissionResult = await request(PERMISSIONS.IOS.CONTACTS);
      }

      if (permissionResult === RESULTS.GRANTED) {
        setHasContactsPermission(true);
        loadContacts();
      } else {
        setHasContactsPermission(false);
        Alert.alert(
          'Permission Required',
          'Please allow access to contacts to add members.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Allow Access', onPress: () => requestContactsPermission() },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      Alert.alert('Error', 'Failed to request contacts permission');
    }
  };

  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const contactsList = await Contacts.getAll();
      setContacts(contactsList);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts.');
    } finally {
      setContactsLoading(false);
    }
  };

  const handleInputChange = (field: keyof GroupData, value: string) => {
    setGroupData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectMember = (contact: Contact) => {
    const isSelected = selectedMembers.find(member => member.recordID === contact.recordID);

    if (isSelected) {
      setSelectedMembers(prev => prev.filter(member => member.recordID !== contact.recordID));
    } else {
      setSelectedMembers(prev => [...prev, contact]);
    }
  };

  const openImagePicker = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets[0]) {
        const asset: Asset = response.assets[0];
        setGroupData(prev => ({
          ...prev,
          coverImage: asset.uri || null,
        }));
      }
    });
  };

  const handleSave = () => {
    if (!groupData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    const newGroup = {
      ...groupData,
      members: selectedMembers.map(m => m.recordID),
    };

    Alert.alert('Success', 'Group created successfully!');
    if (onSave) onSave(newGroup);
    if (onClose) onClose();
  };

  const filteredContacts = contacts.filter(contact =>
    contact.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const styles = createStyles(colors);
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Group</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cover Image Upload */}
        <View style={styles.coverImageSection}>
          <TouchableOpacity style={styles.coverImageContainer} onPress={openImagePicker}>
            {groupData.coverImage ? (
              <Image source={{ uri: groupData.coverImage }} style={styles.coverImage} />
            ) : (
              <>
                <View style={styles.uploadIcon}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.uploadText}>Upload cover image</Text>
              </>
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
            placeholder="Trip to Busan 🚗"
            placeholderTextColor={colors.secondaryText}
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
            placeholderTextColor={colors.secondaryText}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Add Members Section */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Add Members</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.secondaryText} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search Person or Phone Number"
              placeholderTextColor={colors.secondaryText}
            />
          </View>

          {contactsLoading ? (
            <ActivityIndicator size="large" color={colors.primaryButton} />
          ) : !hasContactsPermission ? (
            <Text style={styles.permissionText}>Contacts permission required</Text>
          ) : filteredContacts.length === 0 ? (
            <Text style={styles.noContactsText}>No contacts found</Text>
          ) : (
            filteredContacts.map(contact => (
              <TouchableOpacity
                key={contact.recordID}
                style={styles.contactItem}
                onPress={() => handleSelectMember(contact)}>
                <Text style={styles.contactName}>{contact.displayName}</Text>
                {selectedMembers.find(m => m.recordID === contact.recordID) && (
                  <Ionicons name="checkmark" size={16} color={colors.success} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
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
    backButton: { padding: 8, borderRadius: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText },
    placeholder: { width: 40 },
    scrollView: { flex: 1 },
    coverImageSection: { alignItems: 'center', paddingVertical: 32 },
    coverImageContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.secondaryText,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    uploadText: { fontSize: 14, color: colors.secondaryText, textAlign: 'center' },
    coverImage: { width: 120, height: 120, borderRadius: 60 },
    inputGroup: { paddingHorizontal: 16, marginBottom: 20 },
    label: { fontSize: 14, color: colors.secondaryText, marginBottom: 8, fontWeight: '500' },
    input: {
      borderWidth: 1,
      borderColor: colors.cardBackground,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.primaryText,
      backgroundColor: colors.cardBackground,
    },
    descriptionInput: { height: 100, textAlignVertical: 'top' },
    membersSection: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.primaryText, marginBottom: 16 },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 25,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
    },
    searchInput: { flex: 1, fontSize: 16, color: colors.primaryText, marginLeft: 8 },
    searchIcon: { marginRight: 8 },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBackground,
    },
    contactName: { fontSize: 16, fontWeight: '600', color: colors.primaryText },
    saveButton: {
      backgroundColor: colors.primaryButton,
      marginHorizontal: 16,
      marginVertical: 24,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButtonText: { color: colors.primaryButtonText, fontSize: 16, fontWeight: '600' },
    saveButtonDisabled: { opacity: 0.6 },
    permissionText: { textAlign: 'center', color: colors.secondaryText, marginTop: 16 },
    noContactsText: { textAlign: 'center', color: colors.secondaryText, marginTop: 16 },
  });

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
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Contacts from 'react-native-contacts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Group {
  id: string;
  name: string;
}

interface Contact {
  recordID: string;
  displayName: string;
  phoneNumbers: { number: string }[];
  emailAddresses: { email: string }[];
  thumbnailPath?: string;
  isRegistered?: boolean;
  userId?: string | null;
  userInfo?: any | null;
}

interface Props {
  route: { params: { group: Group } };
  navigation: any;
}

export const AddMemberScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { group } = route.params || {};

  const [selectedMembers, setSelectedMembers] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [hasContactsPermission, setHasContactsPermission] = useState(false);
  const [loading, setLoading] = useState(false);

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
          'Please allow access to contacts to add members from your registered friends.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Allow Access', onPress: () => requestContactsPermission() },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request contacts permission');
    }
  };

  const loadContacts = async () => {
    if (!Contacts || !Contacts.getAll) return;

    setContactsLoading(true);
    try {
      const contactsList = await Contacts.getAll();
      const mappedContacts: Contact[] = contactsList.map(contact => ({
        recordID: contact.recordID,
        displayName: contact.displayName || contact.givenName || 'Unknown',
        phoneNumbers: (contact.phoneNumbers || []).map(phone => ({ number: phone.number })),
        emailAddresses: (contact.emailAddresses || []).map(email => ({ email: email.email })),
        thumbnailPath: contact.thumbnailPath,
        isRegistered: false,
        userId: null,
        userInfo: null,
      }));
      setContacts(mappedContacts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setContactsLoading(false);
    }
  };

  const handleSelectMember = (contact: Contact) => {
    const exists = selectedMembers.find(m => m.recordID === contact.recordID);
    if (exists) {
      setSelectedMembers(prev => prev.filter(m => m.recordID !== contact.recordID));
    } else {
      setSelectedMembers(prev => [...prev, contact]);
    }
  };

  const handleAddMembers = () => {
    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Please select at least one member to add');
      return;
    }

    Alert.alert('Success', `${selectedMembers.length} member(s) added successfully!`);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <TouchableOpacity style={styles(colors).backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles(colors).headerTitle}>Add Members</Text>
        <View style={styles(colors).placeholder} />
      </View>

      <ScrollView style={styles(colors).scrollView}>
        {/* Group Info */}
        <View style={styles(colors).groupInfo}>
          <Text style={styles(colors).groupName}>{group?.name}</Text>
          <Text style={styles(colors).groupDescription}>Add new members to this group</Text>
        </View>

        {/* Search Bar */}
        <View style={styles(colors).searchContainer}>
          <Ionicons name="search" size={20} color={colors.secondaryText} />
          <TextInput
            style={styles(colors).searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Person or Phone Number"
            placeholderTextColor={colors.inputPlaceholder}
          />
        </View>

        {/* Contacts */}
        {contactsLoading ? (
          <ActivityIndicator size="large" color={colors.activeIcon} />
        ) : filteredContacts.length === 0 ? (
          <Text style={{ color: colors.secondaryText, padding: 16 }}>No contacts found</Text>
        ) : (
          filteredContacts.map(contact => (
            <TouchableOpacity
              key={contact.recordID}
              style={styles(colors).contactItem}
              onPress={() => handleSelectMember(contact)}
            >
              {contact.thumbnailPath ? (
                <Image source={{ uri: contact.thumbnailPath }} style={styles(colors).contactImage} />
              ) : (
                <View style={styles(colors).contactImagePlaceholder}>
                  <Text style={styles(colors).contactImagePlaceholderText}>
                    {contact.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles(colors).contactName}>{contact.displayName}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add Button */}
      {selectedMembers.length > 0 && (
        <TouchableOpacity
          style={[styles(colors).addButton, loading && { opacity: 0.6 }]}
          onPress={handleAddMembers}
          disabled={loading}
        >
          <Text style={styles(colors).addButtonText}>
            Add {selectedMembers.length} Member{selectedMembers.length > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = (colors: ReturnType<typeof useTheme>['colors']) =>
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
    placeholder: { width: 40 },
    scrollView: { flex: 1 },
    groupInfo: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.secondaryText },
    groupName: { fontSize: 20, fontWeight: '600', color: colors.primaryText },
    groupDescription: { fontSize: 14, color: colors.secondaryText },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 25,
      paddingHorizontal: 16,
      paddingVertical: 12,
      margin: 16,
    },
    searchInput: { flex: 1, fontSize: 16, color: colors.inputText, marginLeft: 8 },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondaryText,
    },
    contactImage: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    contactImagePlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.activeIcon,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    contactImagePlaceholderText: { color: colors.primaryText, fontWeight: 'bold' },
    contactName: { color: colors.primaryText },
    addButton: {
      backgroundColor: colors.primaryButton,
      padding: 16,
      margin: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    addButtonText: { color: colors.primaryButtonText, fontWeight: '600' },
  });

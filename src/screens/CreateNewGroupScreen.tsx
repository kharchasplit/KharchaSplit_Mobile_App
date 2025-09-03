import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';

interface Group {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string | null;
  members?: any[];
  createdAt?: any;
  totalExpenses?: number;
}

interface CreateNewGroupScreenProps {
  onClose: () => void;
  onSave: (newGroup: Group) => void;
}

export const CreateNewGroupScreen: React.FC<CreateNewGroupScreenProps> = ({
  onClose,
  onSave,
}) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!groupName.trim()) return;

    const newGroup: Group = {
      id: Math.random().toString(36).substr(2, 9), // temporary random ID
      name: groupName.trim(),
      description: description.trim(),
      coverImageUrl: null,
      members: [],
      createdAt: new Date(),
      totalExpenses: 0,
    };

    onSave(newGroup);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Group</Text>

      <TextInput
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
        style={styles.input}
      />

      <TextInput
        placeholder="Description (Optional)"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />

      <View style={styles.buttons}>
        <TouchableOpacity onPress={onClose} style={[styles.button, styles.cancelButton]}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSave} style={[styles.button, styles.saveButton]}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";

import { useTheme } from '../context/ThemeContext';
import { launchImageLibrary } from "react-native-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";

interface Member {
  id: string;
  name: string;
  avatar?: string;
  isYou?: boolean;
  isSelected?: boolean;
  amount?: number;
  percentage?: number;
  shares?: number;
}

interface AddExpenseScreenProps {
  route: { params?: { group?: { id: string; name: string } } };
  navigation: any;
}

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { group } = route.params || {};

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState({ code: "INR", symbol: "₹" });
  const [paidBy, setPaidBy] = useState<Member | null>(null);
  const [splitType, setSplitType] = useState("Equal");
  const [members, setMembers] = useState<Member[]>([]);
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const categories = [
    { id: 1, name: "Food", emoji: "🍽️", color: "#FEF3C7" },
    { id: 2, name: "Transportation", emoji: "🚗", color: "#FECACA" },
    { id: 3, name: "Shopping", emoji: "🛍️", color: "#E0E7FF" },
    { id: 4, name: "Drinks", emoji: "🍺", color: "#FED7AA" },
    { id: 5, name: "Entertainment", emoji: "🎬", color: "#F3E8FF" },
    { id: 6, name: "Health", emoji: "🏥", color: "#FECACA" },
    { id: 7, name: "Other", emoji: "📝", color: "#F3F4F6" },
  ];

  const currencies = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
  ];

  useEffect(() => {
    loadGroupMembers();
  }, [group]);

  const loadGroupMembers = async () => {
    setMembersLoading(true);
    try {
      const mockMembers: Member[] = [
        { id: "1", name: "You", isYou: true },
        { id: "2", name: "Alice" },
        { id: "3", name: "Bob" },
      ];
      setGroupMembers(mockMembers);

      const initialMembers = mockMembers.map((m) => ({
        ...m,
        isSelected: true,
        amount: 0,
        percentage: 0,
        shares: 1,
      }));
      setMembers(initialMembers);
      setPaidBy(initialMembers[0]);
    } catch (error) {
      Alert.alert("Error", "Failed to load group members");
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    calculateSplit();
  }, [amount, splitType, members.map((m) => m.isSelected).join(",")]);

  const calculateSplit = () => {
    const totalAmount = parseFloat(amount) || 0;
    const selectedMembers = members.filter((m) => m.isSelected);
    if (!selectedMembers.length) return;

    let updatedMembers = [...members];
    switch (splitType) {
      case "Equal":
        const equalAmount = totalAmount / selectedMembers.length;
        updatedMembers = updatedMembers.map((m) => ({
          ...m,
          amount: m.isSelected ? equalAmount : 0,
        }));
        break;
      case "Unequal":
        updatedMembers = updatedMembers.map((m) => ({
          ...m,
          amount: m.isSelected ? m.amount || totalAmount / selectedMembers.length : 0,
        }));
        break;
      case "By Percentage":
        updatedMembers = updatedMembers.map((m) => {
          if (m.isSelected) {
            const percentage = m.percentage || 100 / selectedMembers.length;
            return { ...m, percentage, amount: (totalAmount * percentage) / 100 };
          }
          return { ...m, amount: 0, percentage: 0 };
        });
        break;
      case "By Share":
        const totalShares = selectedMembers.reduce((sum, m) => sum + (m.shares || 1), 0);
        updatedMembers = updatedMembers.map((m) => ({
          ...m,
          amount: m.isSelected ? (totalAmount * (m.shares || 1)) / totalShares : 0,
        }));
        break;
    }
    setMembers(updatedMembers);
  };

  const handleUploadReceipt = () => {
    launchImageLibrary({ mediaType: "photo", quality: 0.8 }, (response) => {
      if (response.assets && response.assets[0]) {
        setReceiptImage(response.assets[0].uri || null);
      }
    });
  };

  const handleSave = async () => {
    if (!description.trim()) return Alert.alert("Error", "Please enter a description");
    if (!amount.trim() || parseFloat(amount) <= 0) return Alert.alert("Error", "Please enter a valid amount");
    if (!selectedCategory) return Alert.alert("Error", "Please select a category");
    if (!paidBy) return Alert.alert("Error", "Please select who paid");

    const selectedMembers = members.filter((m) => m.isSelected);
    if (!selectedMembers.length) return Alert.alert("Error", "Please select members to split");

    const expenseData = {
      description,
      amount: parseFloat(amount),
      category: selectedCategory,
      paidBy,
      splitType,
      participants: selectedMembers,
      receiptUrl: receiptImage,
    };

    setLoading(true);
    try {
      console.log("Saving expense:", expenseData);
      Alert.alert("Success", "Expense saved successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter description"
            placeholderTextColor={colors.secondaryText}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount</Text>
          <TextInput
            style={styles.textInput}
            placeholder="0"
            placeholderTextColor={colors.secondaryText}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.buttonText}>Save</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadReceipt}>
          <Text style={styles.uploadText}>{receiptImage ? "Receipt Added" : "Upload Receipt"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondaryText,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: colors.primaryText },
  scrollView: { padding: 16 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: "500", color: colors.secondaryText, marginBottom: 8 },
  textInput: {
    borderWidth: 1,
    borderColor: colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.primaryText,
    backgroundColor: colors.cardBackground,
  },
  button: {
    backgroundColor: colors.primaryButton,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 12,
  },
  buttonText: { color: colors.primaryButtonText, fontSize: 16, fontWeight: "600" },
  uploadButton: {
    borderWidth: 1,
    borderColor: colors.cardBackground,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
    backgroundColor: colors.cardBackground,
  },
  uploadText: { fontSize: 14, color: colors.primaryText },
});


import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { Fingerprint } from './Fingerprint';
import { FaceID } from './FaceID';

type AccountPrivacyProps = {
  onClose: () => void;
};

type Option = {
  id: number;
  title: string;
  icon: string;
  onPress: () => void;
};

export const AccountPrivacy: React.FC<AccountPrivacyProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [showFaceID, setShowFaceID] = useState(false);

  const ApplockOptions: Option[] = [
    {
      id: 1,
      title: 'Fingerprint',
      icon: 'finger-print',
      onPress: () => setShowFingerprint(true),
    },
    {
      id: 2,
      title: 'Face ID',
      icon: 'eye',
      onPress: () => setShowFaceID(true),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScreenHeader
        title="Account Privacy"
        onBack={onClose}
      />

      <ScrollView style={styles.scrollView}>
        <Text style={styles.text}>App Lock</Text>
        {ApplockOptions.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.option}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIconContainer}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={colors.activeIcon}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{item.title}</Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.inactiveIcon}
            />
          </TouchableOpacity>
        ))}

        {/* Fingerprint Modal */}
        <Modal
          visible={showFingerprint}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <Fingerprint onClose={() => setShowFingerprint(false)} />
        </Modal>

        {/* Face ID Modal */}
        <Modal
          visible={showFaceID}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <FaceID onClose={() => setShowFaceID(false)} />
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollView: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 16,
    margin: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondaryText,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: '500',
  },
});


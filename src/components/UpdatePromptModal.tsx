import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  BackHandler,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { wp, hp } from '../utils/deviceDimensions';
import Icon from 'react-native-vector-icons/Ionicons';

interface UpdatePromptModalProps {
  visible: boolean;
  forceUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  updateMessage: string;
  onUpdate: () => void;
  onLater?: () => void;
}

export const UpdatePromptModal: React.FC<UpdatePromptModalProps> = ({
  visible,
  forceUpdate,
  currentVersion,
  latestVersion,
  updateMessage,
  onUpdate,
  onLater,
}) => {
  const { colors } = useTheme();

  // Prevent back button on force update
  React.useEffect(() => {
    if (visible && forceUpdate) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => backHandler.remove();
    }
  }, [visible, forceUpdate]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!forceUpdate && onLater) {
          onLater();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryButton }]}>
            <Icon name="cloud-download-outline" size={wp ? wp(12) : 48} color="#FFFFFF" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.primaryText }]}>
            {forceUpdate ? 'Update Required' : 'Update Available'}
          </Text>

          {/* Version Info */}
          <View style={styles.versionContainer}>
            <View style={styles.versionRow}>
              <Text style={[styles.versionLabel, { color: colors.secondaryText }]}>
                Current Version:
              </Text>
              <Text style={[styles.versionText, { color: colors.primaryText }]}>
                {currentVersion}
              </Text>
            </View>
            <Icon name="arrow-down" size={20} color={colors.secondaryText} style={styles.arrowIcon} />
            <View style={styles.versionRow}>
              <Text style={[styles.versionLabel, { color: colors.secondaryText }]}>
                Latest Version:
              </Text>
              <Text style={[styles.versionText, { color: colors.primaryButton, fontWeight: 'bold' }]}>
                {latestVersion}
              </Text>
            </View>
          </View>

          {/* Message */}
          <Text style={[styles.message, { color: colors.secondaryText }]}>
            {updateMessage}
          </Text>

          {forceUpdate && (
            <View style={[styles.warningContainer, { backgroundColor: colors.error + '15' }]}>
              <Icon name="warning-outline" size={20} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.error }]}>
                This update is required to continue using the app
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: colors.primaryButton }]}
              onPress={onUpdate}
              activeOpacity={0.8}
            >
              <Icon name="cloud-download" size={20} color="#FFFFFF" />
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>

            {!forceUpdate && onLater && (
              <TouchableOpacity
                style={[styles.laterButton, { borderColor: colors.border }]}
                onPress={onLater}
                activeOpacity={0.8}
              >
                <Text style={[styles.laterButtonText, { color: colors.secondaryText }]}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: screenWidth * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    padding: wp ? wp(6) : 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: wp ? wp(20) : 80,
    height: wp ? wp(20) : 80,
    borderRadius: wp ? wp(10) : 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp ? hp(2) : 16,
  },
  title: {
    fontSize: wp ? wp(5.5) : 22,
    fontWeight: 'bold',
    marginBottom: hp ? hp(2) : 16,
    textAlign: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: hp ? hp(2) : 16,
    width: '100%',
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: wp ? wp(4) : 16,
    marginVertical: 4,
  },
  versionLabel: {
    fontSize: wp ? wp(3.5) : 14,
    fontWeight: '500',
  },
  versionText: {
    fontSize: wp ? wp(4) : 16,
    fontWeight: '600',
  },
  arrowIcon: {
    marginVertical: 4,
  },
  message: {
    fontSize: wp ? wp(3.8) : 15,
    textAlign: 'center',
    marginBottom: hp ? hp(2) : 16,
    lineHeight: 22,
    paddingHorizontal: wp ? wp(2) : 8,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: hp ? hp(2) : 16,
    width: '100%',
    gap: 8,
  },
  warningText: {
    fontSize: wp ? wp(3.2) : 13,
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp ? hp(1.8) : 14,
    borderRadius: 12,
    gap: 8,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: wp ? wp(4) : 16,
    fontWeight: 'bold',
  },
  laterButton: {
    paddingVertical: hp ? hp(1.8) : 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: wp ? wp(4) : 16,
    fontWeight: '600',
  },
});

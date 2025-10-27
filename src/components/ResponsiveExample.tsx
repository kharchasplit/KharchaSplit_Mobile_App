import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import responsiveScreen, {
  wp,
  hp,
  s,
  vs,
  ms,
  rf,
  spacing,
  borderRadius,
  iconSizes,
  commonSizes,
  responsiveUtils
} from '../utils/responsiveScreen';
import { typography } from '../utils/typography';
import { getDeviceInfo } from '../utils/deviceDimensions';

export const ResponsiveExample: React.FC = () => {
  const { colors } = useTheme();
  const deviceInfo = getDeviceInfo();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Device Info Section */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
          Device Information
        </Text>
        <Text style={[styles.infoText, { color: colors.secondaryText }]}>
          Width: {deviceInfo.width}px
        </Text>
        <Text style={[styles.infoText, { color: colors.secondaryText }]}>
          Height: {deviceInfo.height}px
        </Text>
        <Text style={[styles.infoText, { color: colors.secondaryText }]}>
          Font Scale: {deviceInfo.fontScale.toFixed(2)}
        </Text>
        <Text style={[styles.infoText, { color: colors.secondaryText }]}>
          Device Type: {deviceInfo.isTablet ? 'Tablet' : 'Phone'}
        </Text>
        <Text style={[styles.infoText, { color: colors.secondaryText }]}>
          Size Matters: s(16)={s(16)}, vs(16)={vs(16)}, ms(16)={ms(16)}
        </Text>
      </View>

      {/* Typography Section */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
          Responsive Typography
        </Text>
        <Text style={[typography.text.headerXL, { color: colors.primaryText }]}>
          Header XL Text
        </Text>
        <Text style={[typography.text.headerLarge, { color: colors.primaryText }]}>
          Header Large Text
        </Text>
        <Text style={[typography.text.title, { color: colors.primaryText }]}>
          Title Text
        </Text>
        <Text style={[typography.text.body, { color: colors.secondaryText }]}>
          Body text that adapts to device screen size and user font preferences.
        </Text>
        <Text style={[typography.text.caption, { color: colors.secondaryText }]}>
          Caption text for small details
        </Text>
      </View>

      {/* Spacing Section */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
          Responsive Spacing
        </Text>
        <View style={styles.spacingDemo}>
          <View style={[styles.spacingBox, styles.xsSpacing, { backgroundColor: colors.primaryButton }]} />
          <View style={[styles.spacingBox, styles.smSpacing, { backgroundColor: colors.primaryButton }]} />
          <View style={[styles.spacingBox, styles.mdSpacing, { backgroundColor: colors.primaryButton }]} />
          <View style={[styles.spacingBox, styles.lgSpacing, { backgroundColor: colors.primaryButton }]} />
        </View>
      </View>

      {/* Responsive Elements */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
          Responsive Elements
        </Text>

        {/* Button Example */}
        <View style={[styles.button, { backgroundColor: colors.primaryButton }]}>
          <Text style={[typography.text.button, { color: colors.primaryButtonText }]}>
            Responsive Button
          </Text>
        </View>

        {/* Avatar Examples */}
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, styles.avatarSm, { backgroundColor: colors.primaryButton }]} />
          <View style={[styles.avatar, styles.avatarMd, { backgroundColor: colors.primaryButton }]} />
          <View style={[styles.avatar, styles.avatarLg, { backgroundColor: colors.primaryButton }]} />
        </View>
      </View>

      {/* Screen Percentage Examples */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
          Screen Percentage
        </Text>
        <View style={[styles.percentageBox, styles.width50, { backgroundColor: colors.activeIcon }]}>
          <Text style={[typography.text.caption, { color: colors.primaryButtonText }]}>50% Width</Text>
        </View>
        <View style={[styles.percentageBox, styles.width75, { backgroundColor: colors.activeIcon }]}>
          <Text style={[typography.text.caption, { color: colors.primaryButtonText }]}>75% Width</Text>
        </View>
        <View style={[styles.percentageBox, styles.width100, { backgroundColor: colors.activeIcon }]}>
          <Text style={[typography.text.caption, { color: colors.primaryButtonText }]}>100% Width</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    ...responsiveUtils.getPadding('md'),
    ...responsiveUtils.getBorderRadius('lg'),
    ...responsiveUtils.getMargin('sm'),
    ...responsiveUtils.getShadow(2),
  },
  sectionTitle: {
    ...typography.text.titleLarge,
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.text.body,
    marginBottom: spacing.xs,
  },
  spacingDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  spacingBox: {
    height: vs(24),
    borderRadius: borderRadius.sm,
  },
  xsSpacing: {
    width: s(16),
  },
  smSpacing: {
    width: s(32),
  },
  mdSpacing: {
    width: s(48),
  },
  lgSpacing: {
    width: s(64),
  },
  button: {
    height: commonSizes.buttonHeight.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    marginVertical: spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  avatar: {
    borderRadius: borderRadius.full,
  },
  avatarSm: {
    width: commonSizes.avatarSize.sm,
    height: commonSizes.avatarSize.sm,
  },
  avatarMd: {
    width: commonSizes.avatarSize.md,
    height: commonSizes.avatarSize.md,
  },
  avatarLg: {
    width: commonSizes.avatarSize.lg,
    height: commonSizes.avatarSize.lg,
  },
  percentageBox: {
    height: vs(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs,
  },
  width50: {
    width: wp(50),
  },
  width75: {
    width: wp(75),
  },
  width100: {
    width: wp(100),
  },
});
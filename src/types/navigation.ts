import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Activity: undefined;
  Profile: undefined;
  EditProfile: undefined;
  ThemeSettings: undefined;
  PaymentHistory: undefined;
  ReferralSystem: undefined;
  Settings: undefined;
  HelpAndSupport: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export interface NavigationProps {
  navigation: NavigationProp;
}

export interface ModalScreenProps {
  onClose: () => void;
}

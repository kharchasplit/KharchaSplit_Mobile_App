export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface NavigationProps {
  navigation: any;
  route?: {
    params?: any;
  };
}

export interface OTPData {
  phoneNumber: string;
  otp: string;
  expiryTime: number;
}

export interface WhatsAppAPIResponse {
  result: boolean;
  phone_number: string;
  template_name: string;
  parameteres: Array<{
    name: string;
    value: string;
  }>;
  contact: {
    id: string;
    phone: string;
    firstName: string;
    fullName: string;
    contactStatus: string;
    created: string;
  };
  validWhatsAppNumber: boolean;
}
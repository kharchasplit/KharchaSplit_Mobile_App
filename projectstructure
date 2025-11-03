
## 📁 Project Structure

KharchaSplit/
├── android/                    # Android native code
│   ├── app/                   # Android application module
│   └── gradle/                # Gradle build configuration
│
├── ios/                       # iOS native code
│   ├── KharchaSplit/         # iOS application
│   └── KharchaSplit.xcodeproj/ # Xcode project files
│
├── src/                       # Main source code
│   ├── assets/               # Static assets
│   │   └── images/           # Image resources
│   │
│   ├── components/           # Reusable UI components
│   │   ├── Dropdown.tsx
│   │   ├── ScreenHeader.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── ThemedAlert.tsx
│   │   └── UpdatePromptModal.tsx
│   │
│   ├── context/              # React Context providers
│   │   ├── AuthContext.tsx   # Authentication state management
│   │   ├── BiometricContext.tsx # Biometric authentication
│   │   └── ThemeContext.tsx  # Theme (dark/light mode) management
│   │
│   ├── navigation/           # React Navigation setup
│   │   └── Navigation routes and stack navigators
│   │
│   ├── screens/              # Application screens (38+ screens)
│   │   ├── HomeScreen.tsx
│   │   ├── GroupDetailScreen.tsx
│   │   ├── AddExpenseScreen.tsx
│   │   ├── ExpenseDetailScreen.tsx
│   │   ├── ManageGroupScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── ... (and more)
│   │
│   ├── services/             # Business logic & API services
│   │   ├── firebaseService.ts      # Firebase Firestore operations
│   │   ├── authService.ts          # Authentication logic
│   │   ├── contactsCacheService.ts # Contact caching optimization
│   │   ├── FCMService.ts           # Push notifications
│   │   ├── versionCheckService.ts  # App update checks
│   │   └── notificationService.ts  # Notification handling
│   │
│   ├── types/                # TypeScript type definitions
│   │   └── Custom types and interfaces
│   │
│   └── utils/                # Utility functions
│       └── Helper functions and constants
│
├── docs/                      # Documentation
│   ├── CLAUDE.md             # Project memory & architecture
│   ├── FIREBASE_SETUP.md     # Firebase configuration guide
│   ├── CONTACTS_OPTIMIZATION.md # Performance optimization docs
│   └── ... (implementation guides)
│
├── __tests__/                # Test files
│
├── App.tsx                   # Root application component
├── index.js                  # Application entry point
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

### Key Directories Explained

- **`/src/screens/`** - Contains all screen components (38+ screens) including authentication, groups, expenses, profiles, and settings
- **`/src/services/`** - Centralized business logic and Firebase operations for clean separation of concerns
- **`/src/context/`** - Global state management using React Context API (Auth, Theme, Biometrics)
- **`/src/components/`** - Shared, reusable UI components used across multiple screens
- **`/src/navigation/`** - Navigation configuration with React Navigation (stack, tab, and drawer navigators)
- **`/docs/`** - Technical documentation, setup guides, and implementation details

---

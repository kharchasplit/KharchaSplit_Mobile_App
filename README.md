# KharchaSplit

💸 **Smart Way to Track & Split Expenses**

**KharchaSplit** is a free, open-source mobile application built with React Native CLI and Firebase. It simplifies splitting expenses among family and friends, making shared financial management easy, intuitive, and efficient.

Whether it's a trip with friends, a shared apartment, or team event costs — KharchaSplit keeps everything transparent, fair, and easy to settle. Let's make "Who owes whom?" a question of the past! 🚀

---

## 📬 Invitation to Collaborators

We're building KharchaSplit to make shared financial management **simple, free, and accessible to everyone**. If you'd like to contribute, share feedback, or collaborate, join us on this journey! 🚀

Together, we can build the most user-friendly and powerful open-source expense management app. 💡

---

## 🚀 Getting Started

### Step 1: Start Metro
First, run the Metro bundler from the root of your project:

```bash
# Using npm
npm start

# OR using Yarn
yarn start
```

### Step 2: Build and Run the App

#### Android
```bash
# Using npm
npm run android

# OR using Yarn
yarn android
```

#### iOS
Before running on iOS, install CocoaPods (only required on first setup or when dependencies change):

```bash
bundle install
bundle exec pod install
```

Then run:
```bash
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

---

## ✨ Features

- **User Onboarding & Authentication** – Secure signup/login flow with Firebase Authentication
- **Group & Expense Management** – Create groups, add expenses, and split efficiently
- **Flexible Splitting Options** – Equal, unequal, percentage-based, and share-based splits
- **Balance Tracking** – Track who owes whom, with clear payment history and settlement optimization
- **Smart Expense Splitting** – Automatically split bills among participants based on custom ratios or equal shares
- **Visual Analytics** – Get insights on spending patterns and outstanding balances
- **Receipt Management** – Upload and store receipt images with Base64 encoding
- **Cross-Platform** – Built with React Native CLI for Android and iOS
- **Dark Mode & Modern UI** – Sleek, animated, and comfortable interface
- **Cloud Sync** – Access your data anywhere, anytime with Firebase Firestore
- **Free & Open Source** – No subscription fees, fully customizable

---

## 🔮 Future Scope

- **Push Notifications** – Reminders and real-time updates for expenses and settlements
- **In-App Payments** – Settle balances directly within the app using payment integrations
- **Receipt Scanning (OCR)** – Automatically extract expense details from receipt images
- **Advanced Reporting** – Export data to CSV/PDF and view detailed group insights
- **Integrated Expense Manager** – A more complete personal finance tool with budgeting features
- **AI-Assisted Insights** – Smart budgeting suggestions and spending pattern analysis

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React Native CLI |
| **Backend** | Firebase (Authentication, Firestore, Storage) |
| **State Management** | React Context API |
| **Navigation** | React Navigation |
| **UI Components** | Custom components with theme support |
| **Libraries & Tools** | React Native Gesture Handler, Vector Icons, Base64 Image Handling |
| **Development Tools** | Node.js, npm, Watchman, Xcode, CocoaPods, JDK, Android Studio |
| **Version Control** | Git + GitHub |

---

## 📁 Project Structure

```
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

## 💡 Project Vision

KharchaSplit aims to redefine the way people manage shared expenses — simple, transparent, and community-driven.

Our long-term goal is to make this an **AI-assisted finance companion** that not only tracks but also suggests smarter budgeting habits.

This is an open-source project, and we're excited to welcome contributors who can help us shape it into something amazing ✨

---

## 🤝 Contributing

KharchaSplit is **open source** and welcomes contributions! Whether you're a developer, designer, or tester — there's space for everyone.

### How to Contribute

1. **Check [GitHub Issues](https://github.com/kharchasplit/KharchaSplit_Mobile_App/issues)** for tasks to work on
   - Look for `good-first-issue` labels for beginner-friendly tasks
   - Check `help-wanted` for items needing attention
   - See [SUGGESTED_ISSUES.md](docs/SUGGESTED_ISSUES.md) for ideas

2. **Create or claim an issue**
   - Use issue templates for [Bug Reports, Feature Requests, or Tasks](https://github.com/kharchasplit/KharchaSplit_Mobile_App/issues/new/choose)
   - Assign yourself to avoid duplicate work
   - Read the [GitHub Issues Guide](docs/GITHUB_ISSUES_GUIDE.md) for best practices

3. **Fork the repository and create a branch**
   ```bash
   git checkout -b feature/issue-123-short-description
   ```

4. **Commit your changes with issue reference**
   ```bash
   git commit -m "feat: add feature description (#123)"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/issue-123-short-description
   ```

6. **Submit a Pull Request (PR)**
   - Link to the issue: "Closes #123"
   - Clearly explain your changes
   - Ensure all tests pass
   - Wait for code review

### 🧭 Contribution Areas

- 🎨 UI/UX design improvements
- ⚙️ API and backend optimization
- 💾 Database schema design
- 📱 Mobile responsiveness (React Native)
- 🧪 Testing and documentation
- 🤖 AI-driven insights for smart budgeting (future scope)
- 🔧 Performance optimizations
- 🌐 Internationalization and localization

### 📊 Track Development Progress

- **[View Active Issues](https://github.com/kharchasplit/KharchaSplit_Mobile_App/issues?q=is%3Aissue+is%3Aopen+label%3Ain-progress)** - See what's currently being worked on
- **[Planned Features](https://github.com/kharchasplit/KharchaSplit_Mobile_App/milestones)** - View roadmap and upcoming releases
- **[Good First Issues](https://github.com/kharchasplit/KharchaSplit_Mobile_App/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)** - Perfect for first-time contributors

> **Important**: When working on a feature, create or assign yourself to an issue first. Close the issue after completing your work. This keeps everyone informed about ongoing development!

### 🔒 Contributor Access & Workflow

GitHub does not allow anonymous or open push access to public repositories — even for open-source projects. Contributors must fork the repo and then open a pull request (PR).

#### Open Source Contribution Workflow (Recommended)

**Step 1: Keep the repository public**

The repository is public, so anyone can view and fork it. If you need to adjust visibility settings, go to:
Settings → General → Danger Zone → Change repository visibility → Public

**Step 2: Fork and clone the repository**

Contributors (including collaborators) should fork the repo and work on their own fork:

```bash
# Fork the repo from GitHub (using the "Fork" button)
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/KharchaSplit_Mobile_App.git

# Navigate to the project directory
cd KharchaSplit_Mobile_App

# Add upstream remote to keep your fork synced
git remote add upstream https://github.com/kharchasplit/KharchaSplit_Mobile_App.git
```

**Step 3: Create a feature branch**

Always create a new branch for your changes:

```bash
# Create and switch to a new branch
git checkout -b feature/issue-123-short-description

# Or for bug fixes
git checkout -b fix/issue-123-bug-description
```

**Step 4: Make changes and commit**

```bash
# Make your changes, then stage them
git add .

# Commit with a descriptive message (reference the issue number)
git commit -m "feat: add feature description (#123)"
```

**Step 5: Push to your fork**

```bash
# Push your branch to your fork
git push origin feature/issue-123-short-description
```

**Step 6: Create a Pull Request**

1. Go to your fork on GitHub
2. Click "Compare & pull request" button
3. Fill in the PR template:
   - Link to the issue: "Closes #123"
   - Clearly explain your changes
   - Add screenshots/videos if relevant
4. Submit the PR for review
5. Wait for maintainers to review and merge

**Step 7: Keep your fork synced** (optional but recommended)

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream changes into your main branch
git checkout main
git merge upstream/main

# Push updates to your fork
git push origin main
```

---

## 📘 Documentation

All technical documentation is organized in the [`/docs`](docs/) folder:

### 📋 Available Documentation

- **[CLAUDE.md](docs/CLAUDE.md)** - Complete project memory, architecture patterns, and development guidelines
- **[FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)** - Firebase configuration and integration guide
- **[UPDATE_SYSTEM_SETUP.md](docs/UPDATE_SYSTEM_SETUP.md)** - App version check and update system setup

### 🚀 Feature Implementation Guides

- **[CONTACTS_OPTIMIZATION.md](docs/CONTACTS_OPTIMIZATION.md)** - Contact loading performance optimization (caching & lazy loading)
- **[EDIT_PROFILE_IMPLEMENTATION.md](docs/EDIT_PROFILE_IMPLEMENTATION.md)** - Profile editing feature implementation
- **[EDIT_PROFILE_FIXES.md](docs/EDIT_PROFILE_FIXES.md)** - Profile editing bug fixes and improvements
- **[PROFILE_IMAGE_BASE64_IMPLEMENTATION.md](docs/PROFILE_IMAGE_BASE64_IMPLEMENTATION.md)** - Profile image handling with Base64

### 🐛 Debugging & Testing

- **[DEBUGGING_CONTACTS.md](docs/DEBUGGING_CONTACTS.md)** - Contact-related debugging guide and troubleshooting
- **[testcase.md](docs/testcase.md)** - Test cases and testing documentation

### 🤝 Collaboration & Workflow

- **[GITHUB_ISSUES_GUIDE.md](docs/GITHUB_ISSUES_GUIDE.md)** - Complete guide for using GitHub Issues effectively
- **[SUGGESTED_ISSUES.md](docs/SUGGESTED_ISSUES.md)** - Suggested issues based on current development state and future scope

> For a complete index of all documentation, see [docs/README.md](docs/README.md)

---

## 👥 Contributors

We'd like to thank the following contributors for their valuable efforts in building **KharchaSplit**:

- **Vijay Prasad** – Project Manager
- **Shubham Hinge** – Project Lead & Developer
- **Shoaib Ansari** – Frontend Developer, Backend Developer
- **Siddarth Shinde** – UI/UX Designer
- **Atharv Prasad** – Frontend Developer, Tester/QA

---

## 💬 Join the Community

Got ideas or found a bug? Let's collaborate and make KharchaSplit better together!

- 🗨️ Open a Discussion
- 🐛 Report issues under the [Issues](https://github.com/yourusername/KharchaSplit/issues) tab
- 📧 Contact: support@kharchasplit.com
- 💼 Connect on LinkedIn

---

## ⭐ Support the Project

If you find KharchaSplit useful, please **star this repo** ⭐ and share it with your friends.
Every star helps grow our community and motivates more open-source contributions! 💪

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ by the KharchaSplit Team**

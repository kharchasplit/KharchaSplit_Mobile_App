
## 🤝 Contribution Guide

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
## 👥 Contributors

We'd like to thank the following contributors for their valuable efforts in building **KharchaSplit**:

- **Vijay Prasad** – Project Manager
- **Shubham Hinge** – Project Lead & Developer
- **Shoaib Ansari** – Frontend Developer, Backend Developer
- **Siddarth Shinde** – UI/UX Designer
- **Atharv Prasad** – Frontend Developer, Tester/QA

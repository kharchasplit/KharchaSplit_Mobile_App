# Quick Start: Creating GitHub Issues

This is a simple guide to help you quickly create issues for KharchaSplit development.

## 🚀 Two Ways to Create Issues

### Method 1: Using GitHub Web Interface (Recommended)

1. **Go to Issues Page**:
   - Visit: https://github.com/kharchasplit/KharchaSplit_Mobile_App/issues
   - Click the green **"New issue"** button

2. **Choose Template**:
   - **Bug Report** 🐛 - For bugs and errors
   - **Feature Request** 🚀 - For new features
   - **Development Task** 📋 - For planned work
   - **Open a blank issue** - For other topics

3. **Fill the Form**:
   - Give it a clear title
   - Fill in all required fields (marked with *)
   - Add optional details for better clarity
   - Select appropriate labels (if you have permission)

4. **Submit**:
   - Click **"Submit new issue"**
   - Your issue gets a number (e.g., #1, #2, #3)

5. **Assign Yourself** (if working on it):
   - On the right sidebar, click "Assignees"
   - Select yourself
   - Add "in-progress" label

### Method 2: Using GitHub CLI (Advanced)

If you have GitHub CLI installed:

```bash
# Create a bug report
gh issue create --title "[BUG] Short description" --label bug --body "Detailed description"

# Create a feature request
gh issue create --title "[FEATURE] Feature name" --label enhancement --body "Feature details"

# Create a task
gh issue create --title "[TASK] Task name" --label task --body "Task details"

# List all open issues
gh issue list

# View a specific issue
gh issue view 123

# Close an issue after completing work
gh issue close 123 --comment "Completed in PR #456"
```

---

## 📝 What Issues Should You Create?

### From Your Development Work

Create issues for:

1. **Bugs You Find**
   - App crashes
   - Features not working correctly
   - UI glitches
   - Data sync problems
   - Performance issues

2. **Features You're Planning**
   - New functionality you want to add
   - Improvements to existing features
   - Better user experience ideas
   - Integration with external services

3. **Tasks You're Working On**
   - Code refactoring
   - Performance optimization
   - Documentation updates
   - Testing improvements
   - Technical debt

4. **Questions & Discussions**
   - Architecture decisions
   - Implementation approaches
   - Code review discussions
   - Feature clarifications

---

## 🎯 Issue Title Format

Use clear, descriptive titles with prefixes:

### Good Examples ✅
```
[BUG] App crashes when uploading large receipt images
[FEATURE] Add export expenses to PDF functionality
[TASK] Refactor firebaseService.ts for better error handling
[DOCS] Update API documentation for settlement methods
[PERF] Optimize contact loading on AddMemberScreen
[UI] Improve dark mode contrast on expense cards
[TEST] Add unit tests for balance calculation logic
```

### Bad Examples ❌
```
Bug in app
New feature
Fix this
Update code
Problem
Help needed
```

---

## 📋 Quick Issue Templates

### Quick Bug Report Template
```markdown
**Bug Description:**
[What's broken?]

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error

**Expected:** [What should happen]
**Actual:** [What actually happens]

**Platform:** Android / iOS / Both
**Severity:** Critical / High / Medium / Low
```

### Quick Feature Request Template
```markdown
**Feature:**
[What do you want to add?]

**Why:**
[What problem does this solve?]

**How:**
[How should it work?]

**Priority:** High / Medium / Low
```

### Quick Task Template
```markdown
**Task:**
[What needs to be done?]

**Acceptance Criteria:**
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

**Files to Modify:**
- path/to/file1.ts
- path/to/file2.ts

**Priority:** Critical / High / Medium / Low
```

---

## 🏷️ Important Labels to Use

When creating issues, try to add these labels (if you have permission):

### Status
- `needs-triage` - New issue, needs review
- `in-progress` - You're working on it
- `blocked` - Waiting on something
- `ready-for-review` - Ready for code review

### Priority
- `priority: critical` - Fix immediately
- `priority: high` - Important
- `priority: medium` - Normal
- `priority: low` - Can wait

### Type
- `bug` - Something broken
- `enhancement` - New feature
- `task` - Development work
- `documentation` - Docs update
- `good-first-issue` - Easy for beginners
- `help-wanted` - Need assistance

### Component
- `component: auth` - Authentication
- `component: expenses` - Expense management
- `component: groups` - Group management
- `component: settlements` - Settlements
- `component: ui` - User interface
- `component: firebase` - Firebase services

---

## 💡 Tips for Creating Good Issues

### DO ✅
- **Be specific**: "App crashes when uploading 10MB image" vs "App crashes"
- **Include details**: Steps to reproduce, screenshots, error logs
- **Search first**: Check if issue already exists
- **Assign yourself**: If you're working on it
- **Link related issues**: Use #123 to reference others
- **Update progress**: Comment with updates
- **Close when done**: Don't leave completed issues open

### DON'T ❌
- Don't create duplicate issues
- Don't use vague titles
- Don't combine multiple issues in one
- Don't forget to add context
- Don't leave issues abandoned
- Don't forget to link PRs

---

## 🔗 Linking Issues to Your Work

### In Commits
When committing code related to an issue:
```bash
git commit -m "fix: resolve settlement calculation bug (#123)"
git commit -m "feat: add PDF export feature (#456)"
git commit -m "docs: update Firebase setup guide (#789)"
```

### In Pull Requests
Add in your PR description:
```markdown
Closes #123

## Changes Made
- Fixed settlement calculation
- Updated tests
- Added error handling

## Testing
- [x] Tested on Android
- [x] Tested on iOS
```

When PR merges, issue #123 automatically closes!

---

## 📊 Your Personal Issue Workflow

Here's a simple workflow for your development:

### 1️⃣ **Before Starting Work**
```bash
# Create an issue for what you're about to work on
# OR assign yourself to an existing issue
```

### 2️⃣ **While Working**
```bash
# Create a branch
git checkout -b feature/issue-123-add-pdf-export

# Make your changes and commit with issue reference
git commit -m "feat: implement PDF export (#123)"

# Push your branch
git push origin feature/issue-123-add-pdf-export
```

### 3️⃣ **After Completing Work**
```bash
# Create PR on GitHub
# In PR description, add: "Closes #123"

# After PR is merged:
# - Issue closes automatically
# - Move on to next task!
```

---

## 🎯 Examples from Suggested Issues

You can start by creating any of these from [SUGGESTED_ISSUES.md](./SUGGESTED_ISSUES.md):

### High Priority Issues to Create:

1. **[TASK] Implement push notifications for expense updates**
   - Type: Development Task
   - Priority: High
   - Component: Notifications

2. **[FEATURE] Add in-app payment integration for settlements**
   - Type: Feature Request
   - Priority: High
   - Category: Payments & Settlements

3. **[FEATURE] Implement OCR scanning for receipts**
   - Type: Feature Request
   - Priority: Medium
   - Category: Expense Management

4. **[TASK] Implement offline mode with local caching**
   - Type: Development Task
   - Priority: Medium
   - Component: Firebase Services

5. **[BUG] Version check service showing as modified in git**
   - Type: Bug Report
   - Priority: Low
   - Severity: Low

### Medium Priority Issues:

6. **[FEATURE] Export expenses to CSV/PDF**
7. **[FEATURE] Expense analytics dashboard**
8. **[TASK] Optimize receipt image storage**
9. **[FEATURE] Custom expense categories**
10. **[FEATURE] Multi-currency support**

---

## 🛠️ Practice: Create Your First Issue

Let's create a simple issue together:

### Example: Documentation Issue

1. Go to: https://github.com/kharchasplit/KharchaSplit_Mobile_App/issues/new
2. Select "Development Task" template
3. Fill in:
   ```
   Title: [DOCS] Add API documentation for firebaseService methods

   Task Description: Create comprehensive API documentation for all methods in firebaseService.ts

   Task Type: Documentation

   Component: Documentation

   Acceptance Criteria:
   - [ ] Document all public methods
   - [ ] Add parameter descriptions
   - [ ] Add return type descriptions
   - [ ] Add usage examples
   - [ ] Add error handling information

   Priority: Medium

   Estimated Effort: M (4-8 hours)
   ```
4. Submit!
5. Assign to yourself if you'll work on it

---

## 📚 Need More Help?

- 📖 [Full GitHub Issues Guide](./GITHUB_ISSUES_GUIDE.md) - Comprehensive documentation
- 💡 [Suggested Issues](./SUGGESTED_ISSUES.md) - Ready-to-create issue ideas
- 🏠 [Main README](../README.md) - Project overview
- 💬 [GitHub Discussions](https://github.com/kharchasplit/KharchaSplit_Mobile_App/discussions) - Ask questions

---

## ✅ Checklist for Your First Issue

- [ ] I've searched for existing similar issues
- [ ] I've chosen the appropriate template
- [ ] I've written a clear, descriptive title
- [ ] I've filled in all required fields
- [ ] I've added relevant labels (if possible)
- [ ] I've assigned myself (if I'm working on it)
- [ ] I've linked to related issues (if any)
- [ ] I've submitted the issue!

---

**Remember**: Creating issues helps everyone stay informed about the project's progress. Don't hesitate to create issues for your work! 🚀

**Pro Tip**: It's better to create more smaller, specific issues than fewer large, vague ones!

# GitHub Issues Management Guide

## 📋 Overview

This guide explains how to use GitHub Issues effectively for tracking development work, bugs, and feature requests in KharchaSplit.

## 🎯 Why Use GitHub Issues?

- **Transparency**: Everyone can see what's being worked on
- **Collaboration**: Team members can discuss and contribute
- **Organization**: Track progress and prioritize work
- **History**: Maintain a record of decisions and changes
- **Integration**: Links with commits and pull requests

---

## 📝 Issue Types

We have 3 main issue templates:

### 1. 🐛 Bug Report
Use this when something is broken or not working as expected.

**When to use:**
- App crashes
- Features not working correctly
- UI glitches
- Data not saving properly
- Performance issues

**Example:** "[BUG] Settlement confirmation not updating balance in real-time"

### 2. 🚀 Feature Request
Use this to suggest new features or enhancements.

**When to use:**
- New functionality ideas
- Improvements to existing features
- User experience enhancements
- Integration with external services

**Example:** "[FEATURE] Add receipt OCR scanning for automatic expense detection"

### 3. 📋 Development Task
Use this for planned development work, refactoring, or improvements.

**When to use:**
- Implementation of approved features
- Code refactoring
- Performance optimization
- Documentation updates
- Technical debt reduction

**Example:** "[TASK] Implement push notifications for expense updates"

---

## 🏷️ Labels System

### Status Labels
- `needs-triage` - New issue, needs review
- `in-progress` - Currently being worked on
- `blocked` - Waiting on something else
- `ready-for-review` - Code ready for review
- `ready-to-merge` - Approved and ready to merge

### Type Labels
- `bug` - Something is broken
- `enhancement` - New feature or improvement
- `task` - Development work
- `documentation` - Documentation updates
- `good-first-issue` - Good for newcomers
- `help-wanted` - Extra attention needed

### Priority Labels
- `priority: critical` - Must be fixed immediately
- `priority: high` - Should be addressed soon
- `priority: medium` - Normal priority
- `priority: low` - Can wait

### Component Labels
- `component: auth` - Authentication related
- `component: expenses` - Expense management
- `component: groups` - Group management
- `component: settlements` - Settlement system
- `component: ui` - User interface
- `component: firebase` - Firebase services

---

## 🔄 Issue Workflow

### For New Issues

1. **Create Issue**
   - Choose appropriate template
   - Fill in all required fields
   - Add relevant labels
   - Assign to milestone (if applicable)

2. **Triage** (Maintainers)
   - Review new issues
   - Add labels
   - Assign priority
   - Assign to developer (if ready)

3. **Development**
   - Assign yourself to the issue
   - Change status to `in-progress`
   - Create feature branch: `feature/issue-123-short-description`
   - Commit with reference: `git commit -m "feat: add feature (#123)"`

4. **Review**
   - Create Pull Request
   - Link to issue: "Closes #123"
   - Update issue status to `ready-for-review`
   - Wait for code review

5. **Completion**
   - Merge PR
   - Issue automatically closes
   - Verify in production

### For Developers Working on Features

```bash
# 1. Create/assign issue for your work
# 2. Create branch from main
git checkout main
git pull origin main
git checkout -b feature/issue-123-add-notifications

# 3. Develop and commit with issue reference
git add .
git commit -m "feat: implement push notifications (#123)"

# 4. Push and create PR
git push origin feature/issue-123-add-notifications

# 5. In PR description, add:
# "Closes #123" - This will auto-close the issue when merged
```

---

## 📌 Best Practices

### Creating Issues

✅ **DO:**
- Search existing issues first to avoid duplicates
- Use descriptive titles: "[FEATURE] Add dark mode toggle" instead of "Dark mode"
- Provide detailed descriptions with examples
- Add screenshots/videos when relevant
- Link related issues
- Update issues as work progresses

❌ **DON'T:**
- Create vague issues without details
- Combine multiple unrelated requests in one issue
- Leave issues open after completion
- Ignore issue templates

### Working on Issues

✅ **DO:**
- Assign yourself before starting work
- Update status labels as you progress
- Comment with progress updates
- Ask questions if requirements are unclear
- Close issues when work is complete
- Test thoroughly before marking as done

❌ **DON'T:**
- Start work without assigning yourself
- Let issues go stale without updates
- Forget to link commits/PRs to issues
- Leave issues open after merging

### Managing Issues (Maintainers)

✅ **DO:**
- Triage new issues within 24-48 hours
- Add appropriate labels and priorities
- Close duplicate/invalid issues with explanation
- Keep issue count manageable
- Use milestones for release planning

❌ **DON'T:**
- Leave issues unlabeled
- Ignore community contributions
- Close issues without explanation
- Let critical bugs go unaddressed

---

## 🎯 Issue Examples

### Good Bug Report

```
Title: [BUG] App crashes when uploading large receipt images

**Bug Description:**
The app crashes immediately when trying to upload receipt images larger than 5MB.

**Steps to Reproduce:**
1. Go to Add Expense screen
2. Tap on "Upload Receipt"
3. Select image larger than 5MB
4. App crashes

**Expected Behavior:**
Image should be compressed and uploaded successfully

**Platform:** Android
**OS Version:** Android 13
**Severity:** High

**Error Logs:**
[Paste relevant error logs]
```

### Good Feature Request

```
Title: [FEATURE] Export expense reports to PDF

**Feature Description:**
Allow users to export their expense history as a PDF report

**Problem Statement:**
Users need to share expense summaries with accountants or for tax purposes but have no way to export data

**Proposed Solution:**
Add an "Export to PDF" button in group details that generates a formatted PDF with:
- Group name and period
- List of all expenses
- Balance summary
- Settlement history

**Priority:** Medium
**Category:** Analytics & Reports
```

### Good Development Task

```
Title: [TASK] Implement offline mode with local caching

**Task Description:**
Add offline functionality so users can view and add expenses without internet

**Task Type:** New Feature Implementation
**Component:** Firebase Services

**Acceptance Criteria:**
- [ ] Expenses cached locally using AsyncStorage
- [ ] Offline indicator shown in UI
- [ ] Pending changes sync when back online
- [ ] Handle conflict resolution
- [ ] Unit tests for offline logic

**Technical Details:**
- Use react-native-async-storage
- Implement queue for pending operations
- Add sync service with conflict resolution
- Update firebaseService.ts

**Priority:** High
**Estimated Effort:** L (1-3 days)
```

---

## 🔗 Linking Issues and PRs

### In Commits
```bash
git commit -m "fix: resolve settlement calculation bug (#123)"
git commit -m "feat: add export to PDF feature (closes #456)"
```

### In Pull Requests
Add in PR description:
- `Closes #123` - Closes the issue when PR is merged
- `Fixes #123` - Same as closes
- `Resolves #123` - Same as closes
- `Related to #123` - Links without closing

### In Issue Comments
Reference other issues:
- `See #123` - Creates a link
- `Duplicate of #123` - Marks as duplicate
- `Blocked by #123` - Shows dependency

---

## 📊 Issue Milestones

Use milestones for release planning:

- **v1.0.0 - MVP Release** - Core features
- **v1.1.0 - Notifications** - Push notification system
- **v1.2.0 - Analytics** - Reporting and insights
- **v2.0.0 - Payments** - In-app payment integration

Assign issues to milestones to track progress toward releases.

---

## 🚀 Current Development Priorities

### High Priority (In Progress)
Check the [In Progress](https://github.com/kharchasplit/KharchaSplit_Mobile_App/issues?q=is%3Aissue+is%3Aopen+label%3Ain-progress) label

### Planned Features
Check the [Planned](https://github.com/kharchasplit/KharchaSplit_Mobile_App/milestone) milestones

### Good First Issues
Check [Good First Issue](https://github.com/kharchasplit/KharchaSplit_Mobile_App/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) label for newcomer-friendly tasks

---

## 💡 Tips for Contributors

1. **Start Small**: Look for `good-first-issue` labels
2. **Ask Questions**: Comment on issues if requirements are unclear
3. **Update Progress**: Keep the team informed
4. **Test Thoroughly**: Test on both iOS and Android
5. **Document Changes**: Update docs when needed
6. **Follow Standards**: Match existing code style and patterns

---

## 📚 Additional Resources

- [GitHub Issues Documentation](https://docs.github.com/en/issues)
- [Writing Good Issue Reports](https://github.com/kharchasplit/KharchaSplit_Mobile_App/blob/main/docs/CONTRIBUTING.md)
- [Project Architecture](https://github.com/kharchasplit/KharchaSplit_Mobile_App/blob/main/docs/CLAUDE.md)
- [Development Setup](https://github.com/kharchasplit/KharchaSplit_Mobile_App/blob/main/README.md)

---

## 🆘 Need Help?

- 💬 [GitHub Discussions](https://github.com/kharchasplit/KharchaSplit_Mobile_App/discussions)
- 📧 Email: support@kharchasplit.com
- 📖 Check [docs/](https://github.com/kharchasplit/KharchaSplit_Mobile_App/tree/main/docs) folder

---

**Remember**: Good issue management leads to better collaboration and faster development! 🚀

# 🚀 GitHub Desktop Workflow for App Development

## ✅ **Why Use GitHub Desktop**

When building apps, GitHub Desktop is better than command-line Git because:
- ✅ **Handles authentication automatically** (no token issues)
- ✅ **Bypasses secret scanning** with one click
- ✅ **Visual diff viewer** - see exactly what changed
- ✅ **Easy commit management** - stage/unstage files visually
- ✅ **Branch management** - create/switch branches easily
- ✅ **Conflict resolution** - visual merge tool

---

## 🎯 **Recommended Workflow**

### **Daily Development Cycle**

1. **Start Your Day**
   - Open GitHub Desktop
   - Click "Fetch origin" to get latest changes
   - If there are updates, click "Pull origin"

2. **Code in VS Code**
   - Write your code as normal
   - Save files (Ctrl+S)
   - GitHub Desktop automatically detects changes

3. **Commit Your Work** (Every 30-60 minutes)
   - Switch to GitHub Desktop
   - Review changed files in the left panel
   - Check/uncheck files you want to commit
   - Write a commit message:
     - Summary: Brief description (e.g., "Add smart snapping feature")
     - Description: Details about what you changed
   - Click "Commit to main"

4. **Push to GitHub** (End of day or after major features)
   - Click "Push origin" button
   - If secret scanning blocks you, click "Bypass" (for template files)
   - Your work is now backed up to GitHub!

---

## 📋 **Best Practices**

### **Commit Messages**

Use this format:
```
feat: add smart snapping to wall designer

- Implemented vertex snapping
- Added midpoint snapping
- Added visual snap indicators
```

**Prefixes:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code formatting
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### **When to Commit**

✅ **DO commit:**
- After completing a feature
- After fixing a bug
- Before switching tasks
- At end of work session
- Before trying something risky

❌ **DON'T commit:**
- Broken/non-working code
- Sensitive data (real API keys, passwords)
- Large binary files (unless necessary)

### **When to Push**

✅ **Push:**
- End of each work session
- After completing a major feature
- Before sharing code with others
- At least once per day

---

## 🔧 **GitHub Desktop Features**

### **1. Visual Diff**
- Click any file to see what changed
- Green = added lines
- Red = removed lines
- Easy to review before committing

### **2. Partial Commits**
- Right-click lines in diff
- Select "Discard changes" for specific lines
- Commit only what you want

### **3. Branch Management**
- Click "Current Branch" dropdown
- Create new branch for experiments
- Switch between branches easily

### **4. Stash Changes**
- Branch menu → "Stash all changes"
- Temporarily save work without committing
- Restore later when ready

### **5. Undo Commits**
- Right-click a commit
- "Revert this commit" to undo changes
- Or "Amend commit" to fix last commit

---

## 🎨 **Integration with VS Code**

### **Recommended Setup**

1. **Code in VS Code**
   - Use VS Code for all coding
   - Don't use VS Code's Git features (they can conflict)

2. **Commit in GitHub Desktop**
   - Use GitHub Desktop for all Git operations
   - Better UI, fewer issues

3. **View Changes**
   - GitHub Desktop shows what changed
   - VS Code shows where in files

### **Keyboard Shortcuts**

In GitHub Desktop:
- `Ctrl+1` - Changes tab
- `Ctrl+2` - History tab
- `Ctrl+Enter` - Commit
- `Ctrl+P` - Push
- `Ctrl+Shift+P` - Pull

---

## 🚨 **Handling Common Issues**

### **Secret Scanning Blocked Push**

**Problem:** "Push blocked: secret detected"

**Solution:**
1. Click "Bypass" if it's a template/example
2. OR remove the real secret and commit again

### **Merge Conflicts**

**Problem:** "Cannot push - conflicts detected"

**Solution:**
1. Click "Pull origin"
2. GitHub Desktop shows conflicts
3. Click "Open in VS Code" to resolve
4. Edit files to fix conflicts
5. Save and commit

### **Large Files**

**Problem:** "File too large to push"

**Solution:**
1. Add to `.gitignore`:
   ```
   node_modules/
   .next/
   dist/
   *.log
   ```
2. Use Git LFS for necessary large files

---

## 📊 **Daily Checklist**

### **Morning**
- [ ] Open GitHub Desktop
- [ ] Fetch origin
- [ ] Pull latest changes
- [ ] Check for conflicts

### **During Development**
- [ ] Commit every 30-60 minutes
- [ ] Write clear commit messages
- [ ] Review changes before committing

### **End of Day**
- [ ] Commit all work
- [ ] Push to GitHub
- [ ] Verify push succeeded
- [ ] Close GitHub Desktop

---

## 🎯 **For This Project (Comet)**

### **Typical Workflow**

1. **Feature Development**
   ```
   Morning:
   - Pull latest changes
   - Start coding new feature
   
   During:
   - Commit: "feat: add parametric constraints"
   - Commit: "feat: add dimension-driven design"
   - Commit: "test: add tests for constraints"
   
   Evening:
   - Commit: "docs: update architecture guide"
   - Push all commits
   ```

2. **Bug Fixes**
   ```
   - Commit: "fix: resolve snap point calculation"
   - Push immediately
   ```

3. **Documentation**
   ```
   - Commit: "docs: add smart snapping guide"
   - Push with code commits
   ```

---

## 💡 **Pro Tips**

1. **Commit Often**
   - Small, frequent commits are better than large ones
   - Easier to track down bugs
   - Easier to revert if needed

2. **Use Branches for Experiments**
   - Create branch: "experiment/new-ui"
   - Try risky changes
   - Merge if successful, delete if not

3. **Review Before Pushing**
   - Check "History" tab
   - Make sure all commits are correct
   - Then push

4. **Keep GitHub Desktop Open**
   - Run it alongside VS Code
   - See changes in real-time
   - Quick commits without switching apps

---

## 🎉 **You're All Set!**

With GitHub Desktop, your workflow is now:
1. ✅ Code in VS Code
2. ✅ Commit in GitHub Desktop
3. ✅ Push when ready
4. ✅ No authentication issues
5. ✅ No secret scanning problems
6. ✅ Visual diff and history

**Happy coding!** 🚀

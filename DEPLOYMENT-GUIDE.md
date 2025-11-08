# Gmail Attachments Extractor - Deployment Guide
**Version:** 1.1
**Date:** 2024-11-07

---

## 📋 Quick Summary

This guide walks you through deploying the Gmail Attachments Extractor to Google Apps Script and setting it up for your friend to use.

**What You're Building:**
- ✅ Google Apps Script attached to a Google Sheet
- ✅ Automatic menu in the Sheet for easy access
- ✅ Configuration tab for user settings
- ✅ Extraction log for tracking progress
- ✅ Full security and privacy protection

---

## 🚀 Deployment Steps

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"Blank"** to create new sheet
3. Rename to: **"Gmail Attachments Extractor"**

---

### Step 2: Open Apps Script Editor

1. In your sheet, click **Extensions** → **Apps Script**
2. You'll see a new tab with `Code.gs` file
3. Delete the placeholder code (`function myFunction() { }`)

---

### Step 3: Paste the Script

1. Open `gmail-attachments-extractor.gs` from this directory
2. **Copy ALL the code** (Ctrl+A, Ctrl+C)
3. **Paste into Code.gs** in Apps Script editor (Ctrl+V)
4. Click **Save** (💾 icon or Ctrl+S)
5. Rename project to: **"Gmail Attachment Extractor"**

---

### Step 4: First Authorization (One-Time)

The script needs permission to access your Gmail and Drive. Let's authorize it:

1. **Close the Apps Script tab** and go back to your Google Sheet
2. **Refresh the page** (F5 or Ctrl+R)
3. Wait ~10 seconds for the menu to load
4. You should see **"Attachment Tools"** menu appear (top menu bar)

**If you don't see the menu:**
- Wait another 10 seconds (it loads after sheet opens)
- Try closing and reopening the sheet
- Check that script is saved in Apps Script editor

5. Click **"Attachment Tools"** → **"Extract Attachments"**

**You'll see authorization prompts:**

6. Click **"Review Permissions"**
7. Select your Google account
8. **You'll see "Google hasn't verified this app"** - This is NORMAL!
   - Click **"Advanced"**
   - Click **"Go to Gmail Attachment Extractor (unsafe)"**
9. Review permissions and click **"Allow"**
10. Check "Select All" if there's a checkbox
11. Click **"Continue"**

**First-time setup dialog:**

12. You'll see: **"First-Time Setup"** dialog
    - Says: "I need to create the Configuration and Extraction Log tabs"
    - Click **"OK"** to continue

13. Wait ~3 seconds while tabs are created

14. You'll see: **"Setup Complete!"** dialog
    - Click **"OK"**

---

### Step 5: Verify Setup

You should now see:

1. **Two new tabs:**
   - Configuration
   - Extraction Log

2. **New menu at top:**
   - "Attachment Tools" (between "Help" and your profile icon)

3. **Configuration tab contains:**
   ```
   Setting                    | Value
   ---------------------------|--------------------------------
   Drive Folder Name          | Gmail Attachments
   Drive Folder ID            | [Auto-populated after creation]
   Folder Patterns            | *covid*, Projects/*
   Search Trash Only?         | FALSE
   Batch Size                 | 20
   ```

**✅ If you see all of this, setup is SUCCESSFUL!**

---

### Step 6: Test the Extraction (Optional but Recommended)

Before sharing with your friend, test it yourself:

1. **Create test emails:**
   - Send yourself 2-3 emails with attachments
   - Add them to a test Gmail label (e.g., "Test/Extract")

2. **Update Configuration tab:**
   - Set Folder Patterns to: `Test/*`
   - Leave other settings as defaults

3. **Run extraction:**
   - Click "Attachment Tools" → "Extract Attachments"
   - Confirm when prompted
   - Check Extraction Log for success entries
   - Verify files appear in Google Drive

4. **If it works:** You're ready to share!
5. **If it fails:** Check TROUBLESHOOTING-GUIDE.md

---

### Step 7: Configure for Your Friend

Before sharing with your friend, customize the Configuration tab:

1. **Folder Patterns (Cell B4):**
   - Update with her actual folder patterns
   - Examples: `*project*`, `Work/*`, `Personal/Important`
   - Leave BLANK to extract ALL attachments (with warning)

2. **Other settings:**
   - Leave Drive Folder Name as-is (or customize)
   - Keep Search Trash Only = FALSE (unless she wants trash only)
   - Keep Batch Size = 20 (good default)

---

### Step 8: Make a Copy for Your Friend

**Do NOT share your original - make a copy:**

1. In your Google Sheet, click **File** → **Make a copy**
2. Name it: **"Gmail Attachments Extractor - [Friend's Name]"**
3. Check **"Copy comments and suggestions"** = OFF
4. Check **"Share it with the same people"** = OFF
5. Click **"Make a copy"**

**Share the COPY:**

6. Click **"Share"** button (top right)
7. Add your friend's email
8. Set permission to **"Editor"**
9. Add message:
   ```
   Hi! This tool will help you extract email attachments from Gmail to Drive.

   Steps:
   1. Open this sheet
   2. Go to "Attachment Tools" menu
   3. Click "Extract Attachments"
   4. Follow the prompts!

   The first time you run it, you'll need to approve permissions.
   This is normal and safe - the tool only accesses YOUR Gmail and Drive.

   IMPORTANT: When you run this, it will create a "Gmail Attachments"
   folder in YOUR Drive - completely separate from mine!
   ```

10. Click **"Send"**

**Why make a copy instead of sharing?**
- Each user gets their own Drive Folder ID
- Extraction Logs don't mix
- Configuration can be customized per-user
- No conflicts or overwriting

---

## 🧪 Testing Before Sharing

**IMPORTANT:** Test the script yourself BEFORE giving it to your friend!

### Test 1: Basic Extraction

1. **Setup test Gmail labels:**
   - Create a test label like "Test/Extract"
   - Add 2-3 emails with attachments to this label

2. **Configure for test:**
   - In Configuration tab, set Folder Patterns to: `Test/*`

3. **Run extraction:**
   - Click **"Attachment Tools"** → **"Extract Attachments"**
   - Approve any permission prompts
   - Watch for privacy warnings (click "Yes" to continue for testing)
   - Confirm extraction when prompted

4. **Verify results:**
   - Check Extraction Log tab - should show success entries
   - Go to Google Drive - find "Gmail Attachments" folder
   - Inside should be: `attachments/Test/Extract/[your files]`

**✅ If files appear in Drive, basic extraction WORKS!**

---

### Test 2: Privacy Warnings

1. **Test Sheet Privacy Warning:**
   - Click "Share" → Change to "Anyone with the link"
   - Run extraction again
   - **You should see privacy warning!**
   - Change back to "Restricted"

2. **Test Drive Folder Privacy:**
   - In Google Drive, find "Gmail Attachments" folder
   - Right-click → Share → Change to "Anyone with the link"
   - Run extraction
   - **You should see privacy warning!**
   - Change back to "Restricted"

**✅ If you see privacy warnings, security features WORK!**

---

### Test 3: Resume Capability

1. **Start extraction with many emails:**
   - Set Folder Patterns to match 50+ emails
   - Set Batch Size to 5
   - Run extraction

2. **Let it complete one batch**

3. **Run extraction again:**
   - **You should see "Resume Extraction?" dialog**
   - Click "Yes"
   - **It should continue from where it left off**

4. **Verify log:**
   - Check Extraction Log - no duplicate files
   - Progress continues

**✅ If resume works without duplicates, state management WORKS!**

---

### Test 4: Reset State

1. Click **"Attachment Tools"** → **"Reset Extraction State"**
2. You should see: **"State Reset"** confirmation
3. Run extraction again
4. **Should start from beginning** (no resume prompt)

**✅ If reset clears progress, state reset WORKS!**

---

### Test 5: Error Handling

1. **Test with no patterns:**
   - Clear Folder Patterns cell (make it empty)
   - Run extraction
   - **Should warn about extracting ALL attachments**

2. **Test with no emails:**
   - Set pattern to: `ThisLabelDoesNotExist`
   - Run extraction
   - **Should show "No Emails Found" message**

**✅ If you see appropriate warnings, error handling WORKS!**

---

## 📝 Configuration Options Explained

### Drive Folder Name (Cell B2)
- **What:** Name of folder created in Google Drive
- **Default:** "Gmail Attachments"
- **Customize:** Change to match your friend's preference
- **Example:** "Email Archives", "Extracted Files"

### Drive Folder ID (Cell B3)
- **What:** Auto-populated after first run
- **Leave as-is:** Script fills this automatically
- **Reset:** Delete this value to force creation of new folder

### Folder Patterns (Cell B4)
- **What:** Gmail label patterns to extract from
- **Format:** Comma-separated list
- **Examples:**
  ```
  *covid*                    → Matches any label containing "covid"
  Projects/*                 → Matches all labels under "Projects"
  Work/Invoices              → Exact match only
  *project*, Work/*, Personal → Multiple patterns
  ```
- **Empty:** Extracts ALL attachments (with warning)

### Search Trash Only? (Cell B5)
- **What:** Only extract from Gmail trash
- **Default:** FALSE (search all mail)
- **Use TRUE:** If friend only wants deleted emails
- **Format:** TRUE or FALSE (case-insensitive)

### Batch Size (Cell B6)
- **What:** Number of email threads per execution
- **Default:** 20 (recommended)
- **Range:** 1-50 (script enforces this)
- **Larger = faster** but may timeout
- **Smaller = slower** but more reliable

---

## 🔧 Troubleshooting

### "Script function not found" error
**Cause:** Script not saved or wrong function name
**Fix:**
1. Go to Apps Script editor
2. Click Save
3. Refresh the Google Sheet
4. Try again

---

### "Cannot find method getRange" error
**Cause:** Named ranges not set up
**Fix:**
1. In Apps Script, run `setupSheet` function
2. Refresh Google Sheet
3. Verify Configuration tab exists

---

### "Authorization required" keeps appearing
**Cause:** Permissions not fully granted
**Fix:**
1. In Apps Script editor, click Run
2. Complete full authorization flow
3. Make sure to click "Allow" at the end

---

### No "Attachment Tools" menu appears
**Cause:** Script not attached or not authorized
**Fix:**
1. Close and reopen the Google Sheet
2. Wait 10 seconds for menu to load
3. If still missing, run `onOpen` function in Apps Script

---

### "Extraction In Progress" but nothing running
**Cause:** Lock not released (previous error)
**Fix:**
1. Wait 2 minutes (lock auto-expires)
2. OR click "Attachment Tools" → "Reset Extraction State"
3. Try again

---

### Files not appearing in Drive
**Cause:** Multiple possible issues
**Fix:**
1. Check Extraction Log tab for errors
2. Verify Drive Folder ID is populated
3. Check Google Drive - search for "Gmail Attachments"
4. Verify folder patterns match actual Gmail labels

---

### "No emails found" but emails exist
**Cause:** Pattern doesn't match labels
**Fix:**
1. In Gmail, check exact label names (case matters for wildcards)
2. Try simpler pattern like `*` (all labels)
3. Check "Search Trash Only" setting

---

## 📊 Performance Guidelines

### Expected Processing Times

| Mailbox Size | Batch Size | Time per Batch | Total Time (estimate) |
|--------------|------------|----------------|----------------------|
| 50 emails    | 20         | 1-2 min        | 5-10 min             |
| 200 emails   | 20         | 2-3 min        | 20-30 min            |
| 500 emails   | 20         | 2-4 min        | 50-100 min           |

**Note:** Times vary based on:
- Attachment sizes
- Network speed
- Gmail API responsiveness
- Number of attachments per email

### Optimization Tips

1. **Larger batches** = fewer manual re-runs
   - Increase Batch Size to 30-40 for reliable network
   - Keep at 10-20 for unreliable network

2. **Run during off-peak hours**
   - API quotas refresh daily
   - Fewer timeouts during low-traffic times

3. **Filter aggressively**
   - Use specific patterns to limit scope
   - Extract one project at a time if needed

---

## 🔒 Security Reminders

### Before Sharing with Your Friend

✅ **Verify privacy warnings work** (Test 2 above)
✅ **Test with your own Gmail** first
✅ **Make a COPY, don't share original**
✅ **Set friend's permission to "Editor"**
✅ **Remind her to keep Sheet private**

### What to Tell Your Friend

**Important Privacy Notes:**
1. Keep the Google Sheet PRIVATE (don't share link publicly)
2. The Drive folder inherits your Drive's sharing settings - keep it private too
3. First run will ask for permissions - this is normal and safe
4. The script only accesses YOUR Gmail and Drive (not mine or anyone else's)
5. No data is sent externally - everything stays in your Google account

---

## 📞 Support & Next Steps

### If Your Friend Has Issues

1. **Check Extraction Log tab** - errors are logged there
2. **Check execution log** in Apps Script:
   - Extensions → Apps Script
   - Click "Executions" icon (left sidebar)
   - See detailed error messages

3. **Common fixes:**
   - Reset extraction state
   - Re-run setupSheet
   - Check configuration values

### Ready to Build?

✅ Script is complete and production-ready
✅ All security features implemented
✅ Privacy warnings functional
✅ Error handling comprehensive
✅ User-friendly dialogs included

**Next up:** Test it yourself, then share with your friend!

---

## 🎯 Quick Checklist

### Before Deployment
- [ ] Script pasted into Apps Script editor
- [ ] `setupSheet` function run successfully
- [ ] Configuration and Log tabs created
- [ ] Custom menu appears in Sheet
- [ ] All tests passed (Tests 1-5)

### Before Sharing
- [ ] Made a COPY of the sheet
- [ ] Configured folder patterns for friend
- [ ] Tested privacy warnings
- [ ] Set friend as Editor
- [ ] Sent instructions message

### After Friend Receives
- [ ] Remind about first-time permissions
- [ ] Explain privacy settings
- [ ] Be available for questions
- [ ] Check in after first run

---

**Ready to deploy! 🚀**

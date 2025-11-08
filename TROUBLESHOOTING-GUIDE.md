# Troubleshooting Guide - Enhanced Debug Version
**Version:** 1.1-debug
**Date:** 2024-11-07

---

## 🔧 What Was Added

### Enhanced Debug Logging

The script now includes **comprehensive logging** at every major step:

✅ **setupSheet function:**
- Logs spreadsheet name and ID
- Lists all existing sheets before setup
- Logs each creation step (Configuration, Extraction Log)
- Verifies tabs exist after creation
- Shows final list of all sheets
- Detailed error messages

✅ **readConfiguration function:**
- Logs all config values as they're read
- Shows raw and parsed folder patterns
- Logs batch size before/after clamping
- Shows final config as JSON

✅ **Enhanced dialogs:**
- Success dialogs now show ALL sheet names
- Error dialogs show current sheets list
- Helps verify what actually exists

---

## 📊 How to View Logs

### Method 1: Execution Log (During Run)
1. In Apps Script editor
2. Click **"Execution log"** button (top toolbar)
3. See real-time output as script runs

### Method 2: View Logs (After Run)
1. In Apps Script editor
2. Click **View** → **Logs** (or Ctrl+Enter)
3. See all Logger.log() output from last run

### Method 3: Executions Panel (Historical)
1. In Apps Script editor
2. Click **"Executions"** icon (left sidebar)
3. Click on any execution
4. See full log output

---

## 🐛 Troubleshooting Your Current Issue

### Issue: setupSheet runs successfully but tabs don't appear

**What to check:**

#### 1. Review the Execution Log

Run `setupSheet` again and look for this in the logs:

```
=== setupSheet STARTED ===
Spreadsheet: Gmail Attachments Extractor (ID: abc123...)
Current sheets: Sheet1
Step 1: Checking for Configuration sheet...
Configuration sheet NOT found - creating...
✓ Configuration sheet created: Configuration
✓ Configuration data written
✓ Configuration formatting applied
✓ Named ranges created
Step 2: Checking for Extraction Log sheet...
Extraction Log sheet NOT found - creating...
✓ Extraction Log sheet created: Extraction Log
✓ Log headers written
✓ Log formatting applied
Step 3: Final verification...
Final sheets in workbook: Sheet1, Configuration, Extraction Log
Configuration sheet present: true
Extraction Log sheet present: true
=== setupSheet COMPLETED SUCCESSFULLY ===
```

**Key questions:**
- Does it say "Configuration sheet NOT found" or "already exists"?
- Does it reach "Step 3: Final verification"?
- What does "Final sheets in workbook" show?
- Are both sheets "present: true"?

---

#### 2. Check the Success Dialog

The new success dialog shows ALL sheets in the workbook:

```
Setup Complete!
Sheet has been configured successfully!

✓ Created Configuration tab
✓ Created Extraction Log tab

Sheets in workbook:
Sheet1
Configuration
Extraction Log

Next steps:
1. Check the tabs at the bottom of this sheet
2. Update folder patterns in Configuration tab
3. Run "Attachment Tools → Extract Attachments"
```

**What this tells you:**
- If tabs ARE in the list but you don't see them → **REFRESH ISSUE**
- If tabs are NOT in the list → **CREATION FAILED** (see error logs)

---

#### 3. Refresh Strategies

If logs show tabs were created but you don't see them:

**Try these in order:**

1. **Hard refresh the Sheet:**
   - Press `Ctrl + Shift + R` (Windows)
   - Or `Cmd + Shift + R` (Mac)

2. **Close and reopen:**
   - Close the Google Sheet tab
   - Wait 5 seconds
   - Reopen the sheet from Drive

3. **Check for hidden tabs:**
   - Look at bottom-left of sheet
   - Click three-dot menu (⋮)
   - Select "Show all sheets"
   - See if Configuration/Extraction Log listed

4. **Open in different browser:**
   - Copy sheet URL
   - Open in Chrome (if using Firefox) or vice versa
   - Sometimes rendering issue

5. **Check browser extensions:**
   - Disable ad blockers temporarily
   - Disable script blockers
   - Refresh

---

## 📋 Common Error Patterns

### Error: "Range not found" or "Named range ... does not exist"

**Cause:** Named ranges weren't created properly

**Log Signs:**
```
Step 1: Checking for Configuration sheet...
✓ Configuration sheet created: Configuration
✓ Configuration data written
✓ Configuration formatting applied
Creating named ranges...
✗ ERROR creating Configuration sheet: Range not found
```

**Fix:**
1. Delete any partial Configuration tab
2. Run setupSheet again
3. If persists, manually create named ranges:
   - Data → Named ranges
   - Add: CONFIG_DRIVE_FOLDER_NAME → Configuration!B2
   - Add: CONFIG_DRIVE_FOLDER_ID → Configuration!B3
   - etc.

---

### Error: "Sheet already exists"

**Cause:** Trying to create tab that already exists (shouldn't happen with new logic)

**Log Signs:**
```
Step 1: Checking for Configuration sheet...
Configuration sheet NOT found - creating...
✗ ERROR creating Configuration sheet: A sheet with that name already exists
```

**Fix:**
This is weird - means `getSheetByName` failed to find existing sheet. Check:
1. Is there a hidden sheet named "Configuration"?
2. Are there special characters in sheet name?
3. Try deleting existing tabs and re-running

---

### Error: Execution timeout before completion

**Cause:** Script took too long (rare for setupSheet)

**Log Signs:**
```
Step 1: Checking for Configuration sheet...
Configuration sheet NOT found - creating...
✓ Configuration sheet created: Configuration
✓ Configuration data written
[LOG ENDS - NO "setupSheet COMPLETED"]
```

**Fix:**
1. Tabs probably created but verification didn't run
2. Check manually - are Configuration and Extraction Log present?
3. If yes, you're good! If no, run setupSheet again

---

## 🎯 Diagnostic Commands

### Check What Sheets Exist

Run this in Apps Script to see what's really there:

```javascript
function listAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  Logger.log('=== ALL SHEETS ===');
  Logger.log(`Spreadsheet: ${ss.getName()}`);
  Logger.log(`Total sheets: ${sheets.length}`);

  sheets.forEach((sheet, index) => {
    Logger.log(`${index + 1}. ${sheet.getName()} (ID: ${sheet.getSheetId()})`);
  });

  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Sheets in Workbook',
    `Total: ${sheets.length}\n\n` + sheets.map((s, i) => `${i+1}. ${s.getName()}`).join('\n'),
    ui.ButtonSet.OK
  );
}
```

**How to use:**
1. Paste this function at the bottom of Code.gs
2. Select `listAllSheets` from dropdown
3. Click Run
4. Check dialog and logs

---

### Force Delete and Recreate

If tabs exist but are corrupted, clean slate:

```javascript
function forceResetSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Force Reset?',
    'This will DELETE Configuration and Extraction Log tabs!\n\nContinue?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.NO) return;

  try {
    const configSheet = ss.getSheetByName('Configuration');
    if (configSheet) {
      ss.deleteSheet(configSheet);
      Logger.log('Deleted Configuration sheet');
    }

    const logSheet = ss.getSheetByName('Extraction Log');
    if (logSheet) {
      ss.deleteSheet(logSheet);
      Logger.log('Deleted Extraction Log sheet');
    }

    ui.alert('Reset Complete', 'Run Setup Sheet again to recreate.', ui.ButtonSet.OK);

  } catch (e) {
    ui.alert('Reset Error', e.message, ui.ButtonSet.OK);
  }
}
```

**How to use:**
1. Paste at bottom of Code.gs
2. Select `forceResetSheets` from dropdown
3. Click Run
4. Confirm deletion
5. Run `setupSheet` again

---

## 📸 Screenshots to Share

If you need help, grab these screenshots:

1. **Apps Script Execution Log:**
   - Show the full log output from setupSheet

2. **Success/Error Dialog:**
   - Screenshot the popup after running setupSheet

3. **Sheet Tabs:**
   - Screenshot the bottom of your Google Sheet showing tab bar

4. **Apps Script Editor:**
   - Screenshot showing project name and attached spreadsheet

---

## 🆘 Next Steps Based on Logs

### If Logs Show: "setupSheet COMPLETED SUCCESSFULLY"
**And tabs still missing:**
→ This is a **UI rendering issue**, not a script issue
→ Try all refresh strategies above
→ Tabs ARE there, just not visible to your browser

### If Logs Show: "ERROR creating Configuration sheet"
**With specific error:**
→ This is a **permissions or API issue**
→ Check error message for clues
→ Ensure you have Editor access to sheet
→ Try running in incognito mode

### If Logs Show: "Range not found" or "Named range..."
**Named ranges failed:**
→ Tabs created but configuration incomplete
→ Manually create named ranges (see above)
→ Or delete tabs and re-run setupSheet

### If Logs Are Empty or Cut Off
**Script didn't complete:**
→ Timeout (rare) or exception before logging
→ Check Executions panel for error details
→ Try running `listAllSheets()` diagnostic

---

## ✅ Success Indicators

You know it worked when:

1. **Logs show:**
   ```
   Final sheets in workbook: Sheet1, Configuration, Extraction Log
   Configuration sheet present: true
   Extraction Log sheet present: true
   === setupSheet COMPLETED SUCCESSFULLY ===
   ```

2. **Dialog shows:**
   ```
   ✓ Created Configuration tab
   ✓ Created Extraction Log tab

   Sheets in workbook:
   Sheet1
   Configuration
   Extraction Log
   ```

3. **You can see:**
   - Configuration tab at bottom of sheet
   - Extraction Log tab at bottom of sheet
   - Configuration tab has table with settings
   - Extraction Log tab has headers

---

## 📧 What to Share If Still Stuck

If you need help, provide:

1. **Full execution log** (copy/paste from View → Logs)
2. **Success/error dialog screenshot**
3. **Screenshot of sheet tabs** (bottom of screen)
4. **Output from `listAllSheets()` diagnostic**
5. **Browser and OS** (Chrome/Firefox, Windows/Mac)

---

## 🚀 Ready to Test Again?

**With enhanced logging:**

1. Open Apps Script editor
2. Select `setupSheet` from dropdown
3. Click **Run**
4. **Immediately check "Execution log"** (watch in real-time)
5. Note exactly what you see
6. Share the log output!

The logs will tell us EXACTLY what's happening now! 🔍

# Product Design Document (PDD)
## Gmail Apps Script Attachments Extractor

---

### Document Metadata
- **Version:** 1.1
- **Date:** 2024-11-07 (Updated with security enhancements)
- **Status:** Ready for Implementation
- **Author:** Product Team
- **Reviewers:** Technical Lead, Product Owner, ChatGPT Analysis

---

## 1. Executive Summary

### Product Overview
A Google Apps Script-based tool that extracts email attachments from Gmail and organizes them in Google Drive while preserving the original Gmail folder (label) structure. Designed for non-technical users to archive email attachments with minimal configuration.

### Key Features
- ✅ Automatic extraction of attachments from Gmail to Google Drive
- ✅ Preserves Gmail label hierarchy as Drive folder structure
- ✅ Wildcard-based folder filtering (e.g., `*covid*`, `Projects/*`)
- ✅ Intelligent duplicate handling with automatic file renaming
- ✅ Google Sheet control panel for easy configuration
- ✅ Auto-resume capability for large mailboxes
- ✅ Detailed logging and progress tracking

### Target Users
- Non-technical Gmail users who need to archive attachments
- Users with organized Gmail label structures
- Small to medium mailboxes (<500 attachments initially)

---

## 2. Product Vision & Goals

### Vision Statement
> Empower non-technical users to effortlessly archive their Gmail attachments to Google Drive while maintaining organizational structure, enabling easy access, backup, and offline usage.

### Primary Goals
1. **Simplicity:** One-click extraction after minimal configuration
2. **Preservation:** Maintain Gmail folder hierarchy in Drive
3. **Reliability:** Handle interruptions gracefully with auto-resume
4. **Transparency:** Clear progress tracking and error reporting
5. **Safety:** Prevent data loss and handle edge cases defensively

### Success Criteria
- User can set up and run extraction in <5 minutes
- Zero data loss during extraction
- Handles mailboxes up to 500 attachments without manual intervention
- Clear error messages for all failure scenarios

---

## 3. User Personas & Use Cases

### Primary Persona: "Sarah - The Project Manager"
**Background:**
- Non-technical Gmail user
- Manages multiple projects via email
- Organized Gmail with labels: `Projects/COVID`, `Work/Invoices`, etc.
- Needs to archive attachments for compliance/backup

**Goals:**
- Extract all project attachments to Drive for long-term storage
- Maintain folder organization for easy navigation
- Avoid manual download of hundreds of files

**Pain Points:**
- No bulk download feature in Gmail
- Loses folder context when downloading individually
- Risk of missing attachments across multiple folders

### Use Cases

#### UC1: First-Time Setup
**Actor:** Sarah
**Preconditions:** Has Gmail with labeled emails containing attachments
**Flow:**
1. Opens shared Google Sheet "Gmail Attachment Extractor"
2. Sheet prompts for permission to access Gmail and Drive
3. Reviews permissions and clicks "Allow"
4. Sheet auto-creates Drive folder "Gmail Attachments"
5. Populates Drive Folder ID in configuration tab
6. Ready to run extraction

**Postconditions:** Sheet configured and ready for extraction

---

#### UC2: Extract Attachments from Specific Folders
**Actor:** Sarah
**Preconditions:** Sheet configured (UC1 complete)
**Flow:**
1. Opens "Configuration" tab in Sheet
2. Enters folder patterns: `*covid*, Projects/*`
3. Clicks menu: "Attachment Tools" → "Extract Attachments"
4. Script searches Gmail for matching labels
5. Shows confirmation: "Found 47 emails with 123 attachments. Continue?"
6. User confirms
7. Script extracts attachments to Drive with progress updates
8. Logs each file in "Extraction Log" tab
9. Shows completion message: "Extracted 123 attachments successfully!"

**Postconditions:** Attachments saved to Drive, log populated

---

#### UC3: Resume After Interruption
**Actor:** Sarah
**Preconditions:** Previous extraction interrupted (timeout/error)
**Flow:**
1. Opens Sheet, sees last log entry: "Processed 50 of 123 attachments"
2. Clicks "Extract Attachments" again
3. Script detects saved state and resumes from attachment #51
4. Continues extraction until complete

**Postconditions:** Extraction completes without re-downloading existing files

---

#### UC4: Handle Duplicate Filenames
**Actor:** Sarah
**Preconditions:** Mailbox contains multiple files with same name/date
**Flow:**
1. Script encounters `invoice.pdf` dated 2024-01-15 (already saved)
2. Detects conflict in same Drive folder
3. Renames new file to `invoice_2024-01-15-2.pdf`
4. Logs: "Renamed duplicate: invoice.pdf → invoice_2024-01-15-2.pdf"
5. Continues extraction

**Postconditions:** All files saved, no overwrites

---

#### UC5: Extract All Attachments (No Filters)
**Actor:** Sarah
**Preconditions:** Wants to extract ALL attachments regardless of labels
**Flow:**
1. Opens Configuration tab
2. Leaves "Folder Patterns" cell EMPTY
3. Clicks "Extract Attachments"
4. Script detects empty filter and shows warning popup:
   ```
   WARNING: No folder filters specified!
   This will extract ALL attachments from your entire mailbox.
   This could take a very long time and may hit Gmail API limits.

   Do you want to:
   [Specify Folders Manually] [Continue Anyway] [Cancel]
   ```
5. User clicks "Specify Folders Manually"
6. Popup shows: "Enter folder labels (comma-separated): ___"
7. User types: `Work/*, Personal/Important`
8. Script proceeds with specified filters

**Postconditions:** User prevented from accidental mass extraction

---

## 4. Functional Requirements (MVP)

### FR1: Configuration Management
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR1.1 | User can specify Drive folder name in Sheet | MUST | Auto-creates folder if not exists |
| FR1.2 | User can specify comma-separated folder patterns | MUST | Supports wildcards: `*`, `?` |
| FR1.3 | User can toggle "Search Trash Only" mode | SHOULD | Default: FALSE |
| FR1.4 | User can configure batch size | COULD | Default: 20 threads/batch |
| FR1.5 | Script auto-populates Drive Folder ID after creation | MUST | Writes back to Sheet |

### FR2: Gmail Search & Filtering
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR2.1 | Support wildcard patterns: `*`, `?` | MUST | Case-insensitive |
| FR2.2 | Match labels containing pattern (e.g., `*covid*`) | MUST | Partial matching |
| FR2.3 | Match labels starting with pattern (e.g., `Work/*`) | MUST | Hierarchical matching |
| FR2.4 | Search all mail by default (not trash) | MUST | Configurable via FR1.3 |
| FR2.5 | Skip emails without attachments silently | MUST | No logging |
| FR2.6 | Handle multiple labels per email | MUST | Save to all matching folders |

### FR3: Attachment Extraction
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR3.1 | Preserve Gmail label hierarchy as Drive folders | MUST | Full path replication |
| FR3.2 | Filename format: `name_YYYY-MM-DD.ext` | MUST | Uses email sent date |
| FR3.3 | Duplicate handling: append `-2`, `-3`, etc. | MUST | Per-folder basis |
| FR3.4 | Sanitize invalid filename characters | MUST | Replace with dash `-` |
| FR3.5 | Root folder: `attachments/` in Drive | MUST | Organizational clarity |
| FR3.6 | Unlabeled emails → `attachments/Inbox/` | MUST | Fallback location |
| FR3.7 | Multi-label emails → save to all folders | MUST | Duplicate file in Drive |

### FR4: Progress Tracking & Resumption
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR4.1 | Save processing state in Sheet Properties | MUST | Survives script timeout |
| FR4.2 | Auto-resume from last processed email | MUST | Transparent to user |
| FR4.3 | Log each extraction in "Extraction Log" tab | MUST | Timestamp, status, path |
| FR4.4 | Show progress popup during execution | SHOULD | "Processing 23 of 123..." |
| FR4.5 | Clear state after successful completion | MUST | Prevents stale state |

### FR5: Error Handling & Edge Cases
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR5.1 | Handle 6-minute Apps Script timeout | MUST | Save state and prompt re-run |
| FR5.2 | Handle Drive API quota exceeded | MUST | Stop gracefully with error msg |
| FR5.3 | Handle Drive storage full | MUST | Stop and notify user |
| FR5.4 | Handle network errors during download | SHOULD | Log and continue |
| FR5.5 | Handle invalid/corrupted attachments | SHOULD | Log error, skip file |
| FR5.6 | Warn if no filters specified (all mail) | MUST | Confirmation dialog |
| FR5.7 | Replace invalid filename chars: `<>:"/\|?*` | MUST | Use dash `-` |
| FR5.8 | Handle extremely long folder paths | SHOULD | Truncate if needed |

### FR6: User Interface (Google Sheet)
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR6.1 | Tab 1: "Configuration" with named cells | MUST | User-friendly labels |
| FR6.2 | Tab 2: "Extraction Log" auto-generated | MUST | Columns: timestamp, status, folder, filename, message |
| FR6.3 | Custom menu: "Attachment Tools" | MUST | "Extract Attachments" menu item |
| FR6.4 | First-run permission dialog | MUST | Gmail + Drive scopes |
| FR6.5 | Confirmation dialog before extraction | SHOULD | Show count of emails/attachments |
| FR6.6 | Completion dialog with summary | MUST | "Extracted X attachments" |
| FR6.7 | Check and warn if Sheet is publicly shared | MUST | Privacy protection on init |
| FR6.8 | Reset extraction state menu option | SHOULD | "Attachment Tools → Reset State" |

---

## 5. Technical Architecture

### 5.1 Technology Stack
- **Platform:** Google Apps Script (JavaScript runtime)
- **APIs:** Gmail API, Drive API (via Apps Script services)
- **Storage:** Google Sheet (config + logs), Script Properties (state)
- **Authentication:** OAuth2 (automatic via Apps Script)

### 5.2 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Sheet (UI Layer)                   │
│  ┌─────────────────┐  ┌──────────────────────────────────┐ │
│  │  Configuration  │  │      Extraction Log              │ │
│  │  Tab            │  │      Tab                         │ │
│  └─────────────────┘  └──────────────────────────────────┘ │
│                                                              │
│  Custom Menu: "Attachment Tools" → "Extract Attachments"   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Apps Script (Business Logic Layer)              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Main Controller: extractAttachmentsBatch()          │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │ Gmail Service   │  │ Drive Service   │  │ State Mgr  │ │
│  │ - Search labels │  │ - Create folders│  │ - Save idx │ │
│  │ - Get messages  │  │ - Upload files  │  │ - Resume   │ │
│  │ - Get attachmts │  │ - Check dupes   │  │ - Clear    │ │
│  └─────────────────┘  └─────────────────┘  └────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Helper Functions                                     │  │
│  │  - wildcardToRegExp()                                 │  │
│  │  - sanitizeFilename()                                 │  │
│  │  - generateUniqueFilename()                           │  │
│  │  - logExtraction()                                    │  │
│  │  - checkSheetPrivacy()          [NEW - Security]     │  │
│  │  - checkDriveFolderPrivacy()    [NEW - Security]     │  │
│  │  - acquireExecutionLock()        [NEW - Concurrency] │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌─────────────────┐                  ┌─────────────────┐  │
│  │   Gmail API     │                  │   Drive API     │  │
│  │  (GmailApp)     │                  │ (DriveApp)      │  │
│  └─────────────────┘                  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Data Models

#### Configuration Object (from Sheet)
```javascript
{
  driveFolderName: String,        // "Gmail Attachments"
  driveFolderId: String,          // "abc123xyz" (auto-populated)
  folderPatterns: String[],       // ["*covid*", "Projects/*"]
  searchTrashOnly: Boolean,       // false
  batchSize: Number,              // 20
  skipNoAttachments: Boolean      // true
}
```

#### Processing State (Script Properties)
```javascript
{
  lastProcessedThreadIndex: Number,  // Resume point
  totalThreadsFound: Number,         // For progress calculation
  allThreadIds: String[],            // Serialized list of thread IDs
  isProcessing: Boolean              // Prevent concurrent runs
}
```

#### Extraction Log Entry (Sheet Row)
```javascript
{
  timestamp: Date,          // "2024-03-15 14:32:15"
  status: String,           // "✓ Success" | "⚠ Warning" | "✗ Error"
  folderPath: String,       // "Projects/COVID/2023"
  filename: String,         // "report_2024-03-15.pdf"
  message: String,          // "Saved successfully" | "Renamed duplicate"
  emailSubject: String,     // Optional: for debugging
  emailDate: Date          // Optional: email sent date
}
```

### 5.4 Core Algorithms

#### 5.4.1 Wildcard Matching Algorithm
```javascript
/**
 * Converts shell-style wildcard to RegExp
 * Examples:
 *   "*covid*"     → /^.*covid.*$/i
 *   "Projects/*"  → /^Projects\/.*$/i
 *   "Work/?"      → /^Work\/.$/i
 */
function wildcardToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // Escape regex chars
    .replace(/\*/g, '.*')                   // * → match any chars
    .replace(/\?/g, '.');                   // ? → match one char
  return new RegExp('^' + escaped + '$', 'i');
}
```

#### 5.4.2 Duplicate Filename Resolution
```javascript
/**
 * Generates unique filename if conflict exists
 * Logic:
 *   1. Check if "name_YYYY-MM-DD.ext" exists
 *   2. If yes, try "name_YYYY-MM-DD-2.ext"
 *   3. Increment until unique
 */
function generateUniqueFilename(baseFilename, date, extension, folder) {
  const baseName = `${baseFilename}_${formatDate(date, 'yyyy-MM-dd')}`;
  let filename = `${baseName}.${extension}`;
  let counter = 2;

  // Check Drive folder for existing files
  const files = folder.getFilesByName(filename);
  while (files.hasNext()) {
    filename = `${baseName}-${counter}.${extension}`;
    counter++;
    files = folder.getFilesByName(filename);
  }

  return filename;
}
```

#### 5.4.3 Folder Structure Replication
```javascript
/**
 * Creates nested Drive folder structure from Gmail label
 * Example: "Projects/COVID/2023" → [attachments]/[Projects]/[COVID]/[2023]
 */
function getOrCreateDriveFolderPath(labelPath, rootFolder) {
  const pathParts = labelPath.split('/');
  let currentFolder = rootFolder.getFoldersByName('attachments').next()
                   || rootFolder.createFolder('attachments');

  for (const part of pathParts) {
    const sanitized = sanitizeFolderName(part);
    const existing = currentFolder.getFoldersByName(sanitized);

    if (existing.hasNext()) {
      currentFolder = existing.next();
    } else {
      currentFolder = currentFolder.createFolder(sanitized);
    }
  }

  return currentFolder;
}
```

#### 5.4.4 Privacy & Security Functions
```javascript
/**
 * Checks if the Google Sheet is publicly accessible and warns user
 * Called on script initialization and before extraction
 */
function checkSheetPrivacy() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const file = DriveApp.getFileById(ss.getId());
    const access = file.getSharingAccess();

    // Check if sheet is publicly accessible
    if (access === DriveApp.Access.ANYONE ||
        access === DriveApp.Access.ANYONE_WITH_LINK) {

      const ui = SpreadsheetApp.getUi();
      const response = ui.alert(
        '⚠️ Privacy Warning',
        'Your Google Sheet is publicly accessible!\n\n' +
        'This means anyone with the link can view your:\n' +
        '• Configuration settings\n' +
        '• Extraction logs (including email subjects)\n\n' +
        'Recommendation: Click "Share" button (top right) and change ' +
        '"Anyone with the link" to "Restricted".\n\n' +
        'Continue extraction anyway?',
        ui.ButtonSet.YES_NO
      );

      if (response === ui.Button.NO) {
        throw new Error('Extraction cancelled by user due to privacy concerns.');
      }

      // Log the warning
      Logger.log('WARNING: Sheet is publicly accessible but user chose to continue.');
    }

  } catch (e) {
    // If we can't check permissions, log but don't block
    Logger.log(`Unable to check sheet privacy: ${e.message}`);
  }
}

/**
 * Checks if Drive folder is publicly accessible and warns user
 * Called after creating/accessing the Drive folder
 */
function checkDriveFolderPrivacy(folderId) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const access = folder.getSharingAccess();

    // Check if folder is publicly accessible
    if (access === DriveApp.Access.ANYONE ||
        access === DriveApp.Access.ANYONE_WITH_LINK) {

      const ui = SpreadsheetApp.getUi();
      ui.alert(
        '⚠️ Drive Folder Privacy Notice',
        'Your "Gmail Attachments" folder is publicly accessible.\n\n' +
        'Your extracted email attachments may be visible to anyone with the link.\n\n' +
        'To fix this:\n' +
        '1. Open Google Drive\n' +
        '2. Right-click "Gmail Attachments" folder\n' +
        '3. Click "Share"\n' +
        '4. Change to "Restricted"\n\n' +
        'This warning will not block extraction.',
        ui.ButtonSet.OK
      );

      Logger.log('WARNING: Drive folder is publicly accessible.');
    }

  } catch (e) {
    // If we can't check permissions, log but don't block
    Logger.log(`Unable to check Drive folder privacy: ${e.message}`);
  }
}

/**
 * Sanitizes filename to handle unicode, emojis, and invalid characters
 * Ensures compatibility across different file systems
 */
function sanitizeFilename(filename) {
  return filename
    .normalize('NFD')                        // Normalize unicode
    .replace(/[\u0300-\u036f]/g, '')         // Remove diacritics
    .replace(/[\u{1F600}-\u{1F6FF}]/gu, '_') // Replace emojis
    .replace(/[<>:"/\\|?*]/g, '-')           // Replace invalid chars
    .replace(/\s+/g, '_')                    // Replace spaces with underscore
    .replace(/^\.+/, '')                     // Remove leading dots
    .substring(0, 200);                      // Limit length
}

/**
 * Gets or creates a lock to prevent concurrent executions
 * Returns lock object or throws error if already locked
 */
function acquireExecutionLock() {
  const lockService = LockService.getScriptLock();

  try {
    // Wait up to 1 second to acquire lock
    const hasLock = lockService.waitLock(1000);

    if (!hasLock) {
      throw new Error('Another extraction is already running. Please wait.');
    }

    return lockService;

  } catch (e) {
    SpreadsheetApp.getUi().alert(
      'Extraction In Progress',
      'Another extraction is already running.\n\n' +
      'Please wait for it to complete or check if you have another ' +
      'copy of this sheet open.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    throw e;
  }
}
```

---

## 6. Configuration & Setup

### 6.1 Google Sheet Structure

#### Configuration Tab (User Input)
```
┌──────────────────────────────────────────────────────────────┐
│ A                    │ B                                      │
├──────────────────────────────────────────────────────────────┤
│ Setting              │ Value                                  │
├──────────────────────────────────────────────────────────────┤
│ Drive Folder Name    │ Gmail Attachments                      │
│ Drive Folder ID      │ [Auto-populated after creation]        │
│ Folder Patterns      │ *covid*, Projects/*, Work/Invoices     │
│ Search Trash Only?   │ FALSE                                  │
│ Batch Size           │ 20                                     │
│ Skip No Attachments? │ TRUE                                   │
└──────────────────────────────────────────────────────────────┘

Instructions (below table):
- Drive Folder Name: Short name for your attachments folder
- Folder Patterns: Comma-separated wildcards (leave empty for ALL)
- Search Trash Only: Set to TRUE to only process deleted emails
- Batch Size: Number of email threads per execution (20 recommended)
```

#### Extraction Log Tab (Auto-Generated)
```
┌─────────┬────────┬──────────────┬─────────────────┬──────────────┬──────────┐
│Timestamp│Status  │Folder Path   │Filename         │Message       │Subject   │
├─────────┼────────┼──────────────┼─────────────────┼──────────────┼──────────┤
│3/15 2PM │✓       │Projects/COVID│report_2024-03-15│Saved success │COVID Rpt │
│3/15 2PM │✓       │Work/Invoices │invoice_2024-01…│Renamed dupe  │Jan Invoice│
│3/15 2PM │⚠       │Personal/Tax  │W2_2024-01-31.pdf│Large file    │Tax Docs  │
└─────────┴────────┴──────────────┴─────────────────┴──────────────┴──────────┘
```

### 6.2 Named Ranges (for programmatic access)
- `CONFIG_DRIVE_FOLDER_NAME` → Configuration!B2
- `CONFIG_DRIVE_FOLDER_ID` → Configuration!B3
- `CONFIG_FOLDER_PATTERNS` → Configuration!B4
- `CONFIG_SEARCH_TRASH` → Configuration!B5
- `CONFIG_BATCH_SIZE` → Configuration!B6

---

## 7. User Experience Flow

### 7.1 First-Time Setup Flow
```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User receives Google Sheet link                     │
│         "Gmail Attachment Extractor - Setup"                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: User opens Sheet                                     │
│         Sees welcome message + instructions                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: User clicks menu "Attachment Tools"                  │
│         First-time permission dialog appears                 │
│         "This script needs access to Gmail & Drive"          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: User reviews permissions and clicks "Allow"          │
│         OAuth consent screen (Gmail + Drive scopes)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Script auto-runs setup                               │
│         Creates "Gmail Attachments" folder in Drive          │
│         Populates Drive Folder ID in Sheet                   │
│         Shows success: "Setup complete! Ready to extract."   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 6: User configures folder patterns                      │
│         Enters: "*covid*, Projects/*"                        │
│         Clicks "Extract Attachments"                         │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Extraction Flow (Normal Case)
```
User clicks "Extract Attachments"
            ↓
┌─────────────────────────────────────────────────────────────┐
│ Script validates configuration                               │
│ - Drive folder exists?                                       │
│ - Patterns provided? (if not, show warning)                  │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│ Script searches Gmail                                        │
│ Progress toast: "Searching for matching emails..."          │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│ Confirmation Dialog                                          │
│ "Found 47 emails with 123 attachments in:                   │
│  - Projects/COVID (34 files)                                 │
│  - Work/Invoices (89 files)                                  │
│                                                              │
│ Estimated time: 5-10 minutes                                 │
│ [Continue] [Cancel]"                                         │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│ Script processes batch                                       │
│ Progress updates every 10 files:                             │
│ "Processing: 23 of 123 attachments..."                      │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│ Completion Dialog                                            │
│ "✓ Extraction Complete!                                     │
│  123 attachments saved to Drive                              │
│  2 duplicates renamed                                        │
│  0 errors                                                    │
│                                                              │
│ View folder: [Open Drive] [View Log] [OK]"                  │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Resume Flow (After Timeout)
```
User clicks "Extract Attachments" (script previously timed out)
            ↓
┌─────────────────────────────────────────────────────────────┐
│ Script detects saved state                                   │
│ "Previous extraction in progress:                            │
│  - Processed: 50 of 123 attachments                         │
│  - Last file: invoice_2024-03-15.pdf                        │
│                                                              │
│ [Resume] [Start Over] [Cancel]"                             │
└─────────────────────────────────────────────────────────────┘
            ↓ (user clicks Resume)
┌─────────────────────────────────────────────────────────────┐
│ Script continues from attachment #51                         │
│ Progress: "Resuming... 51 of 123"                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Data Flow & Processing Logic

### 8.1 High-Level Process Flow
```
START
  ↓
[1. Security & Lock Check]
  ├─ Acquire execution lock → Prevent concurrent runs
  ├─ Check sheet privacy → Warn if publicly accessible
  └─ Check Drive folder privacy → Warn if public
  ↓
[2. Read Configuration from Sheet]
  ↓
[3. Validate Config & Setup]
  ├─ Drive folder exists? → Create if needed
  ├─ Patterns provided? → Warn if empty
  └─ State exists? → Prompt resume
  ↓
[4. Search Gmail for Matching Threads]
  ├─ Get labels matching wildcards
  ├─ Build Gmail search queries
  ├─ Deduplicate threads
  └─ Sort by date (newest first)
  ↓
[5. Confirmation Dialog]
  ├─ Show counts (emails, attachments, folders)
  ├─ User cancels? → END
  └─ User confirms? → Continue
  ↓
[6. Process Batch of Threads]
  FOR EACH thread (up to BATCH_SIZE):
    ├─ Get all messages in thread
    ├─ Get thread labels (Gmail folders)
    │
    FOR EACH message:
      ├─ Skip if no attachments → Continue
      │
      FOR EACH attachment:
        ├─ Get attachment metadata (name, size, type)
        ├─ Sanitize filename
        ├─ Format with date: name_YYYY-MM-DD.ext
        │
        FOR EACH label on thread:
          ├─ Create/get Drive folder path
          ├─ Check for duplicate filename
          ├─ Rename if needed (append -2, -3, etc.)
          ├─ Download attachment from Gmail
          ├─ Upload to Drive folder
          ├─ Log success/error to Sheet
          └─ Update progress
  ↓
[7. Save State]
  ├─ Update lastProcessedThreadIndex
  ├─ Save to Script Properties
  ├─ Release execution lock
  ↓
[8. Check Completion]
  ├─ More threads remaining?
  │   YES → Show "Batch complete, run again to continue"
  │   NO  → Clear state, show "Extraction complete!"
  ↓
END
```

### 8.2 Detailed Extraction Logic (Per Attachment)

```javascript
FUNCTION extractAttachment(message, attachment, threadLabels) {
  // 1. Sanitize filename
  originalName = attachment.getName()
  baseName = sanitizeFilename(removeExtension(originalName))
  extension = getExtension(originalName)

  // 2. Get email date
  emailDate = message.getDate()  // Uses sent date
  dateStr = formatDate(emailDate, 'yyyy-MM-dd')

  // 3. Build initial filename
  targetFilename = `${baseName}_${dateStr}.${extension}`

  // 4. Process for each label
  FOR EACH label IN threadLabels:
    // 4a. Create Drive folder path
    labelPath = label.getName()  // e.g., "Projects/COVID/2023"
    driveFolder = getOrCreateDriveFolderPath(labelPath, rootFolder)

    // 4b. Check for duplicates
    finalFilename = generateUniqueFilename(
      baseName, emailDate, extension, driveFolder
    )

    // 4c. Download and upload
    TRY:
      blob = attachment.copyBlob()  // Download from Gmail
      file = driveFolder.createFile(blob.setName(finalFilename))

      logEntry = {
        timestamp: now(),
        status: "✓ Success",
        folderPath: labelPath,
        filename: finalFilename,
        message: finalFilename != targetFilename
                  ? "Renamed duplicate"
                  : "Saved successfully",
        emailSubject: message.getSubject()
      }

    CATCH error:
      logEntry = {
        timestamp: now(),
        status: "✗ Error",
        folderPath: labelPath,
        filename: targetFilename,
        message: error.toString(),
        emailSubject: message.getSubject()
      }

    // 4d. Log to Sheet
    appendLogEntry(logEntry)
  END FOR
}
```

---

## 9. Edge Cases & Error Handling

### 9.1 Edge Case Matrix

| Edge Case | Detection | Handling | User Feedback |
|-----------|-----------|----------|---------------|
| **No folder patterns provided** | Check if CONFIG_FOLDER_PATTERNS is empty | Show warning dialog: "Extract ALL attachments?" | Popup with options: [Specify Manually] [Continue] [Cancel] |
| **Invalid Drive Folder ID** | Try to access folder, catch exception | Attempt to recreate folder, update ID | "Drive folder not found, creating new one..." |
| **Gmail API quota exceeded** | Catch QuotaExceededException | Stop gracefully, save state | "Daily Gmail limit reached. Please try again tomorrow. Progress saved." |
| **Drive storage full** | Catch storage exception on upload | Stop extraction, log error | "Drive storage full. Free up space and run again." |
| **Network timeout** | Catch timeout exception | Retry 3 times, then skip file | Log: "⚠ Warning: Failed to download [file] after 3 retries" |
| **Attachment > 25MB** | Check attachment.getSize() | Attempt upload anyway (Drive supports) | Log: "⚠ Large file: [file] (28MB)" |
| **6-minute script timeout** | Apps Script enforces automatically | Save state at regular intervals | "Execution timeout. Progress saved. Click 'Extract Attachments' again to continue." |
| **Corrupted attachment** | Catch exception on copyBlob() | Skip file, log error | Log: "✗ Error: Corrupted attachment [file]" |
| **Filename with all invalid chars** | Result of sanitization is empty | Use fallback: "attachment_YYYY-MM-DD.ext" | Log: "⚠ Renamed: [original] → attachment_[date].ext" |
| **Label path > 255 chars** | Check path length | Truncate and add hash: "...Projects/[hash]/file" | Log: "⚠ Truncated long path: [label]" |
| **Email with no labels** | thread.getLabels().length == 0 | Save to "Inbox" folder | Log: "Folder: Inbox (unlabeled)" |
| **Duplicate content** | Compare file size + name + date | Skip download if identical | Log: "Skipped duplicate: [file]" |
| **No emails match filters** | Search returns 0 threads | Show info dialog | "No emails found matching patterns: [patterns]" |
| **State corruption** | Catch JSON parse error on state load | Clear state, start fresh | "Previous state corrupted, starting new extraction." |
| **Concurrent execution** | Check isProcessing flag | Prevent second run | "Extraction already in progress. Please wait." |

### 9.2 Error Message Standards

#### Success Messages
```
✓ Extraction Complete!
  123 attachments saved
  2 duplicates renamed
  0 errors
```

#### Warning Messages
```
⚠ Batch Incomplete
  Processed 50 of 123 attachments
  1 file skipped (network error)
  Click "Extract" again to continue
```

#### Error Messages
```
✗ Extraction Failed
  Reason: Drive storage full
  Processed: 23 of 123
  Action: Free up space, then resume

✗ Configuration Error
  Invalid Drive Folder ID
  Action: Check Configuration tab
```

### 9.3 Logging Standards

#### Log Entry Format
```javascript
{
  timestamp: "2024-03-15 14:32:15",
  status: "✓ Success" | "⚠ Warning" | "✗ Error",
  folderPath: "Projects/COVID/2023",
  filename: "report_2024-03-15.pdf",
  message: "Saved successfully",
  emailSubject: "Q1 COVID Report",
  emailDate: "2024-03-15",
  fileSize: "2.3 MB",           // Optional
  errorDetails: "Stack trace..."  // Only for errors
}
```

#### Log Colors (Sheet Formatting)
- ✓ Success → Green background
- ⚠ Warning → Yellow background
- ✗ Error → Red background

---

## 10. Success Metrics & Acceptance Criteria

### 10.1 Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Setup Time** | < 5 minutes | Time from opening Sheet to first extraction |
| **Success Rate** | > 95% | Attachments successfully extracted / total |
| **Error Recovery** | 100% | All failures logged with actionable error messages |
| **Resume Success** | 100% | Extraction resumes without data loss after interruption |
| **Duplicate Handling** | 100% | No file overwrites, all duplicates renamed |
| **Performance** | 20 emails/min | Processing speed (network-dependent) |

### 10.2 Acceptance Criteria (Definition of Done)

#### Must Have (MVP)
- [ ] User can configure extraction via Google Sheet
- [ ] Script auto-creates Drive folder on first run
- [ ] Wildcard patterns work: `*`, `?`, `/` (hierarchy)
- [ ] Full Gmail label path replicated in Drive
- [ ] Filename format: `name_YYYY-MM-DD.ext` with sent date
- [ ] Duplicate handling: append `-2`, `-3`, etc. (per-folder)
- [ ] Invalid filename chars replaced with `-`
- [ ] Unlabeled emails saved to `Inbox/` folder
- [ ] Multi-label emails saved to all matching folders
- [ ] Auto-resume after 6-minute timeout
- [ ] All extractions logged in Sheet with status
- [ ] Confirmation dialog before extraction
- [ ] Warning dialog if no patterns specified
- [ ] Completion summary with statistics
- [ ] No data loss on any error scenario
- [ ] Clear error messages for all failure cases

#### Should Have (Post-MVP)
- [ ] Progress bar/toast during extraction
- [ ] Estimated time calculation
- [ ] Filter by date range
- [ ] Filter by file type
- [ ] Email summary on completion
- [ ] "Open Drive Folder" button in completion dialog
- [ ] Undo last extraction feature

#### Could Have (Future)
- [ ] Scheduled extraction (daily/weekly)
- [ ] Slack/email notifications
- [ ] Advanced deduplication (content hash)
- [ ] Batch size auto-tuning
- [ ] Multi-user support (shared mailbox)

---

## 11. Future Enhancements (Python Version)

### 11.1 Motivation for Python Migration
While the Apps Script version serves MVP needs, a Python-based solution enables:
- **Local filesystem support:** Direct save to user's machine
- **ZIP file creation:** Single-file archive for easy sharing
- **No execution time limits:** Process thousands of emails
- **Advanced filtering:** Date ranges, file types, size limits
- **Resume capability:** Robust state management with SQLite
- **GUI application:** Electron or PyQt interface
- **Integration with Outlook:** Unified email extraction tool

### 11.2 Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Python Application (CLI/GUI)                 │
├─────────────────────────────────────────────────────────────┤
│  Core Modules:                                               │
│  ├─ gmail_client.py      (Gmail API wrapper)                │
│  ├─ drive_client.py      (Drive API wrapper)                │
│  ├─ filesystem_writer.py (Local save + ZIP creation)        │
│  ├─ state_manager.py     (SQLite-based resume)              │
│  ├─ config_manager.py    (YAML/JSON config)                 │
│  └─ filter_engine.py     (Advanced search filters)          │
├─────────────────────────────────────────────────────────────┤
│  Output Modes:                                               │
│  ├─ LOCAL_FILES:  Save to G:/Email-Attachments/             │
│  ├─ ZIP_FILE:     Create attachments.zip                    │
│  └─ GOOGLE_DRIVE: Mirror to Drive (like Apps Script)        │
├─────────────────────────────────────────────────────────────┤
│  Advanced Features:                                          │
│  ├─ IMAP fallback (for large mailboxes)                     │
│  ├─ Content-based deduplication (SHA-256 hash)              │
│  ├─ Progress tracking with resumable downloads              │
│  ├─ Parallel processing (threading for speed)               │
│  └─ Integration with Outlook Extraction Tool                │
└─────────────────────────────────────────────────────────────┘
```

### 11.3 Configuration File (config.yaml)
```yaml
output:
  mode: LOCAL_FILES          # or ZIP_FILE, GOOGLE_DRIVE
  base_path: G:/Email-Attachments/
  create_zip: false
  zip_name: gmail_attachments_{date}.zip

gmail:
  folder_patterns:
    - "*covid*"
    - "Projects/*"
    - "Work/Invoices"
  search_trash_only: false
  date_range:
    start: "2023-01-01"
    end: "2024-12-31"

filters:
  file_types: [pdf, docx, xlsx, png, jpg]  # Empty = all
  max_size_mb: 50                           # 0 = no limit
  skip_duplicates: true                     # Content hash check

processing:
  batch_size: 100
  parallel_downloads: 5
  resume_on_error: true
  state_file: .extraction_state.db

naming:
  format: "{filename}_{date}.{ext}"        # Variables: {filename}, {date}, {sender}
  date_format: "yyyy-MM-dd"
  sanitize_chars: true
  duplicate_suffix: "_{n}"                  # {n} = counter

logging:
  level: INFO                               # DEBUG, INFO, WARNING, ERROR
  file: extraction.log
  console: true
```

### 11.4 CLI Interface
```bash
# Basic usage
python extract_gmail_attachments.py --config config.yaml

# Quick mode with inline config
python extract_gmail_attachments.py \
  --folders "*covid*,Projects/*" \
  --output local \
  --path G:/Attachments

# Dry-run mode (preview only)
python extract_gmail_attachments.py --dry-run

# Resume interrupted extraction
python extract_gmail_attachments.py --resume

# Generate config template
python extract_gmail_attachments.py --init-config
```

### 11.5 Integration with Outlook Extraction Tool

Since you have an existing Outlook extraction tool, the Python version should share:

#### Shared Components
```
/core
  /extractors
    - gmail_extractor.py       (New)
    - outlook_extractor.py     (Existing)
    - base_extractor.py        (Abstract base class)
  /output_writers
    - filesystem_writer.py
    - zip_writer.py
    - drive_writer.py
  /filters
    - date_filter.py
    - label_filter.py
    - attachment_filter.py

/gui
  /tabs
    - gmail_extraction_tab.py  (New)
    - outlook_extraction_tab.py (Existing)
```

#### Unified Configuration
```python
# config/extraction_config.ini
[General]
output_mode = LOCAL_FILES
base_path = G:/Email-Attachments/

[Gmail]
enabled = true
folder_patterns = *covid*, Projects/*

[Outlook]
enabled = true
folder_paths = Inbox/Projects, Archive/COVID

[Filters]
date_range_start = 2023-01-01
file_types = pdf, docx, xlsx
```

### 11.6 Migration Path

#### Phase 1: MVP (Apps Script - Current)
- Google Sheet control panel
- Drive-only output
- Basic wildcard filtering
- Manual resume

#### Phase 2: Python CLI
- Local filesystem output
- ZIP file creation
- Advanced filtering
- Automatic resume
- IMAP fallback option

#### Phase 3: GUI Integration
- Add Gmail tab to Outlook Extraction Tool
- Unified configuration
- Combined extraction (Gmail + Outlook in one run)
- Scheduled extraction

#### Phase 4: Enterprise Features
- Multi-account support
- Incremental sync
- Cloud storage integrations (Dropbox, OneDrive, S3)
- Audit logging and compliance reports

---

## 12. Testing Strategy

### 12.1 Unit Tests (Manual - Apps Script Limitations)

| Test Case | Expected Behavior | Pass Criteria |
|-----------|------------------|---------------|
| **wildcardToRegExp()** | Converts `*covid*` to regex | Matches "covid", "COVID-19", "precovid" |
| **sanitizeFilename()** | Replaces invalid chars | `report:v2.pdf` → `report-v2.pdf` |
| **generateUniqueFilename()** | Handles duplicates | `file.pdf` → `file_2024-03-15.pdf`, then `file_2024-03-15-2.pdf` |
| **getOrCreateDriveFolderPath()** | Creates nested folders | "A/B/C" creates 3 folders |

### 12.2 Integration Tests

| Test Scenario | Setup | Expected Outcome |
|---------------|-------|------------------|
| **End-to-end extraction** | Mailbox with 10 emails, 20 attachments | All 20 files in correct Drive folders |
| **Wildcard matching** | Pattern `*test*`, labels: "test", "testing", "latest" | Extracts from all 3 labels |
| **Duplicate handling** | 3 emails with "invoice.pdf" on same date | Creates 3 files: invoice_..., invoice_...-2, invoice_...-3 |
| **No labels** | Email with no labels | Saves to `attachments/Inbox/` |
| **Multi-label** | Email with labels "Work" and "Archive" | File saved in both folders |
| **Resume after timeout** | Stop script at 50%, restart | Continues from 51%, no re-downloads |

### 12.3 User Acceptance Testing (UAT)

#### Test Scenario 1: First-Time User
**Persona:** Sarah (non-technical)
**Steps:**
1. Open shared Sheet
2. Approve permissions
3. Verify Drive folder auto-created
4. Enter patterns: `*covid*`
5. Run extraction
6. Verify files in Drive
7. Check log tab

**Success Criteria:** Completes without help in <10 minutes

#### Test Scenario 2: Large Mailbox
**Persona:** Power user with 500 emails
**Steps:**
1. Configure patterns matching 200 emails
2. Start extraction
3. Allow script to timeout (6 min)
4. Verify state saved
5. Re-run to resume
6. Verify no duplicate downloads

**Success Criteria:** All files extracted, correct resume

#### Test Scenario 3: Error Recovery
**Persona:** User with storage almost full
**Steps:**
1. Start extraction
2. Fill Drive storage during extraction
3. Verify script stops gracefully
4. Verify error message is clear
5. Free up space
6. Resume extraction

**Success Criteria:** No data loss, clear error message, successful resume

---

## 13. Deployment & Setup Guide

### 13.1 Deliverables

#### For End User (Your Friend)
1. **Google Sheet:** "Gmail Attachment Extractor"
   - Pre-configured with tabs and named ranges
   - Instructions embedded
   - Script attached and ready to run

2. **Setup Instructions (PDF):** "Quick Start Guide"
   - Step-by-step with screenshots
   - Permission approval walkthrough
   - Common troubleshooting

3. **Support Contact:** Your email/Slack for questions

#### For You (Developer)
1. **Source Code:** `gmail-attachments-extractor.gs`
   - Fully commented
   - Modular functions
   - Easy to maintain

2. **Deployment Script:** Auto-creates Sheet with formatting

3. **Test Suite:** Manual test cases checklist

### 13.2 Installation Steps (For You)

#### Step 1: Create New Apps Script Project
```
1. Go to script.google.com
2. Click "New Project"
3. Name: "Gmail Attachments Extractor"
4. Paste code from gmail-attachments-extractor.gs
5. Save (Ctrl+S)
```

#### Step 2: Create Google Sheet Template
```
1. Create new Sheet: "Gmail Attachment Extractor - Template"
2. Create tabs:
   - "Configuration" (with table structure)
   - "Extraction Log" (with headers)
3. Tools → Script Editor → Link to Apps Script project
4. Add custom menu code to onOpen()
5. Reload sheet to verify menu appears
```

#### Step 3: Set Up Named Ranges
```
In Sheet, go to Data → Named Ranges:
- CONFIG_DRIVE_FOLDER_NAME → Configuration!B2
- CONFIG_DRIVE_FOLDER_ID → Configuration!B3
- CONFIG_FOLDER_PATTERNS → Configuration!B4
- CONFIG_SEARCH_TRASH → Configuration!B5
- CONFIG_BATCH_SIZE → Configuration!B6
```

#### Step 4: Test with Your Account
```
1. Enter test folder pattern (e.g., "*test*")
2. Run extraction
3. Verify Drive folder created
4. Verify attachments downloaded
5. Check log tab populated
6. Test resume by stopping mid-execution
```

#### Step 5: Deploy to Friend
```
1. Make copy of Sheet: "Gmail Attachment Extractor - [Friend Name]"
2. Share with friend (Editor access)
3. Send Quick Start Guide
4. Be available for first-run support
```

### 13.3 User Setup Instructions (Quick Start Guide)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Gmail Attachment Extractor - Quick Start Guide
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 What This Tool Does:
Automatically extracts email attachments from Gmail and
saves them to Google Drive while preserving your folder
structure.

⏱ Estimated Setup Time: 5 minutes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: Open the Sheet
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Click the shared link to open the Google Sheet
2. You should see two tabs:
   - "Configuration"
   - "Extraction Log"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: Grant Permissions (First Time Only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Click menu: "Attachment Tools" → "Extract Attachments"

2. A dialog will appear: "Authorization Required"
   → Click "Continue"

3. Select your Google account

4. You'll see: "This app isn't verified"
   → Click "Advanced"
   → Click "Go to Gmail Attachment Extractor (unsafe)"
   (Don't worry - this is safe, just not verified by Google)

5. Review permissions:
   ✓ "See, edit, create, and delete your Google Drive files"
   ✓ "Read, compose, and send emails from your Gmail account"
   → Click "Allow"

6. You'll see a message: "Setup Complete! Drive folder created."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  IMPORTANT: PRIVACY & SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 PROTECT YOUR DATA:

1. Keep this Sheet PRIVATE
   ❌ Do NOT share with "Anyone with the link"
   ✓ Only share with specific people if needed
   ✓ Use "Viewer" access for sharing, not "Editor"

2. Your Drive Folder Security
   - The "Gmail Attachments" folder inherits your Drive
     sharing settings
   - Check folder permissions: Right-click folder → Share
   - Keep it private to prevent exposing email attachments

3. What the Script Can Access
   ✓ Read your Gmail messages and attachments
   ✓ Create/edit files in your Google Drive
   ✓ This script does NOT send emails or share data externally

4. Privacy Check
   - The script will automatically warn you if your Sheet
     is accidentally set to public
   - If you see a warning, click "Share" button (top right)
     and change "Anyone with the link" to "Restricted"

🛡️  This is a personal script, not verified by Google.
    That's normal for custom tools. The "unsafe" warning
    appears because it hasn't gone through Google's
    verification process, but it's safe to use.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: Configure Folder Patterns
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to "Configuration" tab

2. In cell B4 (Folder Patterns), enter the Gmail folders
   you want to extract from:

   Examples:
   - *covid*           (any folder with "covid" in name)
   - Projects/*        (all folders under "Projects")
   - Work/Invoices     (exact match)
   - Multiple: *covid*, Projects/*, Work/Invoices

3. Leave other settings at defaults (unless you know what
   you're changing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: Run Extraction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Click menu: "Attachment Tools" → "Extract Attachments"

2. Confirmation dialog shows:
   "Found X emails with Y attachments"
   → Click "Continue"

3. Script will run for a few minutes
   - You'll see progress updates
   - Watch the "Extraction Log" tab populate

4. When complete, you'll see:
   "✓ Extraction Complete! Y attachments saved"
   → Click "OK"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5: View Your Files in Drive
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to Google Drive (drive.google.com)

2. Find folder: "Gmail Attachments"

3. Inside you'll see:
   attachments/
   └─ Projects/
      └─ COVID/
         └─ report_2024-03-15.pdf

4. Your Gmail folder structure is preserved!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ Troubleshooting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Problem: "Execution timeout" message
Solution: This is normal for large mailboxes. Just click
         "Extract Attachments" again - it will resume
         automatically.

Problem: "No emails found"
Solution: Check your folder patterns in Configuration tab.
         Make sure they match your Gmail labels exactly.

Problem: "Drive storage full"
Solution: Free up space in Google Drive, then run again.
         Your progress is saved.

Problem: Script runs but no files appear
Solution: Check the "Extraction Log" tab for error messages.
         Contact [YOUR NAME] for help.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Support
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions? Contact [YOUR NAME] at [YOUR EMAIL]

Enjoy your organized attachments! 🎉
```

---

## 14. Appendices

### Appendix A: Gmail Search Query Syntax
```
in:trash              → Only emails in trash
label:"Projects/COVID" → Specific label (exact match)
has:attachment        → Only emails with attachments
after:2023/01/01      → Date range filtering
before:2024/12/31
filename:pdf          → Attachment type filtering
larger:10M            → Size filtering
```

### Appendix B: Apps Script API References
- [GmailApp](https://developers.google.com/apps-script/reference/gmail/gmail-app)
- [DriveApp](https://developers.google.com/apps-script/reference/drive/drive-app)
- [PropertiesService](https://developers.google.com/apps-script/reference/properties)
- [SpreadsheetApp](https://developers.google.com/apps-script/reference/spreadsheet)

### Appendix C: Drive API Quotas
```
Free Account:
- 15 GB storage (shared with Gmail & Photos)
- 10,000 API requests per day
- 1,000 requests per 100 seconds per user

Apps Script Limits:
- 6 minute execution time per run
- 20 MB maximum attachment size per copyBlob()
- 50 MB daily bandwidth limit for UrlFetchApp
```

### Appendix D: Sample Folder Structures

#### Example 1: Simple Projects
```
Gmail Labels:
- Projects/COVID
- Projects/Cancer
- Projects/Flu

Drive Output:
attachments/
├─ Projects/
│  ├─ COVID/
│  │  ├─ report_2024-03-15.pdf
│  │  └─ data_2024-02-10.xlsx
│  ├─ Cancer/
│  └─ Flu/
```

#### Example 2: Complex Hierarchy
```
Gmail Labels:
- Work/Clients/Acme Corp/Invoices
- Work/Clients/Acme Corp/Contracts
- Work/Internal/HR
- Personal/Tax/2023
- Personal/Tax/2024

Drive Output:
attachments/
├─ Work/
│  ├─ Clients/
│  │  └─ Acme Corp/
│  │     ├─ Invoices/
│  │     │  ├─ invoice_2024-01-15.pdf
│  │     │  └─ invoice_2024-01-15-2.pdf
│  │     └─ Contracts/
│  └─ Internal/
│     └─ HR/
└─ Personal/
   └─ Tax/
      ├─ 2023/
      └─ 2024/
```

---

## 15. Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-03-15 | Product Team | Initial draft - comprehensive PDD |
| 1.1 | 2024-11-07 | Product Team | Added security & privacy enhancements: checkSheetPrivacy(), checkDriveFolderPrivacy(), acquireExecutionLock(), enhanced Quick Start Guide with privacy warnings, added FR6.7 & FR6.8 |

---

## 16. Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | [Your Name] | ____________ | ______ |
| Technical Lead | [Your Name] | ____________ | ______ |
| End User | [Friend Name] | ____________ | ______ |

---

**END OF DOCUMENT**

*This Product Design Document serves as the single source of truth for the Gmail Apps Script Attachments Extractor project. All implementation should reference this document. Any deviations from this spec require Product Owner approval and documentation update.*

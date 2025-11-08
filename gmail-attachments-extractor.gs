/**
 * ============================================================================
 * Gmail Attachments Extractor for Google Drive
 * ============================================================================
 *
 * Extracts email attachments from Gmail and saves them to Google Drive while
 * preserving the Gmail label structure as folder hierarchy.
 *
 * @version 1.3.0
 * @date 2025-11-07
 * @author Ben @ delusionalsecurity.review
 * @license MIT
 * @repository https://github.com/bbleak-repo/gmail-attachment-extractor
 *
 * Features:
 * - Wildcard folder pattern matching (*covid*, Projects/*, etc.)
 * - Preserves Gmail label hierarchy in Drive folders
 * - System label support (INBOX, SENT, STARRED, etc.)
 * - Intelligent duplicate handling with auto-renaming
 * - Auto-resume capability for large mailboxes
 * - Privacy and security checks
 * - Comprehensive logging
 *
 * Setup:
 * 1. Attach this script to a Google Sheet
 * 2. Sheet must have tabs: "Configuration" and "Extraction Log"
 * 3. Configure named ranges (see setupSheet function)
 * 4. Run from menu: "Attachment Tools" → "Extract Attachments"
 *
 * ============================================================================
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

/**
 * Named ranges in the Configuration sheet
 * These must match the named ranges created in your Google Sheet
 */
const CONFIG = {
  DRIVE_FOLDER_NAME: 'CONFIG_DRIVE_FOLDER_NAME',    // Cell B2
  DRIVE_FOLDER_ID: 'CONFIG_DRIVE_FOLDER_ID',        // Cell B3
  FOLDER_PATTERNS: 'CONFIG_FOLDER_PATTERNS',        // Cell B4
  SEARCH_TRASH: 'CONFIG_SEARCH_TRASH',              // Cell B5
  BATCH_SIZE: 'CONFIG_BATCH_SIZE'                   // Cell B6
};

/**
 * Script property keys for state management
 */
const STATE_KEYS = {
  LAST_PROCESSED_INDEX: 'lastProcessedThreadIndex',
  TOTAL_THREADS: 'totalThreadsFound',
  ALL_THREAD_IDS: 'allThreadIds',
  IS_PROCESSING: 'isProcessing'
};

/**
 * Sheet names
 */
const SHEETS = {
  CONFIG: 'Configuration',
  LOG: 'Extraction Log'
};

/**
 * Log status indicators
 */
const STATUS = {
  SUCCESS: '✓',
  WARNING: '⚠',
  ERROR: '✗'
};

// ============================================================================
// MENU & INITIALIZATION
// ============================================================================

/**
 * Creates custom menu when spreadsheet opens
 * Called automatically by Google Apps Script
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Attachment Tools')
    .addItem('Extract Attachments', 'extractAttachmentsBatch')
    .addItem('Reset Extraction State', 'resetExtractionState')
    .addSeparator()
    .addItem('Setup Sheet', 'setupSheet')
    .addSeparator()
    .addItem('🔧 Check Execution Status', 'showExecutionStatus')
    .addItem('🔧 Force Release Lock', 'forceReleaseLock')
    .addItem('🔧 Test Lock Service', 'testLockService')
    .addItem('🔧 Test For Phantom Lock', 'testForPhantomLock')
    .addItem('🔧 Check Script Version', 'checkScriptVersion')
    .addToUi();
}

/**
 * Sets up the Google Sheet with required tabs and named ranges
 * Run this once when first setting up the tool
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  Logger.log('=== setupSheet STARTED ===');
  Logger.log(`Spreadsheet: ${ss.getName()} (ID: ${ss.getId()})`);
  Logger.log(`Current sheets: ${ss.getSheets().map(s => s.getName()).join(', ')}`);

  try {
    let configCreated = false;
    let logCreated = false;

    // Create Configuration tab if needed
    Logger.log('Step 1: Checking for Configuration sheet...');
    let configSheet = ss.getSheetByName(SHEETS.CONFIG);

    if (!configSheet) {
      Logger.log('Configuration sheet NOT found - creating...');

      try {
        configSheet = ss.insertSheet(SHEETS.CONFIG);
        Logger.log(`✓ Configuration sheet created: ${configSheet.getName()}`);
        configCreated = true;

        // Set up configuration table
        Logger.log('Setting up configuration data...');
        const configData = [
          ['Setting', 'Value'],
          ['Drive Folder Name', 'Gmail Attachments'],
          ['Drive Folder ID', '[Auto-populated after creation]'],
          ['Folder Patterns', '*covid*, Projects/*'],
          ['Search Trash Only?', 'FALSE'],
          ['Batch Size', '20']
        ];

        configSheet.getRange(1, 1, configData.length, 2).setValues(configData);
        Logger.log('✓ Configuration data written');

        configSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
        configSheet.setColumnWidth(1, 200);
        configSheet.setColumnWidth(2, 400);
        Logger.log('✓ Configuration formatting applied');

        // Create named ranges
        Logger.log('Creating named ranges...');
        ss.setNamedRange(CONFIG.DRIVE_FOLDER_NAME, configSheet.getRange('B2'));
        ss.setNamedRange(CONFIG.DRIVE_FOLDER_ID, configSheet.getRange('B3'));
        ss.setNamedRange(CONFIG.FOLDER_PATTERNS, configSheet.getRange('B4'));
        ss.setNamedRange(CONFIG.SEARCH_TRASH, configSheet.getRange('B5'));
        ss.setNamedRange(CONFIG.BATCH_SIZE, configSheet.getRange('B6'));
        Logger.log('✓ Named ranges created');

      } catch (e) {
        Logger.log(`✗ ERROR creating Configuration sheet: ${e.message}`);
        throw new Error(`Failed to create Configuration sheet: ${e.message}`);
      }

    } else {
      Logger.log('✓ Configuration sheet already exists');
    }

    // Create Extraction Log tab if needed
    Logger.log('Step 2: Checking for Extraction Log sheet...');
    let logSheet = ss.getSheetByName(SHEETS.LOG);

    if (!logSheet) {
      Logger.log('Extraction Log sheet NOT found - creating...');

      try {
        logSheet = ss.insertSheet(SHEETS.LOG);
        Logger.log(`✓ Extraction Log sheet created: ${logSheet.getName()}`);
        logCreated = true;

        // Set up log headers
        Logger.log('Setting up log headers...');
        const headers = [['Timestamp', 'Status', 'Folder Path', 'Filename', 'Message', 'Email Subject']];
        logSheet.getRange(1, 1, 1, 6).setValues(headers);
        logSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
        logSheet.setFrozenRows(1);
        Logger.log('✓ Log headers written');

        // Set column widths
        logSheet.setColumnWidth(1, 150); // Timestamp
        logSheet.setColumnWidth(2, 60);  // Status
        logSheet.setColumnWidth(3, 250); // Folder Path
        logSheet.setColumnWidth(4, 300); // Filename
        logSheet.setColumnWidth(5, 250); // Message
        logSheet.setColumnWidth(6, 250); // Email Subject
        Logger.log('✓ Log formatting applied');

      } catch (e) {
        Logger.log(`✗ ERROR creating Extraction Log sheet: ${e.message}`);
        throw new Error(`Failed to create Extraction Log sheet: ${e.message}`);
      }

    } else {
      Logger.log('✓ Extraction Log sheet already exists');
    }

    // Final verification
    Logger.log('Step 3: Final verification...');
    const finalSheets = ss.getSheets().map(s => s.getName());
    Logger.log(`Final sheets in workbook: ${finalSheets.join(', ')}`);

    const hasConfig = finalSheets.includes(SHEETS.CONFIG);
    const hasLog = finalSheets.includes(SHEETS.LOG);

    Logger.log(`Configuration sheet present: ${hasConfig}`);
    Logger.log(`Extraction Log sheet present: ${hasLog}`);

    if (!hasConfig || !hasLog) {
      throw new Error('Sheet verification failed! Tabs were created but are not visible.');
    }

    Logger.log('=== setupSheet COMPLETED SUCCESSFULLY ===');

    // Show success message
    const message = configCreated || logCreated
      ? `Sheet has been configured successfully!\n\n` +
        `${configCreated ? '✓ Created Configuration tab\n' : ''}` +
        `${logCreated ? '✓ Created Extraction Log tab\n' : ''}` +
        `${!configCreated && !logCreated ? '✓ Tabs already exist\n' : ''}` +
        `\nSheets in workbook:\n${finalSheets.join('\n')}\n\n` +
        `Next steps:\n` +
        `1. Check the tabs at the bottom of this sheet\n` +
        `2. Update folder patterns in Configuration tab\n` +
        `3. Run "Attachment Tools → Extract Attachments"`
      : `Tabs already exist:\n\n` +
        `${finalSheets.join('\n')}\n\n` +
        `You're all set! Configure and run extraction.`;

    ui.alert('Setup Complete!', message, ui.ButtonSet.OK);

  } catch (e) {
    Logger.log(`=== setupSheet FAILED ===`);
    Logger.log(`Error: ${e.message}`);
    Logger.log(`Stack: ${e.stack}`);

    ui.alert(
      'Setup Error',
      `Failed to set up sheet:\n\n${e.message}\n\n` +
      `Check View → Logs for details.\n\n` +
      `Current sheets: ${ss.getSheets().map(s => s.getName()).join(', ')}`,
      ui.ButtonSet.OK
    );
  }
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Main function to extract attachments in batches
 * Handles the complete extraction workflow with state management
 */
function extractAttachmentsBatch() {
  // Generate unique execution ID to track this specific call
  const executionId = 'exec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log(`extractAttachmentsBatch CALLED - ID: ${executionId}`);
  Logger.log(`Timestamp: ${new Date().toISOString()}`);
  Logger.log('═══════════════════════════════════════════════════════');

  const ui = SpreadsheetApp.getUi();
  const startTime = Date.now();
  let lock = null;

  try {
    // Step 0: Auto-Setup Check (first-time user experience)
    Logger.log(`[${executionId}] Checking if setup is needed...`);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hasConfigTab = ss.getSheetByName(SHEETS.CONFIG) !== null;
    const hasLogTab = ss.getSheetByName(SHEETS.LOG) !== null;

    if (!hasConfigTab || !hasLogTab) {
      Logger.log('Setup required - tabs missing. Running setupSheet automatically...');

      const response = ui.alert(
        'First-Time Setup',
        'It looks like this is your first time running the extractor!\n\n' +
        'I need to create the Configuration and Extraction Log tabs.\n\n' +
        'This will only take a moment. Continue?',
        ui.ButtonSet.OK_CANCEL
      );

      if (response === ui.Button.CANCEL) {
        Logger.log('User cancelled first-time setup');
        return;
      }

      // Run setup automatically
      setupSheet();
      Logger.log('Auto-setup completed. Continuing with extraction...');

      // Give user a moment to review the new tabs
      ui.alert(
        'Setup Complete!',
        'Configuration and Extraction Log tabs have been created.\n\n' +
        'Please update the folder patterns in the Configuration tab,\n' +
        'then run "Extract Attachments" again.',
        ui.ButtonSet.OK
      );

      return; // Stop here so they can configure
    }

    Logger.log(`[${executionId}] ✓ Setup already complete - proceeding with extraction`);

    // Step 1: Security & Lock Check
    Logger.log(`[${executionId}] About to acquire execution lock...`);
    lock = acquireExecutionLock();
    Logger.log(`[${executionId}] ✓ Lock acquired successfully`);
    checkSheetPrivacy();

    // Step 2: Read Configuration
    const config = readConfiguration();

    // Step 3: Validate & Setup
    const driveFolderId = validateAndSetupDrive(config);
    checkDriveFolderPrivacy(driveFolderId);

    // Step 4: Check for existing state
    const scriptProps = PropertiesService.getScriptProperties();
    const existingState = scriptProps.getProperty(STATE_KEYS.LAST_PROCESSED_INDEX);

    if (existingState !== null) {
      const resume = ui.alert(
        'Resume Extraction?',
        `Previous extraction in progress:\n\n` +
        `Processed: ${existingState} threads\n\n` +
        `Do you want to resume?`,
        ui.ButtonSet.YES_NO
      );

      if (resume === ui.Button.NO) {
        resetExtractionState();
      }
    }

    // Step 5: Search Gmail
    const threads = getMatchingThreads(config);

    if (threads.length === 0) {
      ui.alert(
        'No Emails Found',
        `No emails found matching your folder patterns:\n${config.folderPatterns.join(', ')}\n\n` +
        `Tips:\n` +
        `- Check that patterns match your Gmail labels\n` +
        `- Try wildcards like *project* or Work/*`,
        ui.ButtonSet.OK
      );
      return;
    }

    // Step 6: Get starting position
    let lastIndex = parseInt(scriptProps.getProperty(STATE_KEYS.LAST_PROCESSED_INDEX) || '0', 10);
    const endIndex = Math.min(threads.length, lastIndex + config.batchSize);

    // Step 7: Confirmation
    if (lastIndex === 0) {
      const attachmentCount = countAttachments(threads);
      const confirm = ui.alert(
        'Ready to Extract',
        `Found:\n` +
        `• ${threads.length} email threads\n` +
        `• ~${attachmentCount} attachments\n\n` +
        `This will process ${Math.min(config.batchSize, threads.length)} threads.\n\n` +
        `Continue?`,
        ui.ButtonSet.YES_NO
      );

      if (confirm === ui.Button.NO) {
        return;
      }
    }

    // Step 8: Process batch
    const driveFolder = DriveApp.getFolderById(driveFolderId);
    const stats = processBatch(threads, lastIndex, endIndex, driveFolder, config);

    // Step 9: Save state
    scriptProps.setProperty(STATE_KEYS.LAST_PROCESSED_INDEX, endIndex.toString());

    // Step 10: Check completion
    const remaining = threads.length - endIndex;

    if (remaining > 0) {
      ui.alert(
        'Batch Complete',
        `Processed ${endIndex} of ${threads.length} threads.\n\n` +
        `Stats:\n` +
        `✓ Saved: ${stats.success}\n` +
        `⚠ Warnings: ${stats.warnings}\n` +
        `✗ Errors: ${stats.errors}\n\n` +
        `${remaining} threads remaining.\n` +
        `Run "Extract Attachments" again to continue.`,
        ui.ButtonSet.OK
      );
    } else {
      resetExtractionState();

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      ui.alert(
        '✓ Extraction Complete!',
        `All ${threads.length} threads processed.\n\n` +
        `Stats:\n` +
        `✓ Saved: ${stats.success} attachments\n` +
        `⚠ Warnings: ${stats.warnings}\n` +
        `✗ Errors: ${stats.errors}\n\n` +
        `Time: ${elapsed} seconds`,
        ui.ButtonSet.OK
      );
    }

  } catch (e) {
    Logger.log(`[${executionId}] ERROR in extractAttachmentsBatch: ${e.message}`);
    Logger.log(`[${executionId}] Stack trace: ${e.stack}`);
    ui.alert(
      'Extraction Error',
      `An error occurred:\n\n${e.message}\n\n` +
      `Your progress has been saved. Try running again.`,
      ui.ButtonSet.OK
    );
  } finally {
    // Always release lock
    if (lock) {
      lock.releaseLock();
      Logger.log(`[${executionId}] ✓ Execution lock released`);
    }
    Logger.log(`[${executionId}] extractAttachmentsBatch COMPLETED`);
    Logger.log('═══════════════════════════════════════════════════════');
  }
}

// ============================================================================
// SECURITY & PRIVACY FUNCTIONS
// ============================================================================

/**
 * Checks if the Google Sheet is publicly accessible and warns user
 * Called before extraction to prevent accidental data exposure
 */
function checkSheetPrivacy() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const file = DriveApp.getFileById(ss.getId());
    const access = file.getSharingAccess();

    if (access === DriveApp.Access.ANYONE || access === DriveApp.Access.ANYONE_WITH_LINK) {
      const ui = SpreadsheetApp.getUi();
      const response = ui.alert(
        '⚠️ Privacy Warning',
        'Your Google Sheet is publicly accessible!\n\n' +
        'This means anyone with the link can view your:\n' +
        '• Configuration settings\n' +
        '• Extraction logs (including email subjects)\n\n' +
        'Recommendation: Click "Share" button (top right) and change\n' +
        '"Anyone with the link" to "Restricted".\n\n' +
        'Continue extraction anyway?',
        ui.ButtonSet.YES_NO
      );

      if (response === ui.Button.NO) {
        throw new Error('Extraction cancelled by user due to privacy concerns.');
      }

      Logger.log('WARNING: Sheet is publicly accessible but user chose to continue.');
    }
  } catch (e) {
    if (e.message.includes('cancelled by user')) {
      throw e;
    }
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

    if (access === DriveApp.Access.ANYONE || access === DriveApp.Access.ANYONE_WITH_LINK) {
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
    Logger.log(`Unable to check Drive folder privacy: ${e.message}`);
  }
}

/**
 * Acquires execution lock to prevent concurrent runs
 * Returns lock object or throws error if already locked
 */
function acquireExecutionLock() {
  const lockService = LockService.getScriptLock();

  try {
    const startTime = Date.now();
    Logger.log('Attempting to acquire lock at: ' + new Date().toISOString());

    // WORKAROUND: waitLock() is broken in Google Apps Script
    // It returns false after ~100-200ms instead of waiting the full timeout
    // Using tryLock() with manual retry loop instead

    let hasLock = false;
    const maxAttempts = 100;  // 100 attempts
    const delayMs = 100;      // 100ms between attempts = 10 seconds total
    let attempts = 0;

    Logger.log('Using tryLock() workaround due to waitLock() bug...');

    while (attempts < maxAttempts && !hasLock) {
      attempts++;

      // Try to acquire lock (tryLock waits for delayMs then tries once)
      hasLock = lockService.tryLock(delayMs);

      if (hasLock) {
        const elapsed = Date.now() - startTime;
        Logger.log(`✓ Lock acquired after ${attempts} attempts (${elapsed}ms)`);
        break;
      }

      // Log progress every 10 attempts (every second)
      if (attempts % 10 === 0) {
        Logger.log(`Still waiting for lock... attempt ${attempts}/${maxAttempts}`);
      }
    }

    const endTime = Date.now();
    const elapsed = endTime - startTime;

    if (!hasLock) {
      Logger.log(`✗ Could not acquire lock after ${attempts} attempts (${elapsed}ms)`);
      throw new Error(`Unable to acquire lock after ${elapsed}ms (${attempts} attempts)`);
    }

    Logger.log('✓ Execution lock acquired successfully');
    return lockService;

  } catch (e) {
    Logger.log('✗ Failed to acquire lock: ' + e.message);
    Logger.log('✗ Full error: ' + e.toString());
    Logger.log('✗ Stack trace: ' + e.stack);

    // Show the ACTUAL error message to help diagnose
    SpreadsheetApp.getUi().alert(
      'Lock Acquisition Failed',
      'Unable to acquire execution lock.\n\n' +
      'Error: ' + e.message + '\n\n' +
      'This could mean:\n' +
      '• Another extraction is actually running (waited full timeout)\n' +
      '• Lock service is temporarily unavailable\n' +
      '• Permission/API issue\n\n' +
      'Check the execution log to see how long it waited.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    throw e; // Throw original error, not generic message
  }
}

// ============================================================================
// CONFIGURATION & VALIDATION
// ============================================================================

/**
 * Reads configuration from the Google Sheet
 * Returns configuration object with validated values
 */
function readConfiguration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('=== readConfiguration STARTED ===');

  try {
    Logger.log('Reading configuration values from named ranges...');

    const folderName = ss.getRangeByName(CONFIG.DRIVE_FOLDER_NAME).getValue() || 'Gmail Attachments';
    Logger.log(`Drive Folder Name: "${folderName}"`);

    const folderId = ss.getRangeByName(CONFIG.DRIVE_FOLDER_ID).getValue() || '';
    Logger.log(`Drive Folder ID: "${folderId}"`);

    const patternsStr = ss.getRangeByName(CONFIG.FOLDER_PATTERNS).getValue() || '';
    Logger.log(`Folder Patterns (raw): "${patternsStr}"`);

    const searchTrash = ss.getRangeByName(CONFIG.SEARCH_TRASH).getValue() === true ||
                        ss.getRangeByName(CONFIG.SEARCH_TRASH).getValue() === 'TRUE';
    Logger.log(`Search Trash Only: ${searchTrash}`);

    const batchSize = parseInt(ss.getRangeByName(CONFIG.BATCH_SIZE).getValue(), 10) || 20;
    Logger.log(`Batch Size (raw): ${batchSize}`);

    // Parse folder patterns
    const folderPatterns = patternsStr
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    Logger.log(`Folder Patterns (parsed): [${folderPatterns.join(', ')}] (count: ${folderPatterns.length})`);

    // Warn if no patterns
    if (folderPatterns.length === 0) {
      Logger.log('WARNING: No folder patterns specified - prompting user...');

      const ui = SpreadsheetApp.getUi();
      const response = ui.alert(
        '⚠️ No Folder Patterns',
        'No folder patterns specified!\n\n' +
        'This will extract ALL attachments from your entire mailbox.\n' +
        'This could take a very long time and may hit Gmail API limits.\n\n' +
        'Options:\n' +
        '• Click NO to specify folder patterns first\n' +
        '• Click YES to continue with ALL attachments',
        ui.ButtonSet.YES_NO
      );

      if (response === ui.Button.NO) {
        Logger.log('User declined to continue without patterns');
        throw new Error('Please specify folder patterns in Configuration tab.');
      }

      Logger.log('User accepted to continue without patterns (extract all)');
    }

    const clampedBatchSize = Math.max(1, Math.min(batchSize, 50)); // Clamp 1-50
    Logger.log(`Batch Size (clamped): ${clampedBatchSize}`);

    const config = {
      folderName,
      folderId,
      folderPatterns,
      searchTrash,
      batchSize: clampedBatchSize
    };

    Logger.log('=== readConfiguration COMPLETED ===');
    Logger.log(`Final config: ${JSON.stringify(config, null, 2)}`);

    return config;

  } catch (e) {
    Logger.log(`=== readConfiguration FAILED ===`);
    Logger.log(`Error: ${e.message}`);

    if (e.message.includes('Please specify')) {
      throw e;
    }
    throw new Error(`Failed to read configuration: ${e.message}`);
  }
}

/**
 * Validates Drive folder and creates if needed
 * Returns Drive folder ID
 */
function validateAndSetupDrive(config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    // Try to use existing folder ID
    if (config.folderId && config.folderId !== '[Auto-populated after creation]') {
      try {
        const folder = DriveApp.getFolderById(config.folderId);
        Logger.log(`Using existing Drive folder: ${folder.getName()} (${config.folderId})`);
        return config.folderId;
      } catch (e) {
        Logger.log(`Existing folder ID invalid: ${e.message}`);
      }
    }

    // Create new folder in root
    const folder = DriveApp.createFolder(config.folderName);
    const folderId = folder.getId();

    // Save folder ID back to sheet
    ss.getRangeByName(CONFIG.DRIVE_FOLDER_ID).setValue(folderId);

    Logger.log(`Created Drive folder: ${config.folderName} (${folderId})`);
    return folderId;

  } catch (e) {
    throw new Error(`Failed to setup Drive folder: ${e.message}`);
  }
}

// ============================================================================
// GMAIL SEARCH & FILTERING
// ============================================================================

/**
 * Gets all Gmail threads matching the configured patterns
 * Returns array of GmailThread objects
 */
function getMatchingThreads(config) {
  const threadsById = new Map();

  try {
    // If no patterns, search all mail with attachments
    if (config.folderPatterns.length === 0) {
      const query = buildBaseQuery(config.searchTrash);
      Logger.log(`Searching with query: ${query}`);

      const threads = GmailApp.search(query);
      for (const thread of threads) {
        if (!config.searchTrash || thread.isInTrash()) {
          threadsById.set(thread.getId(), thread);
        }
      }

      return Array.from(threadsById.values());
    }

    // Get labels matching patterns (both user and system labels)
    const matchingLabels = getLabelsMatchingPatterns(config.folderPatterns);
    Logger.log(`Found ${matchingLabels.userLabels.length} user labels and ${matchingLabels.systemLabels.length} system labels`);

    if (matchingLabels.userLabels.length === 0 && matchingLabels.systemLabels.length === 0) {
      return [];
    }

    // Search for threads in user labels
    for (const label of matchingLabels.userLabels) {
      const labelQuery = `label:${quoteForQuery(label.getName())}`;
      const query = buildBaseQuery(config.searchTrash, labelQuery);

      Logger.log(`Searching user label: ${query}`);
      const threads = GmailApp.search(query);

      for (const thread of threads) {
        if (!config.searchTrash || thread.isInTrash()) {
          threadsById.set(thread.getId(), thread);
        }
      }
    }

    // Search for threads in system labels
    for (const systemLabel of matchingLabels.systemLabels) {
      // System labels use special search operators
      let systemQuery = '';

      // Map system label names to Gmail search operators
      if (systemLabel === 'INBOX') {
        systemQuery = 'in:inbox';
      } else if (systemLabel === 'SENT') {
        systemQuery = 'in:sent';
      } else if (systemLabel === 'DRAFT') {
        systemQuery = 'in:drafts';
      } else if (systemLabel === 'SPAM') {
        systemQuery = 'in:spam';
      } else if (systemLabel === 'TRASH') {
        systemQuery = 'in:trash';
      } else if (systemLabel === 'STARRED') {
        systemQuery = 'is:starred';
      } else if (systemLabel === 'IMPORTANT') {
        systemQuery = 'is:important';
      } else if (systemLabel === 'UNREAD') {
        systemQuery = 'is:unread';
      }

      if (systemQuery) {
        const query = buildBaseQuery(config.searchTrash, systemQuery);
        Logger.log(`Searching system label: ${query}`);
        const threads = GmailApp.search(query);

        for (const thread of threads) {
          if (!config.searchTrash || thread.isInTrash()) {
            threadsById.set(thread.getId(), thread);
          }
        }
      }
    }

    // Sort by date (newest first)
    const result = Array.from(threadsById.values());
    result.sort((a, b) => b.getLastMessageDate() - a.getLastMessageDate());

    return result;

  } catch (e) {
    throw new Error(`Failed to search Gmail: ${e.message}`);
  }
}

/**
 * Gets all Gmail labels matching the wildcard patterns
 * Includes support for system labels (Inbox, Sent, Drafts, etc.)
 */
function getLabelsMatchingPatterns(patterns) {
  const userLabels = GmailApp.getUserLabels();
  const matchingLabels = [];
  const matchingSystemLabels = [];

  // Define system labels (these don't appear in getUserLabels())
  const systemLabels = [
    'INBOX',
    'SENT',
    'DRAFT',
    'SPAM',
    'TRASH',
    'STARRED',
    'IMPORTANT',
    'UNREAD'
  ];

  for (const pattern of patterns) {
    const regex = wildcardToRegExp(pattern);

    // Check user labels
    for (const label of userLabels) {
      if (regex.test(label.getName()) && !matchingLabels.includes(label)) {
        matchingLabels.push(label);
      }
    }

    // Check system labels
    for (const systemLabel of systemLabels) {
      if (regex.test(systemLabel)) {
        Logger.log(`Pattern "${pattern}" matches system label: ${systemLabel}`);
        matchingSystemLabels.push(systemLabel);
      }
    }
  }

  Logger.log(`Found ${matchingLabels.length} user labels and ${matchingSystemLabels.length} system labels`);

  // Return both user labels and system label names
  return {
    userLabels: matchingLabels,
    systemLabels: matchingSystemLabels
  };
}

/**
 * Builds base Gmail search query
 */
function buildBaseQuery(searchTrash, additionalQuery = '') {
  const parts = [];

  if (searchTrash) {
    parts.push('in:trash');
  }

  parts.push('has:attachment');

  if (additionalQuery) {
    parts.push(additionalQuery);
  }

  return parts.join(' ');
}

/**
 * Counts total attachments in threads (estimate for confirmation dialog)
 */
function countAttachments(threads) {
  let count = 0;
  const sampleSize = Math.min(threads.length, 10);

  for (let i = 0; i < sampleSize; i++) {
    const messages = threads[i].getMessages();
    for (const message of messages) {
      count += message.getAttachments().length;
    }
  }

  // Extrapolate if we sampled
  return sampleSize < threads.length
    ? Math.round(count * threads.length / sampleSize)
    : count;
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Processes a batch of threads and extracts attachments
 * Returns statistics object
 */
function processBatch(threads, startIndex, endIndex, rootFolder, config) {
  const stats = { success: 0, warnings: 0, errors: 0 };

  for (let i = startIndex; i < endIndex; i++) {
    const thread = threads[i];

    try {
      const messages = thread.getMessages();
      const threadLabels = thread.getLabels();

      // Skip threads with no labels if patterns specified
      if (config.folderPatterns.length > 0 && threadLabels.length === 0) {
        threadLabels.push({ getName: () => 'Inbox' });
      }

      for (const message of messages) {
        const attachments = message.getAttachments();

        if (attachments.length === 0) {
          continue; // Skip messages without attachments
        }

        const messageStats = processMessageAttachments(
          message,
          attachments,
          threadLabels,
          rootFolder
        );

        stats.success += messageStats.success;
        stats.warnings += messageStats.warnings;
        stats.errors += messageStats.errors;
      }

    } catch (e) {
      Logger.log(`Error processing thread ${i}: ${e.message}`);
      logExtraction(STATUS.ERROR, '', '', `Thread error: ${e.message}`, '');
      stats.errors++;
    }
  }

  return stats;
}

/**
 * Processes all attachments in a message
 * Returns statistics object
 */
function processMessageAttachments(message, attachments, threadLabels, rootFolder) {
  const stats = { success: 0, warnings: 0, errors: 0 };
  const emailDate = message.getDate();
  const emailSubject = message.getSubject() || '(No Subject)';

  for (const attachment of attachments) {
    try {
      const originalName = attachment.getName();
      const baseFilename = sanitizeFilename(stripExtension(originalName));
      const extension = getExtension(originalName);

      // Handle empty filename after sanitization
      if (!baseFilename || baseFilename.length === 0) {
        const fallbackName = `attachment_${Utilities.formatDate(emailDate, Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss')}`;
        Logger.log(`Empty filename after sanitization: ${originalName}, using: ${fallbackName}`);
        baseFilename = fallbackName;
      }

      // Process for each label
      for (const label of threadLabels) {
        const labelPath = typeof label.getName === 'function' ? label.getName() : 'Inbox';

        try {
          const driveFolder = getOrCreateDriveFolderPath(labelPath, rootFolder);
          const finalFilename = generateUniqueFilename(baseFilename, emailDate, extension, driveFolder);

          // Upload attachment
          const blob = attachment.copyBlob();
          blob.setName(finalFilename);
          driveFolder.createFile(blob);

          const message = finalFilename !== `${baseFilename}_${Utilities.formatDate(emailDate, Session.getScriptTimeZone(), 'yyyy-MM-dd')}.${extension}`
            ? 'Renamed duplicate'
            : 'Saved successfully';

          logExtraction(STATUS.SUCCESS, labelPath, finalFilename, message, emailSubject);
          stats.success++;

        } catch (e) {
          Logger.log(`Error saving to ${labelPath}: ${e.message}`);
          logExtraction(STATUS.ERROR, labelPath, originalName, `Save failed: ${e.message}`, emailSubject);
          stats.errors++;
        }
      }

    } catch (e) {
      Logger.log(`Error processing attachment: ${e.message}`);
      logExtraction(STATUS.ERROR, '', attachment.getName(), `Process failed: ${e.message}`, emailSubject);
      stats.errors++;
    }
  }

  return stats;
}

// ============================================================================
// DRIVE OPERATIONS
// ============================================================================

/**
 * Creates nested Drive folder structure from Gmail label path
 * Example: "Projects/COVID/2023" → attachments/Projects/COVID/2023
 */
function getOrCreateDriveFolderPath(labelPath, rootFolder) {
  // Start with attachments subfolder
  let currentFolder = getOrCreateFolder(rootFolder, 'attachments');

  // Create hierarchy from label path
  const pathParts = labelPath.split('/');
  for (const part of pathParts) {
    const sanitizedPart = sanitizeFolderName(part);
    currentFolder = getOrCreateFolder(currentFolder, sanitizedPart);
  }

  return currentFolder;
}

/**
 * Gets or creates a subfolder
 */
function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return parentFolder.createFolder(folderName);
}

/**
 * Generates unique filename if conflict exists
 * Logic: name_YYYY-MM-DD.ext, then name_YYYY-MM-DD-2.ext, etc.
 */
function generateUniqueFilename(baseFilename, date, extension, folder) {
  const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const baseName = `${baseFilename}_${dateStr}`;

  let filename = `${baseName}.${extension}`;
  let counter = 2;

  // Check for duplicates
  while (folder.getFilesByName(filename).hasNext()) {
    filename = `${baseName}-${counter}.${extension}`;
    counter++;
  }

  return filename;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Converts shell-style wildcard to RegExp
 * Examples: "*covid*" → /^.*covid.*$/i, "Projects/*" → /^Projects\/.*$/i
 */
function wildcardToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // Escape regex special chars
    .replace(/\*/g, '.*')                   // * → match any chars
    .replace(/\?/g, '.');                   // ? → match one char

  return new RegExp('^' + escaped + '$', 'i');
}

/**
 * Sanitizes filename to handle unicode, emojis, and invalid characters
 * Ensures cross-platform compatibility
 */
function sanitizeFilename(filename) {
  return filename
    .normalize('NFD')                        // Normalize unicode
    .replace(/[\u0300-\u036f]/g, '')         // Remove diacritics
    .replace(/[\u{1F600}-\u{1F6FF}]/gu, '_') // Replace emojis
    .replace(/[<>:"/\\|?*]/g, '-')           // Replace invalid chars
    .replace(/\s+/g, '_')                    // Replace spaces
    .replace(/^\.+/, '')                     // Remove leading dots
    .replace(/\.+$/, '')                     // Remove trailing dots
    .substring(0, 200);                      // Limit length
}

/**
 * Sanitizes folder name (similar to filename but allows more chars)
 */
function sanitizeFolderName(folderName) {
  return folderName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u{1F600}-\u{1F6FF}]/gu, '_')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .substring(0, 200);
}

/**
 * Strips file extension from filename
 */
function stripExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(0, lastDot) : filename;
}

/**
 * Gets file extension from filename
 */
function getExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(lastDot + 1) : '';
}

/**
 * Quotes string for Gmail query if needed
 */
function quoteForQuery(str) {
  const hasSpecial = /[\s:"()]/.test(str);
  const escaped = str.replace(/"/g, '\\"');
  return hasSpecial ? `"${escaped}"` : str;
}

/**
 * Logs extraction result to the Extraction Log sheet
 */
function logExtraction(status, folderPath, filename, message, emailSubject) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(SHEETS.LOG);

    if (!logSheet) {
      Logger.log('Log sheet not found');
      return;
    }

    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    const row = [timestamp, status, folderPath, filename, message, emailSubject];

    logSheet.appendRow(row);

    // Apply formatting based on status
    const lastRow = logSheet.getLastRow();
    const statusCell = logSheet.getRange(lastRow, 2);

    if (status === STATUS.SUCCESS) {
      statusCell.setBackground('#d9ead3'); // Light green
    } else if (status === STATUS.WARNING) {
      statusCell.setBackground('#fff2cc'); // Light yellow
    } else if (status === STATUS.ERROR) {
      statusCell.setBackground('#f4cccc'); // Light red
    }

  } catch (e) {
    Logger.log(`Failed to log extraction: ${e.message}`);
  }
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Resets extraction state (clears progress)
 * Call this to start fresh or after completion
 */
function resetExtractionState() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    scriptProps.deleteProperty(STATE_KEYS.LAST_PROCESSED_INDEX);
    scriptProps.deleteProperty(STATE_KEYS.TOTAL_THREADS);
    scriptProps.deleteProperty(STATE_KEYS.ALL_THREAD_IDS);
    scriptProps.deleteProperty(STATE_KEYS.IS_PROCESSING);

    Logger.log('Extraction state reset');

    SpreadsheetApp.getUi().alert(
      'State Reset',
      'Extraction state has been cleared.\n\n' +
      'Next run will start from the beginning.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (e) {
    Logger.log(`Error resetting state: ${e.message}`);
    throw new Error(`Failed to reset state: ${e.message}`);
  }
}

// ============================================================================
// DIAGNOSTIC & TROUBLESHOOTING FUNCTIONS
// ============================================================================

/**
 * Force release any stuck locks
 * Run this if you keep getting "Extraction In Progress" error
 */
function forceReleaseLock() {
  const ui = SpreadsheetApp.getUi();

  try {
    const lockService = LockService.getScriptLock();
    Logger.log('Attempting to acquire and release lock...');

    const hasLock = lockService.tryLock(100); // 100ms

    if (hasLock) {
      Logger.log('✓ Lock was available - releasing...');
      lockService.releaseLock();
      Logger.log('✓ Lock released successfully');

      ui.alert(
        'Lock Released',
        'The execution lock was available and has been released.\n\n' +
        'You can now run "Extract Attachments" again.',
        ui.ButtonSet.OK
      );
    } else {
      Logger.log('✗ Lock is currently held');

      ui.alert(
        'Lock Currently Held',
        'The lock is currently held by another execution.\n\n' +
        'Options:\n' +
        '1. Wait 30 seconds for auto-release\n' +
        '2. Check if sheet is open in another tab\n' +
        '3. Check Executions panel for running scripts',
        ui.ButtonSet.OK
      );
    }

  } catch (e) {
    Logger.log(`Error checking lock: ${e.message}`);
    ui.alert(
      'Lock Check Failed',
      `Unable to check lock status:\n\n${e.message}\n\n` +
      'Lock should auto-release after 30 seconds.',
      ui.ButtonSet.OK
    );
  }
}

/**
 * Show current execution status
 */
function showExecutionStatus() {
  const ui = SpreadsheetApp.getUi();
  const lockService = LockService.getScriptLock();

  Logger.log('=== EXECUTION STATUS CHECK ===');

  try {
    const hasLock = lockService.tryLock(100);

    if (hasLock) {
      lockService.releaseLock();
      Logger.log('✓ No execution running (lock is free)');

      ui.alert(
        'Status: IDLE',
        'No extraction is currently running.\n\n' +
        'Lock is free and available.',
        ui.ButtonSet.OK
      );
    } else {
      Logger.log('⚠ Execution IS running (lock is held)');

      ui.alert(
        'Status: RUNNING',
        'An extraction IS currently running!\n\n' +
        'Check:\n' +
        '• Executions panel for running scripts\n' +
        '• Other tabs with this sheet open\n' +
        '• Wait 30 seconds for auto-release',
        ui.ButtonSet.OK
      );
    }

  } catch (e) {
    Logger.log(`Error: ${e.message}`);
    ui.alert('Status Check Failed', `Error:\n\n${e.message}`, ui.ButtonSet.OK);
  }
}

/**
 * Comprehensive lock service test
 */
function testLockService() {
  const ui = SpreadsheetApp.getUi();

  Logger.log('=== LOCK SERVICE TEST STARTED ===');

  try {
    const lockService = LockService.getScriptLock();
    Logger.log('✓ LockService.getScriptLock() succeeded');

    // Test 1: Quick acquire
    Logger.log('Test 1: Quick acquire with tryLock(1000)...');
    const start1 = Date.now();
    const lock1 = lockService.tryLock(1000);
    const elapsed1 = Date.now() - start1;

    if (lock1) {
      Logger.log(`✓ Test 1 PASSED: Lock acquired in ${elapsed1}ms`);
      lockService.releaseLock();
    } else {
      Logger.log(`✗ Test 1 FAILED: Could not acquire after ${elapsed1}ms`);
      ui.alert('Test Failed', `Could not acquire lock.\nWait 30 seconds and try again.`, ui.ButtonSet.OK);
      return;
    }

    // Test 2: Wait for lock
    Logger.log('Test 2: Testing waitLock(5000)...');
    const start2 = Date.now();
    const lock2 = lockService.waitLock(5000);
    const elapsed2 = Date.now() - start2;

    if (lock2) {
      Logger.log(`✓ Test 2 PASSED: Lock acquired in ${elapsed2}ms`);
      lockService.releaseLock();
    } else {
      Logger.log(`✗ Test 2 FAILED: waitLock returned false after ${elapsed2}ms`);
      ui.alert('Test Failed', `waitLock(5000) failed after ${elapsed2}ms.\nThis is unusual!`, ui.ButtonSet.OK);
      return;
    }

    // Test 3: Rapid acquire/release
    Logger.log('Test 3: Rapid acquire/release (10 times)...');
    let failCount = 0;

    for (let i = 0; i < 10; i++) {
      const testStart = Date.now();
      const testLock = lockService.waitLock(1000);
      const testElapsed = Date.now() - testStart;

      if (testLock) {
        Logger.log(`  Attempt ${i+1}: Success (${testElapsed}ms)`);
        lockService.releaseLock();
      } else {
        Logger.log(`  Attempt ${i+1}: FAILED (${testElapsed}ms)`);
        failCount++;
      }
    }

    Logger.log('=== TEST COMPLETED ===');
    Logger.log(`Results: ${10-failCount}/10 passed, ${failCount}/10 failed`);

    if (failCount === 0) {
      ui.alert(
        'All Tests Passed',
        'LockService is working correctly!\n\n' +
        'All 10 rapid acquire/release tests succeeded.\n\n' +
        'The extraction issue must be something else.',
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        'Some Tests Failed',
        `${failCount}/10 rapid tests failed.\n\n` +
        'This suggests intermittent lock issues.\n' +
        'Check execution logs for details.',
        ui.ButtonSet.OK
      );
    }

  } catch (e) {
    Logger.log('=== TEST FAILED ===');
    Logger.log('✗ Error: ' + e.message);
    ui.alert('Test Error', 'Lock service test failed:\n\n' + e.message, ui.ButtonSet.OK);
  }
}

/**
 * Check for phantom lock (perpetual lock holder)
 */
function testForPhantomLock() {
  const ui = SpreadsheetApp.getUi();

  Logger.log('=== PHANTOM LOCK TEST ===');

  try {
    const lockService = LockService.getScriptLock();

    Logger.log('Attempting minimal timeout lock...');
    const start = Date.now();
    const hasLock = lockService.tryLock(50);
    const elapsed = Date.now() - start;

    if (hasLock) {
      Logger.log(`✓ Lock acquired immediately (${elapsed}ms)`);
      Logger.log('No phantom lock detected');
      lockService.releaseLock();

      ui.alert(
        'No Phantom Lock',
        `Lock is available (${elapsed}ms).\n\n` +
        'No stuck lock detected.',
        ui.ButtonSet.OK
      );
    } else {
      Logger.log(`✗ Lock unavailable (${elapsed}ms)`);
      Logger.log('⚠ PHANTOM LOCK DETECTED');

      ui.alert(
        'Phantom Lock Detected!',
        `Lock is being held by something!\n\n` +
        'Solutions:\n' +
        '1. Check Executions panel\n' +
        '2. Wait 30 seconds for auto-release\n' +
        '3. Close other tabs with this sheet',
        ui.ButtonSet.OK
      );
    }

  } catch (e) {
    Logger.log('✗ Test failed: ' + e.message);
    ui.alert('Test Error', 'Could not test:\n\n' + e.message, ui.ButtonSet.OK);
  }
}

/**
 * Check script version - verify timeout fix is applied
 */
function checkScriptVersion() {
  const ui = SpreadsheetApp.getUi();

  Logger.log('=== SCRIPT VERSION CHECK ===');

  try {
    if (typeof acquireExecutionLock === 'function') {
      Logger.log('✓ acquireExecutionLock function exists');

      ui.alert(
        'Script Version Check',
        'The acquireExecutionLock function exists.\n\n' +
        'To verify timeout is 10 seconds:\n' +
        '1. Open Apps Script editor\n' +
        '2. Press Ctrl+F (Find)\n' +
        '3. Search for: waitLock(10000)\n' +
        '4. Should find in acquireExecutionLock\n\n' +
        'If you see waitLock(1000), script needs updating.',
        ui.ButtonSet.OK
      );
    } else {
      Logger.log('✗ Function NOT FOUND');
      ui.alert('Version Issue', 'acquireExecutionLock not found!', ui.ButtonSet.OK);
    }

  } catch (e) {
    Logger.log(`Error: ${e.message}`);
    ui.alert('Version Check Failed', `Error:\n\n${e.message}`, ui.ButtonSet.OK);
  }
}

// ============================================================================
// END OF SCRIPT
// ============================================================================

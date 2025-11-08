# Changelog

All notable changes to Gmail Attachment Extractor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2025-11-07

### Added
- **System label support** for Gmail built-in folders (INBOX, SENT, DRAFT, SPAM, TRASH, STARRED, IMPORTANT, UNREAD)
- Pattern matching now works with system labels: `*inbox*`, `*sent*`, `*starred*`
- Comprehensive diagnostic functions in main script:
  - Check Execution Status
  - Force Release Lock
  - Test Lock Service
  - Test For Phantom Lock
  - Check Script Version
- Execution ID tracking for better debugging
- Progress logging during lock acquisition

### Fixed
- **CRITICAL:** Replaced broken `waitLock()` with `tryLock()` retry loop
  - `waitLock()` was failing after ~100-200ms instead of waiting full timeout
  - Now properly waits up to 10 seconds with visible progress
- System labels (like INBOX) now searchable with wildcard patterns
- Lock acquisition error messages now show actual error instead of generic message

### Changed
- Lock timeout increased from 1 second to 10 seconds equivalent (100 attempts × 100ms)
- Enhanced error reporting with detailed timing information
- Improved logging throughout extraction process

---

## [1.2.0] - 2025-11-07

### Added
- Comprehensive debug logging to `setupSheet()` function
- Debug logging to `readConfiguration()` function
- Execution timestamp and elapsed time tracking
- Lock acquisition/release logging

### Fixed
- Lock acquisition now properly logs timing and attempts
- Better error messages for lock failures

### Changed
- `setupSheet()` now shows detailed step-by-step progress in logs
- Configuration reading shows all values as they're parsed

---

## [1.1.0] - 2025-11-07

### Added
- **Auto-setup feature** - First-time users no longer need to manually run setupSheet
- Automatic tab creation on first extraction run
- User-friendly setup dialogs with clear instructions
- Privacy warning dialogs for public Sheet/Drive access
- Execution locks to prevent concurrent runs
- Unicode and emoji filename sanitization

### Security
- `checkSheetPrivacy()` - Warns if Google Sheet is publicly accessible
- `checkDriveFolderPrivacy()` - Warns if Drive folder is publicly shared
- `acquireExecutionLock()` - Prevents multiple simultaneous extractions
- Enhanced filename sanitization for Unicode characters

### Changed
- Simplified user workflow from 9 steps to 6 steps (33% reduction)
- Users never need to open Apps Script editor
- Setup now runs automatically when Configuration/Log tabs are missing

### Documentation
- Added AUTO-SETUP-UPDATE.md explaining the UX improvement
- Added PDD-Security-Updates-Summary.md documenting security features
- Updated DEPLOYMENT-GUIDE.md to reflect simplified workflow

---

## [1.0.0] - 2025-11-07

### Added
- Initial release of Gmail Attachment Extractor
- Wildcard pattern matching for Gmail labels (`*covid*`, `Projects/*`)
- Preserves Gmail label hierarchy as Drive folder structure
- Intelligent duplicate handling with auto-renaming
- Batch processing with auto-resume capability
- Configuration via Google Sheet named ranges
- Extraction logging with success/error tracking
- Custom menu in Google Sheets ("Attachment Tools")
- State management for resuming interrupted extractions

### Features
- **Folder Pattern Matching:**
  - Wildcard support: `*pattern*`, `exact/match`, `Parent/*`
  - Multiple patterns: comma-separated list
  - Case-insensitive matching

- **File Organization:**
  - Preserves Gmail label paths as Drive folders
  - Filenames include sent date: `filename_YYYY-MM-DD.ext`
  - Duplicate handling: `file_2024-01-15-2.pdf`
  - Multiple labels: saves to all matching folders

- **Batch Processing:**
  - Configurable batch size (1-50 threads)
  - Auto-resume for large mailboxes
  - Progress tracking via script properties
  - Graceful handling of 6-minute execution limit

- **Error Handling:**
  - Comprehensive try-catch blocks
  - Detailed error logging
  - User-friendly error messages
  - State preservation on failures

### Documentation
- Comprehensive Product Design Document (PDD)
- Deployment guide with step-by-step instructions
- Troubleshooting guide with common issues
- Security and privacy documentation

---

## [Unreleased]

### Planned Features
- Python desktop version for offline processing
- Scheduled automatic extraction (time-based triggers)
- Advanced filtering:
  - By date range
  - By sender
  - By attachment size/type
- Export to ZIP archives
- Support for additional cloud storage (Dropbox, OneDrive)
- Email template support for organizing files
- OCR for image attachments
- Duplicate detection across entire Drive

---

## Version History Summary

- **v1.3.0** - System labels + LockService bug workaround + diagnostics
- **v1.2.0** - Enhanced debugging and logging
- **v1.1.0** - Auto-setup + security features
- **v1.0.0** - Initial release

---

## Bug Fixes by Version

### Critical Bugs Fixed
1. **v1.3.0:** `waitLock()` returning false prematurely (Google Apps Script bug)
2. **v1.3.0:** System labels (INBOX, SENT, etc.) not searchable
3. **v1.1.0:** Manual setup too technical for non-technical users

### Security Enhancements
1. **v1.1.0:** Added privacy warnings for public sharing
2. **v1.1.0:** Implemented execution locks
3. **v1.1.0:** Enhanced filename sanitization

---

**Note:** This project follows semantic versioning. Breaking changes will increment the major version.

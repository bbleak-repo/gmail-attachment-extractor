# Contributing to Gmail Attachment Extractor

Thank you for considering contributing to Gmail Attachment Extractor! This document provides guidelines for contributing to the project.

---

## 🤝 How to Contribute

### Reporting Bugs

Before creating a bug report, please:
1. **Check existing issues** to avoid duplicates
2. **Test with the latest version** of the script
3. **Gather debug information** from execution logs

When filing a bug report, include:
- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Execution log output (sanitize personal info!)
- Google Apps Script version/environment
- Configuration settings (without personal data)

**Use the bug report template:**
```markdown
**Description:**
Brief description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Execution Logs:**
```
(paste sanitized logs here)
```

**Environment:**
- Google Apps Script version: [e.g., V8 runtime]
- Browser: [e.g., Chrome 119]
- Configuration: [e.g., Folder Patterns: *inbox*, Batch Size: 20]
```

---

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:
1. **Check the roadmap** in README.md
2. **Search existing issues** for similar suggestions
3. **Explain the use case** clearly
4. **Consider backwards compatibility**

**Enhancement template:**
```markdown
**Feature Request:**
Clear description of the feature

**Use Case:**
Why is this feature needed?

**Proposed Solution:**
How should it work?

**Alternatives Considered:**
Other ways to achieve this

**Impact:**
Who would benefit from this?
```

---

### Pull Requests

We welcome pull requests! Please follow these guidelines:

#### Before Starting
1. **Open an issue first** to discuss major changes
2. **Fork the repository**
3. **Create a feature branch** from `main`

#### Code Guidelines

**JavaScript/Google Apps Script:**
- Follow existing code style and conventions
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions focused and single-purpose
- Avoid deep nesting (max 3 levels)

**Example:**
```javascript
/**
 * Extracts attachments from a single Gmail message
 * @param {GmailMessage} message - The Gmail message object
 * @param {DriveFolder} folder - Destination Drive folder
 * @param {Object} config - Configuration object
 * @returns {Object} Statistics object with success/error counts
 */
function extractMessageAttachments(message, folder, config) {
  const stats = { success: 0, errors: 0 };

  try {
    const attachments = message.getAttachments();
    Logger.log(`Processing ${attachments.length} attachments`);

    for (const attachment of attachments) {
      // Process each attachment...
    }

    return stats;

  } catch (e) {
    Logger.log(`Error extracting attachments: ${e.message}`);
    throw e;
  }
}
```

#### Testing Requirements

Before submitting a PR:
1. **Test with Google Apps Script** (not just local JavaScript)
2. **Test with various configurations:**
   - Different folder patterns
   - Small and large mailboxes
   - Edge cases (no attachments, duplicates, etc.)
3. **Check execution logs** for errors/warnings
4. **Test auto-setup** on a fresh sheet

**Minimum test cases:**
- [ ] Fresh installation works
- [ ] Configuration reading works
- [ ] Gmail search finds emails
- [ ] Attachments extract to Drive
- [ ] Duplicate handling works
- [ ] Error handling works gracefully
- [ ] Auto-resume works after timeout

#### Commit Guidelines

**Commit message format:**
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(search): add support for system labels (INBOX, SENT, etc.)

- Added systemLabels array to getLabelsMatchingPatterns()
- Map system labels to Gmail search operators
- Update documentation

Closes #42
```

```
fix(lock): replace broken waitLock() with tryLock() retry loop

Google Apps Script's waitLock() returns false after ~100-200ms
instead of waiting for the full timeout. Replaced with manual
retry loop using tryLock().

Fixes #38
```

#### Documentation

Update documentation when:
- Adding new features
- Changing configuration options
- Fixing bugs that affect user behavior
- Modifying setup/deployment process

**Files to update:**
- `README.md` - If user-facing changes
- `CHANGELOG.md` - Always update with your changes
- `DEPLOYMENT-GUIDE.md` - If setup changes
- `TROUBLESHOOTING-GUIDE.md` - If fixing common issues
- JSDoc comments in code

---

## 🏗️ Development Setup

### Prerequisites
- Google account
- Google Apps Script experience
- Understanding of Gmail/Drive APIs

### Getting Started

1. **Fork and clone:**
   ```bash
   git fork https://github.com/bbleak-repo/gmail-attachment-extractor
   git clone https://github.com/YOUR-FORK/gmail-attachment-extractor.git
   cd gmail-attachment-extractor
   ```

2. **Create test environment:**
   - Create a test Google Sheet
   - Add the script to Apps Script editor
   - Create test Gmail labels and emails

3. **Make changes:**
   - Edit the `.gs` file
   - Test in Google Apps Script
   - Check execution logs

4. **Test thoroughly:**
   - Run all test cases
   - Check for errors in logs
   - Verify in different scenarios

5. **Submit PR:**
   - Push to your fork
   - Create pull request to `main`
   - Reference related issues

---

## 📝 Style Guide

### Code Style

**Naming:**
- `camelCase` for variables and functions
- `UPPER_SNAKE_CASE` for constants
- `PascalCase` for classes (if any)

**Formatting:**
- 2 spaces for indentation
- Single quotes for strings (except when escaping)
- Semicolons required
- Max line length: 100 characters

**Comments:**
- JSDoc for all functions
- Inline comments for complex logic
- No obvious comments (`i++; // increment i`)

**Error Handling:**
- Always catch and log errors
- Provide user-friendly error messages
- Clean up resources in finally blocks

### Documentation Style

**Markdown:**
- Use headers hierarchically (no skipping levels)
- Include code blocks with language tags
- Use tables for structured data
- Add emojis sparingly for visual markers

**Technical Writing:**
- Be clear and concise
- Use active voice
- Provide examples
- Link to related docs

---

## 🔍 Code Review Process

All submissions require review. We'll check for:

1. **Functionality:**
   - Does it work as intended?
   - Are edge cases handled?
   - Is error handling appropriate?

2. **Code Quality:**
   - Follows style guidelines?
   - Well-documented?
   - No code smells?

3. **Testing:**
   - Has it been tested?
   - Are test scenarios covered?
   - No regressions?

4. **Documentation:**
   - README updated if needed?
   - CHANGELOG updated?
   - Comments clear?

---

## 🐛 Debugging Tips

### Common Issues

**Script timeouts:**
- Reduce batch size
- Add more logging
- Check for infinite loops

**API quota errors:**
- Add delays between operations
- Reduce frequency of API calls
- Cache results when possible

**Permission errors:**
- Check OAuth scopes
- Verify authorization
- Test with different accounts

### Logging Best Practices

```javascript
// Good: Structured logging
Logger.log('=== FUNCTION_NAME STARTED ===');
Logger.log(`Processing ${items.length} items`);
Logger.log(`Config: ${JSON.stringify(config)}`);

// Bad: Generic logging
Logger.log('starting');
Logger.log('config');
```

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## ❓ Questions?

- Open an issue for general questions
- Tag maintainers for urgent matters
- Check existing issues/discussions first

---

**Thank you for contributing!** 🎉

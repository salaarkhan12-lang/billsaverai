# Security Testing Guide

## Overview

This guide provides comprehensive testing procedures to verify the security implementations in BillSaver. All tests should be performed before deployment and periodically thereafter.

## Quick Start

```bash
# 1. Start development server
npm run dev

# 2. Open browser to http://localhost:3000
# 3. Open DevTools (F12)
# 4. Follow tests below
```

---

## Test 1: Memory-Only Storage Verification

**Objective**: Verify NO PHI persists to browser storage

### Steps:
1. Open DevTools → Application tab
2. Check **Local Storage** - should be completely EMPTY
3. Check **Session Storage** - should be completely EMPTY
4. Upload and analyze a medical document PDF
5. Check Local Storage again - should STILL be EMPTY
6. Check Session Storage again - should STILL be EMPTY
7. Refresh the page
8. Check both storages - should remain EMPTY

**Expected Result**: ✅ Zero entries in localStorage and sessionStorage

**Why It Matters**: HIPAA requires NO PHI persistence to disk. Browser storage violates this.

---

## Test 2: Content Security Policy (CSP)

**Objective**: Verify CSP headers prevent malicious scripts

### Steps:
1. Open DevTools → Console tab
2. Navigate to http://localhost:3000
3. Look for CSP violations - should be **ZERO**
4. Open DevTools → Network tab
5. Click any request → Response Headers
6. Find `Content-Security-Policy` header
7. Verify it contains:
   - `default-src 'self'`
   - `frame-ancestors 'none'`
   - `object-src 'none'`

**Expected Result**: ✅ CSP header present, no console violations

**Test Attack Vector**: Tryin to inject inline script (should fail):
```javascript
// Open Console and try:
eval('console.log("injection test")');
// Should fail with CSP error
```

---

## Test 3: Security Headers

**Objective**: Verify all security headers are present

### Steps:
1. Open DevTools → Network tab
2. Navigate to application
3. Click any request
4. Check Response Headers for:

| Header | Expected Value |
|--------|---------------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=()...` |
| `Strict-Transport-Security` | `max-age=31536000` (production only) |

**Expected Result**: ✅ All headers present with correct values

---

## Test 4: Input Validation

**Objective**: Verify file validation prevents malicious uploads

### Test 4.1: File Size Limit
```bash
# Create a 60MB test file
fsutil file createnew large.pdf 62914560  # Windows
# or
dd if=/dev/zero of=large.pdf bs=1M count=60  # Linux/Mac
```

**Steps**:
1. Try to upload the 60MB file
2. Should reject with error: "File is too large (60MB). Maximum size is 50MB"

**Expected Result**: ✅ File rejected

### Test 4.2: Magic Byte Verification
```bash
# Rename an executable to .pdf
copy C:\Windows\notepad.exe malicious.pdf  # Windows
# or
cp /bin/ls malicious.pdf  # Linux/Mac
```

**Steps**:
1. Try to upload `malicious.pdf`
2. Should reject with error: "File is not a valid PDF document (magic byte verification failed)"

**Expected Result**: ✅ File rejected (magic bytes don't match PDF)

### Test 4.3: Rate Limiting
**Steps**:
1. Rapidly upload 15 PDFs in quick succession
2. After 10th file, should get: "Rate limit exceeded. Please wait X seconds..."

**Expected Result**: ✅ Rate limit enforced after 10 uploads

---

## Test 5: Session Management

**Objective**: Verify sessions expire and don't leak tokens

### Test 5.1: Session Timeout
**Steps**:
1. Use the application normally
2. Wait 30+ minutes without any activity
3. Try to perform an action
4. Should require new session/re-authentication

**Expected Result**: ✅ Session expired after 30min idle

### Test 5.2: Token Leakage
**Steps**:
1. Open DevTools → Console
2. Type: `localStorage`
3. Expand object - should have NO auth_token or similar
4. Type: `sessionStorage`
5. Expand object - should be EMPTY
6. Type: `document.cookie`
7. Should not contain plaintext tokens

**Expected Result**: ✅ No tokens visible in JavaScript

---

## Test 6: Encryption Strength

**Objective**: Verify 500,000 PBKDF2 iterations

### Steps:
1. Open `src/lib/encryption.ts` in editor
2. Go to line 46 (or search for "iterations")
3. Verify: `iterations: number = 500000`

**Expected Result**: ✅ 500,000 iterations configured

### Performance Test:
```bash
# Run encryption test
npm test -- encryption.test.ts
```

**Expected**: ✅ Tests pass, encryption takes ~150-200ms

---

## Test 7: CSRF Protection

**Objective**: Verify CSRF tokens on authenticated requests

### Steps:
1. Open DevTools → Network tab
2. Perform an action that makes an API call
3. Click the request → Request Headers
4. Look for `X-CSRF-Token` header

**Expected Result**: ✅ CSRF token present on authenticated requests

---

## Test 8: XSS Prevention

**Objective**: Verify XSS attacks are prevented

### Test 8.1: Filename Injection
**Steps**:
1. Create a file named: `<script>alert('XSS')</script>.pdf`
2. Upload the file
3. Check if script executes

**Expected Result**: ✅ Script does NOT execute, filename sanitized

### Test 8.2: Content Injection
**Steps**:
1. Open Console
2. Try: `document.body.innerHTML = '<img src=x onerror=alert(1)>'`
3. Due to CSP, should fail

**Expected Result**: ✅ CSP blocks inline event handlers

---

## Test 9: Clickjacking Protection

**Objective**: Verify application cannot be framed

### Steps:
1. Create test HTML file:
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Clickjacking Test</h1>
  <iframe src="http://localhost:3000" width="800" height="600"></iframe>
</body>
</html>
```

2. Open in browser
3. Check if iframe loads

**Expected Result**: ✅ iframe blocked with X-Frame-Options error

---

## Test 10: Memory Cleanup

**Objective**: Verify sensitive data is cleared from memory

### Steps:
1. Open DevTools → Memory tab
2. Take heap snapshot (baseline)
3. Upload and analyze a document
4. Close/navigate away from results
5. Take another heap snapshot
6. Compare snapshots

**Expected Result**: ✅ No lingering sensitive data in second snapshot

**Automated Check**:
```javascript
// In Console after analysis
console.log(memoryStore.size()); // Should be 0 after navigation
```

---

## Security Audit Checklist

Use this before each release:

### Storage Security
- [ ] NO localStorage entries for PHI
- [ ] NO sessionStorage entries for PHI
- [ ] NO cookies with PHI
- [ ] Memory store clears on page unload

### Network Security
- [ ] CSP header present
- [ ] No CSP violations in console
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] HSTS header in production
- [ ] All requests use HTTPS in production

### Input Validation
- [ ] File size limit enforced (50MB)
- [ ] Magic byte verification works
- [ ] Rate limiting functional (10/minute)
- [ ] Malicious files rejected
- [ ] XSS prevention active

### Session Security
- [ ] Sessions expire (30min idle)
- [ ] CSRF tokens on API calls
- [ ] No token leakage to JavaScript
- [ ] Session fingerprinting active

### Encryption
- [ ] 500,000 PBKDF2 iterations
- [ ] AES-256-GCM encryption
- [ ] Tamper detection functional
- [ ] Memory-only key storage

###  General
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] All features work normally

---

## Automated Testing (Future)

### Unit Tests
```bash
# Test encryption
npm test -- encryption.test.ts

# Test validators
npm test -- validators.test.ts

# Test session manager
npm test -- session-manager.test.ts

# Test memory store
npm test -- memory-store.test.ts
```

### Integration Tests
```bash
# Full security suite
npm test -- security

# Coverage report
npm test -- --coverage
```

---

## Security Tools

### Browser Extensions
- **React Developer Tools**: Inspect component state
- **Redux DevTools**: Monitor state changes (if using Redux)
- **Wappalyzer**: Verify tech stack

### Online Tools
- **SecurityHeaders.com**: Check HTTP headers
- **Mozilla Observatory**: Comprehensive security scan
- **SSL Labs**: Test HTTPS configuration (production)

### Command Line
```bash
# Check for known vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check dependencies
npm outdated
```

---

## Common Issues & Solutions

### Issue: CSP Violations
**Symptom**: Console shows CSP errors
**Solution**: Check middleware.ts nonce generation and usage

### Issue: File Upload Fails
**Symptom**: Valid PDFs rejected
**Solution**: Check validators.ts magic bytes match PDF spec

### Issue: Session Expires Too Quickly
**Symptom**: Users logged out frequently
**Solution**: Adjust timeout in session-manager.ts (line ~18)

### Issue: Rate Limit Too Strict
**Symptom**: Users hit limit too easily
**Solution**: Adjust RATE_LIMIT_CONFIG in validators.ts (line ~23)

---

## Penetration Testing

For thorough security assessment, consider:

1. **OWASP ZAP**: Automated vulnerability scanner
2. **Burp Suite**: Web security testing
3. **Nikto**: Web server scanner
4. **SQLMap**: SQL injection testing (if backend added)

**Note**: Only test on your own systems, never production without authorization.

---

## Compliance Verification

### HIPAA Technical Safeguards Checklist

- [x] **Access Control**
  - [x] Unique user identification
  - [x] Automatic logoff (30min)
  - [x] Encryption (AES-256-GCM)

- [x] **Audit Controls**
  - [ ] Audit logging implemented
  - [ ] Regular log review process

- [x] **Integrity**
  - [x] Data integrity verification (SHA-256)
  - [x] Person/entity authentication
  - [x] Transmission security (HTTPS)

- [x] **Transmission Security**
  - [x] Integrity controls
  - [x] Encryption (TLS 1.2+)

---

## Reporting Security Issues

If you find a security vulnerability:

1. **DO NOT** create a public issue
2. **DO** email security@billsaver.com
3. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

---

## Next Steps

After completing all tests:

1. ✅ Mark tests as passed in checklist
2. 📋 Document any issues found
3. 🔧 Fix critical issues before deployment
4. 📊 Schedule regular security reviews
5. 🔄 Repeat tests after major changes

---

**Last Updated**: January 7, 2026
**Version**: 1.0.0
**Review Required Before Each Release**

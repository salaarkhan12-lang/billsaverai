# Security Policy

## Overview

BillSaver takes security seriously. This document outlines our security practices, vulnerability reporting procedures, and security best practices for contributors and users.

## Security Architecture

### Multi-Layer Defense

BillSaver implements defense-in-depth with multiple security layers:

1. **Client-Side Security**
   - Memory-only data storage (no disk persistence for PHI)
   - End-to-end encryption using AES-256-GCM
   - PBKDF2 key derivation with 500,000 iterations
   - Automatic data cleanup on page unload

2. **Network Security**
   - Content Security Policy (CSP) with strict directives
   - Comprehensive HTTP security headers
   - HTTPS enforcement in production (HSTS)
   - Cross-Origin Resource Policy (CORP)

3. **Input Validation**
   - Magic byte verification for file uploads
   - File size limits (50MB maximum)
   - MIME type validation
   - Rate limiting (10 uploads per minute)
   - XSS prevention through sanitization

4. **Session Management**
   - In-memory session storage only
   - CSRF token protection
   - Session fingerprinting for hijacking detection
   - Automatic expiration (30min idle, 8hr absolute)

## HIPAA Compliance

BillSaver is designed to be HIPAA compliant:

- ✅ **No PHI Persistence**: All PHI is stored only in memory, never persists to disk
- ✅ **End-to-End Encryption**: 256-bit AES-GCM with authenticated encryption
- ✅ **Access Controls**: Session-based authentication with automatic expiration
- ✅ **Audit Capability**: Comprehensive security logging
- ✅ **Data Integrity**: SHA-256 checksums with tamper detection
- ✅ **Automatic Cleanup**: All data cleared on page unload

For complete HIPAA compliance documentation, see [HIPAA_COMPLIANCE.md](./HIPAA_COMPLIANCE.md).

## Security Features

###  Encryption

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2-HMAC-SHA256 with 500,000 iterations
- **IV Generation**: Cryptographically secure random (96 bits)
- **Authentication**: Built-in auth tags for integrity verification
- **Hash Function**: SHA-256 for data integrity checks

### Content Security Policy

```
default-src 'self';
script-src 'self' 'nonce-{RANDOM}' 'strict-dynamic';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self';
object-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

### HTTP Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer information |
| `Permissions-Policy` | Camera/Mic/Geo disabled | Disable unnecessary features |
| `Strict-Transport-Security` | `max-age=31536000` | Force HTTPS (production) |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Isolate origin |

## Reporting Security Vulnerabilities

### How to Report

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. **DO** email security concerns to: **security@billsaver.com**
3. Include detailed information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Response Time**: We will acknowledge receipt within 48 hours
- **Investigation**: Security team will investigate and validate the report
- **Timeline**: We aim to fix critical issues within 7 days, high within 14 days
- **Disclosure**: Coordinated disclosure after fix is deployed
- **Credit**: Public acknowledgment (if desired) after disclosure

### Scope

**In Scope:**
- Cross-site scripting (XSS)
- SQL injection
- Authentication/authorization bypass
- Data exposure or leakage
- Encryption vulnerabilities
- PHI handling issues
- HIPAA compliance violations

**Out of Scope:**
- Social engineering
- Physical security
- Denial of service (DoS)
- Issues in dependencies (report to upstream)
- Issues requiring physical access

## Security Best Practices

### For Users

1. **Use Strong Passwords**: Minimum 12 characters, mix of letters/numbers/symbols
2. **Keep Software Updated**: Always use the latest version
3. **Secure Environment**: Use trusted devices and networks
4. **Clear Sessions**: Close browser when finished with sensitive data
5. **Report Issues**: Report any suspicious behavior immediately

### For Developers

1. **Code Review**: All code changes must be peer-reviewed
2. **Security Testing**: Run security tests before committing
3. **Dependency Updates**: Keep dependencies up to date
4. **Input Validation**: Always validate and sanitize user input
5. **Secrets Management**: Never commit secrets to version control
6. **Principle of Least Privilege**: Grant minimum necessary permissions

## Security Testing

### Automated Tests

Run security tests before committing:

```bash
# Run all tests including security tests
npm test

# Run specific security test suites
npm test -- security

# Test encryption implementation
npm test -- encryption.test.ts

# Test input validation
npm test -- validators.test.ts

# Test session management
npm test -- session-manager.test.ts
```

### Manual Security Verification

1. **CSP Validation**: Check browser console for CSP violations
2. **Header Verification**: Inspect network requests for security headers
3. **Storage Inspection**: Verify no PHI in localStorage/sessionStorage
4. **Session Testing**: Verify session expiration works correctly
5. **File Upload Testing**: Test malicious file rejection

### Security Audit Checklist

- [ ] No PHI in browser storage (localStorage/sessionStorage/cookies)
- [ ] All API requests use CSRF tokens
- [ ] CSP headers present and no violations
- [ ] Security headers present on all responses
- [ ] File uploads validated with magic bytes
- [ ] Rate limiting functional
- [ ] Sessions expire after inactivity
- [ ] Encryption uses 500,000 PBKDF2 iterations
- [ ] HTTPS enforced in production
- [ ] No sensitive data in logs

## Security Monitoring

### What We Monitor

- Failed authentication attempts
- Suspicious file upload patterns
- CSP violations
- Session hijacking attempts
- Unusual API access patterns
- Memory pressure and cleanup failures

### Incident Response

In the event of a security incident:

1. **Detection**: Automated monitoring alerts security team
2. **Assessment**: Evaluate severity and scope of incident
3. **Containment**: Isolate affected systems/users
4. **Eradication**: Remove threat and vulnerabilities
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Post-incident review and improvements

## Compliance

### Standards

BillSaver adheres to:

- **HIPAA**: Health Insurance Portability and Accountability Act
- **OWASP Top 10**: Web application security risks
- **NIST Cybersecurity Framework**: Risk management
- **CWE/SANS Top 25**: Most dangerous software weaknesses

### Regular Audits

- **Quarterly**: Internal security reviews
- **Annually**: Third-party security audit
- **Continuous**: Automated vulnerability scanning
- **As-needed**: Penetration testing after major changes

## Security Roadmap

### Completed

- ✅ Memory-only storage for PHI
- ✅ CSP implementation
- ✅ Security headers
- ✅ Input validation with magic bytes
- ✅ Session management with CSRF protection
- ✅ 500,000 PBKDF2 iterations
- ✅ Rate limiting

### Planned

- [ ] Multi-factor authentication (MFA)
- [ ] Advanced threat monitoring
- [ ] Real-time security dashboards
- [ ] Automated security scanning in CI/CD
- [ ] Bug bounty program
- [ ] SOC 2 compliance

## Contact

- **Security Email**: security@billsaver.com
- **Emergency**: +1-800-SECURITY (for critical issues)
- **General Support**: support@billsaver.com

---

**Last Updated**: January 7, 2026
**Version**: 1.0.0
**Review Frequency**: Quarterly

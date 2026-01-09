# BillSaver HIPAA Compliance One-Pager
## Zero Risk. Zero Cloud Storage. Zero Transmission.

---

## 🔒 The BillSaver Security Promise

**Your PHI never leaves the building. Literally.**

BillSaver processes all medical documents **100% client-side** in the browser. No servers. No cloud uploads. No data transmission. Your patient data stays exactly where it belongs: **under your control**.

---

## ✅ HIPAA Compliance Checklist

### Technical Safeguards
- ✅ **Client-Side Processing Only**: All analysis happens in browser JavaScript
- ✅ **Zero Disk Persistence**: Files stored in volatile memory only, never written to disk
- ✅ **AES-256-GCM Encryption**: Military-grade encryption with 500K PBKDF2 iterations (OWASP 2024)
- ✅ **Automatic Data Clearing**: All data erased on page close or 30-minute timeout
- ✅ **No External API Calls**: Zero data transmission to third parties

### Administrative Safeguards
- ✅ **Access Control**: User authentication for multi-provider deployments
- ✅ **Audit Logging**: Comprehensive activity tracking (client-side)
- ✅ **Security Training**: Documentation and training materials provided
- ✅ **Incident Response**: Documented procedures for security events

### Physical Safeguards
- ✅ **Self-Hosted Option**: Deploy on your own servers (no BAA needed)
- ✅ **Data Isolation**: Each session isolated, no cross-contamination

---

## 📊 How BillSaver Works (Data Flow)

```
┌─────────────────────────────────────────────────┐
│  1. Upload PDF                                  │
│     ↓                                           │
│  2. Browser Memory (Volatile)                   │
│     ↓                                           │
│  3. Client-Side Analysis (JavaScript)           │
│     ↓                                           │
│  4. Results Display                             │
│     ↓                                           │
│  5. Memory Cleared on Close                     │
│                                                 │
│  ❌ NO SERVER TRANSMISSION                      │
│  ❌ NO CLOUD STORAGE                            │
│  ❌ NO EXTERNAL APIs                            │
└─────────────────────────────────────────────────┘
```

**Every step happens in your browser.** Your firewall logs will show zero outbound traffic to BillSaver servers during analysis.

---

## 🆚 BillSaver vs. Cloud-Based Competitors

| Feature | BillSaver | Cloud-Based Tools |
|---------|-----------|-------------------|
| **PHI Transmission** | ❌ Never | ✅ Required |
| **Cloud Storage** | ❌ Never | ✅ Temporary or permanent |
| **BAA Required** | ❌ Not for self-hosted | ✅ Always |
| **Audit Risk** | 🟢 Minimal | 🟡 Moderate |
| **Breach Risk** | 🟢 Minimal (no transmission) | 🟡 Moderate (transmission + storage) |
| **HIPAA Compliance** | ✅ Compliant by design | ✅ Requires strict controls |
| **Internet Outage** | ✅ Still works | ❌ Unusable |

---

## 🛡️ Business Associate Agreement (BAA)

### SaaS Deployment (billsaver.com)
- **BAA Provided**: Yes, standard HIPAA BAA included
- **Our Access to PHI**: Zero (client-side processing)
- **Liability**: We accept standard BA liability for platform security

### Self-Hosted Deployment (Your Servers)
- **BAA Required**: No (you control the entire stack)
- **Our Access to PHI**: Zero (we never see your data)
- **Liability**: You maintain full control and responsibility

**Recommendation for maximum paranoia**: Self-host on your internal network. We'll help you deploy.

---

## 🔍 Audit Readiness

### What Auditors Will Ask:
1. **"Where is PHI transmitted?"**
   - **Answer**: Nowhere. Client-side processing only.

2. **"Who has access to the data?"**
   - **Answer**: Only authorized users in your organization.

3. **"How is data encrypted?"**
   - **Answer**: AES-256-GCM at rest (if stored), TLS 1.3 in transit (if applicable).

4. **"What's your incident response plan?"**
   - **Answer**: Documented in our security documentation.

---

## 📞 Common Questions

**Q: Can BillSaver employees see our patient data?**  
A: No. We have zero access. All processing happens on your devices.

**Q: What if your servers get hacked?**  
A: Irrelevant. Your PHI is never on our servers to begin with.

**Q: Do you use AI/ML models that could leak data?**  
A: All analysis is rule-based deterministic logic. No external AI APIs. No model training on your data.

**Q: What happens if we lose internet connection mid-analysis?**  
A: BillSaver continues working. All processing is local.

**Q: How do we verify no data transmission?**  
A: Monitor your firewall logs during analysis. You'll see zero outbound traffic to BillSaver servers.

---

## 💡 Bottom Line

BillSaver is the **only medical billing optimization tool** that processes PHI **exclusively client-side**.

**For clinical managers**: Sleep soundly knowing your PHI never leaves your control.  
**For compliance officers**: Minimal audit surface area.  
**For CFOs**: Same powerful analysis, zero data breach liability.

---

## 📄 Additional Documentation

- [Full HIPAA Compliance Documentation](../HIPAA_COMPLIANCE.md)
- [Security Architecture](../SECURITY.md)
- [Business Associate Agreement Template](../legal/baa-template.md)
- [Data Handling Procedures](../DATA_HANDLING_PROCEDURES.md)

---

**Questions?** Contact us to discuss your specific compliance requirements.

*Last Updated: January 2026*

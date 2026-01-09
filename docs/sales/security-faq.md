# BillSaver Security FAQ
## Common Questions from Clinical Managers

---

## Data Security & HIPAA

### Q: Can your employees see our patient data?
**A**: No. BillSaver processes all data client-side in your browser. We have zero access to your PHI. It never reaches our servers.

**Technical detail**: All analysis happens in JavaScript running locally on your machine. You can verify this by monitoring network traffic—you'll see zero outbound data transmission during analysis.

---

### Q: What if your servers get hacked?
**A**: This is irrelevant for BillSaver because your PHI is never on our servers to begin with.

Think of it like using Microsoft Word or Excel—the application runs on your computer, and your files stay on your computer. BillSaver works the same way, but in your web browser.

---

### Q: Where is our PHI stored?
**A**: In your browser's volatile memory (RAM) only, temporarily during analysis. When you close the tab or after 30 minutes of inactivity, everything is automatically cleared.

**Nothing is ever**:
- Written to disk
- Sent to servers
- Stored in databases
- Cached persistently

---

### Q: Do we need a Business Associate Agreement (BAA)?
**A**: It depends on your deployment:

**SaaS (billsaver.com)**:  
Yes, we provide a standard BAA. Even though we don't access your PHI, the BAA formalizes our responsibilities as a platform provider.

**Self-hosted (your servers)**:  
Typically no. If you deploy BillSaver on your own infrastructure, it's just software running in your environment. We don't touch your data.

**Consult your legal counsel** to determine what's required for your specific situation.

---

### Q: How do you encrypt our data?
**A**: PHI in browser memory is encrypted using AES-256-GCM if stored in browser session storage. Key derivation uses PBKDF2 with 500,000 iterations (OWASP 2024 standard).

However, most operations don't even persist to session storage—they run entirely in volatile JavaScript variables that are cleared when you close the tab.

---

### Q: What happens if we lose internet connection during analysis?
**A**: BillSaver continues working normally. All processing is local, so internet is only needed for:
- Initial page load
- Downloading updates (if enabled)

Once the page is loaded, analysis works offline.

---

## Accuracy & Trust

### Q: How accurate are your code recommendations?
**A**: We apply CMS E/M guidelines with 100% consistency. We don't claim to match expert coders perfectly—instead, we provide transparent, conservative recommendations with confidence scores.

Every recommendation includes:
- Confidence level (High/Medium/Low)
- Specific evidence from your note
- Reasoning for the suggestion
- Audit defense guidance

**You maintain full control**: Review recommendations and accept/reject based on your clinical judgment.

---

### Q: Have you validated this with certified medical coders?
**A**: We validate against official CMS guidelines. Our conservative, transparent approach is designed to minimize audit risk while identifying legitimate billing opportunities.

Many practices prefer this transparency over "black box" AI systems because it gives providers the information they need to defend billing in audits.

---

### Q: What if Medicare audits us based on your recommendations?
**A**: BillSaver provides suggestions, not auto-coding. You (the provider) maintain full responsibility for coding decisions.

However, we help with audit defense:
- Every suggestion includes evidence locations in your note
- Reasoning is documented and audit-ready
- Conservative approach minimizes overcoding risk

**Our positioning**: BillSaver is a documentation improvement assistant, not a coder.

---

### Q: Do you use AI that could leak data or hallucinate codes?
**A**: No. BillSaver uses deterministic, rule-based logic—not machine learning AI.

- No external AI APIs (like OpenAI, Google, etc.)
- No model training on your data
- No probabilistic "hallucinations"
- Same input → same output, every time

This is by design. Healthcare billing is too important for non-deterministic AI.

---

## Integration & Workflow

### Q: Does this integrate with our EMR (Epic/Cerner/Athena)?
**A**: Currently, BillSaver operates standalone—you export notes as PDFs and upload them.

**Roadmap**: We're building EMR integrations. Self-hosted deployments can potentially integrate directly with your systems.

---

### Q: How much time does this add to our workflow?
**A**: **Initial**: ~2 minutes per note (upload PDF, review recommendations)

**Once familiar**: ~30-60 seconds (quick scan of gaps, approve/reject suggestions)

**Long-term**: Often saves time by catching documentation gaps before billing, reducing denials and rework.

---

### Q: Will this slow down our providers?
**A**: BillSaver is designed for **concurrent documentation** or **pre-billing review**, not real-time note-taking.

**Recommended workflows**:
1. **End of day**: Providers review their notes with BillSaver before finalizing
2. **Coding review**: Billing staff run notes through BillSaver before submission
3. **Quality assurance**: Practice managers audit random samples

---

## Pricing & ROI

### Q: How much does this cost?
**A**: Typical pricing: **$199-299/provider/month**

**Alternative**: Revenue-share model (10-15% of additional revenue captured) for risk-averse practices.

Enterprise pricing available for 10+ provider groups.

---

### Q: What's the ROI?
**A**: Conservatively, practices see **5-10x ROI** in the first year.

**Example (3-provider cardiology practice)**:
- Cost: ~$9K/year
- Revenue gain: ~$60K/year (15% improvement in E/M levels)
- Net gain: ~$51K
- ROI: ~570%
- Breakeven: 2 months

Use our ROI calculator to model your specific practice demographics.

---

### Q: Can we try it before buying?
**A**: Yes! We offer:
1. **Free trial**: 30 days, unlimited analysis
2. **Pilot program**: 3-month structured evaluation with success metrics
3. **Demo**: We'll analyze 10 of your de-identified notes and show you the results

---

## Compliance & Legal

### Q: Is this legal for Medicare/Medicaid billing?
**A**: Yes. BillSaver helps you **document better** and **identify billable services already provided**.

We don't:
- Create false documentation
- Recommend codes not supported by your note
- Auto-bill anything

You review and approve all suggestions. It's no different than having a coding consultant review your notes.

---

### Q: What about state-specific regulations?
**A**: BillSaver applies CMS federal guidelines. State-specific Medicaid rules may vary—consult your compliance officer.

Our conservative approach generally satisfies state requirements, but we recommend reviewing with your legal team.

---

### Q: Do you store audit logs?
**A**: Yes, client-side. Audit logs include:
- Notes analyzed (metadata only, not PHI)
- Recommendations made
- Provider accept/reject decisions
- Timestamps

These logs stay on your machine (or your server if self-hosted). We can't access them.

---

## Technical

### Q: What browsers do you support?
**A**: Modern browsers with JavaScript enabled:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+  
- ✅ Edge 90+

**Not supported**: Internet Explorer (deprecated by Microsoft)

---

### Q: What's your uptime/availability?
**A**: **SaaS**: 99.9% uptime SLA  
**Self-hosted**: Uptime is under your control

Even during outages, previously downloaded pages work offline for analysis.

---

### Q: Can we deploy this on-premise?
**A**: Yes! Self-hosted deployment is available. We provide:
- Docker containers
- Installation documentation
- Technical support

**Benefits**: Complete control, no external dependencies, no BAA needed.

---

## Still Have Questions?

Contact us at: support@billsaver.com  
Or schedule a demo: [book demo link]

---

**Last Updated**: January 2026

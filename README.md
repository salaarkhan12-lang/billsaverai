# BillSaver - Medical Documentation Intelligence Platform

> AI-powered medical documentation analysis with HIPAA-compliant cloud infrastructure to optimize billing accuracy and prevent revenue loss from undercoding.

![BillSaver](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Version](https://img.shields.io/badge/version-1.6.0-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)
![AWS](https://img.shields.io/badge/AWS-HIPAA%20Compliant-orange?style=flat-square&logo=amazon-aws)
![Security](https://img.shields.io/badge/Security-OWASP%202024-green?style=flat-square&logo=security)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

**That's it!** Upload a medical note PDF and see the analysis.

📖 **New to BillSaver?** Start with the [Quick Start Guide](QUICKSTART.md)

**DEPLOYMENT*** billsaverai.vercel.app/dashboard

---

## ✨ Features

### 🎯 Core Capabilities
- **E/M Level Assessment** - Determines supported E/M level based on MDM complexity
- **HCC Gap Detection** - Identifies missing MEAT criteria for chronic conditions
- **Revenue Impact Analysis** - Precise calculations with multi-payer comparison
- **Revenue Validation & Transparency** - Automated accuracy checks with source citations
- **Payer Comparison** - Side-by-side revenue comparison across major insurers (BCBS, UHC, Aetna, Cigna)
- **Comprehensive Scoring** - 100-point documentation quality score with confidence indicators
- **Billing Code Intelligence** - Advanced CPT and ICD-10 code extraction and validation
- **API Testing Interface** - Programmatic testing capabilities for automated workflows

### 🔍 Smart Detection
- ✅ Chief Complaint validation
- ✅ HPI element tracking (8 elements)
- ✅ Review of Systems (14 organ systems)
- ✅ Physical Exam documentation (11+ areas)
- ✅ MEAT criteria compliance
- ✅ Time documentation tracking
- ✅ Diagnosis specificity checking
- ✅ CPT code extraction and categorization
- ✅ ICD-10 code validation and conflict detection

### 🎨 User Experience
- Beautiful glassmorphic UI with smooth animations
- Drag-and-drop PDF upload
- Real-time progress tracking
- Interactive results dashboard with confidence badges
- Expandable gap cards with recommendations
- Color-coded severity indicators
- Fully responsive (mobile, tablet, desktop)

---

## 📚 Documentation

### For Users
- **[Quick Start Guide](QUICKSTART.md)** - Get running in 5 minutes
- **[Setup Guide](SETUP_GUIDE.md)** - Complete installation and configuration
- **[Sample Medical Note](SAMPLE_MEDICAL_NOTE.md)** - Test data for trying the app
- **[Full README](README_FULL.md)** - Comprehensive feature documentation

### For Deployment
- **[Deployment Guide](DEPLOYMENT.md)** - Deploy to Vercel, Netlify, AWS, Docker, or self-hosted

### For Developers
- **[Architecture](ARCHITECTURE.md)** - System design, data flow, and patterns
- **[API Reference](API_REFERENCE.md)** - Complete function and component reference
- **[Testing Guide](TESTING_GUIDE.md)** - Comprehensive testing procedures
- **[Contributing](CONTRIBUTING.md)** - Guidelines for contributors
- **[Changelog](CHANGELOG.md)** - Version history and roadmap

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5.0 (Strict mode)
- **UI Library**: React 19.2
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion 12.23
- **PDF Processing**: PDF.js 4.4
- **Code Analysis**: @lowlysre/icd-10-cm, compromise, fuse.js
- **Utilities**: clsx, tailwind-merge

### Backend Infrastructure (Planned - Future Release)
- **Cloud Platform**: AWS (HIPAA Compliant)
- **Container Orchestration**: ECS Fargate
- **Database**: PostgreSQL with KMS encryption
- **Load Balancing**: Application Load Balancer
- **Security**: WAF, Security Groups, VPC isolation
- **Monitoring**: CloudWatch, CloudTrail audit logging
- **CI/CD**: GitHub Actions with security scanning
- **Backup**: Automated encrypted backups with cross-region replication

---

## 🏥 How It Works

1. **Upload** - Drag-and-drop or click to upload a medical note PDF
2. **Parse** - Extract text from PDF using PDF.js (client-side)
3. **Analyze** - Run 50+ documentation checks based on E/M guidelines
4. **Results** - View comprehensive analysis with:
   - Overall documentation score (0-100)
   - Current vs. potential E/M level
   - Revenue impact analysis
   - Detailed gap recommendations
   - Documentation strengths

---

## 🔒 Privacy & Security

### Enhanced Security
- ✅ **Memory-Only Storage** - Zero PHI persistence to disk (HIPAA compliant)
- ✅ **Session Management** - In-memory sessions with CSRF protection
- ✅ **Content Security Policy** - Strict CSP prevents XSS/injection attacks
- ✅ **Security Headers** - X-Frame-Options, HSTS, nosniff, and more
- ✅ **Input Validation** - Magic byte checking, rate limiting, size limits
- ✅ **Strong Encryption** - 500,000 PBKDF2 iterations (OWASP 2024)
- ✅ **No Tracking** - Zero analytics, zero third-party scripts
- ✅ **Auto Cleanup** - All data cleared on page unload

### Client-Side Mode (Default)
- ✅ **100% Client-Side Processing** - No data sent to servers
- ✅ **Zero Disk Persistence** - Files processed in volatile memory only
- ✅ **HIPAA-Friendly** - Suitable for PHI with proper safeguards
- ✅ **Secure by Design** - Defense-in-depth security architecture

### Backend Infrastructure (Planned)
- 🔜 **HIPAA-Compliant Cloud** - AWS infrastructure with full HIPAA compliance
- 🔜 **End-to-End Encryption** - KMS encryption for all data at rest and in transit
- 🔜 **Zero-Trust Security** - VPC isolation, WAF protection, security groups
- 🔜 **Audit Logging** - CloudTrail comprehensive activity tracking
- 🔜 **Encrypted Backups** - Cross-region automated backups with compliance locks
- 🔜 **Access Controls** - Role-based access with least-privilege permissions

📖 **Full Security Documentation**: [SECURITY.md](SECURITY.md)
🧪 **Security Testing**: [SECURITY_TESTING_GUIDE.md](SECURITY_TESTING_GUIDE.md)

---

## 📦 Installation

### Prerequisites
- Node.js 20+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)

### Steps

```bash
# 1. Clone or download the project
cd billsaver

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:3000
```

---

## 🧪 Testing

### Quick Test

1. Open [SAMPLE_MEDICAL_NOTE.md](SAMPLE_MEDICAL_NOTE.md)
2. Copy the sample text
3. Paste into Word/Google Docs
4. Export as PDF
5. Upload to BillSaver
6. Review the analysis results

### Comprehensive Testing

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for:
- Manual test cases
- Documentation quality testing
- Analysis engine testing
- UI/UX testing
- Performance testing
- Browser compatibility testing

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Other Platforms

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete guides on:
- Netlify
- AWS Amplify
- Docker
- Self-hosted (Nginx)

---

## 🎯 Use Cases

### For Healthcare Providers
- Audit documentation before billing
- Identify missing elements
- Optimize E/M coding levels
- Ensure HCC compliance
- Prevent revenue loss

### For Medical Coders
- Validate documentation completeness
- Identify upcoding opportunities
- Check MEAT criteria
- Verify diagnosis specificity

### For Practice Managers
- Quality assurance
- Revenue optimization
- Compliance monitoring
- Provider education

---

## 📊 What Gets Analyzed

### Documentation Elements (50+ Checks)
- Chief Complaint
- History of Present Illness (8 elements)
- Review of Systems (14 organ systems)
- Physical Examination (11+ body areas)
- Vital Signs
- Assessment & Diagnosis
- Treatment Plan
- Time Documentation
- MEAT Criteria (for HCC)
- Diagnosis Specificity

### Scoring System
- **90-100**: Excellent - Comprehensive documentation
- **75-89**: Good - Minor gaps
- **60-74**: Fair - Several gaps
- **40-59**: Poor - Significant gaps
- **0-39**: Critical - Major deficiencies

---

## 🔧 Development

### Available Commands

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check
```

### Project Structure

```
billsaver/
├── src/
│   ├── app/              # Next.js pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Main app
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── AnalysisResults.tsx
│   │   ├── UploadZone.tsx
│   │   ├── GlassCard.tsx
│   │   └── ParticleField.tsx
│   └── lib/              # Utilities
│       ├── billing-rules.ts   # Analysis engine
│       ├── pdf-parser.ts      # PDF processing
│       └── cn.ts              # Utilities
├── public/           # Static assets
└── [config files]    # TypeScript, Next.js, etc.
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code style guidelines
- Development workflow
- Pull request process
- Bug report template
- Feature request template

---

## 📖 Additional Resources

### Documentation
- [Setup Guide](SETUP_GUIDE.md) - Detailed setup instructions
- [Architecture](ARCHITECTURE.md) - System design and patterns
- [API Reference](API_REFERENCE.md) - Complete API documentation
- [Testing Guide](TESTING_GUIDE.md) - Comprehensive testing procedures

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [CMS E/M Guidelines](https://www.cms.gov/outreach-and-education/medicare-learning-network-mln/mlnproducts/evaluation-management-services)

---

## 📝 Version History

See [CHANGELOG.md](CHANGELOG.md) for version history and roadmap.

### Version History
- **v1.6.0** (2026-01-09) - Enhanced Loading States & Progress
- **v1.5.0** (2026-01-08) - Revenue Calculation Accuracy & Investor-Ready Enhancements
- **v1.4.0** (2026-01-07) - Modular Extraction Engine & CPT Intelligences

---

## 🐛 Troubleshooting

### Common Issues

**Build errors?**
```bash
rm -rf node_modules .next
npm install
npm run build
```

**PDF not parsing?**
- Ensure PDF is text-based (not scanned image)
- Check browser console for errors
- Try a different PDF

**Port 3000 in use?**
```bash
npm run dev -- -p 3001
```

See [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting) for more solutions.

---

## 📄 License

This project is for educational and internal use. Ensure compliance with healthcare regulations (HIPAA, etc.) before deploying in production environments.

---

## 🎉 Status

✅ **v1.6.0 - Enhanced Loading States & Progress**  
✅ **Intelligent 7-Stage Progress Tracking**  
✅ **Educational Loading Tips (10 rotating tips)**  
✅ **Professional Error Handling (5 error types)**  
✅ **Skeleton Screens with Shimmer Effects**  
✅ **Smooth Animations & Transitions**  
✅ **HIPAA-Compliant with Zero PHI Persistence**  
✅ **Multi-Payer Revenue Comparison**  
✅ **Production Ready**  
✅ **All Tests Passing**  
✅ **TypeScript Strict Mode**  
✅ **Zero Build Errors**

---

## 🚀 Next Steps

1. **Try it locally**: `npm run dev`
2. **Test with sample**: Use [SAMPLE_MEDICAL_NOTE.md](SAMPLE_MEDICAL_NOTE.md)
3. **Deploy**: Follow [DEPLOYMENT.md](DEPLOYMENT.md)
4. **Customize**: See [SETUP_GUIDE.md](SETUP_GUIDE.md#customization)
5. **Contribute**: Read [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📞 Support

- 📖 Check the documentation first
- 🐛 Report bugs via issues
- 💡 Request features via issues
- 🤝 Contribute via pull requests

---

**Built with ❤️ for healthcare providers**

*Stop leaving money on the table. Optimize your documentation today.*

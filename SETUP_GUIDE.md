# BillSaver - Complete Setup Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Installation Steps

```bash
# 1. Navigate to project directory
cd billsaver

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:3000
```

That's it! The application should now be running.

---

## 📁 Project Structure

```
billsaver/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout with fonts
│   │   ├── page.tsx           # Main application page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── AnalysisResults.tsx    # Results dashboard
│   │   ├── UploadZone.tsx         # File upload interface
│   │   ├── GlassCard.tsx          # Reusable glass card
│   │   └── ParticleField.tsx      # Particle animations
│   └── lib/                   # Utility functions
│       ├── billing-rules.ts   # Analysis engine (675 lines)
│       ├── pdf-parser.ts      # PDF text extraction
│       └── cn.ts              # Tailwind utility
├── public/                    # Static assets
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── next.config.ts            # Next.js config
└── postcss.config.mjs        # PostCSS config
```

---

## 🧪 Testing the Application

### Option 1: Use the Provided Sample Note

A sample medical note is available in `note_WITH_PHI.pdf` in the parent directory. You can:

1. Drag and drop it onto the upload zone
2. Or click the upload zone and select it

### Option 2: Create Your Own Test PDF

1. Open any word processor (Word, Google Docs, etc.)
2. Copy this sample text:

```
Chief Complaint: Follow-up for diabetes mellitus type 2 and hypertension

History of Present Illness:
Patient reports blood sugars well controlled over past 3 months.
Location: No specific pain. Quality: Feeling well overall.
Severity: Minimal symptoms. Duration: 3 months of good control.
Timing: Daily glucose monitoring. Context: Taking medications as prescribed.
Modifying factors: Diet and exercise improved. 
Associated symptoms: Denies polyuria, polydipsia, blurred vision.

Review of Systems:
Constitutional: Denies fever, chills, weight loss
Cardiovascular: Denies chest pain, palpitations, edema
Respiratory: Denies cough, shortness of breath
GI: Denies nausea, vomiting, abdominal pain
GU: Denies dysuria, frequency
Musculoskeletal: Denies joint pain
Neurological: Denies headache, dizziness
Psychiatric: Mood stable
Endocrine: As per HPI
Skin: No rash

Physical Exam:
Vital Signs: BP 128/76, HR 72, RR 16, Temp 98.6F, O2 Sat 98% RA
General: Well-developed, well-nourished, no acute distress
HEENT: Normocephalic, PERRLA, oropharynx clear
Neck: Supple, no lymphadenopathy
Cardiovascular: RRR, no murmurs
Lungs: Clear to auscultation bilaterally
Abdomen: Soft, non-tender, non-distended
Extremities: No edema, pulses 2+ bilaterally
Neurological: Alert and oriented x3, CN II-XII intact

Assessment:
1. Diabetes mellitus type 2 - well controlled (E11.9)
2. Essential hypertension - controlled (I10)

Plan:
1. Continue metformin 1000mg BID
2. Continue lisinopril 10mg daily
3. Recheck HbA1c in 3 months
4. Continue home glucose monitoring
5. Follow up in 3 months
```

3. Save as PDF
4. Upload to BillSaver

### What to Expect

The application will:
1. **Parse the PDF** - Extract text from the document
2. **Analyze Documentation** - Check 50+ criteria
3. **Display Results** - Show:
   - Overall documentation score (0-100)
   - Documentation quality level
   - Current vs. potential E/M level
   - Revenue impact analysis
   - Detailed gaps with recommendations
   - Documentation strengths

---

## 🔧 Development Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

---

## 🎨 Customization

### Changing Colors

Edit `src/app/page.tsx` to modify the gradient colors:

```typescript
// Line 87-93: Base gradient
<div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f]" />

// Line 93: Indigo orb
background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",

// Line 109: Purple orb
background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",

// Line 125: Cyan orb
background: "radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)",
```

### Adjusting Particle Count

In `src/app/page.tsx`, line 160:
```typescript
<ParticleField particleCount={30} /> // Change number for more/fewer particles
```

### Modifying Analysis Rules

Edit `src/lib/billing-rules.ts` to:
- Add new documentation checks
- Modify scoring weights
- Update E/M level criteria
- Add custom HCC conditions

---

## 🏥 Understanding the Analysis

### Documentation Score Breakdown

- **90-100**: Excellent - Comprehensive documentation
- **75-89**: Good - Minor gaps, mostly complete
- **60-74**: Fair - Several gaps, needs improvement
- **40-59**: Poor - Significant gaps, revenue at risk
- **0-39**: Critical - Major deficiencies

### E/M Levels (Office Visits)

- **99211**: Minimal problem, straightforward
- **99212**: Self-limited problem, straightforward MDM
- **99213**: Low complexity MDM, 20-29 minutes
- **99214**: Moderate complexity MDM, 30-39 minutes
- **99215**: High complexity MDM, 40+ minutes

### MEAT Criteria (HCC Coding)

For chronic conditions to count toward HCC risk adjustment:
- **M**onitored - Condition is being tracked
- **E**valuated - Tests/assessments performed
- **A**ddressed - Discussed with patient
- **T**reated - Active treatment provided

---

## 🔒 Security & Privacy

### Data Handling
- **100% Client-Side Processing** - No data sent to servers
- **No Data Storage** - Files processed in browser memory only
- **No Tracking** - No analytics or user tracking
- **HIPAA Considerations** - Suitable for PHI when used locally

### Best Practices
1. Use on secure, encrypted devices
2. Don't upload to public instances
3. Clear browser cache after use with sensitive data
4. Consider running locally only (not deployed publicly)

---

## 🐛 Troubleshooting

### Build Errors

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

**TypeScript errors**
```bash
# Check TypeScript compilation
npx tsc --noEmit
```

### Runtime Errors

**PDF not parsing**
- Ensure PDF is text-based (not scanned image)
- Check browser console for errors
- Try a different PDF

**Slow performance**
- Reduce particle count in `page.tsx`
- Disable animations in `framer-motion` components
- Check browser performance tools

### Development Server Issues

**Port 3000 already in use**
```bash
# Use different port
npm run dev -- -p 3001
```

**Hot reload not working**
- Restart dev server
- Clear `.next` folder
- Check file watcher limits (Linux/Mac)

---

## 📊 Performance Optimization

### Production Build
```bash
npm run build
npm start
```

### Optimization Tips
1. **Image Optimization** - Use Next.js Image component for any images
2. **Code Splitting** - Already handled by Next.js
3. **Bundle Analysis**:
   ```bash
   npm install -D @next/bundle-analyzer
   # Add to next.config.ts
   ```

---

## 🚢 Deployment

### Frontend Deployment

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Other Platforms
- **Netlify**: Connect Git repo, auto-deploy
- **AWS Amplify**: Connect Git repo, configure build
- **Docker**: See `DEPLOYMENT.md` for Dockerfile

### Backend Infrastructure Deployment (Phase 3)

#### Prerequisites
- **AWS Account** with appropriate permissions
- **Terraform 1.5.0+** - [Download](https://www.terraform.io/downloads)
- **AWS CLI** configured - [Setup Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

#### Infrastructure Setup
```bash
# 1. Navigate to infrastructure directory
cd infrastructure/terraform

# 2. Initialize Terraform
terraform init

# 3. Plan development deployment
terraform workspace select dev || terraform workspace new dev
terraform plan -var-file=dev.tfvars

# 4. Deploy to development
terraform apply -var-file=dev.tfvars

# 5. For production
terraform workspace select prod || terraform workspace new prod
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

#### Infrastructure Components Deployed
- ✅ **VPC** with public/private subnets and NAT gateways
- ✅ **SSL Certificates** via ACM with DNS validation
- ✅ **PostgreSQL Database** with KMS encryption
- ✅ **ECS Fargate** for containerized backend services
- ✅ **Application Load Balancer** with SSL termination
- ✅ **WAF** for security protection
- ✅ **CloudWatch** monitoring and alerting
- ✅ **CloudTrail** audit logging
- ✅ **Automated Backups** with cross-region replication

#### Security Features
- ✅ HIPAA-compliant architecture
- ✅ End-to-end encryption (TLS 1.2+)
- ✅ KMS encryption for all data
- ✅ VPC isolation and security groups
- ✅ Multi-AZ deployment for high availability

See `infrastructure/README.md` for detailed infrastructure documentation.

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)

---

## 🤝 Support

For issues or questions:
1. Check this guide first
2. Review error messages in browser console
3. Check Next.js documentation
4. Verify all dependencies are installed

---

## 📝 License

This project is for educational and internal use. Ensure compliance with healthcare regulations (HIPAA, etc.) before deploying in production environments.

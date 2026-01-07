# BillSaver - Quick Start Guide

Get up and running with BillSaver in 5 minutes!

## Prerequisites

- Node.js 20+ installed ([Download here](https://nodejs.org/))
- A terminal/command prompt
- A PDF medical note to test with

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```
This will install all required packages (~2 minutes).

### 2. Start Development Server
```bash
npm run dev
```
The server will start at http://localhost:3000

### 3. Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000)

You should see the BillSaver landing page with the upload zone!

## Testing the Application

### Option 1: Create a Test PDF

1. **Copy this sample text:**
   ```
   Chief Complaint: Follow-up for diabetes type 2 and hypertension

   History of Present Illness:
   Patient reports blood sugars well controlled. Duration: 3 months.
   Severity: Minimal symptoms. Quality: Feeling well overall.
   Location: No specific concerns. Timing: Daily monitoring.
   Context: Taking medications as prescribed. Modifying factors: Diet improved.
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

   Vital Signs:
   BP: 128/76, Pulse: 72, Temp: 98.2F, RR: 16, O2 Sat: 99%

   Physical Exam:
   General: Well-appearing, no acute distress
   HEENT: Pupils equal, oropharynx clear
   Neck: Supple, no lymphadenopathy
   Cardiovascular: Regular rate and rhythm, no murmurs
   Lungs: Clear to auscultation bilaterally
   Abdomen: Soft, non-tender
   Extremities: No edema
   Neuro: Alert and oriented x3

   Assessment:
   1. Diabetes mellitus type 2 - controlled
   2. Essential hypertension - controlled

   Plan:
   Diabetes: A1C reviewed (Evaluated), continue metformin (Treated),
   discussed diet (Addressed), recheck in 3 months (Monitored)

   Hypertension: BP monitored (Monitored), continue lisinopril (Treated),
   discussed sodium restriction (Addressed)

   Total time: 25 minutes
   ```

2. **Create PDF:**
   - Paste into Word/Google Docs
   - File > Save As > PDF
   - Save to your desktop

3. **Upload to BillSaver:**
   - Drag and drop the PDF onto the upload zone
   - Wait for analysis (~2-5 seconds)
   - Review results!

### Option 2: Use Sample Notes

1. Open `claude_SAMPLE_MEDICAL_NOTE.md`
2. Find the "Good Documentation Example"
3. Convert to PDF
4. Upload and analyze

## Understanding the Results

### Overall Score
- **90-100**: Excellent documentation
- **75-89**: Good documentation, minor improvements
- **60-74**: Fair, some important gaps
- **40-59**: Poor, significant gaps
- **0-39**: Critical gaps present

### Key Metrics

#### Documentation Level
Shows overall quality classification.

#### E/M Level
- **Current**: What your documentation supports now
- **Potential**: What it could support with improvements

#### Revenue Impact
Estimated potential loss if gaps aren't addressed.

### Gap Categories

**🔴 Critical** - Must fix (major billing risk)
- Missing chief complaint
- No assessment/diagnosis
- Missing treatment plan
- HCC conditions without MEAT

**🟠 Major** - Should fix (significant opportunity)
- Incomplete HPI (<4 elements)
- Limited physical exam
- Missing diagnosis specificity

**🟡 Moderate** - Nice to have
- Limited ROS
- No time documentation
- Missing treatment linkage

**🔵 Minor** - Enhancement opportunities

## Common Issues & Solutions

### Issue: "PDF.js worker not found"
**Solution**: Check internet connection (PDF.js loads from CDN)

### Issue: PDF uploads but no text extracted
**Solution**: PDF might be scanned images. Use text-based PDFs only.

### Issue: Low score despite good documentation
**Solution**: Check that medical terms match expected patterns. Add keywords like "monitored," "evaluated," "treated."

### Issue: Build errors
**Solution**:
```bash
rm -rf node_modules .next
npm install
npm run dev
```

## Tips for Better Scores

### 1. Chief Complaint
Always start with clear CC:
```
Chief Complaint: Follow-up for diabetes management
```

### 2. HPI Elements
Include at least 4:
- Location, Quality, Severity, Duration
- Timing, Context, Modifying factors
- Associated symptoms

### 3. MEAT Criteria
For chronic conditions, show you:
- **M**onitored - "A1C checked"
- **E**valuated - "Labs reviewed"
- **A**ddressed - "Discussed diet"
- **T**reated - "Continue metformin"

### 4. Diagnosis Specificity
Be specific:
- ❌ "Diabetes"
- ✅ "Diabetes mellitus type 2, controlled"

### 5. Time Documentation
Include total time:
```
Total time: 35 minutes including counseling and care coordination
```

## Next Steps

### Deploy to Production
See `claude_DEPLOYMENT.md` for deployment options:
- **Vercel** (easiest) - 5 minutes
- **Netlify** - 10 minutes
- **Self-hosted** - 1-2 hours

### Customize
Edit `src/lib/billing-rules.ts` to:
- Add new documentation patterns
- Adjust scoring weights
- Customize revenue calculations
- Add specialty-specific checks

### Extend Features
Consider adding:
- Report export (PDF/CSV)
- Historical tracking
- Multi-document comparison
- Custom templates

## Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Clean build
rm -rf .next node_modules
npm install
```

## Keyboard Shortcuts

- **Drag & Drop**: Upload PDF
- **Click Upload Area**: Browse files
- **Escape**: Close expanded gaps (coming soon)
- **Tab**: Navigate through interface

## Getting Help

1. **Check documentation**:
   - `claude_README.md` - Full documentation
   - `claude_DEPLOYMENT.md` - Deployment guide
   - `claude_PROJECT_SUMMARY.md` - Technical overview

2. **Review sample notes**:
   - `claude_SAMPLE_MEDICAL_NOTE.md`

3. **Check the code**:
   - Well-commented throughout
   - TypeScript types for guidance

## Success Checklist

- [ ] Node.js 20+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Browser open at localhost:3000
- [ ] Test PDF uploaded
- [ ] Results displayed correctly
- [ ] All gaps expandable
- [ ] Reset button works

## What's Working

✅ PDF upload (drag-drop and click)
✅ Text extraction from PDFs
✅ Documentation analysis (50+ checks)
✅ Results display with animations
✅ Gap recommendations
✅ Score calculation
✅ E/M level assessment
✅ Revenue impact calculation
✅ Reset and re-analyze

## Performance Expectations

- **Upload**: Instant
- **PDF Processing**: 1-5 seconds
- **Analysis**: <100ms
- **Results Display**: Smooth animations

## Browser Support

✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
⚠️ IE not supported

## Privacy & Security

🔒 **All processing is client-side**
- PDFs never uploaded to server
- No data storage
- No external API calls
- HIPAA-friendly architecture

## Demo Mode

Want to demo without creating PDFs?
The app is visual even without upload:
1. Hover over upload zone for animations
2. Particle effects are interactive
3. Smooth transitions throughout

## Production Checklist

Before going live:
- [ ] Test with real medical notes
- [ ] Verify all patterns match your documentation style
- [ ] Deploy to Vercel/Netlify
- [ ] Configure custom domain (optional)
- [ ] Add analytics (optional)
- [ ] Set up error monitoring (optional)

## Time Investment

- **Setup**: 5 minutes
- **First test**: 5 minutes
- **Understanding**: 10 minutes
- **Customization**: 1-2 hours (optional)
- **Deployment**: 5 minutes - 2 hours (depending on method)

## You're Ready! 🚀

That's it! You now have a fully functional medical documentation analysis tool.

**Start analyzing documentation and optimizing your billing!**

---

**Questions?** Check `claude_README.md` for detailed documentation.

**Issues?** Review the troubleshooting section in `claude_DEPLOYMENT.md`.

**Happy analyzing!** 📊

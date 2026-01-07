# Contributing to BillSaver

Thank you for your interest in contributing to BillSaver! This document provides guidelines for contributing to the project.

---

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/billsaver.git
cd billsaver
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

---

## 📝 Development Guidelines

### Code Style

**TypeScript**:
- Use TypeScript for all new files
- Define interfaces for all props and data structures
- Avoid `any` type - use proper typing
- Use strict mode

**React**:
- Use functional components with hooks
- Use `useCallback` for event handlers
- Use `useMemo` for expensive calculations
- Keep components focused and small

**Naming Conventions**:
- Components: PascalCase (`UploadZone.tsx`)
- Files: kebab-case for utilities (`pdf-parser.ts`)
- Functions: camelCase (`handleFileSelect`)
- Constants: UPPER_SNAKE_CASE (`EM_LEVELS`)

**File Organization**:
```
src/
├── app/          # Pages and layouts
├── components/   # Reusable UI components
└── lib/          # Utilities and business logic
```

---

## 🎨 UI/UX Guidelines

### Design Principles

1. **Glassmorphism**: Use `GlassCard` component for consistency
2. **Animations**: Smooth, purposeful, not distracting
3. **Accessibility**: Keyboard navigation, screen reader support
4. **Responsive**: Mobile-first approach
5. **Performance**: 60fps animations, fast load times

### Color Usage

```typescript
// Severity colors (consistent across app)
critical: red-500
major: orange-500
moderate: yellow-500
minor: blue-500
success: emerald-500

// Brand colors
primary: indigo-500
secondary: purple-600
accent: cyan-400
```

---

## 🧪 Testing Requirements

### Before Submitting PR

- [ ] Code builds without errors (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Tested on mobile viewport
- [ ] All animations smooth (60fps)
- [ ] No console errors or warnings

### Manual Testing

1. Test upload flow with various PDFs
2. Verify analysis results are accurate
3. Check responsive design on multiple screen sizes
4. Test all interactive elements (buttons, cards, etc.)

---

## 📋 Pull Request Process

### 1. Commit Messages

Use conventional commits format:

```bash
feat: add export to PDF functionality
fix: resolve particle field memory leak
docs: update README with new features
style: improve glassmorphism effects
refactor: extract analysis logic to separate module
test: add unit tests for billing rules
chore: update dependencies
```

### 2. PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Tested in multiple browsers
- [ ] Tested responsive design
- [ ] No console errors

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
```

### 3. Review Process

1. Submit PR with clear description
2. Wait for automated checks (if configured)
3. Address review comments
4. Squash commits if requested
5. Merge when approved

---

## 🐛 Bug Reports

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 20.10.0]

**Additional context**
Any other relevant information.
```

---

## ✨ Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other context, mockups, or examples.
```

---

## 🏗️ Architecture Decisions

### When Adding New Features

1. **Consider Impact**: Will this affect existing functionality?
2. **Maintain Patterns**: Follow existing code patterns
3. **Type Safety**: Add proper TypeScript types
4. **Documentation**: Update relevant docs
5. **Testing**: Add tests for new functionality

### Adding New Analysis Rules

Location: `src/lib/billing-rules.ts`

```typescript
// 1. Add pattern to DOCUMENTATION_CHECKS
newCheck: {
  patterns: [/pattern1/i, /pattern2/i],
  required: true,
  category: 'major' as const,
},

// 2. Add check in analyzeDocument function
const newCheckFound = DOCUMENTATION_CHECKS.newCheck.patterns.some(
  p => text.match(p)
);

// 3. Add to scoring
if (newCheckFound) score += 5;

// 4. Add gap if missing
if (!newCheckFound) {
  gaps.push({
    id: 'new-check',
    category: 'major',
    title: 'Missing New Check',
    description: '...',
    impact: '...',
    recommendation: '...',
    potentialRevenueLoss: '$X-Y',
  });
}
```

---

## 🎯 Priority Areas for Contribution

### High Priority

1. **Unit Tests**: Add Jest tests for `billing-rules.ts`
2. **E2E Tests**: Add Playwright tests for user flows
3. **Export Feature**: Add PDF export for results
4. **History Feature**: Save analysis history
5. **Batch Processing**: Analyze multiple files

### Medium Priority

1. **AI Suggestions**: Integrate GPT-4 for improvement suggestions
2. **Comparison View**: Compare multiple documents
3. **Templates**: Pre-built documentation templates
4. **Print View**: Printer-friendly results page

### Low Priority

1. **Dark/Light Mode Toggle**: Currently dark only
2. **Custom Themes**: User-selectable color schemes
3. **Keyboard Shortcuts**: Power user features
4. **Accessibility Improvements**: WCAG AAA compliance

---

## 📖 Resources for Contributors

### Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)

### Medical Billing Resources

- [CMS E/M Guidelines](https://www.cms.gov/outreach-and-education/medicare-learning-network-mln/mlnproducts/evaluation-management-services)
- [HCC Coding Guide](https://www.cms.gov/medicare/health-plans/medicareadvtgspecratestats/risk-adjustors)
- [CPT Code Reference](https://www.aapc.com/codes/cpt-codes-range/)

---

## 🤝 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions
- Prioritize patient privacy and security

### Unacceptable Behavior

- Harassment or discrimination
- Sharing PHI or sensitive data
- Malicious code or security vulnerabilities
- Spam or off-topic content

---

## 📞 Getting Help

### Questions?

1. Check existing documentation
2. Search closed issues
3. Ask in discussions
4. Create a new issue with `question` label

### Need Clarification?

- Open an issue with your question
- Tag it as `question` or `help wanted`
- Provide context and what you've tried

---

## 🎉 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to BillSaver!** 🙏

Your contributions help healthcare providers deliver better patient care and receive fair compensation for their work.

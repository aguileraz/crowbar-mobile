# Cline Guidelines

## 🔄 Context
- **Read `ai-docs/planning/PROJECT_PLAN.md`** first
- **Check `ai-docs/tasks/TASKS.md`** before tasks
- **Use Portuguese** for comments/docs
- **Follow PROJECT_PLAN.md patterns**

## 🧱 Code
- **Max 500 lines/file** - refactor if longer
- **Modular by feature/responsibility**
- **Clear imports** (relative within packages)

## 🧪 Testing
- **Unit tests for all features** (expected/edge/failure)
- **Update tests** when logic changes
- **Tests in `/tests`** mirroring app structure

## ✅ Tasks
- **Update `ai-docs/tasks/TASKS.md`** using SCRUM
- **Mark completed + commit** immediately
- **Add discoveries** to BACKLOG.md

## 📚 Docs
- **Update README.md** for features/deps/setup
- **Comment complex code** with `# Reason:`
- **Update `ai-docs/api/API.md`** for APIs

## 🧠 AI Rules
- **Edit in chunks** (avoid JSON issues)
- **Ask if uncertain**
- **Use verified packages only**
- **Confirm paths exist**
- **Never delete code** unless instructed
- **Update memories** in tool AND config

## 📋 Acceptance Criteria
- **ALWAYS consult `ai-docs/planning/ACCEPTANCE_CRITERIA.md`**
- **Check Definition of Done**
- **Use templates** for new features
- **Validate functional/performance/security/usability**

### Apply For:
🟢 **ALWAYS:** Features, APIs, UIs, integrations, security
🟡 **CONSIDER:** Refactoring, complex bugs
🔴 **SKIP:** Simple bugs, docs, configs

### Standards:
- **Coverage:** >80%
- **Performance:** Monitor SLAs
- **Security:** Zero critical vulns

### Validation:
```bash
./scripts/test/run_all_tests.sh
./scripts/test/code_quality_check.sh
```

### Checklist:
- [ ] Criteria met
- [ ] Tests pass
- [ ] Docs updated
- [ ] Deploy configured

## 🎯 Flow:
READ → PLAN → DEVELOP → TEST → VALIDATE → DOCUMENT → DEPLOY

## 🧠 AI Behavior Rules

- **Always create or update files with smaller chunks to avoid JSON parsing issues**
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified Laravel packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `ai-docs/tasks/TASKS.md`.
- **For any step completed from `ai-docs/tasks/TASKS.md`, make a git commit.

## 📝 Markdown & Linting Best Practices

### Markdown Structure
- Use consistent heading levels (H1-H6)
- Use proper list formatting (bullets and numbers)
- Use code blocks with proper language tags
- Add descriptive alt text to images
- Use proper table formatting
- Avoid inline styling
- Use proper emphasis (bold, italic)
- Add proper spacing between elements

### Code Block Formatting
- Use proper language tags
- Add line numbers when needed
- Use proper indentation
- Add descriptive captions
- Keep lines under 80 characters

### Documentation Rules
- Update documentation with every code change
- Keep examples up to date
- Document all public APIs
- Add proper error handling documentation
- Document configuration options
- Add proper changelog entries

### Linting Rules
- Run markdown linter before commits
- Fix all linting errors
- Use consistent formatting
- Follow style guide rules
- Add proper line endings
- Use proper character encoding
- Add proper metadata
- Validate all links

### Best Practices
- Use semantic headings
- Add proper metadata
- Use proper image optimization
- Add proper alt text
- Use proper table formatting
- Add proper code block formatting
- Use proper list formatting
- Add proper spacing
- Use proper emphasis
- Add proper links
- Use proper cross-references
- Add proper footnotes
- Use proper citations
- Add proper glossary terms
- Use proper abbreviations
- Add proper acronyms
- Use proper symbols
- Add proper emojis
- Use proper icons
- Add proper labels
- Add proper tags
- Add proper categories
- Add proper keywords
- Add proper search terms
- Add proper SEO metadata
- Add proper analytics tracking
- Add proper accessibility features
- Use proper internationalization
- Use proper localization
- Add proper translations
- Use proper versioning
- Add proper changelog entries
- Use proper release notes
- Add proper upgrade guides
- Use proper migration guides
- Add proper deprecation notices
- Use proper security notices
- Add proper troubleshooting guides
- Add proper FAQ entries
- Add proper how-to guides
- Add proper tutorials
- Add proper examples
- Add proper best practices
- Add proper gotchas
- Add proper tips
- Add proper tricks
- Add proper warnings
- Add proper errors
- Add proper exceptions
- Add proper debugging guides
- Add proper logging guides
- Add proper monitoring guides
- Add proper performance guides
- Add proper scalability guides
- Add proper security guides
- Add proper maintenance guides
- Add proper backup guides
- Add proper recovery guides
- Add proper disaster recovery guides
- Add proper business continuity guides
- Add proper compliance guides
- Add proper legal guides
- Add proper privacy guides
- Add proper data protection guides
- Add proper GDPR guides
- Add proper CCPA guides
- Add proper PII guides
- Add proper PHI guides
- Add proper PCI DSS guides
- Add proper SOC 2 guides
- Add proper ISO 27001 guides
- Add proper NIST guides
- Add proper OWASP guides
- Add proper SANS guides
- Add proper CIS guides

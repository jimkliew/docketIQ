# DocketIQ Documentation

Welcome to the DocketIQ documentation. This directory contains comprehensive guides for understanding, using, and extending the system.

## 📚 Table of Contents

### Architecture
Deep-dive technical documentation on system design and implementation.

- **[Agent System](architecture/AGENT_CARDS.md)** - Complete documentation of all 15 AI agents with metadata, capabilities, and limitations
- **[Transparency System](architecture/TRANSPARENCY_SYSTEM.md)** - How the audit trail, agent panels, and architecture view work
- **[Simplified Flow](architecture/SIMPLIFIED_FLOW.md)** - The 3-step workflow design and user journey

### Guides
Step-by-step guides for users and developers.

- **[Real Data Integration](guides/REAL_DATA_INTEGRATION.md)** - How to connect to Regulations.gov API and work with live dockets

### Changelog
Version history and release notes.

- **[Recent Changes](changelog/CHANGES.md)** - Latest session updates (March 14, 2026)
- **[Complete History](changelog/FINAL_SUMMARY.md)** - Full development history from initial build

## 🔗 Quick Links

- **[Main README](../README.md)** - Project overview and quick start
- **[Run Tests](../unit_root_test/)** - Unit test suite (22 tests)
- **[Source Code](../src/)** - All application code

## 📖 Documentation Standards

All documentation follows these principles:

1. **Progressive Disclosure** - Start simple, add depth as needed
2. **Code Examples** - Real, working code snippets
3. **Visual Aids** - Diagrams, flowcharts, and screenshots where helpful
4. **Audience Targeting** - Clear about who each doc is for
5. **Keep Updated** - Docs evolve with the codebase

## 🤝 Contributing to Docs

Found a typo? Want to improve an explanation? Docs PRs are welcome!

```bash
# Edit a doc file
vim docs/guides/REAL_DATA_INTEGRATION.md

# Commit and push
git add docs/
git commit -m "docs: improve API integration guide"
git push
```

---

**Last Updated:** March 14, 2026

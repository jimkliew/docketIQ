# DocketIQ

**AI-powered public comment intelligence for federal rulemaking**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-22%2F22-brightgreen)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()

DocketIQ is a transparent, auditable multi-agent system that analyzes public comments from federal rulemakings. It demonstrates how AI agents can help analysts review thousands of comments while maintaining full transparency, traceability, and human oversight.

**Live Demo:** [Coming Soon]
**Status:** Active Development

---

## 🎯 What is DocketIQ?

When federal agencies propose new regulations, they collect public comments through [Regulations.gov](https://regulations.gov). For major rules, agencies receive thousands—sometimes hundreds of thousands—of comments from individuals, organizations, businesses, and advocacy groups.

**The Challenge:** Analysts must review every comment, identify substantive issues, detect duplicate campaigns, extract arguments with evidence, and draft defensible summaries—all while maintaining legal traceability.

**The Solution:** DocketIQ uses 16 specialized AI agents to:
- Fetch live dockets from Regulations.gov
- Normalize and deduplicate comments
- Detect organized campaigns
- Classify topics and extract arguments
- Score sentiment and authority
- Generate source-linked summaries
- Translate regulatory text to plain language
- **Maintain full transparency and audit trails**

---

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/docketiq.git
cd docketiq

# 2. (Optional) Configure API keys
cp .env.example .env
# Edit .env with your Regulations.gov API key

# 3. Start local server
python3 -m http.server 8000

# 4. Open in browser
open http://localhost:8000

# 5. (Optional) Run tests
node unit_root_test/runner.mjs
```

**That's it!** The app runs entirely in your browser—no backend servers, no database setup, no dependencies to install.

---

## ✨ Key Features

### 🔍 **Full Transparency**
- **[Agent Cards](/agents.html)** - Dedicated page showing all 16 agents with their exact prompts, capabilities, and limitations
- **[Architecture View](/architecture.html)** - Complete system architecture with data flow diagrams and agent interactions
- **Audit Trail** - Every action logged with 3 depth levels (Summary → Details → Full JSON)
- **Export Everything** - Download complete audit logs for external review

### 🎨 **Color-Coded Agent Types**
- 🟣 **Extract** (4 agents) - Fetch data from Regulations.gov API
- 🔵 **Enrich** (6 agents) - Normalize, classify, cluster, and analyze comments
- 🟢 **Score** (3 agents) - Calculate sentiment, authority, and detect fraud
- 🟠 **Action** (3 agents) - Generate summaries, translate to plain language, and create visualizations

### 📊 **3-Step Workflow**
1. **Pick a Docket** - Select from sample dockets (1 simulated, 2 real)
2. **Docket Snapshot** - View metadata, documents, and sample comments
3. **Analysis & Insights** - AI-powered topic clustering, sentiment scoring, campaign detection

### 🔗 **Real Data Integration**
- Live API integration with Regulations.gov
- Attachment metadata support (PDFs, DOCX)
- Simulated data for testing and demos
- Clear indicators: 🔵 Simulated | 🟢 Real Data

---

## 📚 Documentation

### **Getting Started**
- **[Quick Start](#-quick-start)** - Get running in 2 minutes
- **[Installation](docs/guides/REAL_DATA_INTEGRATION.md)** - Detailed setup with API configuration

### **Architecture**
- **[Live Architecture View](/architecture.html)** - Interactive system architecture page
- **[Live Agent Cards](/agents.html)** - All 16 agents with full details
- **[System Overview](docs/architecture/SIMPLIFIED_FLOW.md)** - 3-step workflow design
- **[Agent System](docs/architecture/AGENT_CARDS.md)** - Agent metadata and specifications
- **[Transparency System](docs/architecture/TRANSPARENCY_SYSTEM.md)** - Audit, traceability, and progressive disclosure

### **Development**
- **[Testing](#-testing)** - Run unit tests (22/22 passing)
- **[Contributing](#-contributing)** - How to extend and customize
- **[Project Structure](#-project-structure)** - File organization

### **Changelog**
- **[Recent Changes](docs/changelog/CHANGES.md)** - Latest session updates
- **[Complete History](docs/changelog/FINAL_SUMMARY.md)** - Full development history

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  User Interface (Browser)                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ 🤖 Agents   │  │ 📊 Arch     │  │ 📋 Audit    │        │
│  │   Panel     │  │   Panel     │  │   Trail     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Step 1: Pick Docket                                   │ │
│  │ • Sample dockets (EPA, FAA, FMCSA)                   │ │
│  │ • Data type indicators (🔵 Simulated / 🟢 Real)      │ │
│  └───────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Step 2: Docket Snapshot                               │ │
│  │ • Metadata, documents, sample comments                │ │
│  │ • Agents: docket-fetcher, document-fetcher, etc.     │ │
│  └───────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Step 3: Analysis & Insights                           │ │
│  │ • Topic clustering, sentiment scoring                 │ │
│  │ • Campaign detection, stakeholder breakdown          │ │
│  │ • 10 agents working together                          │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
           ↓ All actions logged ↓
    ┌──────────────────────────────┐
    │   Audit Logger (audit.mjs)   │
    │   • Session tracking          │
    │   • Event logging             │
    │   • JSON export               │
    └──────────────────────────────┘
```

---

## 📁 Project Structure

```
docketiq/
├── index.html              # Main application entry point
├── agents.html             # Dedicated page showing all 16 agent cards
├── architecture.html       # System architecture visualization
├── src/
│   ├── app.mjs            # Main application logic
│   ├── agents.mjs         # 16 agent definitions with full metadata
│   ├── audit.mjs          # Comprehensive audit logging system
│   ├── pipeline.mjs       # Multi-stage comment processing pipeline
│   ├── config.mjs         # Configuration loader
│   ├── data.mjs           # Sample dockets + synthetic data
│   ├── attachments.mjs    # Attachment handling
│   └── styles.css         # All styles including agent cards
│
├── docs/
│   ├── architecture/      # System design docs
│   │   ├── AGENT_CARDS.md
│   │   ├── TRANSPARENCY_SYSTEM.md
│   │   └── SIMPLIFIED_FLOW.md
│   ├── guides/            # User guides
│   │   └── REAL_DATA_INTEGRATION.md
│   └── changelog/         # Version history
│       ├── CHANGES.md
│       └── FINAL_SUMMARY.md
│
├── unit_root_test/        # Test suite (22 tests)
│   ├── runner.mjs         # Test harness
│   ├── test_data.mjs      # Data module tests
│   ├── test_agents.mjs    # Agent system tests
│   └── test_config.mjs    # Config tests
│
├── .env.example           # Environment template
├── .gitignore
└── README.md              # You are here
```

---

## 🧪 Testing

DocketIQ includes a comprehensive test suite covering data structures, agent metadata, and configuration.

```bash
# Run all tests
node unit_root_test/runner.mjs

# Expected output:
# ✅ 22/22 tests passing (100% success rate)
#
# Data Module: 8/8 ✓
# Agent System: 10/10 ✓
# Configuration: 4/4 ✓
```

**Test Coverage:**
- ✅ Sample dockets structure (simulated + real)
- ✅ Agent registry completeness (15 agents)
- ✅ Agent metadata validation (prompts, skills, I/O schemas)
- ✅ Configuration defaults
- ✅ Data generation (3,040 synthetic comments)

---

## 🔧 Configuration

DocketIQ works out-of-the-box with demo data. For live Regulations.gov integration:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Get your API key
# Visit: https://open.gsa.gov/api/regulationsgov/

# 3. Edit .env
REGULATIONS_GOV_API_KEY=your_key_here
OPENAI_API_KEY=optional_for_agent_runs
OPENAI_MODEL=gpt-4
```

**Security:** `.env` files are gitignored. Never commit API keys to version control.

---

## 🚀 Sample Dockets

DocketIQ includes 3 curated dockets:

| Docket ID | Agency | Title | Data Type | Comments |
|-----------|--------|-------|-----------|----------|
| **EPA-HQ-OW-2022-0801** | EPA | Lead and Copper Rule Improvements | 🔵 Simulated | 2,110 synthetic |
| **FAA-2026-2295** | FAA | Boeing 787 Airworthiness Directives | 🟢 Real | Live from API |
| **FMCSA-2014-0215** | FMCSA | Driver Exemptions - Epilepsy | 🟢 Real | Live from API |

**Why simulated data?**
- Demonstrates full analysis pipeline with known ground truth
- No rate limits or API quotas
- Reproducible for testing and demos
- Aligned to real EPA docket structure

**Real data benefits:**
- Shows actual Regulations.gov integration
- Tests API error handling
- Validates attachment parsing
- Production-ready code paths

---

## 🎯 Use Cases

### **For Federal Agencies**
- Triage large comment volumes (10k+ comments)
- Detect duplicate campaigns automatically
- Extract substantive arguments with evidence
- Generate topic-based summaries
- Maintain defensible audit trails

### **For Advocacy Groups**
- Analyze stakeholder positions
- Identify common themes across commenters
- Track sentiment by organization type
- Export data for reports

### **For Researchers**
- Study public participation patterns
- Analyze campaign effectiveness
- Understand agency-public communication
- Access complete audit data

### **For Developers**
- Learn multi-agent system architecture
- See progressive disclosure UX patterns
- Study transparent AI design
- Fork and customize for other domains

---

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation:

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feature/amazing-feature

# 3. Make your changes
# 4. Run tests
node unit_root_test/runner.mjs

# 5. Commit with descriptive message
git commit -m "Add amazing feature"

# 6. Push and create PR
git push origin feature/amazing-feature
```

**Contribution Areas:**
- 🐛 Bug fixes and error handling
- 🎨 UI/UX improvements
- 🧪 Additional test coverage
- 📚 Documentation and examples
- 🔌 New agent types
- 🌐 Internationalization

---

## 📋 Roadmap

### **Q2 2026**
- [ ] Expand test coverage to integration tests
- [ ] Add more real docket examples
- [ ] Implement PDF text extraction
- [ ] Create Docker deployment option

### **Q3 2026**
- [ ] Build comment submission tracking
- [ ] Add historical docket comparison
- [ ] Implement batch processing mode
- [ ] Create REST API wrapper

### **Future**
- Advanced NLP features (entity linking, coreference)
- Multi-language support
- Real-time collaboration features
- Export to regulatory reporting formats

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

**Data Source:** [Regulations.gov](https://regulations.gov) - The federal government's portal for public comment

**APIs Used:**
- [Regulations.gov API v4](https://open.gsa.gov/api/regulationsgov/)
- [Federal Register API](https://www.federalregister.gov/developers/documentation/api/v1)

**Inspiration:** This project was built to demonstrate transparent AI design principles in civic technology.

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/your-org/docketiq/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/docketiq/discussions)
- **Email:** support@docketiq.example.com

---

## 🌟 Star History

If you find DocketIQ useful, please consider starring the repository to help others discover it!

---

**Built with transparency by Team HAL** | Powered by 12 specialized AI agents

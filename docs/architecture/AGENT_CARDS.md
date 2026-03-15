# Comprehensive Agent Card System

## Overview

Each agent in DocketIQ now has its own **detailed card** showing everything about the agent: system prompt, data input/output, tools, capabilities, limitations, and more. Cards are **color-coded by agent type** for easy visual recognition.

## 🎨 Color-Coded Agent Types

| Color | Type | Hex | Agents |
|-------|------|-----|--------|
| 🟣 Purple | **Data Extraction** | `#8b5cf6` | docket-fetcher, document-fetcher, comment-fetcher, attachment-processor |
| 🔵 Indigo | **Data Enrichment** | `#6366f1` | comment-normalizer, duplicate-detector, topic-classifier, argument-extractor, graph-builder |
| 🔷 Blue | **Display** | `#3b82f6` | display-formatter |
| 🟢 Green | **Scoring** | `#10b981` | authority-scorer, sentiment-scorer |
| 🟠 Orange | **Actionable Insights** | `#f97316` | summary-generator, topic-view-builder, llm-summarizer |

---

## 📦 Components Created

### 1. Agent Card Module ([src/agent-cards.mjs](src/agent-cards.mjs))

**Functions:**
- `renderAgentCard(agentId, options)` - Render single agent card
- `renderAgentGallery(options)` - Render all agents in grid
- `renderAgentsByType(options)` - Render agents grouped by type

**Features:**
- Expandable/collapsible cards
- Active indicator for running agents
- Comprehensive details in expanded view
- Click-to-navigate between related agents

### 2. Agent Card Styles ([src/agent-cards.css](src/agent-cards.css))

**Features:**
- Color-coded borders and accents
- Responsive grid layout
- Smooth animations
- Hover effects
- Mobile-friendly

---

## 📋 Agent Card Sections

Each expanded card shows:

### 1. **Model & Type**
- Model name (e.g., "MinHash + Jaccard Similarity")
- Agent type with color badge
- Type description

### 2. **System Prompt**
- Exact instruction given to agent
- Highlighted in code box
- Explanatory note

### 3. **Data Input**
- Parameter table (name, type, description)
- Example input (expandable JSON)
- Schema visualization

### 4. **Data Output**
- Output field table
- Example output (expandable JSON)
- Return value schema

### 5. **Skills & Capabilities**
- ✓ What this agent CAN do (green checkmarks)
- ✗ What this agent CANNOT do (red crosses)
- Comprehensive list of limitations

### 6. **Tools & Dependencies**
- Color-coded tool chips
- Icons for common tools
- Hover to highlight

### 7. **Agent Relationships**
- Who can call this agent
- Who this agent can call
- Click to jump to related agent

### 8. **Audit Points**
- List of logged data points
- Link to view audit trail
- Traceability information

### 9. **Performance Metrics** (optional)
- Real-time stats from audit logs
- Execution count, duration, success rate
- Displayed when available

---

## 🚀 Usage Examples

### Example 1: Single Agent Card

```javascript
import { renderAgentCard } from "./agent-cards.mjs";

// Collapsed card
const html = renderAgentCard("duplicate-detector");

// Expanded card with active indicator
const htmlExpanded = renderAgentCard("duplicate-detector", {
  expanded: true,
  showActiveIndicator: true,
});
```

### Example 2: Agent Gallery (All Agents)

```javascript
import { renderAgentGallery } from "./agent-cards.mjs";

// Show all agents with some expanded
const html = renderAgentGallery({
  activeAgentIds: ["comment-fetcher", "duplicate-detector"],
  expandedAgentId: "duplicate-detector",
});
```

### Example 3: Grouped by Type

```javascript
import { renderAgentsByType } from "./agent-cards.mjs";

// Show agents grouped by type (Extract, Enrich, etc.)
const html = renderAgentsByType({
  activeAgentIds: getActiveAgentsForStep(currentStep),
  expandedAgentId: state.selectedAgentId,
});
```

---

## 🎯 Integration into DocketIQ

### Step 1: Import Modules

In `src/app.mjs`:

```javascript
import { renderAgentCard, renderAgentGallery, renderAgentsByType } from "./agent-cards.mjs";
```

### Step 2: Add CSS

In `index.html`:

```html
<link rel="stylesheet" href="./src/agent-cards.css" />
```

### Step 3: Add to UI

**Option A: Agents Tab in Step 3**

```javascript
function renderAgentsTab() {
  const activeAgents = getActiveAgentsForStep(state.step);

  return `
    <div class="agents-tab-content">
      <h2>AI Agents Powering This Analysis</h2>
      <p>These agents are working together to analyze your docket comments.</p>

      ${renderAgentsByType({
        activeAgentIds: activeAgents,
        expandedAgentId: state.expandedAgentId,
      })}
    </div>
  `;
}
```

**Option B: Transparency Panel**

```javascript
function renderAgentsPanel() {
  return `
    <div class="transparency-panel">
      <div class="panel-header">
        <h2>🤖 All DocketIQ Agents</h2>
        <button data-action="close-agents">✕</button>
      </div>
      <div class="panel-body">
        ${renderAgentGallery({
          activeAgentIds: getActiveAgentsForCurrentStep(),
          expandedAgentId: state.expandedAgentId,
        })}
      </div>
    </div>
  `;
}
```

### Step 4: Handle Interactions

Add event handlers for card expansion:

```javascript
document.addEventListener("click", (e) => {
  const { target } = e;
  const action = target.dataset.action;

  if (action === "toggle-agent-card") {
    const agentId = target.dataset.agentId;
    state.expandedAgentId = state.expandedAgentId === agentId ? null : agentId;
    render();
    return;
  }

  if (action === "scroll-to-agent") {
    const agentId = target.dataset.agentId;
    state.expandedAgentId = agentId;
    render();
    // Scroll to agent card
    setTimeout(() => {
      const card = document.querySelector(`[data-agent-id="${agentId}"]`);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return;
  }

  if (action === "view-agent-audit") {
    const agentId = target.dataset.agentId;
    state.showAuditPanel = true;
    state.selectedAuditAgent = agentId;
    render();
    return;
  }
});
```

---

## 📊 Example Agent Card

### Duplicate Detector (Indigo - Enrichment)

**Collapsed View:**
```
┌─────────────────────────────────────────┐
│ [🔵 INDIGO] DATA ENRICHMENT      [●]   │
│                                          │
│ Duplicate Detector                       │
│ Identifies campaign clusters using       │
│ similarity algorithms                    │
│                                          │
│ [Show More ▼]                           │
└─────────────────────────────────────────┘
```

**Expanded View:**
```
┌───────────────────────────────────────────────────────────────┐
│ [🔵 INDIGO] DATA ENRICHMENT                          [●]     │
│                                                                │
│ Duplicate Detector                                             │
│ Identifies campaign clusters using similarity algorithms       │
│                                                                │
│ [Show Less ▲]                                                 │
├───────────────────────────────────────────────────────────────┤
│ 🤖 MODEL & TYPE                                               │
│ Model: MinHash + Jaccard Similarity                          │
│ Type: Data Enrichment                                         │
│ Description: Agents that enhance, normalize, and process data │
├───────────────────────────────────────────────────────────────┤
│ 💬 SYSTEM PROMPT                                              │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Identify exact and near-duplicate comments to detect      │ │
│ │ coordinated campaigns using minhash signatures and token  │ │
│ │ similarity                                                 │ │
│ └───────────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────────┤
│ 📥 DATA INPUT                                                 │
│ Parameter       Type    Description                          │
│ comments        Array   Normalized comment objects           │
│ [View Example Input ▼]                                       │
├───────────────────────────────────────────────────────────────┤
│ 📤 DATA OUTPUT                                                │
│ Field           Type    Description                          │
│ clusters        Array   Campaign clusters with reps          │
│ exactGroups     Array   Exact duplicate groups               │
│ [View Example Output ▼]                                      │
├───────────────────────────────────────────────────────────────┤
│ ⚡ SKILLS & CAPABILITIES                                      │
│ What This Agent Can Do:                                       │
│ ✓ Text similarity calculation                                │
│ ✓ Campaign detection                                          │
│ ✓ Clustering with Union-Find                                 │
│                                                                │
│ What This Agent Cannot Do:                                    │
│ ✗ Cannot detect semantic duplicates (only textual)           │
│ ✗ May miss campaigns with high lexical variance              │
│ ✗ Requires minimum 12 duplicates to form cluster             │
├───────────────────────────────────────────────────────────────┤
│ 🛠️ TOOLS & DEPENDENCIES                                      │
│ [🔢 MinHash] [🔢 Jaccard index] [Tokenization]              │
│ [Stop words filtering]                                        │
├───────────────────────────────────────────────────────────────┤
│ 🔗 AGENT RELATIONSHIPS                                        │
│ Called By: [comment-normalizer]                              │
│ Can Call: [topic-classifier]                                 │
├───────────────────────────────────────────────────────────────┤
│ 📋 AUDIT POINTS                                               │
│ 1. Token extraction                                           │
│ 2. MinHash signatures                                         │
│ 3. Similarity scores                                          │
│ 4. Cluster formation                                          │
│ [View Audit Trail for This Agent]                           │
└───────────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Design

### Color Usage

Each agent card uses its type color for:
- **Left border** (6px thick)
- **Type badge** background
- **Code highlights** in schema tables
- **Interactive elements** (buttons, chips)
- **Hover states**

### Layout

- **Collapsed**: Compact card in grid (~200px height)
- **Expanded**: Full-width card spanning grid (~800px+ height)
- **Grid**: Auto-fill minmax(400px, 1fr) for responsiveness

### Animations

- **Card hover**: Lift effect (translateY -4px)
- **Active pulse**: Breathing animation on indicator
- **Button hover**: Color fill transition
- **Expand**: Smooth grid column span

---

## 🔍 Advanced Features

### 1. Active Agent Tracking

```javascript
// Mark agents currently processing data
const activeAgents = getActiveAgentsForStep(state.step);

renderAgentGallery({
  activeAgentIds: activeAgents, // Shows pulse indicator
});
```

### 2. Related Agent Navigation

Click any agent name in "Called By" or "Can Call" sections to:
- Expand that agent's card
- Scroll to it smoothly
- Highlight the relationship

### 3. Audit Trail Integration

Click "View Audit Trail" button to:
- Open audit panel
- Filter logs to this agent only
- Show execution timeline

### 4. Performance Metrics (Future)

Cards can show real-time metrics from audit logs:
- Execution count
- Average duration
- Success rate
- Error count

---

## 📱 Responsive Design

### Desktop (>768px)
- 2-3 cards per row
- Expanded cards span full width
- Side-by-side comparison possible

### Tablet (768px)
- 1-2 cards per row
- Stacked expanded view
- Touch-friendly buttons

### Mobile (<768px)
- 1 card per row
- Single column layout
- Large touch targets

---

## 🚦 States

### Card States

1. **Collapsed** - Default compact view
2. **Expanded** - Full details visible
3. **Active** - Agent currently running (pulse indicator)
4. **Hovered** - Lift effect and shadow
5. **Selected** - Focus state for navigation

### View States

1. **Gallery** - All agents in grid
2. **By Type** - Grouped by color-coded type
3. **Filtered** - Show only active agents
4. **Single** - One agent detail page

---

## 📈 Usage in DocketIQ Flow

### Step 1: Pick Docket
No agents shown (docket selection is user action)

### Step 2: Docket Snapshot
**Active Agents:**
- 🟣 docket-fetcher
- 🟣 document-fetcher
- 🟣 comment-fetcher
- 🟠 llm-summarizer (if OpenAI key present)

Show these 4 cards with active indicators

### Step 3: Analysis & Insights

**Agents Tab** shows all active analysis agents:
- 🔵 comment-normalizer
- 🔵 duplicate-detector
- 🔵 topic-classifier
- 🔵 argument-extractor
- 🟢 authority-scorer
- 🟢 sentiment-scorer
- 🔵 graph-builder
- 🟠 summary-generator
- 🟠 topic-view-builder
- 🔷 display-formatter

10 cards, color-grouped, all with active indicators

---

## 🔧 Customization

### Adding New Agent Sections

Edit `renderAgentCardExpanded()` in `agent-cards.mjs`:

```javascript
<!-- Custom Section -->
<div class="agent-card-section">
  <div class="agent-card-section-header" style="border-left-color: ${color}">
    <span class="agent-card-icon">🎯</span>
    <h3>Custom Section</h3>
  </div>
  <div class="agent-card-content">
    <!-- Your content -->
  </div>
</div>
```

### Styling Custom Elements

Add to `agent-cards.css`:

```css
.custom-element {
  /* Use CSS variable for agent color */
  border-color: var(--agent-color);
  color: var(--agent-color);
}
```

---

## ✅ Checklist

### Implementation

- [x] Create agent-cards.mjs module
- [x] Create agent-cards.css styles
- [x] Define all 15 agents with full details
- [x] Add color-coding system
- [x] Create expandable card component
- [x] Add capabilities/limitations lists
- [x] Create agent gallery view
- [x] Create grouped-by-type view
- [ ] Import into main app
- [ ] Add to Step 3 Agents tab
- [ ] Wire up event handlers
- [ ] Test card expansion
- [ ] Test agent navigation
- [ ] Test audit trail links

### Content

- [x] System prompts for all agents
- [x] Input schemas
- [x] Output schemas
- [x] Skills lists
- [x] Limitations lists
- [x] Tool dependencies
- [x] Call graph relationships
- [x] Audit points

---

## 🎯 Benefits

### For Users
- **Transparency**: See exactly what each agent does
- **Education**: Learn how AI analysis works
- **Trust**: Understand capabilities AND limitations
- **Exploration**: Navigate agent relationships

### For Developers
- **Documentation**: Self-documenting system
- **Debugging**: Quick reference for agent I/O
- **Maintenance**: Easy to update agent details

### For Auditors
- **Inspection**: Full system prompt visibility
- **Validation**: Input/output schemas clear
- **Traceability**: Direct links to audit logs

---

## 📝 Next Steps

1. **Import** agent-cards.mjs into app.mjs
2. **Add** link to agent-cards.css in index.html
3. **Create** Agents tab in Step 3
4. **Wire up** expand/collapse handlers
5. **Test** with real docket data
6. **Integrate** with audit panel
7. **Add** performance metrics from audit logs

Ready to integrate into the main DocketIQ app!

# Simplified 3-Step Flow for DocketIQ

## Changes Made

### ✅ Step Reduction
- **Before**: 5 steps (Pick Docket → Snapshot → Comments → Agents → Output)
- **After**: 3 steps (Pick Docket → Snapshot → Analysis & Insights)

### Code Changes

**[src/app.mjs:65-69](src/app.mjs#L65-L69)**
```javascript
const STEPS = [
  "Pick a Docket ID",
  "Docket Snapshot",
  "Analysis & Insights",  // Combined old steps 3, 4, 5
];
```

**[src/app.mjs:2256-2267](src/app.mjs#L2256-L2267)**
```javascript
function renderStepContent() {
  switch (state.step) {
    case 0:
      return renderStepZero();
    case 1:
      return renderStepOne();
    case 2:
      return renderStepTwoEnhanced();  // New combined step
    default:
      return renderStepZero();
  }
}
```

---

## New Step 3: "Analysis & Insights"

This combines the best elements from old Steps 3, 4, and 5 into one comprehensive view.

### Recommended Structure

```
┌─────────────────────────────────────────────────────────┐
│  Step 3: Analysis & Insights                            │
│  [🤖 Agents] [📊 Architecture] [📋 Audit]  (top-right)  │
└─────────────────────────────────────────────────────────┘

┌─ Quick Metrics ─────────────────────────────────────────┐
│  📊 2,110 Comments  |  🎯 78 Campaigns  |  ⏱️ 45h Saved  │
└─────────────────────────────────────────────────────────┘

┌─ AI Agent Summary ──────────────────────────────────────┐
│  Two AI agents score comments for authority & sentiment │
│                                                          │
│  [Authority Agent Card]    [Sentiment Agent Card]       │
│  Score 1-10               Positive/Negative/Mixed        │
│  [View Details]           [View Details]                │
└─────────────────────────────────────────────────────────┘

┌─ Topic Analysis ────────────────────────────────────────┐
│  ┌─ Topic Cluster Map ──┐  ┌─ Selected Topic Detail ─┐ │
│  │ [Interactive         │  │ Lead Service Line        │ │
│  │  Treemap]            │  │ Replacement              │ │
│  │  Click to drill down │  │ • 842 comments           │ │
│  └──────────────────────┘  │ • Top arguments...       │ │
│                            └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─ Visualizations ────────────────────────────────────────┐
│  [Support vs Opposition]  [Authority Distribution]      │
│  [Sentiment Histogram]    [Campaign Concentration]      │
└─────────────────────────────────────────────────────────┘

┌─ Analyst Brief ─────────────────────────────────────────┐
│  Volume: Reduced 2,110 submissions to 312 review units  │
│  Topics: Lead line replacement, compliance timeline...  │
│  Arguments: Top supportive / Top opposing...            │
│  Disagreements: Sharpest conflicts around timelines... │
│  ROI: Estimated 45 hours saved vs manual review        │
└─────────────────────────────────────────────────────────┘

┌─ Comment Table ─────────────────────────────────────────┐
│  Filter: [All] [Positive] [Negative]                   │
│  ID  | Org | Date | Authority | Sentiment | Text       │
│  ... | ... | ...  | 8         | +0.75     | [...more]  │
│  [📎 2 attachments when expanded]                       │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Options

### Option A: Keep Current Step 2, Enhance Header
- **Pros**: Minimal code changes
- **Cons**: Misses opportunity to streamline
- **How**: Just update STEPS array and renderStepContent switch

### Option B: Merge All into One Comprehensive View
- **Pros**: All insights in one place, consistent with Regulations.gov layout
- **Cons**: Longer page, more scrolling
- **How**: Create `renderStepTwoEnhanced()` combining all visualizations

### Option C: Tabbed View (Recommended)
- **Pros**: Clean, organized, progressive disclosure
- **Cons**: Requires tab state management
- **How**: Tabs for [Agent Summary] [Topic Analysis] [Analyst Brief] [Raw Comments]

---

## Recommended: Option C - Tabbed View

```javascript
function renderStepTwoEnhanced() {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "agents", label: "AI Agents" },
    { id: "topics", label: "Topics" },
    { id: "insights", label: "Analyst Brief" },
    { id: "comments", label: "Comments" },
  ];

  return `
    <section class="wizard-panel">
      ${renderStepHeader(3, "Analysis & Insights")}

      <!-- Tab Navigation -->
      <div class="analysis-tabs">
        ${tabs.map(tab => `
          <button
            class="analysis-tab ${state.analysisTab === tab.id ? "active" : ""}"
            data-action="set-analysis-tab"
            data-tab="${tab.id}">
            ${tab.label}
          </button>
        `).join("")}
      </div>

      <!-- Tab Content -->
      ${state.analysisTab === "overview" ? renderOverviewTab() : ""}
      ${state.analysisTab === "agents" ? renderAgentsTab() : ""}
      ${state.analysisTab === "topics" ? renderTopicsTab() : ""}
      ${state.analysisTab === "insights" ? renderInsightsTab() : ""}
      ${state.analysisTab === "comments" ? renderCommentsTab() : ""}
    </section>
  `;
}
```

### Tab Breakdown

**Overview Tab**
- Quick metrics cards (total comments, campaigns, hours saved)
- Mini visualizations (support/oppose split, authority distribution)
- "Dive deeper" buttons to other tabs

**AI Agents Tab**
- Authority Agent card with expandable details
- Sentiment Agent card with expandable details
- Example classifications
- Link to full Agents panel (🤖 Agents button)

**Topics Tab**
- Interactive topic cluster map (treemap)
- Selected topic details
- Stakeholder breakdowns
- Argument distribution

**Analyst Brief Tab**
- Volume summary
- Top topics
- Recurring arguments
- Notable disagreements
- ROI estimates
- All source-linked with evidence IDs

**Comments Tab**
- Full comment table
- Filters (all/positive/negative)
- Authority & sentiment scores
- Expandable text with attachments
- Search/sort capabilities

---

## Regulations.gov Design Consistency

Per user request to match https://www.regulations.gov/ design:

### Color Palette
```css
--reg-blue: #0071bc;       /* Primary blue */
--reg-dark-blue: #112e51;  /* Dark header */
--reg-light-blue: #e1f3f8; /* Light bg */
--reg-gray: #5b616b;       /* Text gray */
--reg-border: #d6d7d9;     /* Border gray */
--reg-green: #2e8540;      /* Success */
--reg-gold: #fdb81e;       /* Warning */
```

### Button Styles
```css
.reg-button-primary {
  background: #0071bc;
  color: white;
  border: 0;
  padding: 0.75rem 1.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.reg-button-secondary {
  background: white;
  color: #0071bc;
  border: 2px solid #0071bc;
  padding: 0.75rem 1.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
}
```

### Typography
- Headers: **Merriweather** (serif) or Source Sans Pro
- Body: **Source Sans Pro** or Public Sans
- Mono: **Roboto Mono**

### Layout
- Max content width: 1200px
- Card shadows: subtle, 0 2px 4px rgba(0,0,0,0.1)
- Consistent padding: 1.5rem inside cards
- White backgrounds for content cards

---

## Next Steps

1. **Choose implementation option** (recommend Option C - Tabbed View)
2. **Update state** to include `analysisTab` field
3. **Create renderStepTwoEnhanced()** with tab structure
4. **Create individual tab renderers**:
   - `renderOverviewTab()`
   - `renderAgentsTab()` (from old Step 2)
   - `renderTopicsTab()` (from old Step 2)
   - `renderInsightsTab()` (from old Steps 4 & 5)
   - `renderCommentsTab()` (from old Step 2)
5. **Add tab switching event handler**
6. **Update CSS** to match Regulations.gov design
7. **Test flow**: Docket selection → Snapshot → Analysis tabs
8. **Integrate transparency buttons** (🤖 Agents, 📊 Architecture, 📋 Audit)

---

## Benefits of 3-Step Flow

✅ **Simpler navigation**: 3 steps vs 5
✅ **Faster insights**: All analysis in one place
✅ **Less clicking**: Tabs instead of step progression
✅ **Clearer purpose**: Each step has distinct goal
✅ **Better UX**: Matches Regulations.gov familiarity
✅ **Transparency**: Agent/Architecture/Audit panels accessible from any view

---

## Files Modified

1. ✅ `src/app.mjs` - Updated STEPS array and renderStepContent()
2. ⏳ `src/app.mjs` - Need to create renderStepTwoEnhanced()
3. ⏳ `src/app.mjs` - Need to add tab state and handlers
4. ⏳ `src/styles.css` - Need to add Regulations.gov color palette
5. ⏳ `src/transparency.mjs` - Already created, ready to integrate

---

## Current Status

- ✅ Step array reduced to 3
- ✅ renderStepContent updated
- ✅ Transparency system ready ([TRANSPARENCY_SYSTEM.md](TRANSPARENCY_SYSTEM.md))
- ✅ Attachment metadata display working
- ⏳ Need to build renderStepTwoEnhanced() with tabs
- ⏳ Need to match Regulations.gov design

**Ready for**: Building the enhanced Step 3 with tabbed interface

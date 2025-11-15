# Artorizer Dashboard - UX Design Document

## Design Inspiration
- **ElevenLabs**: Minimal yet powerful dashboard, clear separation of sections, generous spacing
- **GitHub Primer**: Consistent component API, accessibility-first, visual hierarchy through layout/color/typography
- **2025 Trends**: Hyper-minimalism, clean visuals, white space utilization, real-time feedback

## User Goals & Understanding

### Primary User Objectives
1. **Upload artwork** for protection against AI training
2. **Configure protection settings** with clear understanding of what each option does
3. **View protection results** and compare original vs protected artwork
4. **Download protected assets** and associated metadata

### What Users Need to Understand Immediately
- This is an artwork protection dashboard
- The main action is uploading and configuring artwork protection
- Protection status and results are clearly communicated
- Success/failure states are instantly recognizable

## Functionality Ranking (by importance & space allocation)

### Tier 1: Primary Actions (60% of viewport space)
**Priority: CRITICAL**

1. **Artwork Upload Zone** (30% space)
   - Large, prominent drag-and-drop area
   - Clear visual affordance for interaction
   - Preview of uploaded image
   - File size/format requirements visible
   - Icon: Upload cloud SVG

2. **Protection Configuration** (30% space)
   - Protection methods (Fawkes, PhotoGuard, MIST, Nightshade)
   - Watermark strategy selection
   - C2PA manifest option
   - Each option needs:
     - Toggle/checkbox with clear label
     - Tooltip/info icon explaining what it does
     - Visual grouping of related options
   - Icon: Shield/lock SVG for security features

### Tier 2: Metadata & Context (20% space)
**Priority: IMPORTANT**

3. **Artwork Metadata** (20% space)
   - Author name (text input)
   - Creation date (date picker)
   - Description (textarea)
   - Grouped in clearly labeled section
   - Icon: Document/info SVG

### Tier 3: Action & Results (20% space)
**Priority: ESSENTIAL**

4. **Primary Call-to-Action** (5% space)
   - "Protect Artwork" button (or "Generate")
   - Large, prominent, high contrast
   - Loading state with progress indicator
   - Clear disabled state when form invalid
   - Icon: Shield check SVG

5. **Results & Comparison** (15% space - expandable)
   - Appears after processing
   - Image comparison viewer
   - Download options
   - Job information/metadata
   - Status indicators
   - Icons: Download SVG, comparison SVG

## Visual Hierarchy Principles

### Layout Structure
```
┌─────────────────────────────────────────┐
│          Header (minimal)               │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Upload Zone (LARGE)           │   │  ← 40% height
│  │   Drag & drop or click          │   │
│  │   [Preview if uploaded]         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Protection Configuration      │   │  ← 30% height
│  │   ┌──────┐ ┌──────┐ ┌──────┐  │   │
│  │   │Option│ │Option│ │Option│  │   │
│  │   └──────┘ └──────┘ └──────┘  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Artwork Metadata              │   │  ← 20% height
│  │   [Author] [Date] [Description] │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   [PROTECT ARTWORK BUTTON]      │   │  ← 10% height
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Results (when available)      │   │  ← Expandable
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Spacing & Contrast Rules

1. **Container Spacing**
   - Section gaps: 32px minimum
   - Card padding: 32px
   - Element spacing within cards: 16px
   - Form field spacing: 12px

2. **Contrast & Borders**
   - Use subtle borders (1px solid #e0e0e0) to separate major sections
   - Background variations for depth:
     - Page background: #ffffff
     - Card background: #fafafa
     - Hover states: #f5f5f5
     - Active states: #f0f0f0
   - Dark borders only for interactive elements: #232323

3. **Typography Hierarchy**
   - Page title: 32px, weight 600
   - Section headers: 20px, weight 600
   - Body text: 16px, weight 400
   - Labels: 14px, weight 500
   - Helper text: 13px, weight 400, color: #666

## Design System Specification

### Color Palette (White Theme)

**Primary Colors**
- Background: `#ffffff`
- Surface: `#fafafa`
- Border: `#e0e0e0`
- Text Primary: `#0a0a0a`
- Text Secondary: `#666666`
- Interactive: `#232323`

**Semantic Colors (Message Coding)**
- Success: `#10b981` (green)
- Error: `#ef4444` (red)
- Warning: `#f59e0b` (amber)
- Info: `#3b82f6` (blue)

**IMPORTANT**:
- Green, red, amber, blue ONLY for status messages and feedback
- NO colored buttons except the primary CTA (which uses #232323)
- NO random color usage

### Interactive States

**Buttons**
- Default: `#232323` background, `#ffffff` text
- Hover: `#404040` background
- Active: `#1a1a1a` background
- Disabled: `#e0e0e0` background, `#999999` text
- Loading: Animated spinner, disabled state

**Input Fields**
- Default: `#ffffff` background, `1px solid #e0e0e0` border
- Focus: `2px solid #232323` border
- Error: `1px solid #ef4444` border
- Disabled: `#f5f5f5` background

**Checkboxes/Toggles**
- Unchecked: `#e0e0e0` background
- Checked: `#232323` background
- Hover: `#f5f5f5` background (unchecked), `#404040` (checked)

### Animation Specifications

1. **Hover Animations**
   - Transition: `all 0.2s ease-out`
   - Scale on hover: `transform: scale(1.02)` (for cards)
   - Background fade: `opacity 0.2s ease-out`

2. **Loading States**
   - Spinner: Rotating circular indicator
   - Progress bar: Smooth 0.3s transitions
   - Skeleton loaders for content areas

3. **Reveal Animations**
   - Results section: Fade in + slide up
   - Duration: 0.4s
   - Easing: ease-out

## Component Specifications

### 1. Upload Zone Component

**Visual Design**
- Large rectangular area (min-height: 400px)
- Dashed border (2px dashed #e0e0e0) when empty
- Solid border on hover
- Background: #fafafa
- Center-aligned content

**States**
- Empty: Upload icon (SVG) + "Drag & drop or click to upload"
- Drag over: Highlight border (#232323), scale(1.01)
- Uploaded: Show image preview with remove button
- Error: Red border with error message

**Icon**
- Upload cloud SVG (48px × 48px)
- Color: #666666

### 2. Protection Options Component

**Visual Design**
- Grid layout: 2 columns × 3 rows
- Each option is a card with:
  - Checkbox/toggle (left)
  - Icon (shield/lock SVG, 24px)
  - Label (16px, weight 500)
  - Info icon (tooltip on hover)
- Card: padding 16px, border 1px solid #e0e0e0
- Hover: border-color #232323

**Options**
1. Enable Fawkes (privacy protection)
2. Enable PhotoGuard (adversarial protection)
3. Enable MIST (model training prevention)
4. Enable Nightshade (data poisoning)
5. C2PA Manifest (content authenticity)
6. Watermark Strategy (dropdown: Invisible/Tree Ring)

**Icons**
- Shield SVG for protection methods
- Lock SVG for security features
- Info circle SVG for tooltips

### 3. Metadata Section Component

**Visual Design**
- Single column layout
- Each field: Label (14px) + Input
- Inputs: Full width, padding 12px
- Border radius: 6px
- Gap between fields: 16px

**Fields**
- Author Name (text input, placeholder: "Artist name")
- Creation Date (date picker, default: today)
- Description (textarea, rows: 4, placeholder: "Describe your artwork")

**Icon**
- Document/info SVG (24px)

### 4. Primary CTA Button

**Visual Design**
- Full width of container
- Height: 56px
- Background: #232323
- Text: "Protect Artwork" (18px, weight 600, white)
- Border radius: 8px
- Icon: Shield check SVG (left of text)

**States**
- Default: #232323
- Hover: #404040 + scale(1.01)
- Active: #1a1a1a
- Disabled: #e0e0e0, text #999999
- Loading: Spinner + "Processing..."

### 5. Results Section Component

**Visual Design**
- Appears below CTA after processing
- Slide up + fade in animation
- Background: #fafafa
- Border: 1px solid #e0e0e0
- Border radius: 12px
- Padding: 32px

**Sub-components**
1. Status banner (success/error with semantic colors)
2. View toggle buttons (Original, Protected, Reconstructed, Compare)
3. Comparison mode selector
4. Image display area
5. Download buttons (with download SVG icons)
6. Job information card

**Icons**
- Check circle SVG (success, green)
- X circle SVG (error, red)
- Download SVG (24px)
- Compare/split SVG (24px)

## SVG Icon Requirements

All icons should be:
- 24px × 24px (or 48px for large upload icon)
- Stroke-based, not filled
- Stroke width: 2px
- Color: Inherit from parent (for theme consistency)
- Optimized SVG code

**Required Icons**
1. Upload cloud
2. Shield (protection)
3. Shield check (protected/success)
4. Lock (security)
5. Info circle (tooltip)
6. Document (metadata)
7. Download
8. Compare/split
9. Check circle (success)
10. X circle (error)
11. Trash (remove/delete)

## Interaction Patterns

### Upload Flow
1. User sees large upload zone immediately
2. Can drag-and-drop OR click to browse
3. Image preview appears instantly
4. Remove option available (trash icon)
5. File validation with clear error messages

### Configuration Flow
1. Protection options presented as cards
2. Hover reveals tooltips with explanations
3. Visual feedback on toggle (smooth transition)
4. Related options grouped visually
5. Recommended settings indicated

### Generate Flow
1. CTA button disabled until required fields filled
2. Click triggers validation
3. Loading state with spinner
4. Results section slides in from below
5. Success/error banner with semantic colors
6. Comparison tools available immediately

### Download Flow
1. Download buttons only active after generation
2. Hover shows download icon
3. Click initiates download
4. Success notification (green)
5. Multiple downloads tracked

## Accessibility Requirements

1. **Keyboard Navigation**
   - All interactive elements tabbable
   - Focus indicators (2px solid #232323)
   - Skip links for major sections

2. **Screen Readers**
   - Semantic HTML (header, main, section, article)
   - ARIA labels for icon-only buttons
   - Live regions for status updates

3. **Color Contrast**
   - Text contrast ratio ≥ 4.5:1
   - Interactive elements ≥ 3:1
   - Focus indicators clearly visible

## Responsive Behavior

### Desktop (≥1024px)
- Use specified layout
- Maximum width: 1200px (centered)
- Two-column grid for protection options

### Tablet (768px - 1023px)
- Single column layout
- Reduce section heights proportionally
- Stack protection options (2×3 → 1×6)

### Mobile (≤767px)
- Full width layout (95% viewport)
- Reduce font sizes by 10%
- Stack all elements vertically
- Reduce padding (32px → 16px)

## Implementation Checklist

### Phase 1: Structure
- [ ] Create HTML semantic structure
- [ ] Implement grid/flexbox layout
- [ ] Add all required sections

### Phase 2: Styling
- [ ] Apply color palette
- [ ] Implement typography hierarchy
- [ ] Add spacing and borders
- [ ] Create component styles

### Phase 3: Icons
- [ ] Source/create all SVG icons
- [ ] Implement icon system
- [ ] Add icons to components

### Phase 4: Interactions
- [ ] Add hover animations
- [ ] Implement focus states
- [ ] Add loading states
- [ ] Create reveal animations

### Phase 5: Validation
- [ ] Check against this UX document
- [ ] Test all user flows
- [ ] Verify color usage (semantic only)
- [ ] Confirm spacing/contrast rules
- [ ] Accessibility audit

## Design Validation Criteria

Before finalizing, ensure:

✓ Upload zone occupies ~30% of initial viewport
✓ Protection config occupies ~30% of viewport
✓ All important areas have increased size/prominence
✓ Background variations create depth without color
✓ Hover animations are smooth (0.2s ease-out)
✓ Borders separate sections clearly
✓ Green ONLY appears for success messages
✓ Red ONLY appears for error messages
✓ Primary CTA uses #232323 (not random colors)
✓ All buttons have SVG icons (visible or on hover)
✓ White space allows elements to "breathe"
✓ Typography hierarchy is clear
✓ Focus indicators are visible
✓ All states (hover, active, disabled) are defined

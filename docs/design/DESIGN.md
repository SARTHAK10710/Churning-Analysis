---
name: ChurnLens Analytical Core
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#ba0035'
  on-secondary: '#ffffff'
  secondary-container: '#e21e49'
  on-secondary-container: '#fffbff'
  tertiary: '#005338'
  on-tertiary: '#ffffff'
  tertiary-container: '#006e4b'
  on-tertiary-container: '#67f4b7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#ffdada'
  secondary-fixed-dim: '#ffb3b6'
  on-secondary-fixed: '#40000c'
  on-secondary-fixed-variant: '#920028'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  display-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  metric-num-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  metric-num-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  label-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style
The design system embodies the calculated precision, calm focus, and effortless clarity required by modern quantitative banking. It borrows from the disciplined restraint of modern developer and financial infrastructure tools—blending ultra-crisp information density with generous micro-white space to avoid cognitive fatigue. 

The aesthetic is clean, engineered, and authoritative without feeling sterile. Surfaces feel tactile yet digital, leveraging subtle 1px border structures, muted slate backdrops, and deliberate semantic signaling. Interactive elements communicate absolute certainty: low-latency state changes, explicit micro-interactions, and tight typography reinforce trust and mission-critical financial governance.

## Colors
The palette is rooted in balanced slate neutrals to sustain extended analytical sessions without eye strain. 

- **Primary Canvas & Structural Neutrals**: Backgrounds leverage crisp slate tiers (`#F8FAFC` for base canvas, `#FFFFFF` for primary elevated cards). Division lines and borders utilize hairline slate boundaries (`#E2E8F0` and `#F1F5F9`). Typography prioritizes optical weight using deep slate shades (`#0F172A` for titles, `#334155` for body data, and `#64748B` for secondary metrics and labels).
- **Brand Accent**: Deep Indigo (`#4F46E5`) serves strictly as the purposeful accent—driving primary actions, selected navigation states, interactive slider fills, and predictive model benchmarks.
- **Predictive Risk Spectrum**: Risk stratification requires unambiguous semantic signaling:
  - **Low Risk (Retained/Healthy)**: Emerald (`#10B981`) paired with 10% opacity tints for chip fills.
  - **Medium Risk (Watchlist/Volatile)**: Amber (`#F59E0B`) for early warning signals and model volatility bands.
  - **High Risk (Imminent Churn)**: Rose (`#E11D48`) for high-priority intervention indicators, severe risk alerts, and negative probability spikes.

## Typography
The system utilizes **Geist** throughout every surface to achieve technical harmony and crisp geometric balance. 

- **Tabular Figures (`tnum`)**: All metrics, financial figures, retention percentages, confidence scores, and table cells must apply OpenType `font-variant-numeric: tabular-nums` (or `font-feature-settings: 'tnum'`). This ensures column alignment and scan-ability across changing data points.
- **Section Headers & Metric Identifiers**: Use `label-caps` transformed to uppercase (`text-transform: uppercase`) with widened letter spacing (`+0.05em`) and slate-500 coloring to construct lightweight, elegant visual anchors above high-weight numeric readouts.
- **Hierarchy Balance**: Numerical figures dominate the visual weights, supported directly by low-contrast micro-labels, establishing an instant parsing flow for analytical workloads.

## Layout & Spacing
A strict 8px structural layout model governs all dimensions and vertical flows, with 4px sub-increments reserved solely for compact data rows, badges, and segmented tab switches.

- **Grid Architecture**:
  - **Desktop (1200px+)**: 12-column fluid grid, 2rem margin, 1.5rem gutter. Fixed navigation rails (240px or 64px collapsed icon mode) anchor the analytical workspace.
  - **Tablet (768px - 1199px)**: 8-column layout, 1.5rem margin, 1rem gutter. Analytics cards group into paired vertical columns.
  - **Mobile (< 768px)**: 4-column single-stream stack, 1rem margin, 1rem gutter. Complex tabular sheets reflow into compact card listings.
- **Density Philosophy**: Information should be compact without appearing crowded. Tight vertical padding (`space-sm` to `space-md`) on table rows and metric strips keeps analytical views above the fold, while generous card inner paddings (`space-lg`) preserve structural breathing room.

## Elevation & Depth
The system repudiates deep blurry drop shadows and heavily stacked skeuomorphic layers. Instead, visual depth relies on razor-thin micro-borders and subtle low-altitude ambient occlusion.

- **Ground Level (Base Canvas)**: Layer 0 sits at `#F8FAFC`, creating a calm, slightly tinted foundation.
- **Card Tier (Level 1)**: Pure white (`#FFFFFF`) modules bounded by a single 1px hairline border (`#E2E8F0`). Cards cast a subtle shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Hover & Active States**: Hovered rows or interactive cards shift border definition to `#CBD5E1` and escalate depth minimally to `0 4px 6px -1px rgba(15, 23, 42, 0.05)`.
- **Overlays, Popovers & Context Panels (Level 2)**: Crisp `#FFFFFF` surfaces bounded by a 1px border (`#E2E8F0`) with a clean shadow: `0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.

## Shapes
Geometry is balanced and restrained. Standard structural containers, analytical card blocks, and modals apply `rounded-xl` (12px / 0.75rem to 16px / 1rem depending on viewport size), which softens the technical density of the UI.

- **Component Controls**: Buttons, text inputs, search fields, and segmented control containers share consistent `rounded-lg` (8px / 0.5rem) geometries.
- **Tags, Risk Badges, and Dots**: Status indicators and predictive risk indicators utilize fully pill-shaped (`rounded-full` / 9999px) geometries to cleanly contrast against the surrounding rectangular layout architecture.

## Components

### 1. Risk Status Badges & Pills
- **Geometry**: Compact pill-shaped badges (`rounded-full`, 4px vertical, 10px horizontal padding).
- **Structure**: Preceded by a 6px circular indicator dot.
- **Risk Variant Tokens**:
  - *High Risk*: Border `rgba(225, 29, 72, 0.2)`, background `rgba(225, 29, 72, 0.06)`, text `#BE123C`, dot `#E11D48`.
  - *Medium Risk*: Border `rgba(245, 158, 11, 0.25)`, background `rgba(245, 158, 11, 0.08)`, text `#B45309`, dot `#F59E0B`.
  - *Low Risk*: Border `rgba(16, 185, 129, 0.2)`, background `rgba(16, 185, 129, 0.06)`, text `#047857`, dot `#10B981`.

### 2. Segmented Timeframe & Model Controls
- **Container**: 1px `#E2E8F0` border, `#F1F5F9` surface fill, 4px inner padding, `rounded-lg`.
- **Segment Item**: Inactive segments sit transparent with `#64748B` label text. Active segments take a `#FFFFFF` fill, 1px `#E2E8F0` border, `#0F172A` label text, and `box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06)`. Smooth 150ms ease-out transitions on tab switch.

### 3. Tabular Data Tables
- **Header**: `#F8FAFC` background fill, hairline bottom border (`1px solid #E2E8F0`), uppercase `label-caps` text (`#64748B`).
- **Rows**: Alternating hover highlights (`#F8FAFC`), hairline separator lines (`1px solid #F1F5F9`), zero cell-padding bleed, height anchored at 44px for high information density.
- **Numbers**: Right-aligned, `metric-num-md` or `body-md` with `tnum` enforced.

### 4. Interactive Churn Sensitivity Sliders
- **Track**: 6px height, rounded-full, slate-100 base track (`#E2E8F0`).
- **Active Range**: Deep Indigo fill (`#4F46E5`).
- **Thumb**: 18px diameter pure white circle, 1px `#CBD5E1` border, `box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2)`, actively scaling by 1.1x on drag.

### 5. Form Inputs & Filter Controls
- **Surface**: Pure white (`#FFFFFF`) with 1px `#E2E8F0` border, `rounded-lg`, height 36px.
- **Focus**: Transition to border `#4F46E5` with an outer ring glow of `0 0 0 3px rgba(79, 70, 229, 0.12)`.
- **Placeholder**: Crisp `#94A3B8` styling.

### 6. Toggle Switches
- **Track**: 20px height, 36px width, `rounded-full`. Off-state is `#CBD5E1`; on-state is `#4F46E5`.
- **Handle**: 16px white circle, 2px interior offset, smooth 200ms cubic bezier translation.

### 7. Analytical Metric Cards
- **Structure**: White card, `rounded-xl`, 1px hairline border (`#E2E8F0`).
- **Layout**: Top row features `label-caps` section title and trailing trend indicator (+/- percent change); bottom row displays large `metric-num-lg` figure paired with an inline micro-sparkline or cohort delta.
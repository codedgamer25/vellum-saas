---
version: alpha
name: Apex Auto Lounge
description: Premier exotic and luxury automobile showroom and dealership inventory platform with instant buyer inquiry and protected owner management.
colors:
  primary: "#0A0A0C"       # Deep Obsidian canvas and backdrop
  surface: "#141419"       # Titanium dark card surface and container backdrop
  surface-elevated: "#1C1C24" # Elevated modal / dropdown surface
  border: "#22222B"        # Subtle precision titanium border
  border-subtle: "#191921" # Divider border
  accent: "#D4AF37"        # Hand-brushed champagne gold primary accent
  accent-hover: "#E5C158"  # Gold hover luminescence
  accent-subtle: "rgba(212, 175, 55, 0.12)" # Gold subtle tint for pills
  status-emerald: "#10B981" # In stock / Available
  status-amber: "#F59E0B"   # Reserved / Sale Pending
  status-slate: "#64748B"   # Sold unit archive
  text-primary: "#F8FAFC"   # High-contrast bright titanium text
  text-secondary: "#94A3B8" # Muted technical slate text
  text-muted: "#64748B"     # Caption / watermark text
typography:
  display-lg:
    fontFamily: "Syne, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.03em
  display-md:
    fontFamily: "Syne, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  headline:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
  spec-mono:
    fontFamily: "Space Grotesk, monospace"
    fontSize: 13px
    fontWeight: 500
    letterSpacing: 0.05em
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  full: 9999px
motion:
  ease-out: cubic-bezier(0.16, 1, 0.3, 1)
  ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)
  duration-fast: 150ms
  duration-normal: 250ms
  duration-slow: 400ms
  rules:
    - Zero transition: all
    - Only transform and opacity animated on interactive transitions
    - Hover lift restricted to @media (hover: hover) and (pointer: fine)
    - Active click feedback scale(0.97) on all interactive buttons and pills
---

# Apex Auto Lounge Design System

Apex Auto Lounge is engineered for ultra-luxury exotic automobile sales and inventory management. The interface merges the high-end digital precision of modern hypercar configurators with the operational efficiency of an executive showroom ERP.

## Design Pillars
1. **Titanium & Obsidian Stage**: Dark obsidian canvas (`#0A0A0C`) with satin titanium cards (`#141419`) and brushed champagne gold highlights (`#D4AF37`) creates an atmosphere of prestige and high-octane engineering.
2. **Instant Micro-Feedback**: Every state transition uses Emil Kowalski spring micro-motion tokens (`--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`).
3. **Full-Bleed 3D Hero Stage Viewport (Apple Keynote & Brune / WebLoved Aesthetic)**:
   - Full-bleed viewport canvas (`min-height: calc(100vh - 72px)`) with WebGL 3D center stage and seamless vignette edge-blends (`.hero-vignette-overlay`) melting into obsidian darkness with zero harsh borders.
   - **Dynamic Vehicle Atmosphere Themes**: Each car triggers a 700ms cubic-bezier signature atmospheric gradient melt (`transition: background 700ms cubic-bezier(0.16, 1, 0.3, 1)`):
     - `porsche-gt3-rs-2024`: `--theme-glow: rgba(245, 158, 11, 0.22); --theme-accent: #F59E0B; --theme-accent-tint: rgba(245, 158, 11, 0.12);`
     - `ferrari-roma-2023`: `--theme-glow: rgba(239, 68, 68, 0.22); --theme-accent: #EF4444; --theme-accent-tint: rgba(239, 68, 68, 0.12);`
     - `mercedes-amg-g63-2024`: `--theme-glow: rgba(16, 185, 129, 0.22); --theme-accent: #10B981; --theme-accent-tint: rgba(16, 185, 129, 0.12);`
     - `audi-rs6-avant-2024`: `--theme-glow: rgba(6, 182, 212, 0.22); --theme-accent: #06B6D4; --theme-accent-tint: rgba(6, 182, 212, 0.12);`
   - **Colossal Typographic Watermark**: Low-contrast background headline (`clamp(3.5rem, 12vw, 11rem)`, 5% opacity, `letter-spacing: -0.04em`) dynamically synchronizing with active vehicle name (`911 GT3 RS`, `ROMA V8`, `AMG G63`, `RS6 AVANT`).
   - **Floating Apple-Grade Glassmorphic Controls**:
     - `.hero-stage-top-bar`: Live showroom status indicator with pulsing dot, Apple segmented car switcher, and delivery badge.
     - `.hero-aura-card`: Interactive color swatch dots with active ring feedback and instant vehicle + gradient switching.
     - `.hero-next-vehicle-card`: Interactive preview teaser card displaying thumbnail and title of next hypercar in rotation.
     - `.hero-stage-bottom-island`: Floating telemetry capsule with vehicle badge, live HP, 0-60, top speed, pagination dots, and multi-currency pricing pill.
     - Direct manipulation cues: `🖱️ HOLD & DRAG TO ORBIT 360° • 🔍 PINCH TO ZOOM` and smooth scroll hint `EXPLORE SHOWROOM INVENTORY ↓` linking directly to `#catalog`.
4. **Dual Reality Layout**:
   - **Buyer View**: 3-column cinematic car cards, multi-criteria hero search, live multi-currency switcher (`USD`, `NGN`, `GBP`, `EUR`), vehicle detail inspection modal, and instant WhatsApp inquiry.
   - **Owner Admin Portal**: Protected by 4-digit PIN (`2026`), instant inventory telemetry KPIs, 1-click status toggles (`[Available]`, `[Reserved]`, `[Sold]`), live Add/Edit modal, and deletion with toast feedback.

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
3. **Dual Reality Layout**:
   - **Buyer View**: 3-column cinematic car cards, multi-criteria hero search, live multi-currency switcher (`USD`, `NGN`, `GBP`, `EUR`), vehicle detail inspection modal, and instant WhatsApp inquiry.
   - **Owner Admin Portal**: Protected by 4-digit PIN (`2026`), instant inventory telemetry KPIs, 1-click status toggles (`[Available]`, `[Reserved]`, `[Sold]`), live Add/Edit modal, and deletion with toast feedback.

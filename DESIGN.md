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
  # Marco Perez Triadic Harmony (2-Base + 1-Pop Principle)
  triads:
    midnight-coral:
      base-dark: "#00243A"    # Midnight Navy
      base-soft: "#B6DFED"    # Soft Sky Blue
      pop: "#FD6E6E"          # Coral Orange (The Pop Accent)
      tagline: "Soft blue & midnight navy. Add coral orange, now it feels like a brand."
    raven-poppy:
      base-dark: "#0B0D12"    # Raven Black
      base-soft: "#8BB4D0"    # Powder Ice Blue
      pop: "#FF3B30"          # Poppy Red (The Pop Accent)
      tagline: "Raven black & powder blue. Add Poppy red, now it is impossible to ignore."
    pine-butter:
      base-dark: "#1A3528"    # Pale Pine Green
      base-soft: "#4A121A"    # Deep Burgundy
      pop: "#FCE788"          # Butter Yellow (The Pop Accent)
      tagline: "Pale pine & deep burgundy. Add butter yellow, now look at the packaging."
    obsidian-gold:
      base-dark: "#0A0A0C"    # Obsidian Black
      base-soft: "#1A1A24"    # Deep Slate
      pop: "#D4AF37"          # Champagne Gold (The Pop Accent)
      tagline: "The smallest color can make the biggest difference."
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
   - **Marco Perez 2-Base + 1-Pop Color Triads**:
     Each hypercar atmosphere is governed by the Marco Perez Triadic Harmony Principle: *Two base grounding tones create atmospheric depth and tension; a single high-chroma pop accent transforms the composition into an unforgettable brand identity.*
     - **Midnight & Coral** (`midnight-coral`): Base dark (`#00243A`), Base soft (`#B6DFED`), Pop accent (`#FD6E6E`). Tagline: *"Soft blue & midnight navy. Add coral orange, now it feels like a brand."*
     - **Raven & Poppy** (`raven-poppy`): Base dark (`#0B0D12`), Base soft (`#8BB4D0`), Pop accent (`#FF3B30`). Tagline: *"Raven black & powder blue. Add Poppy red, now it is impossible to ignore."*
     - **Pine & Butter** (`pine-butter`): Base dark (`#1A3528`), Base soft (`#4A121A`), Pop accent (`#FCE788`). Tagline: *"Pale pine & deep burgundy. Add butter yellow, now look at the packaging."*
     - **Obsidian & Gold** (`obsidian-gold`): Base dark (`#0A0A0C`), Base soft (`#1A1A24`), Pop accent (`#D4AF37`). Tagline: *"The smallest color can make the biggest difference."*
   - **Colossal Typographic Watermark**: Low-contrast background headline (`clamp(3.5rem, 12vw, 11rem)`, 12% opacity, `letter-spacing: -0.04em`, `text-shadow: 0 4px 30px rgba(0, 0, 0, 0.4)`) dynamically synchronizing with active vehicle name (`911 GT3 RS`, `ROMA V8`, `AMG G63`, `RS6 AVANT`).
   - **Floating Apple-Grade Glassmorphic Controls**:
     - `.hero-stage-top-row`: Live curated badge and Apple segmented car switcher.
     - `.triad-swatch-group` & `.triad-pill`: Interactive color triad selector pills showcasing dual-tone base bars and glowing pop accent dots.
     - `.hero-next-vehicle-card`: Interactive preview teaser card displaying thumbnail and title of next hypercar in rotation.
     - `.hero-stage-bottom-island`: Floating telemetry capsule with vehicle badge, live HP, 0-60, top speed, pagination dots, and multi-currency pricing pill with glowing pop border.
     - Direct manipulation cues: `🖱️ HOLD & DRAG TO ORBIT 360° • 🔍 PINCH TO ZOOM` and smooth scroll hint `EXPLORE SHOWROOM INVENTORY ↓` linking directly to `#catalog`.
4. **Dual Reality Layout**:
   - **Buyer View**: 3-column cinematic car cards, multi-criteria hero search, live multi-currency switcher (`USD`, `NGN`, `GBP`, `EUR`), vehicle detail inspection modal, and instant WhatsApp inquiry.
   - **Owner Admin Portal**: Protected by 4-digit PIN (`2026`), instant inventory telemetry KPIs, 1-click status toggles (`[Available]`, `[Reserved]`, `[Sold]`), live Add/Edit modal, and deletion with toast feedback.

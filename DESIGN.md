---
version: alpha
name: Royal Headmistress
description: Luxury bespoke wig and raw hair atelier combining couture craftsmanship with Apple Pro industrial precision.
colors:
  primary: "#0D0B0A"      # Main obsidian ink for headlines and body
  secondary: "#786B63"    # Muted bronze/taupe for subtitles, borders, and captions
  tertiary: "#C59B4F"     # Single champagne-gold accent: badges, active pills, and primary CTAs
  neutral: "#FAF7F2"      # Warm pearl atelier canvas background
  surface: "#FFFFFF"      # Crisp white card surfaces
  surface-dark: "#141210" # Deep obsidian glass for Apple Dynamic Island and Bento Studio stage
  on-tertiary: "#0D0B0A"  # Deep contrast ink on gold fills
typography:
  headline-lg:
    fontFamily: "Playfair Display"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.02em
  headline-md:
    fontFamily: "Playfair Display"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.015em
  body-md:
    fontFamily: "Inter"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label-md:
    fontFamily: "Inter"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.04em
rounded:
  sm: 4px
  md: 8px
  lg: 16px
  full: 9999px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 64px
components:
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 12px 24px
  button-primary-hover:
    backgroundColor: "#B3893F"
    textColor: "{colors.on-tertiary}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 32px
  dynamic-island:
    backgroundColor: "{colors.surface-dark}"
    textColor: "#FAF7F2"
    rounded: "{rounded.full}"
---

# Royal Headmistress — Atelier Design Specification

Official DESIGN.md specification formatted in accordance with Google Labs and Tobia Donadon's Claude Design Blueprint standards.

## Overview
Royal Headmistress represents the pinnacle of luxury hair artistry and 0.10mm Swiss HD lace custom units. The visual atmosphere balances Parisian couture elegance with Apple Pro industrial precision.

## Colors
- **Primary (`#0D0B0A`):** Obsidian black ink used for headlines, high-contrast borders, and primary dark actions.
- **Secondary (`#786B63`):** Muted bronze-taupe for specifications, micro-copy, and secondary borders (`#E8DFD5`).
- **Tertiary (`#C59B4F`):** The ONE accent. Royal champagne gold for primary CTAs, active status dots, live price tags, and slider dividers.
- **Neutral (`#FAF7F2`):** Warm silk background canvas across the storefront.
- **Surface (`#FFFFFF` & `#141210`):** White porcelain cards for client reviews/pricing, and deep obsidian glass for the Apple Pro Bento Studio.

## Typography
Two fonts strictly enforced:
- **Playfair Display (600, 700):** Headlines and editorial statements.
- **Inter (400, 500, 600, 700):** UI controls, specifications, monospaced kickers, and body prose.

## Layout & Bento Grid
- 12-column responsive grid with a 1440px desktop canvas.
- Spacing scale: `8px`, `16px`, `24px`, `32px`, `64px`. Sections are strictly separated by 64px–96px padding.

## Micro-Motion Rules (Blueprint Hack 03)
- **Hover Lift:** Cards lift 4px on hover (`transition: transform 260ms cubic-bezier(.2, .7, .2, 1)`).
- **Soft Press:** Interactive buttons scale to `0.97` on active press.
- **Stagger Reveal:** Elements animate in with a 40ms stagger delay (`calc(var(--i) * 40ms)`).
- **Accessibility:** Strict `prefers-reduced-motion` override (motion disabled for users requesting reduced motion). Never move text while reading.

## Do's and Don'ts
- **DO** use the champagne-gold accent (`#C59B4F`) for high-intent actions, active pills, and divider bars.
- **DO** maintain 4.5:1+ contrast on all text elements.
- **DO** keep the top navigation on a single horizontal line at 1440px.
- **DON'T** add competing bright accent colors (e.g. no neon blue, purple, or green).
- **DON'T** introduce a third typography family.
- **DON'T** reintroduce scroll-jacking or frame-scrubbing reels.

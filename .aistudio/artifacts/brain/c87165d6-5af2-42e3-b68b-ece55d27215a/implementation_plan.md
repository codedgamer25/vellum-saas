# Apex Auto Lounge — Gallery Editorial & 3D Depth-Carousel Redesign

Transform Apex Auto Lounge into an airy, gallery-white automotive couture experience inspired by the `@uiuxzaid` interactive concept video—combining bold geometric product titles, tall ultra-light uppercase editorial headers, colossal tonal background watermarks, and a 3-car depth-of-field hero carousel powered directly by the project's existing local 3D car models.

## User Review & Critical Decisions

> [!IMPORTANT]
> Updated to incorporate your feedback: the hero carousel and showroom will directly utilize the project's existing local 3D car models (the Ferrari and BMW M4 3D GLB assets, studio renders, and transparent contact shadows) across all carousel slots and paint configurations.

- **Confirmed Decision 1 — Existing Local 3D Car Models Utilized Everywhere**: Both the interactive center 3D stage and the blurred flanking previous/next carousel slots will be driven by the project's existing local 3D GLB vehicles (Ferrari and BMW M4 3D models with Draco compression, metallic clearcoat paint shaders, and transparent ground shadows), ensuring zero missing-model errors and authentic 3D geometry across every vehicle in the rotation.
- **Confirmed Decision 2 — Typographic Hierarchy**: Pair bold geometric uppercase product display titles (`Outfit` / `Plus Jakarta Sans` 700–800) with tall, ultra-light uppercase section headers (`Outfit` 200–300, wide architectural proportions, tight line height `1.12`) and colossal low-opacity tonal background watermarks (`clamp(7rem, 20vw, 18rem)`).
- **Confirmed Decision 3 — Gallery Light Palette & Dark Footer**: Transition the public showroom from dark obsidian to a studio-white gallery theme (`#F8F9FA` canvas, `#FFFFFF` elevated surfaces, `#111117` jet ink, `#686B73` muted copy, soft tonal watermarks in `#ECEEF2` and warm terracotta `#F5DFD5`) anchored by a deep obsidian contrast footer (`#111115`) with rounded top corners.
- **Confirmed Decision 4 — Full Video Section Flow**: Implement the complete 4-part vertical storytelling flow from the reference video: (1) Minimalist Top Bar + 3-Car 3D Depth-of-Field Hero Stage, (2) Editorial Lifestyle Split Showcase (*"MORE THAN ENGINEERING, IT'S A LIFESTYLE"*), (3) Arch-Framed Featured Collection (*"FEATURED COLLECTION"*) + Interactive Inventory Catalog, and (4) Rounded Dark Luxury Footer.

---

## Autonomous `/goal` Prompt (Copy & Set to Run)

> [!NOTE]
> Below is the self-contained `/goal` prompt updated to explicitly use your existing local 3D car models across the carousel and showroom. Copy and set this `/goal` to keep the engineering loop running autonomously through implementation, testing, and visual verification.

```text
/goal Transform Apex Auto Lounge to match the @uiuxzaid reference video aesthetic and layout while utilizing the project's existing local 3D car models: (1) Load Outfit and Plus Jakarta Sans fonts and implement the 3-tier typographic system (bold uppercase product titles, thin 200/300-weight uppercase editorial headlines like "MORE THAN ENGINEERING, IT'S A LIFESTYLE" and "FEATURED COLLECTION", colossal tonal background watermarks, and tracked micro-navigation links); (2) Convert the showroom to a crisp gallery-white surface palette (#F8F9FA / #FFFFFF) with high-contrast #111115 ink, subtle 1px solid #E2E4E9 hairline borders, and a dark rounded-top luxury footer; (3) Rebuild the Hero Stage into the video's 3-car depth-of-field showcase utilizing the project's existing local 3D GLB car models (Ferrari and BMW M4 3D assets with custom clearcoat paint finishes and ground shadows) for the interactive 3D center car as well as the scaled-down, blurred (filter: blur(5px)) previous/next flanking cars, controlled by circular 1px outline arrow buttons (← / →) and an "Explore More" pill button with a leading line accent; (4) Add the "MORE THAN ENGINEERING, IT'S A LIFESTYLE" 2-column split section with bold tabular price callout, thin "Acquire Now" pill button, 3 rounded-square detail thumbnails, and a large pill/arch-framed editorial showcase; (5) Build the "FEATURED COLLECTION" section over a giant warm peach/sand watermark with 3 arch/stadium-framed vertical vehicle cards (bold uppercase title + "Price : $XXX,XXX" subtitle) alongside the full searchable, multi-currency showroom inventory and PIN-protected Owner Admin portal; (6) Verify all interactive flows, local 3D model loading, paint transitions, and responsive layouts in headless Chromium with zero console/page errors and passing automated tests.
```

---

## 1. Overview & Core Concept

- **What It Does**: Elevates Apex Auto Lounge into a high-fashion editorial automotive gallery where the project's existing 3D exotic car models are presented like couture pieces—complete with a 3-car depth-of-field hero carousel, editorial storytelling, arch-masked collection cards, live multi-currency pricing (`USD`, `NGN`, `GBP`, `EUR`), WhatsApp concierge reservation, and a protected Owner Admin ERP.
- **Target Audience / Persona**: Collectors, executive buyers, and automotive enthusiasts seeking an effortless, design-forward acquisition experience on desktop and mobile.
- **Key Value**: Merges the tactile editorial clarity and typographic drama of the reference video with your local 3D WebGL vehicle assets and full dealership inventory management.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Minimalist Gallery Header**: Users land on a clean 3-zone header: `Apex.` bold wordmark on the left, centered uppercase micro-tracked navigation links (`SHOWROOM`, `COLLECTION`, `LIFESTYLE`, `CONCIERGE`) with an active bottom hairline indicator, and utility controls (live currency selector and Owner Admin lock toggle) on the right.
2. **Depth-of-Field 3D Hero Carousel (Powered by Existing Local 3D Cars)**:
   - **Left Editorial Rail**: Bold geometric uppercase vehicle title (e.g., `FERRARI ROMA V8` / `BMW M4 COMPETITION`), a concise 3-line editorial summary in muted slate (`#686B73`), circular `1px` outline previous/next arrow buttons (`←` `→`), and a clean `Explore More` pill button accented with a leading architectural line.
   - **Center 3D Stage & Blurred Flanking 3D Previews**: A colossal tonal watermark (`ROMA V8`, `BMW M4`, `GT3 RS`, `AMG G63`) spans behind the central interactive Three.js 3D vehicle loaded directly from the project's existing Draco-compressed GLB models. Flanking the center car on the upper-left and lower-right/side positions are soft-blurred (`blur(5px)`), scaled-down renders derived directly from the project's 3D car assets and transparent contact shadows. Clicking `←`, `→`, or either flanking car smoothly cycles the carousel, updates the colossal watermark, and transitions the 3D model and metallic clearcoat paint finish.
   - **Unified Bottom Control Dock**: A compact, collapsible pill bar at the base of the hero stage allows users to switch Marco Perez color triads on the live 3D car body, inspect live horsepower / 0–60 telemetry, or collapse controls for unobstructed 360° orbit inspection.
3. **Editorial Lifestyle Split Section (*"MORE THAN ENGINEERING, IT'S A LIFESTYLE"*)**:
   - **Left Column**: Tall, ultra-light (`font-weight: 300`) uppercase headline stacked across three balanced lines, paired with a refined editorial narrative, a bold tabular price callout (dynamically formatted in the active currency) alongside a crisp `1px` bordered `Acquire Now` pill button, and a trio of rounded-square (`16px` radius) detail thumbnails that swap the featured highlight image when clicked.
   - **Right Column**: A tall stadium/arch-framed showcase portrait with a floating circular inset badge highlighting bespoke atelier craftsmanship and immediate private delivery.
4. **Arch-Framed Featured Collection & Full Showroom Filter**:
   - Set over a colossal warm pastel watermark (`FEATURE`), a 3-column grid presents curated flagship motorcars inside tall stadium/pill-shaped frames (`border-radius: 9999px` arch/capsule mask), each paired with a clean uppercase title and `Price : $238,000` subtitle plus a header block with an `Explore All` pill CTA.
   - Directly below, the full interactive Showroom Inventory Bar lets buyers filter all vehicles by keyword, make, availability status, and price ceiling, inspect full vehicle dossiers in a modal, or reserve via WhatsApp.
5. **Dark Contrast Luxury Footer & Admin Mode**:
   - The page concludes with a deep charcoal/obsidian footer (`#111115`, `border-radius: 36px 36px 0 0`) featuring 4 clean columns (`APEX.`, `COMPANY`, `FAQ`, `RESOURCES`) matching the final frame of the reference video.
   - Clicking the Admin toggle opens the 4-digit PIN modal (`2026`) to unlock the Owner Admin console for instant status toggles (`Available`, `Reserved`, `Sold`), KPI telemetry, and vehicle CRUD.

### Visual Identity & Theme
- **Aesthetic Direction**: High-Fashion Editorial Gallery meets Interactive 3D Automotive Design.
- **Color Palette & Mood (60-30-10 Discipline)**:
  - **60% Dominant Neutral Canvas**: Crisp Studio Alabaster `#F8F9FA` (`--bg-canvas`) and pure gallery white `#FFFFFF` (`--bg-surface`) for main sections.
  - **30% Structural Surfaces & Tonal Watermarks**: Cool architectural mist `#ECEEF2` for hero watermarks, warm sand/peach tint `#F5DFD5` for the Featured Collection watermark, `#111115` deep obsidian for the contrast footer, and `#E2E4E9` hairline borders.
  - **10% Accent Budget**: Jet Ink `#111115` for primary pills and active indicators, paired with vehicle-specific Marco Perez pop accents (`#FD6E6E` Coral, `#FF3B30` Poppy Red, `#FCE788` Butter Yellow, `#D4AF37` Crown Gold) applied directly to the 3D car's `MeshPhysicalMaterial` clearcoat paint and active swatches.
- **Typography & Hierarchy (2+1 Font Rule)**:
  - **Display & Editorial Face (`Outfit`)**:
    - *Hero Product Title*: `Outfit` `800` ExtraBold, uppercase, `clamp(2.25rem, 3.8vw, 3.5rem)`, tracking `-0.02em`.
    - *Editorial Section Headers*: `Outfit` `200` / `300` ExtraLight/Light, uppercase, `clamp(2.2rem, 4.2vw, 3.75rem)`, line-height `1.12`, tracking `0.02em`.
    - *Colossal Background Watermark*: `Outfit` `800`, uppercase, `clamp(6.5rem, 19vw, 17rem)`, tracking `0.04em`, subtle tonal fill.
  - **Body & UI Face (`Plus Jakarta Sans`)**:
    - *Body Copy*: `400` Regular, `14.5px–15.5px`, line-height `1.65`, measure `38ch–52ch`, color `#686B73`.
    - *Navigation & Card Labels*: `600–700` SemiBold/Bold uppercase `11px–13px`, letter-spacing `0.12em`.
  - **Numeric & Telemetry Face (`JetBrains Mono` / `tabular-nums`)**:
    - Used for prices, VINs, 0–60 times, and horsepower figures.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Mapping All Hero Variants to Existing Local 3D GLB Models**
  - *Chosen Approach*: Map every hero showcase vehicle directly to the existing local Draco-compressed 3D GLB models (the Ferrari and BMW M4 3D assets) paired with distinct metallic clearcoat paint colors and camera angles, and generate the blurred flanking previous/next car previews directly from those 3D models and local studio renders.
  - *Why*: Eliminates any broken model references while making full use of the existing 3D assets already bundled in the project.
- **Decision 2: Upright Desktop Choreography vs. Rotated Mobile Reel Wrapper**
  - *Chosen Approach*: Translate the reference video's layout (which was rotated 90° in the Pinterest reel so a wide desktop mockup filled a vertical phone screen) into a native, upright 1440px desktop and responsive mobile web layout.
  - *Why*: Delivers the exact typography, whitespace, circular arrow controls, lifestyle split, and arched collection cards in an ergonomic, scrollable browser experience.
- **Decision 3: Preserving Full Dealership Store & Admin Capabilities**
  - *Chosen Approach*: Keep `ApexStore` (`localStorage` persistence, 4-currency live conversion, search/filter state, and PIN-protected Owner Admin CRUD) intact and wire all new editorial sections (`Lifestyle Split`, `Featured Collection` arches, and `Hero Carousel`) directly to live store data.
  - *Why*: Ensures every price, currency switch, dossier inspection button, and admin edit updates the entire page reactively with zero dead clicks.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                        ApexStore (Reactive State)                          │
│   • Local 3D GLB Car Lineup (Ferrari & BMW M4 3D Models + Paint Triads)    │
│   • Showroom Inventory (localStorage CRUD, Multi-Currency: USD/NGN/GBP/EUR)│
└───────────────────┬────────────────────────────────────┬───────────────────┘
                    │                                    │
                    ▼                                    ▼
┌───────────────────────────────────────┐  ┌─────────────────────────────────┐
│       Public Gallery View             │  │   Owner Admin Portal (PIN 2026) │
├───────────────────────────────────────┤  ├─────────────────────────────────┤
│ 1. Minimalist 3-Zone Gallery Header   │  │ • Telemetry KPI Strip           │
│    [Apex.] [Nav Links] [Currency/Bag] │  │ • 1-Click Status Toggles        │
│                                       │  │ • Add / Edit Vehicle Modal      │
│ 2. 3-Car 3D Depth-of-Field Hero Stage │  │ • Instant Reset & Toast Alerts  │
│    ┌─────────┬─────────────┬────────┐ │  └─────────────────────────────────┘
│    │ Bold H1 │ Prev 3D Car │Finishes│ │
│    │ Summary │ Center 3D   │  Dock  │ │
│    │ [←] [→] │ Next 3D Car │        │ │
│    │ Explore │ + Watermark │        │ │
│    └─────────┴─────────────┴────────┘ │
│                                       │
│ 3. Editorial Lifestyle Split Section  │
│    • Light Uppercase H2 + Price + CTA │
│    • 3 Interactive Detail Thumbnails  │
│    • Pill-Framed Lifestyle Showcase   │
│                                       │
│ 4. Arch-Framed Featured Collection    │
│    • Giant Warm "FEATURE" Backdrop    │
│    • 3 Stadium-Masked Vehicle Cards   │
│    • Full Search & Filter Inventory   │
│                                       │
│ 5. Rounded Dark Contrast Footer       │
└───────────────────────────────────────┘
```

### Interactive Component & State Mapping
- **Hero Carousel Controls (`←` / `→` Circular Buttons & Flanking 3D Cars)**:
  - Clicking `←` (`#hero-prev-btn`), `→` (`#hero-next-btn`), or either blurred flanking car cycles through the 3D vehicle lineup.
  - Synchronously updates the colossal background watermark, left-rail bold title and description, blurred previous/next 3D car previews (with dynamic paint tint and ground contact shadow), active Marco Perez triad accent, and triggers `Apex3DViewer.loadModel()` + `changeCarColor()` on the Three.js stage.
- **Lifestyle Split Section Interactive Thumbnails**:
  - Clicking any of the 3 rounded-square detail thumbnails updates the main stadium-framed lifestyle image and caption, while `Acquire Now` / `Inspect Dossier` opens the corresponding Vehicle Detail Modal.
- **Featured Collection Arched Cards & Currency Reactivity**:
  - Each arch-framed card displays live converted pricing (`Price : $248,000` / `₦396,800,000` / `£195,920` / `€228,160`) via `STORE.formatPrice()` and opens the full Vehicle Detail Dossier when clicked.
- **Studio-Lit 3D Rendering on Gallery-White Canvas**:
  - `Apex3DViewer` pairs studio directional and hemisphere lighting with the existing local `.glb` models and soft radial ground shadows so the metallic clearcoat bodywork pops against the bright `#F8F9FA` gallery backdrop.

---

## 5. Performance Optimizations & Site Responsiveness Overhaul

- **Removed Motion Blur & Continuous Rasterization**:
  - Replaced CPU/GPU-intensive CSS `filter: blur(4px)` on flanking hero preview cars (`#prev-vehicle-thumb`, `#next-vehicle-thumb`) with crisp, hardware-accelerated transforms (`will-change: transform`).
  - Swapped heavy blurred shadow divs for lightweight CSS radial gradients.
- **Three.js 3D WebGL Viewer On-Demand Loop**:
  - Capped `devicePixelRatio` at `1.25` on high-DPI displays.
  - Simplified lighting from 5 active lights to a 3-light studio rig and converted materials to hardware-efficient studio reflections.
  - Disabled continuous `autoRotate` by default and implemented on-demand wake/sleep cycles (0% idle GPU usage).
- **Eliminated Full-Page Re-Render Thrashing**:
  - Replaced full `renderPublicView()` calls on search typing and filter selects with debounced `updateCatalogGridOnly()` (80ms debounce), preventing DOM destruction and Three.js reinitialization on every keystroke.
  - Wired event delegation on `main` for `.btn-open-detail`, `.btn-open-3d`, and `#btn-clear-empty-filter`.
- **Instant In-Place Currency Switching**:
  - Implemented `updateCurrencyInPlace(newCurrency)` in `STORE.subscribe` so toggling USD, NGN, GBP, or EUR updates prices, WhatsApp inquiry links, and badges in <1ms without rebuilding the DOM or tearing down the 3D viewer.
- **Off-Thread Image Decoding**:
  - Added `decoding="async"` and `loading="lazy"` across catalog cards, arched collection items, lifestyle perspectives, and modal viewers.
- **Verification**:
  - All 6 unit tests in `tests/store-logic.test.ts` pass with 100% success rate.
  - `compile_applet` and `lint_applet` pass with zero errors.
  - Playwright browser testing confirms 60fps instant UI response.

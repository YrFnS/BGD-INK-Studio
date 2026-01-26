# ASHUS Platform Development Plan

## Project Overview
**Goal:** Build a high-performance, monochrome (Black & White) 3D custom printing web app for Baghdad.
**Tech:** React, Tailwind CSS, Three.js (R3F), GSAP.
**Key Constraints:** Bilingual (EN/AR), Light/Dark Theme, 500-line limit per file.

---

## Phase 1: Foundation & Architecture
- [x] **Task 1: Configuration & Global State**
    - Setup `metadata.json` for permissions.
    - Create `types.ts` for strictly typed interfaces (Product, Order, Theme, Language).
    - Create `translations.ts` for English/Arabic dictionaries.
    - Build `contexts/AppContext.tsx` to manage Theme (Light/Dark) and Language (LTR/RTL).
    - Configure Tailwind for dark mode `class` strategy.

- [x] **Task 2: App Shell & Navigation**
    - Create `index.html` with fonts (`Space Grotesk`, `Noto Kufi Arabic`) and global CSS.
    - Build `components/layout/Header.tsx`: Floating, minimalist nav with Theme/Lang toggles.
    - Build `components/layout/Footer.tsx`.
    - Setup `App.tsx` as the main view orchestrator (Home -> Catalog -> Customizer -> Checkout).

## Phase 2: Core User Interface (Frontend)
- [x] **Task 3: Hero Section (Home)**
    - Build `features/hero/Hero.tsx`.
    - Implement GSAP scroll animations for text and images.
    - Create the "Animated Gallery" showing previous work in a monochrome style.
    - Ensure RTL compatibility for Arabic headlines.

- [x] **Task 4: Product Catalog**
    - Build `features/catalog/Catalog.tsx`.
    - Create a data file `data/products.ts` with T-Shirts, Hoodies, Vests (Mock data).
    - Implement a responsive grid layout.
    - Add "Quick View" animation using GSAP.

## Phase 3: The 3D Engine (Customizer)
- [x] **Task 5: 3D Scene Components**
    - Build `features/customizer/Scene.tsx` (Canvas wrapper).
    - Build `features/customizer/ShirtModel.tsx` using `@react-three/drei`.
    - Implement the logic to swap geometries based on product type (T-Shirt/Hoodie).
    - Add lighting suitable for black & white materials.

- [x] **Task 6: Decal & Upload Logic**
    - Implement file input handling (limit to images, max size).
    - Add `Decal` component from `drei` to wrap the uploaded image onto the mesh.
    - Add state management for Decal Position, Scale, and Rotation.

- [x] **Task 7: Customizer UI Controls**
    - Build `features/customizer/Controls.tsx`.
    - Create UI for Color Picker (Preset colors), Size Selector, and Upload Button.
    - Add "Order Notes" text area (Arabic support).

## Phase 4: Commerce & Logistics
- [x] **Task 8: Checkout System**
    - Build `features/checkout/Checkout.tsx`.
    - Implement Zod validation for inputs.
    - Create specific fields for Baghdad logistics: Area (Al-Mansour, Karrada, etc.), Street, House.
    - Display Order Summary (Image of the configured product + Details).

- [x] **Task 9: Success & Error Handling**
    - Build `features/checkout/Success.tsx` (Order confirmation).
    - Connect a mock "Send to Admin" function (simulating WhatsApp/Email trigger).

## Phase 5: Optimization & SEO
- [x] **Task 10: SEO & Performance**
    - Add dynamic `<title>` and `<meta>` description updates based on language.
    - Keyword injection: "Printing on clothes", "طباعة على الملابس", "Baghdad".
    - Lazy load the 3D Canvas to ensure fast LCP (Largest Contentful Paint).

## Phase 6: Final Review
- [x] **Task 11: QA & Polish**
    - Verify Dark/Light mode contrast ratios.
    - Verify Arabic text alignment (RTL).
    - Check mobile responsiveness.
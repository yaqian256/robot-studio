# Robot Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished interactive 3D catalog for the Unitree, Fourier, and AgiBot humanoids and quadrupeds listed by Awesome Robot Descriptions.

**Architecture:** A client-side React application owns catalog and interaction state while an imperative Three.js scene renders lightweight procedural assemblies from typed robot definitions. The catalog keeps source links, license data, dimensions, and piece groups separate from rendering so a future asset pipeline can replace procedural geometry with licensed URDF/MJCF meshes without changing the interface.

**Tech Stack:** React 19, TypeScript 5.9, vinext, Vite 8, Three.js, Tailwind CSS 4, lucide-react

---

## File Structure

- `package.json`: scripts and the same core dependencies used by the two reference applications.
- `vite.config.ts`, `tsconfig.json`, `next-env.d.ts`, `vercel.json`: local, type-check, build, and static deployment configuration.
- `app/layout.tsx`: document metadata and global stylesheet.
- `app/robots.ts`: typed company, robot, component, source, dimensions, and morphology catalog.
- `app/pointer-tap.ts`: tap-versus-orbit pointer gesture classifier.
- `app/robot-scene.tsx`: procedural Three.js assembly, picking, labels, explosion, isolation, resizing, and camera API.
- `app/page.tsx`: catalog/search/filter state and the complete accessible explorer UI.
- `app/globals.css`: desktop, tablet, phone, and reduced-motion visual system.
- `scripts/validate-catalog.mjs`: catalog completeness and uniqueness checks.
- `README.md`: scope, controls, source/licensing caveat, and local commands.

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `vercel.json`
- Create: `app/layout.tsx`

- [ ] **Step 1: Define scripts and dependencies**

Create scripts `dev`, `build`, `check`, and `validate`, require Node 22.13+, and pin React 19, vinext, Vite, Tailwind 4, Three.js, and lucide-react to the same dependency family as the references.

- [ ] **Step 2: Configure vinext and TypeScript**

Configure the `@/*` path alias, strict checking, DOM libraries, bundler module resolution, React JSX, and the vinext Vite plugin with Tailwind PostCSS.

- [ ] **Step 3: Add the root layout**

Set the title to `Robot Studio — Humanoids & Quadrupeds`, describe the 12-model catalog, set a device-width viewport, and import `globals.css`.

- [ ] **Step 4: Install and verify**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is generated.

### Task 2: Typed robot catalog

**Files:**
- Create: `app/robots.ts`
- Create: `scripts/validate-catalog.mjs`

- [ ] **Step 1: Define catalog contracts**

Define `CompanyId`, `RobotKind`, `ComponentId`, `RobotSource`, `RobotDefinition`, and `ComponentDefinition`. A robot definition must include maker, kind, summary, year, dimensions, mass, degrees of freedom, palette, morphology ratios, source URLs, license, and component groups.

- [ ] **Step 2: Add all in-scope entries**

Add humanoids `Unitree G1`, `Unitree H1`, `Fourier GR-1`, `Fourier N1`, and `AgiBot X1`; add quadrupeds `Unitree A1`, `Aliengo`, `B1`, `B2`, `Go1`, `Go2`, and `Laikago`. Preserve the format links and license strings from Awesome Robot Descriptions.

- [ ] **Step 3: Describe explorable groups**

Give humanoids head/sensor, torso, pelvis, arm, hand, thigh, shank, and foot groups. Give quadrupeds sensor, trunk, hip, thigh, calf, and foot groups. Each group includes a plain-language purpose and mechanism note used by the details panel.

- [ ] **Step 4: Validate catalog invariants**

The validation script must fail on duplicate IDs, missing companies, missing kinds, missing source links, robots without components, or a catalog size other than 12.

Run: `npm run validate`

Expected: `Validated 12 robots across 3 companies.`

### Task 3: Interactive Three.js assembly

**Files:**
- Create: `app/pointer-tap.ts`
- Create: `app/robot-scene.tsx`

- [ ] **Step 1: Create stable procedural pieces**

Build rounded boxes, capsules, cylinders, joints, and feet from each robot's morphology. Give every visible mesh a stable component ID in `userData`, clone materials per group, and retain assembled transforms for animation.

- [ ] **Step 2: Add scene presentation**

Create a dark blue-black studio scene, environment lighting, two directional lights, a soft floor grid, contact platform, perspective camera, OrbitControls, fog, shadows, and pixel-ratio limits.

- [ ] **Step 3: Add picking and labels**

Raycast only after `PointerTap` accepts the gesture. Highlight the selected group, expose DOM labels for component anchors, and update projected label positions after camera or assembly changes.

- [ ] **Step 4: Add view state**

Interpolate each piece from its home transform to a radial exploded transform, hide unrelated groups during isolation, toggle auto-rotation and labels, and expose `zoom`, `reset`, and `fit` through `SceneHandle`.

- [ ] **Step 5: Handle lifecycle**

Resize with `ResizeObserver`, invalidate rendering on controls/state changes, cancel animation and observers on cleanup, and dispose renderer, materials, geometries, environment maps, and controls.

### Task 4: Responsive explorer interface

**Files:**
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Build catalog navigation**

Add a branded identity block, company pills, humanoid/quadruped filter, search field, result count, and robot cards. Selecting a card changes the scene and clears component isolation.

- [ ] **Step 2: Build component inspection**

Add a numbered component list and details panel with overview/mechanism tabs, specifications, source links, format badges, license text, and an isolate toggle. Selecting either a 3D mesh or list row opens the same details.

- [ ] **Step 3: Build view controls**

Add zoom, reset, auto-rotate, labels, fullscreen, and catalog visibility controls plus a bottom explosion slider with assembled/exploded endpoints.

- [ ] **Step 4: Add loading and empty states**

Show an explicit WebGL error, a no-search-results state, accessible labels, `aria-pressed` state, keyboard focus rings, and live selection text.

- [ ] **Step 5: Make the layout responsive**

Use a three-column desktop overlay, compact side sheets below 960 px, bottom details on phones, safe-area padding, landscape-height handling, scrollable panels, and a reduced-motion override.

### Task 5: Documentation and end-to-end validation

**Files:**
- Create: `README.md`

- [ ] **Step 1: Document scope and provenance**

Explain that the interface is a structural visualization generated from public description metadata, not redistributed OEM CAD or a service-parts catalog. List the 12 included robots, link Awesome Robot Descriptions, and tell readers to follow each source repository's license.

- [ ] **Step 2: Run static validation**

Run: `npm run validate`

Expected: `Validated 12 robots across 3 companies.`

Run: `npm run check`

Expected: TypeScript exits successfully with no diagnostics.

Run: `npm run build`

Expected: vinext/Vite creates a production build successfully.

- [ ] **Step 3: Browser-test desktop**

Run the development server, open the app at 1440×900, select one robot from each company, filter by both morphologies, search for `go`, select a 3D component, isolate it, drag the explosion slider, reset the view, and confirm there are no console errors.

- [ ] **Step 4: Browser-test mobile**

At 390×844, open and close the catalog, select a robot, open a component detail, orbit the model without accidental selection, change explosion, and verify controls do not overlap the model or details.

- [ ] **Step 5: Final repository check**

Run: `git status --short`

Expected: only the intended application, lockfile, documentation, and plan files are new.

# Real Robot Models and Piece Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace procedural placeholder robots with complete upstream URDF visual models whose smallest visual meshes can transition from an assembled robot through a structural explosion into a tidy, selectable inventory.

**Architecture:** Robot metadata declares an upstream raw URDF URL and package-resolution roots. A Three.js scene uses `urdf-loader` to resolve URDF links plus STL/DAE meshes directly from the licensed upstream repositories, promotes every loaded visual mesh to an independently transformable piece, and computes both a structural radial offset and a projected-bounds packed inventory offset. React receives the discovered piece catalogue and drives group selection, individual-piece inspection, isolation, loading progress, and the continuous assembled-to-inventory slider.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Three.js, `urdf-loader`, upstream URDF/STL/DAE assets, Tailwind CSS

---

## File Structure

- `app/robots.ts`: add per-robot URDF URLs, package mappings, model orientation, and source attribution.
- `app/model-pieces.ts`: define runtime piece metadata, infer functional groups from URDF link names, and generate stable human-readable labels.
- `app/explosion-layout.ts`: pack projected piece bounds into non-overlapping rows and calculate complete-inventory camera framing.
- `app/robot-scene.tsx`: replace procedural geometry with URDF loading, individual visual-mesh extraction, picking, transition animation, isolation, labels, progress, errors, and lifecycle cleanup.
- `app/page.tsx`: store selected piece, render discovered piece counts/names, loading state, and distinguish assembly groups from individual parts.
- `app/globals.css`: style loading progress, individual-piece controls, inventory markers, and responsive detail states.
- `scripts/validate-catalog.mjs`: verify every robot has a valid upstream URDF URL and resolution metadata.
- `README.md`: document direct upstream loading, network requirements, licenses, and the exact meaning of “piece.”

### Task 1: URDF source contracts

**Files:**
- Modify: `package.json`
- Modify: `app/robots.ts`
- Modify: `scripts/validate-catalog.mjs`

- [ ] **Step 1: Add the URDF loader dependency**

Add `urdf-loader` to runtime dependencies and run `npm install`.

- [ ] **Step 2: Extend `RobotDefinition`**

Add:

```ts
model:{
  urdf:string;
  packages:Record<string,string>;
  rotation:[number,number,number];
}
```

Use raw GitHub URLs pinned to the upstream branch containing each description. Unitree models resolve `package://*_description/` to their model directory; Fourier GR-1, Fourier N1, and AgiBot X1 use relative mesh paths from their URDF locations.

- [ ] **Step 3: Strengthen catalog validation**

Require every model URL to end in `.urdf`, use HTTPS, and include package mappings for any URDF that uses `package://`.

Run: `npm run validate`

Expected: `Validated 12 upstream URDF models across 3 companies.`

### Task 2: Piece classification and non-overlapping layout

**Files:**
- Create: `app/model-pieces.ts`
- Create: `app/explosion-layout.ts`
- Create: `scripts/validate-layout.mjs`

- [ ] **Step 1: Define a discovered piece**

```ts
export interface ModelPiece {
 id:string;
 label:string;
 link:string;
 component:ComponentId;
 node:THREE.Object3D;
 bounds:THREE.Box3;
 center:THREE.Vector3;
 homePosition:THREE.Vector3;
 radialOffset:THREE.Vector3;
 inventoryOffset:THREE.Vector3;
 materials:THREE.Material[];
}
```

- [ ] **Step 2: Classify URDF links**

Normalize link names and map sensor/head/torso/waist/arm/wrist/hand/hip/thigh/knee/calf/ankle/foot tokens to existing functional groups, falling back to torso for humanoids and trunk for quadrupeds.

- [ ] **Step 3: Pack actual projected bounds**

Project each world-space bounding box onto a fixed overview plane, add size-relative padding, sort by component and height, and place cards into rows near a target width derived from total area and viewport aspect. Return an independent translation for every piece and the total layout width/height.

- [ ] **Step 4: Validate packing math**

Create deterministic rectangles, calculate the inventory layout, and assert no pair overlaps after padding at desktop, portrait, and landscape aspect ratios.

Run: `node scripts/validate-layout.mjs`

Expected: all three layouts report zero intersections.

### Task 3: Replace procedural rendering with complete URDF rendering

**Files:**
- Replace: `app/robot-scene.tsx`

- [ ] **Step 1: Load the selected URDF**

Configure `URDFLoader.packages`, set `parseVisual=true` and `parseCollision=false`, report progress, and surface network/mesh errors instead of silently substituting placeholder geometry.

- [ ] **Step 2: Normalize and frame the assembled model**

Rotate from ROS Z-up into the studio’s Y-up coordinate system, calculate the complete visual bounds, translate the feet to the platform, center the horizontal footprint, and derive camera distance from the bounding sphere and viewport aspect.

- [ ] **Step 3: Extract minimum visual pieces**

Traverse loaded visible meshes. Promote each independently loaded `THREE.Mesh` to a piece wrapper that preserves its assembled world transform, link ancestry, material, and stable ID. Treat URDF primitives as pieces too, but do not split triangles into meaningless pieces.

- [ ] **Step 4: Animate the three-stage transition**

For slider values 0–45, interpolate from assembled transforms to component-aware radial offsets. For 45–100, fade the radial offset out while interpolating to the packed inventory translation. Reframe the camera continuously toward the inventory layout without changing piece orientation or scale.

- [ ] **Step 5: Implement selection and isolation**

Raycast visible piece nodes, prioritize inventory markers near the pointer, highlight selected materials, and isolate either one piece or a functional group. DOM markers show sequential part numbers after the slider crosses the inventory threshold.

- [ ] **Step 6: Dispose all asynchronous resources**

Abort the URDF request when the model changes, ignore late mesh callbacks, remove markers/listeners, and dispose cloned geometries, materials, textures, controls, environment maps, and renderer.

### Task 4: Wire piece exploration into the interface

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add runtime piece state**

Store `pieces`, `selectedPieceId`, loading percentage, and load error. Clear them when selecting another robot.

- [ ] **Step 2: Show actual counts**

Display the discovered visual-piece total in the assembly panel and model profile. Keep functional groups as the primary list, then add a searchable individual-piece selector populated from the loaded URDF.

- [ ] **Step 3: Show piece-specific details**

When a minimum piece is selected, show its human-readable label, source URDF link, functional group, and sequence number. Isolation targets the individual piece when one is selected and otherwise targets the group.

- [ ] **Step 4: Clarify slider states**

Label 0 as `Assembled`, intermediate values as `Exploded`, and 100 as `Parts inventory`. Display progress and disable scene-dependent controls until all visual meshes finish loading.

- [ ] **Step 5: Preserve responsive behavior**

Ensure the inventory framing avoids desktop side panels and mobile bottom panels. Keep the piece selector scrollable and markers legible at 390×844 and short landscape sizes.

### Task 5: Documentation and verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document model provenance**

State that the application fetches URDF and referenced visual meshes directly from Unitree, Fourier, and AgiBot GitHub repositories. Explain that upstream availability and CORS are runtime dependencies and list each license.

- [ ] **Step 2: Document the piece contract**

Define a piece as one independently loaded URDF visual mesh or primitive, not a triangle and not necessarily a manufacturer service part.

- [ ] **Step 3: Run static checks**

Run:

```powershell
npm run validate
npm run check
npm run build
```

Expected: all commands exit successfully.

- [ ] **Step 4: Browser-test representative formats**

Load Unitree G1 (package URLs and DAE), Fourier GR-1 (relative STL), Fourier N1 (branch-relative STL), AgiBot X1 (relative STL), and Unitree Go2 (quadruped). For each, confirm a nonzero piece count, no placeholder geometry, complete assembled framing, selection, and 100% inventory layout.

- [ ] **Step 5: Browser-test responsive inventory**

At 1440×900, 390×844, and 844×390, move to 100%, verify all inventory markers remain inside the usable viewport, verify no packed bounds overlap in the layout validator, select a marker, isolate it, and return to the complete assembly.

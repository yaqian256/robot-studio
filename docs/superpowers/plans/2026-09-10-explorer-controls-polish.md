# Explorer Controls Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix fullscreen exit and make the assembly/navigation controls compact, scroll-safe, and visually clear without covering the robot.

**Architecture:** Keep interaction state in `app/page.tsx`, following the `model-x-studio` pattern: a toggleable vertical component browser and a compact bottom assembly dock with endpoint actions. Keep rendering changes isolated to `app/robot-scene.tsx`, where selection receives a strong emissive highlight without changing model source materials.

**Tech Stack:** React 19, TypeScript, Three.js, CSS, Playwright browser validation

---

### Task 1: Fullscreen Toggle

**Files:**
- Modify: `app/page.tsx`

- [x] **Step 1: Add fullscreen state synchronized to the browser**

Import `useEffect` and `Minimize2`, then listen for `fullscreenchange`:

```tsx
const [fullscreen,setFullscreen]=useState(false);
useEffect(()=>{
 const sync=()=>setFullscreen(document.fullscreenElement===root.current);
 document.addEventListener('fullscreenchange',sync);
 return()=>document.removeEventListener('fullscreenchange',sync);
},[]);
```

- [x] **Step 2: Replace the one-way fullscreen action**

```tsx
const toggleFullscreen=async()=>{
 if(document.fullscreenElement)await document.exitFullscreen();
 else await root.current?.requestFullscreen?.();
};
```

Render `Minimize2` while fullscreen and expose the state through the title and accessible label.

- [x] **Step 3: Verify**

Run: `npm run check`

Expected: TypeScript exits successfully.

### Task 2: Component Browser and Highlight

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `app/robot-scene.tsx`

- [x] **Step 1: Make the assembly browser toggleable**

Add `componentsOpen`. Opening the catalog closes components; choosing a robot closes the catalog and opens components. Add a `Layers3` toggle to the view toolbar.

- [x] **Step 2: Use the reference app's vertical scroll layout**

Place `.components` on the left as a 220px vertical panel with a close button, `max-height`, `overflow:auto`, and compact 38px component rows. This prevents component names from overlapping and removes the wide panel from the robot's lower center.

- [x] **Step 3: Strengthen selected geometry feedback**

Use a vivid fixed selection emissive color and a materially higher emissive intensity:

```ts
material.emissive.copy(baseEmissive).lerp(highlightAccent,highlighted?1:0);
material.emissiveIntensity=highlighted?2.2:baseIntensity;
```

- [x] **Step 4: Verify**

Run: `npm run check`

Expected: TypeScript exits successfully.

Browser check: open a robot with many groups, scroll the component list, select a component, and confirm the selected geometry is unmistakably highlighted.

### Task 3: Compact Assembly Separation Dock

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [x] **Step 1: Match the reference control structure**

Replace the large heading with:

```tsx
<button>Assemble</button>
<div className="explode-control">...slider and value...</div>
<button>All parts</button>
<div className="dock-divider"/>
<label>...Labels switch...</label>
```

Endpoint buttons set the slider to 0 and 100 and clear isolation.

- [x] **Step 2: Reduce the dock footprint**

Use a maximum 630px width, compact endpoint buttons, a 3px track, and bottom-center placement. On phones, use a two-row grid with the slider above the three actions.

- [x] **Step 3: Validate the complete change**

Run:

```powershell
npm run check
npm run validate
npm run build
git --no-pager diff --check
```

Expected: all commands succeed; Vite may retain its existing non-failing chunk-size advisory.

Browser check at desktop and 390x844: verify fullscreen enter/exit, component scrolling, clear highlighting, endpoint buttons, slider, and Labels toggle.

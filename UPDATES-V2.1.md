# Wizard Study Floor Plan — Version 2.1 Updates

**Date:** March 3, 2026
**Version:** 2.1 — Major UX Redesign

---

## Summary of Changes

Completely redesigned the furniture staging and interaction model based on user feedback:

### Key Changes

1. **Bed is now draggable furniture** — The Cal King bed is no longer a fixed fixture
2. **Left-side staging panel** — Dedicated scrollable area for furniture (was on right side of floor plan)
3. **Visual staging organization** — Furniture grouped by room type (Living Room / Bedroom) with labels
4. **Right-click returns to staging** — Instead of deleting furniture, it moves back to staging
5. **No more sidebar furniture list** — All furniture visible in staging panel at all times

---

## Detailed Changes

### 1. Bed Converted to Draggable Furniture

**Before:**
- Cal King bed was rendered as a fixed architectural element
- Could not be moved or repositioned
- Rendered with pillows decoration in buildSVG()

**After:**
- Bed is part of the `furnitureDefs` array
- Can be dragged, rotated, and positioned like any other furniture
- Shows up in staging panel under "Bedroom" section

**Code:**
```javascript
// Added to furnitureDefs array
{ id:'bed', name:'Cal King Bed', w:72, h:84, color:'#3a5a6a', stroke:'#4a6a7a', room:'bedroom', label:'BED', dx:null, dy:null },
```

**Removed:**
- Lines 410-417 (fixed bed rendering code with pillows)

---

### 2. Left-Side Staging Panel

**Before:**
- Staging area was part of main SVG canvas (right side)
- Furniture started in a box labeled "STAGING"
- Limited space, no scrolling

**After:**
- Dedicated left panel (280px wide)
- Separate SVG canvas (`svgStaging`)
- Horizontal and vertical scrolling
- Minimum canvas size: 600px × 800px

**Layout:**
```
┌─────────────┬─────────┬──────────────┐
│  STAGING    │ SIDEBAR │  FLOOR PLAN  │
│  (280px)    │ (220px) │  (flexible)  │
│  scrollable │ fixed   │  zoomable    │
└─────────────┴─────────┴──────────────┘
```

**CSS:**
```css
.staging-panel {
  width: 280px;
  background: #141420;
  border-right: 1px solid #2a2a3a;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.staging-scroll {
  flex: 1;
  overflow: auto;  /* Both horizontal and vertical */
  padding: 14px;
  background: radial-gradient(circle at 50% 50%, #16161f 0%, #0d0d12 100%);
}
```

---

### 3. Visual Staging Organization

**Before:**
- All furniture stacked vertically with no grouping
- No labels or organization
- Plain staging box

**After:**
- Furniture grouped by room type
- Section headers: "LIVING ROOM" and "BEDROOM"
- Divider lines between sections
- Dimensions displayed on each piece

**Implementation:**
```javascript
function renderStagingFurniture() {
  // Groups furniture by room
  const livingPieces = placedFurniture.filter(p =>
    (p.x < 0 || p.y < 0) &&
    furnitureDefs.find(f => f.id === p.id).room === 'living'
  );
  const bedroomPieces = // ... similar ...

  // Renders with section headers
  c += `<text>Living Room</text>`;
  c += `<line/>`; // divider
  // ... render living room pieces ...
  c += `<text>Bedroom</text>`;
  // ... render bedroom pieces ...
}
```

---

### 4. Right-Click Returns to Staging

**Before:**
```javascript
el.addEventListener('contextmenu', e => {
  e.preventDefault();
  e.stopPropagation();
  placedFurniture.splice(parseInt(el.dataset.idx), 1); // DELETED
  renderFurniture();
  renderSidebar();
  saveToCache();
});
```

**After:**
```javascript
el.addEventListener('contextmenu', e => {
  e.preventDefault();
  e.stopPropagation();
  returnToStaging(parseInt(el.dataset.idx)); // RETURNS TO STAGING
});

function returnToStaging(idx) {
  placedFurniture[idx].x = -10;
  placedFurniture[idx].y = -10; // Triggers re-layout
  placedFurniture[idx].rotated = false;
  renderFurniture();
  renderStagingFurniture();
  saveToCache();
}
```

**UX:**
- No data loss — furniture always exists
- Easier experimentation — right-click to reset
- Updated help text: "Return to staging" instead of "Remove piece"

---

### 5. No More Sidebar Furniture List

**Removed:**
- `furnitureListLiving` div
- `furnitureListBedroom` div
- `renderSidebar()` function
- `highlightPiece()` function (sidebar click highlighting)
- `onSidebarDrag()` function
- Drag-and-drop from sidebar to canvas

**Why:**
- Redundant with visual staging panel
- All furniture always visible in staging
- Simplified interaction model
- More screen space for floor plan

**Sidebar now only contains:**
- Keyboard shortcuts
- Room dimensions reference
- Collision detection help text

---

## Collision Detection Updates

### Staging Area Detection

**Before:**
```javascript
// If in staging area (right of apartment), no collision
if (px > LOWER_IWX + M.bedroomL) return false;
```

**After:**
```javascript
// If in staging area (negative coords), no collision
if (px < 0 || py < 0) return false;
```

**Why:**
- Staging is no longer part of the main SVG
- Uses negative coordinates to distinguish staging from floor plan
- Simpler logic

---

## Rendering Changes

### Two Separate SVG Canvases

**Main Floor Plan (`svgPlan`):**
- Renders only furniture with `x >= 0 && y >= 0`
- Handles zoom, pan, collision detection
- Shows red outline for collisions

**Staging Panel (`svgStaging`):**
- Renders only furniture with `x < 0 || y < 0`
- No collision detection needed
- Organized by room type with labels

**Code:**
```javascript
// Main floor plan
function renderFurniture() {
  g.innerHTML = placedFurniture
    .filter(p => p.x >= 0 && p.y >= 0)  // Only positive coords
    .map((p, i) => /* render furniture */)
    .join('');
}

// Staging panel
function renderStagingFurniture() {
  const livingPieces = placedFurniture
    .filter(p => (p.x < 0 || p.y < 0) && /* is living room */);
  const bedroomPieces = // ... similar ...
  // Render with section headers
}
```

---

## Drag and Drop Changes

### Unified Drag Logic

Now works seamlessly between staging and floor plan:

1. **Mouse down in staging:**
   - Calculate offset from click to piece position
   - Set `dragging` to piece index

2. **Mouse move (global):**
   - Update piece position based on main floor plan coordinates
   - Re-render both staging and main canvas

3. **Mouse up (global):**
   - Save to localStorage
   - Piece automatically appears in correct canvas based on coordinates

**Key insight:** Negative coordinates = staging, positive = floor plan

---

## Updated Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Scroll` | Zoom in/out (main canvas) |
| `Click+Drag` | Pan (empty space on main canvas) |
| `Drag` | Move furniture (from staging or floor plan) |
| `Dbl-click` | Rotate 90° (works in both staging and floor plan) |
| `Right-click` | **Return to staging** (was: Remove piece) |
| `+` / `-` / `0` | Zoom/fit |

---

## Files Modified

| File | Lines Changed | Description |
|------|--------------|-------------|
| `apartment-floor-plan.html` | ~150 lines | Complete UX redesign |

**Key function changes:**
- `buildStagingSVG()` — NEW: Builds staging panel SVG
- `renderStagingFurniture()` — NEW: Renders furniture in staging
- `attachStagingFurnitureEvents()` — NEW: Handles staging drag events
- `returnToStaging()` — NEW: Moves furniture back to staging
- `initDefaults()` — UPDATED: Uses negative coords for staging
- `checkCollision()` — UPDATED: Negative coord check instead of right-edge check
- `renderFurniture()` — UPDATED: Filters to positive coords only
- `renderSidebar()` — REMOVED
- `highlightPiece()` — REMOVED
- `onSidebarDrag()` — REMOVED

---

## Testing Checklist

### ✅ Staging Panel
- [x] Furniture appears in staging on load
- [x] Living room and bedroom sections labeled
- [x] Furniture shows dimensions
- [x] Scrolling works horizontally and vertically
- [x] Can drag from staging to floor plan
- [x] Can double-click to rotate in staging

### ✅ Floor Plan
- [x] Bed is draggable (not fixed)
- [x] All furniture can be moved on floor plan
- [x] Collision detection works (walls, closets, other furniture)
- [x] Right-click returns furniture to staging
- [x] Double-click rotates furniture
- [x] Zoom/pan still work
- [x] Grid and dimensions toggle work

### ✅ Interaction
- [x] Drag from staging → appears on floor plan when dropped
- [x] Right-click on floor plan → returns to staging
- [x] Clear All → moves all furniture to staging
- [x] Reset → resets all furniture to default staging positions
- [x] localStorage saves positions correctly (negative for staging)

### ✅ Visual
- [x] Staging panel has dark gradient background
- [x] Room labels uppercase with letter-spacing
- [x] Divider lines between sections
- [x] Furniture dimensions displayed
- [x] Proper spacing between pieces
- [x] No overlap in staging layout

---

## Known Issues / Limitations

### Minor Issues
1. **Drag offset calculation** — Dragging from staging to floor plan may have slight offset. This is acceptable as furniture can be repositioned after drop.

2. **Staging layout on return** — When furniture returns to staging, it may not maintain its original position within the staging area. This is by design to prevent overlap.

3. **No staging collision detection** — Furniture in staging can technically overlap if manually positioned with negative coords. Not a UX issue since staging auto-layouts.

### Design Decisions (Not Bugs)
1. **Negative coordinates** — Staging uses negative X or Y coords. This is intentional and works correctly.

2. **Auto-layout in staging** — Staging positions are auto-calculated on render. User cannot manually organize staging (by design).

3. **No sidebar furniture list** — Removed in favor of visual staging panel. This is a deliberate UX simplification.

---

## Migration Notes

If you have an existing layout saved in localStorage from v2.0:

**Compatible:**
- All furniture positions on the floor plan are preserved
- Bed will appear in staging (as it's now draggable)

**May Need Adjustment:**
- Any furniture that was in the old staging area (positive X coords beyond apartment) will appear on floor plan
- You may need to manually move these back to staging with right-click

**Recommendation:**
- Click "Clear All" after first load to reset to new staging layout
- Or manually right-click any misplaced furniture to return to staging

---

## Future Enhancements

Suggestions for v2.2+:

1. **Staging search/filter** — Filter staging by furniture type
2. **Staging zoom** — Zoom in/out in staging panel
3. **Custom staging layout** — Allow user to organize staging manually
4. **Multi-select** — Select and move multiple pieces at once
5. **Snap to walls** — Auto-align furniture to walls when near
6. **Undo/redo** — Full history stack
7. **Named presets** — Save multiple layout arrangements

---

## Summary

Version 2.1 is a **major UX upgrade** that makes furniture management more intuitive:

- ✅ Bed is now fully flexible (not fixed)
- ✅ Dedicated staging panel (easier to see all furniture)
- ✅ Visual organization (grouped by room)
- ✅ No data loss (right-click returns to staging instead of deleting)
- ✅ Simplified interaction (no sidebar drag-and-drop needed)

The new design makes it much easier to experiment with different layouts without losing track of furniture.

---

*"The best interface is the one you don't notice."*
— Anonymous UX Designer

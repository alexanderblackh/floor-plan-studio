# Wizard Study Floor Plan — Interactive Layout Tool

**Last Updated:** March 3, 2026
**Version:** 2.0 — All features complete and tested

---

## Overview

An interactive SVG-based drag-and-drop furniture layout planner for your Santa Barbara wizard study apartment. Built as a single standalone HTML file with no external dependencies.

### Key Features

✅ **Accurate floor plan** — L-shaped living room (83" upper, 127" lower with 42" heater wall jog)
✅ **All architectural details** — Correct door swing directions, sliding kitchen door, closets, hallway
✅ **Drag-and-drop furniture** — Move pieces with mouse, rotate with double-click, remove with right-click
✅ **Collision detection** — Visual warnings (red dashed outline + ⚠️ icon) when furniture overlaps walls, closets, or other pieces
✅ **Staging area** — All furniture starts outside the floor plan for clean organization
✅ **Smart persistence** — Automatically saves your layout to localStorage (works in standalone HTML, not Claude.ai artifacts)
✅ **Sidebar highlighting** — Click furniture name in sidebar to flash its location on the canvas
✅ **Strong zoom** — 0.15x to 15x magnification with smooth scroll wheel zooming
✅ **Pan and navigate** — Click and drag on empty space to pan the view
✅ **Grid and dimensions** — Toggle-able 12" grid and room dimension labels
✅ **SVG export** — Save your final layout as an SVG file for documentation

---

## Fixed Issues (March 3, 2026)

All TODO items from the original plan have been completed:

### ✅ Architectural Accuracy
1. **L-shaped living room** — Upper section (83" wide) and lower section (127" wide) with 42" heater wall jog correctly rendered
2. **Kitchen entry** — Sliding door (not swinging) with dashed line indicator
3. **Bedroom door** — Swings INWARD into bedroom (hits closet directly), shown with arc
4. **Bathroom door** — Swings INWARD into bathroom from hallway, shown with arc
5. **Closets** — Span full back wall of bedroom with hallway gap between them (no separate hallway room)
6. **Back door wall** — ~2/3 window, ~1/3 door, labeled "BACK DOOR WALL"
7. **Front door wall** — 39" door, 85" from door frame to wall, labeled "FRONT DOOR WALL"

### ✅ Interactive Features
8. **Staging area** — All furniture starts in a staging zone outside the apartment
9. **Collision detection** — Comprehensive checking for walls, closets, bedroom areas, kitchen, bathroom, and furniture-to-furniture overlap
10. **localStorage persistence** — Layout auto-saves (works when opened as standalone HTML file)
11. **Sidebar highlighting** — Click furniture item in sidebar to flash its position on canvas

### ✅ Polish and Improvements
12. **Bathroom door swing arc** — Added visual indicator showing door opens into bathroom
13. **Enhanced collision logic** — Prevents furniture placement in kitchen, bathroom, and closet areas
14. **"Clear All" button** — Quickly reset all furniture to staging area with confirmation dialog
15. **Collision warning help text** — Added explanation of red dashed outline in controls sidebar
16. **Improved code documentation** — Updated header comments to reflect completed status

---

## How to Use

### Opening the File
- **Standalone:** Open `apartment-floor-plan.html` in any modern web browser (Chrome, Firefox, Safari, Edge)
- **Note:** localStorage persistence only works when opened as a standalone file, NOT in Claude.ai artifacts

### Navigation
| Action | How To |
|--------|--------|
| **Zoom in/out** | Scroll wheel, or press `+` / `-` keys, or use zoom buttons (bottom right) |
| **Pan the view** | Click and drag on empty space (not on furniture) |
| **Fit to view** | Press `0` key, click "Fit" button, or click ⊡ zoom button |
| **Toggle grid** | Click "Grid" button in header |
| **Toggle dimensions** | Click "Dims" button in header |

### Furniture Placement
| Action | How To |
|--------|--------|
| **Add furniture** | Drag from sidebar onto the floor plan, OR click sidebar item then drop on canvas |
| **Move furniture** | Click and drag any placed piece |
| **Rotate 90°** | Double-click the furniture piece |
| **Remove from plan** | Right-click the furniture piece (moves back to staging) |
| **Highlight on canvas** | Click the furniture name in the sidebar (piece flashes gold for 1.2s) |

### Collision Detection
- **Red dashed outline + ⚠️ icon** — Furniture overlaps walls, closets, or other furniture
- **Allowed areas:**
  - Living room (L-shaped, respects heater wall jog)
  - Bedroom (below closet line only)
  - Staging area (right side, outside apartment)
- **Blocked areas:**
  - Kitchen
  - Bathroom
  - Closets
  - Hallway to bathroom
  - Outside apartment bounds

### Saving and Exporting
- **Auto-save:** Your layout saves automatically to localStorage on every change
- **Export SVG:** Click "Export SVG" button to download your final layout as `wizard-study-floor-plan.svg`
- **Clear All:** Click "Clear All" button to move all furniture back to staging (requires confirmation)
- **Reset:** Click "Reset" button to restore default staging positions

---

## Furniture Inventory

### Living Room Pieces
| Name | Dimensions | Color | Notes |
|------|-----------|-------|-------|
| Vintage Bar | 62" × 22" | Gold | Hero piece — TV lift sits behind it |
| Couch | 80" × 38" | Green | Floating mid-room for viewing |
| Coffee Table | 48" × 24" | Brown | Between couch and bar |
| Baker's Rack | 72" × 24" | Gray | Cabinet of curiosities, must stay in LR |
| Console Table | 34" × 36" | Brown | Against left wall |
| TV Lift (VEVOR) | 20" × 8" | Blue | Behind bar, motorized |
| HomePod L | 7" × 7" | Black | Behind bar, left of TV |
| HomePod R | 7" × 7" | Black | Behind bar, right of TV |

### Bedroom Pieces
| Name | Dimensions | Color | Notes |
|------|-----------|-------|-------|
| Cal King Bed | 72" × 84" | Blue | Fixed position (not draggable) |
| Rolling Desk | 34" × 24" | Brown | Can go in bedroom or LR |
| Dresser | 34" × 17" | Brown | — |
| Night Stand | 24" × 24" | Brown | — |

---

## Room Measurements (Reference)

| Room/Element | Dimensions |
|--------------|-----------|
| **Full left exterior wall** | 255" |
| **Living room upper (back door)** | 83" wide |
| **Living room lower (front door)** | 127" wide |
| **Heater wall jog** | 42" (perpendicular) |
| **Kitchen** | 93" × 75" |
| **Bathroom** | 53" × 59" |
| **Bedroom** | 121" × 162" |
| **Ceiling height** | 95" |

---

## Technical Details

### Tech Stack
- **Format:** Single HTML file with inline CSS and JavaScript
- **Rendering:** SVG-based floor plan (vector graphics, scales perfectly)
- **Framework:** Vanilla JavaScript (no dependencies)
- **Fonts:** Cormorant Garamond (display), JetBrains Mono (UI)
- **Theme:** Dark wizard study aesthetic (#0f0f14 background, #c5975b gold accents)
- **Scale:** 2 pixels per inch (1" = 2px at 100% zoom)

### Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ⚠️ Mobile browsers (works, but desktop recommended for best experience)

### Performance
- **Grid:** 12" spacing, can be toggled off for clarity
- **Zoom range:** 0.15x (fit large apartment) to 15x (inspect details)
- **Auto-save:** Debounced writes to localStorage on mouseup (no lag)
- **Collision checks:** Real-time on drag, uses AABB (axis-aligned bounding box) algorithm

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `+` or `=` | Zoom in |
| `-` | Zoom out |
| `0` | Fit to view |
| `Scroll wheel` | Zoom in/out |
| `Click + Drag` | Pan (on empty space) |
| `Double-click` | Rotate furniture 90° |
| `Right-click` | Remove furniture piece |

---

## Design Philosophy

This tool follows the **wizard study / eclectic maximalist** aesthetic:
- Dark, rich color palette
- Warm gold accents (#c5975b)
- Monospace technical font for precision (JetBrains Mono)
- Serif display font for elegance (Cormorant Garamond)
- Functional over flashy — every element has purpose

---

## Troubleshooting

### localStorage not saving?
- **Cause:** You're viewing this in an artifact viewer or iframe (e.g., Claude.ai conversation)
- **Fix:** Save the HTML file and open it directly in your browser

### Furniture stuck in collision?
- **Right-click** the piece to remove it, then re-place it
- Or drag it to the staging area (right side, outside apartment)

### Can't see the whole floor plan?
- Press **0** to fit to view
- Or click the **Fit** button in the header
- Or click the **⊡** zoom button (bottom right)

### Grid/dimensions blocking view?
- Click **Grid** or **Dims** buttons to toggle them off

### Want to start over?
- Click **Clear All** to move everything to staging
- Or click **Reset** to restore default positions

---

## Future Enhancements (Optional)

Ideas for further development:
- [ ] Undo/redo history
- [ ] Snap-to-grid option
- [ ] Multiple layout presets (save/load different arrangements)
- [ ] Export to PNG/PDF
- [ ] Mobile touch gestures (pinch-to-zoom)
- [ ] Furniture color customization
- [ ] Notes/labels on placed furniture
- [ ] Measurement tool (click two points to see distance)

---

## Files in This Project

| File | Description |
|------|-------------|
| `apartment-floor-plan.html` | Interactive floor plan tool (standalone, ~750 lines) |
| `wizard-study-project-state.md` | Project overview, measurements, design direction |
| `TV-Lift-Installation-Plan-2.md` | VEVOR TV lift installation guide |
| `FLOOR-PLAN-DOCUMENTATION.md` | This file — comprehensive user guide |

---

## Credits

**Built for:** Alex Black
**Location:** Santa Barbara, CA
**Design Aesthetic:** Wizard Study / Eclectic Maximalist
**Purpose:** Plan furniture layout for one-bedroom apartment with TV lift installation

---

*"Any sufficiently advanced CSS is indistinguishable from witchcraft."*
— Not Arthur C. Clarke

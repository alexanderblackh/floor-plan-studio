# Wizard Study Apartment Floor Plan

Interactive floor plan tool for planning furniture layout in a Santa Barbara one-bedroom apartment.

## Features

- **Accurate L-shaped living room** with heater wall jog
- **Interactive drag-and-drop furniture** with rotation and collision detection
- **Edge-snapping measurement tool** - measure from any furniture edge with auto-locking to straight lines
- **Kitchen fixtures** - counters, sink, oven, fridge pre-positioned
- **Staging area** - all furniture starts in left panel, click to place on floor plan
- **localStorage persistence** - saves your layout automatically
- **SVG export** - export your final layout

## Files

- `apartment-floor-plan.html` - Interactive floor plan tool (standalone, no dependencies)
- `wizard-study-project-state.md` - Project overview, measurements, design direction
- `TV-Lift-Installation-Plan-2.md` - VEVOR TV lift installation guide
- `FLOOR-PLAN-DOCUMENTATION.md` - Comprehensive user guide
- `CHANGELOG.md` - Version history and changes

## Usage

Open `apartment-floor-plan.html` in any modern web browser (Chrome, Firefox, Safari, Edge).

### Controls

- **M** - Toggle measurement mode (edge snapping enabled)
- **Click** furniture in staging to place on floor plan
- **Drag** to reposition
- **Double-click** to rotate 90°
- **Right-click** to return to staging
- **Scroll** to zoom
- **+/-/0** - Zoom in/out/fit
- **ESC** - Clear measurement

### Measurement Tool

1. Press **M** to enter measure mode
2. Click near any furniture edge - it will snap to the closest edge (top/bottom/left/right)
3. Click second point - auto-locks to horizontal or vertical if within 3 inches
4. Distance shown in inches with visual line
5. Edge indicators show which edges you're measuring from (T/B/L/R)

## Furniture Inventory

**Living Room:** 10 pieces
**Bedroom:** 7 pieces
**Kitchen:** 2 movable pieces (microwave, pantry)

All furniture shows dimensions on the map when placed.

## Design Aesthetic

Wizard Study / Eclectic Maximalist - dark academia, cabinet of curiosities, warm lighting, dense with interesting objects.

---

Built with vanilla JavaScript, SVG, and localStorage. No external dependencies.

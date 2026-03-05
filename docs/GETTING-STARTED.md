# Getting Started with Floor Plan Studio

## What is Floor Plan Studio?

Floor Plan Studio is a data-driven floor plan and furniture layout tool. Unlike traditional drawing tools, everything is defined as structured JSON data, making it:

- **Portable**: Export and import your entire floor plan
- **Version-controllable**: Track changes in git
- **Programmable**: Generate plans from data
- **Shareable**: Easy to collaborate and remix

## Quick Start Guide

### 1. Opening the App

Simply open `index.html` in any modern web browser. No installation needed!

### 2. Understanding the Interface

**Left Panel**: Furniture staging area
- All available furniture starts here
- Click to place on floor plan
- Right-click placed furniture to return it here

**Center Canvas**: The floor plan
- Main work area showing rooms and walls
- Pan by clicking and dragging
- Scroll to zoom in/out

**Bottom Toolbar**: Tools and actions
- Measure, Link, Divider modes
- View controls (grid, dimensions)
- Export/Import buttons
- Zoom controls

### 3. Placing Furniture

1. **Click** furniture in the left panel
2. Item appears in staging or on the floor plan
3. **Drag** to reposition
4. **Double-click** to rotate 90°
5. **Right-click** to return to staging

### 4. Essential Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **M** | Measure mode (edge-snapping) |
| **L** | Lock measurement (permanent) |
| **D** | Divider mode (draw zones) |
| **E** | Elevation view |
| **F** | Fixture edit mode |
| **G** | Toggle grid |
| **+/-** | Zoom in/out |
| **0** | Fit to view |
| **Escape** | Cancel/Clear |

### 5. Measuring Distances

1. Press **M** to enter measure mode
2. Click near any furniture edge (snaps automatically)
3. Click second point
4. Measurement appears with distance
5. Press **L** to lock it (make permanent)
6. Press **Escape** to clear temporary measurement

### 6. Using Fixture Edit Mode

Built-in fixtures (counters, closets) can be moved:

1. Press **F** to enter fixture edit mode
2. Click a fixture to select it
3. Drag to reposition
4. Click door handles (blue circles):
   - **Single click**: Rotate swing 90°
   - **Double-click**: Flip hinge to opposite side

### 7. Saving Your Work

Floor Plan Studio auto-saves to your browser's localStorage. Your layout persists between sessions automatically.

### 8. Exporting Your Plan

Click the **Export** dropdown to save:

- **Placement JSON**: Furniture positions only (lightweight)
- **Full Plan JSON**: Complete floor plan + furniture
- **CSV**: Spreadsheet of furniture with dimensions
- **SVG**: Vector graphics for design software
- **PNG**: Raster image at 2x resolution

### 9. Importing Plans

**Method 1**: Use Import menu
- Click Import dropdown
- Select JSON or CSV
- Choose your file

**Method 2**: Drag-and-drop
- Simply drag a JSON or CSV file onto the window
- Auto-detects format and imports

## Common Workflows

### Layout Exploration

1. Place furniture on the floor plan
2. Experiment with different arrangements
3. Use measurements to check clearances
4. Export your favorite layouts as JSON snapshots

### Before Moving Day

1. Measure your actual furniture
2. Edit the furniture definitions in JSON to match
3. Import and arrange on your floor plan
4. Ensure everything fits before moving

### Interior Design Projects

1. Create floor plan from blueprints
2. Add furniture from catalog
3. Use dividers to define zones (dining, seating, workspace)
4. Export as PNG for client presentations

### Real Estate Listings

1. Import property floor plan
2. Stage with generic furniture
3. Export as SVG for marketing materials
4. Share JSON with potential buyers to experiment

## Next Steps

- **[Floor Plans Guide](FLOOR-PLANS.md)** - Learn to create custom floor plans
- **[Furniture Guide](FURNITURE.md)** - Define custom furniture
- **[Features Guide](FEATURES.md)** - Advanced features and tools
- **[Import/Export Guide](IMPORT-EXPORT.md)** - All format specifications

## Tips for New Users

### Start Simple
Begin with the default floor plan. Get comfortable with furniture placement before creating custom plans.

### Use the Grid
Toggle grid with **G** key. Helps with alignment and spacing.

### Snap to Edges
Measurements auto-snap to furniture edges. No need to be precise with mouse clicks.

### Multi-Select
Hold **Shift** and click multiple items. Then use alignment tools to arrange them together.

### Undo is Your Friend
Made a mistake? **Cmd/Ctrl+Z** to undo. Full history tracking.

### Save Variations
Export different arrangements as separate JSON files. Compare layouts easily.

## Troubleshooting

**Q: My furniture disappeared!**
A: Right-click on the floor plan might have returned it to staging. Check the left panel.

**Q: Can't place furniture in a room**
A: Check if the room has `"placeable": true` in the JSON. Kitchen areas are often non-placeable.

**Q: Export isn't working**
A: Check browser console (F12) for errors. Some browsers block downloads - check permissions.

**Q: Changes aren't saving**
A: Floor Plan Studio uses localStorage. Check that it's enabled in your browser settings.

## Getting Help

- **[GitHub Issues](https://github.com/alexanderblackh/floor-plan-studio/issues)** - Report bugs
- **[Documentation](DOCUMENTATION.md)** - Full technical reference
- **[Roadmap](../ROADMAP.md)** - See what's coming next

# Import/Export Guide

Complete guide to all import and export formats in Floor Plan Studio.

## Overview

Floor Plan Studio supports multiple file formats for maximum flexibility:

**Export Formats:**
- Placement JSON (lightweight, positions only)
- Full Plan JSON (complete floor plan + furniture)
- CSV (spreadsheet-friendly)
- SVG (vector graphics)
- PNG (raster image)
- Figma SVG (design tools)

**Import Formats:**
- JSON (auto-detects full plan or placement)
- CSV (furniture positions)
- Drag-and-drop support for all formats

## Export Formats

### 1. Placement JSON

**What it includes:**
- Furniture positions and rotations
- Locked measurements
- Dividers
- View state (zoom, pan)
- Metadata (timestamp, plan name)

**What it excludes:**
- Floor plan structure (rooms, walls)
- Furniture definitions
- Fixtures

**Use when:**
- Saving different furniture arrangements
- Sharing layouts with same floor plan
- Creating layout snapshots
- Comparing arrangement options

**Example:**
```json
{
  "version": "3.0",
  "type": "placement",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "planName": "My Apartment",
  "furniture": [
    {
      "id": "sofa-1",
      "x": 120,
      "y": 80,
      "rotated": false,
      "elevation": 0,
      "stackedOn": null,
      "anchors": [
        { "type": "wall", "wallSide": "left" }
      ]
    }
  ],
  "lockedMeasurements": [
    {
      "start": { "x": 0, "y": 0, "edge": "floor" },
      "end": { "x": 120, "y": 0, "edge": "floor" },
      "shiftKey": false
    }
  ],
  "softDividers": [
    { "from": { "x": 60, "y": 0 }, "to": { "x": 60, "y": 180 } }
  ],
  "zoom": 1.2,
  "panX": 100,
  "panY": 50
}
```

### 2. Full Plan JSON

**What it includes:**
- Complete floor plan (rooms, walls, fixtures)
- Furniture catalog
- Furniture placement
- Locked measurements and dividers
- View state
- All metadata

**Use when:**
- Sharing complete floor plan
- Backup/archival
- Version control (git)
- Creating templates
- Publishing designs

**Example:**
```json
{
  "name": "My Apartment",
  "version": "3.0",
  "units": "inches",
  "scale": 2,
  "type": "full-plan",
  "timestamp": "2024-01-15T10:30:00.000Z",

  "rooms": [
    {
      "id": "living",
      "name": "Living Room",
      "vertices": [[0,0], [120,0], [120,180], [0,180]],
      "color": "#18182288",
      "placeable": true
    }
  ],

  "walls": [
    {
      "from": [0, 0],
      "to": [120, 0],
      "type": "exterior"
    }
  ],

  "fixtures": [
    {
      "id": "counter-1",
      "label": "Kitchen Counter",
      "x": 10, "y": 10, "w": 48, "h": 24,
      "color": "#4a4a3a"
    }
  ],

  "furniture": [
    {
      "id": "sofa-1",
      "name": "Sofa",
      "w": 84, "h": 36,
      "height": 32,
      "surfaceHeight": 18,
      "stackable": false,
      "color": "#8b7355",
      "room": "living"
    }
  ],

  "placement": [
    {
      "id": "sofa-1",
      "x": 120, "y": 80,
      "rotated": false,
      "elevation": 0,
      "stackedOn": null
    }
  ],

  "lockedMeasurements": [...],
  "softDividers": [...],

  "viewState": {
    "zoom": 1.2,
    "panX": 100,
    "panY": 50
  }
}
```

### 3. CSV Export

**What it includes:**
- Furniture list with positions
- Dimensions and properties
- Room assignments

**Use when:**
- Excel/Google Sheets analysis
- Inventory management
- Shopping lists
- Dimension checking

**Format:**
```csv
id,name,x,y,width,height,rotated,elevation,stacked_on,room
sofa-1,"Modern Sofa",120,80,84,36,false,0,,living
coffee-table-1,"Coffee Table",140,120,48,24,false,0,,living
tv-55inch,"55-inch TV",160,100,48,3,false,24,tv-stand,living
```

**Column Reference:**

| Column | Description |
|--------|-------------|
| `id` | Furniture identifier |
| `name` | Display name |
| `x` | X position on floor plan (inches) |
| `y` | Y position on floor plan (inches) |
| `width` | Furniture width (inches) |
| `height` | Furniture depth (inches) |
| `rotated` | Rotation state (true/false) |
| `elevation` | Height from floor (stacking) |
| `stacked_on` | ID of furniture this sits on |
| `room` | Room category |

### 4. SVG Export

**What it includes:**
- Complete vector graphics
- All visible elements
- Scalable for any size

**Use when:**
- Importing to design software (Illustrator, Inkscape)
- Creating presentations
- Printing at high quality
- Further editing needed

**Properties:**
- Infinite scaling without quality loss
- Editable in vector programs
- Can be converted to PDF
- Supports layers and groups

### 5. PNG Export

**What it includes:**
- Raster image at 2x resolution
- All visible elements
- Background color included

**Use when:**
- Quick sharing (email, messaging)
- Website/blog embedding
- Print (at fixed size)
- Social media

**Properties:**
- 2x native resolution (high quality)
- Dark mode background (#0f0f14)
- Fixed dimensions
- Ready for viewing

### 6. Figma SVG Export

**What it includes:**
- Clean SVG optimized for Figma
- Title metadata
- Proper namespacing

**Use when:**
- Importing to Figma
- Design collaboration
- Creating mockups
- UI/UX workflows

**Differences from standard SVG:**
- Figma-compatible formatting
- Optimized attributes
- Better import compatibility

## Import Formats

### JSON Import

Automatically detects and imports:

**Full Plan Detection:**
Has `rooms` and `walls` fields → Full floor plan import

**Placement Detection:**
Has `furniture` array → Furniture placement import

**Auto-detection logic:**
```javascript
if (data.type === 'full-plan' || (data.rooms && data.walls)) {
  // Import as full floor plan
} else if (data.furniture && Array.isArray(data.furniture)) {
  // Import as placement
}
```

**Full Plan Import:**
- Replaces entire floor plan
- Confirmation dialog shown
- Validates structure before importing
- Restores all furniture and fixtures
- Applies view state if included

**Placement Import:**
- Updates furniture positions only
- Keeps current floor plan
- Matches by furniture ID
- Restores measurements and dividers
- Applies view state if included

### CSV Import

**Requirements:**
- Must have `id` column
- Header row required
- Comma-separated values

**Supported columns:**
- `id` (required) - Matches existing furniture
- `x`, `y` - Position updates
- `rotated` - Rotation state
- `elevation` - Stacking height

**Example:**
```csv
id,x,y,rotated
sofa-1,120,80,false
coffee-table-1,140,120,false
```

**Import behavior:**
- Finds furniture by ID
- Updates position if `x` and `y` provided
- Updates rotation if `rotated` provided
- Ignores furniture not in current plan
- Keeps all other properties unchanged

## Drag-and-Drop Import

Simply drag files onto the window:

1. **Drag file** from desktop/folder
2. **Gold overlay** appears with drop zone
3. **Release mouse** to import
4. **Auto-detection** determines format
5. **Confirmation** for full plan imports

**Supported file types:**
- `.json` (auto-detects full plan vs placement)
- `.csv` (furniture positions)

## Import/Export Workflows

### Save Multiple Layouts

1. Arrange furniture (Layout A)
2. Export as `layout-a.json`
3. Rearrange furniture (Layout B)
4. Export as `layout-b.json`
5. Switch between by importing

### Share with Collaborators

**Full workflow:**
1. Export Full Plan JSON
2. Share via email/cloud
3. Collaborator imports
4. Makes changes
5. Exports and sends back
6. Import updates

**Placement only:**
1. Export Placement JSON
2. Share (smaller file)
3. Requires same floor plan
4. Quick layout sharing

### Version Control

```bash
# Initialize git repo
git init

# Commit floor plan
git add floor-plan.json
git commit -m "Initial floor plan"

# Create feature branch
git checkout -b furniture-layout

# Export Full Plan as floor-plan.json
# Edit layout
# Export again

# Commit changes
git add floor-plan.json
git commit -m "Updated furniture arrangement"

# Compare versions
git diff HEAD~1 floor-plan.json
```

### Template Creation

1. Create perfect floor plan
2. Remove all placement data
3. Export as Full Plan JSON
4. Share as template
5. Others import and add furniture

## Validation

### Floor Plan Validation

On import, floor plans are validated:

**Checks:**
- Required fields present (`name`, `rooms`, `walls`)
- Room vertices are valid arrays
- Wall coordinates are numbers
- No duplicate room/fixture IDs
- Proper data types

**Error handling:**
```
Floor plan validation errors:
- Room "living" missing required field: vertices
- Wall from [0, 0] to [100, "abc"] has invalid coordinate
- Duplicate room ID: bedroom
```

### CSV Validation

**Common issues:**

❌ Missing ID column
```csv
name,x,y
Sofa,100,50
```

✅ ID column present
```csv
id,name,x,y
sofa-1,Sofa,100,50
```

❌ Empty file
```csv

```

✅ Header + data
```csv
id,x,y
sofa-1,100,50
```

## Tips

### File Naming

Use descriptive names:
```
floor-plan-my-apartment-full.json      // Full plan
my-apartment-layout-cozy.json          // Placement
my-apartment-layout-open.json          // Placement
my-apartment-furniture-list.csv        // CSV export
my-apartment-floorplan.svg             // Vector export
my-apartment-preview.png               // Raster image
```

### Backup Strategy

1. **Weekly full plan exports** - Version history
2. **Before major changes** - Easy rollback
3. **Layout snapshots** - Compare arrangements
4. **Cloud storage** - Prevent data loss

### Sharing Best Practices

**For collaborators with the app:**
- Share Full Plan JSON

**For viewing only:**
- Share PNG or SVG

**For spreadsheet analysis:**
- Share CSV

**For design tools:**
- Share Figma SVG or standard SVG

## Troubleshooting

### Import Fails

**"Unrecognized JSON format"**
- Check JSON has `rooms` and `walls` OR `furniture` array
- Validate JSON syntax (use jsonlint.com)

**"Validation errors"**
- Read error messages
- Check required fields
- Verify data types (numbers vs strings)

### Export Issues

**Download doesn't start:**
- Check browser download permissions
- Disable popup blockers
- Try different browser

**File is empty:**
- Check browser console for errors
- Verify floor plan data exists
- Try different export format

### CSV Import Not Working

**Furniture not updating:**
- Verify `id` column matches exactly
- Check IDs in furniture catalog
- Ensure CSV has header row

**Position values ignored:**
- Check column names: `x`, `y` (lowercase)
- Verify values are numbers, not text
- Remove quotes around numbers

## Next Steps

- **[Getting Started](GETTING-STARTED.md)** - Basic import/export usage
- **[Floor Plans Guide](FLOOR-PLANS.md)** - Creating exportable plans
- **[Features Guide](FEATURES.md)** - Advanced tools

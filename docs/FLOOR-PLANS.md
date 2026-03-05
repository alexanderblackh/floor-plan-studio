# Floor Plans Guide

Complete guide to creating and editing floor plans in Floor Plan Studio.

## Floor Plan Structure

A floor plan consists of:

1. **Rooms**: Polygon shapes defining spaces
2. **Walls**: Line segments forming the perimeter
3. **Fixtures**: Built-in elements (counters, closets)
4. **Dimensions**: Labeled measurements
5. **Metadata**: Name, units, scale

## Complete Floor Plan Schema

```json
{
  "name": "My Apartment",
  "version": "3.0",
  "units": "inches",
  "scale": 2,

  "rooms": [...],
  "walls": [...],
  "fixtures": [...],
  "dimensions": [...],
  "furniture": [...]
}
```

## Rooms

### Room Object Structure

```json
{
  "id": "living",
  "name": "Living Room",
  "vertices": [[0, 0], [120, 0], [120, 180], [0, 180]],
  "color": "#18182288",
  "placeable": true,
  "labelSize": 16,
  "labelOffset": [0, 30]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (lowercase, no spaces) |
| `name` | string | Yes | Display name shown on floor plan |
| `vertices` | array | Yes | Array of [x, y] coordinates defining the polygon |
| `color` | string | Yes | Fill color in hex format with alpha (#RRGGBBAA) |
| `placeable` | boolean | Yes | Whether furniture can be placed in this room |
| `labelSize` | number | No | Font size for room label (default: 14) |
| `labelOffset` | array | No | [x, y] offset to adjust label position |

### Creating Room Polygons

**Simple Rectangle:**
```json
{
  "id": "bedroom",
  "name": "Bedroom",
  "vertices": [[0, 0], [120, 0], [120, 150], [0, 150]],
  "color": "#16161e88",
  "placeable": true
}
```

**L-Shaped Room:**
```json
{
  "id": "living",
  "name": "Living Room",
  "vertices": [
    [0, 0], [100, 0], [100, 80],
    [150, 80], [150, 200], [0, 200]
  ],
  "color": "#18182288",
  "placeable": true
}
```

**Complex Multi-Jog:**
```json
{
  "id": "bathroom",
  "name": "Bathroom",
  "vertices": [
    [0, 0], [60, 0], [60, 40],
    [50, 40], [50, 80], [20, 80],
    [20, 40], [0, 40]
  ],
  "color": "#15151d88",
  "placeable": true
}
```

### Room Polygon Rules

1. **Vertices must be clockwise** starting from top-left
2. **All edges must be axis-aligned** (no diagonals)
3. **Polygons must be closed** (first and last vertex connect)
4. **No self-intersections** allowed
5. **Keep it simple** - complex shapes can be split into multiple rooms

### Color Guidelines

Use hex colors with alpha channel:
- **Format**: `#RRGGBBAA`
- **Alpha value**: Typically `88` for semi-transparency
- **Dark mode colors**: Use darker base colors
- **Light mode compatibility**: Test in both modes

Examples:
```json
"#18182288"  // Dark gray with 50% opacity
"#1a1a2088"  // Slightly different dark gray
"#c5975b55"  // Gold accent with 33% opacity
```

## Walls

### Wall Object Structure

```json
{
  "from": [0, 0],
  "to": [120, 0],
  "type": "exterior",
  "window": {
    "from": [20, 0],
    "to": [60, 0],
    "sillHeight": 36,
    "height": 48
  },
  "door": {
    "from": [80, 0],
    "to": [110, 0],
    "type": "swing",
    "arc": {
      "cx": 80,
      "cy": 0,
      "r": 30,
      "start": 90,
      "end": 175
    }
  },
  "label": {
    "text": "NORTH WALL",
    "x": 60,
    "y": -12
  },
  "heater": {
    "x": 10,
    "y": 0,
    "w": 24,
    "h": 4
  }
}
```

### Wall Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | array | Yes | Starting point [x, y] |
| `to` | array | Yes | Ending point [x, y] |
| `type` | string | Yes | "exterior", "interior", "door", or "sliding" |
| `window` | object | No | Window configuration |
| `door` | object | No | Door configuration |
| `heater` | object | No | Wall-mounted heater |
| `label` | object | No | Text label for the wall |

### Wall Types

**Exterior Wall** - Thick wall, building perimeter:
```json
{
  "from": [0, 0],
  "to": [120, 0],
  "type": "exterior"
}
```

**Interior Wall** - Thin wall, room divider:
```json
{
  "from": [60, 0],
  "to": [60, 100],
  "type": "interior"
}
```

**Door Opening** - Wall segment with door:
```json
{
  "from": [0, 50],
  "to": [0, 82],
  "type": "door",
  "door": {
    "from": [0, 50],
    "to": [0, 82],
    "type": "swing"
  }
}
```

**Sliding Door** - No swing arc:
```json
{
  "from": [60, 20],
  "to": [60, 50],
  "type": "sliding",
  "door": {
    "from": [60, 20],
    "to": [60, 50],
    "type": "sliding"
  }
}
```

## Windows

### Window Configuration

```json
"window": {
  "from": [30, 0],
  "to": [90, 0],
  "sillHeight": 36,
  "height": 48
}
```

| Field | Type | Description |
|-------|------|-------------|
| `from` | array | Window start point [x, y] |
| `to` | array | Window end point [x, y] |
| `sillHeight` | number | Height from floor to window sill (inches) |
| `height` | number | Window height (inches) |

**Standard window**: Sill at 36", height 48"
**High window**: Sill at 72", height 24" (bathroom privacy)
**Floor-to-ceiling**: Sill at 0", height 96" (sliding glass door)

## Doors

### Swing Doors

```json
"door": {
  "from": [80, 0],
  "to": [110, 0],
  "type": "swing",
  "arc": {
    "cx": 80,
    "cy": 0,
    "r": 30,
    "start": 90,
    "end": 175
  }
}
```

**Arc Parameters:**
- `cx`, `cy`: Hinge point coordinates
- `r`: Swing radius (usually matches door width)
- `start`: Starting angle in degrees
- `end`: Ending angle in degrees

**Common Door Swings:**

North wall, hinge on left, swings inward (90° to 175°):
```json
"arc": { "cx": 80, "cy": 0, "r": 30, "start": 90, "end": 175 }
```

South wall, hinge on right, swings outward (-90° to -5°):
```json
"arc": { "cx": 110, "cy": 100, "r": 30, "start": -90, "end": -5 }
```

East wall, hinge on top, swings left (0° to 85°):
```json
"arc": { "cx": 120, "cy": 50, "r": 30, "start": 0, "end": 85 }
```

West wall, hinge on bottom, swings right (180° to 265°):
```json
"arc": { "cx": 0, "cy": 80, "r": 30, "start": 180, "end": 265 }
```

### Sliding Doors

```json
"door": {
  "from": [60, 20],
  "to": [60, 50],
  "type": "sliding"
}
```

No arc needed - just the opening boundaries.

## Coordinate System

### Origin and Axes

- **Origin**: Top-left corner (0, 0)
- **X-axis**: Left to right (east)
- **Y-axis**: Top to bottom (south)
- **Units**: Inches (default)
- **Scale**: 2 pixels per inch (adjustable)

### Example Coordinate Layout

```
(0,0) ────────────────────── (200,0)
  │                              │
  │                              │
  │     Your Floor Plan          │
  │                              │
  │                              │
(0,150) ────────────────── (200,150)
```

### Measuring in Real Life

1. Use a tape measure to get room dimensions in feet/inches
2. Convert to inches: `10' 6" = 126"`
3. Use these values directly in coordinates

Example: 12' × 10' room
```json
{
  "vertices": [
    [0, 0],      // Top-left
    [144, 0],    // Top-right (12' = 144")
    [144, 120],  // Bottom-right (10' = 120")
    [0, 120]     // Bottom-left
  ]
}
```

## Wall Matching

Walls must align with room vertices exactly:

```json
{
  "rooms": [
    {
      "vertices": [[0, 0], [120, 0], [120, 100], [0, 100]]
    }
  ],
  "walls": [
    { "from": [0, 0], "to": [120, 0] },      // Matches top edge
    { "from": [120, 0], "to": [120, 100] },  // Matches right edge
    { "from": [120, 100], "to": [0, 100] },  // Matches bottom edge
    { "from": [0, 100], "to": [0, 0] }       // Matches left edge
  ]
}
```

## Common Patterns

### Standard Apartment

```json
{
  "name": "Studio Apartment",
  "rooms": [
    {
      "id": "main",
      "name": "Living Space",
      "vertices": [[0, 0], [180, 0], [180, 200], [0, 200]],
      "placeable": true
    },
    {
      "id": "kitchen",
      "name": "Kitchen",
      "vertices": [[180, 0], [240, 0], [240, 80], [180, 80]],
      "placeable": false
    },
    {
      "id": "bath",
      "name": "Bathroom",
      "vertices": [[180, 80], [240, 80], [240, 140], [180, 140]],
      "placeable": true
    }
  ]
}
```

### L-Shaped Living/Dining

```json
{
  "id": "living-dining",
  "name": "Living & Dining",
  "vertices": [
    [0, 0], [150, 0], [150, 100],
    [200, 100], [200, 250], [0, 250]
  ]
}
```

## Tips

### Planning Your Floor Plan

1. **Sketch on paper first** - Plan room layout before coding
2. **Start with outer walls** - Define building perimeter
3. **Add interior walls** - Divide into rooms
4. **Place doors and windows** - Mark openings
5. **Test with furniture** - Ensure spaces work

### Common Mistakes

❌ **Non-axis-aligned vertices**: `[100, 50], [120, 70]` (diagonal)
✅ **Axis-aligned vertices**: `[100, 50], [120, 50]` (horizontal)

❌ **Counterclockwise vertices**: Rooms render inside-out
✅ **Clockwise vertices**: Correct rendering

❌ **Floating-point coordinates**: `[123.456, 78.901]`
✅ **Integer coordinates**: `[123, 79]`

### Validation Checklist

- [ ] All room vertices are clockwise
- [ ] All walls align with room vertices
- [ ] Door arcs have hinge at door endpoint
- [ ] Window bounds are within wall bounds
- [ ] No overlapping rooms (unless intentional)
- [ ] Room IDs are unique
- [ ] All coordinates are integers (or whole numbers)

## Next Steps

- **[Fixtures Guide](FIXTURES.md)** - Add built-in elements
- **[Furniture Guide](FURNITURE.md)** - Define furniture catalog
- **[Import/Export](IMPORT-EXPORT.md)** - Save and share your plans

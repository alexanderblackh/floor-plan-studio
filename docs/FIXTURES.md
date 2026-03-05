# Fixtures Guide

Complete guide to built-in fixtures like counters, closets, and appliances.

## What are Fixtures?

Fixtures are **built-in elements** that are part of the floor plan structure:

- Kitchen counters and islands
- Closets and wardrobes
- Bathroom fixtures (tub, shower, toilet)
- Built-in appliances (oven, fridge, dishwasher)
- Wall-mounted heaters

Unlike furniture, fixtures:
- Start on the floor plan (not in staging)
- Require **Fixture Edit Mode** (F key) to move
- Are saved as part of the floor plan JSON
- Can have doors (like closets)

## Fixture Object Structure

```json
{
  "id": "counter-kitchen-main",
  "label": "Kitchen Counter",
  "x": 10,
  "y": 10,
  "w": 120,
  "h": 24,
  "color": "#4a4a3a",
  "doors": {
    "x": 10,
    "y": 34,
    "w": 120,
    "h": 2,
    "arcs": [
      {
        "cx": 34,
        "cy": 34,
        "r": 24,
        "start": 185,
        "end": 270
      },
      {
        "cx": 34,
        "cy": 34,
        "r": 24,
        "start": 270,
        "end": 355
      }
    ]
  }
}
```

## Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `label` | string | Yes | Display name |
| `x` | number | Yes | X position in inches |
| `y` | number | Yes | Y position in inches |
| `w` | number | Yes | Width in inches |
| `h` | number | Yes | Depth/height in inches |
| `color` | string | Yes | Fill color (hex) |
| `doors` | object | No | Door configuration for closets |

## Common Fixtures

### Kitchen Counter

Standard counter depth is 24":

```json
{
  "id": "counter-1",
  "label": "Kitchen Counter",
  "x": 0,
  "y": 0,
  "w": 96,
  "h": 24,
  "color": "#4a4a3a"
}
```

### Kitchen Island

Typically 36-48" wide, 24-36" deep:

```json
{
  "id": "island",
  "label": "Kitchen Island",
  "x": 50,
  "y": 50,
  "w": 60,
  "h": 36,
  "color": "#4a4a3a"
}
```

### Closet with Sliding Doors

```json
{
  "id": "closet-bedroom",
  "label": "Bedroom Closet",
  "x": 10,
  "y": 10,
  "w": 72,
  "h": 24,
  "color": "#3a3a2a",
  "doors": {
    "x": 10,
    "y": 34,
    "w": 72,
    "h": 2,
    "arcs": [
      {
        "cx": 46,
        "cy": 34,
        "r": 36,
        "start": 185,
        "end": 270
      },
      {
        "cx": 46,
        "cy": 34,
        "r": 36,
        "start": 270,
        "end": 355
      }
    ]
  }
}
```

### Bathtub

Standard tub: 60" × 30":

```json
{
  "id": "bathtub",
  "label": "Bathtub",
  "x": 0,
  "y": 0,
  "w": 60,
  "h": 30,
  "color": "#e8e8e8"
}
```

### Shower Stall

36" × 36" or 48" × 36":

```json
{
  "id": "shower",
  "label": "Shower",
  "x": 0,
  "y": 0,
  "w": 36,
  "h": 36,
  "color": "#d8d8d8"
}
```

### Toilet

Standard: 18" × 28":

```json
{
  "id": "toilet",
  "label": "Toilet",
  "x": 0,
  "y": 0,
  "w": 18,
  "h": 28,
  "color": "#f0f0f0"
}
```

### Bathroom Vanity

24-60" wide, 21" deep:

```json
{
  "id": "vanity",
  "label": "Bathroom Vanity",
  "x": 0,
  "y": 0,
  "w": 48,
  "h": 21,
  "color": "#4a4a3a"
}
```

## Appliances as Fixtures

Built-in appliances should be fixtures:

### Oven/Range

30" or 36" wide:

```json
{
  "id": "oven",
  "label": "Oven",
  "x": 10,
  "y": 0,
  "w": 30,
  "h": 24,
  "color": "#2a2a2a"
}
```

### Refrigerator

Standard: 36" wide, 30-36" deep:

```json
{
  "id": "fridge",
  "label": "Refrigerator",
  "x": 80,
  "y": 0,
  "w": 36,
  "h": 30,
  "color": "#3a3a3a"
}
```

### Dishwasher

Standard: 24" wide:

```json
{
  "id": "dishwasher",
  "label": "Dishwasher",
  "x": 40,
  "y": 0,
  "w": 24,
  "h": 24,
  "color": "#3a3a3a"
}
```

### Sink

Single bowl: 24-30", Double bowl: 33-36":

```json
{
  "id": "sink",
  "label": "Kitchen Sink",
  "x": 45,
  "y": 2,
  "w": 33,
  "h": 20,
  "color": "#c0c0c0"
}
```

## Closet Doors

Closets can have swing doors defined in the `doors` object.

### Single Door Closet

```json
{
  "id": "closet-single",
  "label": "Hall Closet",
  "x": 0,
  "y": 0,
  "w": 36,
  "h": 24,
  "color": "#3a3a2a",
  "doors": {
    "x": 0,
    "y": 24,
    "w": 36,
    "h": 2,
    "arcs": [
      {
        "cx": 18,
        "cy": 24,
        "r": 18,
        "start": 180,
        "end": 270
      }
    ]
  }
}
```

### Double Door Closet

Two doors meeting in the middle:

```json
{
  "id": "closet-double",
  "label": "Master Closet",
  "x": 0,
  "y": 0,
  "w": 72,
  "h": 24,
  "color": "#3a3a2a",
  "doors": {
    "x": 0,
    "y": 24,
    "w": 72,
    "h": 2,
    "arcs": [
      {
        "cx": 36,
        "cy": 24,
        "r": 36,
        "start": 185,
        "end": 270
      },
      {
        "cx": 36,
        "cy": 24,
        "r": 36,
        "start": 270,
        "end": 355
      }
    ]
  }
}
```

### Bi-Fold Doors

Four panels, two pairs:

```json
{
  "id": "closet-bifold",
  "label": "Closet (Bi-fold)",
  "x": 0,
  "y": 0,
  "w": 60,
  "h": 24,
  "color": "#3a3a2a",
  "doors": {
    "x": 0,
    "y": 24,
    "w": 60,
    "h": 2,
    "arcs": [
      {
        "cx": 0,
        "cy": 24,
        "r": 30,
        "start": 95,
        "end": 180
      },
      {
        "cx": 60,
        "cy": 24,
        "r": 30,
        "start": 0,
        "end": 85
      }
    ]
  }
}
```

## Door Arc Angles

Door swing arcs use degrees:

```
        90°
         │
         │
180° ────┼──── 0°/360°
         │
         │
        270°
```

**Common configurations:**

South-facing (opening downward):
```json
{ "start": 180, "end": 270 }  // Left door
{ "start": 270, "end": 360 }  // Right door
```

North-facing (opening upward):
```json
{ "start": 0, "end": 90 }      // Right door
{ "start": 90, "end": 180 }    // Left door
```

East-facing (opening rightward):
```json
{ "start": 90, "end": 180 }    // Top door
{ "start": 180, "end": 270 }   // Bottom door
```

West-facing (opening leftward):
```json
{ "start": 270, "end": 360 }   // Bottom door
{ "start": 0, "end": 90 }      // Top door
```

## Editing Fixtures

### Fixture Edit Mode

1. Press **F** to enter fixture edit mode
2. Yellow handles appear on all fixtures
3. Click a fixture to select it
4. Drag to reposition
5. Changes save automatically

### Editing Doors

With fixture edit mode active:

**Rotate swing (single click):**
- Click the blue circle at hinge point
- Door rotates 90° each click

**Flip hinge (double-click):**
- Double-click the blue circle
- Hinge moves to opposite end
- For double doors: toggles between center-mount and edge-mount

## Colors

**Counters/Cabinetry:**
```json
"#4a4a3a"  // Dark brown/gray
"#3a3a2a"  // Warm dark brown
"#5a5a4a"  // Medium brown
```

**Bathroom Fixtures:**
```json
"#f0f0f0"  // White (toilet, sink)
"#e8e8e8"  // Off-white (tub)
"#d8d8d8"  // Light gray (shower)
```

**Appliances:**
```json
"#2a2a2a"  // Black (oven)
"#3a3a3a"  // Dark gray (fridge)
"#c0c0c0"  // Stainless steel
```

**Closets:**
```json
"#3a3a2a"  // Wood tone
"#4a4a4a"  // Gray
"#5a5a4a"  // Medium wood
```

## Standard Dimensions

| Fixture | Width | Depth |
|---------|-------|-------|
| Kitchen Counter | Variable | 24" |
| Kitchen Island | 36-72" | 24-42" |
| Refrigerator | 30-36" | 30-36" |
| Oven/Range | 30-36" | 24" |
| Dishwasher | 24" | 24" |
| Kitchen Sink | 24-36" | 20-22" |
| Bathroom Vanity | 24-60" | 18-21" |
| Bathtub | 60" | 30-32" |
| Shower Stall | 36-48" | 36" |
| Toilet | 18" | 28-30" |
| Closet (standard) | 24-72" | 24" |
| Linen Closet | 18-24" | 15-18" |

## Tips

### Planning Kitchen Layout

1. **Work Triangle**: Sink, stove, fridge should form a triangle
2. **Counter Space**: 15-18" on each side of cooktop, 24-36" next to sink
3. **Landing Space**: 15" next to fridge for setting down items
4. **Aisle Width**: Minimum 42" between counters, 48" preferred

### Bathroom Layout

1. **Clearances**: 21" in front of toilet, 30" in front of sink
2. **Shower Door**: Needs 30" clearance when open
3. **Vanity Height**: Standard 32-36"
4. **Tub Access**: Ensure you can reach all sides for cleaning

### Closet Design

1. **Depth**: Standard 24", walk-in 72" minimum
2. **Door Width**: Single 24-36", double 48-72"
3. **Hanging Rod**: 12" from back wall
4. **Shelf Height**: 60-72" for single rod, 40" + 80" for double

## Fixtures vs Furniture

| Aspect | Fixtures | Furniture |
|--------|----------|-----------|
| **Location** | Built-in, part of floor plan | Movable, staged separately |
| **Editing** | Fixture Edit Mode (F key) | Normal drag-and-drop |
| **JSON Location** | `floorPlan.fixtures` array | `floorPlan.furniture` catalog |
| **Placement** | Pre-positioned on plan | Starts in staging panel |
| **Examples** | Counters, closets, tubs | Sofas, tables, beds |

## Next Steps

- **[Floor Plans Guide](FLOOR-PLANS.md)** - Integrating fixtures into floor plans
- **[Furniture Guide](FURNITURE.md)** - Movable vs built-in items
- **[Features Guide](FEATURES.md)** - Using fixture edit mode

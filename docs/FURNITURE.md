# Furniture Guide

Complete guide to defining, customizing, and managing furniture in Floor Plan Studio.

## Furniture Object Structure

```json
{
  "id": "sofa-modern-1",
  "name": "Modern Sofa",
  "w": 84,
  "h": 36,
  "height": 32,
  "surfaceHeight": 18,
  "stackable": false,
  "color": "#8b7355",
  "room": "living"
}
```

## Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (no spaces, lowercase) |
| `name` | string | Yes | Display name shown in UI |
| `w` | number | Yes | Width in inches (horizontal when not rotated) |
| `h` | number | Yes | Depth in inches (vertical when not rotated) |
| `height` | number | Yes | Physical height from floor in inches |
| `surfaceHeight` | number | Yes | Height of usable top surface in inches |
| `stackable` | boolean | Yes | Whether other items can be placed on top |
| `color` | string | Yes | Fill color in hex format |
| `room` | string | Yes | Room category for organization |

## Dimensions Explained

### Width and Depth (w, h)

- `w`: Left-to-right dimension (width)
- `h`: Top-to-bottom dimension (depth)
- Measured in inches
- Values swap when furniture is rotated 90°

Example: 7' sofa, 3' deep
```json
{
  "w": 84,  // 7 feet = 84 inches
  "h": 36   // 3 feet = 36 inches
}
```

### Height vs Surface Height

**`height`** - Full physical height of the furniture
- Sofa: 32" (from floor to top of back)
- Dining table: 30" (standard table height)
- Bookshelf: 72" (floor to top shelf)

**`surfaceHeight`** - Where you can place objects
- Sofa: 18" (seat cushion top)
- Dining table: 30" (table surface)
- Bookshelf: 0" (can't place items on top of books)

```json
{
  "id": "dining-table",
  "height": 30,         // Total height
  "surfaceHeight": 30,  // Same - can place items at table level
  "stackable": true
}
```

```json
{
  "id": "sofa",
  "height": 32,         // Back of sofa
  "surfaceHeight": 18,  // Seat cushions
  "stackable": false    // Can't stack on a sofa
}
```

### Stackable Flag

Determines if other furniture can be placed on this item:

**Stackable items** (`stackable: true`):
- Tables
- Desks
- Shelving units
- Counters
- Side tables

**Non-stackable** (`stackable: false`):
- Sofas
- Beds
- Rugs
- Floor lamps
- Chairs

## Room Categories

Organize furniture by room type:

```json
"room": "living"      // Living room furniture
"room": "bedroom"     // Bedroom furniture
"room": "kitchen"     // Kitchen items
"room": "bathroom"    // Bathroom items
"room": "office"      // Office furniture
"room": "dining"      // Dining furniture
"room": "outdoor"     // Patio/deck items
"room": "storage"     // Storage solutions
```

## Standard Furniture Dimensions

### Living Room

**Sofas:**
```json
{
  "id": "sofa-standard",
  "name": "Standard Sofa",
  "w": 84, "h": 36,
  "height": 32,
  "surfaceHeight": 18,
  "stackable": false
}
```

**Loveseat:**
```json
{
  "id": "loveseat",
  "name": "Loveseat",
  "w": 60, "h": 36,
  "height": 32,
  "surfaceHeight": 18,
  "stackable": false
}
```

**Coffee Table:**
```json
{
  "id": "coffee-table",
  "name": "Coffee Table",
  "w": 48, "h": 24,
  "height": 18,
  "surfaceHeight": 18,
  "stackable": true
}
```

**TV Stand:**
```json
{
  "id": "tv-stand",
  "name": "TV Stand",
  "w": 60, "h": 18,
  "height": 24,
  "surfaceHeight": 24,
  "stackable": true
}
```

### Bedroom

**Queen Bed:**
```json
{
  "id": "bed-queen",
  "name": "Queen Bed",
  "w": 60, "h": 80,
  "height": 25,
  "surfaceHeight": 25,
  "stackable": false
}
```

**King Bed:**
```json
{
  "id": "bed-king",
  "name": "King Bed",
  "w": 76, "h": 80,
  "height": 25,
  "surfaceHeight": 25,
  "stackable": false
}
```

**Nightstand:**
```json
{
  "id": "nightstand",
  "name": "Nightstand",
  "w": 24, "h": 18,
  "height": 24,
  "surfaceHeight": 24,
  "stackable": true
}
```

**Dresser:**
```json
{
  "id": "dresser",
  "name": "6-Drawer Dresser",
  "w": 48, "h": 20,
  "height": 36,
  "surfaceHeight": 36,
  "stackable": true
}
```

### Dining

**Dining Table (6-person):**
```json
{
  "id": "dining-table-6",
  "name": "Dining Table (6-person)",
  "w": 72, "h": 36,
  "height": 30,
  "surfaceHeight": 30,
  "stackable": true
}
```

**Dining Chair:**
```json
{
  "id": "dining-chair",
  "name": "Dining Chair",
  "w": 18, "h": 20,
  "height": 36,
  "surfaceHeight": 18,
  "stackable": false
}
```

### Office

**Desk:**
```json
{
  "id": "desk",
  "name": "Office Desk",
  "w": 60, "h": 30,
  "height": 30,
  "surfaceHeight": 30,
  "stackable": true
}
```

**Bookshelf:**
```json
{
  "id": "bookshelf",
  "name": "5-Shelf Bookcase",
  "w": 36, "h": 12,
  "height": 72,
  "surfaceHeight": 0,
  "stackable": false
}
```

## Colors

Use hex colors that work in both light and dark modes:

**Warm Woods:**
```json
"#8b7355"  // Medium brown
"#a0826d"  // Light brown
"#6b5d52"  // Dark brown
"#d4a574"  // Natural wood
```

**Neutrals:**
```json
"#9e9e9e"  // Gray
"#4a4a4a"  // Dark gray
"#e0e0e0"  // Light gray
"#2c2c2c"  // Charcoal
```

**Upholstery:**
```json
"#4a5568"  // Blue-gray
"#718096"  // Slate
"#2d3748"  // Navy
"#742a2a"  // Burgundy
```

**Metals:**
```json
"#c0c0c0"  // Silver
"#ffd700"  // Gold
"#b87333"  // Copper
"#434343"  // Dark metal
```

## Placement Data

When furniture is placed on the floor plan, it gets additional properties:

```json
{
  "id": "sofa-1",
  "x": 120,            // X position on floor plan
  "y": 80,             // Y position on floor plan
  "rotated": false,    // 90° rotation state
  "elevation": 0,      // Height from floor (stacking)
  "stackedOn": null,   // ID of furniture this sits on
  "anchors": [         // Measurement anchors
    {
      "type": "wall",
      "wallSide": "left"
    }
  ]
}
```

## Creating Custom Furniture

### Step 1: Measure Your Furniture

Use a tape measure to get accurate dimensions:

```
Width:  84" (7 feet)
Depth:  36" (3 feet)
Height: 32" (from floor to top)
```

### Step 2: Define the Object

```json
{
  "id": "my-custom-sofa",
  "name": "My Custom Sofa",
  "w": 84,
  "h": 36,
  "height": 32,
  "surfaceHeight": 18,
  "stackable": false,
  "color": "#8b7355",
  "room": "living"
}
```

### Step 3: Choose Surface Height

- **Sitting surface**: Usually 18"
- **Table top**: Usually 30"
- **Counter**: Usually 36"
- **Bar height**: Usually 42"
- **Non-stackable**: Set to 0

### Step 4: Pick a Color

Match your actual furniture color or use a category color:
- Wood furniture: Browns (#8b7355)
- Upholstered: Grays/Blues (#4a5568)
- Metal: Silver/Black (#c0c0c0)

## Furniture Sets

Create matching furniture by using consistent naming and colors:

```json
{
  "furniture": [
    {
      "id": "bedroom-set-bed",
      "name": "Bedroom Set - Bed",
      "w": 60, "h": 80,
      "color": "#6b5d52",
      "room": "bedroom"
    },
    {
      "id": "bedroom-set-dresser",
      "name": "Bedroom Set - Dresser",
      "w": 48, "h": 20,
      "color": "#6b5d52",
      "room": "bedroom"
    },
    {
      "id": "bedroom-set-nightstand-1",
      "name": "Bedroom Set - Nightstand",
      "w": 24, "h": 18,
      "color": "#6b5d52",
      "room": "bedroom"
    }
  ]
}
```

## Stacking Examples

**TV on TV Stand:**
```json
// First define TV stand
{
  "id": "tv-stand",
  "surfaceHeight": 24,
  "stackable": true
}

// Then define TV
{
  "id": "tv-55inch",
  "w": 48,
  "h": 3,
  "height": 32,
  "stackable": false
}

// When placed, TV gets:
{
  "elevation": 24,      // Sits at TV stand surface
  "stackedOn": "tv-stand"
}
```

**Lamp on Nightstand:**
```json
// Nightstand
{
  "id": "nightstand",
  "surfaceHeight": 24,
  "stackable": true
}

// Lamp
{
  "id": "table-lamp",
  "w": 8,
  "h": 8,
  "height": 18,
  "stackable": false
}

// Placement
{
  "elevation": 24,
  "stackedOn": "nightstand"
}
```

## Tips

### Realistic Dimensions

Research standard furniture sizes or measure your actual pieces:
- **Sofas**: 72-96" wide, 32-40" deep
- **Beds**: Queen (60×80), King (76×80), Twin (39×75)
- **Tables**: Dining (36" wide min), Coffee (40-60" wide)
- **Chairs**: 18-24" wide, 18-22" deep

### Organization

Group furniture by room type using the `room` field. This makes it easier to find items in the staging panel.

### Color Consistency

Use a limited color palette (5-7 colors) for visual cohesion. Consider creating a color scheme:

```json
const COLORS = {
  WOOD_DARK: "#6b5d52",
  WOOD_MEDIUM: "#8b7355",
  WOOD_LIGHT: "#a0826d",
  UPHOLSTERY_GRAY: "#4a5568",
  METAL: "#c0c0c0"
};
```

### Naming Conventions

Use descriptive IDs with categories:
- `sofa-modern-gray`
- `table-dining-wood-6person`
- `chair-office-ergonomic`
- `bed-queen-platform`

## Common Mistakes

❌ **Unrealistic dimensions**: A 10' wide bed won't fit
✅ **Measured dimensions**: Use tape measure on real furniture

❌ **Surface higher than total height**: `surfaceHeight: 40, height: 30`
✅ **Logical heights**: Surface must be ≤ total height

❌ **Everything stackable**: Makes no sense for beds, sofas
✅ **Selective stacking**: Only flat surfaces should be stackable

❌ **Random colors**: Too many different colors
✅ **Cohesive palette**: 5-7 coordinated colors

## Next Steps

- **[Fixtures Guide](FIXTURES.md)** - Built-in elements vs furniture
- **[Features Guide](FEATURES.md)** - Using elevation view and stacking
- **[Import/Export](IMPORT-EXPORT.md)** - Sharing furniture definitions

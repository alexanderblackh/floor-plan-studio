# Floor Plan Studio Documentation

**Comprehensive guides for creating and managing floor plans in Floor Plan Studio.**

## Quick Links

### 📖 Guides

- **[Getting Started](docs/GETTING-STARTED.md)** - First steps, basic usage, workflows
- **[Floor Plans](docs/FLOOR-PLANS.md)** - Creating rooms, walls, doors, windows
- **[Furniture](docs/FURNITURE.md)** - Defining furniture, dimensions, stacking
- **[Fixtures](docs/FIXTURES.md)** - Counters, closets, built-in elements
- **[Import/Export](docs/IMPORT-EXPORT.md)** - All file formats and workflows

### 🤖 For AI Assistants

- **[LLM Instructions](LLM-INSTRUCTIONS.txt)** - Give this to ChatGPT, Claude, etc. to generate floor plans from descriptions

### 🗺️ Future

- **[Roadmap](ROADMAP.md)** - Upcoming features and development priorities

---

## What is Floor Plan Studio?

Floor Plan Studio is a **data-driven** floor plan and furniture layout tool. Unlike traditional drawing programs, everything is defined as structured JSON data:

```json
{
  "name": "My Apartment",
  "rooms": [...],
  "walls": [...],
  "furniture": [...]
}
```

This approach makes floor plans:
- ✅ **Portable** - Export and import anywhere
- ✅ **Version-controllable** - Track in git, compare versions
- ✅ **Programmable** - Generate from data, scripts, AI
- ✅ **Shareable** - Easy collaboration and remixing

---

## Core Concepts

### 1. Rooms as Polygons

Rooms are closed polygons defined by vertex coordinates:

```json
{
  "id": "living",
  "vertices": [[0, 0], [120, 0], [120, 180], [0, 180]]
}
```

Supports any axis-aligned shape: rectangles, L-shapes, complex multi-jog layouts.

### 2. Coordinate System

- **Origin**: Top-left (0, 0)
- **X-axis**: Left to right (east)
- **Y-axis**: Top to bottom (south)
- **Units**: Inches by default
- **Scale**: 2 pixels per inch in UI

### 3. 2.5D Elevation Model

Furniture has height and can be stacked:

```json
{
  "height": 30,         // Total height
  "surfaceHeight": 30,  // Where items can be placed
  "stackable": true     // Allows stacking
}
```

### 4. Data-First Design

Everything is JSON:
- Floor plan structure
- Furniture catalog
- Placement data
- Measurements
- View state

---

## JSON Structure Overview

### Basic Floor Plan

```json
{
  "name": "My Apartment",
  "version": "3.0",
  "units": "inches",
  "scale": 2,

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
      "name": "Modern Sofa",
      "w": 84, "h": 36,
      "height": 32,
      "surfaceHeight": 18,
      "stackable": false,
      "color": "#8b7355",
      "room": "living"
    }
  ]
}
```

See detailed guides for complete field references and examples.

---

## Quick Reference

### Coordinates
- Origin: (0, 0) at top-left
- X-axis: Left → Right
- Y-axis: Top → Bottom
- Units: Inches

### Room Vertices
- Must be clockwise
- Must be axis-aligned (no diagonals)
- Use integers (whole numbers)

### Colors
- Format: `#RRGGBBAA` (hex with alpha)
- Rooms: `88` alpha for semi-transparency
- Fixtures: Solid colors for counters, appliances

### Common Dimensions
- Sofa: 84"w × 36"h
- Queen Bed: 60"w × 80"h
- Dining Table: 72"w × 36"h
- Kitchen Counter: 24" deep
- Doors: 30-36" wide

---

## Essential Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **M** | Measure mode |
| **L** | Lock measurement |
| **D** | Divider mode |
| **E** | Elevation view |
| **F** | Fixture edit mode |
| **G** | Toggle grid |
| **U** | Cycle units |
| **Cmd+Z** | Undo |
| **Escape** | Exit mode / Clear |

See [Getting Started](docs/GETTING-STARTED.md) for complete shortcuts reference.

---

## Learn More

### Detailed Guides

- **[Getting Started](docs/GETTING-STARTED.md)** - Installation, interface, basic workflows
- **[Floor Plans](docs/FLOOR-PLANS.md)** - Rooms, walls, doors, windows, coordinates
- **[Furniture](docs/FURNITURE.md)** - Dimensions, stacking, properties, catalog
- **[Fixtures](docs/FIXTURES.md)** - Counters, closets, appliances, built-ins
- **[Import/Export](docs/IMPORT-EXPORT.md)** - All file formats, workflows, validation

### Tools

- **[LLM Instructions](LLM-INSTRUCTIONS.txt)** - Generate floor plans with AI assistants
- **[Roadmap](ROADMAP.md)** - Upcoming features and development plans

---

## Need Help?

- **Questions**: [GitHub Issues](https://github.com/alexanderblackh/floor-plan-studio/issues)
- **Examples**: See sample floor plans in the repo
- **Community**: Share your creations and get feedback

---

*Made with ❤️ using vanilla JavaScript, SVG, and localStorage.*

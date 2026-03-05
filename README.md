# Floor Plan Studio

**A data-driven floor plan and furniture layout tool with full JSON/CSV import/export support.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Floor Plan Studio Screenshot](screenshot.png)

Floor Plan Studio is a browser-based tool for creating, editing, and arranging floor plans. Define rooms as polygons, import/export via JSON or CSV, and arrange furniture with drag-and-drop precision.

## ✨ Features

- **📐 Polygon-Based Rooms**: L-shapes, jogs, any axis-aligned layout
- **🎨 Data-Driven**: Everything is JSON - portable, version-controllable, remixable
- **🪑 Drag-and-Drop Furniture**: Intuitive placement with rotation and collision detection
- **📏 Measurement Tools**: Edge-snapping measurements, permanent locked measurements
- **🔗 Anchors**: Link furniture to walls or other furniture with persistent measurements
- **📊 2.5D Elevation**: Stack furniture, view head-on wall elevations
- **⚡ Multi-Select & Align**: Align multiple items to each other or to walls
- **🎯 Fixture Edit Mode**: Move and rotate built-in fixtures (counters, closets, doors)
- **📂 Import/Export**: JSON (full plan or placement), CSV, SVG, PNG
- **↩️ Undo/Redo**: Full history with Cmd+Z support
- **📱 Drag-and-Drop Import**: Simply drop JSON/CSV files onto the window
- **🎛️ Visual Dividers**: Draw room zone separators
- **🌓 Light/Dark Mode**: Automatic or manual theme switching
- **💾 Auto-Save**: Changes saved to localStorage automatically

## 🚀 Quick Start

1. **Open the app**: Open `index.html` in a modern browser
2. **Drag furniture**: From left sidebar onto the floor plan
3. **Rotate**: Double-click furniture to rotate 90°
4. **Measure**: Press **M** to enter measure mode
5. **Export**: Click Export dropdown to save as JSON, CSV, SVG, or PNG

## 📖 Documentation

- **[Full Documentation](DOCUMENTATION.md)** - Comprehensive guide to JSON structures, coordinates, and advanced features
- **[Roadmap](ROADMAP.md)** - Upcoming features including WYSIWYG editor, 3D visualization, and mobile support

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **M** | Measure mode |
| **L** | Lock measurement (make permanent) |
| **D** | Divider mode |
| **E** | Elevation view |
| **F** | Fixture edit mode |
| **U** | Cycle units |
| **G** | Toggle grid |
| **Shift+M** | Show all measurements |
| **Cmd/Ctrl+Z** | Undo |
| **Cmd/Ctrl+Shift+Z** | Redo |

## 💡 Use Cases

- **Home Layout Planning**: Design room arrangements before moving furniture
- **Interior Design**: Experiment with furniture layouts and space planning
- **Real Estate**: Create property floor plans for listings
- **Office Planning**: Optimize workspace layouts
- **Data Visualization**: JSON-based plans can be generated programmatically
- **Architecture Students**: Learn space planning with precise measurements

## 🏗️ Architecture

Floor Plan Studio is a vanilla JavaScript application built with:

- **ES Modules**: Modern, dependency-free architecture
- **SVG Rendering**: Crisp, scalable graphics
- **localStorage**: Client-side persistence
- **Data-First Design**: Everything is JSON
- **Zero Build Step**: Just HTML, CSS, and JavaScript

## 📄 JSON Floor Plan Format

```json
{
  "name": "My Apartment",
  "rooms": [
    {
      "id": "living",
      "name": "Living Room",
      "vertices": [[0,0], [120,0], [120,180], [0,180]],
      "placeable": true
    }
  ],
  "walls": [
    {
      "from": [0, 0],
      "to": [120, 0],
      "type": "exterior",
      "door": {
        "from": [40, 0],
        "to": [70, 0],
        "type": "swing"
      }
    }
  ],
  "furniture": [
    {
      "id": "sofa-1",
      "name": "Sofa",
      "w": 84,
      "h": 36,
      "height": 32,
      "color": "#8b7355"
    }
  ]
}
```

See [DOCUMENTATION.md](DOCUMENTATION.md) for complete schema reference.

## 🎯 Roadmap Highlights

- ✏️ **WYSIWYG Floor Plan Editor**: Draw rooms, add doors/windows visually
- 🌐 **Three.js 3D Visualization**: Walk through your space in 3D
- 📱 **Mobile Support**: Touch-optimized interface for iOS/Android
- 🤝 **Real-Time Collaboration**: Work on plans together
- 🔌 **Integrations**: Import from SketchUp, export to Blender, Figma plugins

See the full [Roadmap](ROADMAP.md) for details.

## 🛠️ Development

### Local Setup

```bash
# Clone the repository
git clone https://github.com/alexanderblackh/floor-plan-studio.git
cd floor-plan-studio

# Open in browser (no build required!)
open index.html
```

### File Structure

```
floor-plan-studio/
├── index.html          # Main app
├── js/
│   ├── app.js         # Entry point, events
│   ├── data.js        # Floor plan schema, state
│   ├── render.js      # SVG rendering
│   ├── furniture.js   # Furniture drag-and-drop
│   ├── fixtures.js    # Fixture editing
│   ├── measurement.js # Measurement tools
│   ├── io.js          # Import/export
│   ├── history.js     # Undo/redo
│   └── ...
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Lucide Icons**: Beautiful icon set
- **JetBrains Mono**: Excellent monospace font
- **Cormorant Garamond**: Elegant serif font

## 📮 Contact

- **GitHub Issues**: [Report bugs or suggest features](https://github.com/alexanderblackh/floor-plan-studio/issues)
- **GitHub Repository**: [alexanderblackh/floor-plan-studio](https://github.com/alexanderblackh/floor-plan-studio)

---

Made with ❤️ by Alexander Black

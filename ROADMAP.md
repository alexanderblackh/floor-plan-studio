# Floor Plan Studio Roadmap

This document outlines planned features and future directions for Floor Plan Studio.

---

## 🎯 Phase 1: WYSIWYG Floor Plan Editor

**Goal**: Allow users to create and edit floor plans entirely within the UI, without manually editing JSON.

### Room Creation Tools
- [ ] **Draw Room Mode**: Click to place vertices, auto-close polygon
- [ ] **Rectangle Tool**: Click-drag to create simple rectangular rooms
- [ ] **Edit Vertices**: Click and drag room corners to reshape
- [ ] **Add/Remove Vertices**: Insert new corners or remove existing ones
- [ ] **Room Properties Panel**: Edit name, color, label settings in sidebar

### Wall Editing
- [ ] **Add Wall**: Click two points to create a wall segment
- [ ] **Delete Wall**: Click wall to remove it
- [ ] **Split Wall**: Add door/window splits an existing wall into segments
- [ ] **Wall Properties**: Edit thickness, type (interior/exterior)

### Door & Window Tools
- [ ] **Add Door**: Click wall segment, specify width and swing direction
- [ ] **Add Window**: Click wall segment, specify width and sill height
- [ ] **Interactive Swing Editor**: Drag arc handle to adjust door swing angle
- [ ] **Door Type Switcher**: Toggle between swing, sliding, pocket, bifold
- [ ] **Window Properties**: Height, sill height, type (single, double, bay)

### Fixture Creation
- [ ] **Fixture Library**: Pre-built fixtures (counters, islands, tubs, closets)
- [ ] **Custom Fixture Tool**: Draw rectangular fixture, add to floor plan
- [ ] **Fixture Doors**: Add swing doors to closets with visual editor
- [ ] **Appliance Integration**: Pre-configured kitchen appliances (oven, fridge, dishwasher)

### Furniture Creator
- [ ] **Custom Furniture Tool**: Define dimensions, height, stackability
- [ ] **Furniture Templates**: Common furniture types as starting points
- [ ] **Color Picker**: Visual color selector with presets
- [ ] **Category Assignment**: Organize furniture by room type
- [ ] **2.5D Properties**: Set height, surface height, stackable flag

---

## 🌐 Phase 2: Three.js 3D Visualization

**Goal**: Provide realistic 3D walkthrough and visualization of floor plans.

### 3D Rendering
- [ ] **3D View Toggle**: Switch between 2D floor plan and 3D perspective
- [ ] **Camera Controls**: Orbit, pan, zoom around the 3D scene
- [ ] **Furniture Models**: Extruded 3D representations of furniture
- [ ] **Wall Heights**: Configurable ceiling heights per room
- [ ] **Realistic Materials**: Wood, fabric, metal textures

### Navigation
- [ ] **First-Person Mode**: Walk through the space
- [ ] **Preset Camera Angles**: Quick views from doorways, corners
- [ ] **Minimap**: 2D overview showing camera position
- [ ] **VR Support**: WebXR integration for VR headsets

### Advanced 3D Features
- [ ] **Lighting System**: Windows as light sources, adjustable time of day
- [ ] **Shadows**: Real-time shadow casting
- [ ] **Reflections**: Mirror and glass reflections
- [ ] **Custom 3D Models**: Import GLB/GLTF furniture models
- [ ] **Export 3D**: Export scene as GLB for use in Blender, Unity, etc.

---

## 📱 Phase 3: Mobile Support

**Goal**: Full-featured mobile experience for iOS and Android.

### Responsive Design
- [ ] **Touch Gestures**: Pinch-zoom, two-finger pan
- [ ] **Mobile Toolbar**: Collapsible, swipeable toolbar
- [ ] **Touch-Optimized Controls**: Larger hit targets, gesture hints
- [ ] **Portrait/Landscape**: Adaptive layouts for both orientations

### Mobile-Specific Features
- [ ] **Photo Import**: Use camera to capture room dimensions
- [ ] **AR Ruler**: AR-based room measurement tool
- [ ] **Share Button**: Export and share via native share sheet
- [ ] **Offline Mode**: Service worker for offline editing
- [ ] **Progressive Web App**: Installable as mobile app

### Performance Optimization
- [ ] **Lazy Loading**: Only render visible furniture
- [ ] **Reduced Rendering**: Simplified graphics for mobile
- [ ] **Battery Optimization**: Reduce frame rate when idle

---

## 🎨 Phase 4: Collaboration & Sharing

**Goal**: Enable real-time collaboration and easy sharing.

### Multiplayer Editing
- [ ] **Live Cursors**: See where other users are working
- [ ] **Conflict Resolution**: Handle simultaneous edits gracefully
- [ ] **Chat/Comments**: In-app communication
- [ ] **Version History**: Track changes, revert to previous versions

### Sharing & Publishing
- [ ] **Public Gallery**: Share floor plans with community
- [ ] **Embed Code**: Embed interactive floor plan in websites
- [ ] **QR Code**: Generate QR code to view plan on mobile
- [ ] **PDF Export**: High-quality PDF with measurements
- [ ] **Print Layouts**: Optimized layouts for printing

### Cloud Sync
- [ ] **Account System**: Optional accounts for cloud save
- [ ] **Cross-Device Sync**: Access plans from any device
- [ ] **Cloud Backup**: Automatic backups to prevent data loss

---

## 🔧 Phase 5: Advanced Tools

### Smart Layout
- [ ] **Auto-Arrange**: AI-powered furniture arrangement suggestions
- [ ] **Traffic Flow**: Analyze and visualize walking paths
- [ ] **Clearance Checker**: Highlight tight spaces, doorway conflicts
- [ ] **Accessibility Audit**: Check ADA compliance for wheelchair access

### Cost Estimation
- [ ] **Material Calculator**: Calculate flooring, paint needed
- [ ] **Furniture Budget**: Track furniture costs
- [ ] **Shopping List**: Export furniture list with dimensions

### Extended Measurements
- [ ] **Area Calculator**: Room square footage with exclusions
- [ ] **Perimeter Tool**: Calculate wall length for baseboards
- [ ] **Volume Calculator**: Calculate room volume for HVAC sizing
- [ ] **Custom Formulas**: User-defined calculation formulas

---

## 🎓 Phase 6: Learning & Templates

### Templates & Presets
- [ ] **Floor Plan Templates**: Studio, 1BR, 2BR, etc.
- [ ] **Room Presets**: Pre-configured room layouts
- [ ] **Style Packs**: Modern, traditional, minimalist furniture sets
- [ ] **Template Gallery**: Community-contributed templates

### Educational Features
- [ ] **Interactive Tutorial**: Step-by-step walkthrough
- [ ] **Tooltips**: Contextual help throughout the app
- [ ] **Video Guides**: Embedded tutorial videos
- [ ] **Design Tips**: Best practices and layout suggestions

---

## 🔌 Phase 7: Integrations

### Import From
- [ ] **Image to Floor Plan**: Upload image, trace walls
- [ ] **PDF Import**: Import architectural drawings
- [ ] **DXF/DWG**: Import CAD files
- [ ] **SketchUp**: Import SketchUp models
- [ ] **IFC**: Import BIM models

### Export To
- [ ] **Figma Plugin**: Export as Figma components
- [ ] **Blender**: Export with materials and textures
- [ ] **Unity/Unreal**: Game engine packages
- [ ] **Revit**: BIM-compatible export

### API
- [ ] **REST API**: Programmatic access to floor plans
- [ ] **Webhooks**: Real-time notifications
- [ ] **JavaScript SDK**: Embed Floor Plan Studio in other apps
- [ ] **CLI Tool**: Command-line batch processing

---

## 🚀 Additional Ideas

### Rendering & Export
- [ ] **Photo-Realistic Rendering**: High-quality ray-traced renders
- [ ] **Animation Export**: Create walkthrough videos
- [ ] **360° Panoramas**: Virtual tour images
- [ ] **Isometric View**: Axonometric projection rendering

### Advanced Modeling
- [ ] **Multi-Story Support**: Multiple floors with stairways
- [ ] **Outdoor Spaces**: Decks, patios, gardens
- [ ] **Curved Walls**: Non-axis-aligned walls
- [ ] **Sloped Ceilings**: Vaulted, cathedral ceilings
- [ ] **Custom Moldings**: Baseboards, crown molding, wainscoting

### Specialized Tools
- [ ] **Electrical Plan**: Outlets, switches, light fixtures
- [ ] **Plumbing Plan**: Water lines, drains
- [ ] **HVAC**: Vents, ducts, thermostat placement
- [ ] **Landscape Mode**: Trees, plants, hardscaping

### Business Features
- [ ] **Client Portal**: Share plans with clients for approval
- [ ] **Revision Tracking**: Track client-requested changes
- [ ] **Proposals**: Generate professional proposals with plans
- [ ] **Multi-Project Management**: Organize multiple floor plans
- [ ] **Team Accounts**: Collaborate with team members

### Accessibility
- [ ] **Screen Reader Support**: Full ARIA compliance
- [ ] **Keyboard-Only Navigation**: Complete keyboard control
- [ ] **High Contrast Mode**: Enhanced visibility
- [ ] **Text-to-Speech**: Announce measurements and actions
- [ ] **Dyslexia-Friendly Font**: Optional font for readability

### Data & Analytics
- [ ] **Usage Analytics**: Track popular features
- [ ] **Plan Statistics**: Average room sizes, furniture density
- [ ] **Export Analytics**: Most exported formats
- [ ] **Performance Metrics**: Load times, render performance

---

## 🌟 Community Features

- [ ] **Forum/Discord**: Community discussion
- [ ] **Feature Voting**: Let users vote on next features
- [ ] **Open Plugin System**: Third-party extensions
- [ ] **Marketplace**: Buy/sell furniture models, templates
- [ ] **Design Challenges**: Monthly floor plan competitions

---

## 📊 Priority Order (Tentative)

1. **WYSIWYG Floor Plan Editor** - Most requested feature
2. **Mobile Support** - Expand user base significantly
3. **3D Visualization** - High impact on user experience
4. **Templates & Presets** - Lower barrier to entry
5. **Collaboration** - Enable professional use cases
6. **Advanced Tools** - Serve power users
7. **Integrations** - Fit into existing workflows

---

## Contributing Ideas

Have ideas for Floor Plan Studio? We'd love to hear them!

- **GitHub Issues**: [Report bugs or suggest features](https://github.com/alexanderblackh/floor-plan-studio/issues)
- **Pull Requests**: Contribute code directly
- **Discussions**: Share ideas and vote on proposals

---

*This roadmap is subject to change based on community feedback and development priorities.*

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

**Goal**: Full-featured mobile experience for iOS and Android, delivered in two sub-phases.

---

### Phase 3A: Mobile Preview *(implement first)*

**Goal**: Read-only mobile experience. Users can import a floor plan, explore it, and change view settings — no editing. This is the minimum useful mobile experience and the foundation all Phase 3B work builds on.

#### Scope
- Import a floor plan via JSON file picker or drag-and-drop
- Pan around the canvas with one finger
- Pinch-to-zoom in and out
- Switch between view settings (units, grid, labels, room colors)
- Open and navigate the Elevation panel
- Switch elevation wall selection
- Light/dark mode toggle
- Export (PNG/SVG) — read-only output

#### Out of Scope for 3A
Anything that modifies the floor plan: furniture drag, fixture editing, measurements, dividers, anchors.

#### Technical Work

**Touch & Input**
- [x] Add `touchstart` / `touchmove` / `touchend` handlers alongside existing mouse events in `app.js`
- [x] Unify coordinate extraction into a helper (`getEventPoint(e)`) that handles both `e.clientX` and `e.touches[0].clientX`
- [x] Implement one-finger pan on the canvas (map to existing `panX`/`panY` state)
- [x] Implement pinch-to-zoom using two-touch distance delta (map to existing `zoom` state)
- [x] Add `touch-action: none` to canvas container so browser doesn't scroll the page during pan/zoom
- [x] Add `-webkit-touch-callout: none` to prevent iOS long-press context menus

**Layout & Responsive**
- [x] Make canvas SVG size responsive to container width/height instead of fixed pixel values (`render.js`)
- [x] Add a mobile breakpoint (≤ 768px) that hides the staging/furniture panel entirely
- [x] Collapse the floating toolbar to a minimal icon strip on mobile; move secondary controls into a slide-up sheet or overflow menu
- [x] Ensure the elevation panel can be opened as a full-width overlay on small screens
- [x] Handle orientation change (`orientationchange` / `resize`) by recalculating SVG dimensions and re-rendering

**Touch UX**
- [x] Increase minimum tap target size to 44px for all toolbar buttons on mobile
- [x] Show a brief pan/pinch hint overlay on first mobile load (dismissable)
- [x] Disable furniture drag initiation on touch (show a "preview only" tooltip if user tries to drag)

---

### Phase 3B: Full Mobile Feature Parity *(after 3A is stable)*

**Goal**: Everything available on desktop works on mobile. Editing, drag-and-drop, measurements, dividers, anchors, and fixture editing all work with touch.

#### Scope
Everything in Phase 3A, plus:
- Place and drag furniture with touch
- Rotate furniture with double-tap or two-finger rotate gesture
- Move fixtures in the floor plan view
- Add, edit, and delete measurements
- Draw and adjust soft dividers
- Anchor mode (link furniture pieces)
- Fixture editing panel (touch-friendly)
- Full elevation interaction (drag furniture vertically)
- Undo/redo via on-screen buttons (keyboard shortcut unavailable on mobile)
- JSON/CSV export from mobile

#### Technical Work

**Touch Drag & Drop**
- [ ] Implement touch drag for furniture pieces in `furniture.js` (touchstart → drag state, touchmove → reposition, touchend → drop)
- [ ] Handle multi-touch correctly: two fingers on canvas = pan/zoom, one finger on furniture = drag
- [ ] Implement touch drag for staging panel furniture onto canvas
- [ ] Show drag ghost / position preview during touch drag
- [ ] Touch drag for fixtures in fixture-edit mode

**Gestures**
- [ ] Double-tap on furniture to rotate 90°
- [ ] Long-press on furniture to open context menu (delete, duplicate, properties)
- [ ] Long-press on canvas (empty area) to open canvas context menu
- [ ] Two-finger rotate gesture on selected furniture for free rotation

**Elevation Touch**
- [ ] Touch drag on elevation furniture pieces to adjust height (`elevation.js`)
- [ ] Pinch on elevation panel to zoom the elevation view

**Measurement & Dividers**
- [ ] Touch-based measurement creation (tap first point, tap second point)
- [ ] Touch drag to reposition locked measurements
- [ ] Touch to draw/adjust soft dividers

**Mobile UI Additions**
- [ ] Undo/redo buttons visible in toolbar on mobile (replaces Cmd+Z)
- [ ] Mode indicators clearly visible (measure mode, anchor mode, fixture mode)
- [ ] Touch-optimized properties panel (bottom sheet) for selected furniture
- [ ] Staging panel as a swipe-up drawer rather than a sidebar

**Performance**
- [ ] Lazy-load furniture catalog on mobile to reduce initial parse time
- [ ] Throttle SVG re-renders during touch drag to 30fps on low-end devices
- [ ] Battery optimization: pause render loop when app is backgrounded

---

### Shared Mobile Infrastructure (both phases)

- [ ] **Progressive Web App**: Add `manifest.json` and service worker for installability and offline support
- [ ] **Share Sheet**: Native share API (`navigator.share`) for exporting plans on mobile
- [ ] **Portrait/Landscape**: Adaptive layout that reconfigures panels on orientation change
- [ ] **Photo Import**: Use `<input type="file" accept="image/*" capture="environment">` for camera access (Phase 3B scope)

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

## 🔨 Phase 5: Code Refactoring & Quality

**Goal**: Improve code maintainability, eliminate duplication, and establish best practices.

**Status**: Documented in `docs/REFACTORING.md`

### Phase 5.1: Quick Wins (2-3 hours)
- [ ] **Extract 45-degree angle snapping** to `utils.js` (3 locations, ~100 lines duplication)
- [ ] **Consolidate anchor point functions** to `geometry.js` (2 identical functions)
- [ ] **Extract menu closing pattern** to `domHelpers.js` (6 locations)
- [ ] **Extract re-render orchestration** to `renderComplete()` function
- [ ] **Create constants file** to replace magic numbers across codebase

**Impact**: 5-8% code reduction, improved maintainability

### Phase 5.2: Architectural Improvements (3-4 weeks)
- [ ] **Split `attachCanvasEvents()`** from 472 lines into 6-8 focused modules
  - `interactions/touch.js` - Touch event handling
  - `interactions/zoom.js` - Mouse wheel zoom
  - `interactions/doors.js` - Door click handling
  - `interactions/keyboard.js` - Keyboard shortcuts
  - `interactions/drag.js` - Drag handlers
  - `interactions/modes.js` - Mode handlers (divider, anchor, measurement)
- [ ] **Create EventEmitter** to replace 40+ `window._` global callbacks
- [ ] **Create RenderManager** for centralized render orchestration
- [ ] **Add proper error handling** to localStorage operations

**Impact**: 10-15% code reduction, clearer architecture

### Phase 5.3: Code Organization (2-3 weeks)
- [ ] **Split `measurement.js`** into sub-modules (core, render, events)
- [ ] **Split `io.js`** into import/export/validation modules
- [ ] **Create coordinate conversion module** for consistent transformations
- [ ] **Standardize event handler attachment** across all modules

**Impact**: Better file organization, easier navigation

### Phase 5.4: State Management (2-3 weeks)
- [ ] **Create state accessor functions** in `data.js`
- [ ] **Migrate direct state access** to use accessors
- [ ] **Add validation** for state mutations
- [ ] **Implement side-effect handling** in state setters

**Impact**: Predictable state changes, better debugging

### Phase 5.5: Polish & Testing (3-4 weeks)
- [ ] **Refactor deeply nested conditionals** to use early returns
- [ ] **Add unit testing framework** (Vitest)
- [ ] **Write tests** for critical functions (geometry, collision, measurements)
- [ ] **Document preferred patterns** (null checking, error handling, etc.)
- [ ] **Audit and remove unused code**

**Impact**: Tested, documented, production-ready codebase

**Total Timeline**: 11-16 weeks
**Total Impact**: ~20% code reduction, professional-grade architecture

---

## 🔧 Phase 6: Advanced Tools

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

## 🎓 Phase 7: Learning & Templates

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

## 🔌 Phase 8: Integrations

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

### Accessibility & WCAG 2.1 AA Compliance
- [ ] **Color Contrast Fixes**: Meet WCAG AA 4.5:1 ratio for all text
- [ ] **ARIA Labels**: Add aria-label, aria-expanded, aria-pressed to all interactive elements
- [ ] **Semantic HTML**: Replace divs with header, main, aside, nav elements
- [ ] **Focus Indicators**: Visible focus rings on all focusable elements
- [ ] **Keyboard Navigation**: Arrow keys for menus, Tab navigation for all UI
- [ ] **Keyboard Drag-Drop**: Space/Enter to grab, arrow keys to move, Enter to drop
- [ ] **SVG Accessibility**: Add roles, labels, and keyboard access to floor plan canvas
- [ ] **Screen Reader Support**: aria-live regions for dynamic content announcements
- [ ] **Form Labels**: Associate all inputs with visible or aria-labels
- [ ] **Reduced Motion**: Respect prefers-reduced-motion for animations
- [ ] **Skip Links**: Add skip-to-main-content link
- [ ] **Heading Hierarchy**: Proper H1-H6 structure throughout app
- [ ] **High Contrast Mode**: Test and optimize for Windows High Contrast Mode
- [ ] **200% Zoom**: Ensure app works at 200% text size
- [ ] **Screen Reader Testing**: Test with NVDA/VoiceOver and fix issues

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

1. **WYSIWYG Floor Plan Editor** (Phase 1) - Most requested feature
2. **Mobile Support** (Phase 3) - Expand user base significantly
3. **3D Visualization** (Phase 2) - High impact on user experience
4. **Code Refactoring** (Phase 5) - Technical debt reduction, maintainability
5. **Templates & Presets** (Phase 7) - Lower barrier to entry
6. **Collaboration** (Phase 4) - Enable professional use cases
7. **Advanced Tools** (Phase 6) - Serve power users
8. **Integrations** (Phase 8) - Fit into existing workflows

---

## Contributing Ideas

Have ideas for Floor Plan Studio? We'd love to hear them!

- **GitHub Issues**: [Report bugs or suggest features](https://github.com/alexanderblackh/floor-plan-studio/issues)
- **Pull Requests**: Contribute code directly
- **Discussions**: Share ideas and vote on proposals

---

*This roadmap is subject to change based on community feedback and development priorities.*

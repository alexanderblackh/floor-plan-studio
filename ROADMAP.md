# Floor Plan Studio Roadmap

This document outlines the core development phases for Floor Plan Studio.

**See also:**
- [ROADMAP-STATUS.md](ROADMAP-STATUS.md) - Detailed status of all phases
- [docs/REFACTORING-UNIFIED.md](docs/REFACTORING-UNIFIED.md) - Complete refactoring & re-implementation plan

---

## ✅ Phase 1: Basic Mobile Support (COMPLETE)

**Goal**: Read-only mobile experience for iOS, Android, and web.

**Status**: ✅ **100% Complete** - All tasks done, deployed to production

### What Was Delivered

**Touch & Input:**
- ✅ Touch event handlers (pan, pinch-to-zoom)
- ✅ Unified coordinate extraction for mouse + touch
- ✅ Prevent page scroll during gestures

**Layout & Responsive:**
- ✅ Responsive SVG canvas
- ✅ Mobile breakpoint (hide furniture panel on ≤768px)
- ✅ Collapsed toolbar on mobile
- ✅ Full-width elevation panel overlay
- ✅ Orientation change handling

**Touch UX:**
- ✅ 44px minimum tap targets
- ✅ Pan/pinch hint overlay
- ✅ Furniture drag disabled (read-only)

**Full details:** [ROADMAP-STATUS.md - Phase 3A](ROADMAP-STATUS.md#-completed-phase-3a---mobile-preview)

---

## 🔨 Phase 2: Code Refactoring

**Goal**: Improve code maintainability, eliminate duplication, complete accessibility, establish best practices.

**Status**: 🔴 Not Started (100% documented, ready to execute)
**Documentation**: [docs/REFACTORING-UNIFIED.md](docs/REFACTORING-UNIFIED.md)
**Timeline**: 25-35 hours (3-4 working days)
**Type**: 100% Refactoring

### Sub-Phases

**2.1: Quick Wins** (2-3 hours)
- Extract 45-degree angle snapping to utils.js (~100 lines eliminated)
- Consolidate anchor point functions to geometry.js
- Extract menu closing pattern to domHelpers.js (6 locations)
- Extract re-render orchestration to renderComplete()
- Create constants.js for magic numbers

**2.2: Complete Accessibility** (8-12 hours)
- Keyboard navigation for menus and dropdowns
- Keyboard-based drag and drop
- SVG canvas keyboard accessibility
- Screen reader testing with NVDA/VoiceOver
- 200% zoom support, skip links, heading hierarchy

**2.3: Code Organization** (15-22 hours)
- **Merge fixtures.js into furniture.js** (-453 lines!)
- Split attachCanvasEvents() into focused modules
- Split measurement.js into sub-modules
- Split io.js into import/export/validation
- Create coordinate conversion module

**Expected Impact:**
- ~650 lines eliminated (-10%)
- 100% WCAG 2.1 AA compliance
- Professional code organization

---

## ⚡ Phase 3: Performance Re-implementations

**Goal**: Fix fundamental performance bottlenecks with ground-up rewrites.

**Status**: 🔴 Not Started (100% documented with code examples)
**Documentation**: [docs/REFACTORING-UNIFIED.md - Phase 5.2](docs/REFACTORING-UNIFIED.md#phase-52-critical-re-implementations-9-14-hours)
**Timeline**: 9-14 hours (1-2 working days)
**Type**: 100% Re-implementation

### Critical Rewrites

**3.1: Collision Detection - O(n²) → Spatial Hash** (4-6 hours)
- Current: 100 items = 10,000 checks
- New: 100 items = ~20 checks
- **50-500x performance improvement**

**3.2: Color Caching System** (1-2 hours)
- Eliminate 17 getComputedStyle() calls per render
- Cache on startup, invalidate on theme change
- **100-1000x faster color access**

**3.3: ID Lookups - Array.find() → Map** (1-2 hours)
- Replace O(n) linear search with O(1) hash lookups
- Affects getFurnitureDef, getRoom, getWall, getFixture
- **50x faster lookups**

**3.4: Event Bus** (3-4 hours)
- Replace 40+ window._ memory leaks
- Proper pub/sub with cleanup
- Clear dependency graph

**Expected Impact:**
- 50-500x performance on critical paths
- Zero memory leaks
- Scalable to 100+ furniture items

---

## 📱 Phase 4: Full Mobile Support

**Goal**: Everything that works on desktop works on mobile - full editing capabilities.

**Status**: 🔴 Not Started (0 of 18 tasks)
**Timeline**: 40-60 hours (5-7 working days)

### Touch Drag & Drop (0/5 tasks)
- [ ] Touch drag for furniture pieces
- [ ] Multi-touch handling (2 fingers = pan, 1 finger = drag)
- [ ] Touch drag from staging panel
- [ ] Drag ghost/position preview
- [ ] Touch drag for fixtures in edit mode

### Gestures (0/4 tasks)
- [ ] Double-tap to rotate furniture 90°
- [ ] Long-press for context menu (delete, duplicate)
- [ ] Long-press on canvas for menu
- [ ] Two-finger rotate gesture

### Elevation Touch (0/2 tasks)
- [ ] Touch drag elevation furniture (adjust height)
- [ ] Pinch to zoom elevation view

### Measurement & Dividers (0/3 tasks)
- [ ] Touch-based measurement creation
- [ ] Touch drag locked measurements
- [ ] Touch draw/adjust soft dividers

### Mobile UI (0/4 tasks)
- [ ] Undo/redo buttons (replace Cmd+Z)
- [ ] Mode indicators (measure, anchor, fixture)
- [ ] Touch-optimized properties panel (bottom sheet)
- [ ] Staging panel as swipe-up drawer

---

## 🎯 Phase 5: WYSIWYG Floor Plan Editor

**Goal**: Create and edit floor plans entirely within the UI, without manually editing JSON.

**Status**: 🔴 Not Started (0 of 23 tasks)
**Timeline**: 100-150 hours (12-18 working days)
**Priority**: High (most requested feature)

### Room Creation Tools (0/5 tasks)
- [ ] Draw room mode (click vertices, auto-close)
- [ ] Rectangle tool (click-drag rectangles)
- [ ] Edit vertices (drag corners to reshape)
- [ ] Add/remove vertices
- [ ] Room properties panel (name, color, labels)

### Wall Editing (0/4 tasks)
- [ ] Add wall (click two points)
- [ ] Delete wall (click to remove)
- [ ] Split wall (door/window splits wall)
- [ ] Wall properties (thickness, type)

### Door & Window Tools (0/5 tasks)
- [ ] Add door (click wall, set width/swing)
- [ ] Add window (click wall, set width/height)
- [ ] Interactive swing editor (drag arc handle)
- [ ] Door type switcher (swing/sliding/pocket/bifold)
- [ ] Window properties editor

### Fixture Creation (0/4 tasks)
- [ ] Fixture library (counters, tubs, closets)
- [ ] Custom fixture tool
- [ ] Fixture doors (closet swing doors)
- [ ] Appliance integration

### Furniture Creator (0/5 tasks)
- [ ] Custom furniture tool (define dimensions)
- [ ] Furniture templates
- [ ] Color picker
- [ ] Category assignment
- [ ] 2.5D properties (height, surface height, stackable)

---

## 🔧 Phase 6: Advanced Tools

**Goal**: Power user features for professionals.

**Status**: 🔴 Not Started (0 of 11 tasks)
**Timeline**: 40-60 hours

### Smart Layout (0/4 tasks)
- [ ] Auto-arrange (AI furniture suggestions)
- [ ] Traffic flow (visualize walking paths)
- [ ] Clearance checker (tight spaces, conflicts)
- [ ] Accessibility audit (ADA compliance)

### Cost Estimation (0/3 tasks)
- [ ] Material calculator (flooring, paint)
- [ ] Furniture budget tracker
- [ ] Shopping list export

### Extended Measurements (0/4 tasks)
- [ ] Area calculator (room square footage)
- [ ] Perimeter tool (wall length for baseboards)
- [ ] Volume calculator (HVAC sizing)
- [ ] Custom formulas

---

## 🎓 Phase 7: Learning & Templates

**Goal**: Lower barrier to entry with templates and education.

**Status**: 🔴 Not Started (0 of 8 tasks)
**Timeline**: 30-50 hours

### Templates & Presets (0/4 tasks)
- [ ] Floor plan templates (studio, 1BR, 2BR, etc.)
- [ ] Room presets (pre-configured layouts)
- [ ] Style packs (modern, traditional, minimalist)
- [ ] Template gallery (community-contributed)

### Educational Features (0/4 tasks)
- [ ] Interactive tutorial (step-by-step)
- [ ] Tooltips (contextual help)
- [ ] Video guides
- [ ] Design tips

---

## 🌐 Phase 8: Three.js 3D Visualization (If Desired)

**Goal**: Realistic 3D walkthrough and visualization.

**Status**: 🔴 Not Started (0 of 13 tasks)
**Timeline**: 80-120 hours
**Priority**: Medium (high impact but not urgent)

### 3D Rendering (0/5 tasks)
- [ ] 3D view toggle (2D ↔ 3D)
- [ ] Camera controls (orbit, pan, zoom)
- [ ] Furniture models (extruded 3D)
- [ ] Wall heights (configurable ceilings)
- [ ] Realistic materials

### Navigation (0/4 tasks)
- [ ] First-person mode (walk through)
- [ ] Preset camera angles
- [ ] Minimap (2D overview)
- [ ] VR support (WebXR)

### Advanced 3D (0/4 tasks)
- [ ] Lighting system
- [ ] Shadows (real-time)
- [ ] Reflections
- [ ] Custom 3D models (GLB/GLTF)
- [ ] Export 3D

---

## 🔮 Potential Future Features

These features are **exploratory and may or may not be pursued** based on user demand, business model decisions, and strategic fit. Each has dedicated documentation outlining questions, considerations, and trade-offs.

### Collaboration & Sharing
**What it is:** Real-time collaboration, cloud sync, public sharing, team accounts  
**Target audience:** Professional teams, agencies, real estate agents  
**Effort:** 60-100 hours + ongoing infrastructure costs ($100-500/month)  
**Key question:** Is Floor Plan Studio a local-first tool or cloud platform?  

**📄 Full Analysis:** [docs/PROPOSAL-COLLABORATION.md](docs/PROPOSAL-COLLABORATION.md)

**Key Features:**
- Real-time multiplayer editing
- Cloud storage and sync
- Public gallery and embeds
- Team workspaces and permissions

**Why Potential:** Requires backend infrastructure, ongoing costs, fundamental architecture change

---

### Integrations
**What it is:** Import/export with CAD, BIM, 3D tools (DXF, PDF, Blender, SketchUp, Revit)  
**Target audience:** Architects, designers using professional tools  
**Effort:** 80-120 hours (full coverage), ongoing maintenance  
**Key question:** Are professional integrations worth 350+ hours of development?  

**📄 Full Analysis:** [docs/PROPOSAL-INTEGRATIONS.md](docs/PROPOSAL-INTEGRATIONS.md)

**Key Features:**
- PDF import/export
- DXF/DWG (AutoCAD)
- Image to floor plan (AI)
- Blender/Unity/Unreal export
- REST API and SDK

**Why Potential:** Extreme complexity, format-specific knowledge required, ongoing maintenance

---

### Community Features
**What it is:** Public gallery, design challenges, template marketplace, forum  
**Target audience:** Engaged user base (1,000+ users)  
**Effort:** 40-80 hours + 10-20 hours/week moderation  
**Key question:** Is there sufficient user engagement to justify community features?  

**📄 Full Analysis:** [docs/PROPOSAL-COMMUNITY.md](docs/PROPOSAL-COMMUNITY.md)

**Key Features:**
- Public design gallery
- Monthly design challenges
- Template marketplace
- Plugin system
- Feature voting

**Why Potential:** Requires critical mass of users, ongoing moderation burden

---

### Business Features
**What it is:** Client portal, team accounts, proposals, white-label, enterprise features  
**Target audience:** Agencies, architecture firms, real estate professionals  
**Effort:** 80-150 hours + 30-60 hours/week sales & support  
**Key question:** Is B2B SaaS the desired business model?  

**📄 Full Analysis:** [docs/PROPOSAL-BUSINESS.md](docs/PROPOSAL-BUSINESS.md)

**Key Features:**
- Client portal and approval workflow
- Team accounts and permissions
- Professional proposals
- Multi-project management
- White-label embedding
- API access

**Why Potential:** Requires B2B sales/support commitment, multi-tenant complexity, long sales cycles

---

## 📊 Priority Order

**Current Recommended Order:**

1. ✅ **Phase 1: Basic Mobile Support** - COMPLETE
2. 🔴 **Phase 2: Refactoring** - Code quality, accessibility (NEXT)
3. 🔴 **Phase 3: Re-implementations** - Performance fixes (NEXT)
4. 🔴 **Phase 5: WYSIWYG Editor** - Most requested, high value
5. 🔴 **Phase 4: Full Mobile** - Expand mobile capabilities
6. 🔴 **Phase 7: Learning & Templates** - Lower barrier to entry
7. 🔴 **Phase 6: Advanced Tools** - Power user features
8. 🔴 **Phase 8: Three.js** - High impact visualization (if desired)
9. 🔮 **Potential Features** - Evaluate based on user demand and business model

**Rationale:**
- Phases 2-3 (refactoring/performance) create solid foundation for future work
- Phase 5 (WYSIWYG) is most requested and highest user value
- Phase 4 (full mobile) builds on completed Phase 1
- Potential features require strategic decisions before committing

---

## Contributing Ideas

Have ideas for Floor Plan Studio?

- **GitHub Issues**: [Report bugs or suggest features](https://github.com/alexanderblackh/floor-plan-studio/issues)
- **Pull Requests**: Contribute code directly

---

*This roadmap is subject to change based on user feedback and development priorities.*

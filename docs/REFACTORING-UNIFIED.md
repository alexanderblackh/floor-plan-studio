# Unified Code Refactoring & Re-implementation Roadmap

**Generated:** 2026-03-05
**Status:** Planning - Integrated Analysis
**Codebase Size:** 6,572 lines across 14 JavaScript modules

This document unifies the refactoring audit with the performance re-implementation analysis, providing a single coherent roadmap that distinguishes between incremental improvements (refactoring) and ground-up rewrites (re-implementation).

---

## Table of Contents

1. [Strategy Overview](#strategy-overview)
2. [Refactor vs Re-implement Decision Matrix](#refactor-vs-re-implement-decision-matrix)
3. [Unified Phase Roadmap](#unified-phase-roadmap)
4. [Detailed Implementation Plans](#detailed-implementation-plans)
5. [Future Re-implementation Candidates](#future-re-implementation-candidates)

---

## Strategy Overview

### Three Approaches

**1. REFACTOR** - Improve existing code structure
- Extract duplicated logic
- Reorganize files
- Add utilities and helpers
- **When:** Code structure is sound, just needs cleanup

**2. RE-IMPLEMENT** - Rewrite from scratch
- Replace with better algorithms
- Fix fundamental performance issues
- Eliminate architectural anti-patterns
- **When:** Current approach is fundamentally flawed

**3. REFACTOR NOW, RE-IMPLEMENT LATER**
- Organize code first to make it maintainable
- Plan complete rewrite as separate phase
- **When:** Re-implementation is too risky/complex to do immediately

---

## Refactor vs Re-implement Decision Matrix

| Task | Current Approach | Action | Reason |
|------|------------------|--------|--------|
| **Angle snapping duplication** | Duplicated logic 3x | **REFACTOR** | Simple extraction to utility |
| **Anchor point functions** | Duplicate function 2x | **REFACTOR** | Simple consolidation |
| **Menu closing pattern** | Repeated 6x | **REFACTOR** | Extract to helper |
| **Collision detection** | O(n²) nested loops | **RE-IMPLEMENT** | Algorithm fundamentally wrong |
| **Color CSS queries** | getComputedStyle() in loops | **RE-IMPLEMENT** | Need caching layer |
| **ID lookups** | Array.find() O(n) | **RE-IMPLEMENT** | Wrong data structure |
| **Event delegation** | Re-attach on every render | **RE-IMPLEMENT** | Fundamentally broken pattern |
| **Global window callbacks** | 40+ memory leaks | **RE-IMPLEMENT** | Architecture needs event bus |
| **SVG string concat** | innerHTML replacement | **REFACTOR NOW, RE-IMPL LATER** | Too risky to change all at once |
| **RenderManager** | Scattered render calls | **RE-IMPLEMENT** | Need proper diffing, not orchestration |
| **Fixtures module** | 453 lines duplicate | **REFACTOR** | Merge into furniture |
| **State accessors** | Direct mutations | **REFACTOR** | Add validation layer |

---

## Unified Phase Roadmap

### Phase 1: Quick Wins - Refactoring Only (2-3 hours)

**Goal:** Low-risk improvements with immediate value

| Task | Type | Effort | Impact |
|------|------|--------|--------|
| Extract angle snapping utility | REFACTOR | 20-30 min | -100 lines |
| Consolidate anchor point functions | REFACTOR | 10-15 min | Single source |
| Extract menu closing pattern | REFACTOR | 30-40 min | Consistent UX |
| Extract renderComplete() | REFACTOR | 10-15 min | Clarity |
| Create constants.js | REFACTOR | 45-60 min | Self-documenting |

**Total:** ~2.5 hours | **Code Reduction:** ~100 lines | **Risk:** Very Low

---

### Phase 2: Critical Re-implementations (8-12 hours)

**Goal:** Fix fundamental performance bottlenecks

| Task | Type | Effort | Impact |
|------|------|--------|--------|
| **Collision: O(n²) → Spatial Hash** | RE-IMPLEMENT | 4-6 hours | 100x faster with 100+ items |
| **Color caching system** | RE-IMPLEMENT | 1-2 hours | Eliminate 17 getComputedStyle/render |
| **ID lookups: Array.find → Map** | RE-IMPLEMENT | 1-2 hours | O(n) → O(1) lookups |
| **Event bus (replace window._)** | RE-IMPLEMENT | 3-4 hours | Fix memory leaks |

**Total:** ~9-14 hours | **Performance Gain:** 50-100x on large datasets | **Risk:** Medium

**Critical Notes:**
- **Collision detection** must use spatial data structure (quadtree or grid hash)
- **Color caching** eliminates forced layout recalculations
- **Event bus** fixes 40+ memory leak sources
- These are architectural fixes that refactoring cannot solve

---

### Phase 3: Code Organization + Strategic Mergers (14-20 hours)

**Goal:** Organize code, eliminate unnecessary modules

| Task | Type | Effort | Impact |
|------|------|--------|--------|
| **Merge fixtures.js → furniture.js** | REFACTOR | 4-6 hours | -453 lines |
| Split attachCanvasEvents() | REFACTOR | 4-6 hours | Maintainability |
| Split measurement.js | REFACTOR | 3-4 hours | Organization |
| Split io.js | REFACTOR | 2-3 hours | Focused modules |
| Coordinate conversion module | REFACTOR | 2-3 hours | Consistency |

**Total:** ~15-22 hours | **Code Reduction:** ~550 lines | **Risk:** Low-Medium

---

### Phase 4: Event Delegation Re-implementation (6-8 hours)

**Goal:** Fix event handling architecture

**Current Problem:**
```javascript
// furniture.js:160-307 - ANTI-PATTERN
function attachFurnitureEvents() {
  document.querySelectorAll('.furniture-piece').forEach(el => {
    el.addEventListener('mousedown', ...);  // 120+ listeners
    el.addEventListener('mousemove', ...);
    // ... 5 more per piece
  });
}
// Called after EVERY render = 14,400 listener create/destroy per 2sec drag!
```

**Re-implementation Plan:**

```javascript
// Single delegated listener - RE-IMPLEMENT from scratch
const furnitureGroup = document.getElementById('furnitureGroup');

furnitureGroup.addEventListener('mousedown', (e) => {
  const piece = e.target.closest('.furniture-piece');
  if (!piece) return;

  const idx = parseInt(piece.dataset.idx);
  handleFurnitureMouseDown(idx, e);
});

// Now renderFurniture() just updates SVG attributes
// NO event re-attachment!
```

| Task | Type | Effort | Impact |
|------|------|--------|--------|
| Implement delegated mouse handlers | RE-IMPLEMENT | 2-3 hours | 120x fewer listeners |
| Implement delegated drag handlers | RE-IMPLEMENT | 2-3 hours | No re-attach overhead |
| Remove old attachment functions | REFACTOR | 1-2 hours | Cleanup |

**Total:** ~5-8 hours | **Performance:** Eliminates 14k+ listener churn | **Risk:** Medium

---

### Phase 5: State Management (9-12 hours)

**Goal:** Controlled state with validation

| Task | Type | Effort | Impact |
|------|------|--------|--------|
| Create state accessor functions | REFACTOR | 6-8 hours | Validation layer |
| Migrate to accessors | REFACTOR | 3-4 hours | Side-effect handling |

**Total:** ~9-12 hours | **Risk:** Low

**Note:** This is refactoring, not re-implementation. The state structure is fine, just needs encapsulation.

---

### Phase 6: Testing & Documentation (10-14 hours)

| Task | Type | Effort | Impact |
|------|------|--------|--------|
| Setup Vitest | REFACTOR | 1-2 hours | Testing infrastructure |
| Write tests for re-implemented systems | REFACTOR | 4-6 hours | Regression prevention |
| Document patterns | REFACTOR | 2-3 hours | Consistency |
| Refactor nested conditionals | REFACTOR | 1 hour | Readability |
| Audit unused code | REFACTOR | 2-3 hours | Cleanup |

**Total:** ~10-14 hours | **Risk:** Very Low

---

## Summary Timeline

| Phase | Type Mix | Effort | Impact | Risk |
|-------|----------|--------|--------|------|
| Phase 1: Quick Wins | 100% Refactor | 2-3 hours | -100 lines | Very Low |
| Phase 2: Critical Re-impl | 100% Re-implement | 9-14 hours | 50-100x perf | Medium |
| Phase 3: Organization | 100% Refactor | 15-22 hours | -550 lines | Low-Med |
| Phase 4: Event Delegation | 80% Re-impl, 20% Refactor | 5-8 hours | -14k listeners | Medium |
| Phase 5: State Mgmt | 100% Refactor | 9-12 hours | Validation | Low |
| Phase 6: Testing | 100% Refactor | 10-14 hours | Quality | Very Low |
| **TOTAL** | **60% Refactor, 40% Re-impl** | **50-73 hours** | **Professional** | **Low-Med** |

**Completion:** 6-9 full working days of Claude Code effort

---

## Detailed Implementation Plans

### 🔴 CRITICAL: Collision Detection Re-implementation

**Current:** O(n²) brute force (collision.js:125-151)
**New:** Spatial hash grid O(n)

**Implementation:**

```javascript
// js/spatial-hash.js - NEW FILE
export class SpatialHash {
  constructor(cellSize = 50) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  _hash(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  insert(item, bounds) {
    const { x, y, w, h } = bounds;

    // Find all cells this item occupies
    const x1 = Math.floor(x / this.cellSize);
    const y1 = Math.floor(y / this.cellSize);
    const x2 = Math.floor((x + w) / this.cellSize);
    const y2 = Math.floor((y + h) / this.cellSize);

    for (let cx = x1; cx <= x2; cx++) {
      for (let cy = y1; cy <= y2; cy++) {
        const key = `${cx},${cy}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key).push(item);
      }
    }
  }

  query(bounds) {
    const { x, y, w, h } = bounds;
    const results = new Set();

    const x1 = Math.floor(x / this.cellSize);
    const y1 = Math.floor(y / this.cellSize);
    const x2 = Math.floor((x + w) / this.cellSize);
    const y2 = Math.floor((y + h) / this.cellSize);

    for (let cx = x1; cx <= x2; cx++) {
      for (let cy = y1; cy <= y2; cy++) {
        const items = this.grid.get(`${cx},${cy}`) || [];
        items.forEach(item => results.add(item));
      }
    }

    return Array.from(results);
  }
}

// Usage in collision.js
const spatialHash = new SpatialHash(50);

export function updateSpatialIndex() {
  spatialHash.clear();
  state.placedFurniture.forEach((p, idx) => {
    const def = getFurnitureDef(p.furnitureId);
    const w = p.rotated ? def.h : def.w;
    const h = p.rotated ? def.w : def.h;
    spatialHash.insert(idx, { x: p.x, y: p.y, w, h });
  });
}

export function checkFurnitureOverlap(idx) {
  const p = state.placedFurniture[idx];
  const def = getFurnitureDef(p.furnitureId);
  const w = p.rotated ? def.h : def.w;
  const h = p.rotated ? def.w : def.h;

  // Only check nearby items (O(log n) instead of O(n))
  const nearby = spatialHash.query({ x: p.x, y: p.y, w, h });

  for (const otherIdx of nearby) {
    if (otherIdx === idx) continue;
    if (overlaps(p, state.placedFurniture[otherIdx])) {
      return true;
    }
  }

  return false;
}
```

**Performance:**
- Before: 20 items = 400 checks
- After: 20 items = ~4-8 checks (50-100x reduction)
- With 100 items: 10,000 checks → ~10-20 checks (500-1000x!)

**Effort:** 4-6 hours
**Risk:** Medium (requires thorough testing)
**When:** Phase 2

---

### 🔴 CRITICAL: Color Caching Re-implementation

**Current:** getComputedStyle() called 17+ times per render
**New:** Cache all colors once, invalidate on theme change

**Implementation:**

```javascript
// js/color-cache.js - NEW FILE
class ColorCache {
  constructor() {
    this._colors = null;
    this._isLight = false;
    this._observer = null;
  }

  init() {
    this._isLight = document.body.classList.contains('light-mode');
    this._colors = this._computeColors();
    this._setupThemeObserver();
  }

  _computeColors() {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);

    const get = (varName) => {
      const bodyVal = body.getPropertyValue(varName).trim();
      return bodyVal || root.getPropertyValue(varName).trim();
    };

    return {
      wallColor: get('--wall-color') || '#555',
      wallStroke: get('--wall-stroke') || '#222',
      windowBg: get('--window-bg') || '#4a9eff22',
      doorColor: get('--door-color') || '#8b6f47',
      accentGold: get('--accent-gold') || '#c5975b',
      textPrimary: get('--text-primary') || '#e8e8e8',
      textDimmer: get('--text-dimmer') || '#999',
      bgPrimary: get('--bg-primary') || '#0d1117',
      bgSecondary: get('--bg-secondary') || '#161b22',
      borderPrimary: get('--border-primary') || '#30363d',
      roomFill: get('--room-fill') || '#18182288',
      gridColor: get('--grid-color') || '#ffffff11',
      fixtureStroke: get('--fixture-stroke') || '#666',
      measurementColor: get('--measurement-color') || '#c5975b',
      dividerColor: get('--divider-color') || '#c5975b66'
    };
  }

  _setupThemeObserver() {
    // Watch for theme changes
    this._observer = new MutationObserver(() => {
      const isLight = document.body.classList.contains('light-mode');
      if (isLight !== this._isLight) {
        this._isLight = isLight;
        this._colors = this._computeColors();
        // Trigger re-render
        if (window._onThemeChange) window._onThemeChange();
      }
    });

    this._observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  get(colorName) {
    if (!this._colors) this.init();
    return this._colors[colorName];
  }

  isLightMode() {
    if (this._colors === null) this.init();
    return this._isLight;
  }

  invalidate() {
    this._colors = this._computeColors();
  }
}

export const colorCache = new ColorCache();
```

**Usage in render.js:**

```javascript
import { colorCache } from './color-cache.js';

// BEFORE (17 calls per render):
const wallColor = getCSSVar('--wall-color') || '#555';

// AFTER (0 calls - uses cache):
const wallColor = colorCache.get('wallColor');
```

**Performance:**
- Eliminates 17 forced layout recalculations per render
- Each getComputedStyle: 1-10ms → Cache lookup: <0.01ms
- 100-1000x faster color access

**Effort:** 1-2 hours
**Risk:** Low
**When:** Phase 2

---

### 🔴 HIGH: ID Lookup Re-implementation

**Current:** Array.find() linear search O(n)
**New:** Map for O(1) lookup

**Implementation:**

```javascript
// js/data.js - MODIFY EXISTING

// Add maps alongside arrays
const furnitureDefMap = new Map();
const roomMap = new Map();
const wallMap = new Map();
const fixtureMap = new Map();

// Build maps on state load
export function buildIndexMaps() {
  furnitureDefMap.clear();
  roomMap.clear();
  wallMap.clear();
  fixtureMap.clear();

  state.floorPlan.furniture.forEach(f => furnitureDefMap.set(f.id, f));
  state.floorPlan.rooms.forEach(r => roomMap.set(r.id, r));
  state.floorPlan.walls.forEach((w, i) => wallMap.set(i, w));
  state.floorPlan.fixtures.forEach(f => fixtureMap.set(f.id, f));
}

// Replace existing functions
export function getFurnitureDef(id) {
  return furnitureDefMap.get(id);  // O(1) instead of O(n)!
}

export function getRoom(id) {
  return roomMap.get(id);
}

export function getWall(idx) {
  return wallMap.get(idx);
}

export function getFixture(id) {
  return fixtureMap.get(id);
}

// Invalidate on data change
export function setFloorPlan(newPlan) {
  state.floorPlan = newPlan;
  buildIndexMaps();
  saveToCache();
}
```

**Performance:**
- 200 lookups/render × 50 items = 10,000 comparisons
- After: 200 lookups × 1 hash = 200 operations
- 50x faster lookups

**Effort:** 1-2 hours
**Risk:** Very Low
**When:** Phase 2

---

### 🟡 MEDIUM: Event Bus Re-implementation

**Current:** 40+ window._ assignments causing memory leaks
**New:** Proper event bus with cleanup

**Implementation:**

```javascript
// js/event-bus.js - NEW FILE
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const idx = callbacks.indexOf(callback);
      if (idx !== -1) callbacks.splice(idx, 1);
    };
  }

  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      callback(data);
      unsubscribe();
    });
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
  }

  clear(event = null) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const eventBus = new EventBus();

// Event names as constants
export const EVENTS = {
  FURNITURE_UPDATED: 'furniture:updated',
  MEASUREMENT_UPDATED: 'measurement:updated',
  DIVIDER_UPDATED: 'divider:updated',
  ANCHOR_UPDATED: 'anchor:updated',
  ELEVATION_UPDATED: 'elevation:updated',
  STATE_CHANGED: 'state:changed',
  TRANSFORM_APPLIED: 'transform:applied',
  THEME_CHANGED: 'theme:changed'
};
```

**Migration:**

```javascript
// BEFORE (memory leak):
window._renderMeasurement = renderMeasurement;

// Later:
if (window._renderMeasurement) window._renderMeasurement();

// AFTER (clean):
import { eventBus, EVENTS } from './event-bus.js';

eventBus.on(EVENTS.FURNITURE_UPDATED, renderMeasurement);

// Later:
eventBus.emit(EVENTS.FURNITURE_UPDATED);
```

**Effort:** 3-4 hours
**Risk:** Medium (must migrate all 40+ window assignments)
**When:** Phase 2

---

## Future Re-implementation Candidates

### Items to Refactor Now, Re-implement Later

These systems are too complex or risky to re-implement immediately. Refactor for organization now, plan complete rewrite for future phases.

#### 1. SVG Rendering Pipeline (innerHTML → DOM API)

**Current State:**
- All SVG built via string concatenation
- innerHTML wipes entire DOM on every update
- 150+ string concat operations per render

**Why Not Now:**
- Touches 6+ files (furniture.js, render.js, measurement.js, elevation.js, dividers.js, fixtures.js)
- High risk of breaking visual output
- Requires extensive testing

**Refactor Now (Phase 3):**
- Organize render functions into modules
- Extract common SVG building patterns
- Add JSDoc comments for each render function

**Re-implement Later (Future Phase):**
- Replace string concat with createElementNS()
- Implement virtual DOM or diffing algorithm
- Enable incremental rendering

**Estimated Future Effort:** 20-30 hours
**When:** After Phase 6, as standalone project

---

#### 2. RenderManager with Proper Diffing

**Current State:**
- Scattered render calls (17+ in app.js alone)
- No coordination between renders
- Full rebuilds for partial changes

**Why Not Now:**
- Requires SVG rendering re-implementation first
- Complex dependency on virtual DOM system
- Needs architectural planning

**Refactor Now (Phase 3):**
- Create simple RenderManager for orchestration
- Centralize render calls
- Add dirty-marking system

**Re-implement Later (Future Phase):**
- Implement proper diffing algorithm
- Only update changed SVG elements
- Batch updates for performance

**Estimated Future Effort:** 15-20 hours
**When:** After SVG rendering re-implementation

---

#### 3. Measurement System Redesign

**Current State:**
- Complex interplay between locked, temporary, and anchor measurements
- renderAllMeasurements has O(n) room lookups per item
- 1,213 lines in single file

**Why Not Now:**
- Deeply integrated with floor plan data model
- Complex user-facing behavior with many edge cases
- Requires UX design decisions

**Refactor Now (Phase 3):**
- Split into measurement/core, measurement/render, measurement/events
- Cache room containment on furniture
- Document current behavior

**Re-implement Later (Future Phase):**
- Redesign measurement data model
- Implement constraint-based measurement system
- Add smart measurement suggestions

**Estimated Future Effort:** 25-35 hours
**When:** After gaining more user feedback

---

## Success Metrics

### Code Quality Metrics

| Metric | Before | After Phase 1 | After Phase 6 | Goal |
|--------|--------|---------------|---------------|------|
| Total Lines | 6,572 | ~6,470 | ~6,000 | -10% |
| Duplicate Code | ~650 lines | ~550 lines | <100 lines | <2% |
| Max Function Length | 472 lines | 472 lines | <150 lines | <200 |
| Cyclomatic Complexity | High | Medium | Low | Low |
| Test Coverage | 0% | 0% | 60%+ | 60% |

### Performance Metrics

| Operation | Before | After Phase 2 | After Phase 4 | Improvement |
|-----------|--------|---------------|---------------|-------------|
| Collision Check (20 items) | 400 checks | ~8 checks | ~8 checks | 50x |
| Collision Check (100 items) | 10,000 checks | ~20 checks | ~20 checks | 500x |
| Color Access (per render) | 17 forced reflows | 0 reflows | 0 reflows | ∞ |
| ID Lookup | O(n) 50 items | O(1) | O(1) | 50x |
| Event Listener Churn (2s drag) | 14,400 create/destroy | 14,400 | 0 | ∞ |
| Furniture Render (30 items) | ~50ms | ~50ms | ~5ms | 10x |

---

## Risk Mitigation

### High-Risk Tasks

1. **Collision Detection Re-implementation** (Phase 2)
   - **Risk:** Spatial hash bugs could cause false positives/negatives
   - **Mitigation:** Extensive unit tests, visual debugging mode, parallel run with old system

2. **Event Delegation** (Phase 4)
   - **Risk:** Breaking drag/drop interactions
   - **Mitigation:** Feature flag to toggle between old/new, thorough manual testing

3. **Event Bus Migration** (Phase 2)
   - **Risk:** Missing window._ migration breaks features
   - **Mitigation:** Grep for all window._ assignments, create migration checklist

### Testing Strategy

**For Re-implementations:**
1. Write tests for current behavior FIRST
2. Implement new system alongside old
3. Run both in parallel, compare outputs
4. Switch over only when test coverage adequate
5. Keep old code commented out for 1 release cycle

**For Refactorings:**
1. Make change
2. Test manually
3. Commit
4. Move to next task

---

## Conclusion

This unified roadmap achieves professional-grade code quality through a balanced approach:

- **60% Refactoring** - Low-risk improvements to organization and structure
- **40% Re-implementation** - High-impact rewrites of fundamentally flawed systems

**Total Effort:** 50-73 hours (6-9 working days)
**Expected Outcome:**
- 10-20% code reduction
- 50-500x performance improvements on critical paths
- Zero memory leaks
- Professional architecture
- 60%+ test coverage

**Key Principle:** Refactor what's structurally sound, re-implement what's fundamentally broken, and organize everything for future maintainability.

---

*This roadmap supersedes the original REFACTORING.md and integrates performance analysis. See git history for evolution of this plan.*

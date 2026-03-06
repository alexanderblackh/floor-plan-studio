# Code Refactoring Documentation

**Generated:** 2026-03-05
**Status:** Planning
**Codebase Size:** 6,585 lines across 14 JavaScript modules

This document provides a comprehensive audit of code quality issues and refactoring opportunities in Floor Plan Studio. Issues are categorized by severity and impact, with specific file locations and recommended solutions.

---

## Executive Summary

The Floor Plan Studio codebase is **functionally solid** with good separation of concerns across modules. However, analysis revealed:

- **~5-7% code duplication** across files (angle snapping, menu closing, CSV parsing)
- **Architectural concern:** Over-reliance on 40+ global `window._` callbacks creates tight coupling
- **Maintenance burden:** Single 472-line function needs decomposition
- **Consistency issues:** Similar tasks implemented differently across modules

**Quick Wins Available:**
- Extract angle snapping utility (5 hours, high impact)
- Consolidate anchor point functions (2 hours, eliminates duplication)
- Extract menu closing pattern (3 hours, improves consistency)

**Long-term Improvement:**
Implement proper module communication (EventEmitter or pubsub) to replace global callbacks.

---

## Table of Contents

1. [Duplicate Logic](#1-duplicate-logic)
2. [Refactoring Opportunities](#2-refactoring-opportunities)
3. [Inconsistent Patterns](#3-inconsistent-patterns)
4. [Unused Code](#4-unused-code)
5. [Code Smells](#5-code-smells)
6. [Large/Complex Files](#6-largecomplex-files)
7. [Testing & Maintainability](#7-testing--maintainability)
8. [Priority Refactoring Roadmap](#8-priority-refactoring-roadmap)

---

## 1. Duplicate Logic

### 1.1 45-Degree Angle Snapping Logic ⚠️ CRITICAL

**Severity:** High
**Impact:** 100+ lines of duplicate code, maintenance burden

**Files Affected:**
- `js/measurement.js` (lines 71-96)
- `js/dividers.js` (lines 56-78, 186-209, 280-302)

**Issue:**
Identical angle-snapping code duplicated across 3 locations:

```javascript
const snapAngles = [0, 45, 90, 135, 180, -135, -90, -45];
let nearestAngle = snapAngles[0];
let minDiff = Math.abs(angle - nearestAngle);
for (const snapAngle of snapAngles) {
  const diff = Math.abs(angle - snapAngle);
  if (diff < minDiff) {
    minDiff = diff;
    nearestAngle = snapAngle;
  }
}
const radians = nearestAngle * Math.PI / 180;
```

**Recommended Solution:**

Extract to `js/utils.js`:

```javascript
/**
 * Snaps an angle in degrees to the nearest 45-degree increment.
 * @param {number} angle - Angle in degrees
 * @returns {number} - Snapped angle in degrees
 */
export function snapToNearestAngle(angle) {
  const snapAngles = [0, 45, 90, 135, 180, -135, -90, -45];
  return snapAngles.reduce((nearest, snap) =>
    Math.abs(snap - angle) < Math.abs(nearest - angle) ? snap : nearest
  );
}

/**
 * Converts angle to radians.
 * @param {number} degrees - Angle in degrees
 * @returns {number} - Angle in radians
 */
export function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}
```

**Usage:**
```javascript
import { snapToNearestAngle, degreesToRadians } from './utils.js';

const snappedAngle = snapToNearestAngle(angle);
const radians = degreesToRadians(snappedAngle);
```

**Effort:** 20-30 minutes
**Benefit:** Single source of truth, easier to modify angle snapping behavior

---

### 1.2 Anchor Point Calculation ⚠️ CRITICAL

**Severity:** High
**Impact:** Identical function defined in two files

**Files Affected:**
- `js/app.js` (lines 711-723) - `getAnchorPoints()`
- `js/measurement.js` (lines 245-260) - duplicate `getAnchorPoints()`

**Issue:**
Function returning 9 anchor points on a rectangle defined identically in both files:

```javascript
function getAnchorPoints(x, y, w, h) {
  return {
    topLeft: { x, y },
    topCenter: { x: x + w/2, y },
    topRight: { x: x + w, y },
    centerLeft: { x, y: y + h/2 },
    center: { x: x + w/2, y: y + h/2 },
    centerRight: { x: x + w, y: y + h/2 },
    bottomLeft: { x, y: y + h },
    bottomCenter: { x: x + w/2, y: y + h },
    bottomRight: { x: x + w, y: y + h }
  };
}
```

**Recommended Solution:**

Move to `js/geometry.js`:

```javascript
/**
 * Calculates 9 anchor points (corners, centers, and midpoints) for a rectangle.
 * @param {number} x - Rectangle x position
 * @param {number} y - Rectangle y position
 * @param {number} w - Rectangle width
 * @param {number} h - Rectangle height
 * @returns {Object} - Object with 9 anchor points
 */
export function getAnchorPoints(x, y, w, h) {
  return {
    topLeft: { x, y },
    topCenter: { x: x + w/2, y },
    topRight: { x: x + w, y },
    centerLeft: { x, y: y + h/2 },
    center: { x: x + w/2, y: y + h/2 },
    centerRight: { x: x + w, y: y + h/2 },
    bottomLeft: { x, y: y + h },
    bottomCenter: { x: x + w/2, y: y + h },
    bottomRight: { x: x + w, y: y + h }
  };
}
```

Import in both `app.js` and `measurement.js`:

```javascript
import { getAnchorPoints } from './geometry.js';
```

**Effort:** 10-15 minutes
**Benefit:** Single definition, easier testing

---

### 1.3 Closest Anchor Point Finding

**Severity:** Medium
**Impact:** Similar logic with slight variations

**Files Affected:**
- `js/app.js` (lines 726-749) - `findClosestAnchorPointsBetween()`
- `js/measurement.js` (lines 245-260) - similar logic

**Issue:**
Nearly identical logic for finding closest anchor points between two objects, but implementation differs slightly. Needs review to determine if consolidation is possible or if differences are intentional.

**Recommended Action:**
Analyze both implementations to determine if a shared utility function can handle both use cases.

---

### 1.4 Menu Closing Pattern ⚠️ HIGH

**Severity:** Medium
**Impact:** Repeated code in 6+ locations

**Files Affected:**
- `js/app.js` (lines 412-419, 461-466, 495-500, 529-534, 550-556)
- `js/io.js` (lines 502-508)

**Issue:**
Identical pattern for closing menus on click outside:

```javascript
setTimeout(() => {
  document.addEventListener('click', function closeMenu(e) {
    if (!e.target.closest('.toolbar-dropdown')) {
      menu.style.display = 'none';
      document.removeEventListener('click', closeMenu);
    }
  });
}, 0);
```

This pattern appears in:
- `toggleZoomMenu()`
- `toggleViewMenu()`
- `toggleExportMenu()` (both app.js and io.js)
- `toggleImportMenu()`
- `toggleUnitMenu()`

**Recommended Solution:**

Extract to `js/domHelpers.js`:

```javascript
/**
 * Sets up click-outside-to-close behavior for a menu element.
 * @param {HTMLElement} menuElement - The menu element to close
 * @param {string[]} exclusionSelectors - Selectors to exclude from outside click
 */
export function setupMenuOutsideClickClose(menuElement, exclusionSelectors = ['.toolbar-dropdown', '.toolbar-menu']) {
  setTimeout(() => {
    const closeMenu = (e) => {
      if (!exclusionSelectors.some(sel => e.target.closest(sel))) {
        menuElement.style.display = 'none';
        document.removeEventListener('click', closeMenu);
      }
    };
    document.addEventListener('click', closeMenu);
  }, 0);
}
```

**Usage:**
```javascript
import { setupMenuOutsideClickClose } from './domHelpers.js';

function toggleZoomMenu(e) {
  const menu = document.getElementById('zoomMenu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  if (menu.style.display === 'block') {
    setupMenuOutsideClickClose(menu);
  }
}
```

**Effort:** 30-40 minutes
**Benefit:** Single implementation, consistent behavior

---

### 1.5 Toggle Visibility Functions

**Severity:** Medium
**Impact:** Similar pattern repeated 4 times

**Files Affected:**
- `js/app.js` (lines 213-246)

**Issue:**
Similar pattern for toggle functions:

```javascript
function toggleShowAll() {
  state.showAll = !state.showAll;
  updateViewMenuChecks();
  savePreferences();
  if (window._renderMeasurement) window._renderMeasurement();
  if (window._renderAnchors) window._renderAnchors();
  if (window._renderDividers) window._renderDividers();
}

function toggleShowAllMeasurements() {
  state.showAllMeasurements = !state.showAllMeasurements;
  updateViewMenuChecks();
  savePreferences();
  if (window._renderMeasurement) window._renderMeasurement();
}
```

**Recommended Solution:**

Use factory pattern:

```javascript
/**
 * Creates a toggle function for a boolean state property.
 * @param {string} stateKey - Key in state object
 * @param {Function[]} renderFunctions - Functions to call after toggle
 */
function createToggleFunction(stateKey, renderFunctions = []) {
  return function() {
    state[stateKey] = !state[stateKey];
    updateViewMenuChecks();
    savePreferences();
    renderFunctions.forEach(fn => fn && fn());
  };
}

const toggleShowAll = createToggleFunction('showAll', [
  () => window._renderMeasurement?.(),
  () => window._renderAnchors?.(),
  () => window._renderDividers?.()
]);

const toggleShowAllMeasurements = createToggleFunction('showAllMeasurements', [
  () => window._renderMeasurement?.()
]);
```

**Effort:** 20-30 minutes
**Benefit:** Reduced repetition, easier to add new toggles

---

### 1.6 CSV Import/Export Logic Duplication

**Severity:** Medium
**Impact:** Duplicate parsing logic

**Files Affected:**
- `js/app.js` (lines 1609-1620)
- `js/io.js` (lines 461-470)

**Issue:**
CSV furniture position parsing appears in both `handleCSVDrop()` in app.js and `importCSV()` in io.js:

```javascript
if (xCol >= 0) { const v = parseFloat(cols[xCol]); if (!isNaN(v)) piece.x = v; }
if (yCol >= 0) { const v = parseFloat(cols[yCol]); if (!isNaN(v)) piece.y = v; }
if (rotCol >= 0) piece.rotated = cols[rotCol] === 'true';
if (elevCol >= 0) { const v = parseFloat(cols[elevCol]); if (!isNaN(v)) piece.elevation = v; }
```

**Recommended Solution:**

Extract to shared function in `js/io.js`:

```javascript
/**
 * Parses CSV columns and updates furniture piece properties.
 * @param {Object} piece - Furniture piece to update
 * @param {string[]} cols - CSV column values
 * @param {Object} columnMap - Map of property names to column indices
 */
function applyCSVColumnsToFurniture(piece, cols, columnMap) {
  const { xCol, yCol, rotCol, elevCol } = columnMap;

  if (xCol >= 0) {
    const v = parseFloat(cols[xCol]);
    if (!isNaN(v)) piece.x = v;
  }

  if (yCol >= 0) {
    const v = parseFloat(cols[yCol]);
    if (!isNaN(v)) piece.y = v;
  }

  if (rotCol >= 0) {
    piece.rotated = cols[rotCol] === 'true';
  }

  if (elevCol >= 0) {
    const v = parseFloat(cols[elevCol]);
    if (!isNaN(v)) piece.elevation = v;
  }
}
```

**Effort:** 20-30 minutes
**Benefit:** Consistent CSV parsing behavior

---

### 1.7 Re-render Orchestration ⚠️ HIGH

**Severity:** Medium
**Impact:** Identical render sequence in multiple places

**Files Affected:**
- `js/history.js` (lines 70-77, 103-110)

**Issue:**
Both `undo()` and `redo()` have identical re-render sequence:

```javascript
buildSVG();
renderFurniture();
renderStagingFurniture();
if (state.fixtureEditMode) renderFixtureHandles();
if (window._renderAnchors) window._renderAnchors();
if (window._renderMeasurement) window._renderMeasurement();
if (window._renderDividers) window._renderDividers();
```

**Recommended Solution:**

Extract to shared function:

```javascript
/**
 * Performs complete re-render of all canvas elements.
 */
export function renderComplete() {
  buildSVG();
  renderFurniture();
  renderStagingFurniture();
  if (state.fixtureEditMode) renderFixtureHandles();
  if (window._renderAnchors) window._renderAnchors();
  if (window._renderMeasurement) window._renderMeasurement();
  if (window._renderDividers) window._renderDividers();
}
```

Usage in `history.js`:

```javascript
import { renderComplete } from './render.js';

export function undo() {
  if (history.index > 0) {
    history.index--;
    restoreState(history.stack[history.index]);
    renderComplete();
  }
}

export function redo() {
  if (history.index < history.stack.length - 1) {
    history.index++;
    restoreState(history.stack[history.index]);
    renderComplete();
  }
}
```

**Effort:** 10-15 minutes
**Benefit:** Consistent render behavior, single place to modify render pipeline

---

## 2. Refactoring Opportunities

### 2.1 Global Callback Pattern ⚠️ ARCHITECTURAL ISSUE - HIGH

**Severity:** High
**Impact:** Tight coupling, difficult testing, unclear dependencies

**Affected Files:**
All modules (`app.js`, `measurement.js`, `furniture.js`, `history.js`, `elevation.js`, etc.)

**Issue:**
Heavy reliance on `window._renderMeasurement`, `window._renderAnchors`, `window._renderFurniture`, etc. as global callbacks. The codebase has **40+ window._ assignments** across multiple files.

**Examples:**
```javascript
// measurement.js line 62
window._renderMeasurement = renderMeasurement;

// app.js line 40
window._applyTransform = applyTransform;

// furniture.js line 155
if (window._renderElevation && state.showElevation) window._renderElevation();
```

**Problems:**
- Tight coupling between modules
- Difficult to trace execution flow
- No clear dependency graph
- Hard to test in isolation
- Functions must check for existence before calling

**Recommended Solution:**

Implement event-driven architecture:

**Create `js/events.js`:**

```javascript
/**
 * Simple event emitter for module communication.
 */
class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * Subscribe to an event.
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  /**
   * Emit an event with data.
   * @param {string} event - Event name
   * @param {*} data - Data to pass to callbacks
   */
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  }

  /**
   * Subscribe to an event once.
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      callback(data);
      unsubscribe();
    });
  }
}

export const events = new EventEmitter();

// Event names
export const EVENTS = {
  FURNITURE_UPDATED: 'furniture:updated',
  MEASUREMENT_UPDATED: 'measurement:updated',
  DIVIDER_UPDATED: 'divider:updated',
  ANCHOR_UPDATED: 'anchor:updated',
  ELEVATION_UPDATED: 'elevation:updated',
  STATE_CHANGED: 'state:changed',
  TRANSFORM_APPLIED: 'transform:applied'
};
```

**Usage Example:**

```javascript
// measurement.js
import { events, EVENTS } from './events.js';

export function renderMeasurement() {
  // ... render logic ...
}

// Subscribe to updates
events.on(EVENTS.FURNITURE_UPDATED, renderMeasurement);
events.on(EVENTS.TRANSFORM_APPLIED, renderMeasurement);

// Emit events when data changes
export function addLockedMeasurement() {
  // ... logic ...
  events.emit(EVENTS.MEASUREMENT_UPDATED);
}
```

```javascript
// furniture.js
import { events, EVENTS } from './events.js';

export function renderFurniture() {
  // ... render logic ...
  events.emit(EVENTS.FURNITURE_UPDATED);
}
```

**Migration Strategy:**
1. Create events.js with EventEmitter
2. Keep window._ callbacks for backward compatibility
3. Gradually migrate modules to use events
4. Remove window._ callbacks once all modules migrated

**Effort:** 8-12 hours
**Benefit:** Loose coupling, testable modules, clear dependencies

---

### 2.2 Render Calls Scattered Throughout Code

**Severity:** Medium
**Impact:** Difficult to understand render pipeline, potential for missed/redundant renders

**Issue:**
`renderFurniture()`, `renderMeasurement()`, `renderDividers()` called in numerous places:
- `app.js`: 17+ calls
- `furniture.js`: 9+ calls
- `history.js`: 2+ calls
- `io.js`: multiple locations

**Recommended Solution:**

Create render manager in `js/renderManager.js`:

```javascript
/**
 * Manages rendering of all canvas components.
 * Uses dirty-marking to avoid redundant renders.
 */
class RenderManager {
  constructor() {
    this.dirty = new Set();
    this.rendering = false;
  }

  /**
   * Mark a component as dirty (needs re-render).
   * @param {string} component - Component name
   */
  mark(component) {
    this.dirty.add(component);
    this.scheduleRender();
  }

  /**
   * Mark multiple components as dirty.
   * @param {string[]} components - Component names
   */
  markAll(components) {
    components.forEach(c => this.dirty.add(c));
    this.scheduleRender();
  }

  /**
   * Schedule a render on next animation frame.
   */
  scheduleRender() {
    if (!this.rendering) {
      this.rendering = true;
      requestAnimationFrame(() => {
        this.renderAll();
        this.rendering = false;
      });
    }
  }

  /**
   * Render all dirty components.
   */
  renderAll() {
    if (this.dirty.has('svg')) buildSVG();
    if (this.dirty.has('furniture')) renderFurniture();
    if (this.dirty.has('staging')) renderStagingFurniture();
    if (this.dirty.has('measurement')) window._renderMeasurement?.();
    if (this.dirty.has('anchors')) window._renderAnchors?.();
    if (this.dirty.has('dividers')) window._renderDividers?.();
    if (this.dirty.has('elevation')) window._renderElevation?.();

    this.dirty.clear();
  }

  /**
   * Force immediate render without dirty checking.
   */
  forceRender() {
    this.markAll(['svg', 'furniture', 'staging', 'measurement', 'anchors', 'dividers', 'elevation']);
    this.renderAll();
  }
}

export const renderManager = new RenderManager();
```

**Usage:**
```javascript
import { renderManager } from './renderManager.js';

// Mark single component
renderManager.mark('furniture');

// Mark multiple components
renderManager.markAll(['furniture', 'measurement']);

// Force complete re-render
renderManager.forceRender();
```

**Effort:** 3-4 hours
**Benefit:** Centralized render control, prevents redundant renders, improves performance

---

### 2.3 State Access Pattern

**Severity:** Medium
**Impact:** No encapsulation or validation

**Files Affected:**
All modules access `state` directly

**Issue:**
Raw state object exported from `data.js` and mutated directly throughout the codebase:

```javascript
// app.js line 213
state.showAll = !state.showAll;

// furniture.js line 27
const p = state.placedFurniture[idx];

// Many direct mutations with no side-effect handling
```

**Recommended Solution:**

Create state accessor functions in `js/data.js`:

```javascript
/**
 * Gets a placed furniture piece by index.
 * @param {number} idx - Index in placedFurniture array
 * @returns {Object|null} - Furniture piece or null if not found
 */
export function getPlacedFurniture(idx) {
  return state.placedFurniture[idx] ?? null;
}

/**
 * Sets showAll state and triggers side effects.
 * @param {boolean} value - New showAll value
 */
export function setShowAll(value) {
  if (state.showAll !== value) {
    state.showAll = value;
    savePreferences();
    events.emit(EVENTS.STATE_CHANGED, { showAll: value });
  }
}

/**
 * Adds a placed furniture piece.
 * @param {Object} piece - Furniture piece data
 */
export function addPlacedFurniture(piece) {
  state.placedFurniture.push(piece);
  saveToCache();
  events.emit(EVENTS.FURNITURE_UPDATED);
}
```

**Migration Strategy:**
1. Add accessor functions alongside direct access
2. Gradually migrate code to use accessors
3. Eventually make state object private

**Effort:** 6-8 hours
**Benefit:** Controlled state access, side-effect handling, easier debugging

---

### 2.4 DOM Query Patterns

**Severity:** Low
**Impact:** Repetitive code

**Files Affected:**
- `js/app.js` (lines 75-191)

**Issue:**
Repeated patterns of `document.getElementById()` and `?.classList.toggle()`:

```javascript
document.getElementById('btnGrid')?.classList.toggle('active', state.showGrid);
document.getElementById('btnDims')?.classList.toggle('active', state.showDims);
// ... 12+ similar patterns
```

**Recommended Solution:**

Create DOM helper in `js/domHelpers.js`:

```javascript
/**
 * Updates a button's active state.
 * @param {string} buttonId - Button element ID
 * @param {boolean} isActive - Whether button should be active
 */
export function updateButtonState(buttonId, isActive) {
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.classList.toggle('active', isActive);
  }
}

/**
 * Updates multiple checkmarks at once.
 * @param {Object[]} checks - Array of {elementId, value} objects
 */
export function updateCheckmarks(checks) {
  checks.forEach(({ elementId, value }) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = value ? '✓' : '';
    }
  });
}
```

**Usage:**
```javascript
import { updateButtonState, updateCheckmarks } from './domHelpers.js';

updateButtonState('btnGrid', state.showGrid);
updateButtonState('btnDims', state.showDims);

updateCheckmarks([
  { elementId: 'gridCheck', value: state.showGrid },
  { elementId: 'snapToGridCheck', value: state.snapToGrid }
]);
```

**Effort:** 30-45 minutes
**Benefit:** Cleaner code, reusable utilities

---

### 2.5 Try-Catch Swallowing

**Severity:** Medium
**Impact:** Silent failures make debugging difficult

**Files Affected:**
- `js/data.js` (lines 184-195, 200-220, 282-354)
- `js/app.js` (lines 1248-1251, 1294-1304, 1306-1322)

**Issue:**
Empty catch blocks silently fail:

```javascript
export function saveToCache() {
  try {
    localStorage.setItem('fps-floor-plan', JSON.stringify(state.floorPlan));
  } catch(e) { /* quota exceeded or private browsing */ }
}
```

**Recommended Solution:**

Proper error handling:

```javascript
export function saveToCache() {
  try {
    localStorage.setItem('fps-floor-plan', JSON.stringify(state.floorPlan));
  } catch(e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, data may be incomplete');
      if (window.showToast) {
        window.showToast('Storage quota exceeded. Some data may not be saved.', 'error', 5000);
      }
    } else if (e.name === 'SecurityError') {
      console.warn('localStorage disabled (private browsing mode?)');
    } else {
      console.error('Failed to save to cache:', e);
    }
  }
}
```

**Effort:** 30-40 minutes
**Benefit:** Better debugging, user feedback on failures

---

### 2.6 Long Function: `attachCanvasEvents()` ⚠️ HIGH

**Severity:** High
**Impact:** 472 lines in a single function, multiple responsibilities

**File:** `js/app.js` (lines 772-1244)

**Responsibilities:**
1. Touch event handling (lines 788-872) - 85 lines
2. Mouse wheel zoom (lines 874-884) - 10 lines
3. Door/closet door click handling (lines 886-962) - 77 lines
4. Divider mode handling (lines 967-970) - 4 lines
5. Anchor mode handling (lines 972-1030) - 59 lines
6. Measure mode handling (lines 1032-1053) - 22 lines
7. Panning (lines 1061-1065) - 5 lines
8. Drag move events (lines 1068-1104) - 37 lines
9. Keyboard shortcuts (lines 1115-1243) - 129 lines

**Recommended Solution:**

Split into focused modules in `js/interactions/`:

```javascript
// js/interactions/touch.js
export function setupTouchHandlers(ctr) {
  // 85 lines of touch logic
}

// js/interactions/zoom.js
export function setupMouseWheelZoom(ctr) {
  // 20 lines of zoom logic
}

// js/interactions/doors.js
export function setupDoorHandling(ctr) {
  // 80 lines of door logic
}

// js/interactions/keyboard.js
export function setupKeyboardShortcuts() {
  // 130 lines of keyboard logic
}

// js/interactions/drag.js
export function setupDragHandlers(ctr) {
  // 50 lines of drag logic
}

// js/interactions/modes.js
export function setupModeHandlers(ctr) {
  // Divider, anchor, measurement modes
}
```

**Refactored `app.js`:**

```javascript
import { setupTouchHandlers } from './interactions/touch.js';
import { setupMouseWheelZoom } from './interactions/zoom.js';
import { setupDoorHandling } from './interactions/doors.js';
import { setupKeyboardShortcuts } from './interactions/keyboard.js';
import { setupDragHandlers } from './interactions/drag.js';
import { setupModeHandlers } from './interactions/modes.js';

function attachCanvasEvents() {
  const ctr = document.getElementById('canvasContainer');
  if (!ctr) return;

  setupTouchHandlers(ctr);
  setupMouseWheelZoom(ctr);
  setupDoorHandling(ctr);
  setupDragHandlers(ctr);
  setupModeHandlers(ctr);
  setupKeyboardShortcuts();
}
```

**Effort:** 4-6 hours
**Benefit:** Maintainable code, easier testing, clearer responsibilities

---

### 2.7 Long Function: `updateViewMenuChecks()`

**Severity:** Low
**Impact:** 58 lines of repetitive code

**File:** `js/app.js` (lines 154-211)

**Issue:**
Updates 13+ checkbox elements with identical pattern:

```javascript
if (gridCheck) gridCheck.textContent = state.showGrid ? '✓' : '';
if (snapToGridCheck) snapToGridCheck.textContent = state.snapToGrid ? '✓' : '';
// ... 11 more times
```

**Recommended Solution:**

Data-driven approach:

```javascript
const CHECKMARKS = [
  { id: 'gridCheck', stateKey: 'showGrid' },
  { id: 'snapToGridCheck', stateKey: 'snapToGrid' },
  { id: 'dimsCheck', stateKey: 'showDims' },
  { id: 'labelsCheck', stateKey: 'showLabels' },
  { id: 'roomColorsCheck', stateKey: 'showRoomColors' },
  { id: 'showAllCheck', stateKey: 'showAll' },
  { id: 'showAllMeasurementsCheck', stateKey: 'showAllMeasurements' },
  { id: 'showAllLinksCheck', stateKey: 'showAllLinks' },
  { id: 'showAllDividersCheck', stateKey: 'showAllDividers' }
];

function updateViewMenuChecks() {
  CHECKMARKS.forEach(({ id, stateKey }) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = state[stateKey] ? '✓' : '';
    }
  });
}
```

**Effort:** 10-15 minutes
**Benefit:** Easier to add new checkmarks, cleaner code

---

### 2.8 Inconsistent Event Handler Attachment

**Severity:** Medium
**Impact:** Unclear patterns

**Files Affected:**
- `js/furniture.js` - `attachFurnitureEvents()` (line 160)
- `js/dividers.js` - `attachDividerEvents()` (line 135)
- `js/measurement.js` - `attachLockedMeasurementEvents()` (line 1109)

**Issue:**
Some use `document.querySelectorAll()` while others use inline event binding in SVG generation. No consistent pattern.

**Recommended Solution:**

Standardize on event delegation pattern:

```javascript
// Use event delegation on parent SVG
svg.addEventListener('click', (e) => {
  if (e.target.classList.contains('furniture-piece')) {
    handleFurnitureClick(e);
  } else if (e.target.classList.contains('divider-handle')) {
    handleDividerClick(e);
  }
});
```

**Effort:** 3-4 hours
**Benefit:** Consistent event handling, better performance

---

## 3. Inconsistent Patterns

### 3.1 Module Export Styles

**Severity:** Low
**Impact:** Confusion about export conventions

**Issue:**
Mix of export styles across modules:

```javascript
// Style 1: Export + window assignment
export function renderMeasurement() { ... }
window._renderMeasurement = renderMeasurement;

// Style 2: Only window assignment
window.toggleDividerMode = toggleDividerMode;

// Style 3: Only export
export function calculateDistance() { ... }
```

**Recommended Solution:**

Standardize on ES module exports:
- Use `export` for module functions
- Only assign to `window` for functions called from inline HTML event handlers
- Document why each window assignment exists

**Effort:** 15-20 minutes (documentation)
**Benefit:** Clearer intent

---

### 3.2 State Initialization

**Severity:** Low
**Impact:** Minor inconsistency

**Issue:**
Different initialization patterns:

```javascript
// data.js - module-level export
export const state = { /* ... */ };

// history.js - module-scoped constant
const history = {
  stack: [],
  index: -1
};
```

**Recommended Solution:**

Consistent pattern:
- Public state → `export const`
- Private state → `const` (not exported)

**Effort:** 10-15 minutes
**Benefit:** Clear public vs. private state

---

### 3.3 Coordinate System Conversions

**Severity:** Medium
**Impact:** Calculation spread across files

**Issue:**
Inconsistent naming and location:
- `S(i)` in `data.js`: scale function
- `wx(x)` and `wy(y)` in `render.js`: wall coordinates
- `PAD` in `data.js`: padding constant

**Examples:**
```javascript
// furniture.js line 32
const w = p.rotated ? S(d.h) : S(d.w);

// render.js line 75
const pts = room.vertices.map(([x,y]) => `${wx(x)},${wy(y)}`).join(' ');

// measurement.js line 46
const sx1 = PAD + S(state.measureStart.x);
```

**Recommended Solution:**

Centralized coordinate conversion in `js/coordinates.js`:

```javascript
/**
 * Coordinate conversion utilities.
 */

import { state } from './data.js';

export const PAD = 20;

/**
 * Scale inches to SVG pixels.
 * @param {number} inches - Inches value
 * @returns {number} - SVG pixels
 */
export function scaleToSVG(inches) {
  return inches * state.scale;
}

/**
 * Convert floor plan X coordinate to SVG X.
 * @param {number} x - Floor plan X
 * @returns {number} - SVG X
 */
export function toSVGX(x) {
  return PAD + scaleToSVG(x);
}

/**
 * Convert floor plan Y coordinate to SVG Y.
 * @param {number} y - Floor plan Y
 * @returns {number} - SVG Y
 */
export function toSVGY(y) {
  return PAD + scaleToSVG(y);
}

/**
 * Convert floor plan point to SVG coordinate string.
 * @param {number} x - Floor plan X
 * @param {number} y - Floor plan Y
 * @returns {string} - SVG coordinate string "x,y"
 */
export function pointToSVG(x, y) {
  return `${toSVGX(x)},${toSVGY(y)}`;
}
```

**Effort:** 2-3 hours
**Benefit:** Centralized conversions, easier to modify coordinate system

---

### 3.4 Color Variable Access

**Severity:** Low
**Impact:** Minor performance impact

**Issue:**
Some files call `getComputedStyle()` multiple times:

```javascript
// dividers.js - called twice in same function
const accentColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--accent-gold').trim() || '#c5975b';

const dividerColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--text-dimmer').trim() || '#666';
```

**Recommended Solution:**

Use centralized helper from `render.js`:

```javascript
import { getCSSVar } from './render.js';

const accentColor = getCSSVar('--accent-gold') || '#c5975b';
const dividerColor = getCSSVar('--text-dimmer') || '#666';
```

**Effort:** 10-15 minutes
**Benefit:** Consistent color access, slight performance improvement

---

## 4. Unused Code

### 4.1 Potentially Unused Functions

**Findings:**

1. **`getDimensions()` in `data.js` (line 149)**
   - Defined but not called anywhere in analyzed codebase
   - May be legacy or planned for future use
   - **Action:** Review and remove if truly unused

2. **`findStackBase()` in `collision.js` (line 197)**
   - Only called from `autoStack()` (line 239)
   - `autoStack()` only called from `furniture.js` `handleDragEnd()` (line 437)
   - Appears to be actively used
   - **Action:** No change needed

### 4.2 Exposed Global Functions Without Clear Use

**Issue:**
Multiple functions exposed to `window` in `app.js` (lines 1348-1398):

```javascript
window.fitToView = fitToView;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.toggleGrid = toggleGrid;
// ... many more
```

**Action:**
Audit which functions are actually called from HTML `onclick` handlers. Remove unused window assignments.

**Effort:** 20-30 minutes
**Benefit:** Cleaner global namespace

---

## 5. Code Smells

### 5.1 Magic Numbers and Strings

**Severity:** Medium
**Impact:** Unclear intent, hard to modify

**Examples:**

```javascript
// app.js line 45
state.zoom = Math.min(15, state.zoom * 1.3);

// app.js line 54
state.zoom = Math.max(0.15, state.zoom * 0.77);

// app.js line 402
const menuW = 160;

// elevation.js line 18
const ELEV_PPI = 3.5;

// collision.js line 223
if (overlapArea / smallerArea > 0.5) { // Magic 0.5 threshold
```

**Recommended Solution:**

Extract to constants file `js/constants.js`:

```javascript
/**
 * Application constants.
 */

// Zoom configuration
export const ZOOM = {
  MIN: 0.15,
  MAX: 15,
  IN_FACTOR: 1.3,
  OUT_FACTOR: 0.77
};

// UI dimensions
export const UI = {
  MENU_WIDTH: 160,
  MIN_TAP_TARGET: 44
};

// Elevation
export const ELEVATION = {
  PIXELS_PER_INCH: 3.5,
  MAX_HEIGHT: 120
};

// Collision
export const COLLISION = {
  OVERLAP_THRESHOLD: 0.5,
  STACK_TOLERANCE: 2
};

// History
export const HISTORY = {
  MAX_STACK_SIZE: 50
};
```

**Usage:**
```javascript
import { ZOOM } from './constants.js';

state.zoom = Math.min(ZOOM.MAX, state.zoom * ZOOM.IN_FACTOR);
```

**Effort:** 45-60 minutes
**Benefit:** Self-documenting code, easier to tune values

---

### 5.2 Deeply Nested Conditionals

**Severity:** Medium
**Impact:** Difficult to read and maintain

**File:** `js/app.js` (lines 900-962)

**Example:**
```javascript
if (state.fixtureEditMode && e.button === 0) {
  if (e.target.classList && e.target.classList.contains('door-handle')) {
    const wallIdx = parseInt(e.target.dataset.wallIdx);
    if (!isNaN(wallIdx)) {
      e.stopPropagation();
      e.preventDefault();
      const now = Date.now();
      if (lastDoorClick && lastDoorClick.wallIdx === wallIdx && (now - lastDoorClick.time) < 300) {
        // ... deeply nested logic ...
      }
    }
  }
}
```

**Recommended Solution:**

Use early returns and extract helper functions:

```javascript
function handleDoorClick(e) {
  // Guard clauses
  if (!state.fixtureEditMode) return;
  if (e.button !== 0) return;
  if (!e.target.classList?.contains('door-handle')) return;

  const wallIdx = parseInt(e.target.dataset.wallIdx);
  if (isNaN(wallIdx)) return;

  e.stopPropagation();
  e.preventDefault();

  if (isDoubleClick(wallIdx)) {
    handleDoorDoubleClick(wallIdx);
  } else {
    handleDoorSingleClick(wallIdx);
  }
}

function isDoubleClick(wallIdx) {
  const now = Date.now();
  return lastDoorClick &&
         lastDoorClick.wallIdx === wallIdx &&
         (now - lastDoorClick.time) < 300;
}
```

**Effort:** 45-60 minutes
**Benefit:** Improved readability, easier testing

---

### 5.3 Inconsistent Null/Undefined Checking

**Severity:** Low
**Impact:** Confusion about conventions

**Patterns Found:**

```javascript
// Style 1: Optional chaining + early return
const g = svg.querySelector('#measurementGroup');
if (!g) return;

// Style 2: Safe navigation in chain
const btn = document.getElementById('btnGrid')?.classList.toggle(...);

// Style 3: Manual check
if (gridCheck) gridCheck.textContent = state.showGrid ? '✓' : '';

// Style 4: Guard clause with default
const div = state.softDividers[idx];
const otherPoint = point === 'start' ? div.to : div.from;
```

**Recommended Solution:**

Document preferred patterns:
- Use optional chaining (`?.`) for DOM queries that may fail
- Use early returns for required elements
- Use nullish coalescing (`??`) for defaults

**Effort:** 10-15 minutes (documentation)
**Benefit:** Consistent patterns

---

### 5.4 Implicit Dependencies

**Severity:** High
**Impact:** Fragile module loading

**Issue:**
Modules depend on functions being set on window by other modules:

```javascript
// furniture.js line 155
if (window._renderElevation && state.showElevation) window._renderElevation();
```

**Problems:**
- If `elevation.js` doesn't expose `window._renderElevation`, code silently fails
- Order of module loading matters
- No clear dependency graph

**Recommended Solution:**

Use explicit imports or event system (see Section 2.1)

**Effort:** Part of Section 2.1 refactoring
**Benefit:** Clear dependencies, reliable execution

---

### 5.5 String-based Type Checks

**Severity:** Low
**Impact:** Potential typos, no autocomplete

**Examples:**

```javascript
// measurement.js line 1181
if (state.selectedMeasurement?.type === 'locked') {
  // ...
} else if (state.selectedMeasurement?.type === 'anchor') {
  // ...
}

// io.js line 200
if (data.type === 'full-plan' || (data.rooms && data.walls)) {
  // ...
}
```

**Recommended Solution:**

Use constants:

```javascript
// constants.js
export const MEASUREMENT_TYPES = {
  LOCKED: 'locked',
  ANCHOR: 'anchor',
  TEMPORARY: 'temporary'
};

export const PLAN_TYPES = {
  FULL_PLAN: 'full-plan',
  PLACEMENT_ONLY: 'placement-only'
};

// Usage
import { MEASUREMENT_TYPES } from './constants.js';

if (state.selectedMeasurement?.type === MEASUREMENT_TYPES.LOCKED) {
  // ...
}
```

**Effort:** 20-30 minutes
**Benefit:** Autocomplete, typo prevention

---

### 5.6 Side Effects in Functions

**Severity:** Medium
**Impact:** Hard to reason about, difficult to test

**Example:** `js/selection.js` (lines 60-106)

```javascript
export function alignSelection(mode) {
  const items = getSelectionBounds();
  if (items.length < 2) return;

  pushHistory();  // Side effect 1
  // ... mutation logic ...
  renderFurniture();  // Side effect 2
  renderStagingFurniture();  // Side effect 3
  saveToCache();  // Side effect 4
}
```

**Recommended Solution:**

Separate pure logic from side effects:

```javascript
/**
 * Calculate new positions for aligned items (pure function).
 */
function calculateAlignedPositions(items, mode) {
  // ... pure calculation logic ...
  return updatedItems;
}

/**
 * Align selection (orchestration with side effects).
 */
export function alignSelection(mode) {
  const items = getSelectionBounds();
  if (items.length < 2) return;

  pushHistory();

  const updatedItems = calculateAlignedPositions(items, mode);
  applyUpdates(updatedItems);

  renderFurniture();
  renderStagingFurniture();
  saveToCache();
}
```

**Effort:** 3-4 hours for major functions
**Benefit:** Testable logic, clearer intent

---

## 6. Large/Complex Files

**File Size Analysis:**

| File | Lines | Primary Issues |
|------|-------|----------------|
| `app.js` | 1,635 | `attachCanvasEvents()` 472 lines; multiple concerns mixed |
| `measurement.js` | 1,213 | Multiple complex rendering functions; could be split |
| `elevation.js` | 597 | Complex wall projection logic |
| `io.js` | 521 | Import/export logic could be modularized |
| `furniture.js` | 476 | Rendering + drag logic mixed |
| `collision.js` | 420 | Generally well-organized |
| `render.js` | 393 | Room/wall rendering; reasonable size |
| `dividers.js` | 356 | Reasonable size |
| `selection.js` | 291 | Reasonable size |

**Recommended Actions:**

1. **Priority 1:** Refactor `app.js` - split `attachCanvasEvents()` (see Section 2.6)
2. **Priority 2:** Split `measurement.js` into:
   - `measurement/core.js` - measurement state and logic
   - `measurement/render.js` - rendering functions
   - `measurement/events.js` - event handlers
3. **Priority 3:** Split `io.js` into:
   - `io/import.js` - import functions
   - `io/export.js` - export functions
   - `io/validation.js` - validation logic

---

## 7. Testing & Maintainability

### 7.1 Lack of Configuration Management

**Issue:**
Constants scattered across multiple files:
- `ZOOM` constants in `app.js`
- `ELEV_PPI` in `elevation.js`
- `MAX_HISTORY` in `history.js`
- `DEPTH_THRESHOLD` in `elevation.js`

**Recommended Solution:**

Create `js/config.js` (see Section 5.1)

---

### 7.2 No Error Boundaries

**Issue:**
Import/export logic could fail silently:
- JSON parse errors caught but user might not know
- CSV parsing with no validation framework

**Recommended Solution:**

Add comprehensive error handling with user feedback (see Section 2.5)

---

### 7.3 No Unit Tests

**Issue:**
No automated testing framework exists.

**Recommended Solution:**

Add Vitest for unit testing:

```javascript
// geometry.test.js
import { describe, it, expect } from 'vitest';
import { getAnchorPoints } from './geometry.js';

describe('getAnchorPoints', () => {
  it('should return 9 anchor points', () => {
    const points = getAnchorPoints(0, 0, 100, 50);
    expect(points.topLeft).toEqual({ x: 0, y: 0 });
    expect(points.center).toEqual({ x: 50, y: 25 });
    expect(points.bottomRight).toEqual({ x: 100, y: 50 });
  });
});
```

**Effort:** 4-6 hours for initial setup + critical function tests
**Benefit:** Confidence in refactoring, prevent regressions

---

## 8. Priority Refactoring Roadmap

### Phase 1: Quick Wins (2-3 hours)

**Goal:** Eliminate obvious duplication, improve consistency

**Tasks:**
1. ✅ Extract 45-degree angle snapping to `utils.js`
   - **Files:** `measurement.js`, `dividers.js` (3 locations)
   - **Effort:** 20-30 minutes
   - **Impact:** Eliminates 100+ lines of duplication

2. ✅ Consolidate anchor point functions to `geometry.js`
   - **Files:** `app.js`, `measurement.js`
   - **Effort:** 10-15 minutes
   - **Impact:** Single source of truth

3. ✅ Extract menu closing pattern to `domHelpers.js`
   - **Files:** `app.js`, `io.js` (6 locations)
   - **Effort:** 30-40 minutes
   - **Impact:** Consistent behavior

4. ✅ Extract re-render orchestration to `renderComplete()`
   - **Files:** `history.js`, potentially others
   - **Effort:** 10-15 minutes
   - **Impact:** Consistent render pipeline

5. ✅ Create constants file
   - **Files:** All files with magic numbers
   - **Effort:** 45-60 minutes
   - **Impact:** Self-documenting code

**Total Effort:** ~2.5 hours
**Expected Outcome:** 5-8% code reduction, significantly improved maintainability

---

### Phase 2: Architectural Improvements (16-20 hours)

**Goal:** Improve module communication and code organization

**Tasks:**
1. ✅ Split `attachCanvasEvents()` into focused modules
   - **File:** `app.js`
   - **Effort:** 4-6 hours
   - **Impact:** Maintainable event handling

2. ✅ Create EventEmitter for module communication
   - **Files:** All modules using `window._` callbacks
   - **Effort:** 8-12 hours
   - **Impact:** Loose coupling, testable modules

3. ✅ Create RenderManager
   - **Files:** All modules calling render functions
   - **Effort:** 3-4 hours
   - **Impact:** Centralized render control, performance improvement

4. ✅ Proper error handling in localStorage operations
   - **Files:** `data.js`, `app.js`
   - **Effort:** 30-40 minutes
   - **Impact:** Better debugging, user feedback

**Total Effort:** ~16-23 hours
**Expected Outcome:** 10-15% code reduction, clearer architecture

---

### Phase 3: Code Organization (10-14 hours)

**Goal:** Organize code into logical modules

**Tasks:**
1. ✅ Split `measurement.js` into sub-modules
   - **Effort:** 3-4 hours
   - **Impact:** Better organization

2. ✅ Split `io.js` into import/export/validation modules
   - **Effort:** 2-3 hours
   - **Impact:** Focused responsibilities

3. ✅ Create centralized coordinate conversion module
   - **Files:** `data.js`, `render.js`, `measurement.js`, `furniture.js`
   - **Effort:** 2-3 hours
   - **Impact:** Consistent conversions

4. ✅ Standardize event handler attachment
   - **Files:** `furniture.js`, `dividers.js`, `measurement.js`
   - **Effort:** 3-4 hours
   - **Impact:** Consistent patterns

**Total Effort:** ~10-14 hours
**Expected Outcome:** Better file organization, easier navigation

---

### Phase 4: State Management (9-12 hours)

**Goal:** Controlled state access with validation

**Tasks:**
1. ✅ Create state accessor functions
   - **File:** `data.js`
   - **Effort:** 6-8 hours
   - **Impact:** Controlled state access

2. ✅ Migrate code to use accessors
   - **Files:** All modules
   - **Effort:** 3-4 hours
   - **Impact:** Side-effect handling, easier debugging

**Total Effort:** ~9-12 hours
**Expected Outcome:** Predictable state changes, better debugging

---

### Phase 5: Polish & Testing (10-14 hours)

**Goal:** Clean up remaining issues, add tests

**Tasks:**
1. ✅ Refactor deeply nested conditionals
   - **Files:** `app.js`, others
   - **Effort:** 45-60 minutes
   - **Impact:** Improved readability

2. ✅ Add unit testing framework (Vitest)
   - **Effort:** 1-2 hours
   - **Impact:** Confidence in changes

3. ✅ Write tests for critical functions
   - **Effort:** 4-6 hours
   - **Impact:** Prevent regressions

4. ✅ Document preferred patterns
   - **Effort:** 2-3 hours
   - **Impact:** Consistent future development

5. ✅ Audit and remove unused code
   - **Files:** All files
   - **Effort:** 2-3 hours
   - **Impact:** Smaller bundle size

**Total Effort:** ~10-14 hours
**Expected Outcome:** Tested, documented, polished codebase

---

## Summary Timeline

| Phase | Duration (Claude Code) | Effort | Impact |
|-------|----------|--------|--------|
| Phase 1: Quick Wins | 2-3 hours | 2.5 hours | 5-8% reduction |
| Phase 2: Architecture | 16-20 hours | 16-23 hours | 10-15% reduction |
| Phase 3: Organization | 10-14 hours | 10-14 hours | Better structure |
| Phase 4: State Management | 9-12 hours | 9-12 hours | Controlled state |
| Phase 5: Polish & Testing | 10-14 hours | 10-14 hours | Production ready |
| **Total** | **47-63 hours** | **~48-66 hours** | **Professional codebase** |

**Note:** These estimates reflect Claude Code implementation time, not human developer time. Each phase can be completed in focused working sessions, with the entire refactoring achievable in 6-8 full working days of Claude Code effort.

---

## Recommended Approach

**Start with Phase 1** - Quick wins that provide immediate value with minimal risk.

**Key Success Factors:**
1. ✅ Make incremental changes
2. ✅ Test thoroughly after each refactoring
3. ✅ Commit frequently with clear messages
4. ✅ Don't refactor and add features simultaneously
5. ✅ Update documentation as you go

**When to Stop:**

Stop refactoring when:
- Diminishing returns (effort > benefit)
- Stability is more important than perfection
- New features are higher priority

The goal is not perfect code, but **maintainable, understandable, and reliable code**.

---

*Document generated by code audit on 2026-03-05*

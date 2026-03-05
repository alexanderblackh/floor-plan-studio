/**
 * data.js — Floor Plan Schema, Default Plan, and State Management
 *
 * The floor plan is defined as a JSON-serializable object with:
 * - rooms: polygon vertices (supports L-shapes, jogs, any axis-aligned shape)
 * - walls: line segments with optional doors/windows/heaters
 * - fixtures: built-in elements (counters, closets, sinks)
 * - dimensions: measurement labels
 * - furniture: available pieces with 2.5D height data
 *
 * Elevation model: each furniture piece has:
 * - height: physical height of the object (inches)
 * - surfaceHeight: height of its usable top surface (may differ from height)
 * - stackable: whether other items can be placed on top
 * - elevation: current height from floor (0 = on floor)
 * - stackedOn: id of furniture this piece is sitting on (null = floor)
 */

// ===== CONSTANTS =====
export const PPI = 2;
export const S = (i) => i * PPI;
export const PAD = S(30);

// ===== UUID GENERATION =====
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ===== DEFAULT FLOOR PLAN =====
export const DEFAULT_FLOOR_PLAN = {
  id: generateUUID(),
  name: "New Floor Plan",
  version: "3.0",
  planVersion: "1.0",
  units: "inches",
  scale: 2,

  rooms: [
    {
      id: "room1",
      name: "Room",
      vertices: [[0,0],[180,0],[180,150],[0,150]],
      color: "#18182288",
      placeable: true,
      labelSize: 14
    }
  ],

  walls: [],

  fixtures: [],

  dimensions: [],

  // Named walls for elevation view (which wall to look at head-on)
  elevationWalls: [],

  furniture: []
};

// ===== APPLICATION STATE =====
// Mutable state shared across modules via import
export const state = {
  floorPlan: JSON.parse(JSON.stringify(DEFAULT_FLOOR_PLAN)),
  placedFurniture: [],
  showGrid: true,
  showDims: true,
  snapToGrid: false,
  gridDensity: 12, // Grid spacing in inches (12" = 1 foot)
  renderQuality: 'auto', // 'auto' | '4k' | 'hd' | 'sd'
  zoom: 1,
  panX: 0,
  panY: 0,
  isPanning: false,
  panStart: { x: 0, y: 0 },
  dragging: null,
  dragOffset: { x: 0, y: 0 },
  measureMode: false,
  measureStart: null,
  measureEnd: null,
  measurePreview: null,
  measureShiftKey: false,
  lockedMeasurements: [],  // Persistent measurements: [{ start, end, shiftKey }]
  softDividers: [],  // Visual dividers for room zones: [{ from: {x, y}, to: {x, y} }]
  dividerMode: false,
  dividerStart: null,
  dividerPreview: null,
  dividerShiftKey: false,
  showAll: false, // Master toggle - enables all measurements, links, and dividers
  showAllMeasurements: false,
  showAllLinks: false,
  showAllDividers: false,
  alwaysShowAlignment: false,
  alwaysShowSaveControls: false,
  alwaysShowShortcuts: false,
  anchorMode: false,
  anchorSource: null,
  anchorSourcePoint: null, // Which anchor point on source: 'topLeft', 'center', etc.
  anchorTarget: null, // Selected target for anchor creation
  anchorTargetPoint: null, // Which anchor point on target
  anchorHoverTarget: null, // Currently hovered target for anchor creation
  editingAnchor: null, // { furnitureIdx, anchorIdx, editingPoint: 'source' | 'target' }
  selectedFurniture: new Set(),
  selectedMeasurement: null, // { type: 'locked', idx: number } | { type: 'anchor', furnitureIdx: number, anchorIdx: number }
  selectedDivider: null, // index of selected divider
  draggingMeasurementPoint: null, // { type: 'locked'|'divider'|'anchor', idx: number, point: 'start'|'end' }
  dragAxisLocked: null, // 'x' | 'y' | null - for shift-constrained dragging
  elevationWall: null, // currently viewed elevation wall id
  showElevation: false,
  displayUnit: 'in',  // 'in' | 'ft' | 'cm' | 'm'
  fixtureEditMode: false,
  draggingFixture: null,
  fixtureEditIdx: null,
  draggingDoor: null, // wallIdx if dragging a door hinge
  doorEditIdx: null
};

// ===== HELPERS =====
export function getFurnitureDefs() {
  return state.floorPlan.furniture;
}

export function getFurnitureDef(id) {
  return state.floorPlan.furniture.find(f => f.id === id);
}

export function getRooms() {
  return state.floorPlan.rooms;
}

export function getWalls() {
  return state.floorPlan.walls;
}

export function getFixtures() {
  return state.floorPlan.fixtures;
}

// Expose getFixtures globally for anchor mode
if (typeof window !== 'undefined') {
  window.getFixtures = getFixtures;
}

export function getDimensions() {
  return state.floorPlan.dimensions;
}

export function getElevationWalls() {
  return state.floorPlan.elevationWalls || [];
}

/**
 * Initialize furniture placements — all start in staging area
 */
export function initDefaults() {
  state.placedFurniture = [];
  let stagingX = 10;
  let stagingY = 10;
  getFurnitureDefs().forEach(d => {
    state.placedFurniture.push({
      id: d.id,
      x: -stagingX - d.w,
      y: stagingY,
      rotated: false,
      elevation: 0,
      stackedOn: null
    });
    stagingY += d.h + 8;
    if (stagingY > 700) {
      stagingY = 10;
      stagingX += 90;
    }
  });
}

/**
 * Save placement state to localStorage
 */
export function saveToCache() {
  try {
    // Save the entire floor plan (rooms, walls, furniture definitions, fixtures, etc.)
    localStorage.setItem('fps-floor-plan', JSON.stringify(state.floorPlan));
    // Save placement data
    localStorage.setItem('fps-layout', JSON.stringify(state.placedFurniture));
    // Persist locked measurements
    localStorage.setItem('fps-locked-measurements', JSON.stringify(state.lockedMeasurements));
    // Persist soft dividers
    localStorage.setItem('fps-dividers', JSON.stringify(state.softDividers));
  } catch(e) { /* quota exceeded or private browsing */ }
}

/**
 * Save user preferences to localStorage
 */
export function savePreferences() {
  try {
    const prefs = {
      showGrid: state.showGrid,
      showDims: state.showDims,
      snapToGrid: state.snapToGrid,
      gridDensity: state.gridDensity,
      renderQuality: state.renderQuality,
      showAll: state.showAll,
      showAllMeasurements: state.showAllMeasurements,
      showAllLinks: state.showAllLinks,
      showAllDividers: state.showAllDividers,
      alwaysShowAlignment: state.alwaysShowAlignment,
      alwaysShowSaveControls: state.alwaysShowSaveControls,
      alwaysShowShortcuts: state.alwaysShowShortcuts,
      displayUnit: state.displayUnit
    };
    localStorage.setItem('fps-preferences', JSON.stringify(prefs));
  } catch(e) { /* quota exceeded or private browsing */ }
}

/**
 * Load user preferences from localStorage
 */
export function loadPreferences() {
  try {
    const data = localStorage.getItem('fps-preferences');
    if (data) {
      const prefs = JSON.parse(data);
      // Apply preferences to state
      if (prefs.showGrid !== undefined) state.showGrid = prefs.showGrid;
      if (prefs.showDims !== undefined) state.showDims = prefs.showDims;
      if (prefs.snapToGrid !== undefined) state.snapToGrid = prefs.snapToGrid;
      if (prefs.gridDensity !== undefined) state.gridDensity = prefs.gridDensity;
      if (prefs.renderQuality !== undefined) state.renderQuality = prefs.renderQuality;
      if (prefs.showAll !== undefined) state.showAll = prefs.showAll;
      if (prefs.showAllMeasurements !== undefined) state.showAllMeasurements = prefs.showAllMeasurements;
      if (prefs.showAllLinks !== undefined) state.showAllLinks = prefs.showAllLinks;
      if (prefs.showAllDividers !== undefined) state.showAllDividers = prefs.showAllDividers;
      if (prefs.alwaysShowAlignment !== undefined) state.alwaysShowAlignment = prefs.alwaysShowAlignment;
      if (prefs.alwaysShowSaveControls !== undefined) state.alwaysShowSaveControls = prefs.alwaysShowSaveControls;
      if (prefs.alwaysShowShortcuts !== undefined) state.alwaysShowShortcuts = prefs.alwaysShowShortcuts;
      if (prefs.displayUnit !== undefined) {
        state.displayUnit = prefs.displayUnit;
      } else {
        // If no saved unit, detect from locale
        state.displayUnit = detectDefaultUnit();
      }
      return true;
    } else {
      // No saved preferences, use locale for unit
      state.displayUnit = detectDefaultUnit();
    }
  } catch(e) { /* corrupted data */ }
  return false;
}

/**
 * Detect default unit based on user's locale
 * Returns 'in' for US/UK, 'cm' for rest of world
 */
function detectDefaultUnit() {
  try {
    const locale = navigator.language || 'en-US';
    // US, UK, and a few others use imperial
    const imperialLocales = ['en-US', 'en-GB', 'en-CA', 'my-MM']; // US, UK, Canada, Myanmar
    if (imperialLocales.some(l => locale.startsWith(l.split('-')[0]))) {
      // For US use inches, for others use feet
      return locale.startsWith('en-US') ? 'in' : 'in';
    }
    return 'cm'; // Default to metric for rest of world
  } catch(e) {
    return 'in'; // Fallback to inches
  }
}

/**
 * Load placement state from localStorage
 * Returns true if cache existed
 */
export function loadFromCache() {
  try {
    let hasData = false;

    // Load the entire floor plan first (rooms, walls, furniture definitions, fixtures)
    const floorPlanData = localStorage.getItem('fps-floor-plan');
    if (floorPlanData) {
      state.floorPlan = JSON.parse(floorPlanData);
      hasData = true;
    }

    // Load placement data
    const layoutData = localStorage.getItem('fps-layout');
    if (layoutData) {
      const parsed = JSON.parse(layoutData);
      // Migrate old format: add elevation/stackedOn if missing
      state.placedFurniture = parsed.map(p => ({
        ...p,
        elevation: p.elevation ?? 0,
        stackedOn: p.stackedOn ?? null
      }));
      hasData = true;
    }

    // Load locked measurements
    const measureData = localStorage.getItem('fps-locked-measurements');
    if (measureData) {
      state.lockedMeasurements = JSON.parse(measureData);
    }

    // Load soft dividers
    const dividerData = localStorage.getItem('fps-dividers');
    if (dividerData) {
      state.softDividers = JSON.parse(dividerData);
    }

    // If we loaded a floor plan but no placement data, initialize furniture in staging
    if (floorPlanData && !layoutData) {
      initDefaults();
    }

    // BACKWARD COMPATIBILITY: Load old fixture/wall data if floor plan wasn't saved
    if (!floorPlanData && layoutData) {
      // Restore fixture positions and door modifications if saved
      const fixtureData = localStorage.getItem('fps-fixtures');
      if (fixtureData) {
        const savedFixtures = JSON.parse(fixtureData);
        // Update fixture positions and doors from cache (match by id)
        for (const saved of savedFixtures) {
          const fix = state.floorPlan.fixtures.find(f => f.id === saved.id);
          if (fix) {
            fix.x = saved.x;
            fix.y = saved.y;
            // Restore door modifications (hinge positions, arc angles)
            if (saved.doors) {
              fix.doors = saved.doors;
            }
          }
        }
      }
      // Restore walls (door positions) if saved
      const wallData = localStorage.getItem('fps-walls');
      if (wallData) {
        const savedWalls = JSON.parse(wallData);
        // Replace entire walls array to preserve door arc modifications
        state.floorPlan.walls = savedWalls;
      }
    }

    return hasData;
  } catch(e) { /* corrupted data */ }
  return false;
}

/**
 * Validate a floor plan object has required fields
 */
export function validateFloorPlan(plan) {
  const errors = [];
  if (!plan.rooms || !Array.isArray(plan.rooms)) errors.push("Missing rooms array");
  if (!plan.walls || !Array.isArray(plan.walls)) errors.push("Missing walls array");
  if (!plan.furniture || !Array.isArray(plan.furniture)) errors.push("Missing furniture array");
  plan.rooms?.forEach((r, i) => {
    if (!r.id) errors.push(`Room ${i} missing id`);
    if (!r.vertices || r.vertices.length < 3) errors.push(`Room ${r.id || i} needs >= 3 vertices`);
  });
  plan.furniture?.forEach((f, i) => {
    if (!f.id) errors.push(`Furniture ${i} missing id`);
    if (!f.w || !f.h) errors.push(`Furniture ${f.id || i} missing dimensions`);
  });
  return errors;
}

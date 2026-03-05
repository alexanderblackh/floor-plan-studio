/**
 * history.js — Undo/redo functionality
 *
 * Tracks changes to placedFurniture, fixtures, and walls (doors)
 * Allows undo/redo with Cmd+Z / Cmd+Shift+Z or dedicated buttons
 */

import { state } from './data.js';
import { renderFurniture, renderStagingFurniture } from './furniture.js';
import { buildSVG } from './render.js';
import { renderFixtureHandles } from './fixtures.js';

const MAX_HISTORY = 50;
const history = {
  stack: [],
  index: -1
};

/**
 * Create a snapshot of current state (furniture, fixtures, and walls)
 */
function createSnapshot() {
  return {
    placedFurniture: JSON.parse(JSON.stringify(state.placedFurniture)),
    fixtures: JSON.parse(JSON.stringify(state.floorPlan.fixtures)),
    walls: JSON.parse(JSON.stringify(state.floorPlan.walls))
  };
}

/**
 * Push a new state to history (called before making changes)
 */
export function pushHistory() {
  // Remove any states after current index (if we undid and then made a new change)
  history.stack = history.stack.slice(0, history.index + 1);

  // Add current state
  history.stack.push(createSnapshot());

  // Limit history size
  if (history.stack.length > MAX_HISTORY) {
    history.stack.shift();
  } else {
    history.index++;
  }
}

/**
 * Undo the last change
 */
export function undo() {
  if (history.index <= 0) {
    console.log('Nothing to undo');
    return false;
  }

  // Move back in history
  history.index--;

  // Restore state
  const snapshot = history.stack[history.index];
  state.placedFurniture = JSON.parse(JSON.stringify(snapshot.placedFurniture));
  state.floorPlan.fixtures = JSON.parse(JSON.stringify(snapshot.fixtures));
  state.floorPlan.walls = JSON.parse(JSON.stringify(snapshot.walls));

  // Re-render everything
  buildSVG();
  renderFurniture();
  renderStagingFurniture();
  if (state.fixtureEditMode) renderFixtureHandles();
  if (window._renderAnchors) window._renderAnchors();
  if (window._renderMeasurement) window._renderMeasurement();

  console.log(`Undo: now at history ${history.index}/${history.stack.length - 1}`);
  return true;
}

/**
 * Redo the last undone change
 */
export function redo() {
  if (history.index >= history.stack.length - 1) {
    console.log('Nothing to redo');
    return false;
  }

  // Move forward in history
  history.index++;

  // Restore state
  const snapshot = history.stack[history.index];
  state.placedFurniture = JSON.parse(JSON.stringify(snapshot.placedFurniture));
  state.floorPlan.fixtures = JSON.parse(JSON.stringify(snapshot.fixtures));
  state.floorPlan.walls = JSON.parse(JSON.stringify(snapshot.walls));

  // Re-render everything
  buildSVG();
  renderFurniture();
  renderStagingFurniture();
  if (state.fixtureEditMode) renderFixtureHandles();
  if (window._renderAnchors) window._renderAnchors();
  if (window._renderMeasurement) window._renderMeasurement();

  console.log(`Redo: now at history ${history.index}/${history.stack.length - 1}`);
  return true;
}

/**
 * Initialize history with current state
 */
export function initHistory() {
  history.stack = [createSnapshot()];
  history.index = 0;
  console.log('History initialized');
}

/**
 * Clear history
 */
export function clearHistory() {
  history.stack = [createSnapshot()];
  history.index = 0;
  console.log('History cleared');
}

// Expose for debugging
window._history = history;

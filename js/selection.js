/**
 * selection.js — Multi-select and alignment tools
 *
 * Multi-select: Shift+click to add/remove from selection
 * Alignment: align selected items to each other or to walls
 */

import { state, getFurnitureDef, saveToCache } from './data.js';
import { getRoomBounds, findRoomAt } from './collision.js';
import { renderFurniture, renderStagingFurniture } from './furniture.js';
import { pushHistory } from './history.js';

/**
 * Update the alignment toolbar visibility
 */
export function updateAlignToolbar() {
  // Use the new alignment bar visibility function
  if (window._updateAlignmentBarVisibility) window._updateAlignmentBarVisibility();

  // Update color picker visibility
  if (window._updateColorPicker) window._updateColorPicker();
}

// Expose globally for furniture.js callback
window._updateAlignToolbar = updateAlignToolbar;

/**
 * Clear selection
 */
export function clearSelection() {
  state.selectedFurniture.clear();
  updateAlignToolbar();
  renderFurniture();

  // Hide color picker
  if (window._updateColorPicker) window._updateColorPicker();
}

/**
 * Get bounds of all selected furniture
 */
function getSelectionBounds() {
  const items = [];
  for (const idx of state.selectedFurniture) {
    const p = state.placedFurniture[idx];
    if (!p || p.x < 0 || p.y < 0) continue;
    const d = getFurnitureDef(p.id);
    if (!d) continue;
    const w = p.rotated ? d.h : d.w;
    const h = p.rotated ? d.w : d.h;
    items.push({ idx, p, d, w, h, x: p.x, y: p.y });
  }
  return items;
}

/**
 * Align selected items relative to each other
 * mode: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV'
 */
export function alignSelection(mode) {
  const items = getSelectionBounds();
  if (items.length < 2) return;

  pushHistory();

  switch (mode) {
    case 'left': {
      const minX = Math.min(...items.map(i => i.x));
      items.forEach(i => { i.p.x = minX; });
      break;
    }
    case 'right': {
      const maxR = Math.max(...items.map(i => i.x + i.w));
      items.forEach(i => { i.p.x = maxR - i.w; });
      break;
    }
    case 'top': {
      const minY = Math.min(...items.map(i => i.y));
      items.forEach(i => { i.p.y = minY; });
      break;
    }
    case 'bottom': {
      const maxB = Math.max(...items.map(i => i.y + i.h));
      items.forEach(i => { i.p.y = maxB - i.h; });
      break;
    }
    case 'centerH': {
      const minX = Math.min(...items.map(i => i.x));
      const maxR = Math.max(...items.map(i => i.x + i.w));
      const centerX = (minX + maxR) / 2;
      items.forEach(i => { i.p.x = Math.round(centerX - i.w / 2); });
      break;
    }
    case 'centerV': {
      const minY = Math.min(...items.map(i => i.y));
      const maxB = Math.max(...items.map(i => i.y + i.h));
      const centerY = (minY + maxB) / 2;
      items.forEach(i => { i.p.y = Math.round(centerY - i.h / 2); });
      break;
    }
  }

  renderFurniture();
  renderStagingFurniture();
  saveToCache();
}

/**
 * Align selected items to a wall of their room
 * mode: 'left' | 'right' | 'top' | 'bottom' | 'center'
 */
export function alignToWall(mode) {
  const items = getSelectionBounds();
  if (items.length === 0) return;

  pushHistory();

  // Find room for the first selected item (assume all in same room for simplicity)
  const firstItem = items[0];
  const room = findRoomAt(firstItem.x + firstItem.w / 2, firstItem.y + firstItem.h / 2);
  if (!room) return;

  const bounds = getRoomBounds(room.id);
  if (!bounds) return;

  switch (mode) {
    case 'left':
      items.forEach(i => { i.p.x = bounds.minX; });
      break;
    case 'right':
      items.forEach(i => { i.p.x = bounds.maxX - i.w; });
      break;
    case 'top':
      items.forEach(i => { i.p.y = bounds.minY; });
      break;
    case 'bottom':
      items.forEach(i => { i.p.y = bounds.maxY - i.h; });
      break;
    case 'center':
      items.forEach(i => {
        i.p.x = Math.round(bounds.minX + (bounds.w - i.w) / 2);
        i.p.y = Math.round(bounds.minY + (bounds.h - i.h) / 2);
      });
      break;
  }

  renderFurniture();
  renderStagingFurniture();
  saveToCache();
}

// Expose for inline onclick handlers
window.alignSelection = alignSelection;
window.alignToWall = alignToWall;

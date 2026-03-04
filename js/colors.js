/**
 * colors.js — Color customization for furniture, fixtures, and rooms
 *
 * Allows users to change colors of items in the floor plan
 */

import { state, getFurnitureDef, saveToCache } from './data.js';
import { renderFurniture, renderStagingFurniture } from './furniture.js';
import { buildSVG } from './render.js';
import { pushHistory } from './history.js';

/**
 * Update UI to show/hide color picker based on selection
 */
export function updateColorPicker() {
  const colorPickerDiv = document.getElementById('colorPicker');
  const colorInput = document.getElementById('colorInput');

  if (!colorPickerDiv || !colorInput) return;

  if (state.selectedFurniture.size === 1) {
    // Show color picker for single selection
    const idx = Array.from(state.selectedFurniture)[0];
    const piece = state.placedFurniture[idx];
    const def = getFurnitureDef(piece.id);

    if (def) {
      colorPickerDiv.style.display = 'flex';
      // Use custom color if set, otherwise use default
      const currentColor = piece.customColor || def.color;
      colorInput.value = currentColor;
    }
  } else {
    // Hide color picker
    colorPickerDiv.style.display = 'none';
  }
}

/**
 * Update the color of the selected furniture
 */
export function updateSelectedColor(color) {
  if (state.selectedFurniture.size !== 1) return;

  pushHistory();

  const idx = Array.from(state.selectedFurniture)[0];
  const piece = state.placedFurniture[idx];

  // Store custom color
  piece.customColor = color;

  saveToCache();
  renderFurniture();
  renderStagingFurniture();
}

// Expose globally
window.updateSelectedColor = updateSelectedColor;

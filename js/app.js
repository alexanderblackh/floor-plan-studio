/**
 * app.js — Application initialization, events, zoom/pan
 *
 * This is the entry point that wires everything together.
 */

import { state, PPI, PAD, loadFromCache, initDefaults, saveToCache, getFurnitureDef } from './data.js';
import { buildSVG, buildStagingSVG } from './render.js';
import { renderFurniture, renderStagingFurniture, handleDragMove, handleDragEnd } from './furniture.js';
import { clearSelection, updateAlignToolbar } from './selection.js';
import { renderMeasurement, renderAnchors, toggleMeasure, toggleShowAll, toggleAnchorMode, lockCurrentMeasurement } from './measurement.js';
import { renderElevation, toggleElevation, buildElevationSelector } from './elevation.js';
import { cycleUnit, getUnit, formatDist, setUnit } from './units.js';
import { toggleFixtureEditMode, handleFixtureClick, handleFixtureDragMove, handleFixtureDragEnd, renderFixtureHandles } from './fixtures.js';
import { undo, redo, initHistory, pushHistory } from './history.js';
import { renderDividers, toggleDividerMode, handleDividerClick } from './dividers.js';
import { updateColorPicker } from './colors.js';
import './io.js'; // registers global export/import functions

// ===== ZOOM / PAN =====
function applyTransform() {
  const svg = document.getElementById('svgPlan');
  if (svg) svg.style.transform = `translate(${state.panX}px,${state.panY}px) scale(${state.zoom})`;
  const zl = document.getElementById('zoomLevel');
  if (zl) zl.textContent = `${Math.round(state.zoom * 100)}%`;
}

// Expose for io.js callback
window._applyTransform = applyTransform;

function zoomIn() {
  const r = document.getElementById('canvasContainer').getBoundingClientRect();
  const cx = r.width / 2, cy = r.height / 2, oz = state.zoom;
  state.zoom = Math.min(15, state.zoom * 1.3);
  state.panX = cx - (cx - state.panX) * (state.zoom / oz);
  state.panY = cy - (cy - state.panY) * (state.zoom / oz);
  applyTransform();
}

function zoomOut() {
  const r = document.getElementById('canvasContainer').getBoundingClientRect();
  const cx = r.width / 2, cy = r.height / 2, oz = state.zoom;
  state.zoom = Math.max(0.15, state.zoom * 0.77);
  state.panX = cx - (cx - state.panX) * (state.zoom / oz);
  state.panY = cy - (cy - state.panY) * (state.zoom / oz);
  applyTransform();
}

function fitToView() {
  const ctr = document.getElementById('canvasContainer');
  const svg = document.getElementById('svgPlan');
  if (!ctr || !svg) return;
  const cw = ctr.clientWidth, ch = ctr.clientHeight;
  const sw = parseFloat(svg.getAttribute('width')), sh = parseFloat(svg.getAttribute('height'));
  state.zoom = Math.min(cw / sw, ch / sh) * 0.92;
  state.panX = (cw - sw * state.zoom) / 2;
  state.panY = (ch - sh * state.zoom) / 2;
  applyTransform();
}

// ===== CONTROLS =====
function toggleGrid() {
  state.showGrid = !state.showGrid;
  document.getElementById('btnGrid')?.classList.toggle('active', state.showGrid);
  const g = document.getElementById('svgPlan')?.querySelector('#gridGroup');
  if (g) g.style.display = state.showGrid ? '' : 'none';
}

function toggleDims() {
  state.showDims = !state.showDims;
  document.getElementById('btnDims')?.classList.toggle('active', state.showDims);
  const g = document.getElementById('svgPlan')?.querySelector('#dimGroup');
  if (g) g.style.display = state.showDims ? '' : 'none';
}

function clearAllFurniture() {
  if (!confirm('Remove all furniture from the floor plan? This will move everything back to staging.')) return;
  pushHistory();
  initDefaults();
  renderFurniture();
  renderStagingFurniture();
  saveToCache();
}

function resetFurniture() {
  pushHistory();
  initDefaults();
  renderFurniture();
  renderStagingFurniture();
  saveToCache();
}

// ===== UNIT MANAGEMENT =====
function toggleUnitMenu() {
  const menu = document.getElementById('unitMenu');
  if (menu) {
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';

    // Close on click outside
    if (!isVisible) {
      setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
          if (!e.target.closest('.export-dropdown')) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
          }
        });
      }, 0);
    }
  }
}

function selectUnit(unit) {
  setUnit(unit);
  updateUnitDisplay();
  // Re-render everything that shows distances
  renderMeasurement();
  renderAnchors();
  renderElevation();
  // Rebuild SVG to update dimension labels
  buildSVG();
  renderFurniture();
  // Close menu
  document.getElementById('unitMenu').style.display = 'none';
}

// Cycle units (for keyboard shortcut)
function cycleUnits() {
  cycleUnit();
  updateUnitDisplay();
  // Re-render everything that shows distances
  renderMeasurement();
  renderAnchors();
  renderElevation();
  // Rebuild SVG to update dimension labels
  buildSVG();
  renderFurniture();
}

function updateUnitDisplay() {
  const btn = document.getElementById('btnUnit');
  if (btn) btn.textContent = getUnit().toUpperCase() + ' ▾';
  const scaleSpan = document.getElementById('scaleDisplay');
  // PPI is always pixels-per-inch regardless of display unit
  if (scaleSpan) scaleSpan.textContent = `1" = ${PPI}px`;
}

// ===== WALL ANCHOR HELPER =====
// Determine which wall side the click is closest to, relative to the source furniture
function determineWallSide(sourceIdx, clickX, clickY) {
  const p = state.placedFurniture[sourceIdx];
  if (!p || p.x < 0 || p.y < 0) return null;
  const d = getFurnitureDef(p.id);
  if (!d) return null;
  const pw = p.rotated ? d.h : d.w;
  const ph = p.rotated ? d.w : d.h;
  const cx = p.x + pw/2, cy = p.y + ph/2;
  const dx = clickX - cx, dy = clickY - cy;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 'left' : 'right';
  }
  return dy < 0 ? 'top' : 'bottom';
}

// ===== CANVAS EVENTS =====
function attachCanvasEvents() {
  const ctr = document.getElementById('canvasContainer');

  // Wheel zoom
  ctr.addEventListener('wheel', e => {
    e.preventDefault();
    const r = ctr.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const oz = state.zoom;
    state.zoom = Math.max(0.15, Math.min(15, state.zoom * (e.deltaY > 0 ? 0.88 : 1.12)));
    state.panX = mx - (mx - state.panX) * (state.zoom / oz);
    state.panY = my - (my - state.panY) * (state.zoom / oz);
    applyTransform();
  }, { passive: false });

  // Mousedown: pan, measure, anchor, or fixture edit
  ctr.addEventListener('mousedown', e => {
    if (e.target.closest('.furniture-piece')) return;

    const r = ctr.getBoundingClientRect();
    const clickX = Math.round(((e.clientX - r.left - state.panX) / state.zoom - PAD) / PPI);
    const clickY = Math.round(((e.clientY - r.top - state.panY) / state.zoom - PAD) / PPI);

    // Fixture edit mode: check if clicking a fixture
    if (state.fixtureEditMode && e.button === 0) {
      if (handleFixtureClick(clickX, clickY, e)) return;
    }

    // Divider mode: place divider points
    if (state.dividerMode && e.button === 0) {
      if (handleDividerClick(clickX, clickY)) return;
    }

    // Anchor mode: clicking empty space creates a wall anchor
    if (state.anchorMode && state.anchorSource !== null && e.button === 0) {
      e.stopPropagation();
      const src = state.placedFurniture[state.anchorSource];
      if (src) {
        if (!src.anchors) src.anchors = [];
        const wallSide = determineWallSide(state.anchorSource, clickX, clickY);
        if (wallSide && !src.anchors.find(a => a.type === 'wall' && a.wallSide === wallSide)) {
          src.anchors.push({ type: 'wall', wallSide });
          saveToCache();
        }
        state.anchorSource = null;
        renderAnchors();
      }
      return;
    }

    // Measure mode click
    if (state.measureMode && e.button === 0) {
      e.stopPropagation();
      if (!state.measureStart) {
        state.measureStart = { x: clickX, y: clickY, edge: 'floor' };
        state.measureEnd = null;
        state.measurePreview = null;
        state.measureShiftKey = e.shiftKey;
      } else if (!state.measureEnd) {
        state.measureEnd = { x: clickX, y: clickY, edge: 'floor' };
        state.measurePreview = null;
        // Capture shift key state for 45-degree snap
        state.measureShiftKey = e.shiftKey;
      } else {
        state.measureStart = { x: clickX, y: clickY, edge: 'floor' };
        state.measureEnd = null;
        state.measurePreview = null;
        state.measureShiftKey = e.shiftKey;
      }
      renderMeasurement();
      return;
    }

    // Clear selection on empty space click (unless shift)
    if (!e.shiftKey && state.selectedFurniture.size > 0) {
      clearSelection();
    }

    // Start panning
    if (e.button === 0) {
      state.isPanning = true;
      state.panStart = { x: e.clientX - state.panX, y: e.clientY - state.panY };
      ctr.classList.add('panning');
    }
  });

  // Mousemove: drag furniture, fixture, or pan
  document.addEventListener('mousemove', e => {
    // Fixture dragging
    if (state.fixtureEditMode && handleFixtureDragMove(e)) return;
    // Furniture dragging takes priority
    if (handleDragMove(e)) return;

    // Cursor position calculation
    const r2 = ctr.getBoundingClientRect();
    const cx = Math.round(((e.clientX - r2.left - state.panX) / state.zoom - PAD) / PPI);
    const cy = Math.round(((e.clientY - r2.top - state.panY) / state.zoom - PAD) / PPI);

    // Measurement preview: if first point is set, show line following cursor
    if (state.measureMode && state.measureStart && !state.measureEnd) {
      state.measurePreview = { x: cx, y: cy, edge: 'floor' };
      state.measureShiftKey = e.shiftKey; // Update shift state for live preview
      renderMeasurement();
    }

    // Panning
    if (state.isPanning && !state.measureMode) {
      state.panX = e.clientX - state.panStart.x;
      state.panY = e.clientY - state.panStart.y;
      applyTransform();
    }

    // Cursor position display
    const pos = document.getElementById('cursorPos');
    if (pos) pos.textContent = formatDist(cx) + ', ' + formatDist(cy);
  });

  // Mouseup: end drag or pan
  document.addEventListener('mouseup', () => {
    state.isPanning = false;
    ctr.classList.remove('panning');
    if (state.fixtureEditMode) handleFixtureDragEnd();
    handleDragEnd();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    // Undo/Redo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      undo();
      e.preventDefault();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
      redo();
      e.preventDefault();
      return;
    }

    if (e.key === '=' || e.key === '+') { zoomIn(); e.preventDefault(); }
    if (e.key === '-') { zoomOut(); e.preventDefault(); }
    if (e.key === '0') { fitToView(); e.preventDefault(); }
    if (e.key === 'm' && !e.shiftKey) { toggleMeasure(); e.preventDefault(); }
    if (e.key === 'M' && e.shiftKey) { toggleShowAll(); e.preventDefault(); }
    if (e.key === 'l' || e.key === 'L') {
      // Lock current measurement
      if (state.measureMode && state.measureStart && state.measureEnd) {
        lockCurrentMeasurement();
        e.preventDefault();
      }
    }
    if (e.key === 'e' || e.key === 'E') { toggleElevation(); e.preventDefault(); }
    if (e.key === 'u' || e.key === 'U') { cycleUnits(); e.preventDefault(); }
    if (e.key === 'f' && !e.ctrlKey && !e.metaKey) { toggleFixtureEditMode(); e.preventDefault(); }
    if (e.key === 'd' || e.key === 'D') { toggleDividerMode(); e.preventDefault(); }
    if (e.key === 'Escape') {
      if (state.measureMode) {
        state.measureStart = null;
        state.measureEnd = null;
        renderMeasurement();
      }
      if (state.selectedFurniture.size > 0) {
        clearSelection();
      }
      if (state.selectedMeasurement) {
        state.selectedMeasurement = null;
        if (window._renderMeasurement) window._renderMeasurement();
      }
      if (state.selectedDivider !== null) {
        state.selectedDivider = null;
        if (window._renderDividers) window._renderDividers();
      }
      if (state.anchorMode) {
        state.anchorMode = false;
        state.anchorSource = null;
        document.getElementById('btnAnchor')?.classList.remove('active');
      }
      if (state.fixtureEditMode) {
        toggleFixtureEditMode();
      }
      if (state.dividerMode) {
        state.dividerMode = false;
        state.dividerStart = null;
        document.getElementById('btnDivider')?.classList.remove('active');
        renderDividers();
      }
      e.preventDefault();
    }

    // Delete key - delete selected measurement or divider
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.selectedMeasurement?.type === 'locked') {
        if (confirm('Delete this locked measurement?')) {
          pushHistory();
          state.lockedMeasurements.splice(state.selectedMeasurement.idx, 1);
          state.selectedMeasurement = null;
          saveToCache();
          if (window._renderMeasurement) window._renderMeasurement();
        }
        e.preventDefault();
      } else if (state.selectedDivider !== null) {
        if (confirm('Delete this divider?')) {
          pushHistory();
          state.softDividers.splice(state.selectedDivider, 1);
          state.selectedDivider = null;
          saveToCache();
          if (window._renderDividers) window._renderDividers();
        }
        e.preventDefault();
      }
    }

    // Arrow key movement for selected furniture
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      if (state.selectedFurniture.size > 0 && !state.measureMode && !state.anchorMode) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1; // 10 inches with Shift, 1 inch otherwise

        pushHistory();

        for (const idx of state.selectedFurniture) {
          const piece = state.placedFurniture[idx];
          if (piece && piece.x >= 0 && piece.y >= 0) {
            switch (e.key) {
              case 'ArrowLeft': piece.x -= step; break;
              case 'ArrowRight': piece.x += step; break;
              case 'ArrowUp': piece.y -= step; break;
              case 'ArrowDown': piece.y += step; break;
            }
          }
        }

        renderFurniture();
        renderStagingFurniture();
        if (window._renderAnchors) window._renderAnchors();
        if (window._renderMeasurement) window._renderMeasurement();
        saveToCache();
      }
    }
  });
}

// ===== THEME MANAGEMENT =====
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  const btn = document.getElementById('btnTheme');
  if (btn) btn.textContent = isLight ? '☾' : '☀';
  try {
    localStorage.setItem('floor-plan-theme', isLight ? 'light' : 'dark');
  } catch(e) {}
  // Rebuild SVGs with new theme colors
  buildSVG();
  buildStagingSVG();
  renderFurniture();
  renderStagingFurniture();
  renderMeasurement();
  renderAnchors();
  if (state.showElevation) renderElevation();
  if (state.fixtureEditMode) renderFixtureHandles();
  // Re-initialize Lucide icons
  if (window.lucide) {
    setTimeout(() => lucide.createIcons(), 0);
  }
}

function loadTheme() {
  try {
    const theme = localStorage.getItem('floor-plan-theme');
    if (theme === 'light') {
      document.body.classList.add('light-mode');
      const btn = document.getElementById('btnTheme');
      if (btn) btn.textContent = '☾';
    }
  } catch(e) {}
}

// ===== EXPOSE GLOBAL FUNCTIONS FOR ONCLICK HANDLERS =====
window.toggleGrid = toggleGrid;
window.toggleDims = toggleDims;
window.toggleMeasure = toggleMeasure;
window.toggleShowAll = toggleShowAll;
window.toggleAnchorMode = toggleAnchorMode;
window.toggleFixtureEditMode = toggleFixtureEditMode;
window.toggleDividerMode = toggleDividerMode;
window.toggleUnitMenu = toggleUnitMenu;
window.selectUnit = selectUnit;
window.clearAllFurniture = clearAllFurniture;
window.resetFurniture = resetFurniture;
window.toggleElevation = toggleElevation;
window.fitToView = fitToView;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.toggleTheme = toggleTheme;

// ===== INITIALIZATION =====
function init() {
  // Load theme first
  loadTheme();

  // Load state
  if (!loadFromCache()) {
    initDefaults();
  }

  // Initialize undo/redo history
  initHistory();

  // Build SVGs
  buildSVG();
  buildStagingSVG();

  // Render furniture
  renderFurniture();
  renderStagingFurniture();

  // Render dividers
  renderDividers();

  // Build elevation selector
  buildElevationSelector();

  // Attach events
  attachCanvasEvents();

  // Update plan name
  const nameEl = document.getElementById('planName');
  if (nameEl) nameEl.textContent = state.floorPlan.name || 'Untitled';

  // Update unit display
  updateUnitDisplay();

  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Expose color picker update function
  window._updateColorPicker = updateColorPicker;

  // Initial view
  requestAnimationFrame(fitToView);
}

// Start
init();

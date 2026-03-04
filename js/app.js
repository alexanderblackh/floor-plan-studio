/**
 * app.js — Application initialization, events, zoom/pan
 *
 * This is the entry point that wires everything together.
 */

import { state, PPI, PAD, loadFromCache, initDefaults, saveToCache } from './data.js';
import { buildSVG, buildStagingSVG } from './render.js';
import { renderFurniture, renderStagingFurniture, handleDragMove, handleDragEnd } from './furniture.js';
import { clearSelection, updateAlignToolbar } from './selection.js';
import { renderMeasurement, renderAnchors, toggleMeasure, toggleShowAll, toggleAnchorMode } from './measurement.js';
import { renderElevation, toggleElevation, buildElevationSelector } from './elevation.js';
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
  initDefaults();
  renderFurniture();
  renderStagingFurniture();
  saveToCache();
}

function resetFurniture() {
  initDefaults();
  renderFurniture();
  renderStagingFurniture();
  saveToCache();
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

  // Mousedown: pan or measure
  ctr.addEventListener('mousedown', e => {
    if (e.target.closest('.furniture-piece')) return;

    // Measure mode click
    if (state.measureMode && e.button === 0) {
      e.stopPropagation();
      const r = ctr.getBoundingClientRect();
      const x = Math.round(((e.clientX - r.left - state.panX) / state.zoom - PAD) / PPI);
      const y = Math.round(((e.clientY - r.top - state.panY) / state.zoom - PAD) / PPI);

      if (!state.measureStart) {
        state.measureStart = { x, y, edge: 'floor' };
        state.measureEnd = null;
      } else if (!state.measureEnd) {
        state.measureEnd = { x, y, edge: 'floor' };
      } else {
        state.measureStart = { x, y, edge: 'floor' };
        state.measureEnd = null;
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

  // Mousemove: drag furniture or pan
  document.addEventListener('mousemove', e => {
    // Furniture dragging takes priority
    if (handleDragMove(e)) return;

    // Panning
    if (state.isPanning && !state.measureMode) {
      state.panX = e.clientX - state.panStart.x;
      state.panY = e.clientY - state.panStart.y;
      applyTransform();
    }

    // Cursor position display
    const r = ctr.getBoundingClientRect();
    const cx = Math.round(((e.clientX - r.left - state.panX) / state.zoom - PAD) / PPI);
    const cy = Math.round(((e.clientY - r.top - state.panY) / state.zoom - PAD) / PPI);
    const pos = document.getElementById('cursorPos');
    if (pos) pos.textContent = `${cx}", ${cy}"`;
  });

  // Mouseup: end drag or pan
  document.addEventListener('mouseup', () => {
    state.isPanning = false;
    ctr.classList.remove('panning');
    handleDragEnd();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === '=' || e.key === '+') { zoomIn(); e.preventDefault(); }
    if (e.key === '-') { zoomOut(); e.preventDefault(); }
    if (e.key === '0') { fitToView(); e.preventDefault(); }
    if (e.key === 'm' && !e.shiftKey) { toggleMeasure(); e.preventDefault(); }
    if (e.key === 'M' && e.shiftKey) { toggleShowAll(); e.preventDefault(); }
    if (e.key === 'e' || e.key === 'E') { toggleElevation(); e.preventDefault(); }
    if (e.key === 'Escape') {
      if (state.measureMode) {
        state.measureStart = null;
        state.measureEnd = null;
        renderMeasurement();
      }
      if (state.selectedFurniture.size > 0) {
        clearSelection();
      }
      if (state.anchorMode) {
        state.anchorMode = false;
        state.anchorSource = null;
        document.getElementById('btnAnchor')?.classList.remove('active');
      }
      e.preventDefault();
    }
  });
}

// ===== EXPOSE GLOBAL FUNCTIONS FOR ONCLICK HANDLERS =====
window.toggleGrid = toggleGrid;
window.toggleDims = toggleDims;
window.toggleMeasure = toggleMeasure;
window.toggleShowAll = toggleShowAll;
window.toggleAnchorMode = toggleAnchorMode;
window.clearAllFurniture = clearAllFurniture;
window.resetFurniture = resetFurniture;
window.fitToView = fitToView;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;

// ===== INITIALIZATION =====
function init() {
  // Load state
  if (!loadFromCache()) {
    initDefaults();
  }

  // Build SVGs
  buildSVG();
  buildStagingSVG();

  // Render furniture
  renderFurniture();
  renderStagingFurniture();

  // Build elevation selector
  buildElevationSelector();

  // Attach events
  attachCanvasEvents();

  // Update plan name
  const nameEl = document.getElementById('planName');
  if (nameEl) nameEl.textContent = state.floorPlan.name || 'Untitled';

  // Initial view
  requestAnimationFrame(fitToView);
}

// Start
init();

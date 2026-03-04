/**
 * furniture.js — Furniture rendering, staging panel, drag-and-drop
 *
 * Handles:
 * - Rendering placed furniture on the floor plan SVG
 * - Rendering unplaced furniture in the staging sidebar
 * - Drag-and-drop from staging to plan and within plan
 * - Rotation (double-click)
 * - Return to staging (right-click)
 * - Elevation badges for stacked items
 */

import { S, PPI, PAD, state, getFurnitureDef, getFurnitureDefs, saveToCache } from './data.js';
import { checkCollision, autoStack } from './collision.js';
import { formatDist } from './units.js';
import { escapeXml } from './render.js';
import { pushHistory } from './history.js';

// ===== RENDER PLACED FURNITURE =====
export function renderFurniture() {
  const svg = document.getElementById('svgPlan');
  if (!svg) return;
  const g = svg.querySelector('#furnitureGroup');
  if (!g) return;

  let html = '';
  for (let idx = 0; idx < state.placedFurniture.length; idx++) {
    const p = state.placedFurniture[idx];
    if (p.x < 0 || p.y < 0) continue; // skip staging items
    const d = getFurnitureDef(p.id);
    if (!d) continue;
    const w = p.rotated ? S(d.h) : S(d.w);
    const h = p.rotated ? S(d.w) : S(d.h);
    const hasCollision = checkCollision(p, idx);
    const strokeColor = hasCollision ? '#ff4444' : d.stroke;
    const extra = hasCollision ? 'stroke-dasharray="4 2"' : '';
    const isSelected = state.selectedFurniture.has(idx);
    const selStroke = isSelected ? `<rect x="${PAD+S(p.x)-2}" y="${PAD+S(p.y)-2}" width="${w+4}" height="${h+4}" fill="none" stroke="#c5975b" stroke-width="2" stroke-dasharray="4 2" rx="3"/>` : '';

    // Use custom color if set, otherwise use default
    const fillColor = p.customColor || d.color;

    const displayW = p.rotated ? d.h : d.w;
    const displayH = p.rotated ? d.w : d.h;
    const dimText = `${formatDist(displayW)} × ${formatDist(displayH)}`;

    // Elevation badge
    const elev = p.elevation || 0;
    const elevBadge = elev > 0
      ? `<text x="${PAD+S(p.x)+w-4}" y="${PAD+S(p.y)+12}" font-family="JetBrains Mono" font-size="7" fill="#c5975b" text-anchor="end">↑${formatDist(elev)}</text>`
      : '';

    // Drop shadow for elevated items
    const shadow = elev > 0
      ? `<rect x="${PAD+S(p.x)+3}" y="${PAD+S(p.y)+3}" width="${w}" height="${h}" fill="#00000044" rx="2"/>`
      : '';

    html += `${shadow}<g class="furniture-piece" data-idx="${idx}" style="cursor:grab">
      ${selStroke}
      <rect x="${PAD+S(p.x)}" y="${PAD+S(p.y)}" width="${w}" height="${h}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${hasCollision?2:1}" ${extra} rx="2" opacity="0.85"/>
      ${hasCollision ? `<text x="${PAD+S(p.x)+w-6}" y="${PAD+S(p.y)+10}" font-family="JetBrains Mono" font-size="8" fill="#ff4444">⚠</text>` : ''}
      <text x="${PAD+S(p.x)+w/2}" y="${PAD+S(p.y)+h/2-4}" font-family="JetBrains Mono" font-size="8" fill="#ffffffcc" text-anchor="middle" dominant-baseline="central" pointer-events="none">${escapeXml(d.label)}</text>
      <text x="${PAD+S(p.x)+w/2}" y="${PAD+S(p.y)+h/2+6}" font-family="JetBrains Mono" font-size="6" fill="#ffffff88" text-anchor="middle" dominant-baseline="central" pointer-events="none">${dimText}</text>
      ${elevBadge}
    </g>`;
  }
  g.innerHTML = html;

  attachFurnitureEvents();
}

// ===== RENDER STAGING FURNITURE =====
export function renderStagingFurniture() {
  const svg = document.getElementById('svgStaging');
  if (!svg) return;
  const g = svg.querySelector('#furnitureGroupStaging');
  if (!g) return;

  let c = '';
  const defs = getFurnitureDefs();

  // Group by room (track indices to avoid O(n^2) indexOf)
  const groups = {};
  for (let idx = 0; idx < state.placedFurniture.length; idx++) {
    const p = state.placedFurniture[idx];
    if (p.x >= 0 && p.y >= 0) continue; // skip placed items
    const d = defs.find(f => f.id === p.id);
    if (!d) continue;
    const room = d.room || 'other';
    if (!groups[room]) groups[room] = [];
    groups[room].push({ piece: p, def: d, idx });
  }

  let offsetY = 20;
  const SCALE = 1.3;
  const CANVAS_WIDTH = 260;
  const MAX_WIDTH = CANVAS_WIDTH - 20;

  const roomLabels = {
    living: 'Living Room',
    bedroom: 'Bedroom',
    kitchen: 'Kitchen',
    other: 'Other'
  };

  for (const [roomId, items] of Object.entries(groups)) {
    // Section header
    c += `<text x="10" y="${offsetY}" font-family="JetBrains Mono" font-size="9" fill="#666" letter-spacing="2">${roomLabels[roomId] || roomId}</text>`;
    c += `<line x1="10" y1="${offsetY + 3}" x2="250" y2="${offsetY + 3}" stroke="#333" stroke-width="1"/>`;
    offsetY += 15;

    items.forEach(({ piece, def, idx: actualIdx }) => {
      let w = (piece.rotated ? S(def.h) : S(def.w)) * SCALE;
      let h = (piece.rotated ? S(def.w) : S(def.h)) * SCALE;

      if (w > MAX_WIDTH) {
        const ratio = MAX_WIDTH / w;
        w = MAX_WIDTH;
        h = h * ratio;
      }

      const sx = (CANVAS_WIDTH - w) / 2;
      const sy = offsetY;

      // Use custom color if set
      const fillColor = piece.customColor || def.color;

      c += `<g class="furniture-piece-staging" data-idx="${actualIdx}">
        <rect x="${sx}" y="${sy}" width="${w}" height="${h}" fill="${fillColor}" stroke="${def.stroke}" stroke-width="1.5" rx="3" opacity="0.85"/>
        <text x="${sx+w/2}" y="${sy+h/2-4}" font-family="JetBrains Mono" font-size="9" fill="#ffffffcc" text-anchor="middle" dominant-baseline="central" pointer-events="none">${escapeXml(def.label)}</text>
        <text x="${sx+w/2}" y="${sy+h/2+6}" font-family="JetBrains Mono" font-size="7" fill="#ffffff88" text-anchor="middle" pointer-events="none">${formatDist(def.w)} × ${formatDist(def.h)}</text>
      </g>`;

      offsetY += h + 8;
    });

    offsetY += 15;
  }

  g.innerHTML = c;
  attachStagingFurnitureEvents();
}

// ===== RETURN TO STAGING =====
export function returnToStaging(idx) {
  state.placedFurniture[idx].x = -10;
  state.placedFurniture[idx].y = -10;
  state.placedFurniture[idx].rotated = false;
  state.placedFurniture[idx].elevation = 0;
  state.placedFurniture[idx].stackedOn = null;
  state.selectedFurniture.delete(idx);
  renderFurniture();
  renderStagingFurniture();
  // Update elevation view
  if (window._renderElevation && state.showElevation) window._renderElevation();
  saveToCache();
}

// ===== EVENT HANDLERS =====
function attachFurnitureEvents() {
  console.log('Attaching furniture events to', document.querySelectorAll('.furniture-piece').length, 'pieces');
  document.querySelectorAll('.furniture-piece').forEach(el => {
    el.addEventListener('mousedown', e => {
      console.log('Mousedown on furniture', el.dataset.idx);
      if (e.button === 2) return;
      e.stopPropagation();

      const idx = parseInt(el.dataset.idx);

      // Measure mode: snap to edge
      if (state.measureMode) {
        const p = state.placedFurniture[idx];
        const d = getFurnitureDef(p.id);
        const r = document.getElementById('canvasContainer').getBoundingClientRect();
        const clickX = ((e.clientX - r.left - state.panX) / state.zoom - PAD) / PPI;
        const clickY = ((e.clientY - r.top - state.panY) / state.zoom - PAD) / PPI;
        const snapPoint = getEdgeSnapPoint(p, d, clickX, clickY);

        if (!state.measureStart) {
          state.measureStart = { x: Math.round(snapPoint.x), y: Math.round(snapPoint.y), edge: snapPoint.edge };
          state.measureEnd = null;
          state.measureShiftKey = e.shiftKey;
        } else if (!state.measureEnd) {
          state.measureEnd = { x: Math.round(snapPoint.x), y: Math.round(snapPoint.y), edge: snapPoint.edge };
          state.measureShiftKey = e.shiftKey;
        } else {
          state.measureStart = { x: Math.round(snapPoint.x), y: Math.round(snapPoint.y), edge: snapPoint.edge };
          state.measureEnd = null;
          state.measureShiftKey = e.shiftKey;
        }

        // Trigger measurement render via callback
        if (window._renderMeasurement) window._renderMeasurement();
        return;
      }

      // Anchor mode: Alt+click on furniture, or click canvas for wall anchor
      if (state.anchorMode) {
        if (!state.anchorSource) {
          state.anchorSource = idx;
        } else if (state.anchorSource !== idx) {
          // Link anchor: source → target furniture
          const src = state.placedFurniture[state.anchorSource];
          if (!src.anchors) src.anchors = [];
          // Avoid duplicate anchors
          const targetId = state.placedFurniture[idx].id;
          if (!src.anchors.find(a => a.id === targetId && a.type === 'furniture')) {
            src.anchors.push({ type: 'furniture', id: targetId });
          }
          state.anchorSource = null;
          if (window._renderAnchors) window._renderAnchors();
          saveToCache();
        }
        return;
      }

      // Multi-select with Shift
      if (e.shiftKey) {
        if (state.selectedFurniture.has(idx)) {
          state.selectedFurniture.delete(idx);
        } else {
          state.selectedFurniture.add(idx);
        }
        renderFurniture();
        if (window._updateAlignToolbar) window._updateAlignToolbar();
        return;
      }

      // Regular drag - if clicking an already selected item, drag all selected items
      // Otherwise, clear selection and select just this item
      const wasAlreadySelected = state.selectedFurniture.has(idx);
      if (!wasAlreadySelected) {
        state.selectedFurniture.clear();
        state.selectedFurniture.add(idx);
      }

      // Push to history before starting drag
      pushHistory();

      state.dragging = idx;
      const r = document.getElementById('canvasContainer').getBoundingClientRect();
      const mx = (e.clientX - r.left - state.panX) / state.zoom;
      const my = (e.clientY - r.top - state.panY) / state.zoom;
      const p = state.placedFurniture[idx];
      state.dragOffset.x = (mx - PAD) / PPI - p.x;
      state.dragOffset.y = (my - PAD) / PPI - p.y;

      // Store initial positions of all selected items for group dragging
      state.dragInitialPositions = new Map();
      for (const selectedIdx of state.selectedFurniture) {
        const piece = state.placedFurniture[selectedIdx];
        if (piece && piece.x >= 0 && piece.y >= 0) {
          state.dragInitialPositions.set(selectedIdx, { x: piece.x, y: piece.y });
        }
      }

      // Update toolbar visibility
      if (window._updateAlignToolbar) window._updateAlignToolbar();
      renderFurniture();
    });

    el.addEventListener('dblclick', e => {
      e.stopPropagation();
      e.preventDefault();
      const i = parseInt(el.dataset.idx);
      console.log('Double-click detected on furniture:', i, 'measureMode:', state.measureMode);
      if (state.measureMode) {
        console.log('Rotation blocked by measure mode');
        return;
      }
      console.log('Rotating furniture:', i, 'from', state.placedFurniture[i].rotated, 'to', !state.placedFurniture[i].rotated);
      pushHistory();
      state.placedFurniture[i].rotated = !state.placedFurniture[i].rotated;
      renderFurniture();
      renderStagingFurniture();
      saveToCache();
      // Update elevation view
      if (window._renderElevation && state.showElevation) window._renderElevation();
      console.log('Rotation complete, new state:', state.placedFurniture[i].rotated);
    });

    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      pushHistory();
      returnToStaging(parseInt(el.dataset.idx));
    });
  });
}

function attachStagingFurnitureEvents() {
  document.querySelectorAll('.furniture-piece-staging').forEach(el => {
    el.addEventListener('click', e => {
      if (e.button === 2) return;
      e.stopPropagation();
      pushHistory();
      const idx = parseInt(el.dataset.idx);
      const p = state.placedFurniture[idx];
      p.x = 40;
      p.y = 120;
      p.elevation = 0;
      p.stackedOn = null;
      renderFurniture();
      renderStagingFurniture();
      saveToCache();
      // Update elevation view
      if (window._renderElevation && state.showElevation) window._renderElevation();
    });

    el.addEventListener('dblclick', e => {
      e.stopPropagation();
      e.preventDefault();
      const i = parseInt(el.dataset.idx);
      console.log('Double-click on staging furniture:', i);
      console.log('Rotating staging furniture:', i, 'from', state.placedFurniture[i].rotated, 'to', !state.placedFurniture[i].rotated);
      pushHistory();
      state.placedFurniture[i].rotated = !state.placedFurniture[i].rotated;
      renderFurniture();
      renderStagingFurniture();
      saveToCache();
      // Update elevation view
      if (window._renderElevation && state.showElevation) window._renderElevation();
      console.log('Staging rotation complete, new state:', state.placedFurniture[i].rotated);
    });
  });
}

// ===== EDGE SNAP (for measurement) =====
function getEdgeSnapPoint(p, d, clickX, clickY) {
  const pw = p.rotated ? d.h : d.w;
  const ph = p.rotated ? d.w : d.h;
  const left = p.x, right = p.x + pw;
  const top = p.y, bottom = p.y + ph;
  const centerX = p.x + pw / 2, centerY = p.y + ph / 2;

  const distToLeft = Math.abs(clickX - left);
  const distToRight = Math.abs(clickX - right);
  const distToTop = Math.abs(clickY - top);
  const distToBottom = Math.abs(clickY - bottom);

  const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

  if (minDist === distToLeft) return { x: left, y: centerY, edge: 'left' };
  if (minDist === distToRight) return { x: right, y: centerY, edge: 'right' };
  if (minDist === distToTop) return { x: centerX, y: top, edge: 'top' };
  if (minDist === distToBottom) return { x: centerX, y: bottom, edge: 'bottom' };

  return { x: centerX, y: centerY, edge: 'center' };
}

/**
 * Handle furniture drag movement (called from app.js mousemove handler)
 */
export function handleDragMove(e) {
  if (state.dragging === null) return false;

  const ctr = document.getElementById('canvasContainer');
  const r = ctr.getBoundingClientRect();
  let ix = ((e.clientX - r.left - state.panX) / state.zoom - PAD) / PPI - state.dragOffset.x;
  let iy = ((e.clientY - r.top - state.panY) / state.zoom - PAD) / PPI - state.dragOffset.y;

  // Calculate the delta from the dragged item's initial position
  const draggingInitial = state.dragInitialPositions?.get(state.dragging);

  // Axis constraint with Shift key
  if (e.shiftKey && draggingInitial) {
    const dx = Math.abs(Math.round(ix) - draggingInitial.x);
    const dy = Math.abs(Math.round(iy) - draggingInitial.y);

    // Lock to dominant axis based on initial movement direction
    if (!state.dragAxisLocked) {
      if (dx > 3 || dy > 3) {
        state.dragAxisLocked = dx > dy ? 'x' : 'y';
      }
    }

    if (state.dragAxisLocked === 'x') {
      iy = draggingInitial.y - state.dragOffset.y;
    } else if (state.dragAxisLocked === 'y') {
      ix = draggingInitial.x - state.dragOffset.x;
    }
  } else {
    state.dragAxisLocked = null;
  }

  if (draggingInitial && state.selectedFurniture.size > 1) {
    const dx = Math.round(ix) - draggingInitial.x;
    const dy = Math.round(iy) - draggingInitial.y;

    // Move all selected items by the same delta
    for (const selectedIdx of state.selectedFurniture) {
      const initial = state.dragInitialPositions.get(selectedIdx);
      if (initial) {
        state.placedFurniture[selectedIdx].x = initial.x + dx;
        state.placedFurniture[selectedIdx].y = initial.y + dy;
      }
    }
  } else {
    // Single item drag
    state.placedFurniture[state.dragging].x = Math.round(ix);
    state.placedFurniture[state.dragging].y = Math.round(iy);
  }

  renderFurniture();
  renderStagingFurniture();

  // Update dimension links and Show All measurements in real-time during drag
  if (window._renderAnchors) window._renderAnchors();
  if (window._renderMeasurement) window._renderMeasurement();

  const d = getFurnitureDef(state.placedFurniture[state.dragging].id);
  const p = state.placedFurniture[state.dragging];
  const info = document.querySelector('#selectedInfo span');
  if (info && d) {
    const itemCount = state.selectedFurniture.size;
    const countText = itemCount > 1 ? ` (${itemCount} items)` : '';
    info.textContent = `${d.name}${countText} @ ${formatDist(p.x)}, ${formatDist(p.y)}${p.elevation ? ` ↑${formatDist(p.elevation)}` : ''}`;
  }
  return true;
}

/**
 * Handle furniture drag end (called from app.js mouseup handler)
 */
export function handleDragEnd() {
  if (state.dragging === null) return false;

  // Auto-stack check for all selected items
  for (const selectedIdx of state.selectedFurniture) {
    const piece = state.placedFurniture[selectedIdx];
    if (piece && piece.x >= 0 && piece.y >= 0) {
      autoStack(piece, selectedIdx);
    }
  }

  state.dragging = null;
  state.dragInitialPositions = null;
  const info = document.querySelector('#selectedInfo span');
  if (info) info.textContent = 'none';
  saveToCache();
  renderFurniture(); // Re-render to show elevation after auto-stack

  // Update dimension links after drag ends
  if (window._renderAnchors) window._renderAnchors();

  // Update elevation view
  if (window._renderElevation && state.showElevation) window._renderElevation();

  return true;
}

/**
 * measurement.js — Measurement tool, anchors, and "Show All" mode
 *
 * Measure mode: click two points to measure distance between them
 * Show All: display distances from every placed piece to nearest walls
 * Anchors: link two pieces to show persistent distance between them
 */

import { S, PAD, state, getFurnitureDef, saveToCache } from './data.js';
import { getRoomBounds, findRoomAt } from './collision.js';
import { formatDist } from './units.js';
import { pushHistory } from './history.js';

// ===== MEASUREMENT RENDERING =====
export function renderMeasurement() {
  const svg = document.getElementById('svgPlan');
  if (!svg) return;
  const g = svg.querySelector('#measurementGroup');
  if (!g) return;

  let c = '';

  // Render locked/permanent measurements
  for (let i = 0; i < state.lockedMeasurements.length; i++) {
    const locked = state.lockedMeasurements[i];
    c += renderMeasureLine(locked.start, locked.end, false, i, locked.shiftKey);
  }

  // Show All mode: render distances for every placed piece
  if (state.showAllMeasurements) {
    c += renderAllMeasurements();
  }

  // Active measurement tool
  if (state.measureStart && state.measureEnd) {
    c += renderMeasureLine(state.measureStart, state.measureEnd);
  } else if (state.measureStart) {
    // Show preview line following cursor
    if (state.measurePreview) {
      c += renderMeasureLine(state.measureStart, state.measurePreview, true);
    } else {
      // Just show the start point if no preview yet
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim() || '#c5975b';
      const bgPanel = getComputedStyle(document.documentElement).getPropertyValue('--bg-panel').trim() || '#ffffff';
      const sx1 = PAD + S(state.measureStart.x);
      const sy1 = PAD + S(state.measureStart.y);
      c += `<circle cx="${sx1}" cy="${sy1}" r="6" fill="${accentColor}" stroke="${bgPanel}" stroke-width="2"/>`;
      if (state.measureStart.edge) {
        c += `<text x="${sx1}" y="${sy1 - 12}" font-family="JetBrains Mono" font-size="9" fill="${accentColor}" text-anchor="middle" font-weight="600">${state.measureStart.edge[0].toUpperCase()}</text>`;
      }
    }
  }

  g.innerHTML = c;

  // Attach event handlers to locked measurements
  attachLockedMeasurementEvents();
}

// Expose globally for furniture.js callback
window._renderMeasurement = renderMeasurement;

function renderMeasureLine(start, end, isPreview = false, lockedIdx = -1, forceShiftKey = null) {
  let x1 = start.x, y1 = start.y, x2 = end.x, y2 = end.y;

  // If shift was held during measurement, snap to 45-degree angles
  // For locked measurements, use the stored shiftKey state
  const snapTo45 = forceShiftKey !== null ? forceShiftKey : state.measureShiftKey;

  if (snapTo45) {
    // Calculate angle from start to end
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // Snap to nearest 45-degree increment: 0, 45, 90, 135, 180, -135, -90, -45
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

    // Calculate distance
    const dist = Math.sqrt(dx*dx + dy*dy);

    // Apply snapped angle
    const radians = nearestAngle * Math.PI / 180;
    x2 = x1 + dist * Math.cos(radians);
    y2 = y1 + dist * Math.sin(radians);
  } else {
    // Auto-lock to H or V if close
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    if (dx < 3) x2 = x1;
    else if (dy < 3) y2 = y1;
  }

  const sx1 = PAD + S(x1), sy1 = PAD + S(y1);
  const sx2 = PAD + S(x2), sy2 = PAD + S(y2);
  const actualDx = x2 - x1, actualDy = y2 - y1;
  const dist = Math.sqrt(actualDx * actualDx + actualDy * actualDy);
  const midX = (sx1 + sx2) / 2, midY = (sy1 + sy2) / 2;

  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim() || '#c5975b';
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary').trim() || '#1a1a24';
  const bgPanel = getComputedStyle(document.documentElement).getPropertyValue('--bg-panel').trim() || '#ffffff';

  // Preview lines are slightly more transparent
  const opacity = isPreview ? ' opacity="0.7"' : '';

  // Locked measurements get a data attribute and different styling
  const isLocked = lockedIdx >= 0;
  const dataAttr = isLocked ? ` data-locked-idx="${lockedIdx}"` : '';
  const lockedClass = isLocked ? ' locked-measurement' : '';
  const isSelected = state.selectedMeasurement?.type === 'locked' && state.selectedMeasurement?.idx === lockedIdx;

  let c = '';

  // Wrap in group for locked measurements (to handle events)
  if (isLocked) {
    c += `<g class="locked-measurement-group" data-locked-idx="${lockedIdx}" style="cursor:pointer">`;
  }

  // Line - thicker and more visible, highlight if selected
  const lineWidth = isSelected ? 4 : 3;
  const lineOpacity = isSelected ? '' : opacity;
  c += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="${accentColor}" stroke-width="${lineWidth}" stroke-dasharray="8 4"${lineOpacity}${dataAttr}/>`;

  // Endpoints - larger, draggable if selected
  const endpointRadius = isSelected ? 8 : 6;
  const endpointStroke = isSelected ? 3 : 2;
  c += `<circle class="measure-handle-start" cx="${sx1}" cy="${sy1}" r="${endpointRadius}" fill="${accentColor}" stroke="${bgPanel}" stroke-width="${endpointStroke}"${opacity}${dataAttr} style="cursor:${isSelected ? 'move' : 'pointer'}" data-locked-idx="${lockedIdx}" data-point="start"/>`;
  if (start.edge) {
    c += `<text x="${sx1}" y="${sy1 - 12}" font-family="JetBrains Mono" font-size="9" fill="${accentColor}" text-anchor="middle" font-weight="600"${opacity}>${start.edge[0].toUpperCase()}</text>`;
  }
  c += `<circle class="measure-handle-end" cx="${sx2}" cy="${sy2}" r="${endpointRadius}" fill="${accentColor}" stroke="${bgPanel}" stroke-width="${endpointStroke}"${opacity}${dataAttr} style="cursor:${isSelected ? 'move' : 'pointer'}" data-locked-idx="${lockedIdx}" data-point="end"/>`;
  if (end.edge && !isPreview) {
    c += `<text x="${sx2}" y="${sy2 - 12}" font-family="JetBrains Mono" font-size="9" fill="${accentColor}" text-anchor="middle" font-weight="600"${opacity}>${end.edge[0].toUpperCase()}</text>`;
  }

  // Label - larger and more prominent
  const label = formatDist(dist);
  const labelWidth = label.length * 8 + 12;
  const labelStroke = isSelected ? 3 : 2;
  c += `<rect x="${midX - labelWidth/2}" y="${midY - 14}" width="${labelWidth}" height="28" fill="${bgColor}" stroke="${accentColor}" stroke-width="${labelStroke}" rx="6"${opacity}${dataAttr}/>`;
  c += `<text x="${midX}" y="${midY + 3}" font-family="JetBrains Mono" font-size="13" font-weight="bold" fill="${accentColor}" text-anchor="middle" dominant-baseline="central"${opacity}>${label}</text>`;

  // Lock indicator icon for locked measurements
  if (isLocked) {
    c += `<text x="${midX - labelWidth/2 + 4}" y="${midY - 8}" font-family="sans-serif" font-size="10" fill="${accentColor}" pointer-events="none">🔒</text>`;
    c += `</g>`;
  }

  return c;
}

// ===== SHOW ALL MEASUREMENTS =====
function renderAllMeasurements() {
  let c = '';

  // Use theme-aware colors - much brighter in light mode
  const isLightMode = document.body.classList.contains('light-mode');
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim() || '#c5975b';
  const lineColor = isLightMode ? accentColor + 'ee' : accentColor + 'aa';
  const textColor = isLightMode ? accentColor : accentColor + 'bb';

  for (const p of state.placedFurniture) {
    if (p.x < 0 || p.y < 0) continue;
    const d = getFurnitureDef(p.id);
    if (!d) continue;

    const pw = p.rotated ? d.h : d.w;
    const ph = p.rotated ? d.w : d.h;
    const cx = p.x + pw / 2;
    const cy = p.y + ph / 2;

    // Find which room the piece is in
    const room = findRoomAt(cx, cy);
    if (!room) continue;

    const bounds = getRoomBounds(room.id);
    if (!bounds) continue;

    // Distance to each wall
    const distLeft = p.x - bounds.minX;
    const distRight = bounds.maxX - (p.x + pw);
    const distTop = p.y - bounds.minY;
    const distBottom = bounds.maxY - (p.y + ph);

    const fontSize = isLightMode ? 8 : 7;
    const fontWeight = isLightMode ? '700' : '600';
    const lineWidth = isLightMode ? 1.5 : 1;

    // Left distance
    if (distLeft > 3) {
      const ly = PAD + S(cy);
      const lx1 = PAD + S(bounds.minX);
      const lx2 = PAD + S(p.x);
      c += `<line x1="${lx1}" y1="${ly}" x2="${lx2}" y2="${ly}" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-dasharray="3 2"/>`;
      c += `<text x="${(lx1+lx2)/2}" y="${ly-3}" font-family="JetBrains Mono" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}" text-anchor="middle">${formatDist(distLeft)}</text>`;
    }

    // Right distance
    if (distRight > 3) {
      const ry = PAD + S(cy);
      const rx1 = PAD + S(p.x + pw);
      const rx2 = PAD + S(bounds.maxX);
      c += `<line x1="${rx1}" y1="${ry}" x2="${rx2}" y2="${ry}" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-dasharray="3 2"/>`;
      c += `<text x="${(rx1+rx2)/2}" y="${ry-3}" font-family="JetBrains Mono" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}" text-anchor="middle">${formatDist(distRight)}</text>`;
    }

    // Top distance
    if (distTop > 3) {
      const tx = PAD + S(cx);
      const ty1 = PAD + S(bounds.minY);
      const ty2 = PAD + S(p.y);
      c += `<line x1="${tx}" y1="${ty1}" x2="${tx}" y2="${ty2}" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-dasharray="3 2"/>`;
      c += `<text x="${tx+3}" y="${(ty1+ty2)/2}" font-family="JetBrains Mono" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}" text-anchor="start">${formatDist(distTop)}</text>`;
    }

    // Bottom distance
    if (distBottom > 3) {
      const bx = PAD + S(cx);
      const by1 = PAD + S(p.y + ph);
      const by2 = PAD + S(bounds.maxY);
      c += `<line x1="${bx}" y1="${by1}" x2="${bx}" y2="${by2}" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-dasharray="3 2"/>`;
      c += `<text x="${bx+3}" y="${(by1+by2)/2}" font-family="JetBrains Mono" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}" text-anchor="start">${formatDist(distBottom)}</text>`;
    }
  }

  return c;
}

// ===== ANCHOR RENDERING =====
// Compute edge-to-edge gap (not center-to-center) between two axis-aligned rects
function edgeGap(ax, ay, aw, ah, bx, by, bw, bh) {
  // Horizontal gap
  const hGap = Math.max(0, Math.max(bx - (ax + aw), ax - (bx + bw)));
  // Vertical gap
  const vGap = Math.max(0, Math.max(by - (ay + ah), ay - (by + bh)));
  return Math.sqrt(hGap * hGap + vGap * vGap);
}

// Closest edge points between two rects (for drawing the line)
function closestEdgePoints(ax, ay, aw, ah, bx, by, bw, bh) {
  const acx = ax + aw/2, acy = ay + ah/2;
  const bcx = bx + bw/2, bcy = by + bh/2;
  const dx = bcx - acx, dy = bcy - acy;

  let x1, y1, x2, y2;
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal dominant
    x1 = dx > 0 ? ax + aw : ax;
    y1 = acy;
    x2 = dx > 0 ? bx : bx + bw;
    y2 = bcy;
  } else {
    // Vertical dominant
    x1 = acx;
    y1 = dy > 0 ? ay + ah : ay;
    x2 = bcx;
    y2 = dy > 0 ? by : by + bh;
  }
  return { x1, y1, x2, y2 };
}

export function renderAnchors() {
  const svg = document.getElementById('svgPlan');
  if (!svg) return;
  const g = svg.querySelector('#anchorGroup');
  if (!g) return;

  let c = '';

  for (const p of state.placedFurniture) {
    if (!p.anchors || p.x < 0 || p.y < 0) continue;
    const d = getFurnitureDef(p.id);
    if (!d) continue;
    const pw = p.rotated ? d.h : d.w;
    const ph = p.rotated ? d.w : d.h;

    for (const anchor of p.anchors) {
      if (anchor.type === 'wall') {
        // Wall anchor: measure from piece edge to wall line
        c += renderWallAnchor(p, d, pw, ph, anchor);
      } else {
        // Furniture anchor
        const target = state.placedFurniture.find(t => t.id === (anchor.id || anchor));
        if (!target || target.x < 0 || target.y < 0) continue;
        const td = getFurnitureDef(target.id);
        if (!td) continue;
        const tw = target.rotated ? td.h : td.w;
        const th = target.rotated ? td.w : td.h;

        // Edge-to-edge distance and line points
        const gap = edgeGap(p.x, p.y, pw, ph, target.x, target.y, tw, th);
        const pts = closestEdgePoints(p.x, p.y, pw, ph, target.x, target.y, tw, th);

        const sx1 = PAD + S(pts.x1), sy1 = PAD + S(pts.y1);
        const sx2 = PAD + S(pts.x2), sy2 = PAD + S(pts.y2);

        // Use theme colors for links
        const linkColor = '#9966cc';
        const linkColorDim = '#9966cc66';
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary').trim() || '#1a1a24';

        c += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="${linkColor}" stroke-width="2" stroke-dasharray="6 4"/>`;
        c += `<circle cx="${sx1}" cy="${sy1}" r="4" fill="${linkColor}" stroke="${bgColor}" stroke-width="1"/>`;
        c += `<circle cx="${sx2}" cy="${sy2}" r="4" fill="${linkColor}" stroke="${bgColor}" stroke-width="1"/>`;

        const mx = (sx1+sx2)/2, my = (sy1+sy2)/2;
        const label = formatDist(gap);
        const lw = label.length * 7 + 10;
        c += `<rect x="${mx-lw/2}" y="${my-9}" width="${lw}" height="18" fill="${bgColor}" stroke="${linkColor}" stroke-width="1.5" rx="4"/>`;
        c += `<text x="${mx}" y="${my+1}" font-family="JetBrains Mono" font-size="9" font-weight="600" fill="${linkColor}" text-anchor="middle" dominant-baseline="central">${label}</text>`;
      }
    }
  }

  g.innerHTML = c;
}

function renderWallAnchor(p, d, pw, ph, anchor) {
  let c = '';
  // anchor.wallSide: 'left' | 'right' | 'top' | 'bottom'
  // Find the nearest wall boundary in that direction
  const room = findRoomAt(p.x + pw/2, p.y + ph/2);
  if (!room) return '';
  const bounds = getRoomBounds(room.id);
  if (!bounds) return '';

  let dist, sx1, sy1, sx2, sy2;
  const side = anchor.wallSide;

  if (side === 'left') {
    dist = p.x - bounds.minX;
    const cy = p.y + ph/2;
    sx1 = PAD + S(p.x); sy1 = PAD + S(cy);
    sx2 = PAD + S(bounds.minX); sy2 = PAD + S(cy);
  } else if (side === 'right') {
    dist = bounds.maxX - (p.x + pw);
    const cy = p.y + ph/2;
    sx1 = PAD + S(p.x + pw); sy1 = PAD + S(cy);
    sx2 = PAD + S(bounds.maxX); sy2 = PAD + S(cy);
  } else if (side === 'top') {
    dist = p.y - bounds.minY;
    const cx = p.x + pw/2;
    sx1 = PAD + S(cx); sy1 = PAD + S(p.y);
    sx2 = PAD + S(cx); sy2 = PAD + S(bounds.minY);
  } else if (side === 'bottom') {
    dist = bounds.maxY - (p.y + ph);
    const cx = p.x + pw/2;
    sx1 = PAD + S(cx); sy1 = PAD + S(p.y + ph);
    sx2 = PAD + S(cx); sy2 = PAD + S(bounds.maxY);
  } else return '';

  if (dist < 1) return '';

  const linkColor = '#9966cc';
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary').trim() || '#1a1a24';

  c += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="${linkColor}" stroke-width="2" stroke-dasharray="6 4"/>`;
  c += `<circle cx="${sx1}" cy="${sy1}" r="4" fill="${linkColor}" stroke="${bgColor}" stroke-width="1"/>`;
  c += `<circle cx="${sx2}" cy="${sy2}" r="4" fill="${linkColor}" stroke="${bgColor}" stroke-width="1"/>`;

  const mx = (sx1+sx2)/2, my = (sy1+sy2)/2;
  const label = formatDist(dist);
  const lw = label.length * 7 + 10;
  c += `<rect x="${mx-lw/2}" y="${my-9}" width="${lw}" height="18" fill="${bgColor}" stroke="${linkColor}" stroke-width="1.5" rx="4"/>`;
  c += `<text x="${mx}" y="${my+1}" font-family="JetBrains Mono" font-size="9" font-weight="600" fill="${linkColor}" text-anchor="middle" dominant-baseline="central">${label}</text>`;

  return c;
}

// Expose for furniture.js callback
window._renderAnchors = renderAnchors;

// ===== TOGGLE FUNCTIONS =====
export function toggleMeasure() {
  state.measureMode = !state.measureMode;
  document.getElementById('btnMeasure')?.classList.toggle('active', state.measureMode);
  const ctr = document.getElementById('canvasContainer');

  if (!state.measureMode) {
    state.measureStart = null;
    state.measureEnd = null;
    renderMeasurement();
    if (ctr) ctr.style.cursor = 'grab';
  } else {
    if (ctr) ctr.style.cursor = 'crosshair';
  }
}

export function toggleShowAll() {
  state.showAllMeasurements = !state.showAllMeasurements;
  document.getElementById('btnShowAll')?.classList.toggle('active', state.showAllMeasurements);
  renderMeasurement();
}

export function toggleAnchorMode() {
  state.anchorMode = !state.anchorMode;
  state.anchorSource = null;
  document.getElementById('btnAnchor')?.classList.toggle('active', state.anchorMode);
}

// ===== LOCKED MEASUREMENTS =====
/**
 * Lock the current measurement (make it permanent)
 */
export function lockCurrentMeasurement() {
  if (!state.measureStart || !state.measureEnd) return;

  pushHistory();

  state.lockedMeasurements.push({
    start: { ...state.measureStart },
    end: { ...state.measureEnd },
    shiftKey: state.measureShiftKey
  });

  // Clear current measurement
  state.measureStart = null;
  state.measureEnd = null;
  state.measurePreview = null;

  saveToCache();
  renderMeasurement();
}

/**
 * Delete a locked measurement by index
 */
function deleteLockedMeasurement(idx) {
  pushHistory();
  state.lockedMeasurements.splice(idx, 1);
  saveToCache();
  renderMeasurement();
}

/**
 * Attach event handlers to locked measurements
 */
function attachLockedMeasurementEvents() {
  document.querySelectorAll('.locked-measurement-group').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(el.dataset.lockedIdx);
      state.selectedMeasurement = { type: 'locked', idx };
      state.selectedDivider = null;
      renderMeasurement();
    });

    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(el.dataset.lockedIdx);
      if (confirm('Delete this locked measurement?')) {
        deleteLockedMeasurement(idx);
      }
    });

    el.addEventListener('mouseenter', e => {
      el.style.opacity = '0.7';
    });

    el.addEventListener('mouseleave', e => {
      el.style.opacity = '1';
    });
  });

  // Attach drag handlers to measurement endpoints
  document.querySelectorAll('.measure-handle-start, .measure-handle-end').forEach(handle => {
    handle.addEventListener('mousedown', e => {
      e.stopPropagation();
      e.preventDefault();

      const idx = parseInt(handle.dataset.lockedIdx);
      const point = handle.dataset.point;

      if (idx < 0 || idx >= state.lockedMeasurements.length) return;

      state.draggingMeasurementPoint = { type: 'locked', idx, point };

      const handleMouseMove = (moveEvent) => {
        if (!state.draggingMeasurementPoint) return;

        const r = document.getElementById('canvasContainer').getBoundingClientRect();
        let newX = Math.round(((moveEvent.clientX - r.left - state.panX) / state.zoom - PAD) / PPI);
        let newY = Math.round(((moveEvent.clientY - r.top - state.panY) / state.zoom - PAD) / PPI);

        const measurement = state.lockedMeasurements[idx];
        const otherPoint = point === 'start' ? measurement.end : measurement.start;

        // Apply angle snap if Shift is held
        if (moveEvent.shiftKey) {
          const dx = newX - otherPoint.x;
          const dy = newY - otherPoint.y;
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;

          // Snap to nearest 45-degree increment
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

          const dist = Math.sqrt(dx*dx + dy*dy);
          const radians = nearestAngle * Math.PI / 180;
          newX = Math.round(otherPoint.x + dist * Math.cos(radians));
          newY = Math.round(otherPoint.y + dist * Math.sin(radians));
        }

        if (point === 'start') {
          measurement.start.x = newX;
          measurement.start.y = newY;
        } else {
          measurement.end.x = newX;
          measurement.end.y = newY;
        }

        renderMeasurement();
      };

      const handleMouseUp = () => {
        if (state.draggingMeasurementPoint) {
          pushHistory();
          saveToCache();
          state.draggingMeasurementPoint = null;
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  });
}

// Expose for inline handlers
window.lockCurrentMeasurement = lockCurrentMeasurement;

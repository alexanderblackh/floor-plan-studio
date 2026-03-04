/**
 * measurement.js — Measurement tool, anchors, and "Show All" mode
 *
 * Measure mode: click two points to measure distance between them
 * Show All: display distances from every placed piece to nearest walls
 * Anchors: link two pieces to show persistent distance between them
 */

import { S, PAD, state, getFurnitureDef, getFixtures, saveToCache } from './data.js';
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
/**
 * Get all 9 anchor points for an object (x, y, w, h)
 * Returns object with point names as keys and {x, y} as values
 */
function getAnchorPoints(x, y, w, h) {
  return {
    topLeft: { x, y },
    topCenter: { x: x + w/2, y },
    topRight: { x: x + w, y },
    rightCenter: { x: x + w, y: y + h/2 },
    bottomRight: { x: x + w, y: y + h },
    bottomCenter: { x: x + w/2, y: y + h },
    bottomLeft: { x, y: y + h },
    leftCenter: { x, y: y + h/2 },
    center: { x: x + w/2, y: y + h/2 }
  };
}

/**
 * Find the closest anchor point on an object to a given coordinate
 */
function findClosestAnchorPoint(objX, objY, objW, objH, targetX, targetY) {
  const points = getAnchorPoints(objX, objY, objW, objH);
  let closestName = 'center';
  let minDist = Infinity;

  for (const [name, pt] of Object.entries(points)) {
    const dist = Math.sqrt((pt.x - targetX)**2 + (pt.y - targetY)**2);
    if (dist < minDist) {
      minDist = dist;
      closestName = name;
    }
  }

  return { name: closestName, point: points[closestName], distance: minDist };
}

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
  // Find closest points on each rectangle's perimeter
  const acx = ax + aw/2, acy = ay + ah/2;
  const bcx = bx + bw/2, bcy = by + bh/2;

  // Clamp centers to each other's rectangles to find closest edge points
  const x1 = Math.max(ax, Math.min(ax + aw, bcx));
  const y1 = Math.max(ay, Math.min(ay + ah, bcy));
  const x2 = Math.max(bx, Math.min(bx + bw, acx));
  const y2 = Math.max(by, Math.min(by + bh, acy));

  return { x1, y1, x2, y2 };
}

/**
 * Render anchor points (9 dots) on an object when hovering or selected for anchoring
 */
function renderAnchorPoints(x, y, w, h, isSource = false, objectType = null) {
  const points = getAnchorPoints(x, y, w, h);
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim() || '#c5975b';
  const sourceColor = '#9966cc'; // Purple for source points

  let c = '';
  for (const [name, pt] of Object.entries(points)) {
    const sx = PAD + S(pt.x);
    const sy = PAD + S(pt.y);
    const color = isSource ? sourceColor : accentColor;
    const r = isSource ? 5 : 4;
    const strokeW = isSource ? 2 : 1.5;

    // Add data attributes for click handling
    const dataAttrs = objectType ? `data-anchor-object-type="${objectType}" data-point-name="${name}"` : `data-point-name="${name}"`;
    c += `<circle class="anchor-point ${objectType ? 'anchor-point-clickable' : ''}" ${dataAttrs} cx="${sx}" cy="${sy}" r="${r}" fill="${color}" stroke="#ffffff" stroke-width="${strokeW}" style="cursor:pointer" opacity="0.9"/>`;
  }
  return c;
}

/**
 * Update anchor save toolbar visibility
 */
export function updateAnchorSaveToolbar() {
  const toolbar = document.getElementById('anchorSaveToolbar');

  if (!toolbar) return;

  // Show toolbar only when both source and target are selected AND not editing
  if (state.anchorMode && state.anchorSource !== null && state.anchorTarget !== null && !state.editingAnchor) {
    toolbar.classList.add('visible');
  } else {
    toolbar.classList.remove('visible');
  }
}

/**
 * Update anchor edit toolbar visibility
 */
export function updateAnchorEditToolbar() {
  const toolbar = document.getElementById('anchorEditToolbar');

  if (!toolbar) return;

  // Show toolbar only when editing an anchor
  if (state.editingAnchor && state.anchorSource !== null && state.anchorTarget !== null) {
    toolbar.classList.add('visible');
  } else {
    toolbar.classList.remove('visible');
  }
}

/**
 * Save changes to edited anchor
 */
window.saveEditedAnchor = function() {
  if (!state.editingAnchor) return;

  const { furnitureIdx, anchorIdx } = state.editingAnchor;
  const piece = state.placedFurniture[furnitureIdx];
  const anchor = piece?.anchors?.[anchorIdx];

  if (!anchor) return;

  // Update the anchor with new points
  if (state.anchorSourcePoint && state.anchorTargetPoint) {
    anchor.sourcePoint = state.anchorSourcePoint;
    anchor.targetPoint = state.anchorTargetPoint;
    anchor.locked = true;
  } else {
    alert('Please select both anchor points, or use "Switch to Adaptive"');
    return;
  }

  // Clear edit state
  state.editingAnchor = null;
  state.anchorSource = null;
  state.anchorSourcePoint = null;
  state.anchorTarget = null;
  state.anchorTargetPoint = null;

  saveToCache();
  renderAnchors();
  if (window._renderFurniture) window._renderFurniture();
};

/**
 * Switch anchor to adaptive mode
 */
window.switchAnchorToAdaptive = function() {
  if (!state.editingAnchor) return;

  const { furnitureIdx, anchorIdx } = state.editingAnchor;
  const piece = state.placedFurniture[furnitureIdx];
  const anchor = piece?.anchors?.[anchorIdx];

  if (!anchor || anchor.type !== 'furniture') return;

  const src = piece;
  const target = state.placedFurniture.find(p => p.id === anchor.id);

  if (!src || !target) return;

  const srcDef = getFurnitureDef(src.id);
  const targetDef = getFurnitureDef(target.id);

  if (!srcDef || !targetDef) return;

  const srcW = src.rotated ? srcDef.h : srcDef.w;
  const srcH = src.rotated ? srcDef.w : srcDef.h;
  const targetW = target.rotated ? targetDef.h : targetDef.w;
  const targetH = target.rotated ? targetDef.w : targetDef.h;

  // Find closest points automatically
  const result = findClosestAnchorPointsBetween(src.x, src.y, srcW, srcH, target.x, target.y, targetW, targetH);

  // Update anchor to adaptive
  anchor.sourcePoint = result.sourcePoint;
  anchor.targetPoint = result.targetPoint;
  anchor.locked = false; // Mark as adaptive

  // Clear edit state
  state.editingAnchor = null;
  state.anchorSource = null;
  state.anchorSourcePoint = null;
  state.anchorTarget = null;
  state.anchorTargetPoint = null;

  saveToCache();
  renderAnchors();
  if (window._renderFurniture) window._renderFurniture();
};

/**
 * Save the anchor with selected points or adaptive
 */
window.saveAnchor = function(forceAdaptive = false) {
  if (state.anchorSource === null || state.anchorTarget === null) return;

  const src = state.placedFurniture[state.anchorSource];
  const target = state.placedFurniture[state.anchorTarget];

  if (!src || !target) return;
  if (!src.anchors) src.anchors = [];

  const srcDef = getFurnitureDef(src.id);
  const targetDef = getFurnitureDef(target.id);

  if (!srcDef || !targetDef) return;

  const srcW = src.rotated ? srcDef.h : srcDef.w;
  const srcH = src.rotated ? srcDef.w : srcDef.h;
  const targetW = target.rotated ? targetDef.h : targetDef.w;
  const targetH = target.rotated ? targetDef.w : targetDef.h;

  // Avoid duplicate anchors
  const targetId = target.id;
  if (src.anchors.find(a => a.id === targetId && a.type === 'furniture')) {
    alert('An anchor already exists between these items');
    return;
  }

  let sourcePoint, targetPoint;
  const hasManualPoints = state.anchorSourcePoint && state.anchorTargetPoint;

  if (forceAdaptive || !hasManualPoints) {
    // Adaptive mode - find closest points automatically
    const result = findClosestAnchorPointsBetween(src.x, src.y, srcW, srcH, target.x, target.y, targetW, targetH);
    sourcePoint = result.sourcePoint;
    targetPoint = result.targetPoint;
  } else {
    // Both points must be selected
    if (!state.anchorSourcePoint || !state.anchorTargetPoint) {
      alert('Please select anchor points on both objects, or click "Save Adaptive"');
      return;
    }
    sourcePoint = state.anchorSourcePoint;
    targetPoint = state.anchorTargetPoint;
  }

  src.anchors.push({
    type: 'furniture',
    id: targetId,
    sourcePoint,
    targetPoint,
    locked: hasManualPoints  // Mark as manually locked if user selected both points
  });

  // Reset anchor mode state
  state.anchorSource = null;
  state.anchorSourcePoint = null;
  state.anchorTarget = null;
  state.anchorTargetPoint = null;

  saveToCache();
  renderAnchors();
  if (window._renderFurniture) window._renderFurniture();
};

export function renderAnchors() {
  const svg = document.getElementById('svgPlan');
  if (!svg) return;
  const g = svg.querySelector('#anchorGroup');
  if (!g) return;

  let c = '';

  // Render anchor mode: show source and target with anchor points
  if (state.anchorMode && state.anchorSource !== null) {
    const sourcePiece = state.placedFurniture[state.anchorSource];
    if (sourcePiece && sourcePiece.x >= 0 && sourcePiece.y >= 0) {
      const sourceDef = getFurnitureDef(sourcePiece.id);
      if (sourceDef) {
        const sw = sourcePiece.rotated ? sourceDef.h : sourceDef.w;
        const sh = sourcePiece.rotated ? sourceDef.w : sourceDef.h;
        const sx = PAD + S(sourcePiece.x);
        const sy = PAD + S(sourcePiece.y);
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim() || '#c5975b';

        // Pulsing glow around source
        c += `<rect x="${sx - 4}" y="${sy - 4}" width="${S(sw) + 8}" height="${S(sh) + 8}" fill="none" stroke="${accentColor}" stroke-width="3" stroke-dasharray="8 4" rx="4" opacity="0.8">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite"/>
        </rect>`;
        c += `<text x="${sx + S(sw)/2}" y="${sy - 12}" font-family="JetBrains Mono" font-size="10" fill="${accentColor}" text-anchor="middle" font-weight="bold">SOURCE</text>`;

        // Show anchor points if target is also selected
        if (state.anchorTarget !== null) {
          c += renderAnchorPoints(sourcePiece.x, sourcePiece.y, sw, sh, true, 'source');

          // If a source point is selected, highlight it
          if (state.anchorSourcePoint) {
            const points = getAnchorPoints(sourcePiece.x, sourcePiece.y, sw, sh);
            const pt = points[state.anchorSourcePoint];
            if (pt) {
              const spx = PAD + S(pt.x);
              const spy = PAD + S(pt.y);
              c += `<circle cx="${spx}" cy="${spy}" r="8" fill="none" stroke="#9966cc" stroke-width="3">
                <animate attributeName="r" values="8;12;8" dur="1s" repeatCount="indefinite"/>
              </circle>`;
            }
          }
        }
      }
    }

    // Render target if selected
    if (state.anchorTarget !== null) {
      const targetPiece = state.placedFurniture[state.anchorTarget];
      if (targetPiece && targetPiece.x >= 0 && targetPiece.y >= 0) {
        const targetDef = getFurnitureDef(targetPiece.id);
        if (targetDef) {
          const tw = targetPiece.rotated ? targetDef.h : targetDef.w;
          const th = targetPiece.rotated ? targetDef.w : targetDef.h;
          const tx = PAD + S(targetPiece.x);
          const ty = PAD + S(targetPiece.y);
          const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim() || '#c5975b';

          // Glow around target
          c += `<rect x="${tx - 4}" y="${ty - 4}" width="${S(tw) + 8}" height="${S(th) + 8}" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="4 2" rx="4" opacity="0.6"/>`;
          c += `<text x="${tx + S(tw)/2}" y="${ty - 12}" font-family="JetBrains Mono" font-size="10" fill="${accentColor}" text-anchor="middle" font-weight="bold">TARGET</text>`;

          // Show anchor points on target object
          c += renderAnchorPoints(targetPiece.x, targetPiece.y, tw, th, false, 'target');

          // If a target point is selected, highlight it
          if (state.anchorTargetPoint) {
            const points = getAnchorPoints(targetPiece.x, targetPiece.y, tw, th);
            const pt = points[state.anchorTargetPoint];
            if (pt) {
              const tpx = PAD + S(pt.x);
              const tpy = PAD + S(pt.y);
              c += `<circle cx="${tpx}" cy="${tpy}" r="8" fill="none" stroke="${accentColor}" stroke-width="3">
                <animate attributeName="r" values="8;12;8" dur="1s" repeatCount="indefinite"/>
              </circle>`;
            }
          }
        }
      }
    }
  }

  // Render all anchors
  for (let furnitureIdx = 0; furnitureIdx < state.placedFurniture.length; furnitureIdx++) {
    const p = state.placedFurniture[furnitureIdx];
    if (!p.anchors || p.x < 0 || p.y < 0) continue;
    const d = getFurnitureDef(p.id);
    if (!d) continue;
    const pw = p.rotated ? d.h : d.w;
    const ph = p.rotated ? d.w : d.h;

    for (let anchorIdx = 0; anchorIdx < p.anchors.length; anchorIdx++) {
      const anchor = p.anchors[anchorIdx];
      const isSelected = state.selectedMeasurement?.type === 'anchor' &&
                        state.selectedMeasurement?.furnitureIdx === furnitureIdx &&
                        state.selectedMeasurement?.anchorIdx === anchorIdx;

      if (anchor.type === 'wall') {
        c += renderWallAnchor(p, d, pw, ph, anchor, furnitureIdx, anchorIdx, isSelected);
      } else if (anchor.type === 'fixture') {
        // Fixture anchor
        const fixtures = getFixtures();
        const fixtureTarget = fixtures.find(f => f.id === anchor.id);
        if (!fixtureTarget) continue;

        c += renderFixtureAnchor(p, d, pw, ph, fixtureTarget, furnitureIdx, anchorIdx, isSelected);
      } else {
        // Furniture anchor
        const target = state.placedFurniture.find(t => t.id === (anchor.id || anchor));
        if (!target || target.x < 0 || target.y < 0) continue;
        const td = getFurnitureDef(target.id);
        if (!td) continue;
        const tw = target.rotated ? td.h : td.w;
        const th = target.rotated ? td.w : td.h;
        const targetIdx = state.placedFurniture.indexOf(target);

        c += renderFurnitureAnchor(p, d, pw, ph, target, td, tw, th, furnitureIdx, targetIdx, anchorIdx, isSelected);
      }
    }
  }

  g.innerHTML = c;
  attachAnchorEvents();
  updateAnchorSaveToolbar();
  updateAnchorEditToolbar();
}

function renderFurnitureAnchor(p, d, pw, ph, target, td, tw, th, furnitureIdx, targetIdx, anchorIdx, isSelected) {
  const anchor = p.anchors[anchorIdx];

  // If anchor has stored points, use them; otherwise calculate closest edges
  let sx1, sy1, sx2, sy2, gap;

  if (anchor.sourcePoint && anchor.targetPoint) {
    // Use stored anchor points
    const sourcePts = getAnchorPoints(p.x, p.y, pw, ph);
    const targetPts = getAnchorPoints(target.x, target.y, tw, th);

    const pt1 = sourcePts[anchor.sourcePoint];
    const pt2 = targetPts[anchor.targetPoint];

    if (pt1 && pt2) {
      sx1 = PAD + S(pt1.x);
      sy1 = PAD + S(pt1.y);
      sx2 = PAD + S(pt2.x);
      sy2 = PAD + S(pt2.y);

      // Calculate distance between specific points
      const dx = pt2.x - pt1.x;
      const dy = pt2.y - pt1.y;
      gap = Math.sqrt(dx*dx + dy*dy);
    } else {
      // Fallback to edge calculation if points not found
      gap = edgeGap(p.x, p.y, pw, ph, target.x, target.y, tw, th);
      const pts = closestEdgePoints(p.x, p.y, pw, ph, target.x, target.y, tw, th);
      sx1 = PAD + S(pts.x1);
      sy1 = PAD + S(pts.y1);
      sx2 = PAD + S(pts.x2);
      sy2 = PAD + S(pts.y2);
    }
  } else {
    // Legacy anchors: use edge-to-edge distance
    gap = edgeGap(p.x, p.y, pw, ph, target.x, target.y, tw, th);
    const pts = closestEdgePoints(p.x, p.y, pw, ph, target.x, target.y, tw, th);
    sx1 = PAD + S(pts.x1);
    sy1 = PAD + S(pts.y1);
    sx2 = PAD + S(pts.x2);
    sy2 = PAD + S(pts.y2);
  }

  // Use theme colors for links
  const linkColor = isSelected ? '#cc66ff' : '#9966cc';
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary').trim() || '#1a1a24';
  const lineWidth = isSelected ? 3 : 2;

  let c = `<g class="anchor-link" data-furniture-idx="${furnitureIdx}" data-target-idx="${targetIdx}" data-anchor-idx="${anchorIdx}" style="cursor:pointer">`;

  c += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="${linkColor}" stroke-width="${lineWidth}" stroke-dasharray="6 4"/>`;

  // Larger, more visible endpoint markers with labels - make clickable for editing
  const endpointR = isSelected ? 7 : 5;
  const endpointStroke = isSelected ? 2.5 : 1.5;
  c += `<circle class="anchor-endpoint" data-furniture-idx="${furnitureIdx}" data-anchor-idx="${anchorIdx}" data-endpoint="source" cx="${sx1}" cy="${sy1}" r="${endpointR}" fill="${linkColor}" stroke="#ffffff" stroke-width="${endpointStroke}" style="cursor:pointer"/>`;
  c += `<circle class="anchor-endpoint" data-furniture-idx="${furnitureIdx}" data-anchor-idx="${anchorIdx}" data-endpoint="target" cx="${sx2}" cy="${sy2}" r="${endpointR}" fill="${linkColor}" stroke="#ffffff" stroke-width="${endpointStroke}" style="cursor:pointer"/>`;

  // Add "S" and "T" labels for Source and Target
  c += `<text x="${sx1}" y="${sy1 - 12}" font-family="JetBrains Mono" font-size="9" fill="${linkColor}" text-anchor="middle" font-weight="bold" stroke="#00000088" stroke-width="2" paint-order="stroke" pointer-events="none">S</text>`;
  c += `<text x="${sx2}" y="${sy2 - 12}" font-family="JetBrains Mono" font-size="9" fill="${linkColor}" text-anchor="middle" font-weight="bold" stroke="#00000088" stroke-width="2" paint-order="stroke" pointer-events="none">T</text>`;

  const mx = (sx1+sx2)/2, my = (sy1+sy2)/2;
  const label = formatDist(gap);
  const lockIcon = anchor.locked ? ' 🔒' : '';
  const lw = (label.length + lockIcon.length) * 7 + 10;
  c += `<rect x="${mx-lw/2}" y="${my-9}" width="${lw}" height="18" fill="${bgColor}" stroke="${linkColor}" stroke-width="${isSelected ? 2 : 1.5}" rx="4"/>`;
  c += `<text x="${mx}" y="${my+1}" font-family="JetBrains Mono" font-size="9" font-weight="600" fill="${linkColor}" text-anchor="middle" dominant-baseline="central">${label}${lockIcon}</text>`;

  c += `</g>`;
  return c;
}

function renderFixtureAnchor(p, d, pw, ph, fixtureTarget, furnitureIdx, anchorIdx, isSelected) {
  const anchor = p.anchors[anchorIdx];

  // If anchor has stored points, use them; otherwise calculate closest edges
  let sx1, sy1, sx2, sy2, gap;

  if (anchor.sourcePoint && anchor.targetPoint) {
    // Use stored anchor points
    const sourcePts = getAnchorPoints(p.x, p.y, pw, ph);
    const targetPts = getAnchorPoints(fixtureTarget.x, fixtureTarget.y, fixtureTarget.w, fixtureTarget.h);

    const pt1 = sourcePts[anchor.sourcePoint];
    const pt2 = targetPts[anchor.targetPoint];

    if (pt1 && pt2) {
      sx1 = PAD + S(pt1.x);
      sy1 = PAD + S(pt1.y);
      sx2 = PAD + S(pt2.x);
      sy2 = PAD + S(pt2.y);

      // Calculate distance between specific points
      const dx = pt2.x - pt1.x;
      const dy = pt2.y - pt1.y;
      gap = Math.sqrt(dx*dx + dy*dy);
    } else {
      // Fallback
      gap = edgeGap(p.x, p.y, pw, ph, fixtureTarget.x, fixtureTarget.y, fixtureTarget.w, fixtureTarget.h);
      const pts = closestEdgePoints(p.x, p.y, pw, ph, fixtureTarget.x, fixtureTarget.y, fixtureTarget.w, fixtureTarget.h);
      sx1 = PAD + S(pts.x1);
      sy1 = PAD + S(pts.y1);
      sx2 = PAD + S(pts.x2);
      sy2 = PAD + S(pts.y2);
    }
  } else {
    // Legacy anchors: use edge-to-edge calculation
    gap = edgeGap(p.x, p.y, pw, ph, fixtureTarget.x, fixtureTarget.y, fixtureTarget.w, fixtureTarget.h);
    const pts = closestEdgePoints(p.x, p.y, pw, ph, fixtureTarget.x, fixtureTarget.y, fixtureTarget.w, fixtureTarget.h);
    sx1 = PAD + S(pts.x1);
    sy1 = PAD + S(pts.y1);
    sx2 = PAD + S(pts.x2);
    sy2 = PAD + S(pts.y2);
  }

  const linkColor = isSelected ? '#cc66ff' : '#9966cc';
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary').trim() || '#1a1a24';
  const lineWidth = isSelected ? 3 : 2;

  let c = `<g class="anchor-link" data-furniture-idx="${furnitureIdx}" data-anchor-idx="${anchorIdx}" data-type="fixture" data-fixture-id="${fixtureTarget.id}" style="cursor:pointer">`;

  c += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="${linkColor}" stroke-width="${lineWidth}" stroke-dasharray="6 4"/>`;

  // Larger, more visible endpoint markers with labels - make clickable for editing
  const endpointR = isSelected ? 7 : 5;
  const endpointStroke = isSelected ? 2.5 : 1.5;
  c += `<circle class="anchor-endpoint" data-furniture-idx="${furnitureIdx}" data-anchor-idx="${anchorIdx}" data-endpoint="source" cx="${sx1}" cy="${sy1}" r="${endpointR}" fill="${linkColor}" stroke="#ffffff" stroke-width="${endpointStroke}" style="cursor:pointer"/>`;
  c += `<circle class="anchor-endpoint" data-furniture-idx="${furnitureIdx}" data-anchor-idx="${anchorIdx}" data-endpoint="target" cx="${sx2}" cy="${sy2}" r="${endpointR}" fill="${linkColor}" stroke="#ffffff" stroke-width="${endpointStroke}" style="cursor:pointer"/>`;

  // Add "S" and "T" labels for Source and Target
  c += `<text x="${sx1}" y="${sy1 - 12}" font-family="JetBrains Mono" font-size="9" fill="${linkColor}" text-anchor="middle" font-weight="bold" stroke="#00000088" stroke-width="2" paint-order="stroke" pointer-events="none">S</text>`;
  c += `<text x="${sx2}" y="${sy2 - 12}" font-family="JetBrains Mono" font-size="9" fill="${linkColor}" text-anchor="middle" font-weight="bold" stroke="#00000088" stroke-width="2" paint-order="stroke" pointer-events="none">T</text>`;

  const mx = (sx1+sx2)/2, my = (sy1+sy2)/2;
  const label = formatDist(gap);
  const lockIcon = anchor.locked ? ' 🔒' : '';
  const lw = (label.length + lockIcon.length) * 7 + 10;
  c += `<rect x="${mx-lw/2}" y="${my-9}" width="${lw}" height="18" fill="${bgColor}" stroke="${linkColor}" stroke-width="${isSelected ? 2 : 1.5}" rx="4"/>`;
  c += `<text x="${mx}" y="${my+1}" font-family="JetBrains Mono" font-size="9" font-weight="600" fill="${linkColor}" text-anchor="middle" dominant-baseline="central">${label}${lockIcon}</text>`;

  c += `</g>`;
  return c;
}

function renderWallAnchor(p, d, pw, ph, anchor, furnitureIdx, anchorIdx, isSelected) {
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

  const linkColor = isSelected ? '#cc66ff' : '#9966cc';
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary').trim() || '#1a1a24';
  const lineWidth = isSelected ? 3 : 2;

  c += `<g class="anchor-link" data-furniture-idx="${furnitureIdx}" data-anchor-idx="${anchorIdx}" data-type="wall" style="cursor:pointer">`;

  c += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="${linkColor}" stroke-width="${lineWidth}" stroke-dasharray="6 4"/>`;
  c += `<circle cx="${sx1}" cy="${sy1}" r="${isSelected ? 6 : 4}" fill="${linkColor}" stroke="${bgColor}" stroke-width="${isSelected ? 2 : 1}"/>`;
  c += `<circle cx="${sx2}" cy="${sy2}" r="${isSelected ? 6 : 4}" fill="${linkColor}" stroke="${bgColor}" stroke-width="${isSelected ? 2 : 1}"/>`;

  const mx = (sx1+sx2)/2, my = (sy1+sy2)/2;
  const label = formatDist(dist);
  const lw = label.length * 7 + 10;
  c += `<rect x="${mx-lw/2}" y="${my-9}" width="${lw}" height="18" fill="${bgColor}" stroke="${linkColor}" stroke-width="${isSelected ? 2 : 1.5}" rx="4"/>`;
  c += `<text x="${mx}" y="${my+1}" font-family="JetBrains Mono" font-size="9" font-weight="600" fill="${linkColor}" text-anchor="middle" dominant-baseline="central">${label}</text>`;

  c += `</g>`;
  return c;
}

/**
 * Attach event handlers to anchor links
 */
function attachAnchorEvents() {
  // Handle anchor endpoint clicks for editing
  document.querySelectorAll('.anchor-endpoint').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const furnitureIdx = parseInt(el.dataset.furnitureIdx);
      const anchorIdx = parseInt(el.dataset.anchorIdx);
      const endpoint = el.dataset.endpoint; // 'source' or 'target'

      // Enter edit mode
      state.editingAnchor = { furnitureIdx, anchorIdx, editingPoint: endpoint };

      const piece = state.placedFurniture[furnitureIdx];
      const anchor = piece?.anchors?.[anchorIdx];

      if (!anchor) return;

      // Set up edit state based on which endpoint was clicked
      if (endpoint === 'source') {
        state.anchorSource = furnitureIdx;
        state.anchorSourcePoint = anchor.sourcePoint || null;

        // Find target
        if (anchor.type === 'furniture') {
          const targetPiece = state.placedFurniture.find(p => p.id === anchor.id);
          if (targetPiece) {
            state.anchorTarget = state.placedFurniture.indexOf(targetPiece);
            state.anchorTargetPoint = anchor.targetPoint || null;
          }
        }
      } else {
        // Editing target point
        if (anchor.type === 'furniture') {
          const targetPiece = state.placedFurniture.find(p => p.id === anchor.id);
          if (targetPiece) {
            state.anchorSource = furnitureIdx;
            state.anchorSourcePoint = anchor.sourcePoint || null;
            state.anchorTarget = state.placedFurniture.indexOf(targetPiece);
            state.anchorTargetPoint = anchor.targetPoint || null;
          }
        }
      }

      renderAnchors();
      updateAnchorEditToolbar();
    });
  });

  // Handle anchor point clicks during anchor creation
  document.querySelectorAll('.anchor-point-clickable').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const objectType = el.dataset.anchorObjectType;
      const pointName = el.dataset.pointName;

      if (objectType === 'source') {
        // Select/toggle source point
        state.anchorSourcePoint = state.anchorSourcePoint === pointName ? null : pointName;
        renderAnchors();
        updateAnchorSaveToolbar();
      } else if (objectType === 'target') {
        // Select/toggle target point
        state.anchorTargetPoint = state.anchorTargetPoint === pointName ? null : pointName;
        renderAnchors();
        updateAnchorSaveToolbar();
      }
    });

    // Hover effects for anchor points
    el.addEventListener('mouseenter', () => {
      el.setAttribute('r', parseFloat(el.getAttribute('r')) + 2);
    });

    el.addEventListener('mouseleave', () => {
      el.setAttribute('r', parseFloat(el.getAttribute('r')) - 2);
    });
  });

  document.querySelectorAll('.anchor-link').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const furnitureIdx = parseInt(el.dataset.furnitureIdx);
      const anchorIdx = parseInt(el.dataset.anchorIdx);
      const targetIdx = el.dataset.targetIdx ? parseInt(el.dataset.targetIdx) : null;

      state.selectedMeasurement = {
        type: 'anchor',
        furnitureIdx,
        anchorIdx,
        targetIdx
      };
      state.selectedDivider = null;
      renderAnchors();

      // Highlight source and target
      if (window._renderFurniture) window._renderFurniture();
    });

    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      const furnitureIdx = parseInt(el.dataset.furnitureIdx);
      const anchorIdx = parseInt(el.dataset.anchorIdx);

      if (confirm('Delete this anchor?')) {
        pushHistory();
        const piece = state.placedFurniture[furnitureIdx];
        if (piece && piece.anchors) {
          piece.anchors.splice(anchorIdx, 1);
          if (piece.anchors.length === 0) {
            delete piece.anchors;
          }
        }
        state.selectedMeasurement = null;
        saveToCache();
        renderAnchors();
      }
    });

    el.addEventListener('mouseenter', e => {
      const furnitureIdx = parseInt(el.dataset.furnitureIdx);
      const targetIdx = el.dataset.targetIdx ? parseInt(el.dataset.targetIdx) : null;
      const fixtureId = el.dataset.fixtureId;

      // Highlight source furniture
      const sourceFurniture = document.querySelector(`.furniture-piece[data-idx="${furnitureIdx}"]`);
      if (sourceFurniture) {
        sourceFurniture.style.filter = 'brightness(1.3) drop-shadow(0 0 8px #9966cc)';
      }

      // Highlight target furniture if exists
      if (targetIdx !== null) {
        const targetFurniture = document.querySelector(`.furniture-piece[data-idx="${targetIdx}"]`);
        if (targetFurniture) {
          targetFurniture.style.filter = 'brightness(1.3) drop-shadow(0 0 8px #9966cc)';
        }
      }

      // Highlight target fixture if exists
      if (fixtureId) {
        const fixtureGroup = document.querySelector(`#fixtureGroup [data-id="${fixtureId}"]`);
        if (fixtureGroup) {
          fixtureGroup.style.filter = 'brightness(1.3) drop-shadow(0 0 8px #9966cc)';
        }
      }
    });

    el.addEventListener('mouseleave', e => {
      const furnitureIdx = parseInt(el.dataset.furnitureIdx);
      const targetIdx = el.dataset.targetIdx ? parseInt(el.dataset.targetIdx) : null;
      const fixtureId = el.dataset.fixtureId;

      // Remove highlight from source
      const sourceFurniture = document.querySelector(`.furniture-piece[data-idx="${furnitureIdx}"]`);
      if (sourceFurniture) {
        sourceFurniture.style.filter = '';
      }

      // Remove highlight from target
      if (targetIdx !== null) {
        const targetFurniture = document.querySelector(`.furniture-piece[data-idx="${targetIdx}"]`);
        if (targetFurniture) {
          targetFurniture.style.filter = '';
        }
      }

      // Remove highlight from fixture
      if (fixtureId) {
        const fixtureGroup = document.querySelector(`#fixtureGroup [data-id="${fixtureId}"]`);
        if (fixtureGroup) {
          fixtureGroup.style.filter = '';
        }
      }
    });
  });
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
  state.anchorSourcePoint = null;
  state.anchorTarget = null;
  state.anchorTargetPoint = null;
  state.editingAnchor = null;
  document.getElementById('btnAnchor')?.classList.toggle('active', state.anchorMode);
  updateAnchorSaveToolbar();
  updateAnchorEditToolbar();
  renderAnchors();
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

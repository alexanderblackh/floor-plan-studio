/**
 * measurement.js — Measurement tool, anchors, and "Show All" mode
 *
 * Measure mode: click two points to measure distance between them
 * Show All: display distances from every placed piece to nearest walls
 * Anchors: link two pieces to show persistent distance between them
 */

import { S, PAD, state, getFurnitureDef } from './data.js';
import { getRoomBounds, findRoomAt } from './collision.js';
import { formatDist } from './units.js';

// ===== MEASUREMENT RENDERING =====
export function renderMeasurement() {
  const svg = document.getElementById('svgPlan');
  if (!svg) return;
  const g = svg.querySelector('#measurementGroup');
  if (!g) return;

  let c = '';

  // Show All mode: render distances for every placed piece
  if (state.showAllMeasurements) {
    c += renderAllMeasurements();
  }

  // Active measurement tool
  if (state.measureStart && state.measureEnd) {
    c += renderMeasureLine(state.measureStart, state.measureEnd);
  } else if (state.measureStart) {
    const sx1 = PAD + S(state.measureStart.x);
    const sy1 = PAD + S(state.measureStart.y);
    c += `<circle cx="${sx1}" cy="${sy1}" r="5" fill="#c5975b" stroke="#fff" stroke-width="2"/>`;
    if (state.measureStart.edge) {
      c += `<text x="${sx1}" y="${sy1 - 10}" font-family="JetBrains Mono" font-size="8" fill="#c5975b" text-anchor="middle">${state.measureStart.edge[0].toUpperCase()}</text>`;
    }
  }

  g.innerHTML = c;
}

// Expose globally for furniture.js callback
window._renderMeasurement = renderMeasurement;

function renderMeasureLine(start, end) {
  let x1 = start.x, y1 = start.y, x2 = end.x, y2 = end.y;

  // Auto-lock to H or V if close
  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  if (dx < 3) x2 = x1;
  else if (dy < 3) y2 = y1;

  const sx1 = PAD + S(x1), sy1 = PAD + S(y1);
  const sx2 = PAD + S(x2), sy2 = PAD + S(y2);
  const actualDx = x2 - x1, actualDy = y2 - y1;
  const dist = Math.sqrt(actualDx * actualDx + actualDy * actualDy);
  const midX = (sx1 + sx2) / 2, midY = (sy1 + sy2) / 2;

  let c = '';

  // Line
  c += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="#c5975b" stroke-width="2" stroke-dasharray="5 3"/>`;

  // Endpoints
  c += `<circle cx="${sx1}" cy="${sy1}" r="5" fill="#c5975b" stroke="#fff" stroke-width="2"/>`;
  if (start.edge) {
    c += `<text x="${sx1}" y="${sy1 - 10}" font-family="JetBrains Mono" font-size="8" fill="#c5975b" text-anchor="middle">${start.edge[0].toUpperCase()}</text>`;
  }
  c += `<circle cx="${sx2}" cy="${sy2}" r="5" fill="#c5975b" stroke="#fff" stroke-width="2"/>`;
  if (end.edge) {
    c += `<text x="${sx2}" y="${sy2 - 10}" font-family="JetBrains Mono" font-size="8" fill="#c5975b" text-anchor="middle">${end.edge[0].toUpperCase()}</text>`;
  }

  // Label
  const label = formatDist(dist);
  const labelWidth = label.length * 7 + 10;
  c += `<rect x="${midX - labelWidth/2}" y="${midY - 12}" width="${labelWidth}" height="22" fill="#1a1a24ee" stroke="#c5975b" stroke-width="1.5" rx="4"/>`;
  c += `<text x="${midX}" y="${midY + 3}" font-family="JetBrains Mono" font-size="11" font-weight="bold" fill="#c5975b" text-anchor="middle" dominant-baseline="central">${label}</text>`;

  return c;
}

// ===== SHOW ALL MEASUREMENTS =====
function renderAllMeasurements() {
  let c = '';

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

    const fontSize = 6;
    const color = '#c5975b88';

    // Left distance
    if (distLeft > 3) {
      const ly = PAD + S(cy);
      const lx1 = PAD + S(bounds.minX);
      const lx2 = PAD + S(p.x);
      c += `<line x1="${lx1}" y1="${ly}" x2="${lx2}" y2="${ly}" stroke="${color}" stroke-width="0.5" stroke-dasharray="2 2"/>`;
      c += `<text x="${(lx1+lx2)/2}" y="${ly-3}" font-family="JetBrains Mono" font-size="${fontSize}" fill="${color}" text-anchor="middle">${formatDist(distLeft)}</text>`;
    }

    // Right distance
    if (distRight > 3) {
      const ry = PAD + S(cy);
      const rx1 = PAD + S(p.x + pw);
      const rx2 = PAD + S(bounds.maxX);
      c += `<line x1="${rx1}" y1="${ry}" x2="${rx2}" y2="${ry}" stroke="${color}" stroke-width="0.5" stroke-dasharray="2 2"/>`;
      c += `<text x="${(rx1+rx2)/2}" y="${ry-3}" font-family="JetBrains Mono" font-size="${fontSize}" fill="${color}" text-anchor="middle">${formatDist(distRight)}</text>`;
    }

    // Top distance
    if (distTop > 3) {
      const tx = PAD + S(cx);
      const ty1 = PAD + S(bounds.minY);
      const ty2 = PAD + S(p.y);
      c += `<line x1="${tx}" y1="${ty1}" x2="${tx}" y2="${ty2}" stroke="${color}" stroke-width="0.5" stroke-dasharray="2 2"/>`;
      c += `<text x="${tx+3}" y="${(ty1+ty2)/2}" font-family="JetBrains Mono" font-size="${fontSize}" fill="${color}" text-anchor="start">${formatDist(distTop)}</text>`;
    }

    // Bottom distance
    if (distBottom > 3) {
      const bx = PAD + S(cx);
      const by1 = PAD + S(p.y + ph);
      const by2 = PAD + S(bounds.maxY);
      c += `<line x1="${bx}" y1="${by1}" x2="${bx}" y2="${by2}" stroke="${color}" stroke-width="0.5" stroke-dasharray="2 2"/>`;
      c += `<text x="${bx+3}" y="${(by1+by2)/2}" font-family="JetBrains Mono" font-size="${fontSize}" fill="${color}" text-anchor="start">${formatDist(distBottom)}</text>`;
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

        c += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="#9966cc66" stroke-width="1" stroke-dasharray="4 3"/>`;
        c += `<circle cx="${sx1}" cy="${sy1}" r="3" fill="#9966cc88"/>`;
        c += `<circle cx="${sx2}" cy="${sy2}" r="3" fill="#9966cc88"/>`;

        const mx = (sx1+sx2)/2, my = (sy1+sy2)/2;
        const label = formatDist(gap);
        const lw = label.length * 6 + 8;
        c += `<rect x="${mx-lw/2}" y="${my-7}" width="${lw}" height="14" fill="#1a1a24cc" rx="3"/>`;
        c += `<text x="${mx}" y="${my+1}" font-family="JetBrains Mono" font-size="7" fill="#9966cc" text-anchor="middle" dominant-baseline="central">${label}</text>`;
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

  c += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="#9966cc66" stroke-width="1" stroke-dasharray="4 3"/>`;
  c += `<circle cx="${sx1}" cy="${sy1}" r="3" fill="#9966cc88"/>`;
  c += `<circle cx="${sx2}" cy="${sy2}" r="3" fill="#9966cc88"/>`;

  const mx = (sx1+sx2)/2, my = (sy1+sy2)/2;
  const label = formatDist(dist);
  const lw = label.length * 6 + 8;
  c += `<rect x="${mx-lw/2}" y="${my-7}" width="${lw}" height="14" fill="#1a1a24cc" rx="3"/>`;
  c += `<text x="${mx}" y="${my+1}" font-family="JetBrains Mono" font-size="7" fill="#9966cc" text-anchor="middle" dominant-baseline="central">${label}</text>`;

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

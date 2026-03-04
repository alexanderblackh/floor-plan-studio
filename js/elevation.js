/**
 * elevation.js — Side elevation (head-on wall view)
 *
 * Renders a 2D side-view of one wall at a time, showing:
 * - The wall outline with windows/doors
 * - Furniture stacked at their elevations (height from floor)
 * - Height dimension labels
 *
 * The elevation view projects furniture that is "near" the selected wall
 * (within a configurable depth threshold) onto the wall plane.
 */

import { S, PPI, state, getFurnitureDef, getElevationWalls } from './data.js';

const ELEV_PPI = 1.5; // Slightly smaller scale for elevation
const ES = (i) => i * ELEV_PPI;
const ELEV_PAD = 20;
const DEPTH_THRESHOLD = 36; // How close to wall (inches) to show in elevation

/**
 * Get furniture pieces near a wall for elevation projection
 */
function getFurnitureNearWall(wallDef) {
  const [wx1, wy1] = wallDef.from;
  const [wx2, wy2] = wallDef.to;
  const results = [];

  const isHorizontal = Math.abs(wy2 - wy1) < 1;
  const isVertical = Math.abs(wx2 - wx1) < 1;

  for (const p of state.placedFurniture) {
    if (p.x < 0 || p.y < 0) continue;
    const d = getFurnitureDef(p.id);
    if (!d) continue;

    const pw = p.rotated ? d.h : d.w;
    const ph = p.rotated ? d.w : d.h;

    if (isHorizontal) {
      // Wall runs left-right (e.g., front/back walls)
      const wallY = wy1;
      const nearTop = Math.abs(p.y - wallY) < DEPTH_THRESHOLD;
      const nearBottom = Math.abs((p.y + ph) - wallY) < DEPTH_THRESHOLD;
      if (nearTop || nearBottom) {
        // Project onto wall: X position stays, Y becomes depth
        const wallMinX = Math.min(wx1, wx2);
        const wallMaxX = Math.max(wx1, wx2);
        if (p.x + pw > wallMinX && p.x < wallMaxX) {
          results.push({
            piece: p, def: d,
            projX: p.x - wallMinX, // position along wall
            projW: pw,
            height: d.height || 24,
            elevation: p.elevation || 0,
            depth: isHorizontal ? Math.min(Math.abs(p.y - wallY), Math.abs(p.y + ph - wallY)) : 0
          });
        }
      }
    } else if (isVertical) {
      // Wall runs top-bottom (e.g., left/right walls)
      const wallX = wx1;
      const nearLeft = Math.abs(p.x - wallX) < DEPTH_THRESHOLD;
      const nearRight = Math.abs((p.x + pw) - wallX) < DEPTH_THRESHOLD;
      if (nearLeft || nearRight) {
        const wallMinY = Math.min(wy1, wy2);
        const wallMaxY = Math.max(wy1, wy2);
        if (p.y + ph > wallMinY && p.y < wallMaxY) {
          results.push({
            piece: p, def: d,
            projX: p.y - wallMinY, // position along wall
            projW: ph, // depth becomes width in elevation
            height: d.height || 24,
            elevation: p.elevation || 0,
            depth: Math.min(Math.abs(p.x - wallX), Math.abs(p.x + pw - wallX))
          });
        }
      }
    }
  }

  // Sort by depth (closest to wall first)
  results.sort((a, b) => a.depth - b.depth);
  return results;
}

/**
 * Render the elevation view SVG
 */
export function renderElevation() {
  const container = document.getElementById('elevationPanel');
  if (!container) return;

  if (!state.showElevation || !state.elevationWall) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';

  const wallDefs = getElevationWalls();
  const wallDef = wallDefs.find(w => w.id === state.elevationWall);
  if (!wallDef) return;

  const [wx1, wy1] = wallDef.from;
  const [wx2, wy2] = wallDef.to;
  const wallLength = Math.sqrt((wx2-wx1)**2 + (wy2-wy1)**2);
  const wallHeight = wallDef.wallHeight || 96; // Default 8 feet

  const svgW = ES(wallLength) + ELEV_PAD * 2;
  const svgH = ES(wallHeight) + ELEV_PAD * 2 + 30; // extra for labels

  let svg = document.getElementById('svgElevation');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'svgElevation';
    container.querySelector('.elevation-content').appendChild(svg);
  }

  svg.setAttribute('width', svgW);
  svg.setAttribute('height', svgH);
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);

  const floorY = ELEV_PAD + ES(wallHeight); // Floor line Y coordinate
  let c = '';

  // Background
  c += `<rect x="0" y="0" width="${svgW}" height="${svgH}" fill="#0f0f14"/>`;

  // Wall outline
  c += `<rect x="${ELEV_PAD}" y="${ELEV_PAD}" width="${ES(wallLength)}" height="${ES(wallHeight)}" fill="#1a1a2211" stroke="#444" stroke-width="2"/>`;

  // Floor line
  c += `<line x1="${ELEV_PAD}" y1="${floorY}" x2="${ELEV_PAD + ES(wallLength)}" y2="${floorY}" stroke="#555" stroke-width="2"/>`;

  // Ceiling line
  c += `<line x1="${ELEV_PAD}" y1="${ELEV_PAD}" x2="${ELEV_PAD + ES(wallLength)}" y2="${ELEV_PAD}" stroke="#444" stroke-width="1" stroke-dasharray="4 2"/>`;

  // Height scale on left side
  for (let h = 0; h <= wallHeight; h += 12) {
    const y = floorY - ES(h);
    c += `<line x1="${ELEV_PAD - 4}" y1="${y}" x2="${ELEV_PAD}" y2="${y}" stroke="#444" stroke-width="1"/>`;
    c += `<text x="${ELEV_PAD - 6}" y="${y + 3}" font-family="JetBrains Mono" font-size="7" fill="#555" text-anchor="end">${h}"</text>`;
  }

  // Wall name
  c += `<text x="${ELEV_PAD + ES(wallLength)/2}" y="${svgH - 5}" font-family="JetBrains Mono" font-size="9" fill="#666" text-anchor="middle">${wallDef.name}</text>`;

  // TODO: render windows/doors on the wall in elevation view
  // (would need to cross-reference wall data with the elevation wall definition)

  // Render furniture near this wall
  const furniture = getFurnitureNearWall(wallDef);
  for (const item of furniture) {
    const x = ELEV_PAD + ES(item.projX);
    const w = ES(item.projW);
    const h = ES(item.height);
    const y = floorY - ES(item.elevation) - h;

    // Opacity based on depth (closer = more opaque)
    const opacity = Math.max(0.3, 1 - item.depth / DEPTH_THRESHOLD * 0.7);

    c += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${item.def.color}" stroke="${item.def.stroke}" stroke-width="1" rx="2" opacity="${opacity}"/>`;
    c += `<text x="${x + w/2}" y="${y + h/2}" font-family="JetBrains Mono" font-size="8" fill="#ffffffcc" text-anchor="middle" dominant-baseline="central" pointer-events="none">${item.def.label}</text>`;

    // Height dimension
    if (item.elevation > 0) {
      c += `<text x="${x + w + 3}" y="${floorY - ES(item.elevation/2)}" font-family="JetBrains Mono" font-size="6" fill="#c5975b88" text-anchor="start">↑${item.elevation}"</text>`;
    }
  }

  svg.innerHTML = c;
}

/**
 * Toggle elevation panel visibility
 */
export function toggleElevation() {
  state.showElevation = !state.showElevation;
  document.getElementById('btnElevation')?.classList.toggle('active', state.showElevation);

  if (state.showElevation && !state.elevationWall) {
    // Default to first wall
    const walls = getElevationWalls();
    if (walls.length > 0) state.elevationWall = walls[0].id;
  }

  renderElevation();
}

/**
 * Select which wall to view in elevation
 */
export function selectElevationWall(wallId) {
  state.elevationWall = wallId;
  renderElevation();

  // Update wall selector
  const sel = document.getElementById('elevWallSelect');
  if (sel) sel.value = wallId;
}

/**
 * Build the elevation wall selector dropdown
 */
export function buildElevationSelector() {
  const sel = document.getElementById('elevWallSelect');
  if (!sel) return;

  sel.innerHTML = '';
  for (const wall of getElevationWalls()) {
    const opt = document.createElement('option');
    opt.value = wall.id;
    opt.textContent = wall.name;
    sel.appendChild(opt);
  }

  sel.addEventListener('change', () => selectElevationWall(sel.value));
}

// Expose for inline handlers
window.toggleElevation = toggleElevation;
window.selectElevationWall = selectElevationWall;

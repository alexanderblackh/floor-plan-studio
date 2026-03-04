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

import { state, getFurnitureDef, getElevationWalls, getWalls, getFixtures, saveToCache } from './data.js';
import { formatDist } from './units.js';
import { escapeXml } from './render.js';
import { pushHistory } from './history.js';

const ELEV_PPI = 3.5; // Scale for elevation view (larger for better visibility)
const ES = (i) => i * ELEV_PPI;
const ELEV_PAD = 40;
const DEPTH_THRESHOLD = 36; // How close to wall (inches) to show in elevation

/**
 * Get fixtures near a wall for elevation projection
 */
function getFixturesNearWall(wallDef) {
  const [wx1, wy1] = wallDef.from;
  const [wx2, wy2] = wallDef.to;
  const results = [];

  const isHorizontal = Math.abs(wy2 - wy1) < 1;
  const isVertical = Math.abs(wx2 - wx1) < 1;

  for (const fixture of getFixtures()) {
    const fx = fixture.x;
    const fy = fixture.y;
    const fw = fixture.w;
    const fh = fixture.h;

    if (isHorizontal) {
      // Wall runs left-right (e.g., front/back walls)
      const wallY = wy1;
      const nearTop = Math.abs(fy - wallY) < DEPTH_THRESHOLD;
      const nearBottom = Math.abs((fy + fh) - wallY) < DEPTH_THRESHOLD;
      if (nearTop || nearBottom) {
        // Project onto wall: X position stays, Y becomes depth
        const wallMinX = Math.min(wx1, wx2);
        const wallMaxX = Math.max(wx1, wx2);
        if (fx + fw > wallMinX && fx < wallMaxX) {
          results.push({
            fixture: fixture,
            projX: fx - wallMinX, // position along wall
            projW: fw,
            height: fixture.surfaceHeight || 36,
            depth: Math.min(Math.abs(fy - wallY), Math.abs(fy + fh - wallY))
          });
        }
      }
    } else if (isVertical) {
      // Wall runs top-bottom (e.g., left/right walls)
      const wallX = wx1;
      const nearLeft = Math.abs(fx - wallX) < DEPTH_THRESHOLD;
      const nearRight = Math.abs((fx + fw) - wallX) < DEPTH_THRESHOLD;
      if (nearLeft || nearRight) {
        const wallMinY = Math.min(wy1, wy2);
        const wallMaxY = Math.max(wy1, wy2);
        if (fy + fh > wallMinY && fy < wallMaxY) {
          results.push({
            fixture: fixture,
            projX: fy - wallMinY, // position along wall
            projW: fh, // depth becomes width in elevation
            height: fixture.surfaceHeight || 36,
            depth: Math.min(Math.abs(fx - wallX), Math.abs(fx + fw - wallX))
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
 * Find wall data segments that match an elevation wall definition
 * and render windows/doors in elevation view
 */
function renderWallOpenings(wallDef, wallLength, wallHeight, floorY) {
  let c = '';
  const [ewx1, ewy1] = wallDef.from;
  const [ewx2, ewy2] = wallDef.to;
  const isHoriz = Math.abs(ewy2 - ewy1) < 1;
  const wallMin = isHoriz ? Math.min(ewx1, ewx2) : Math.min(ewy1, ewy2);

  // Standard window/door heights in elevation
  const WINDOW_SILL = 30;    // 30" from floor
  const WINDOW_HEIGHT = 48;  // 48" tall
  const DOOR_HEIGHT = 80;    // 80" tall (standard door)

  for (const wall of getWalls()) {
    const [wx1, wy1] = wall.from;
    const [wx2, wy2] = wall.to;

    // Check if this wall segment is part of the elevation wall
    let match = false;
    if (isHoriz) {
      match = Math.abs(wy1 - ewy1) < 1 && Math.abs(wy2 - ewy1) < 1;
    } else {
      match = Math.abs(wx1 - ewx1) < 1 && Math.abs(wx2 - ewx1) < 1;
    }
    if (!match) continue;

    // Render window
    if (wall.window) {
      const [winFrom, winTo] = isHoriz
        ? [wall.window.from[0] - wallMin, wall.window.to[0] - wallMin]
        : [wall.window.from[1] - wallMin, wall.window.to[1] - wallMin];
      const winX = ELEV_PAD + ES(Math.min(winFrom, winTo));
      const winW = ES(Math.abs(winTo - winFrom));

      // Use custom sillHeight and height if specified, otherwise defaults
      const sillHeight = wall.window.sillHeight || WINDOW_SILL;
      const windowHeight = wall.window.height || WINDOW_HEIGHT;
      const winY = floorY - ES(sillHeight + windowHeight);
      const winH = ES(windowHeight);

      c += `<rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" fill="#4a9eff11" stroke="#4a9eff" stroke-width="1.5" rx="1"/>`;
      // Window cross
      c += `<line x1="${winX}" y1="${winY + winH/2}" x2="${winX + winW}" y2="${winY + winH/2}" stroke="#4a9eff55" stroke-width="0.5"/>`;
      c += `<line x1="${winX + winW/2}" y1="${winY}" x2="${winX + winW/2}" y2="${winY + winH}" stroke="#4a9eff55" stroke-width="0.5"/>`;

      // Window measurements
      const winWidth = Math.abs(winTo - winFrom);
      c += `<text x="${winX + winW/2}" y="${winY - 3}" font-family="JetBrains Mono" font-size="8" fill="#4a9eff" text-anchor="middle">${formatDist(winWidth)}</text>`;
      c += `<text x="${winX - 8}" y="${winY + winH/2}" font-family="JetBrains Mono" font-size="7" fill="#4a9eff88" text-anchor="end">H:${formatDist(windowHeight)}</text>`;
      c += `<text x="${winX - 8}" y="${floorY - ES(sillHeight) + 3}" font-family="JetBrains Mono" font-size="6" fill="#4a9eff66" text-anchor="end">sill:${formatDist(sillHeight)}</text>`;
    }

    // Render door
    if (wall.door) {
      const [doorFrom, doorTo] = isHoriz
        ? [wall.door.from[0] - wallMin, wall.door.to[0] - wallMin]
        : [wall.door.from[1] - wallMin, wall.door.to[1] - wallMin];
      const doorX = ELEV_PAD + ES(Math.min(doorFrom, doorTo));
      const doorW = ES(Math.abs(doorTo - doorFrom));
      const doorY = floorY - ES(DOOR_HEIGHT);
      const doorH = ES(DOOR_HEIGHT);

      c += `<rect x="${doorX}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#c5975b11" stroke="#c5975b" stroke-width="1.5" rx="1"/>`;
      // Door handle
      c += `<circle cx="${doorX + doorW - ES(4)}" cy="${floorY - ES(36)}" r="2" fill="#c5975b66"/>`;

      // Door measurements
      const doorWidth = Math.abs(doorTo - doorFrom);
      c += `<text x="${doorX + doorW/2}" y="${doorY - 3}" font-family="JetBrains Mono" font-size="8" fill="#c5975b" text-anchor="middle">${formatDist(doorWidth)}</text>`;
      c += `<text x="${doorX + doorW + 8}" y="${doorY + doorH/2}" font-family="JetBrains Mono" font-size="7" fill="#c5975b88" text-anchor="start">H:${formatDist(DOOR_HEIGHT)}</text>`;
    }
  }

  return c;
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
    c += `<text x="${ELEV_PAD - 6}" y="${y + 3}" font-family="JetBrains Mono" font-size="7" fill="#555" text-anchor="end">${formatDist(h)}</text>`;
  }

  // Wall name
  c += `<text x="${ELEV_PAD + ES(wallLength)/2}" y="${svgH - 5}" font-family="JetBrains Mono" font-size="9" fill="#666" text-anchor="middle">${escapeXml(wallDef.name)}</text>`;

  // Render windows and doors from wall data
  c += renderWallOpenings(wallDef, wallLength, wallHeight, floorY);

  // Render furniture near this wall
  const furniture = getFurnitureNearWall(wallDef);
  for (const item of furniture) {
    const x = ELEV_PAD + ES(item.projX);
    const w = ES(item.projW);
    const h = ES(item.height);
    const y = floorY - ES(item.elevation) - h;

    // Opacity based on depth (closer = more opaque)
    const opacity = Math.max(0.3, 1 - item.depth / DEPTH_THRESHOLD * 0.7);

    // Find the furniture index in placedFurniture
    const furnitureIdx = state.placedFurniture.indexOf(item.piece);

    // Make furniture interactive with data-idx
    c += `<g class="elev-furniture-piece" data-idx="${furnitureIdx}" style="cursor:pointer">`;
    c += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${item.def.color}" stroke="${item.def.stroke}" stroke-width="1" rx="2" opacity="${opacity}"/>`;
    c += `<text x="${x + w/2}" y="${y + h/2}" font-family="JetBrains Mono" font-size="8" fill="#ffffffcc" text-anchor="middle" dominant-baseline="central" pointer-events="none">${escapeXml(item.def.label)}</text>`;
    c += `</g>`;

    // Height dimension
    if (item.elevation > 0) {
      c += `<text x="${x + w + 3}" y="${floorY - ES(item.elevation/2)}" font-family="JetBrains Mono" font-size="6" fill="#c5975b88" text-anchor="start">↑${formatDist(item.elevation)}</text>`;
    }

    // Top of piece height label
    const topH = item.elevation + item.height;
    c += `<line x1="${x + w + 1}" y1="${y}" x2="${x + w + 8}" y2="${y}" stroke="#ffffff22" stroke-width="0.5"/>`;
    c += `<text x="${x + w + 10}" y="${y + 4}" font-family="JetBrains Mono" font-size="5" fill="#ffffff44" text-anchor="start">${formatDist(topH)}</text>`;
  }

  // Render fixtures near this wall
  const fixtures = getFixturesNearWall(wallDef);
  const allFixtures = getFixtures();
  for (const item of fixtures) {
    const x = ELEV_PAD + ES(item.projX);
    const w = ES(item.projW);
    const h = ES(item.height);
    const elevation = item.fixture.elevation || 0;
    const y = floorY - ES(elevation) - h; // Position from floor based on elevation

    // Opacity based on depth (closer = more opaque)
    const opacity = Math.max(0.3, 1 - item.depth / DEPTH_THRESHOLD * 0.7);

    // Find the fixture index in the fixtures array
    const fixtureIdx = allFixtures.indexOf(item.fixture);

    // Make fixture interactive with data-fixture-idx
    c += `<g class="elev-fixture-piece" data-fixture-idx="${fixtureIdx}" style="cursor:pointer">`;
    c += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${item.fixture.color}" stroke="${item.fixture.stroke}" stroke-width="1" rx="2" opacity="${opacity}"/>`;
    c += `<text x="${x + w/2}" y="${y + h/2}" font-family="JetBrains Mono" font-size="8" fill="#ffffffcc" text-anchor="middle" dominant-baseline="central" pointer-events="none">${escapeXml(item.fixture.label)}</text>`;
    c += `</g>`;

    // Elevation label if elevated
    if (elevation > 0) {
      c += `<text x="${x + w + 3}" y="${floorY - ES(elevation/2)}" font-family="JetBrains Mono" font-size="6" fill="#c5975b88" text-anchor="start">↑${formatDist(elevation)}</text>`;
    }

    // Height label
    c += `<text x="${x + w + 8}" y="${y + h/2}" font-family="JetBrains Mono" font-size="6" fill="#66666699" text-anchor="start">H:${formatDist(item.height)}</text>`;
  }

  svg.innerHTML = c;

  // Attach event handlers to furniture and fixtures
  attachElevationFurnitureEvents();
  attachElevationFixtureEvents();
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
let elevSelectorBound = false;

export function buildElevationSelector() {
  const sel = document.getElementById('elevWallSelect');
  if (!sel) return;

  sel.innerHTML = '';

  // Group walls by room
  const wallsByRoom = {};
  for (const wall of getElevationWalls()) {
    const room = wall.room || 'Other';
    if (!wallsByRoom[room]) wallsByRoom[room] = [];
    wallsByRoom[room].push(wall);
  }

  // Sort rooms alphabetically
  const sortedRooms = Object.keys(wallsByRoom).sort();

  // Create optgroup for each room
  for (const room of sortedRooms) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = room;

    for (const wall of wallsByRoom[room]) {
      const opt = document.createElement('option');
      opt.value = wall.id;
      opt.textContent = wall.name;
      optgroup.appendChild(opt);
    }

    sel.appendChild(optgroup);
  }

  // Only bind the change listener once
  if (!elevSelectorBound) {
    sel.addEventListener('change', () => selectElevationWall(sel.value));
    elevSelectorBound = true;
  }
}

/**
 * Attach event handlers to furniture pieces in elevation view
 */
function attachElevationFurnitureEvents() {
  const pieces = document.querySelectorAll('.elev-furniture-piece');

  pieces.forEach(el => {
    let isDragging = false;
    let dragStartY = 0;
    let initialElevation = 0;

    el.addEventListener('mousedown', e => {
      // Only left click
      if (e.button !== 0) return;

      e.stopPropagation();
      e.preventDefault();

      const idx = parseInt(el.dataset.idx);
      const piece = state.placedFurniture[idx];
      if (!piece) return;

      isDragging = true;
      dragStartY = e.clientY;
      initialElevation = piece.elevation || 0;

      // Select this piece
      if (!state.selectedFurniture.has(idx)) {
        if (!e.shiftKey) state.selectedFurniture.clear();
        state.selectedFurniture.add(idx);
        renderElevation();
        if (window._renderFurniture) window._renderFurniture();
        if (window._updateAlignToolbar) window._updateAlignToolbar();
      }

      const handleMouseMove = (moveEvent) => {
        if (!isDragging) return;

        const deltaY = moveEvent.clientY - dragStartY;
        // Convert screen pixels to inches (inverted because Y goes down but elevation goes up)
        const elevationChange = -Math.round(deltaY / ELEV_PPI);
        const newElevation = Math.max(0, initialElevation + elevationChange);

        piece.elevation = newElevation;
        renderElevation();
      };

      const handleMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          pushHistory();
          saveToCache();
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

    el.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(el.dataset.idx);

      // Toggle selection
      if (e.shiftKey) {
        if (state.selectedFurniture.has(idx)) {
          state.selectedFurniture.delete(idx);
        } else {
          state.selectedFurniture.add(idx);
        }
      } else {
        state.selectedFurniture.clear();
        state.selectedFurniture.add(idx);
      }

      renderElevation();
      // Also update the main plan view
      if (window._renderFurniture) window._renderFurniture();
      if (window._updateAlignToolbar) window._updateAlignToolbar();
    });

    el.addEventListener('dblclick', e => {
      e.stopPropagation();
      e.preventDefault();
      const idx = parseInt(el.dataset.idx);
      pushHistory();
      state.placedFurniture[idx].rotated = !state.placedFurniture[idx].rotated;
      renderElevation();
      if (window._renderFurniture) window._renderFurniture();
      saveToCache();
    });
  });
}

/**
 * Attach event handlers to fixture pieces in elevation view
 */
function attachElevationFixtureEvents() {
  const pieces = document.querySelectorAll('.elev-fixture-piece');

  pieces.forEach(el => {
    let isDragging = false;
    let dragStartY = 0;
    let initialHeight = 0;

    el.addEventListener('mousedown', e => {
      // Only left click
      if (e.button !== 0) return;

      e.stopPropagation();
      e.preventDefault();

      const idx = parseInt(el.dataset.fixtureIdx);
      const fixture = state.floorPlan.fixtures[idx];
      if (!fixture) return;

      isDragging = true;
      dragStartY = e.clientY;
      initialHeight = fixture.surfaceHeight || 36;

      const handleMouseMove = (moveEvent) => {
        if (!isDragging) return;

        const deltaY = moveEvent.clientY - dragStartY;
        // Convert screen pixels to inches (inverted because Y goes down but elevation goes up)
        const elevationChange = -Math.round(deltaY / ELEV_PPI);
        const newElevation = Math.max(0, initialHeight + elevationChange);

        // Set elevation (position from floor), not surfaceHeight (object height)
        if (!fixture.elevation) fixture.elevation = 0;
        fixture.elevation = newElevation;
        renderElevation();
        // Also update the main plan view if render function exists
        if (window._renderPlan) window._renderPlan();
      };

      const handleMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          pushHistory();
          saveToCache();
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

    el.addEventListener('click', e => {
      e.stopPropagation();
      // Fixtures don't have selection state like furniture, but we could add it later
    });
  });
}

// Expose for inline handlers and auto-updates
window.selectElevationWall = selectElevationWall;
window._renderElevation = renderElevation;

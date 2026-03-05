/**
 * render.js — Data-driven SVG rendering engine
 *
 * Renders the floor plan from the data model:
 * - Rooms as filled polygons
 * - Walls with doors, windows, heaters
 * - Fixtures (closets, counters, appliances)
 * - Dimensions labels
 * - Grid overlay
 * - Scale bar
 */

import { S, PAD, PPI, state, getRooms, getWalls, getFixtures, getDimensions } from './data.js';
import { formatDist } from './units.js';

// ===== SVG COORDINATE HELPERS =====
export const wx = (x) => PAD + S(x);
export const wy = (y) => PAD + S(y);

/** Escape text for safe SVG/XML innerHTML interpolation */
export function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Get CSS variable color value */
function getCSSVar(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

// ===== PRIMITIVE DRAWING FUNCTIONS =====
function wallLine(x1, y1, x2, y2) {
  return `<line x1="${wx(x1)}" y1="${wy(y1)}" x2="${wx(x2)}" y2="${wy(y2)}" stroke="${getCSSVar('--wall-color') || '#555'}" stroke-width="5" stroke-linecap="round"/>`;
}

function thinWall(x1, y1, x2, y2) {
  return `<line x1="${wx(x1)}" y1="${wy(y1)}" x2="${wx(x2)}" y2="${wy(y2)}" stroke="${getCSSVar('--wall-thin') || '#444'}" stroke-width="3" stroke-linecap="round"/>`;
}

function windowMark(x1, y1, x2, y2) {
  return `<line x1="${wx(x1)}" y1="${wy(y1)}" x2="${wx(x2)}" y2="${wy(y2)}" stroke="${getCSSVar('--window-bg') || '#4a9eff22'}" stroke-width="10"/>` +
    `<line x1="${wx(x1)}" y1="${wy(y1)}" x2="${wx(x2)}" y2="${wy(y2)}" stroke="${getCSSVar('--window-color') || '#4a9eff'}" stroke-width="3"/>`;
}

function doorOpen(x1, y1, x2, y2) {
  return `<line x1="${wx(x1)}" y1="${wy(y1)}" x2="${wx(x2)}" y2="${wy(y2)}" stroke="${getCSSVar('--door-color') || '#c5975b'}" stroke-width="2.5"/>`;
}

function slidingDoor(x1, y1, x2, y2) {
  return `<line x1="${wx(x1)}" y1="${wy(y1)}" x2="${wx(x2)}" y2="${wy(y2)}" stroke="${getCSSVar('--door-color') || '#c5975b'}" stroke-width="2" stroke-dasharray="6 3"/>`;
}

function doorArc(cx, cy, r, startAngle, endAngle) {
  const sa = startAngle * Math.PI / 180, ea = endAngle * Math.PI / 180;
  const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
  const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
  const sweep = endAngle > startAngle ? 1 : 0;
  return `<path d="M ${wx(x1)} ${wy(y1)} A ${S(r)} ${S(r)} 0 0 ${sweep} ${wx(x2)} ${wy(y2)}" fill="none" stroke="${getCSSVar('--door-arc') || '#c5975b33'}" stroke-width="1" stroke-dasharray="3 2"/>`;
}

function labelText(x, y, text, size = 8, color = null, rot = 0) {
  const finalColor = color || getCSSVar('--text-dimmer') || '#444';
  const tr = rot ? `transform="rotate(${rot} ${wx(x)} ${wy(y)})"` : '';
  return `<text x="${wx(x)}" y="${wy(y)}" font-family="JetBrains Mono" font-size="${size}" fill="${finalColor}" text-anchor="middle" ${tr}>${escapeXml(text)}</text>`;
}

// ===== ROOM RENDERING =====
function renderRooms() {
  let c = '';
  const defaultRoomFill = getCSSVar('--room-fill-default') || '#18182288';

  for (const room of getRooms()) {
    const pts = room.vertices.map(([x,y]) => `${wx(x)},${wy(y)}`).join(' ');
    // Use CSS variable as default, allow room to override
    const roomColor = room.color || defaultRoomFill;
    // In light mode, replace dark colors with CSS variable
    const isLightMode = document.body.classList.contains('light-mode');
    const finalColor = isLightMode ? defaultRoomFill : roomColor;

    c += `<polygon points="${pts}" fill="${finalColor}" stroke="none"/>`;

    // Room label
    const cx = room.vertices.reduce((s, v) => s + v[0], 0) / room.vertices.length;
    const cy = room.vertices.reduce((s, v) => s + v[1], 0) / room.vertices.length;
    const lx = cx + (room.labelOffset?.[0] || 0);
    const ly = cy + (room.labelOffset?.[1] || 0);
    c += `<text x="${wx(lx)}" y="${wy(ly)}" font-family="Cormorant Garamond" font-size="${room.labelSize || 14}" fill="${getCSSVar('--label-color') || '#33335544'}" text-anchor="middle">${escapeXml(room.name)}</text>`;
  }
  return c;
}

// ===== WALL RENDERING =====
function renderWalls() {
  let c = '';
  for (const wall of getWalls()) {
    const [x1, y1] = wall.from;
    const [x2, y2] = wall.to;

    // Draw the wall line based on type
    switch (wall.type) {
      case 'exterior':
        c += wallLine(x1, y1, x2, y2);
        break;
      case 'thin':
        c += thinWall(x1, y1, x2, y2);
        break;
      case 'sliding':
        if (wall.door) {
          const [dx1, dy1] = wall.door.from;
          const [dx2, dy2] = wall.door.to;
          c += slidingDoor(dx1, dy1, dx2, dy2);
        }
        break;
      case 'door':
        // Door-only segments don't draw a wall line
        break;
      default:
        c += wallLine(x1, y1, x2, y2);
    }

    // Draw window overlay
    if (wall.window) {
      const [wx1, wy1] = wall.window.from;
      const [wx2, wy2] = wall.window.to;
      c += windowMark(wx1, wy1, wx2, wy2);
    }

    // Draw door
    if (wall.door && wall.type !== 'sliding') {
      const [dx1, dy1] = wall.door.from;
      const [dx2, dy2] = wall.door.to;
      c += doorOpen(dx1, dy1, dx2, dy2);
      if (wall.door.arc) {
        const a = wall.door.arc;
        c += doorArc(a.cx, a.cy, a.r, a.start, a.end);
      }
    }

    // Draw heater
    if (wall.heater) {
      const htr = wall.heater;
      c += `<rect x="${wx(htr.x)}" y="${wy(htr.y)}" width="${S(htr.w)}" height="${S(htr.h)}" fill="#ff634733" stroke="#ff6347" stroke-width="1" rx="1"/>`;
      c += `<text x="${wx(htr.x + htr.w/2)}" y="${wy(htr.y) + S(htr.h/2)}" font-family="JetBrains Mono" font-size="6" fill="#ff634799" text-anchor="middle" dominant-baseline="central">HTR</text>`;
    }

    // Draw label
    if (wall.label) {
      c += labelText(wall.label.x, wall.label.y, wall.label.text, 7, '#555');
    }
  }
  return c;
}

// ===== FIXTURE RENDERING =====
function renderFixtures() {
  let c = '';
  const defaultFixtureFill = getCSSVar('--fixture-fill') || '#4a4a3a';
  const defaultFixtureStroke = getCSSVar('--fixture-stroke') || '#5a5a4a';
  const fixtureTextColor = getCSSVar('--text-tertiary') || '#888';
  const isLightMode = document.body.classList.contains('light-mode');

  for (const fix of getFixtures()) {
    // Main rectangle - use CSS variables in light mode
    const dash = fix.dashed ? 'stroke-dasharray="4 2"' : '';
    const fillColor = isLightMode ? defaultFixtureFill : fix.color;
    const strokeColor = isLightMode ? defaultFixtureStroke : (fix.stroke || '#555');

    c += `<rect x="${wx(fix.x)}" y="${wy(fix.y)}" width="${S(fix.w)}" height="${S(fix.h)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1" ${dash} rx="1"/>`;
    c += `<text x="${wx(fix.x + fix.w/2)}" y="${wy(fix.y + fix.h/2)}" font-family="JetBrains Mono" font-size="7" fill="${fixtureTextColor}" text-anchor="middle" dominant-baseline="central">${escapeXml(fix.label)}</text>`;

    // Closet doors
    if (fix.doors) {
      const d = fix.doors;
      c += doorOpen(d.x, d.y, d.x + d.w, d.y);
      if (d.arcs) {
        for (const arc of d.arcs) {
          c += doorArc(arc.cx, arc.cy, arc.r, arc.start, arc.end);
        }
      }
    }

    // Closet front walls
    if (fix.frontWalls) {
      for (const fw of fix.frontWalls) {
        c += thinWall(fw.from[0], fw.from[1], fw.to[0], fw.to[1]);
      }
    }
  }
  return c;
}

// ===== DIMENSION RENDERING =====
function renderDimensions() {
  let c = '';
  for (const dim of getDimensions()) {
    const [x1, y1] = dim.from;
    const [x2, y2] = dim.to;
    const mx = (x1 + x2) / 2 + (dim.dx || 0);
    const my = (y1 + y2) / 2 + (dim.offset || 0);
    // Compute distance from endpoints, use formatDist for unit-aware display
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.sqrt(dx*dx + dy*dy);
    // If the label has extra text (like "jog"), append it
    const suffix = dim.label.replace(/[\d."']+\s*/, '').trim();
    const label = formatDist(dist) + (suffix ? ' ' + suffix : '');
    c += labelText(mx, my, label, dim.size || 8, dim.color || '#444', dim.rotation || 0);
  }
  return c;
}

// ===== GRID RENDERING =====
function renderGrid(svgW, svgH) {
  let c = '';
  const gridColor = getCSSVar('--grid-line') || '#ffffff15';
  const gridSpacing = state.gridDensity || 12; // Use state.gridDensity
  for (let x = PAD; x < svgW; x += S(gridSpacing))
    c += `<line x1="${x}" y1="${PAD}" x2="${x}" y2="${svgH-PAD}" stroke="${gridColor}" stroke-width="0.5"/>`;
  for (let y = PAD; y < svgH; y += S(gridSpacing))
    c += `<line x1="${PAD}" y1="${y}" x2="${svgW-PAD}" y2="${y}" stroke="${gridColor}" stroke-width="0.5"/>`;
  return c;
}

// ===== SCALE BAR =====
function renderScaleBar() {
  // Find bottom of the plan for scale bar placement
  const rooms = getRooms();
  let maxY = 0;
  rooms.forEach(r => r.vertices.forEach(([, y]) => { if (y > maxY) maxY = y; }));
  const sbY = maxY + 28;

  let c = '';
  const scaleBarColor = getCSSVar('--text-dimmer') || '#444';
  c += `<line x1="${wx(0)}" y1="${wy(sbY)}" x2="${wx(48)}" y2="${wy(sbY)}" stroke="${scaleBarColor}" stroke-width="1"/>`;
  c += `<line x1="${wx(0)}" y1="${wy(sbY)-3}" x2="${wx(0)}" y2="${wy(sbY)+3}" stroke="${scaleBarColor}"/>`;
  c += `<line x1="${wx(48)}" y1="${wy(sbY)-3}" x2="${wx(48)}" y2="${wy(sbY)+3}" stroke="${scaleBarColor}"/>`;
  c += labelText(24, sbY - 4, formatDist(48), 7);
  return c;
}

// ===== MAIN BUILD FUNCTION =====
export function buildSVG() {
  const svgW = S(340);
  const svgH = S(310);
  const svg = document.getElementById('svgPlan');
  svg.setAttribute('width', svgW);
  svg.setAttribute('height', svgH);
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);

  let c = '';

  // Grid
  c += `<g id="gridGroup" ${state.showGrid ? '' : 'style="display:none"'}>`;
  c += renderGrid(svgW, svgH);
  c += `</g>`;

  // Rooms
  c += renderRooms();

  // Walls
  c += renderWalls();

  // Fixtures
  c += renderFixtures();

  // Dimensions
  c += `<g id="dimGroup" ${state.showDims ? '' : 'style="display:none"'}>`;
  c += renderDimensions();
  c += `</g>`;

  // Scale bar
  c += renderScaleBar();

  // Dynamic groups (populated by other modules)
  c += `<g id="furnitureGroup"></g>`;
  c += `<g id="measurementGroup"></g>`;
  c += `<g id="anchorGroup"></g>`;

  svg.innerHTML = c;
}

// ===== STAGING SVG =====
export function buildStagingSVG() {
  const svg = document.getElementById('svgStaging');
  const svgW = 260;
  const svgH = 1400;
  svg.setAttribute('width', svgW);
  svg.setAttribute('height', svgH);
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);

  let c = '';

  // Background grid
  for (let x = 0; x < svgW; x += S(12))
    c += `<line x1="${x}" y1="0" x2="${x}" y2="${svgH}" stroke="#ffffff06" stroke-width="0.5"/>`;
  for (let y = 0; y < svgH; y += S(12))
    c += `<line x1="0" y1="${y}" x2="${svgW}" y2="${y}" stroke="#ffffff06" stroke-width="0.5"/>`;

  c += `<g id="furnitureGroupStaging"></g>`;
  svg.innerHTML = c;
}

/**
 * fixtures.js — Fixed furniture edit mode
 *
 * Allows moving and repositioning built-in fixtures:
 * - Oven, fridge, counters (kitchen)
 * - Closets (bedroom)
 * - Heater (wall-mounted)
 * - Doors (swing direction editing)
 *
 * When fixture edit mode is active (press F):
 * - Fixtures get yellow handles visible on the SVG
 * - Click a fixture to select it, then drag to reposition
 * - Blue circles appear at door hinge points:
 *   - Single click: rotate door swing 90°
 *   - Double click: move hinge to opposite end
 * - Changes are saved to the floor plan data (and exported with full JSON)
 */

import { S, PAD, PPI, state, getFixtures, getWalls, saveToCache } from './data.js';
import { buildSVG, wx, wy } from './render.js';
import { renderFurniture } from './furniture.js';
import { pushHistory } from './history.js';

/** Track whether a full SVG rebuild is needed after drag ends */
let needsRebuild = false;

/**
 * Toggle fixture edit mode
 */
export function toggleFixtureEditMode() {
  state.fixtureEditMode = !state.fixtureEditMode;
  state.draggingFixture = null;
  state.fixtureEditIdx = null;
  document.getElementById('btnFixtures')?.classList.toggle('active', state.fixtureEditMode);

  const ctr = document.getElementById('canvasContainer');
  if (state.fixtureEditMode) {
    if (ctr) ctr.style.cursor = 'crosshair';
  } else {
    if (ctr) ctr.style.cursor = 'grab';
  }

  renderFixtureHandles();
}

/**
 * Render selection/edit handles on fixtures when in edit mode
 */
export function renderFixtureHandles() {
  const svg = document.getElementById('svgPlan');
  if (!svg) return;

  // Remove existing handles
  let g = svg.querySelector('#fixtureHandles');
  if (!g) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = 'fixtureHandles';
    svg.appendChild(g);
  }

  if (!state.fixtureEditMode) {
    g.innerHTML = '';
    return;
  }

  let c = '';
  const fixtures = getFixtures();

  fixtures.forEach((fix, i) => {
    const x = PAD + S(fix.x);
    const y = PAD + S(fix.y);
    const w = S(fix.w);
    const h = S(fix.h);
    const isSelected = state.fixtureEditIdx === i;

    // Highlight border
    const borderColor = isSelected ? '#c5975b' : '#c5975b55';
    const borderWidth = isSelected ? 2.5 : 1.5;
    c += `<rect x="${x-2}" y="${y-2}" width="${w+4}" height="${h+4}" fill="none" stroke="${borderColor}" stroke-width="${borderWidth}" stroke-dasharray="4 2" rx="3" class="fixture-handle" data-fixture-idx="${i}" style="cursor:move"/>`;

    // Corner handles for selected fixture
    if (isSelected) {
      const hs = 6; // handle size
      const handles = [
        [x - hs/2, y - hs/2],
        [x + w - hs/2, y - hs/2],
        [x - hs/2, y + h - hs/2],
        [x + w - hs/2, y + h - hs/2]
      ];
      handles.forEach(([hx, hy]) => {
        c += `<rect x="${hx}" y="${hy}" width="${hs}" height="${hs}" fill="#c5975b" stroke="#fff" stroke-width="1" rx="1"/>`;
      });

      // Label showing position
      c += `<text x="${x + w/2}" y="${y - 8}" font-family="JetBrains Mono" font-size="7" fill="#c5975b" text-anchor="middle">${fix.label} @ ${fix.x}, ${fix.y}</text>`;
    }
  });

  // Add door handles for wall doors
  const walls = getWalls();
  walls.forEach((wall, wallIdx) => {
    if (wall.door && wall.door.arc) {
      const arc = wall.door.arc;
      const cx = wx(arc.cx);
      const cy = wy(arc.cy);

      // Draw clickable circle at hinge point (click to flip door direction)
      c += `<circle cx="${cx}" cy="${cy}" r="8" fill="#4a9eff44" stroke="#4a9eff" stroke-width="2" class="door-handle" data-wall-idx="${wallIdx}" style="cursor:pointer"/>`;
      c += `<text x="${cx}" y="${cy}" font-family="JetBrains Mono" font-size="8" fill="#4a9eff" text-anchor="middle" dominant-baseline="central" style="cursor:pointer;" class="door-handle" data-wall-idx="${wallIdx}">⟲</text>`;
    }
  });

  // Add door handles for closet doors (fixtures)
  fixtures.forEach((fixture, fixtureIdx) => {
    if (fixture.doors && fixture.doors.arcs) {
      fixture.doors.arcs.forEach((arc, arcIdx) => {
        const cx = wx(arc.cx);
        const cy = wy(arc.cy);

        // Draw clickable circle at hinge point
        c += `<circle cx="${cx}" cy="${cy}" r="8" fill="#4a9eff44" stroke="#4a9eff" stroke-width="2" class="closet-door-handle" data-fixture-idx="${fixtureIdx}" data-arc-idx="${arcIdx}" style="cursor:pointer"/>`;
        c += `<text x="${cx}" y="${cy}" font-family="JetBrains Mono" font-size="8" fill="#4a9eff" text-anchor="middle" dominant-baseline="central" style="cursor:pointer;" class="closet-door-handle" data-fixture-idx="${fixtureIdx}" data-arc-idx="${arcIdx}">⟲</text>`;
      });
    }
  });

  g.innerHTML = c;

  // Use event delegation for fixture handles
  if (g._fixtureHandlerAttached) {
    g.removeEventListener('mousedown', g._fixtureMouseDownHandler);
    g.removeEventListener('mouseenter', g._fixtureMouseEnterHandler, true);
    g.removeEventListener('mouseleave', g._fixtureMouseLeaveHandler, true);
  }

  g._fixtureMouseDownHandler = (e) => {
    const target = e.target;
    if (target.classList.contains('fixture-handle')) {
      e.stopPropagation();
      const idx = parseInt(target.dataset.fixtureIdx);

      pushHistory();

      state.fixtureEditIdx = idx;
      state.draggingFixture = idx;

      const ctr = document.getElementById('canvasContainer');
      const r = ctr.getBoundingClientRect();
      const mx = ((e.clientX - r.left - state.panX) / state.zoom - PAD) / PPI;
      const my = ((e.clientY - r.top - state.panY) / state.zoom - PAD) / PPI;
      const fix = getFixtures()[idx];
      state.dragOffset = { x: mx - fix.x, y: my - fix.y };

      renderFixtureHandles();
    }
  };

  g._fixtureMouseEnterHandler = (e) => {
    const target = e.target;
    if (target.classList.contains('fixture-handle')) {
      target.setAttribute('data-original-opacity', target.getAttribute('opacity') || '1');
      target.setAttribute('opacity', '0.7');
    }
  };

  g._fixtureMouseLeaveHandler = (e) => {
    const target = e.target;
    if (target.classList.contains('fixture-handle')) {
      const idx = parseInt(target.dataset.fixtureIdx);
      if (state.fixtureEditIdx !== idx) {
        const origOpacity = target.getAttribute('data-original-opacity') || '1';
        target.setAttribute('opacity', origOpacity);
      }
    }
  };

  g.addEventListener('mousedown', g._fixtureMouseDownHandler);
  g.addEventListener('mouseenter', g._fixtureMouseEnterHandler, true);
  g.addEventListener('mouseleave', g._fixtureMouseLeaveHandler, true);
  g._fixtureHandlerAttached = true;

  // Door handle hover effects (click handling is in app.js)
  if (g._doorHandlerAttached) {
    g.removeEventListener('mouseenter', g._doorMouseEnterHandler, true);
    g.removeEventListener('mouseleave', g._doorMouseLeaveHandler, true);
  }

  g._doorMouseEnterHandler = (e) => {
    const target = e.target;
    if (target.classList.contains('door-handle') || target.classList.contains('closet-door-handle')) {
      target.setAttribute('r', '10');
      e.stopPropagation();
    }
  };

  g._doorMouseLeaveHandler = (e) => {
    const target = e.target;
    if (target.classList.contains('door-handle') || target.classList.contains('closet-door-handle')) {
      target.setAttribute('r', '8');
    }
  };

  // Attach hover handlers only (clicks handled in app.js)
  g.addEventListener('mouseenter', g._doorMouseEnterHandler, true);
  g.addEventListener('mouseleave', g._doorMouseLeaveHandler, true);
  g._doorHandlerAttached = true;
}

/**
 * Rotate door swing by 90 degrees (single click)
 * Keeps hinge in same position, just rotates the arc
 */
export function rotateDoorSwing(wallIdx) {
  const walls = getWalls();
  const wall = walls[wallIdx];

  if (!wall || !wall.door || !wall.door.arc) {
    return;
  }

  pushHistory();

  const arc = wall.door.arc;

  // Rotate both angles by 90 degrees
  arc.start += 90;
  arc.end += 90;

  // Rebuild and re-render
  buildSVG();
  renderFurniture();
  renderFixtureHandles();
  saveToCache();
}

/**
 * Move door hinge to the opposite end (double click)
 * Flips which end of the door frame has the hinge
 */
export function moveDoorHinge(wallIdx) {
  const walls = getWalls();
  const wall = walls[wallIdx];

  if (!wall || !wall.door || !wall.door.arc) {
    return;
  }

  pushHistory();

  const arc = wall.door.arc;
  const door = wall.door;

  // Get door endpoints
  const [dx1, dy1] = door.from;
  const [dx2, dy2] = door.to;

  // Determine if hinge is at start or end of door
  // and move it to the opposite end
  const distToStart = Math.sqrt((arc.cx - dx1)**2 + (arc.cy - dy1)**2);
  const distToEnd = Math.sqrt((arc.cx - dx2)**2 + (arc.cy - dy2)**2);

  if (distToStart < distToEnd) {
    // Hinge is at start, move to end
    arc.cx = dx2;
    arc.cy = dy2;
  } else {
    // Hinge is at end, move to start
    arc.cx = dx1;
    arc.cy = dy1;
  }

  // Flip the arc angles (reverse the swing)
  const oldStart = arc.start;
  const oldEnd = arc.end;

  // Simple angle flip - negate and swap
  arc.start = -oldEnd;
  arc.end = -oldStart;

  // Rebuild and re-render
  buildSVG();
  renderFurniture();
  renderFixtureHandles();
  saveToCache();
}

/**
 * Handle click on empty space in fixture edit mode
 */
export function handleFixtureClick(clickX, clickY, e) {
  const fixtures = getFixtures();

  // Check if click is inside any fixture
  for (let i = 0; i < fixtures.length; i++) {
    const fix = fixtures[i];
    if (clickX >= fix.x && clickX <= fix.x + fix.w &&
        clickY >= fix.y && clickY <= fix.y + fix.h) {
      e.stopPropagation();

      pushHistory();

      state.fixtureEditIdx = i;
      state.draggingFixture = i;

      state.dragOffset = { x: clickX - fix.x, y: clickY - fix.y };
      renderFixtureHandles();
      return true;
    }
  }

  // Clicked outside any fixture — deselect
  state.fixtureEditIdx = null;
  renderFixtureHandles();
  return false;
}

/**
 * Handle fixture drag movement
 */
export function handleFixtureDragMove(e) {
  // Handle fixture dragging
  if (state.draggingFixture === null) return false;

  const ctr = document.getElementById('canvasContainer');
  const r = ctr.getBoundingClientRect();
  const mx = ((e.clientX - r.left - state.panX) / state.zoom - PAD) / PPI;
  const my = ((e.clientY - r.top - state.panY) / state.zoom - PAD) / PPI;

  const newX = Math.round(mx - state.dragOffset.x);
  const newY = Math.round(my - state.dragOffset.y);

  const fix = getFixtures()[state.draggingFixture];
  if (fix) {
    fix.x = newX;
    fix.y = newY;
    needsRebuild = true;

    // Update handles only during drag (defer full SVG rebuild to dragEnd)
    renderFixtureHandles();
  }

  return true;
}

/**
 * Handle fixture drag end
 */
export function handleFixtureDragEnd() {
  // Handle fixture drag end
  if (state.draggingFixture !== null) {
    state.draggingFixture = null;

    // Full rebuild now that dragging is done
    if (needsRebuild) {
      buildSVG();
      renderFurniture();
      renderFixtureHandles();
      needsRebuild = false;
    }

    saveToCache();
  }
}

/**
 * Rotate closet door swing by 90 degrees (single click)
 * Keeps hinge in same position, just rotates the arc
 */
export function rotateClosetDoorSwing(fixtureIdx, arcIdx) {
  const fixtures = getFixtures();
  const fixture = fixtures[fixtureIdx];

  if (!fixture || !fixture.doors || !fixture.doors.arcs || !fixture.doors.arcs[arcIdx]) {
    return;
  }

  pushHistory();

  const arc = fixture.doors.arcs[arcIdx];

  // Rotate both angles by 90 degrees
  arc.start += 90;
  arc.end += 90;

  // Rebuild and re-render
  buildSVG();
  renderFurniture();
  renderFixtureHandles();
  saveToCache();
}

/**
 * Move closet door hinge (double click)
 * For double doors, moves hinges from center to edges or vice versa
 */
export function moveClosetDoorHinge(fixtureIdx, arcIdx) {
  const fixtures = getFixtures();
  const fixture = fixtures[fixtureIdx];

  if (!fixture || !fixture.doors || !fixture.doors.arcs) {
    return;
  }

  pushHistory();

  const doors = fixture.doors;
  const arcs = doors.arcs;

  // For double doors (2 arcs), toggle between center and edge hinges
  if (arcs.length === 2) {
    const leftEdge = doors.x;
    const rightEdge = doors.x + doors.w;
    const center = doors.x + doors.w / 2;

    // Check if hinges are currently at center (overlapping)
    const arc0 = arcs[0];
    const arc1 = arcs[1];
    const areAtCenter = Math.abs(arc0.cx - center) < 1 && Math.abs(arc1.cx - center) < 1;

    if (areAtCenter) {
      // Move to edges - left door hinge to left edge, right door hinge to right edge
      arc0.cx = leftEdge;
      arc1.cx = rightEdge;
      // Flip angles to swing outward
      arc0.start = 95;
      arc0.end = 180;
      arc1.start = 0;
      arc1.end = 85;
    } else {
      // Move back to center (overlapping)
      arc0.cx = center;
      arc1.cx = center;
      // Reset to original inward swing
      arc0.start = 185;
      arc0.end = 270;
      arc1.start = 270;
      arc1.end = 355;
    }
  } else {
    // Single door - just flip the arc angles
    const arc = arcs[arcIdx];
    const oldStart = arc.start;
    const oldEnd = arc.end;
    arc.start = -oldEnd;
    arc.end = -oldStart;
  }

  // Rebuild and re-render
  buildSVG();
  renderFurniture();
  renderFixtureHandles();
  saveToCache();
}

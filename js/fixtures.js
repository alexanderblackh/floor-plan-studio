/**
 * fixtures.js — Fixed furniture edit mode
 *
 * Allows moving and repositioning built-in fixtures:
 * - Oven, fridge, counters (kitchen)
 * - Closets (bedroom)
 * - Heater (wall-mounted)
 *
 * When fixture edit mode is active:
 * - Fixtures get yellow handles visible on the SVG
 * - Click a fixture to select it, then drag to reposition
 * - Changes are saved to the floor plan data (and exported with full JSON)
 */

import { S, PAD, PPI, state, getFixtures, saveToCache } from './data.js';
import { buildSVG } from './render.js';
import { renderFurniture, renderStagingFurniture } from './furniture.js';

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

  g.innerHTML = c;

  // Attach events to handles
  g.querySelectorAll('.fixture-handle').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.stopPropagation();
      const idx = parseInt(el.dataset.fixtureIdx);
      state.fixtureEditIdx = idx;
      state.draggingFixture = idx;

      const ctr = document.getElementById('canvasContainer');
      const r = ctr.getBoundingClientRect();
      const mx = ((e.clientX - r.left - state.panX) / state.zoom - PAD) / PPI;
      const my = ((e.clientY - r.top - state.panY) / state.zoom - PAD) / PPI;
      const fix = getFixtures()[idx];
      state.dragOffset = { x: mx - fix.x, y: my - fix.y };

      renderFixtureHandles();
    });
  });
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

    // Rebuild SVG to show updated fixture position
    buildSVG();
    renderFurniture();
    renderFixtureHandles();
  }

  return true;
}

/**
 * Handle fixture drag end
 */
export function handleFixtureDragEnd() {
  if (state.draggingFixture !== null) {
    state.draggingFixture = null;
    // Save the updated fixture positions
    saveToCache();

    // Also update heater positions if we moved a wall with a heater
    // (heaters are stored in walls, not fixtures, but this is fine for now)
  }
}

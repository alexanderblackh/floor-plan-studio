/**
 * dividers.js — Soft dividers for room zones
 *
 * Allows users to draw visual divider lines to separate areas within rooms
 * without creating full walls.
 */

import { S, PAD, state, saveToCache } from './data.js';
import { pushHistory } from './history.js';

/**
 * Render all soft dividers
 */
export function renderDividers() {
  const svg = document.getElementById('svgPlan');
  if (!svg) return;
  let g = svg.querySelector('#dividerGroup');

  // Create group if it doesn't exist
  if (!g) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = 'dividerGroup';
    svg.appendChild(g);
  }

  let c = '';

  // Render all permanent dividers
  for (let i = 0; i < state.softDividers.length; i++) {
    const div = state.softDividers[i];
    c += renderDividerLine(div.from, div.to, i);
  }

  // Render active divider being drawn
  if (state.dividerMode && state.dividerStart) {
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim() || '#c5975b';
    const sx1 = PAD + S(state.dividerStart.x);
    const sy1 = PAD + S(state.dividerStart.y);
    c += `<circle cx="${sx1}" cy="${sy1}" r="5" fill="${accentColor}" stroke="#ffffff" stroke-width="1"/>`;
  }

  g.innerHTML = c;

  // Attach event handlers
  attachDividerEvents();
}

/**
 * Render a single divider line
 */
function renderDividerLine(from, to, dividerIdx = -1) {
  const x1 = from.x, y1 = from.y, x2 = to.x, y2 = to.y;

  const sx1 = PAD + S(x1), sy1 = PAD + S(y1);
  const sx2 = PAD + S(x2), sy2 = PAD + S(y2);

  const dividerColor = getComputedStyle(document.documentElement).getPropertyValue('--text-dimmer').trim() || '#666';

  const dataAttr = dividerIdx >= 0 ? ` data-divider-idx="${dividerIdx}"` : '';

  let c = '';
  if (dividerIdx >= 0) {
    c += `<g class="soft-divider" data-divider-idx="${dividerIdx}" style="cursor:pointer">`;
  }

  // Divider line - light and dashed
  c += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="${dividerColor}" stroke-width="2" stroke-dasharray="6 6" stroke-linecap="round"${dataAttr}/>`;

  // Endpoints
  c += `<circle cx="${sx1}" cy="${sy1}" r="3" fill="${dividerColor}" stroke="#ffffff33" stroke-width="1"${dataAttr}/>`;
  c += `<circle cx="${sx2}" cy="${sy2}" r="3" fill="${dividerColor}" stroke="#ffffff33" stroke-width="1"${dataAttr}/>`;

  if (dividerIdx >= 0) {
    c += `</g>`;
  }

  return c;
}

/**
 * Attach event handlers to dividers
 */
function attachDividerEvents() {
  document.querySelectorAll('.soft-divider').forEach(el => {
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(el.dataset.dividerIdx);
      if (confirm('Delete this divider?')) {
        deleteDivider(idx);
      }
    });

    el.addEventListener('mouseenter', e => {
      el.style.opacity = '0.7';
    });

    el.addEventListener('mouseleave', e => {
      el.style.opacity = '1';
    });
  });
}

/**
 * Delete a divider by index
 */
function deleteDivider(idx) {
  pushHistory();
  state.softDividers.splice(idx, 1);
  saveToCache();
  renderDividers();
}

/**
 * Toggle divider mode
 */
export function toggleDividerMode() {
  state.dividerMode = !state.dividerMode;
  document.getElementById('btnDivider')?.classList.toggle('active', state.dividerMode);

  const ctr = document.getElementById('canvasContainer');
  if (!state.dividerMode) {
    state.dividerStart = null;
    renderDividers();
    if (ctr) ctr.style.cursor = 'grab';
  } else {
    if (ctr) ctr.style.cursor = 'crosshair';
  }
}

/**
 * Handle click to place divider points
 */
export function handleDividerClick(clickX, clickY) {
  if (!state.dividerMode) return false;

  if (!state.dividerStart) {
    // First point
    state.dividerStart = { x: clickX, y: clickY };
  } else {
    // Second point - create divider
    pushHistory();
    state.softDividers.push({
      from: { x: state.dividerStart.x, y: state.dividerStart.y },
      to: { x: clickX, y: clickY }
    });
    state.dividerStart = null;
    saveToCache();
  }

  renderDividers();
  return true;
}

// Expose globally
window.toggleDividerMode = toggleDividerMode;

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
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim() || '#c5975b';

  const dataAttr = dividerIdx >= 0 ? ` data-divider-idx="${dividerIdx}"` : '';
  const isSelected = state.selectedDivider === dividerIdx;

  let c = '';
  if (dividerIdx >= 0) {
    c += `<g class="soft-divider" data-divider-idx="${dividerIdx}" style="cursor:pointer">`;
  }

  // Divider line - light and dashed, highlight if selected
  const lineWidth = isSelected ? 3 : 2;
  const lineColor = isSelected ? accentColor : dividerColor;
  c += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-dasharray="6 6" stroke-linecap="round"${dataAttr}/>`;

  // Endpoints - larger if selected
  const endpointRadius = isSelected ? 6 : 3;
  const endpointStroke = isSelected ? 2 : 1;
  const endpointColor = isSelected ? accentColor : dividerColor;
  c += `<circle class="divider-handle-start" cx="${sx1}" cy="${sy1}" r="${endpointRadius}" fill="${endpointColor}" stroke="#ffffff" stroke-width="${endpointStroke}"${dataAttr} style="cursor:${isSelected ? 'move' : 'pointer'}" data-divider-idx="${dividerIdx}" data-point="start"/>`;
  c += `<circle class="divider-handle-end" cx="${sx2}" cy="${sy2}" r="${endpointRadius}" fill="${endpointColor}" stroke="#ffffff" stroke-width="${endpointStroke}"${dataAttr} style="cursor:${isSelected ? 'move' : 'pointer'}" data-divider-idx="${dividerIdx}" data-point="end"/>`;

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
    el.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(el.dataset.dividerIdx);
      state.selectedDivider = idx;
      state.selectedMeasurement = null;
      renderDividers();
    });

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

  // Attach drag handlers to divider endpoints
  document.querySelectorAll('.divider-handle-start, .divider-handle-end').forEach(handle => {
    handle.addEventListener('mousedown', e => {
      e.stopPropagation();
      e.preventDefault();

      const idx = parseInt(handle.dataset.dividerIdx);
      const point = handle.dataset.point;

      if (idx < 0 || idx >= state.softDividers.length) return;

      state.draggingMeasurementPoint = { type: 'divider', idx, point };

      const handleMouseMove = (moveEvent) => {
        if (!state.draggingMeasurementPoint) return;

        const r = document.getElementById('canvasContainer').getBoundingClientRect();
        let newX = Math.round(((moveEvent.clientX - r.left - state.panX) / state.zoom - PAD) / PPI);
        let newY = Math.round(((moveEvent.clientY - r.top - state.panY) / state.zoom - PAD) / PPI);

        const divider = state.softDividers[idx];
        const otherPoint = point === 'from' ? divider.to : divider.from;

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
          divider.from.x = newX;
          divider.from.y = newY;
        } else {
          divider.to.x = newX;
          divider.to.y = newY;
        }

        renderDividers();
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
window._renderDividers = renderDividers;

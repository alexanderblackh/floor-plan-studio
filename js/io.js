/**
 * io.js — Import/Export (JSON, CSV, SVG, PNG, Figma)
 *
 * Export formats:
 * - Placement JSON: just furniture positions (lightweight)
 * - Full Floor Plan JSON: entire plan + positions (portable)
 * - CSV: furniture list as spreadsheet
 * - SVG: vector graphics
 * - PNG: raster at 2x resolution
 * - Figma SVG: cleaned for Figma import
 *
 * Import formats:
 * - Placement JSON: load positions into current plan
 * - Full Floor Plan JSON: load entire plan (rooms, walls, furniture)
 * - CSV: furniture definitions
 */

import { state, getFurnitureDefs, saveToCache, initDefaults, validateFloorPlan, generateUUID } from './data.js';
import { buildSVG, buildStagingSVG } from './render.js';
import { renderFurniture, renderStagingFurniture } from './furniture.js';
import { buildElevationSelector } from './elevation.js';

function closeExportMenu() {
  const menu = document.getElementById('exportMenu');
  if (menu) menu.style.display = 'none';
}

/** Download a Blob as a file, cleaning up the object URL after */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ===== EXPORT SVG =====
export function exportSVG() {
  const cl = document.getElementById('svgPlan').cloneNode(true);
  cl.style.transform = '';
  const b = new Blob([new XMLSerializer().serializeToString(cl)], { type: 'image/svg+xml' });
  downloadBlob(b, 'floor-plan.svg');
  closeExportMenu();
}

// ===== EXPORT PNG =====
export function exportPNG() {
  const svg = document.getElementById('svgPlan');
  const svgClone = svg.cloneNode(true);
  svgClone.style.transform = '';

  const canvas = document.createElement('canvas');
  const w = parseFloat(svg.getAttribute('width'));
  const h = parseFloat(svg.getAttribute('height'));
  const scale = 2;
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const svgData = new XMLSerializer().serializeToString(svgClone);
  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = function () {
    ctx.fillStyle = '#0f0f14';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob(function (blob) {
      downloadBlob(blob, 'floor-plan.png');
    }, 'image/png');
  };
  img.src = url;
  closeExportMenu();
}

// ===== EXPORT FIGMA SVG =====
export function exportFigma() {
  const svg = document.getElementById('svgPlan').cloneNode(true);
  svg.style.transform = '';
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.textContent = state.floorPlan.name || 'Floor Plan';
  svg.insertBefore(title, svg.firstChild);

  const svgString = new XMLSerializer().serializeToString(svg);

  downloadBlob(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }), 'floor-plan-figma.svg');
  closeExportMenu();
}

// ===== EXPORT PLACEMENT JSON =====
export function exportJSON() {
  const layoutData = {
    version: '3.0',
    type: 'placement',
    timestamp: new Date().toISOString(),
    planName: state.floorPlan.name,
    furniture: state.placedFurniture.map(p => ({
      id: p.id,
      x: p.x,
      y: p.y,
      rotated: p.rotated || false,
      elevation: p.elevation || 0,
      stackedOn: p.stackedOn || null,
      anchors: p.anchors || undefined
    })),
    lockedMeasurements: state.lockedMeasurements || [],
    softDividers: state.softDividers || [],
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY
  };

  downloadBlob(new Blob([JSON.stringify(layoutData, null, 2)], { type: 'application/json' }), 'floor-plan-layout.json');
  closeExportMenu();
}

// ===== EXPORT FULL FLOOR PLAN JSON =====
export function exportFullJSON() {
  const fullData = {
    ...JSON.parse(JSON.stringify(state.floorPlan)),
    type: 'full-plan',
    timestamp: new Date().toISOString(),
    placement: state.placedFurniture.map(p => ({
      id: p.id,
      x: p.x,
      y: p.y,
      rotated: p.rotated || false,
      elevation: p.elevation || 0,
      stackedOn: p.stackedOn || null,
      anchors: p.anchors || undefined
    })),
    lockedMeasurements: state.lockedMeasurements || [],
    softDividers: state.softDividers || [],
    viewState: {
      zoom: state.zoom,
      panX: state.panX,
      panY: state.panY
    }
  };

  downloadBlob(new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' }), 'floor-plan-full.json');
  closeExportMenu();
}

// ===== EXPORT CSV =====
export function exportCSV() {
  let csv = 'id,name,x,y,width,height,rotated,elevation,stacked_on,room\n';
  for (const p of state.placedFurniture) {
    const d = getFurnitureDefs().find(f => f.id === p.id);
    if (!d) continue;
    csv += `${p.id},"${d.name}",${p.x},${p.y},${d.w},${d.h},${p.rotated || false},${p.elevation || 0},${p.stackedOn || ''},${d.room}\n`;
  }

  downloadBlob(new Blob([csv], { type: 'text/csv' }), 'floor-plan-furniture.csv');
  closeExportMenu();
}

/** Parse a CSV line, handling quoted fields that may contain commas */
function parseCSVLine(line) {
  const cols = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cols.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current.trim());
  return cols;
}

// ===== IMPORT JSON =====
export function importJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const data = JSON.parse(event.target.result);

        if (data.type === 'full-plan' || (data.rooms && data.walls)) {
          // Full floor plan import
          importFullPlan(data);
        } else if (data.furniture && Array.isArray(data.furniture)) {
          // Placement import
          importPlacement(data);
        } else {
          if (window.showToast) {
            window.showToast('Unrecognized JSON format. Expected a floor plan or placement file.', 'error');
          }
        }
      } catch (err) {
        if (window.showToast) {
          window.showToast('Error reading file: ' + err.message, 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  input.click();
  closeExportMenu();
}

export function importFullPlan(data) {
  const errors = validateFloorPlan(data);
  if (errors.length > 0) {
    if (window.showToast) {
      window.showToast('Floor plan validation failed: ' + errors.join(', '), 'error', 5000);
    }
    return;
  }

  if (!confirm(`Import full floor plan "${data.name || 'Unknown'}"?\n\nThis will replace your current plan entirely.`)) {
    return;
  }

  // Strip non-plan metadata before storing
  const planData = JSON.parse(JSON.stringify(data));
  delete planData.type;
  delete planData.timestamp;
  delete planData.placement;
  delete planData.viewState;
  delete planData.lockedMeasurements;
  delete planData.softDividers;

  // Add UUID if missing (for backwards compatibility)
  if (!planData.id) {
    planData.id = generateUUID();
  }

  // Add planVersion if missing
  if (!planData.planVersion) {
    planData.planVersion = "1.0";
  }

  // Replace floor plan
  state.floorPlan = planData;

  // Apply placement if included
  if (data.placement) {
    state.placedFurniture = data.placement.map(p => ({
      ...p,
      elevation: p.elevation ?? 0,
      stackedOn: p.stackedOn ?? null
    }));
  } else {
    initDefaults();
  }

  // Restore locked measurements and dividers
  if (data.lockedMeasurements) state.lockedMeasurements = data.lockedMeasurements;
  if (data.softDividers) state.softDividers = data.softDividers;

  // Apply view state
  if (data.viewState) {
    state.zoom = data.viewState.zoom ?? 1;
    state.panX = data.viewState.panX ?? 0;
    state.panY = data.viewState.panY ?? 0;
  }

  // Update plan name and version display
  const nameInput = document.getElementById('planNameInput');
  if (nameInput) nameInput.value = state.floorPlan.name || 'Untitled';

  const versionInput = document.getElementById('planVersionInput');
  if (versionInput) versionInput.value = state.floorPlan.planVersion || '1.0';

  // Rebuild everything
  buildSVG();
  buildStagingSVG();
  renderFurniture();
  renderStagingFurniture();
  buildElevationSelector();
  if (window._applyTransform) window._applyTransform();
  if (window._renderMeasurement) window._renderMeasurement();
  if (window._renderDividers) window._renderDividers();
  saveToCache();

  // Show success toast
  if (window.showToast) {
    window.showToast(`Imported "${state.floorPlan.name || 'floor plan'}" with ${state.floorPlan.furniture?.length || 0} furniture pieces`, 'success');
  }
}

export function importPlacement(data) {
  if (!confirm(`Import layout from ${data.timestamp ? new Date(data.timestamp).toLocaleString() : 'unknown date'}?\n\nThis will replace your current furniture placement.`)) {
    return;
  }

  data.furniture.forEach(savedPiece => {
    const piece = state.placedFurniture.find(p => p.id === savedPiece.id);
    if (piece) {
      piece.x = savedPiece.x;
      piece.y = savedPiece.y;
      piece.rotated = savedPiece.rotated || false;
      piece.elevation = savedPiece.elevation ?? 0;
      piece.stackedOn = savedPiece.stackedOn ?? null;
      piece.anchors = savedPiece.anchors || undefined;
    }
  });

  // Restore locked measurements and dividers
  if (data.lockedMeasurements) state.lockedMeasurements = data.lockedMeasurements;
  if (data.softDividers) state.softDividers = data.softDividers;

  if (data.zoom !== undefined) state.zoom = data.zoom;
  if (data.panX !== undefined) state.panX = data.panX;
  if (data.panY !== undefined) state.panY = data.panY;

  buildSVG();
  buildStagingSVG();
  renderFurniture();
  renderStagingFurniture();
  if (window._applyTransform) window._applyTransform();
  if (window._renderMeasurement) window._renderMeasurement();
  if (window._renderDividers) window._renderDividers();
  saveToCache();

  // Show success toast
  if (window.showToast) {
    const count = data.furniture.length;
    window.showToast(`Updated placement for ${count} furniture piece${count !== 1 ? 's' : ''}`, 'success');
  }
}

// ===== IMPORT CSV =====
export function importCSV() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';

  input.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const lines = event.target.result.split('\n').filter(l => l.trim());
        if (lines.length < 2) {
          if (window.showToast) {
            window.showToast('CSV file is empty or has no data rows', 'error');
          }
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const idCol = headers.indexOf('id');
        const xCol = headers.indexOf('x');
        const yCol = headers.indexOf('y');
        const rotCol = headers.indexOf('rotated');
        const elevCol = headers.indexOf('elevation');

        if (idCol === -1) {
          if (window.showToast) {
            window.showToast('CSV must have an "id" column', 'error');
          }
          return;
        }

        if (!confirm('Import furniture placement from CSV?\n\nThis will update positions for matching furniture IDs.')) {
          return;
        }

        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          const id = cols[idCol];
          const piece = state.placedFurniture.find(p => p.id === id);
          if (!piece) continue;

          if (xCol >= 0) { const v = parseFloat(cols[xCol]); if (!isNaN(v)) piece.x = v; }
          if (yCol >= 0) { const v = parseFloat(cols[yCol]); if (!isNaN(v)) piece.y = v; }
          if (rotCol >= 0) piece.rotated = cols[rotCol] === 'true';
          if (elevCol >= 0) { const v = parseFloat(cols[elevCol]); if (!isNaN(v)) piece.elevation = v; }
        }

        renderFurniture();
        renderStagingFurniture();
        saveToCache();

        // Show success toast
        if (window.showToast) {
          window.showToast('CSV imported successfully', 'success');
        }
      } catch (err) {
        if (window.showToast) {
          window.showToast('Error reading CSV: ' + err.message, 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  input.click();
  closeExportMenu();
}

// ===== EXPORT MENU TOGGLE =====
export function toggleExportMenu() {
  const menu = document.getElementById('exportMenu');
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';

  if (menu.style.display === 'block') {
    setTimeout(() => {
      document.addEventListener('click', function close(e) {
        if (!e.target.closest('.toolbar-dropdown')) {
          menu.style.display = 'none';
          document.removeEventListener('click', close);
        }
      });
    }, 0);
  }
}

// Expose functions globally for inline onclick handlers
window.exportSVG = exportSVG;
window.exportPNG = exportPNG;
window.exportFigma = exportFigma;
window.exportJSON = exportJSON;
window.exportFullJSON = exportFullJSON;
window.exportCSV = exportCSV;
window.importJSON = importJSON;
window.importCSV = importCSV;
window.toggleExportMenu = toggleExportMenu;

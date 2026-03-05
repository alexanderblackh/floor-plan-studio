/**
 * app.js — Application initialization, events, zoom/pan
 *
 * This is the entry point that wires everything together.
 */

import { state, PPI, PAD, loadFromCache, initDefaults, saveToCache, getFurnitureDef } from './data.js';
import { buildSVG, buildStagingSVG } from './render.js';
import { renderFurniture, renderStagingFurniture, handleDragMove, handleDragEnd } from './furniture.js';
import { clearSelection, updateAlignToolbar } from './selection.js';
import { renderMeasurement, renderAnchors, toggleMeasure, toggleAnchorMode, lockCurrentMeasurement } from './measurement.js';
import { renderElevation, toggleElevation, buildElevationSelector } from './elevation.js';
import { cycleUnit, getUnit, formatDist, setUnit } from './units.js';
import { toggleFixtureEditMode, handleFixtureClick, handleFixtureDragMove, handleFixtureDragEnd, renderFixtureHandles } from './fixtures.js';
import { undo, redo, initHistory, pushHistory } from './history.js';
import { renderDividers, toggleDividerMode, handleDividerClick } from './dividers.js';
import { updateColorPicker } from './colors.js';
import './io.js'; // registers global export/import functions

// ===== ZOOM / PAN =====
function applyTransform() {
  const svg = document.getElementById('svgPlan');
  if (svg) svg.style.transform = `translate(${state.panX}px,${state.panY}px) scale(${state.zoom})`;
  const zl = document.getElementById('zoomLevel');
  if (zl) zl.textContent = `${Math.round(state.zoom * 100)}%`;
}

// Expose for io.js callback
window._applyTransform = applyTransform;

function zoomIn() {
  const r = document.getElementById('canvasContainer').getBoundingClientRect();
  const cx = r.width / 2, cy = r.height / 2, oz = state.zoom;
  state.zoom = Math.min(15, state.zoom * 1.3);
  state.panX = cx - (cx - state.panX) * (state.zoom / oz);
  state.panY = cy - (cy - state.panY) * (state.zoom / oz);
  applyTransform();
}

function zoomOut() {
  const r = document.getElementById('canvasContainer').getBoundingClientRect();
  const cx = r.width / 2, cy = r.height / 2, oz = state.zoom;
  state.zoom = Math.max(0.15, state.zoom * 0.77);
  state.panX = cx - (cx - state.panX) * (state.zoom / oz);
  state.panY = cy - (cy - state.panY) * (state.zoom / oz);
  applyTransform();
}

function fitToView() {
  const ctr = document.getElementById('canvasContainer');
  const svg = document.getElementById('svgPlan');
  if (!ctr || !svg) return;
  const cw = ctr.clientWidth, ch = ctr.clientHeight;
  const sw = parseFloat(svg.getAttribute('width')), sh = parseFloat(svg.getAttribute('height'));
  state.zoom = Math.min(cw / sw, ch / sh) * 0.92;
  state.panX = (cw - sw * state.zoom) / 2;
  state.panY = (ch - sh * state.zoom) / 2;
  applyTransform();
}

// ===== CONTROLS =====
function toggleGrid() {
  state.showGrid = !state.showGrid;
  document.getElementById('btnGrid')?.classList.toggle('active', state.showGrid);
  const g = document.getElementById('svgPlan')?.querySelector('#gridGroup');
  if (g) g.style.display = state.showGrid ? '' : 'none';
  updateViewMenuChecks();
}

function toggleDims() {
  state.showDims = !state.showDims;
  document.getElementById('btnDims')?.classList.toggle('active', state.showDims);
  const g = document.getElementById('svgPlan')?.querySelector('#dimGroup');
  if (g) g.style.display = state.showDims ? '' : 'none';
  updateViewMenuChecks();
}

function toggleSnapToGrid() {
  state.snapToGrid = !state.snapToGrid;
  updateViewMenuChecks();
}

function selectGridDensity(density) {
  state.gridDensity = density;
  updateViewMenuChecks();
  // Rebuild grid with new density
  buildSVG();
  renderFurniture();
  // Close menus
  const viewMenu = document.getElementById('viewMenu');
  if (viewMenu) viewMenu.style.display = 'none';
  const gridDensitySubmenu = document.getElementById('gridDensitySubmenu');
  if (gridDensitySubmenu) gridDensitySubmenu.style.display = 'none';
}

function selectRenderQuality(quality) {
  state.renderQuality = quality;
  updateViewMenuChecks();
  applyRenderQuality(quality);
  // Close menus
  const viewMenu = document.getElementById('viewMenu');
  if (viewMenu) viewMenu.style.display = 'none';
  const renderQualitySubmenu = document.getElementById('renderQualitySubmenu');
  if (renderQualitySubmenu) renderQualitySubmenu.style.display = 'none';
}

function applyRenderQuality(quality) {
  const svg = document.getElementById('svgPlan');
  if (!svg) return;

  let pixelDensity = window.devicePixelRatio || 1;

  switch (quality) {
    case '4k':
      pixelDensity = 2;
      break;
    case 'hd':
      pixelDensity = 1.5;
      break;
    case 'sd':
      pixelDensity = 1;
      break;
    case 'auto':
    default:
      pixelDensity = window.devicePixelRatio || 1;
      break;
  }

  // Apply image-rendering for crisp edges
  svg.style.imageRendering = quality === 'sd' ? 'auto' : 'crisp-edges';
  svg.style.shapeRendering = quality === 'sd' ? 'auto' : 'geometricPrecision';

  // Force re-render
  buildSVG();
  renderFurniture();
}

function updateViewMenuChecks() {
  const gridCheck = document.getElementById('gridCheck');
  const snapToGridCheck = document.getElementById('snapToGridCheck');
  const dimsCheck = document.getElementById('dimsCheck');
  const showAllCheck = document.getElementById('showAllCheck');
  const showAllMeasurementsCheck = document.getElementById('showAllMeasurementsCheck');
  const showAllLinksCheck = document.getElementById('showAllLinksCheck');
  const showAllDividersCheck = document.getElementById('showAllDividersCheck');
  const alwaysShowAlignmentCheck = document.getElementById('alwaysShowAlignmentCheck');
  const alwaysShowSaveControlsCheck = document.getElementById('alwaysShowSaveControlsCheck');
  const alwaysShowShortcutsCheck = document.getElementById('alwaysShowShortcutsCheck');

  const menuShowAllMeasurements = document.getElementById('menuShowAllMeasurements');
  const menuShowAllLinks = document.getElementById('menuShowAllLinks');
  const menuShowAllDividers = document.getElementById('menuShowAllDividers');

  if (gridCheck) gridCheck.textContent = state.showGrid ? '✓' : '';
  if (snapToGridCheck) snapToGridCheck.textContent = state.snapToGrid ? '✓' : '';
  if (dimsCheck) dimsCheck.textContent = state.showDims ? '✓' : '';
  if (showAllCheck) showAllCheck.textContent = state.showAll ? '✓' : '';
  if (showAllMeasurementsCheck) showAllMeasurementsCheck.textContent = state.showAllMeasurements ? '✓' : '';
  if (showAllLinksCheck) showAllLinksCheck.textContent = state.showAllLinks ? '✓' : '';
  if (showAllDividersCheck) showAllDividersCheck.textContent = state.showAllDividers ? '✓' : '';
  if (alwaysShowAlignmentCheck) alwaysShowAlignmentCheck.textContent = state.alwaysShowAlignment ? '✓' : '';
  if (alwaysShowSaveControlsCheck) alwaysShowSaveControlsCheck.textContent = state.alwaysShowSaveControls ? '✓' : '';
  if (alwaysShowShortcutsCheck) alwaysShowShortcutsCheck.textContent = state.alwaysShowShortcuts ? '✓' : '';

  // Update grid density checkmarks
  document.getElementById('gridCheck6').textContent = state.gridDensity === 6 ? '✓' : '';
  document.getElementById('gridCheck12').textContent = state.gridDensity === 12 ? '✓' : '';
  document.getElementById('gridCheck24').textContent = state.gridDensity === 24 ? '✓' : '';
  document.getElementById('gridCheck36').textContent = state.gridDensity === 36 ? '✓' : '';

  // Update render quality checkmarks
  document.getElementById('qualityCheckAuto').textContent = state.renderQuality === 'auto' ? '✓' : '';
  document.getElementById('qualityCheck4k').textContent = state.renderQuality === '4k' ? '✓' : '';
  document.getElementById('qualityCheckHd').textContent = state.renderQuality === 'hd' ? '✓' : '';
  document.getElementById('qualityCheckSd').textContent = state.renderQuality === 'sd' ? '✓' : '';

  // Disable individual toggles when "Show All" is enabled
  const isShowAllEnabled = state.showAll;
  if (menuShowAllMeasurements) menuShowAllMeasurements.disabled = isShowAllEnabled;
  if (menuShowAllLinks) menuShowAllLinks.disabled = isShowAllEnabled;
  if (menuShowAllDividers) menuShowAllDividers.disabled = isShowAllEnabled;

  // Apply disabled styling
  [menuShowAllMeasurements, menuShowAllLinks, menuShowAllDividers].forEach(btn => {
    if (btn) {
      if (isShowAllEnabled) {
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      } else {
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    }
  });
}

function toggleShowAll() {
  state.showAll = !state.showAll;
  updateViewMenuChecks();

  // Re-render everything that uses show all state
  if (window._renderMeasurement) window._renderMeasurement();
  if (window._renderAnchors) window._renderAnchors();
  if (window._renderDividers) window._renderDividers();
}

function toggleShowAllMeasurements() {
  if (state.showAll) return; // Disabled when Show All is active
  state.showAllMeasurements = !state.showAllMeasurements;
  updateViewMenuChecks();
  if (window._renderMeasurement) window._renderMeasurement();
}

function toggleShowAllLinks() {
  if (state.showAll) return; // Disabled when Show All is active
  state.showAllLinks = !state.showAllLinks;
  updateViewMenuChecks();
  if (window._renderAnchors) window._renderAnchors();
}

function toggleShowAllDividers() {
  if (state.showAll) return; // Disabled when Show All is active
  state.showAllDividers = !state.showAllDividers;
  updateViewMenuChecks();
  if (window._renderDividers) window._renderDividers();
}

function toggleAlwaysShowAlignment() {
  state.alwaysShowAlignment = !state.alwaysShowAlignment;
  updateViewMenuChecks();
  updateAlignmentBarVisibility();
}

function toggleAlwaysShowSaveControls() {
  state.alwaysShowSaveControls = !state.alwaysShowSaveControls;
  updateViewMenuChecks();
  updateSaveControlsVisibility();
}

function toggleAlwaysShowShortcuts() {
  state.alwaysShowShortcuts = !state.alwaysShowShortcuts;
  updateViewMenuChecks();
  updateToolbarShortcuts();
}

function updateToolbarShortcuts() {
  // Update toolbar buttons to show/hide shortcuts
  const shortcuts = {
    'btnMeasure': 'M',
    'btnAnchor': 'Link',
    'btnDivider': 'D',
    'btnElevation': 'E',
    'btnFixtures': 'F'
  };

  Object.entries(shortcuts).forEach(([id, key]) => {
    const btn = document.getElementById(id);
    if (btn) {
      let span = btn.querySelector('.btn-shortcut');
      if (state.alwaysShowShortcuts) {
        if (!span) {
          span = document.createElement('span');
          span.className = 'btn-shortcut';
          span.textContent = key;
          btn.appendChild(span);
        }
      } else {
        if (span) span.remove();
      }
    }
  });
}

function updateAlignmentBarVisibility() {
  const alignmentBar = document.getElementById('alignmentBar');
  if (!alignmentBar) return;

  const hasSelection = state.selectedFurniture.size > 0;

  if (state.alwaysShowAlignment) {
    alignmentBar.style.display = 'flex';
    // Disable buttons when nothing is selected
    alignmentBar.querySelectorAll('.align-btn').forEach(btn => {
      btn.disabled = !hasSelection;
    });
  } else {
    alignmentBar.style.display = hasSelection ? 'flex' : 'none';
  }
}

function updateSaveControlsVisibility() {
  const anchorSaveBar = document.getElementById('anchorSaveBar');
  const anchorEditBar = document.getElementById('anchorEditBar');

  // Determine if save controls should be shown based on anchor mode state
  const shouldShowSave = state.anchorMode && state.anchorSource !== null && state.anchorTarget !== null;
  const shouldShowEdit = state.editingAnchor !== null;

  if (state.alwaysShowSaveControls) {
    if (anchorSaveBar) {
      anchorSaveBar.style.display = 'flex';
      anchorSaveBar.querySelectorAll('.align-btn').forEach(btn => {
        btn.disabled = !shouldShowSave;
      });
    }
    if (anchorEditBar) {
      anchorEditBar.style.display = 'flex';
      anchorEditBar.querySelectorAll('.align-btn').forEach(btn => {
        btn.disabled = !shouldShowEdit;
      });
    }
  } else {
    if (anchorSaveBar) anchorSaveBar.style.display = shouldShowSave ? 'flex' : 'none';
    if (anchorEditBar) anchorEditBar.style.display = shouldShowEdit ? 'flex' : 'none';
  }
}

function clearAllFurniture() {
  if (!confirm('Remove all furniture from the floor plan? This will move everything back to staging.')) return;
  pushHistory();
  initDefaults();
  renderFurniture();
  renderStagingFurniture();
  saveToCache();
}

function resetFurniture() {
  pushHistory();
  initDefaults();
  renderFurniture();
  renderStagingFurniture();
  saveToCache();
}

// ===== MENU HELPER =====
function closeAllMenus() {
  // Close all parent menus
  const menus = ['viewMenu', 'exportMenu', 'importMenu'];
  menus.forEach(id => {
    const menu = document.getElementById(id);
    if (menu) menu.style.display = 'none';
  });

  // Close any open submenu
  if (currentSubmenu) {
    const submenu = document.getElementById(currentSubmenu);
    if (submenu) submenu.style.display = 'none';
    currentSubmenu = null;
  }
}

// ===== VIEW MENU =====
function toggleViewMenu() {
  const menu = document.getElementById('viewMenu');
  const btn = document.querySelector('[onclick="toggleViewMenu()"]');

  if (menu && btn) {
    const isVisible = menu.style.display === 'block';

    if (isVisible) {
      closeAllMenus();
    } else {
      // Close all other menus first
      closeAllMenus();

      // Position menu above the button
      const rect = btn.getBoundingClientRect();
      menu.style.display = 'block';
      menu.style.left = rect.left + 'px';
      menu.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
      menu.style.top = 'auto';

      updateViewMenuChecks();

      // Close on click outside
      setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
          if (!e.target.closest('.toolbar-dropdown') && !e.target.closest('.toolbar-menu') && !e.target.closest('.toolbar-submenu')) {
            closeAllMenus();
            document.removeEventListener('click', closeMenu);
          }
        });
      }, 0);
    }
  }
}

// ===== EXPORT MENU =====
function toggleExportMenu() {
  const menu = document.getElementById('exportMenu');
  const btn = document.querySelector('[onclick="toggleExportMenu()"]');

  if (menu && btn) {
    const isVisible = menu.style.display === 'block';

    if (isVisible) {
      closeAllMenus();
    } else {
      // Close all other menus first
      closeAllMenus();

      // Position menu above the button
      const rect = btn.getBoundingClientRect();
      menu.style.display = 'block';
      menu.style.left = rect.left + 'px';
      menu.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
      menu.style.top = 'auto';

      // Close on click outside
      setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
          if (!e.target.closest('.toolbar-dropdown') && !e.target.closest('.toolbar-menu')) {
            closeAllMenus();
            document.removeEventListener('click', closeMenu);
          }
        });
      }, 0);
    }
  }
}

// ===== IMPORT MENU =====
function toggleImportMenu() {
  const menu = document.getElementById('importMenu');
  const btn = document.querySelector('[onclick="toggleImportMenu()"]');

  if (menu && btn) {
    const isVisible = menu.style.display === 'block';

    if (isVisible) {
      closeAllMenus();
    } else {
      // Close all other menus first
      closeAllMenus();

      // Position menu above the button
      const rect = btn.getBoundingClientRect();
      menu.style.display = 'block';
      menu.style.left = rect.left + 'px';
      menu.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
      menu.style.top = 'auto';

      // Close on click outside
      setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
          if (!e.target.closest('.toolbar-dropdown') && !e.target.closest('.toolbar-menu')) {
            closeAllMenus();
            document.removeEventListener('click', closeMenu);
          }
        });
      }, 0);
    }
  }
}

// ===== UNIT MANAGEMENT =====
function toggleUnitMenu() {
  const menu = document.getElementById('unitMenu');
  if (menu) {
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';

    // Close on click outside
    if (!isVisible) {
      setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
          if (!e.target.closest('.toolbar-dropdown')) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
          }
        });
      }, 0);
    }
  }
}

function selectUnit(unit) {
  setUnit(unit);
  updateUnitDisplay();
  // Re-render everything that shows distances
  renderMeasurement();
  renderAnchors();
  renderElevation();
  // Rebuild SVG to update dimension labels
  buildSVG();
  renderFurniture();
  // Close menus
  const viewMenu = document.getElementById('viewMenu');
  if (viewMenu) viewMenu.style.display = 'none';
  const unitMenu = document.getElementById('unitMenu');
  if (unitMenu) unitMenu.style.display = 'none';
}

// Cycle units (for keyboard shortcut)
function cycleUnits() {
  cycleUnit();
  updateUnitDisplay();
  // Re-render everything that shows distances
  renderMeasurement();
  renderAnchors();
  renderElevation();
  // Rebuild SVG to update dimension labels
  buildSVG();
  renderFurniture();
}

function updateUnitDisplay() {
  const unitLabel = document.getElementById('unitLabel');
  if (unitLabel) unitLabel.textContent = getUnit().toUpperCase();
  const scaleSpan = document.getElementById('scaleDisplay');
  // PPI is always pixels-per-inch regardless of display unit
  if (scaleSpan) scaleSpan.textContent = `1" = ${PPI}px`;

  // Update unit checkmarks
  const currentUnit = getUnit();
  const unitCheckIn = document.getElementById('unitCheckIn');
  const unitCheckFt = document.getElementById('unitCheckFt');
  const unitCheckCm = document.getElementById('unitCheckCm');
  const unitCheckM = document.getElementById('unitCheckM');

  if (unitCheckIn) unitCheckIn.textContent = currentUnit === 'in' ? '✓' : '';
  if (unitCheckFt) unitCheckFt.textContent = currentUnit === 'ft' ? '✓' : '';
  if (unitCheckCm) unitCheckCm.textContent = currentUnit === 'cm' ? '✓' : '';
  if (unitCheckM) unitCheckM.textContent = currentUnit === 'm' ? '✓' : '';
}

// ===== SUBMENU MANAGEMENT =====
let currentSubmenu = null;

function showSubmenu(id, event) {
  event.stopPropagation(); // Prevent closing parent menu

  // Toggle submenu if clicking the same one
  if (currentSubmenu === id) {
    const submenu = document.getElementById(id);
    if (submenu) {
      submenu.style.display = 'none';
      currentSubmenu = null;
    }
    return;
  }

  // Close any currently open submenu
  if (currentSubmenu) {
    const prevSubmenu = document.getElementById(currentSubmenu);
    if (prevSubmenu) {
      prevSubmenu.style.display = 'none';
    }
  }

  const submenu = document.getElementById(id);
  if (!submenu) return;

  const button = event.target.closest('button');
  if (!button) return;

  const parentMenu = button.closest('.toolbar-menu');
  if (!parentMenu) return;

  const parentRect = parentMenu.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();

  // Set display first
  submenu.style.display = 'block';
  submenu.style.visibility = 'visible';
  submenu.style.opacity = '1';
  currentSubmenu = id;

  // Position submenu directly to the right of the parent menu, aligned with the button
  const leftPos = parentRect.right + 4;

  // Get submenu height to calculate proper positioning
  const submenuHeight = submenu.offsetHeight;
  const viewportHeight = window.innerHeight;

  // Start with button top, but adjust if it goes off screen
  let topPos = buttonRect.top;

  // If submenu would go below viewport, align bottom with button bottom
  if (topPos + submenuHeight > viewportHeight) {
    topPos = Math.max(0, buttonRect.bottom - submenuHeight);
  }

  // If still too tall, align to bottom of viewport
  if (topPos + submenuHeight > viewportHeight) {
    topPos = viewportHeight - submenuHeight - 10;
  }

  submenu.style.position = 'fixed';
  submenu.style.left = leftPos + 'px';
  submenu.style.top = topPos + 'px';
  submenu.style.bottom = 'auto';
  submenu.style.right = 'auto';
  submenu.style.zIndex = '10001';
  submenu.style.pointerEvents = 'auto';
}

function hideSubmenu(id) {
  const submenu = document.getElementById(id);
  if (submenu) {
    submenu.style.display = 'none';
    if (currentSubmenu === id) {
      currentSubmenu = null;
    }
  }
}

// ===== RESET CONFIRMATION =====
function confirmReset() {
  if (confirm('Reset the floor plan layout? This will remove all furniture from the plan and move it back to staging.')) {
    resetFurniture();
  }
}

// ===== WALL ANCHOR HELPER =====
// Get all 9 anchor points for an object
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

// Find the pair of closest anchor points between two objects
function findClosestAnchorPointsBetween(ax, ay, aw, ah, bx, by, bw, bh) {
  const aPts = getAnchorPoints(ax, ay, aw, ah);
  const bPts = getAnchorPoints(bx, by, bw, bh);

  let minDist = Infinity;
  let sourcePoint = 'center';
  let targetPoint = 'center';

  for (const [aName, aPt] of Object.entries(aPts)) {
    for (const [bName, bPt] of Object.entries(bPts)) {
      const dx = bPt.x - aPt.x;
      const dy = bPt.y - aPt.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < minDist) {
        minDist = dist;
        sourcePoint = aName;
        targetPoint = bName;
      }
    }
  }

  return { sourcePoint, targetPoint };
}

// Expose for use in furniture.js
window.findClosestAnchorPointsBetween = findClosestAnchorPointsBetween;

// Determine which wall side the click is closest to, relative to the source furniture
function determineWallSide(sourceIdx, clickX, clickY) {
  const p = state.placedFurniture[sourceIdx];
  if (!p || p.x < 0 || p.y < 0) return null;
  const d = getFurnitureDef(p.id);
  if (!d) return null;
  const pw = p.rotated ? d.h : d.w;
  const ph = p.rotated ? d.w : d.h;
  const cx = p.x + pw/2, cy = p.y + ph/2;
  const dx = clickX - cx, dy = clickY - cy;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 'left' : 'right';
  }
  return dy < 0 ? 'top' : 'bottom';
}

// ===== CANVAS EVENTS =====
function attachCanvasEvents() {
  const ctr = document.getElementById('canvasContainer');

  // Wheel zoom
  ctr.addEventListener('wheel', e => {
    e.preventDefault();
    const r = ctr.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const oz = state.zoom;
    state.zoom = Math.max(0.15, Math.min(15, state.zoom * (e.deltaY > 0 ? 0.88 : 1.12)));
    state.panX = mx - (mx - state.panX) * (state.zoom / oz);
    state.panY = my - (my - state.panY) * (state.zoom / oz);
    applyTransform();
  }, { passive: false });

  // Mousedown: pan, measure, anchor, or fixture edit
  ctr.addEventListener('mousedown', e => {
    if (e.target.closest('.furniture-piece')) return;

    const r = ctr.getBoundingClientRect();
    const clickX = Math.round(((e.clientX - r.left - state.panX) / state.zoom - PAD) / PPI);
    const clickY = Math.round(((e.clientY - r.top - state.panY) / state.zoom - PAD) / PPI);

    // Fixture edit mode: check if clicking a fixture
    if (state.fixtureEditMode && e.button === 0) {
      if (handleFixtureClick(clickX, clickY, e)) return;
    }

    // Divider mode: place divider points
    if (state.dividerMode && e.button === 0) {
      if (handleDividerClick(clickX, clickY)) return;
    }

    // Anchor mode: check if clicking a fixture, otherwise create wall anchor
    // Only create wall/fixture anchors if no target is selected yet
    if (state.anchorMode && state.anchorSource !== null && state.anchorTarget === null && e.button === 0) {
      e.stopPropagation();

      // Check if clicking on a fixture
      const fixtures = window.getFixtures ? window.getFixtures() : [];
      let clickedFixture = null;
      let fixtureId = null;

      for (const fix of fixtures) {
        if (clickX >= fix.x && clickX <= fix.x + fix.w &&
            clickY >= fix.y && clickY <= fix.y + fix.h) {
          clickedFixture = fix;
          fixtureId = fix.id;
          break;
        }
      }

      const src = state.placedFurniture[state.anchorSource];
      if (src) {
        if (!src.anchors) src.anchors = [];

        const srcDef = getFurnitureDef(src.id);
        if (!srcDef) return;
        const srcW = src.rotated ? srcDef.h : srcDef.w;
        const srcH = src.rotated ? srcDef.w : srcDef.h;

        if (clickedFixture && fixtureId) {
          // Create anchor to fixture with specific anchor points
          if (!src.anchors.find(a => a.type === 'fixture' && a.id === fixtureId)) {
            // Find closest anchor points between source and fixture
            const { sourcePoint, targetPoint } = findClosestAnchorPointsBetween(
              src.x, src.y, srcW, srcH,
              clickedFixture.x, clickedFixture.y, clickedFixture.w, clickedFixture.h
            );

            src.anchors.push({
              type: 'fixture',
              id: fixtureId,
              sourcePoint,
              targetPoint
            });
            saveToCache();
          }
        } else {
          // Create anchor to wall
          const wallSide = determineWallSide(state.anchorSource, clickX, clickY);
          if (wallSide && !src.anchors.find(a => a.type === 'wall' && a.wallSide === wallSide)) {
            src.anchors.push({ type: 'wall', wallSide });
            saveToCache();
          }
        }

        state.anchorSource = null;
        renderAnchors();
      }
      return;
    }

    // Measure mode click
    if (state.measureMode && e.button === 0) {
      e.stopPropagation();
      if (!state.measureStart) {
        state.measureStart = { x: clickX, y: clickY, edge: 'floor' };
        state.measureEnd = null;
        state.measurePreview = null;
        state.measureShiftKey = e.shiftKey;
      } else if (!state.measureEnd) {
        state.measureEnd = { x: clickX, y: clickY, edge: 'floor' };
        state.measurePreview = null;
        // Capture shift key state for 45-degree snap
        state.measureShiftKey = e.shiftKey;
      } else {
        state.measureStart = { x: clickX, y: clickY, edge: 'floor' };
        state.measureEnd = null;
        state.measurePreview = null;
        state.measureShiftKey = e.shiftKey;
      }
      renderMeasurement();
      return;
    }

    // Clear selection on empty space click (unless shift)
    if (!e.shiftKey && state.selectedFurniture.size > 0) {
      clearSelection();
    }

    // Start panning
    if (e.button === 0) {
      state.isPanning = true;
      state.panStart = { x: e.clientX - state.panX, y: e.clientY - state.panY };
      ctr.classList.add('panning');
    }
  });

  // Mousemove: drag furniture, fixture, or pan
  document.addEventListener('mousemove', e => {
    // Fixture dragging
    if (state.fixtureEditMode && handleFixtureDragMove(e)) return;
    // Furniture dragging takes priority
    if (handleDragMove(e)) return;

    // Cursor position calculation
    const r2 = ctr.getBoundingClientRect();
    const cx = Math.round(((e.clientX - r2.left - state.panX) / state.zoom - PAD) / PPI);
    const cy = Math.round(((e.clientY - r2.top - state.panY) / state.zoom - PAD) / PPI);

    // Measurement preview: if first point is set, show line following cursor
    if (state.measureMode && state.measureStart && !state.measureEnd) {
      state.measurePreview = { x: cx, y: cy, edge: 'floor' };
      state.measureShiftKey = e.shiftKey; // Update shift state for live preview
      renderMeasurement();
    }

    // Divider preview: if first point is set, show line following cursor
    if (state.dividerMode && state.dividerStart) {
      state.dividerPreview = { x: cx, y: cy };
      state.dividerShiftKey = e.shiftKey; // Update shift state for live preview
      renderDividers();
    }

    // Panning
    if (state.isPanning && !state.measureMode) {
      state.panX = e.clientX - state.panStart.x;
      state.panY = e.clientY - state.panStart.y;
      applyTransform();
    }

    // Cursor position display
    const pos = document.getElementById('cursorPos');
    if (pos) pos.textContent = formatDist(cx) + ', ' + formatDist(cy);
  });

  // Mouseup: end drag or pan
  document.addEventListener('mouseup', () => {
    state.isPanning = false;
    ctr.classList.remove('panning');
    if (state.fixtureEditMode) handleFixtureDragEnd();
    handleDragEnd();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    // Undo/Redo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      undo();
      e.preventDefault();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
      redo();
      e.preventDefault();
      return;
    }

    if (e.key === '=' || e.key === '+') { zoomIn(); e.preventDefault(); }
    if (e.key === '-') { zoomOut(); e.preventDefault(); }
    if (e.key === '0') { fitToView(); e.preventDefault(); }
    if (e.key === 'g' || e.key === 'G') { toggleGrid(); e.preventDefault(); }
    if (e.key === 'm' && !e.shiftKey) { toggleMeasure(); e.preventDefault(); }
    if (e.key === 'M' && e.shiftKey) { toggleShowAll(); e.preventDefault(); }
    if (e.key === 'l' || e.key === 'L') {
      // Lock current measurement
      if (state.measureMode && state.measureStart && state.measureEnd) {
        lockCurrentMeasurement();
        e.preventDefault();
      }
    }
    if (e.key === 'e' || e.key === 'E') { toggleElevation(); e.preventDefault(); }
    if (e.key === 'u' || e.key === 'U') { cycleUnits(); e.preventDefault(); }
    if (e.key === 'f' && !e.ctrlKey && !e.metaKey) { toggleFixtureEditMode(); e.preventDefault(); }
    if (e.key === 'd' || e.key === 'D') { toggleDividerMode(); e.preventDefault(); }
    if (e.key === 'Escape') {
      if (state.measureMode) {
        state.measureStart = null;
        state.measureEnd = null;
        renderMeasurement();
      }
      if (state.selectedFurniture.size > 0) {
        clearSelection();
      }
      if (state.selectedMeasurement) {
        state.selectedMeasurement = null;
        if (window._renderMeasurement) window._renderMeasurement();
      }
      if (state.selectedDivider !== null) {
        state.selectedDivider = null;
        if (window._renderDividers) window._renderDividers();
      }
      if (state.anchorMode) {
        state.anchorMode = false;
        state.anchorSource = null;
        document.getElementById('btnAnchor')?.classList.remove('active');
      }
      if (state.fixtureEditMode) {
        toggleFixtureEditMode();
      }
      if (state.dividerMode) {
        state.dividerMode = false;
        state.dividerStart = null;
        document.getElementById('btnDivider')?.classList.remove('active');
        renderDividers();
      }
      e.preventDefault();
    }

    // Delete key - delete selected measurement, divider, or anchor
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.selectedMeasurement?.type === 'locked') {
        if (confirm('Delete this locked measurement?')) {
          pushHistory();
          state.lockedMeasurements.splice(state.selectedMeasurement.idx, 1);
          state.selectedMeasurement = null;
          saveToCache();
          if (window._renderMeasurement) window._renderMeasurement();
        }
        e.preventDefault();
      } else if (state.selectedMeasurement?.type === 'anchor') {
        if (confirm('Delete this anchor?')) {
          pushHistory();
          const piece = state.placedFurniture[state.selectedMeasurement.furnitureIdx];
          if (piece && piece.anchors) {
            piece.anchors.splice(state.selectedMeasurement.anchorIdx, 1);
            if (piece.anchors.length === 0) {
              delete piece.anchors;
            }
          }
          state.selectedMeasurement = null;
          saveToCache();
          if (window._renderAnchors) window._renderAnchors();
        }
        e.preventDefault();
      } else if (state.selectedDivider !== null) {
        if (confirm('Delete this divider?')) {
          pushHistory();
          state.softDividers.splice(state.selectedDivider, 1);
          state.selectedDivider = null;
          saveToCache();
          if (window._renderDividers) window._renderDividers();
        }
        e.preventDefault();
      }
    }

    // Arrow key movement for selected furniture
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      if (state.selectedFurniture.size > 0 && !state.measureMode && !state.anchorMode) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1; // 10 inches with Shift, 1 inch otherwise

        pushHistory();

        for (const idx of state.selectedFurniture) {
          const piece = state.placedFurniture[idx];
          if (piece && piece.x >= 0 && piece.y >= 0) {
            switch (e.key) {
              case 'ArrowLeft': piece.x -= step; break;
              case 'ArrowRight': piece.x += step; break;
              case 'ArrowUp': piece.y -= step; break;
              case 'ArrowDown': piece.y += step; break;
            }
          }
        }

        renderFurniture();
        renderStagingFurniture();
        if (window._renderAnchors) window._renderAnchors();
        if (window._renderMeasurement) window._renderMeasurement();
        saveToCache();
      }
    }
  });
}

// ===== THEME MANAGEMENT =====
function selectTheme(theme) {
  try {
    localStorage.setItem('floor-plan-theme', theme);
  } catch(e) {}

  applyTheme(theme);
  updateThemeCheckmarks();

  // Close menus
  const viewMenu = document.getElementById('viewMenu');
  if (viewMenu) viewMenu.style.display = 'none';
  const themeSubmenu = document.getElementById('themeSubmenu');
  if (themeSubmenu) themeSubmenu.style.display = 'none';
}

function applyTheme(theme) {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('light-mode', !prefersDark);
  } else if (theme === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }

  // Rebuild SVGs with new theme colors
  buildSVG();
  buildStagingSVG();
  renderFurniture();
  renderStagingFurniture();
  renderMeasurement();
  renderAnchors();
  if (state.showElevation) renderElevation();
  if (state.fixtureEditMode) renderFixtureHandles();
  renderDividers();

  // Re-initialize Lucide icons
  if (window.lucide) {
    setTimeout(() => lucide.createIcons(), 0);
  }
}

function updateThemeCheckmarks() {
  try {
    const theme = localStorage.getItem('floor-plan-theme') || 'dark';
    const lightCheck = document.getElementById('themeCheckLight');
    const darkCheck = document.getElementById('themeCheckDark');
    const systemCheck = document.getElementById('themeCheckSystem');

    if (lightCheck) lightCheck.textContent = theme === 'light' ? '✓' : '';
    if (darkCheck) darkCheck.textContent = theme === 'dark' ? '✓' : '';
    if (systemCheck) systemCheck.textContent = theme === 'system' ? '✓' : '';
  } catch(e) {}
}

function loadTheme() {
  try {
    const theme = localStorage.getItem('floor-plan-theme') || 'dark';
    applyTheme(theme);
    updateThemeCheckmarks();

    // Listen for system theme changes if in system mode
    if (theme === 'system') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const currentTheme = localStorage.getItem('floor-plan-theme');
        if (currentTheme === 'system') {
          applyTheme('system');
        }
      });
    }
  } catch(e) {}
}

function toggleTheme() {
  // Legacy function for keyboard shortcut - cycles through themes
  try {
    const theme = localStorage.getItem('floor-plan-theme') || 'dark';
    const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    selectTheme(nextTheme);
  } catch(e) {}
}

// ===== PLAN NAME =====
function savePlanName(name) {
  try {
    localStorage.setItem('fps-plan-name', name);
  } catch(e) {
    console.warn('Failed to save plan name:', e);
  }
}

function loadPlanName() {
  try {
    const saved = localStorage.getItem('fps-plan-name');
    return saved || 'Wizard Study Apartment';
  } catch(e) {
    return 'Wizard Study Apartment';
  }
}

// ===== EXPOSE GLOBAL FUNCTIONS FOR ONCLICK HANDLERS =====
window.toggleGrid = toggleGrid;
window.toggleSnapToGrid = toggleSnapToGrid;
window.selectGridDensity = selectGridDensity;
window.selectRenderQuality = selectRenderQuality;
window.toggleDims = toggleDims;
window.toggleMeasure = toggleMeasure;
window.toggleShowAll = toggleShowAll;
window.toggleShowAllMeasurements = toggleShowAllMeasurements;
window.toggleShowAllLinks = toggleShowAllLinks;
window.toggleShowAllDividers = toggleShowAllDividers;
window.toggleAlwaysShowAlignment = toggleAlwaysShowAlignment;
window.toggleAlwaysShowSaveControls = toggleAlwaysShowSaveControls;
window.toggleAlwaysShowShortcuts = toggleAlwaysShowShortcuts;
window.toggleAnchorMode = toggleAnchorMode;
window.toggleFixtureEditMode = toggleFixtureEditMode;
window.toggleDividerMode = toggleDividerMode;
window.toggleViewMenu = toggleViewMenu;
window.toggleExportMenu = toggleExportMenu;
window.toggleImportMenu = toggleImportMenu;
window.toggleUnitMenu = toggleUnitMenu;
window.selectUnit = selectUnit;
window.clearAllFurniture = clearAllFurniture;
window.resetFurniture = resetFurniture;
window.confirmReset = confirmReset;
window.toggleElevation = toggleElevation;
window.fitToView = fitToView;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.toggleTheme = toggleTheme;
window.selectTheme = selectTheme;
window.showSubmenu = showSubmenu;
window.hideSubmenu = hideSubmenu;
window.savePlanName = savePlanName;
window._updateViewMenuChecks = updateViewMenuChecks;
window._updateAlignmentBarVisibility = updateAlignmentBarVisibility;
window._updateSaveControlsVisibility = updateSaveControlsVisibility;

// ===== INITIALIZATION =====
function init() {
  // Load theme first
  loadTheme();

  // Load state
  if (!loadFromCache()) {
    initDefaults();
  }

  // Initialize undo/redo history
  initHistory();

  // Build SVGs
  buildSVG();
  buildStagingSVG();

  // Render furniture
  renderFurniture();
  renderStagingFurniture();

  // Render dividers
  renderDividers();

  // Build elevation selector
  buildElevationSelector();

  // Attach events
  attachCanvasEvents();

  // Load plan name
  const nameInput = document.getElementById('planNameInput');
  if (nameInput) nameInput.value = loadPlanName();

  // Update unit display
  updateUnitDisplay();

  // Update view menu checkmarks
  updateViewMenuChecks();

  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Expose color picker update function
  window._updateColorPicker = updateColorPicker;

  // Initial view
  requestAnimationFrame(fitToView);
}

// Start
init();

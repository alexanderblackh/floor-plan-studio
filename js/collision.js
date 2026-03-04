/**
 * collision.js — Point-in-polygon testing and 2.5D collision detection
 *
 * Uses ray-casting for polygon containment. Supports elevation-aware
 * collision so stacked objects don't falsely collide.
 */

import { state, getFurnitureDef, getRooms, getFixtures } from './data.js';

/**
 * Ray-casting point-in-polygon test.
 * vertices: [[x,y], [x,y], ...]
 */
export function pointInPolygon(px, py, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i][0], yi = vertices[i][1];
    const xj = vertices[j][0], yj = vertices[j][1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Check if an axis-aligned rectangle is fully contained within a polygon.
 * Tests all 4 corners.
 */
export function rectInPolygon(rx, ry, rw, rh, vertices) {
  return pointInPolygon(rx, ry, vertices) &&
         pointInPolygon(rx + rw, ry, vertices) &&
         pointInPolygon(rx, ry + rh, vertices) &&
         pointInPolygon(rx + rw, ry + rh, vertices);
}

/**
 * Check if two axis-aligned rectangles overlap in 2D
 */
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/**
 * Check if two elevation ranges overlap.
 * Range A: [elevA, elevA + heightA]
 * Range B: [elevB, elevB + heightB]
 */
function elevationsOverlap(elevA, heightA, elevB, heightB) {
  const topA = elevA + heightA;
  const topB = elevB + heightB;
  return elevA < topB && topA > elevB;
}

/**
 * Find which room a point is in (returns room object or null)
 */
export function findRoomAt(x, y) {
  for (const room of getRooms()) {
    if (pointInPolygon(x, y, room.vertices)) {
      return room;
    }
  }
  return null;
}

/**
 * Find which room a rectangle is fully in (all 4 corners must be in same room)
 */
export function findRoomForRect(x, y, w, h) {
  for (const room of getRooms()) {
    if (rectInPolygon(x, y, w, h, room.vertices)) {
      return room;
    }
  }
  return null;
}

/**
 * Get the bounding box of a room (for alignment snapping)
 */
export function getRoomBounds(roomId) {
  const room = getRooms().find(r => r.id === roomId);
  if (!room) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of room.vertices) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  // Account for closet obstacles that reduce usable space
  const fixtures = getFixtures().filter(f => f.obstacle);
  // For bedroom, the usable Y starts below closets
  if (roomId === 'bedroom') {
    for (const fix of fixtures) {
      if (fix.x >= minX && fix.x + fix.w <= maxX && fix.y >= minY && fix.y + fix.h <= maxY) {
        minY = Math.max(minY, fix.y + fix.h);
      }
    }
  }

  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/**
 * Check if a furniture piece collides with obstacles (fixtures, non-placeable areas)
 */
function checkFixtureCollision(px, py, pw, ph) {
  for (const fix of getFixtures()) {
    if (!fix.obstacle) continue;
    if (rectsOverlap(px, py, pw, ph, fix.x, fix.y, fix.w, fix.h)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if furniture piece overlaps any other placed furniture,
 * accounting for elevation (stacked items don't collide)
 */
function checkFurnitureOverlap(piece, idx, pw, ph) {
  const def = getFurnitureDef(piece.id);
  const pieceElev = piece.elevation || 0;
  const pieceHeight = def.height || 1;

  for (let i = 0; i < state.placedFurniture.length; i++) {
    if (i === idx) continue;
    const other = state.placedFurniture[i];
    if (other.x < 0 || other.y < 0) continue; // skip staging items
    const od = getFurnitureDef(other.id);
    if (!od) continue;
    const ow = other.rotated ? od.h : od.w;
    const oh = other.rotated ? od.w : od.h;

    // Check 2D overlap
    if (!rectsOverlap(piece.x, piece.y, pw, ph, other.x, other.y, ow, oh)) {
      continue; // no XY overlap, no collision
    }

    // Check elevation overlap (if they share XY space, only collide if Z ranges overlap)
    const otherElev = other.elevation || 0;
    const otherHeight = od.height || 1;
    if (elevationsOverlap(pieceElev, pieceHeight, otherElev, otherHeight)) {
      return true;
    }
  }
  return false;
}

/**
 * Main collision check for a furniture piece.
 * Returns true if the piece is in an invalid position.
 */
export function checkCollision(piece, idx) {
  const def = getFurnitureDef(piece.id);
  if (!def) return false;
  const pw = piece.rotated ? def.h : def.w;
  const ph = piece.rotated ? def.w : def.h;

  // If in staging area, no collision
  if (piece.x < 0 || piece.y < 0) return false;

  // If currently dragging this piece, don't show collision
  if (state.dragging === idx) return false;

  // Check if the piece is fully within a placeable room
  const room = findRoomForRect(piece.x, piece.y, pw, ph);
  if (!room) {
    // Piece is not fully inside any single room — collision
    // Exception: allow placing near room boundaries with small tolerance
    return true;
  }
  if (!room.placeable) {
    return true; // can't place furniture in non-placeable rooms (kitchen, bathroom)
  }

  // Check fixture obstacles (closets)
  if (checkFixtureCollision(piece.x, piece.y, pw, ph)) {
    return true;
  }

  // Check furniture-to-furniture overlap (with elevation awareness)
  return checkFurnitureOverlap(piece, idx, pw, ph);
}

/**
 * Find what a piece is stacked on (returns the furniture piece underneath, or null)
 * A piece is "on" another if:
 * - Their XY bounding boxes overlap significantly (>50% of the top piece)
 * - The bottom piece is stackable
 * - The top piece's elevation matches the bottom piece's surface height
 */
export function findStackBase(piece, idx) {
  const def = getFurnitureDef(piece.id);
  if (!def) return null;
  const pw = piece.rotated ? def.h : def.w;
  const ph = piece.rotated ? def.w : def.h;

  let bestBase = null;
  let bestSurface = -1;

  for (let i = 0; i < state.placedFurniture.length; i++) {
    if (i === idx) continue;
    const other = state.placedFurniture[i];
    if (other.x < 0 || other.y < 0) continue;
    const od = getFurnitureDef(other.id);
    if (!od || !od.stackable) continue;

    const ow = other.rotated ? od.h : od.w;
    const oh = other.rotated ? od.w : od.h;

    // Check XY overlap
    const overlapX = Math.max(0, Math.min(piece.x + pw, other.x + ow) - Math.max(piece.x, other.x));
    const overlapY = Math.max(0, Math.min(piece.y + ph, other.y + oh) - Math.max(piece.y, other.y));
    const overlapArea = overlapX * overlapY;
    const pieceArea = pw * ph;

    // Need >50% overlap to count as "on top of"
    if (overlapArea / pieceArea > 0.5) {
      const otherSurface = (other.elevation || 0) + (od.surfaceHeight || od.height || 0);
      if (otherSurface > bestSurface) {
        bestSurface = otherSurface;
        bestBase = { index: i, piece: other, surfaceHeight: otherSurface };
      }
    }
  }

  return bestBase;
}

/**
 * Auto-stack: when a piece is dropped on a stackable surface, set its elevation
 */
export function autoStack(piece, idx) {
  const base = findStackBase(piece, idx);
  if (base) {
    piece.elevation = base.surfaceHeight;
    piece.stackedOn = base.piece.id;
  } else {
    piece.elevation = 0;
    piece.stackedOn = null;
  }
}

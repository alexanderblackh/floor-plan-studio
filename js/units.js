/**
 * units.js — Unit conversion and display formatting
 *
 * All internal measurements are stored in inches.
 * This module converts for display in: inches, feet, cm, meters.
 */

import { state } from './data.js';

// Conversion factors FROM inches
const CONVERSIONS = {
  'in':  { factor: 1,       suffix: '"',   decimals: 0 },
  'ft':  { factor: 1/12,    suffix: "'",   decimals: 1 },
  'cm':  { factor: 2.54,    suffix: 'cm',  decimals: 1 },
  'm':   { factor: 0.0254,  suffix: 'm',   decimals: 2 }
};

const UNIT_LABELS = {
  'in': 'Inches',
  'ft': 'Feet',
  'cm': 'Centimeters',
  'm':  'Meters'
};

/**
 * Get the current display unit
 */
export function getUnit() {
  return state.displayUnit || 'in';
}

/**
 * Convert inches to display unit and format
 */
export function formatDist(inches) {
  const unit = getUnit();
  const conv = CONVERSIONS[unit];
  const val = inches * conv.factor;
  if (conv.decimals === 0) return `${Math.round(val)}${conv.suffix}`;
  return `${val.toFixed(conv.decimals)}${conv.suffix}`;
}

/**
 * Convert inches to display unit value (number only)
 */
export function convertFromInches(inches) {
  const unit = getUnit();
  return inches * CONVERSIONS[unit].factor;
}

/**
 * Convert from display unit back to inches
 */
export function convertToInches(value) {
  const unit = getUnit();
  return value / CONVERSIONS[unit].factor;
}

/**
 * Get the unit suffix
 */
export function getUnitSuffix() {
  return CONVERSIONS[getUnit()].suffix;
}

/**
 * Get human-readable unit name
 */
export function getUnitLabel() {
  return UNIT_LABELS[getUnit()];
}

/**
 * Cycle to next unit
 */
export function cycleUnit() {
  const units = Object.keys(CONVERSIONS);
  const current = getUnit();
  const idx = units.indexOf(current);
  state.displayUnit = units[(idx + 1) % units.length];
}

/**
 * Set unit directly
 */
export function setUnit(unit) {
  if (CONVERSIONS[unit]) {
    state.displayUnit = unit;
  }
}

/**
 * Get all available units for building UI
 */
export function getAvailableUnits() {
  return Object.entries(UNIT_LABELS).map(([id, label]) => ({ id, label }));
}

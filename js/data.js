/**
 * data.js — Floor Plan Schema, Default Plan, and State Management
 *
 * The floor plan is defined as a JSON-serializable object with:
 * - rooms: polygon vertices (supports L-shapes, jogs, any axis-aligned shape)
 * - walls: line segments with optional doors/windows/heaters
 * - fixtures: built-in elements (counters, closets, sinks)
 * - dimensions: measurement labels
 * - furniture: available pieces with 2.5D height data
 *
 * Elevation model: each furniture piece has:
 * - height: physical height of the object (inches)
 * - surfaceHeight: height of its usable top surface (may differ from height)
 * - stackable: whether other items can be placed on top
 * - elevation: current height from floor (0 = on floor)
 * - stackedOn: id of furniture this piece is sitting on (null = floor)
 */

// ===== CONSTANTS =====
export const PPI = 2;
export const S = (i) => i * PPI;
export const PAD = S(30);

// ===== DEFAULT FLOOR PLAN =====
export const DEFAULT_FLOOR_PLAN = {
  name: "Wizard Study Apartment",
  version: "3.0",
  units: "inches",
  scale: 2,

  rooms: [
    {
      id: "living", name: "Living Room",
      vertices: [[0,0],[83,0],[83,93],[125,93],[125,255],[0,255]],
      color: "#18182288", placeable: true,
      labelSize: 16, labelOffset: [0, 30]
    },
    {
      id: "kitchen", name: "Kitchen",
      vertices: [[83,0],[158,0],[158,93],[83,93]],
      color: "#1a1a2088", placeable: false,
      labelSize: 12
    },
    {
      id: "bathroom", name: "Bathroom",
      vertices: [[158,0],[217,0],[217,83],[158,83]],
      color: "#15151d88", placeable: false,
      labelSize: 11
    },
    {
      id: "bedroom", name: "Bedroom",
      vertices: [[125,93],[246,93],[246,255],[125,255]],
      color: "#16161e88", placeable: true,
      labelSize: 14, labelOffset: [0, -35]
    }
  ],

  walls: [
    // --- Living Room Exterior ---
    { from: [0,0], to: [0,255], type: "exterior" },
    {
      from: [0,0], to: [83,0], type: "exterior",
      window: { from: [3,0], to: [52,0] },
      door: { from: [55,0], to: [80,0], type: "swing",
              arc: { cx: 80, cy: 0, r: 25, start: 90, end: 175 } },
      label: { text: "BACK DOOR WALL", x: 41.5, y: -12 }
    },
    // Interior wall (upper, with kitchen sliding door)
    { from: [83,0], to: [83,32], type: "exterior" },
    { from: [83,32], to: [83,62], type: "sliding",
      door: { from: [83,32], to: [83,62], type: "sliding" } },
    { from: [83,62], to: [83,93], type: "exterior" },
    // Heater wall (42" jog)
    { from: [83,93], to: [125,93], type: "exterior",
      heater: { x: 83, y: 93, w: 21, h: 4 } },
    // Lower interior wall with bedroom door
    { from: [125,93], to: [125,108], type: "exterior" },
    { from: [125,108], to: [125,140], type: "door",
      door: { from: [125,108], to: [125,140], type: "swing",
              arc: { cx: 125, cy: 108, r: 32, start: 0, end: 90 } } },
    { from: [125,140], to: [125,255], type: "exterior" },
    // Front door wall
    {
      from: [0,255], to: [246,255], type: "exterior",
      window: { from: [3,255], to: [83,255] },
      door: { from: [88,255], to: [127,255], type: "swing",
              arc: { cx: 88, cy: 255, r: 39, start: -90, end: -5 } },
      label: { text: "FRONT DOOR WALL", x: 62.5, y: 267 }
    },
    // --- Kitchen Walls ---
    { from: [83,0], to: [158,0], type: "exterior" },
    { from: [158,0], to: [158,93], type: "exterior" },
    // --- Bathroom Walls ---
    { from: [158,0], to: [217,0], type: "exterior",
      window: { from: [168,0], to: [192,0] } },
    { from: [217,0], to: [217,83], type: "exterior" },
    { from: [158,83], to: [217,83], type: "exterior" },
    // --- Bedroom Walls ---
    { from: [246,93], to: [246,255], type: "exterior" },
    { from: [125,93], to: [246,93], type: "exterior" },
    // --- Hallway Walls ---
    { from: [168.5,93], to: [168.5,66], type: "thin" },
    { from: [202.5,93], to: [202.5,66], type: "thin" },
    // Bathroom door at hallway
    { from: [168.5,66], to: [202.5,66], type: "door",
      door: { from: [168.5,66], to: [202.5,66], type: "swing",
              arc: { cx: 202.5, cy: 66, r: 34, start: 180, end: 265 } } }
  ],

  fixtures: [
    // --- Closets ---
    {
      id: "closet-left", type: "closet",
      x: 125, y: 93, w: 43.5, h: 24,
      color: "#2a2a3a55", stroke: "#33334488", dashed: true,
      label: "Closet", obstacle: true,
      doors: {
        x: 138.75, y: 117, w: 16, type: "double",
        arcs: [
          { cx: 146.75, cy: 117, r: 8, start: 185, end: 270 },
          { cx: 146.75, cy: 117, r: 8, start: 270, end: 355 }
        ]
      },
      frontWalls: [
        { from: [125,117], to: [138.75,117] },
        { from: [154.75,117], to: [168.5,117] }
      ]
    },
    {
      id: "closet-right", type: "closet",
      x: 202.5, y: 93, w: 43.5, h: 24,
      color: "#2a2a3a55", stroke: "#33334488", dashed: true,
      label: "Closet", obstacle: true,
      doors: {
        x: 213.75, y: 117, w: 21, type: "double",
        arcs: [
          { cx: 224.25, cy: 117, r: 10.5, start: 185, end: 270 },
          { cx: 224.25, cy: 117, r: 10.5, start: 270, end: 355 }
        ]
      },
      frontWalls: [
        { from: [202.5,117], to: [213.75,117] },
        { from: [234.75,117], to: [246,117] }
      ]
    },
    // --- Kitchen Fixtures ---
    { id: "left-counter", type: "counter",
      x: 86, y: 0, w: 24, h: 22,
      color: "#4a4a3a", stroke: "#5a5a4a", label: "COUNTER",
      obstacle: false, surfaceHeight: 36 },
    { id: "sink", type: "counter",
      x: 111, y: 0, w: 20, h: 22,
      color: "#3a3a4a", stroke: "#555", label: "SINK",
      obstacle: false, surfaceHeight: 36 },
    { id: "right-counter", type: "counter",
      x: 132, y: 0, w: 24, h: 22,
      color: "#4a4a3a", stroke: "#5a5a4a", label: "COUNTER",
      obstacle: false, surfaceHeight: 36 },
    { id: "oven", type: "appliance",
      x: 83, y: 65, w: 30, h: 28,
      color: "#3a3a3a", stroke: "#555", label: "OVEN",
      obstacle: false, surfaceHeight: 36 },
    { id: "fridge", type: "appliance",
      x: 126, y: 65, w: 30, h: 28,
      color: "#3a3a3a", stroke: "#555", label: "FRIDGE",
      obstacle: false, surfaceHeight: 70 }
  ],

  dimensions: [
    { from: [0,0], to: [0,255], label: '255"', rotation: -90, offset: -12 },
    { from: [0,0], to: [83,0], label: '83"', offset: -8 },
    { from: [0,255], to: [127,255], label: '127"', offset: 20, dx: 20 },
    { from: [83,93], to: [125,93], label: '42" jog', offset: -8, size: 7, color: '#666' },
    { from: [83,0], to: [158,0], label: '75"', offset: -8, size: 7 },
    { from: [125,255], to: [246,255], label: '121"', offset: 20, size: 7 },
    { from: [246,93], to: [246,255], label: '162"', rotation: -90, offset: 10, size: 7 }
  ],

  // Named walls for elevation view (which wall to look at head-on)
  elevationWalls: [
    { id: "back-door", name: "Back Door Wall", facing: "south",
      from: [0,0], to: [83,0], wallHeight: 96 },
    { id: "left-wall", name: "Left Wall (Living)", facing: "east",
      from: [0,0], to: [0,255], wallHeight: 96 },
    { id: "front-door", name: "Front Door Wall", facing: "north",
      from: [0,255], to: [246,255], wallHeight: 96 },
    { id: "bedroom-right", name: "Bedroom Right Wall", facing: "west",
      from: [246,93], to: [246,255], wallHeight: 96 },
    { id: "interior-upper", name: "Kitchen Wall (Interior)", facing: "east",
      from: [83,0], to: [83,93], wallHeight: 96 },
    { id: "interior-lower", name: "Bedroom Wall (Interior)", facing: "east",
      from: [125,93], to: [125,255], wallHeight: 96 }
  ],

  furniture: [
    // --- Living Room ---
    { id:'bar', name:'Vintage Bar', w:62, h:22, color:'#8B6914', stroke:'#a07d1c',
      room:'living', label:'BAR', height: 42, surfaceHeight: 42, stackable: true },
    { id:'tv', name:'58" TV', w:52, h:4, color:'#1a1a2a', stroke:'#2a2a3a',
      room:'living', label:'TV 58"', height: 32, surfaceHeight: 0, stackable: false },
    { id:'couch', name:'Couch', w:73, h:38, color:'#4a6741', stroke:'#5a7a51',
      room:'living', label:'COUCH', height: 34, surfaceHeight: 18, stackable: false },
    { id:'coffee', name:'Coffee Table', w:48, h:24, color:'#5a4a3a', stroke:'#6a5a4a',
      room:'living', label:'COFFEE', height: 18, surfaceHeight: 18, stackable: true },
    { id:'bakers', name:"Baker's Rack", w:72, h:24, color:'#555566', stroke:'#666677',
      room:'living', label:"BAKER'S", height: 63, surfaceHeight: 63, stackable: true },
    { id:'console', name:'Console Table', w:31.5, h:9.8, color:'#6a5a44', stroke:'#7a6a54',
      room:'living', label:'CONSOLE', height: 30, surfaceHeight: 30, stackable: true },
    { id:'tv_lift', name:'TV Lift (VEVOR)', w:20, h:8, color:'#333399', stroke:'#4444bb',
      room:'living', label:'LIFT', height: 28, surfaceHeight: 28, stackable: true },
    { id:'hp_l', name:'HomePod L', w:7, h:7, color:'#1a1a1a', stroke:'#444',
      room:'living', label:'HP', height: 6.6, surfaceHeight: 0, stackable: false },
    { id:'hp_r', name:'HomePod R', w:7, h:7, color:'#1a1a1a', stroke:'#444',
      room:'living', label:'HP', height: 6.6, surfaceHeight: 0, stackable: false },
    { id:'valet', name:'Valet/Cubicles', w:48, h:24, color:'#9a8a3a', stroke:'#aa9a4a',
      room:'living', label:'VALET', height: 36, surfaceHeight: 36, stackable: true },
    // --- Bedroom ---
    { id:'bed', name:'Cal King Bed', w:72, h:84, color:'#3a5a6a', stroke:'#4a6a7a',
      room:'bedroom', label:'BED', height: 25, surfaceHeight: 25, stackable: false },
    { id:'standing_desk', name:'Standing Desk', w:24, h:48, color:'#6a5a7a', stroke:'#7a6a8a',
      room:'bedroom', label:'STAND', height: 44, surfaceHeight: 44, stackable: true },
    { id:'zigzag', name:'Zigzag Stand', w:24, h:12, color:'#7a5a8a', stroke:'#8a6a9a',
      room:'bedroom', label:'ZIGZAG', height: 22, surfaceHeight: 22, stackable: true },
    { id:'desk', name:'Rolling Desk', w:34, h:24, color:'#5a5a44', stroke:'#6a6a54',
      room:'bedroom', label:'DESK', height: 30, surfaceHeight: 30, stackable: true },
    { id:'dresser', name:'Dresser', w:34, h:17, color:'#5a4a6a', stroke:'#6a5a7a',
      room:'bedroom', label:'DRESSER', height: 34, surfaceHeight: 34, stackable: true },
    { id:'bookshelf', name:'Book Shelf', w:25, h:10, color:'#4a5a3a', stroke:'#5a6a4a',
      room:'bedroom', label:'BOOKS', height: 48, surfaceHeight: 48, stackable: true },
    { id:'nightstand', name:'Night Stand', w:16, h:16, color:'#4a3a2a', stroke:'#5a4a3a',
      room:'bedroom', label:'NSTAND', height: 24, surfaceHeight: 24, stackable: true },
    // --- Kitchen ---
    { id:'microwave', name:'Microwave', w:20, h:15, color:'#4a4a4a', stroke:'#5a5a5a',
      room:'kitchen', label:'MICRO', height: 12, surfaceHeight: 12, stackable: true },
    { id:'pantry', name:'Pantry', w:24, h:24, color:'#3a3a5a', stroke:'#4a4a6a',
      room:'kitchen', label:'PANTRY', height: 60, surfaceHeight: 60, stackable: true },
    // --- Wire Shelves ---
    { id:'wire_shelf_1', name:'Wire Shelf 1', w:16, h:12, color:'#707070', stroke:'#888',
      room:'living', label:'WIRE 1', height: 54, surfaceHeight: 54, stackable: true },
    { id:'wire_shelf_2', name:'Wire Shelf 2', w:16, h:12, color:'#707070', stroke:'#888',
      room:'living', label:'WIRE 2', height: 54, surfaceHeight: 54, stackable: true },
    // --- Laundry ---
    { id:'washer', name:'Washer', w:20, h:20, color:'#e8e8e8', stroke:'#bbb',
      room:'kitchen', label:'WASHER', height: 36, surfaceHeight: 36, stackable: true },
    { id:'dryer', name:'Dryer', w:24, h:20, color:'#d8d8e8', stroke:'#aab',
      room:'kitchen', label:'DRYER', height: 36, surfaceHeight: 36, stackable: true }
  ]
};

// ===== APPLICATION STATE =====
// Mutable state shared across modules via import
export const state = {
  floorPlan: JSON.parse(JSON.stringify(DEFAULT_FLOOR_PLAN)),
  placedFurniture: [],
  showGrid: true,
  showDims: true,
  zoom: 1,
  panX: 0,
  panY: 0,
  isPanning: false,
  panStart: { x: 0, y: 0 },
  dragging: null,
  dragOffset: { x: 0, y: 0 },
  measureMode: false,
  measureStart: null,
  measureEnd: null,
  showAllMeasurements: false,
  anchorMode: false,
  anchorSource: null,
  selectedFurniture: new Set(),
  elevationWall: null, // currently viewed elevation wall id
  showElevation: false
};

// ===== HELPERS =====
export function getFurnitureDefs() {
  return state.floorPlan.furniture;
}

export function getFurnitureDef(id) {
  return state.floorPlan.furniture.find(f => f.id === id);
}

export function getRooms() {
  return state.floorPlan.rooms;
}

export function getWalls() {
  return state.floorPlan.walls;
}

export function getFixtures() {
  return state.floorPlan.fixtures;
}

export function getDimensions() {
  return state.floorPlan.dimensions;
}

export function getElevationWalls() {
  return state.floorPlan.elevationWalls || [];
}

/**
 * Initialize furniture placements — all start in staging area
 */
export function initDefaults() {
  state.placedFurniture = [];
  let stagingX = 10;
  let stagingY = 10;
  getFurnitureDefs().forEach(d => {
    state.placedFurniture.push({
      id: d.id,
      x: -stagingX - d.w,
      y: stagingY,
      rotated: false,
      elevation: 0,
      stackedOn: null
    });
    stagingY += d.h + 8;
    if (stagingY > 700) {
      stagingY = 10;
      stagingX += 90;
    }
  });
}

/**
 * Save placement state to localStorage
 */
export function saveToCache() {
  try {
    localStorage.setItem('fps-layout', JSON.stringify(state.placedFurniture));
  } catch(e) { /* quota exceeded or private browsing */ }
}

/**
 * Load placement state from localStorage
 * Returns true if cache existed
 */
export function loadFromCache() {
  try {
    const data = localStorage.getItem('fps-layout');
    if (data) {
      const parsed = JSON.parse(data);
      // Migrate old format: add elevation/stackedOn if missing
      state.placedFurniture = parsed.map(p => ({
        ...p,
        elevation: p.elevation ?? 0,
        stackedOn: p.stackedOn ?? null
      }));
      return true;
    }
  } catch(e) { /* corrupted data */ }
  return false;
}

/**
 * Validate a floor plan object has required fields
 */
export function validateFloorPlan(plan) {
  const errors = [];
  if (!plan.rooms || !Array.isArray(plan.rooms)) errors.push("Missing rooms array");
  if (!plan.walls || !Array.isArray(plan.walls)) errors.push("Missing walls array");
  if (!plan.furniture || !Array.isArray(plan.furniture)) errors.push("Missing furniture array");
  plan.rooms?.forEach((r, i) => {
    if (!r.id) errors.push(`Room ${i} missing id`);
    if (!r.vertices || r.vertices.length < 3) errors.push(`Room ${r.id || i} needs >= 3 vertices`);
  });
  plan.furniture?.forEach((f, i) => {
    if (!f.id) errors.push(`Furniture ${i} missing id`);
    if (!f.w || !f.h) errors.push(`Furniture ${f.id || i} missing dimensions`);
  });
  return errors;
}

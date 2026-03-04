# Wizard Study Apartment — Project State

## Chat Context
Continuing from a Claude.ai conversation about Alex's apartment layout, TV lift installation, and wizard study eclectic maximalist interior design. This document captures everything established so that work can continue in Claude Code.

---

## Apartment Structure (Confirmed Measurements in Inches)

### Overall
- **Ceiling height:** 95"
- **Left exterior wall (full length, top to bottom):** 255"
- The apartment is oriented with the back door at the top, front door at the bottom, exterior wall on the left.

### Living Room — L-Shaped
The living room is NOT a simple rectangle. The interior wall (right side of LR) has a 90° jog that makes the room L-shaped:

```
Back Door Wall (83")
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|                     |← Kitchen wall starts here
|                     |
|   NARROW SECTION    |  (83" wide)
|   (upper LR)        |
|                     |
|                     |____________________
|                     ← 42" heater wall   |
|                                          |
|            WIDE SECTION                  |  (~125-127" wide)
|            (lower LR)                    |
|                                          |
|                                          |
|__________________________________________|
         Front Door Wall (127")
```

- **Upper LR width (back door wall):** 83"
- **Heater wall (perpendicular jog):** 42" — this wall juts to the RIGHT (toward bedroom), creating the step. The heater (21" long) sits on this wall, with 21" between heater and the corner.
- **Lower LR width (front door wall):** 127"
- **Living room depth (back door to front door):** ~159" (full envisioned LR half)
- **Heater wall to bedroom door frame:** 15"
- **Left wall to kitchen wall (at kitchen level):** 85"

### Back Door Wall (Top Wall)
- Total: 83"
- ~2/3 is window, ~1/3 is door (exact split TBD — Alex forgot measurements)
- Needs labels: "Back Door" and window marked

### Front Door Wall (Bottom Wall)
- Total: 127"
- Door: 39" wide
- Door frame to far wall (including window): 85"
- Window is on the left portion, door is on the right portion near the bedroom wall

### Interior Wall (Right Side of Living Room)
Running from top to bottom:
1. Kitchen wall starts at top (shared with back door wall corner)
2. Straight section down ~32" → **Kitchen entry** (sliding door, 30" opening)
3. Continue down 15" → reach the **90° jog**
4. **Heater wall** runs 42" perpendicular to the RIGHT
   - 21" clear wall, then 21" heater
5. From the end of the heater wall, wall continues straight DOWN
6. After 15" → **Bedroom door** (~32" opening, swings INTO bedroom, hits closet directly)
7. Wall continues to bottom (front door wall)

### Kitchen
- **Entry from LR:** Sliding door (not swinging), 30" opening
- **Dimensions:** 93" (window to wall, length) × 75" (door to wall, width)
- Counter: 24" long × 22" deep on each side of sink
- 13" between fridge and oven
- 33" from top cabinet to other cabinet (door to wall length)
- Kitchen sits to the RIGHT of the upper living room section

### Bathroom
- **Access:** Walk between the two bedroom closets (the closet walls form a hallway), then through a bathroom door at the end
- **Bathroom door:** Opens inward (into bathroom)
- **Usable dimensions:** 53" (tub to wall) × 59" (wall to door wall)
- Sink to tub: 31"
- Window: 24" × 25" (on exterior/top wall)
- Bathroom sits ABOVE/BEHIND the bedroom closets, adjacent to kitchen

### Bedroom
- **Entry:** Door from living room (~32"), swings INWARD into bedroom, hits the closet directly when opened
- **Dimensions:** 121" (door wall to far wall) × 162" (closet wall to window/front wall)
- Between bed and door wall: 34" long × 76" deep
- **Closets:** Two closets span the ENTIRE back wall (top wall) of the bedroom
  - Gap between closets = hallway to bathroom
  - Hallway dimensions: 34" wide × 27" deep
  - Closets are flush against the wall
- **Bed:** California King (72" × 84") — positioned near the right wall, lower portion of bedroom

### Bedroom Wall to Door: 109"

---

## Furniture Inventory (with dimensions)

### Living Room
| Piece | Dimensions (W × D × H) | Notes |
|-------|------------------------|-------|
| Vintage Bar | 62" × 22" × 45" | Prohibition-era, hidden compartment for booze. HERO piece. TV sits behind it on VEVOR lift. |
| Couch | 80" × 38" | Floating mid-room |
| Coffee Table | ~48" × 24" | Between couch and bar |
| Baker's Rack | ~72" wide, ~8ft tall, ~24" deep | Very large. Must stay in living room. |
| Console / Fold-out Table | 34" × 36" | Against left wall |
| TV | 65" (screen), ~58" wide unit | Mounted on VEVOR lift behind bar |
| HomePods (2x original) | ~6.8" diameter each | Behind bar, flanking VEVOR lift |
| Rolling Desk | 34" × 24" | Can go in bedroom or LR |

### Bedroom
| Piece | Dimensions |
|-------|-----------|
| Cal King Bed | 72" × 84" |
| Dresser | 34" × 17" |
| Night Stand | 24" × 24" |

---

## TV Lift Plan (VEVOR)

### Unit
- **Model:** VEVOR DSZJ37-65YC000001V1
- **Stroke:** 35.5", height range 28.7"–64.2"
- **Motor:** 24V DC, 1000N, 30mm/s
- **Capacity:** 130 lbs
- **Price:** ~$149–175

### Installation Concept
- VEVOR sits on a weighted freestanding plywood base (36" × 14") behind the bar
- Bar pulled 12–18" from the wall to create gap
- TV rises from behind bar, hidden when retracted (below 45" bar top)
- HomePods on floor behind bar flanking the mechanism
- Cable management via drag chain

### Smart Control
- **Pico W** controller tapping into VEVOR's wired controller contact closures
- Relay module bridges UP/DOWN/COMMON pins
- Limit switches at top/bottom of travel
- HTTP endpoints: /up, /down, /stop, /preset/hidden, /preset/viewing, /preset/standing, /preset/max, /status
- HomeKit integration via HomeBridge (garage door accessory type)
- Siri Shortcuts: "Movie Time" (raise TV + dim lights + lower blinds + HomePod TV audio)

### Full installation plan document exists at:
`/mnt/user-data/outputs/TV-Lift-Installation-Plan.md`

---

## Design Direction

### Aesthetic: Wizard Study / Eclectic Maximalist
- Alex explicitly **abhors minimalism**
- Dark academia, cabinet of curiosities, apothecary vibes
- Layered, dense with interesting objects — not dense with large furniture
- Warm pools of light from multiple sources (no overhead-only)
- Candles, brass, old books, vintage bottles, curiosities
- Deep textiles: oxblood/forest green/navy throws, tapestry pillows, Persian-style rug
- Gallery wall with mismatched frames, botanical prints, maps

### Styling Notes (from conversation)
**Bar:** Flank TV area with brass candlesticks, stacked leather books, small bust or globe. Asymmetric groupings. Barware visible in open shelves. Living, functional piece — not decorative-only.

**Baker's Rack:** Cabinet of curiosities. Top shelves: trailing plants, old bottles. Eye-level: best objects (mortar & pestle, magnifying glass, hourglass, candles). Lower: heavier items, storage baskets, books laid flat. Density without chaos — group in odd numbers, vary heights, repeat materials across shelves.

**Lighting:** Vintage banker's lamp on bar, LED strips behind baker's rack shelves (2700K), floor lamp near couch, candles everywhere.

**Color/Textile:** Deep throws, tapestry/velvet pillows, dark patterned rug (5×7), gallery wall with command strips.

---

## Interactive Floor Plan (In Progress)

### Current State
An HTML floor plan exists at `/mnt/user-data/outputs/apartment-floor-plan.html` but needs significant corrections:

### What Needs Fixing
1. **Living room shape:** Must be L-shaped (narrow top ~83", wide bottom ~127") with the 42" heater wall jog
2. **Kitchen entry:** Should be a sliding door, not a swinging door
3. **Bedroom door:** Swings INWARD into bedroom, hits closet
4. **Bathroom door:** Swings INWARD into bathroom
5. **Closets:** Span full back wall of bedroom, flush against wall. Gap between = hallway to bathroom
6. **No separate hallway room** — the closet walls ARE the hallway walls leading to the bathroom door
7. **Back door wall:** ~2/3 window, ~1/3 door (exact TBD). Label "Back Door"
8. **Front door wall:** 39" door, 85" from door frame to wall including window. Label "Front Door"
9. **Kitchen/Bathroom/Hallway geometry** needs to align with the L-shaped living room

### Features to Add
1. **Staging area:** All furniture starts OUTSIDE the floor plan in a staging area. Click item in sidebar to highlight it on canvas.
2. **Collision detection:** Error indicator when furniture overlaps walls, closets, or other furniture
3. **LocalStorage persistence:** Save furniture positions to cache (NOTE: localStorage doesn't work in Claude.ai artifacts, but DOES work if opened as a standalone HTML file or in Claude Code's browser)
4. **Strong zoom:** Already implemented (scroll wheel, +/-, buttons). Goes up to 12x.
5. **SVG export:** Already implemented

### Tech Stack
- Single HTML file with inline CSS/JS
- SVG-based floor plan
- Vanilla JS (no frameworks)
- Fonts: Cormorant Garamond (display) + JetBrains Mono (UI)
- Dark theme matching wizard study aesthetic

---

## Alex's Context (for tone/approach)
- Owner/operator of CalBurrey Roofing Construction in Santa Barbara
- Experienced React Native dev, familiar with ESP32/Pico embedded work, KiCad PCB design
- Lives alone in a one-bedroom apartment in Santa Barbara
- Semi eco-conscious
- Works part-time at a cigar lounge
- Has a romantic relationship with someone who speaks Cebuano
- Prefers production-ready, polished outputs over conceptual sketches
- Values precise technical documentation
- Communication style: direct, casual, technical when needed

# VEVOR MOTORIZED TV LIFT — INSTALLATION PLAN

**Behind-Bar Pop-Up Configuration for Rental Apartment**

Prepared: March 2026 | Room: Living Room, 9ft × ~12–14ft | Aesthetic: Wizard Study / Eclectic Maximalist

---

## 1. Project Overview

Install a VEVOR motorized TV lift behind a vintage prohibition-era bar (62"W × 22"D × 45"H) so that a 65" TV rises above the bar for viewing and retracts completely out of sight when not in use. The bar remains the room's visual hero piece at all times. When the TV is down, the bar surface is fully available for wizard study styling — bottles, brass candlesticks, curiosities. When the TV is up, it's movie time.

### Design Goals

- TV completely hidden when retracted (below 45" bar top)
- TV rises to comfortable viewing height above the bar
- No wall drilling, no floor screwing (rental-safe)
- HomePods positioned behind the bar for audio
- Smart home integration via Pico W or WiFi relay
- Clean cable management with drag chain
- Total project budget: ~$250–$350 (including lift unit)

---

## 2. VEVOR Unit Specifications

**Model:** DSZJ37-65YC000001V1 (35" Stroke, 32–65" TV Compatible)

| Spec | Value |
|------|-------|
| Material | Carbon steel, powder-coated anti-rust finish |
| Compatible TV Size | 37"–65" |
| Height Range | 28.7"–64.2" (73–163 cm) |
| Stroke Length | 35.5" (90 cm) |
| Lifting Speed | 30 mm/s (~35 seconds full travel) |
| Motor | 24V DC, 1000N force |
| Load Capacity | 130 lbs (58.9 kg) |
| Unit Footprint | 19.1" × 26.1" (base plate) |
| Controls Included | RF wireless remote + wired hand controller |
| Memory Presets | 4 programmable height positions |
| Package Dimensions | 31.5" × 7.9" × 10.2" |

> ⚠️ The RF remote only supports continuous up/down (hold to move). The wired controller has preset buttons. Plan to use the wired controller or add smart control for preset positions.

---

## 3. Spatial Analysis

### 3.1 The Bar

- **Dimensions:** 62" wide × 22" deep × 45" tall
- **Position:** Against the exterior wall (window wall), between or partially overlapping the two windows on the left/long wall of the living room
- **Gap Behind Bar:** 12–18" between bar back and wall/window sill (adjustable)

### 3.2 TV Travel Math

The TV needs to travel from fully hidden to fully visible above the bar:

- Bar top height: 45"
- 65" TV screen height: ~32" (varies by model)
- TV mounted on VEVOR bracket: VESA mount point is the reference height
- **At minimum VEVOR height (28.7"):** TV center is at ~28.7" — well below bar top. TV is hidden.
- **At maximum VEVOR height (64.2"):** TV center is at ~64.2" — bottom edge of TV at ~48". Clears 45" bar with ~3" margin.
- **Ideal viewing preset:** TV center at ~55–58" — bottom edge at ~39–42", partially behind bar but screen fully visible from couch.

> ⚠️ Measure your specific TV height and calculate: Minimum VEVOR height for TV bottom to clear 45" bar = 45" + (TV height / 2). For a 32"-tall TV, that's 61". The VEVOR maxes at 64.2", so you have ~3" of margin. Tight but workable.

### 3.3 Depth Budget (Wall to Room)

Working from the wall outward:

- Wall/window sill to VEVOR base: ~2–3" clearance
- VEVOR mechanism depth: ~8" (base plate is 19.1" tall but only ~8" deep at the base)
- TV thickness on bracket: ~3–4"
- Clearance behind bar: ~1–2"
- Bar depth: 22"
- **Total zone: ~36–39" from wall to front of bar**

Remaining room width for couch + movement: ~69–72" (~5.75–6ft). With couch at 38" deep, that leaves ~31–34" between couch front and bar front for coffee table and legroom.

---

## 4. Bill of Materials

| Item | Details | Est. Cost |
|------|---------|-----------|
| **VEVOR 35" Stroke TV Lift** | Model DSZJ37-65YC000001V1, 130 lb capacity, 24V/1000N motor | $149–$175 |
| **3/4" Plywood (2×4 sheet)** | Base platform, cut to 36" × 14" | $15–$20 |
| **1/4" Steel Plate or Sandbags** | 60–80 lbs ballast weight for stability | $20–$35 |
| **2×4 Lumber (8ft)** | Optional frame risers if needed | $5–$8 |
| **L-Brackets (4x)** | Steel, to secure VEVOR base to plywood platform | $8–$12 |
| **Cable Drag Chain (1m)** | Nylon, for HDMI + power cable management | $10–$15 |
| **HDMI Cable (10–15ft)** | High-speed, flexible/slim profile | $10–$15 |
| **Power Strip / Extension** | Reach from nearest outlet to behind bar | $8–$12 |
| **Anti-Slip Rubber Pads** | Adhesive pads for base underside | $5–$8 |
| **Pico W** | Smart home controller | $6–$10 |
| **2-Channel Relay Module** | Interfaces Pico GPIO with VEVOR contact closures | $5–$8 |
| **Limit Switches (2x)** | Hardware safety stops at top/bottom of travel | $4–$6 |
| **5V USB Power Supply** | Powers the Pico W behind the bar | $5–$8 |
| **Dupont Jumper Wires** | Pico to relay module connections | $3–$5 |

**Estimated Total:** $250–$350

---

## 5. Installation Steps

### Phase 1: Build the Freestanding Base Platform

The VEVOR is designed to bolt to a floor or cabinet. Since this is a rental, we build a weighted freestanding platform instead.

1. **Cut 3/4" plywood to 36" × 14".** This is the base the VEVOR sits on. It's wider than the VEVOR footprint for stability and narrow enough to fit in the bar-to-wall gap.

2. **Sand edges and optionally paint/stain matte black** (it's hidden, but prevents splinters and looks finished if glimpsed).

3. **Attach anti-slip rubber pads to the underside** of the plywood — four corners and center. This prevents the platform from sliding on hard floors.

4. **Add ballast weight.** Bolt or place a 1/4" steel plate on the plywood base, OR fill two heavy-duty sandbags (30–40 lbs each) and secure them to the platform with zip ties through drilled holes. Target: 60–80 lbs of ballast. This prevents tipping when the TV is at full extension.

5. **Place the VEVOR unit on the platform.** Align it centered on the 36" width. Mark the VEVOR's M8 mounting holes on the plywood.

6. **Drill through the plywood and bolt the VEVOR base plate down** using M8 bolts, washers, and nuts. Use L-brackets on the underside for reinforcement if the plywood feels thin.

> ⚠️ Test stability before mounting the TV: extend the VEVOR to full height with no TV. Push gently from the front at the top. If it tips, add more ballast. The TV adds significant moment force at full extension.

### Phase 2: Mount the TV

1. **With the VEVOR bolted to the platform and retracted to minimum height,** attach your 65" TV to the VESA bracket. Check your TV's VESA pattern (likely 300×300 or 400×400) and use the included hardware.

2. **Hand-tighten first, verify alignment, then fully tighten.** The TV should hang level.

3. **Test the lift:** use the wired controller to raise the TV to maximum height. Verify it clears the platform, doesn't wobble excessively, and the mechanism runs smoothly.

4. **Program your 4 presets** on the wired controller:
   - Preset 1: Fully retracted/hidden
   - Preset 2: Viewing height for seated position
   - Preset 3: Viewing height for standing/entertaining
   - Preset 4: Maximum height for cleaning/adjustment

### Phase 3: Position Behind the Bar

1. **Pull the bar away from the wall** to create the installation gap (12–18").

2. **Slide the platform + VEVOR + TV assembly into the gap** behind the bar. Center it so the TV will rise centered above the bar's 62" width.

3. **With the TV retracted, verify it's fully hidden** below the bar top from your couch viewing angle. Adjust platform position forward/backward if needed.

4. **Raise the TV and verify it clears the bar top cleanly.** Check for any contact between the TV and the bar's back edge during travel. You want at least 1" clearance.

5. **Position the HomePods on the floor behind the bar,** flanking the VEVOR mechanism. They should be at least 6–8" from the wall for optimal bass reflection, and not touching the VEVOR or TV.

6. **Lock the bar position.** The bar's weight (solid vintage wood) naturally prevents the gap from changing, but add small rubber door stops behind the bar's feet to prevent it from slowly sliding backward.

### Phase 4: Cable Management

1. **Route the VEVOR's power cable** from the control box along the baseboard to the nearest outlet. Use adhesive cable clips (rental-safe, removable) to keep it tidy.

2. **Attach the cable drag chain** to the VEVOR's vertical column or the platform edge. The drag chain will carry the TV's HDMI cable and power cord.

3. **Run a long HDMI cable** from your source device (Apple TV, game console, etc.) through the drag chain up to the TV. Leave enough slack in the drag chain for full travel without tension.

4. **Run the TV's power cord** through the same drag chain down to a power strip behind the bar.

5. **Test the full raise/lower cycle and watch the cables.** They should articulate smoothly with the drag chain. No pinching, no tension at any point in travel.

6. **Tuck the power strip, control box, and excess cable** behind the bar at floor level. A small basket or box keeps it organized and invisible.

---

## 6. Smart Home Integration (Pico W)

The VEVOR includes an RF remote and a wired hand controller. The RF remote is unreliable (multiple reviewers confirm preset issues), and neither controller supports smart home integration. The plan: skip the RF remote entirely, keep the wired controller as a physical backup, and build a Pico W wireless controller that taps into the VEVOR's control box for full HomeKit/Siri control.

### How It Works

The VEVOR's control box has a port for the wired hand controller. This port uses simple contact closures — electrically identical to pressing buttons. The Pico W triggers those same contacts through a relay module or transistors, giving you programmatic control over UP, DOWN, and STOP. The wired controller stays connected in parallel as a manual fallback.

Since the VEVOR moves at a consistent 30mm/s, you calibrate the full travel time once (bottom limit to top limit) and then calculate exact motor runtimes for any target height. This gives you timed position presets that are more reliable than the VEVOR's built-in memory presets.

### Hardware

- **Pico W** — runs a web server, controls the lift
- **2-channel relay module or BTS7960 motor driver** — interfaces Pico GPIO with the VEVOR control box's contact closure pins
- **2x limit switches** — mounted at top and bottom of travel on the VEVOR column, wired to Pico GPIO as hardware safety stops
- **5V USB power supply** for the Pico (or buck converter from the VEVOR's 24V rail)
- The VEVOR's own 24V power supply and control box handle the motor — the Pico just triggers the contacts

### Wiring Steps

1. Open the VEVOR's wired hand controller or inspect the control box port with a multimeter
2. Identify the UP, DOWN, and COMMON pins on the controller port
3. Wire the Pico W's GPIO pins through the relay module to those contact points (relay NO terminals bridge the same contacts the wired buttons would)
4. Wire the wired hand controller in parallel so it still works independently
5. Mount limit switches at the top and bottom of the VEVOR's travel range, wire to Pico GPIO with pull-up resistors
6. Power the Pico via USB, tuck it behind the bar with the control box

### Software Endpoints

The Pico W runs a simple HTTP server (MicroPython or C):

- `/up` — Raise TV (activate UP relay until top limit switch or stop command)
- `/down` — Lower TV (activate DOWN relay until bottom limit switch or stop command)
- `/stop` — Halt motor immediately (release both relays)
- `/preset/hidden` — Run motor DOWN for calibrated duration to reach fully hidden position
- `/preset/viewing` — Run motor to seated viewing height (calibrated time from bottom)
- `/preset/standing` — Run motor to standing/entertaining height
- `/preset/max` — Run to full extension
- `/status` — Return current state (up/down/moving/position estimate)

### Calibration

1. Lower the TV to the bottom limit switch (fully hidden)
2. Trigger UP and time the full travel to the top limit switch with a stopwatch
3. At 30mm/s over a 35.5" (900mm) stroke, expect ~30 seconds
4. Divide the travel into position zones: hidden = 0%, viewing = ~75%, standing = ~85%, max = 100%
5. Store these as motor runtimes in the Pico firmware
6. On each preset call, the Pico runs the motor for the calculated duration from the last known position

> ⚠️ Position tracking resets if the wired controller is used manually. Add a "re-home" function that drives to the bottom limit switch to re-establish the zero position.

### HomeKit Integration

- Expose Pico endpoints via HomeBridge plugin (homebridge-http-switch or homebridge-http-garage)
- Map to a "Garage Door" accessory type — open/close/status maps naturally to TV up/down/position
- **Siri Shortcut — "Movie Time":** Raise TV to viewing preset → Set HomePods to TV audio → Lower FYRTUR blinds → Dim lights
- **Siri Shortcut — "Room Mode":** Lower TV to hidden → Raise blinds → Set ambient lighting
- **Siri Shortcut — "Entertain":** Raise TV to standing preset → Set HomePods to music mode → Ambient lighting

---

## 7. HomePod Placement

Both original HomePods live on the floor behind the bar, flanking the VEVOR lift mechanism:

- Position them 6–8" from the rear wall for optimal bass reflection
- Space them as far apart as the bar-to-wall gap allows (ideally 24"+ apart for stereo separation)
- Ensure they're not touching the VEVOR mechanism or platform (vibration isolation)
- The HomePods fire 360°, so being on the floor behind the bar still fills the 9ft room effectively
- Sound will project up and over the bar into the listening position

When the TV is raised, the HomePods are positioned below and behind the screen — actually a decent acoustic arrangement since dialogue comes from below center (where mouths are on screen) and spatial audio wraps around.

---

## 8. Troubleshooting

**TV wobbles at full extension:** Add more ballast to the base platform. The moment force of a 45–55 lb TV at 64" height on a 14"-deep base is significant. If wobble persists, widen the base platform to 18" depth or attach the platform to the bar's back panel with removable clamps.

**TV doesn't fully clear the bar top:** Check that the VEVOR is at true maximum extension. If the TV is taller than ~33", it may not fully clear at 64.2" max. Options: raise the VEVOR base by placing it on a 2–4" riser (2×4 frame), or accept a partial hide where the top 2–3" of TV peeks above the bar when retracted.

**Cables snag during travel:** Ensure the drag chain has enough slack at both ends. The chain should loop naturally at the bottom when the TV is raised. If HDMI disconnects during movement, switch to a slimmer/more flexible HDMI cable rated for continuous flex.

**Pico W loses position tracking:** If someone uses the wired controller manually, the Pico's position estimate drifts. Use the re-home function (drive to bottom limit switch) to re-establish zero. Consider adding an audible or visual indicator (LED on the bar) when the Pico is in control vs. manual mode.

**Motor noise:** The VEVOR is rated as very quiet by most reviewers. If noise is an issue, check that the mechanism isn't contacting the bar or wall during travel. A thin foam strip on the bar's back edge prevents contact noise.

---

## 9. Measurements to Confirm

Before purchasing, verify these dimensions in the apartment:

- [ ] Exact living room length (front-to-back wall): _______"
- [ ] Distance from left exterior wall to the nearest window sill: _______"
- [ ] Window sill depth/protrusion from wall: _______"
- [ ] Height of window sill from floor: _______"
- [ ] Distance between the two windows on the left wall: _______"
- [ ] Your specific TV model and VESA pattern: _______
- [ ] Your specific TV height (screen only, no stand): _______"
- [ ] Your specific TV weight: _______ lbs
- [ ] Nearest electrical outlet to the bar's planned position: _______ft away

> ⚠️ The most critical measurement is the TV height. If your 65" TV is taller than 33", the VEVOR's 64.2" max height may not fully clear the 45" bar. In that case, add a 2–4" riser under the VEVOR base.

---

*"Any sufficiently advanced technology is indistinguishable from magic."*
— Arthur C. Clarke

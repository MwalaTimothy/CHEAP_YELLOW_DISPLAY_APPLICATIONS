# CYD Applications — The App Store for Cheap Yellow Display

A browser-based flashing hub for ESP32 Cheap Yellow Display applications, styled as a real
product site (light theme, glassmorphism, GSAP/AOS motion) rather than a bare GitHub project
page. Built on [ESP Web Tools](https://esphome.github.io/esp-web-tools/) — visitors click
Install, pick their device's serial port, and the firmware flashes straight from the page. No
PlatformIO, no Arduino IDE, no drivers beyond what Chrome/Edge already have.

Live at: `https://mwalatimothy.github.io/CHEAP_YELLOW_DISPLAY_APPLICATIONS/` (once GitHub Pages
is enabled — see "Publishing" below).

Built and maintained by [Timothy Mwala](https://mwalatimothy.github.io/Portfolio-/), embedded
systems engineer. Contact/support details are on `apps.html#support`.

## Pages

- **`index.html`** — Home. Hero, "how it works" (3-step install flow), a Rolling Clock teaser
  card linking into the showcase.
- **`apps.html`** — Application Showcase. Searchable/filterable catalog (currently just Rolling
  Clock's 3 variants), Premium access ($10 one-time PayPal appreciation token), Support & contact.
- **`airsense.html`** — Dedicated flashing page for the Air Sense IAQ platform's Gateway and
  Sensor Node firmware (a separate project from Rolling Clock, sharing this same install
  infrastructure). See "What's here today: Air Sense" below.

Everything else from the original site-relaunch brief (About CYD, Why This Platform, How It
Works as its own page, Supported Hardware, Project Gallery, Community, Roadmap, About The
Developer, Partners, Compare Applications, News, Success Stories, etc.) is **intentionally not
built yet** — see "Deferred pages" below.

## Using it

Open the hosted page in **Chrome, Edge, or Opera on desktop** — Web Serial isn't supported in
Firefox, Safari, or any mobile browser. Plug the device in over USB, click Install on the card
for the application/variant you want, and pick the serial port when prompted.

## What's here today: Rolling Clock

Modular clock/weather firmware, offered as three variants:

| Variant | Needs touchscreen? | Notes |
|---|---|---|
| Premium Version | Yes | Original release: multi-provider weather, 3 on-device screens, branding |
| Premium v2 | Yes | Adds access-code lock, on-device keyboard, OpenAI insights, forecast chart, provider auto-recovery |
| Premium v3 | No | Same as v2, built for boards with no touch controller — configured via serial + web dashboard |

Premium v2/v3 are locked behind a one-time access code, unlocked with a **$10 USD one-time**
PayPal appreciation token (not a strict license fee) — see `apps.html#premium` for the exact
flow. There's no payment gateway integration here, it's a direct pay-then-get-a-code process.

## What's here today: Air Sense

Firmware for the [Air Sense](https://air-sense-platform.netlify.app) indoor air quality
platform's hardware, flashed from `airsense.html` — a separate project from Rolling Clock, but
sharing this same ESP Web Tools install flow:

| Firmware | Board | Notes |
|---|---|---|
| Gateway (Touch) | ESP32 (CYD / ESP32-2432S028R) | ESP-NOW receiver for up to 4 Sensor Nodes + WiFi uplink; tap the touchscreen to page between nodes |
| Gateway (No-Touch / Auto-Scroll) | ESP32 / CYD clone with no XPT2046 | Identical firmware, dashboard auto-advances between node pages on a timer instead |
| Sensor Node | ESP32-C3 | One binary for every node — device ID/pairing is all zero-config, handled automatically over ESP-NOW, not baked into the build |

Unlike Rolling Clock, none of this is built with PlatformIO — see "Updating Air Sense firmware"
below for the actual (Arduino-CLI-based) build process.

## Deferred pages — and why

The original design brief for this site asks for ~15 pages: About CYD, Why This Platform, How
It Works, Supported Hardware, Project Gallery, Community, Support Development, Roadmap, About
The Developer, Partners, Compare Applications, News, and **Success Stories** (customer
testimonials, install statistics, before/after photos).

Only Home + Application Showcase are built in this pass, deliberately:

- It's a multi-week build across the full brief; scoping to two pages first keeps this
  reviewable and lets the direction get validated before going further.
- **Success Stories / Community / Partners / News specifically won't be built with fabricated
  content.** This repo has zero real installs, testimonials, or partners right now. Presenting
  invented numbers or quotes as real is misleading to visitors — the brief's own stated purpose
  for Success Stories is literally "convince visitors this platform is actively used," which is
  exactly the kind of claim that needs to be true. When there's real content (actual users,
  actual testimonials), these pages are straightforward to add using the same
  `styles.css`/`app.js` design system already in place.

## Adding future applications

To add a new CYD application to the showcase:

1. Add a new `<div class="app-card glass" data-app-card data-category="…" data-search="…">`
   block to `apps.html` (copy an existing Rolling Clock card as a template).
2. Add a manifest per new variant under `manifests/`.
3. Add the corresponding `firmware.merged.bin` under `firmware/<app-name>/<variant>/`.
4. Add any new category to the chip row (`[data-chip]`) if it doesn't already exist.

## Publishing (GitHub Pages)

1. Push this repo to `https://github.com/MwalaTimothy/CHEAP_YELLOW_DISPLAY_APPLICATIONS`.
2. In the repo's **Settings → Pages**, set the source to `main` / `/ (root)`.
3. GitHub Pages serves over HTTPS automatically, which Web Serial requires — no extra config
   needed.

## Updating Rolling Clock firmware

Each variant's PlatformIO project already has a `merge_bin.py` post-build script that produces
`firmware.merged.bin` (bootloader + partitions + app combined at their correct flash offsets) —
that's the exact file format ESP Web Tools expects.

**Important:** manifest `path` values are resolved relative to the *manifest file's own URL*,
not the page's URL (this caused a 404 in an earlier version of this repo). Manifests live under
`manifests/`, so paths must climb back out with `../` — e.g.
`"../firmware/v2/firmware.merged.bin"`, not `"firmware/v2/firmware.merged.bin"`.

To ship a new build:

1. Rebuild the variant's PlatformIO project (`pio run` — `firmware.merged.bin` appears in that
   project's root automatically).
2. Copy it over the matching file here:
   - `firmware/premium-version/firmware.merged.bin`
   - `firmware/v2/firmware.merged.bin`
   - `firmware/v3/firmware.merged.bin`
3. Bump the `version` field in the matching `manifests/*.json` file (cosmetic — shown in the
   install dialog, not used for compatibility checks).
4. Commit and push.

## Updating Air Sense firmware

Source lives in the [Air-Sense-Platform](https://github.com/MwalaTimothy/Air-Sense-Platform)
repo's `hardware/` folder, built with Arduino, not PlatformIO — `arduino-cli compile
--export-binaries` produces the same bootloader+partitions+app merged binary ESP Web Tools
needs, just under a `build/<fqbn>/<sketch>.ino.merged.bin` path inside the sketch folder instead
of PlatformIO's convention. Same `../firmware/...` relative-path caveat as above applies.

To ship a new build, for each of the three sketches:

| Sketch | FQBN | Merged binary → copy to |
|---|---|---|
| `hardware/gateways/gateway` | `esp32:esp32:esp32:PartitionScheme=min_spiffs` | `firmware/air-sense-gateway/firmware.merged.bin` |
| `hardware/gateways/gateway_notouch` | `esp32:esp32:esp32:PartitionScheme=min_spiffs` | `firmware/air-sense-gateway-notouch/firmware.merged.bin` |
| `hardware/esp_now_nodes/sensor_node` | `esp32:esp32:lolin_c3_mini` | `firmware/air-sense-sensor-node/firmware.merged.bin` |

**The sensor node MUST be built with the `lolin_c3_mini` FQBN, not plain `esp32:esp32:esp32`** —
the actual hardware is an ESP32-C3, a different chip family entirely; a classic-ESP32 binary
won't run on it (and in practice won't even compile clean against this sketch's C3-specific pin
assignments). The Gateway needs `PartitionScheme=min_spiffs` specifically — its default
partition scheme is too small once OTA + SD + WiFiManager + LVGL are all linked in (confirmed:
"text section exceeds available space" on the default scheme).

1. `arduino-cli compile --fqbn <fqbn above> --export-binaries <sketch folder>`
2. Copy the resulting `.../build/<fqbn-dirname>/<sketch>.ino.merged.bin` over the matching file
   here.
3. Bump the `version` field in the matching `manifests/air-sense-*.json` file **and** the
   matching `<span class="device-sub">` version label in `airsense.html` — the manifest version
   is cosmetic-only (install dialog), the HTML label is a separate hardcoded string, both need
   updating by hand, they don't derive from one source.
4. If it's the Gateway, also bump `GATEWAY_FIRMWARE_VERSION` in `gateway.ino` (and its synced
   `gateway_notouch.ino` copy) in the Air-Sense-Platform repo itself — that's what the Gateway
   reports to its own OTA check-in, independent of this flasher.
5. Commit and push both repos.

## Repo layout

```
index.html              Home page
apps.html               Application Showcase (search/filter, cards, Premium, Support)
airsense.html            Air Sense Gateway/Sensor Node flashing page (separate project, same install flow)
styles.css               shared design system (light theme, glassmorphism, buttons, cards)
styles-airsense.css     airsense.html-specific styling
app.js                  AOS/GSAP init + showcase search & category filtering
manifests/
  premium-version.json          ESP Web Tools manifest for the Rolling Clock Premium Version build
  v2.json                        ...for Premium v2
  v3.json                        ...for Premium v3
  air-sense-gateway.json                  ...for the Air Sense Gateway (Touch)
  air-sense-gateway-notouch.json          ...for the Air Sense Gateway (No-Touch / Auto-Scroll)
  air-sense-sensor-node.json              ...for the Air Sense Sensor Node
firmware/
  premium-version/firmware.merged.bin
  v2/firmware.merged.bin
  v3/firmware.merged.bin
  air-sense-gateway/firmware.merged.bin
  air-sense-gateway-notouch/firmware.merged.bin
  air-sense-sensor-node/firmware.merged.bin
```

## Design system notes

- Font: Inter (Google Fonts CDN). Colors/spacing/shadows are CSS custom properties at the top
  of `styles.css` — change the palette by editing `:root` there.
- Animation: [AOS](https://michalsnik.github.io/aos/) for scroll-reveal, [GSAP](https://gsap.com)
  for the Home hero's entrance animation, both loaded via CDN (`unpkg`). No Three.js, Lottie, or
  particles yet — the brief marks those "where useful"/"if appropriate," and a flasher catalog
  with 3 cards didn't clearly need them; revisit once there's a larger, more visual catalog.
- No build step, no framework (plain HTML/CSS/JS) — stays trivially GitHub Pages compatible.

## Caveats

- The access-code gate on v2/v3 is a basic deterrent (a single string built into the firmware),
  not real DRM — see each project's own README for details.
- `new_install_prompt_erase: true` is set in every manifest, so users get an "erase device
  first?" prompt — recommended when someone might be switching between variants, since NVS
  layouts can drift between them over time.
- Payment is a manual PayPal-then-contact flow ($10 USD one-time, framed as an appreciation
  token rather than a strict license fee), not an automated checkout — there's no order system
  or receipt verification built here.

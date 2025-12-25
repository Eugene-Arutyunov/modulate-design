# Behaviours Documentation

## Overview

Behaviours are detected behavioral patterns in audio/video transcripts. They represent key conversation moments that the system analyzes and highlights for users.

## Data Structure

### Clip

Each transcript clip can contain one or more behaviours.

**Key elements:**

- `.behaviour` — element containing the detected behaviour name
- `.evidence` class on a clip indicates it contains detected behaviours
- `data-seek-time` — clip start time for navigation and playback
- `data-behaviour-type` — type of behaviour (currently `kiki` is used for all behaviours; see "Icon System" section below)

## Icon System

The system uses visual icons to represent different behaviour types. Each behaviour type has a corresponding icon that appears in transcript clips, summary tables, and visualizations.

### Current Status

**Temporary:** Currently, all behaviours use the `kiki` icon. The icon system infrastructure remains in place to support multiple icon types in the future.

### Icon Types

The system supports multiple icon types:

- **`kiki`** — Currently used for all behaviours
- **`buba`** — Available but not currently in use

### Icon Files

Icons are stored as SVG includes in `src/includes/assets/`:

- `behaviour-icon-kiki.html` — Kiki icon SVG
- `behaviour-icon-buba.html` — Buba icon SVG

Each icon file contains:

- SVG element with classes `behaviour-icon` and `behaviour-icon--{type}`
- Outline path with class `behaviour-icon__outline` and id `{type}-outline-form` (or `{type}-outline`)
- Shape element (polygon, ellipse, etc.) with class `behaviour-icon__shape` and id `{type}-shape`

### Adding a New Icon Type

To add a new icon type in the future:

1. **Create the icon file:**

   - Create `src/includes/assets/behaviour-icon-{name}.html`
   - Follow the structure of existing icons:
     - SVG with `viewBox="0 0 241.8 241.8"`
     - Classes: `behaviour-icon behaviour-icon--{name}`
     - Outline path with id `{name}-outline-form` (or `{name}-outline`)
     - Shape element with id `{name}-shape`

2. **Update JavaScript fallback:**

   - In `src/assets/js/transcript-visualization-core.js`, add a new `else if` branch in the icon creation fallback (around line 132)
   - Copy the structure from existing icon types (kiki/buba)

3. **Update CSS (if needed):**

   - Add styles for `.behaviour-icon--{name}` in relevant CSS files if the new icon needs special styling
   - Check `src/styles/components/transcript.css` and `src/styles/summary.css` for icon-specific styles

4. **Use in HTML:**

   - In `demo.html` and `transcript-clips.html`, use `{% include "assets/behaviour-icon-{name}.html" %}`
   - Set `data-behaviour-type="{name}"` on `.behaviour` elements

5. **Update documentation:**
   - Add the new icon type to this section
   - Update any references to icon types in the documentation

### Icon Usage Locations

Icons appear in three main locations:

1. **Summary Table** (`demo.html`): Inside `.detected-behaviour` links
2. **Transcript Clips** (`transcript-clips.html`): Inside `.behaviour` elements within `.clip-caption`
3. **Player Visualization**: Dynamically created indicators in `.behaviour-indicators` layer

## Display

### 1. Transcript Container

Behaviours are displayed inside `.clip-caption` of each transcript clip. They are not clickable (no links), but maintain visual styling with underline.

### 2. Summary Table

Behaviours appear as clickable links in the "Detected behaviours, confidence" column using `.detected-behaviour` class.

### 3. Player Visualization

Behaviours are displayed as icon indicators in a separate layer (`.behaviour-indicators`), positioned at the bottom-left corner of their corresponding clips.

**Key characteristics:**

- Icons are white-filled SVG (no stroke)
- Positioned absolutely in a separate layer, not nested in clips
- Aligned to the bottom of each speaker's zone (not the entire visualization)
- Multiple behaviours stack vertically (up to 3 per clip)
- Text labels are hidden by default, shown on clip hover
- Labels can position left or right of icons based on available space
- Icons and labels have elevated z-index when visible to appear above other indicators

**Attributes on `.behaviour-indicator`:**

- `data-clip-position` — clip position percentage
- `data-clip-width` — clip width percentage
- `data-clip-index` — clip index for hover synchronization
- `data-behaviour-index` — index within clip (1, 2, 3) for vertical stacking
- `data-behaviour-type` — behaviour type (currently `kiki` is used for all behaviours; see "Icon System" section below)
- `data-emotion` — clip emotion for potential future use
- `data-speaker-index` — speaker index for vertical positioning

**JavaScript:** `initPlayerVisualization()` creates indicator elements dynamically from clip data and handles hover synchronization.

### 4. Fingerprint Visualization

Similar to player visualization, behaviours appear as indicators on a static timeline. Links are not interactive in the static version.

## JavaScript Functionality

### 1. Navigation Between Behaviours

`behavior-navigation.js` provides navigation between clips with behaviours.

**Function:** `initBehaviorNavigation`

- Finds all clips with behaviours chronologically
- Tracks current playback position
- Updates "Next" and "Previous" button states
- On click, navigates to the corresponding clip, scrolls page, and starts playback

**Helper:** `findAllBehaviorClips` — finds and sorts clips by start time.

### 2. Behaviour Link Handling

`behavior-links.js` handles clicks on behaviour links.

**Function:** `initBehaviorLinkHandlers`

**Handles:**

- `.detected-behaviour` — links in summary table
- `.behaviour-label a` — links in timeline labels (legacy, now hidden)

**On click:**

1. Finds first clip with the corresponding behaviour
2. Scrolls page to clip
3. Seeks audio to clip start
4. Starts playback (if not playing)

### 3. Indicator Positioning

`player-visualization.js` creates and positions behaviour indicators in the player visualization.

**Function:** `initPlayerVisualization`

- Creates `.behaviour-indicator` elements in `.behaviour-indicators` container
- Positions indicators using clip coordinates (`data-position`, `data-width`)
- Limits to 3 behaviours per clip
- Synchronizes hover: shows labels when corresponding clip is hovered
- Calculates label positioning (left/right of icon)

## Integration

### Transcript Clips

- Clips with behaviours have `.evidence` class
- `.behaviour` elements are inside `.clip-caption`
- Start time stored in `data-seek-time` or `.time` element's `data-time`

### Visualization

- Indicators positioned by clip coordinates in a separate layer
- Vertical positioning based on `data-speaker-index`
- Hover synchronization via `data-clip-index`

### Navigation

- Navigation works with clips having `.evidence` class
- Clips sorted by start time (`data-time` or `data-seek-time`)
- Current position tracked based on playback time

## Dependencies

- `utils.js` — clip and time utilities
- `player-visualization.js` — indicator creation and positioning
- `fingerprint-visualization.js` — static visualization positioning
- `behavior-navigation.js` — navigation between behaviours
- `behavior-links.js` — link click handling

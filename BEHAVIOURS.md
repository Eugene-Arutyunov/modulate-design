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
- `data-behaviour-type` — type of behaviour (`kiki` or `buba`)

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
- `data-behaviour-type` — behaviour type (`kiki` or `buba`)
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

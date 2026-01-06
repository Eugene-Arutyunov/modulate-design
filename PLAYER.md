# Audio Player Documentation

Audio player built with Howler.js for the demo page.

## HTML Structure

### Main Container

```html
<div
  id="audio-player"
  class="media-box ids__rounded dark-mode"
  data-audio-src="/assets/audio.mp3"
  data-speaker-count="2"></div>
```

- `id="audio-player"` - main player container
- `data-audio-src` - path to audio file
- `data-speaker-count` - number of speakers (1-5)
- `data-playback-started` - attribute set to "true" when playback starts (used for CSS styling)

### Control Elements

- `[data-action="play-pause"]` - Play/Pause button container
  - `.player-icon` - icon element with `data-playing` attribute and `data-icon-id`
- `[data-total-time]` - element displaying total duration (format "M:SS" or "MM:SS")
- `[data-current-time]` - element displaying current time (format "M:SS" or "MM:SS")
- `[data-hover-time]` - element displaying hover time in `.player-hover-position-indicator`
- `.player-position-indicator` - current playback position indicator
  - `.player-position-line` - vertical line showing current position
  - `.player-position-caption` - caption with current time
- `.player-hover-position-indicator` - hover position indicator (shows time on hover)
  - `.player-hover-position-line` - vertical line showing hover position
  - `.player-hover-position-caption` - caption with hover time
- `.clip-text-caption` - displays text of currently hovered clip
- `.emotion-caption` - displays emotion of currently hovered clip

### Transcript Clips

Each `.transcript-clip` element (in both `.player-visualization` and `.transcript-container`) must have:

- `data-seek-time` - time in seconds for seeking on click (or calculated from `data-start-time` and `data-duration`)
- `data-clip-index` - unique index added automatically during initialization (used for hover synchronization)
- `data-speaker-index` - speaker index (1, 2, etc.)

## JavaScript API

### Main Functions

#### `initAudioPlayer()`

Initializes the player, creates Howl instance and sets up all event handlers.

**Returns:** Object with:

- `sound` - Howl instance
- `clipMetadata` - array of clip metadata objects
- `setClipMap(map)` - function to set clip map for playback tracking
- `getAutoScrollEnabled()` - function to get auto-scroll state
- `setAutoScrollEnabled(enabled)` - function to set auto-scroll state
- `getSetProgrammaticScrollCallback()` - function to get callback for programmatic scroll flag

#### `formatTime(seconds)`

Converts seconds to "M:SS" or "MM:SS" format.

```javascript
formatTime(65); // "1:05"
formatTime(125); // "2:05"
```

#### `updatePlayerPosition(currentTime)`

Updates indicator position and time based on current playback time.

**Position calculation formula:**

```
position_percentage = (current_time / total_time) * 100
indicator_left = (position_percentage / 100) * width(.player-visualization)
```

Note: `.player-visualization` takes full width of parent, padding is not used in calculation.

#### `initTranscriptClipsInteraction(sound, clipMetadata, updatePlayingClipFn, getCurrentClipIndexFn, getAutoScrollEnabledFn, setAutoScrollEnabledFn, getSetProgrammaticScrollCallbackFn)`

Initializes click and hover synchronization for transcript clips.

**Parameters:**

- `sound` - Howl instance from `initAudioPlayer()`
- `clipMetadata` - array of clip metadata objects
- `updatePlayingClipFn` - function to update currently playing clip
- `getCurrentClipIndexFn` - function to get current clip index by time
- `getAutoScrollEnabledFn` - function to get auto-scroll enabled state
- `setAutoScrollEnabledFn` - function to set auto-scroll enabled state
- `getSetProgrammaticScrollCallbackFn` - function to get callback for programmatic scroll flag

**Returns:** `clipMap` - Map object mapping clip indices to visualization and container elements

**Functionality:**

- Adds `data-clip-index` to container clips (visualization clips already have indices)
- Creates mapping between visualization, container, and speaker-fingerprint clips
- Sets up click handlers for seeking
- Sets up hover handlers for synchronized highlighting
- Updates hover position indicator on visualization clip hover
- Updates emotion and text captions on clip hover

## Functionality

### Play/Pause

- Click on `[data-action="play-pause"]` toggles between play and pause
- Uses `sound.play()` and `sound.pause()`
- Icon updates automatically via `onplay`/`onpause` callbacks
- Icon shows action that will happen: pause icon when playing, play icon when paused
- Sets `data-playback-started="true"` attribute on first play (one-way flag)

### Seek on Click

- Click on `.transcript-clip` (in both `.player-visualization` and `.transcript-container`) seeks to time
- Time is calculated from `data-seek-time` or `data-start-time` + `data-duration`
- Uses `sound.seek(seconds)`
- Automatically starts playback if sound was paused
- Enables auto-scroll when clicking on clip
- Updates playing clip immediately after seek

### Hover Synchronization

- Hovering over a transcript clip highlights corresponding clips in all areas:
  - `.player-visualization` clips
  - `.transcript-container` clips
  - `.speaker-fingerprint-clip` elements
  - `.behaviour-indicator` elements
- Uses `data-clip-index` to match corresponding elements
- Adds `.hover` class to all matching elements synchronously
- Clears all previous hover states when starting a new hover to prevent stuck states
- Hover styles are context-specific:
  - `.player-visualization .transcript-clip:hover, .player-visualization .transcript-clip.hover` - uses `filter: brightness(140%) saturate(115%)`
  - `.transcript-container .transcript-clip:hover, .transcript-container .transcript-clip.hover` - uses `background-color: rgba(var(--ids__hover-RGB), 0.1)`

### Hover Position Indicator

- Shows vertical line and time when hovering over `.player-visualization` clips
- Position calculated based on clip start time
- Hidden when leaving visualization area or clicking on clip
- Uses `.player-hover-position-indicator.active` class for visibility
- Updates `[data-hover-time]` element with formatted time

### Emotion and Text Captions

- `.emotion-caption` displays emotion of currently hovered clip
- `.clip-text-caption` displays text of currently hovered clip
- Captions fade in/out smoothly
- Fade out only when leaving entire visualization area (not individual clips)

### Position Update

- Uses `requestAnimationFrame` for smooth updates during playback
- Updates only when sound is playing (`sound.playing()`)
- Stops on pause or track end
- Updates playing clip based on current time
- Handles window resize to recalculate position

### Auto-Scroll

- Automatically scrolls transcript container to keep current playing clip centered
- Enabled by default, disabled when user manually scrolls more than half viewport height
- Re-enabled when clicking on clips or using behavior navigation
- Uses programmatic scroll flag to distinguish user vs programmatic scrolling

## Howler.js Events

- `onload` - updates total duration and initial position, sets `data-total-duration` attribute
- `onplay` - starts position update loop, sets `data-playback-started="true"`, updates play/pause icon, enables auto-scroll, scrolls to current clip
- `onpause` - stops position update loop, updates play/pause icon, clears playing clip
- `onend` - stops loop and resets position to 0, updates play/pause icon, clears playing clip
- `onloaderror` - logs loading errors to console

## Dependencies

- **Howler.js v2.2.4** - loaded via CDN (jsDelivr)
- Works only in Chrome and Safari (MP3 format only)

## Initialization

Player initializes automatically on DOM load in this order:

1. `initStickyObserver()` - handles sticky positioning
2. `initPlayerVisualization()` - initializes visualization and adds `data-clip-index` to visualization clips
3. `initAudioPlayer()` - creates Howl instance and returns player API object
4. `initTranscriptClipsInteraction(...)` - sets up click and hover sync, returns `clipMap`
5. `audioPlayerResult.setClipMap(clipMap)` - sets clip map in player for playback tracking
6. `initSpeakerFingerprints(...)` - creates fingerprint visualizations dynamically
7. `initBehaviorLinkHandlers(...)` - sets up behavior link click handlers
8. `initBehaviorNavigation(...)` - sets up behavior navigation (next/previous clip)

### Speaker Fingerprint Visualization

Mini-diagrams showing speaker clips in the summary table.

**HTML Structure:**

```html
<div class="speaker-fingerprint-wrapper">
  <div class="speaker-fingerprint" data-speaker-index="1"></div>
</div>
```

- `.speaker-fingerprint-wrapper` - wrapper container for width control (70% width)
- `.speaker-fingerprint` - container for dynamically generated clip rectangles
- `data-speaker-index` - speaker index (1, 2, etc.) to filter clips

**Functionality:**

- Shows only clips for the specific speaker, placed sequentially without gaps
- Clips are visualized as colored rectangles based on emotion classes
- Each clip has `data-clip-index` attribute matching main visualization
- All speaker fingerprints use the same scale (based on maximum speaker total duration) for comparison
- Full hover and click synchronization with `.player-visualization` and `.transcript-container`
- Click on a clip seeks to that position in the player and starts playback
- Updates emotion caption on hover

**Initialization:**

- `initSpeakerFingerprints(sound, clipMap, clipMetadata, updatePlayingClipFn, getCurrentClipIndexFn, setAutoScrollEnabledFn, getSetProgrammaticScrollCallbackFn)` - creates fingerprint visualizations dynamically
- Called after `initTranscriptClipsInteraction()` to access `clipMap`
- Requires: `sound`, `clipMap`, `clipMetadata`, and callback functions for playback tracking

## CSS

- `.transcript-clip` has `cursor: pointer` for visual feedback
- `.player-position-indicator` is positioned absolutely relative to `.media-box`
- Indicator position is set via `left` in pixels
- `.player-position-line` is hidden by default, shown when `data-playback-started="true"` is set
- `.player-hover-position-indicator` is hidden by default, shown when `.active` class is added
- Hover styles are isolated by context:
  - `.player-visualization .transcript-clip:hover, .player-visualization .transcript-clip.hover` - uses `filter: brightness(140%) saturate(115%)`
  - `.transcript-container .transcript-clip:hover, .transcript-container .transcript-clip.hover` - uses `background-color: rgba(var(--ids__hover-RGB), 0.1)`
- `.speaker-fingerprint-wrapper` - 70% width wrapper for fingerprint container
- `.speaker-fingerprint` - 2em height, 100% width of wrapper, flex layout with no gap
- `.speaker-fingerprint-clip` - colored rectangles with emotion-based background colors, min-width 2px
- `.clip-text-caption` - positioned below visualization, shows text with fade effect
- `.emotion-caption` - positioned below visualization, shows emotion with fade effect
- `.behaviour-indicators` - positioned absolutely over visualization, shows behavior icons
- Emotion colors are applied via `::after` pseudo-element with fade-in animation

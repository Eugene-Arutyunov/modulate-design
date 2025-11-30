# Audio Player Documentation

Audio player built with Howler.js for the demo page.

## HTML Structure

### Main Container
```html
<div id="audio-player" 
     data-audio-src="/assets/audio.mp3">
```

- `id="audio-player"` - main player container
- `data-audio-src` - path to audio file
- Padding value is read from CSS variable `--padding` on `.media-box` 

### Control Elements
- `[data-action="play-pause"]` - Play/Pause button
- `[data-action="mute-unmute"]` - Mute/Unmute button
- `[data-total-time]` - element displaying total duration (format "M:SS")
- `[data-current-time]` - element displaying current time (format "M:SS")
- `.player-position-indicator` - current playback position indicator

### Transcript Clips
Each `.transcript-clip` element (in both `.player-visualization` and `.transcript-container`) must have:
- `data-seek-time` - time in seconds for seeking on click
- `data-clip-index` - unique index added automatically during initialization (used for hover synchronization)

## JavaScript API

### Main Functions

#### `initAudioPlayer()`
Initializes the player, creates Howl instance and sets up all event handlers.

#### `formatTime(seconds)`
Converts seconds to "M:SS" or "MM:SS" format.
```javascript
formatTime(65) // "1:05"
formatTime(125) // "2:05"
```

#### `getPaddingInPixels(element)`
Gets padding value in pixels from CSS variable.
- Reads `--padding` CSS variable from computed styles (default: `0.8em`)
- Converts em to px via `fontSize`
- Falls back to parsing as px if value is in pixels

#### `updatePlayerPosition(currentTime)`
Updates indicator position and time based on current playback time.

**Position calculation formula:**
```
position_percentage = (current_time / total_time) * 100
indicator_left = (position_percentage / 100) * width(.player-visualization)
```

Note: `.player-visualization` now takes full width of parent, so padding is not used in calculation.

#### `initTranscriptClipsInteraction(sound)`
Initializes click and hover synchronization for transcript clips.
- Adds `data-clip-index` to all transcript clips
- Creates mapping between visualization and container clips
- Sets up click handlers for seeking
- Sets up hover handlers for synchronized highlighting
- Requires sound instance from `initAudioPlayer()`

## Functionality

### Play/Pause
- Click on `[data-action="play-pause"]` toggles between play and pause
- Uses `sound.play()` and `sound.pause()`

### Mute/Unmute
- Click on `[data-action="mute-unmute"]` toggles sound
- Uses `sound.mute(true/false)`

### Seek on Click
- Click on `.transcript-clip` (in both `.player-visualization` and `.transcript-container`) seeks to time from `data-seek-time`
- Uses `sound.seek(seconds)`
- Automatically starts playback if sound was paused

### Hover Synchronization
- Hovering over a transcript clip in one area highlights the corresponding clip in the other area
- Uses `data-clip-index` to match corresponding elements
- Adds `.hover` class to both elements synchronously
- Clears all previous hover states when starting a new hover to prevent stuck states
- Hover styles are context-specific:
  - `.player-visualization .transcript-clip:hover` - uses `filter: brightness(140%) saturate(115%)`
  - `.transcript-container .transcript-clip:hover` - uses `background-color: rgba(var(--ids__hover-RGB), 0.1)`

### Position Update
- Uses `requestAnimationFrame` for smooth updates during playback
- Updates only when sound is playing (`sound.playing()`)
- Stops on pause or track end

## Howler.js Events

- `onload` - updates total duration and initial position
- `onplay` - starts position update loop
- `onpause` - stops position update loop
- `onend` - stops loop and resets position to 0
- `onloaderror` - logs loading errors to console

## Dependencies

- **Howler.js v2.2.4** - loaded via CDN (jsDelivr)
- Works only in Chrome and Safari (MP3 format only)

## Initialization

Player initializes automatically on DOM load along with other functions:
- `initStickyObserver()`
- `initPlayerVisualization()` - adds `data-clip-index` to visualization clips
- `initAudioPlayer()` - returns sound instance
- `initTranscriptClipsInteraction(sound)` - sets up click and hover sync

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
- All speaker fingerprints use the same scale (based on maximum speaker total duration) for comparison
- Full hover and click synchronization with `.player-visualization` and `.transcript-container`
- Click on a clip seeks to that position in the player and starts playback

**Initialization:**
- `initSpeakerFingerprints()` - creates fingerprint visualizations dynamically
- Called after `initTranscriptClipsInteraction()` to access `clipMap`
- Requires: `sound`, `clipMap`, `clipMetadata`, and related functions

## CSS

- `.transcript-clip` has `cursor: pointer` for visual feedback
- `.player-position-indicator` is positioned absolutely relative to `.media-box`
- Indicator position is set via `left` in pixels
- Hover styles are isolated by context:
  - `.player-visualization .transcript-clip:hover, .player-visualization .transcript-clip.hover` - defined in `media.css`
  - `.transcript-container .transcript-clip:hover, .transcript-container .transcript-clip.hover` - defined in `demo.css`
- `.speaker-fingerprint-wrapper` - 70% width wrapper for fingerprint container
- `.speaker-fingerprint` - 2em height, 100% width of wrapper, flex layout with no gap
- `.speaker-fingerprint-clip` - colored rectangles with emotion-based background colors, min-width 2px

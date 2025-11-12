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
Each `.transcript-clip` in `.player-visualization` must have:
- `data-seek-time` - time in seconds for seeking on click

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

## Functionality

### Play/Pause
- Click on `[data-action="play-pause"]` toggles between play and pause
- Uses `sound.play()` and `sound.pause()`

### Mute/Unmute
- Click on `[data-action="mute-unmute"]` toggles sound
- Uses `sound.mute(true/false)`

### Seek on Click
- Click on `.transcript-clip` seeks to time from `data-seek-time`
- Uses `sound.seek(seconds)`
- Automatically starts playback if sound was paused

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
- `initPlayerVisualization()`
- `initAudioPlayer()`

## CSS

- `.transcript-clip` has `cursor: pointer` for visual feedback
- `.player-position-indicator` is positioned absolutely relative to `.media-box`
- Indicator position is set via `left` in pixels

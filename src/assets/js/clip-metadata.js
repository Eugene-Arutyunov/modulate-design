import { getClipStartTime, parseClipDuration } from './utils.js';

// Build clip metadata array with start times, end times, and indices
export function buildClipMetadata() {
  const visualization = document.querySelector('.player-visualization');
  if (!visualization) return [];
  
  const clips = visualization.querySelectorAll('.transcript-clip');
  const metadata = [];
  
  clips.forEach((clip, index) => {
    const startTime = getClipStartTime(clip);
    if (startTime === null) return;
    
    const duration = parseClipDuration(clip);
    const endTime = startTime + duration;
    
    metadata.push({
      index: index,
      startTime: startTime,
      endTime: endTime,
      duration: duration
    });
  });
  
  // Sort by start time to ensure correct order
  metadata.sort((a, b) => a.startTime - b.startTime);
  
  return metadata;
}

// Get current clip index based on playback time
export function getCurrentClipIndex(currentTime, clipMetadata) {
  if (!clipMetadata || clipMetadata.length === 0) return null;
  
  // Use a small epsilon for floating point comparison to handle precision issues
  const epsilon = 0.001; // 1ms tolerance
  
  // Find the clip that contains the current time
  // Iterate in reverse to handle overlapping clips (later clips take precedence)
  for (let i = clipMetadata.length - 1; i >= 0; i--) {
    const clip = clipMetadata[i];
    // Check if currentTime is within this clip's range
    // Use epsilon to handle floating point precision issues
    // Use <= for endTime to include the exact end time (important for precise timing)
    if (currentTime >= (clip.startTime - epsilon) && currentTime <= (clip.endTime + epsilon)) {
      return clip.index;
    }
  }
  
  // If no clip contains the time, find the nearest clip
  // This handles gaps between clips - show the last clip we passed
  
  // Before first clip
  const firstClip = clipMetadata[0];
  if (currentTime < firstClip.startTime) {
    return firstClip.index;
  }
  
  // After last clip - return last clip
  const lastClip = clipMetadata[clipMetadata.length - 1];
  if (currentTime > lastClip.endTime) {
    return lastClip.index;
  }
  
  // Between clips - return the clip we've most recently passed (the one that ended)
  // This ensures smooth transition: once a clip ends, we show it until the next one starts
  for (let i = clipMetadata.length - 1; i >= 0; i--) {
    const clip = clipMetadata[i];
    // If we've passed this clip's end time, return it (or the next one if we're closer to it)
    if (currentTime >= clip.endTime) {
      // Check if there's a next clip and if we're closer to it
      if (i < clipMetadata.length - 1) {
        const nextClip = clipMetadata[i + 1];
        // If we're closer to the next clip's start, return it
        if (currentTime >= nextClip.startTime - epsilon) {
          return nextClip.index;
        }
      }
      // Otherwise, return the clip we just passed
      return clip.index;
    }
  }
  
  // Fallback: return first clip
  return firstClip.index;
}

// Update visual state of playing clip
export function updatePlayingClip(clipIndex, clipMap, shouldScroll = true, setProgrammaticFlagCallback = null, scrollToClipCenterFn) {
  // Remove playing class from all clips
  document.querySelectorAll('.transcript-clip.playing').forEach(clip => {
    clip.classList.remove('playing');
  });
  
  // Add playing class to current clip if valid
  if (clipIndex !== null && clipMap) {
    const pair = clipMap.get(clipIndex.toString());
    if (pair) {
      if (pair.visualization) {
        pair.visualization.classList.add('playing');
      }
      if (pair.container) {
        pair.container.classList.add('playing');
        // Scroll to the playing clip in transcript container only if shouldScroll is true
        if (shouldScroll && scrollToClipCenterFn) {
          scrollToClipCenterFn(pair.container, setProgrammaticFlagCallback);
        }
      }
    }
  }
}

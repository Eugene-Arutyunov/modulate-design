// Helper function: format seconds to "M:SS" or "MM:SS"
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Get precise start time from clip - uses data-time if available, otherwise data-seek-time
export function getClipStartTime(clip) {
  // First try to use precise data-time from .time element
  const timeElement = clip.querySelector('.time');
  if (timeElement) {
    const dataTime = timeElement.dataset.time;
    if (dataTime) {
      const time = parseFloat(dataTime);
      if (!isNaN(time)) {
        return time;
      }
    }
  }
  
  // Fallback to data-seek-time on clip element
  const seekTime = parseFloat(clip.dataset.seekTime);
  if (!isNaN(seekTime)) {
    return seekTime;
  }
  
  return null;
}

// Helper function: get padding in pixels from CSS variable
export function getPaddingInPixels(element) {
  const computedStyle = getComputedStyle(element);
  const paddingValue = computedStyle.getPropertyValue('--padding').trim();
  
  // Parse CSS value (e.g., "0.8em" -> 0.8)
  const match = paddingValue.match(/^([\d.]+)em$/);
  if (match) {
    const paddingEm = parseFloat(match[1]);
    const fontSize = parseFloat(computedStyle.fontSize);
    return paddingEm * fontSize;
  }
  
  // Fallback: try to parse as px directly
  const paddingPx = parseFloat(paddingValue);
  if (!isNaN(paddingPx)) {
    return paddingPx;
  }
  
  // Final fallback
  return parseFloat(computedStyle.fontSize) * 0.8;
}

// Parse duration from clip element - uses data-duration if available, otherwise parses text
export function parseClipDuration(clip) {
  const durationElement = clip.querySelector('.duration');
  if (!durationElement) return 0;
  
  // First try to use precise data-duration attribute
  const dataDuration = durationElement.dataset.duration;
  if (dataDuration) {
    const duration = parseFloat(dataDuration);
    if (!isNaN(duration)) {
      return duration;
    }
  }
  
  // Fallback to parsing text (e.g., "5s" -> 5)
  const durationText = durationElement.textContent.trim();
  const match = durationText.match(/^(\d+)s?$/);
  if (match) {
    return parseFloat(match[1]);
  }
  return 0;
}

// Scroll to center a clip element in the viewport
// Accepts optional callback to set programmatic scroll flag
export function scrollToClipCenter(clipElement, setProgrammaticFlagCallback = null) {
  if (!clipElement) return;
  
  // Set flag if callback provided
  if (setProgrammaticFlagCallback) {
    setProgrammaticFlagCallback(true);
  }
  
  const elementRect = clipElement.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.pageYOffset;
  const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
  
  window.scrollTo({
    top: middle,
    behavior: 'smooth'
  });
  
  // Reset flag after scroll completes (smooth scroll takes ~500ms)
  if (setProgrammaticFlagCallback) {
    setTimeout(() => {
      setProgrammaticFlagCallback(false);
    }, 600);
  }
}

// Find first clip with matching behavior name
export function findFirstClipWithBehavior(behaviorName) {
  const transcriptContainer = document.querySelector('.transcript-container');
  if (!transcriptContainer) return null;
  
  const clips = transcriptContainer.querySelectorAll('.transcript-clip.evidence');
  
  for (const clip of clips) {
    const behaviourElement = clip.querySelector('.behaviour');
    if (behaviourElement && behaviourElement.textContent.trim() === behaviorName.trim()) {
      return clip;
    }
  }
  
  return null;
}

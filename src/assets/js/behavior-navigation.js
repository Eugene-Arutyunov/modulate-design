import { getClipStartTime, scrollToClipCenter } from './utils.js';

// Find all clips with behaviors in chronological order
function findAllBehaviorClips() {
  const transcriptContainer = document.querySelector('.transcript-container');
  if (!transcriptContainer) return [];
  
  const clips = transcriptContainer.querySelectorAll('.transcript-clip.evidence');
  const behaviorClips = [];
  
  clips.forEach((clip) => {
    const behaviourElement = clip.querySelector('.behaviour');
    if (behaviourElement) {
      const startTime = getClipStartTime(clip);
      if (startTime !== null) {
        behaviorClips.push({
          clip: clip,
          startTime: startTime,
          behaviorName: behaviourElement.textContent.trim()
        });
      }
    }
  });
  
  // Sort by start time (chronological order)
  behaviorClips.sort((a, b) => a.startTime - b.startTime);
  
  return behaviorClips;
}

// Initialize behavior navigation
export function initBehaviorNavigation(sound, setAutoScrollEnabledFn, getSetProgrammaticScrollCallbackFn) {
  const nextClipLinkElement = document.querySelector('.clip-link.next-clip-link');
  const previousClipLinkElement = document.querySelector('.clip-link.previous-clip-link');
  const nextClipLink = nextClipLinkElement ? nextClipLinkElement.querySelector('a.next-clip-link') : null;
  const previousClipLink = previousClipLinkElement ? previousClipLinkElement.querySelector('a.previous-clip-link') : null;
  const nextClipWrapper = document.querySelector('.next-clip-wrapper');
  
  if (!nextClipLink || !previousClipLink || !nextClipWrapper || !nextClipLinkElement || !previousClipLinkElement) return;
  
  // Find all behavior clips
  const behaviorClips = findAllBehaviorClips();
  
  if (behaviorClips.length === 0) {
    // Hide navigation if no behavior clips found
    nextClipWrapper.style.display = 'none';
    return;
  }
  
  // Show element with animation on load
  setTimeout(() => {
    nextClipWrapper.classList.add('visible');
  }, 100);
  
  // Track current behavior index (-1 means not started)
  let currentBehaviorIndex = -1;
  let hasNavigated = false;
  let trackingIntervalId = null;
  
  // Update link states
  function updateLinkStates() {
    // Update previous link
    if (currentBehaviorIndex <= 0) {
      previousClipLinkElement.classList.add('disabled');
      previousClipLink.style.pointerEvents = 'none';
      previousClipLink.style.opacity = '0.3';
      previousClipLink.style.cursor = 'not-allowed';
    } else {
      previousClipLinkElement.classList.remove('disabled');
      previousClipLink.style.pointerEvents = 'auto';
      previousClipLink.style.opacity = '1';
      previousClipLink.style.cursor = 'pointer';
    }
    
    // Update next link
    if (currentBehaviorIndex >= behaviorClips.length - 1) {
      nextClipLinkElement.classList.add('disabled');
      nextClipLink.style.pointerEvents = 'none';
      nextClipLink.style.opacity = '0.3';
      nextClipLink.style.cursor = 'not-allowed';
    } else {
      nextClipLinkElement.classList.remove('disabled');
      nextClipLink.style.pointerEvents = 'auto';
      nextClipLink.style.opacity = '1';
      nextClipLink.style.cursor = 'pointer';
    }
    
    // Update next link text
    if (!hasNavigated) {
      nextClipLink.textContent = 'First detected behaviour ↘';
    } else {
      nextClipLink.textContent = 'Next detected behaviour ↘';
    }
  }
  
  // Navigate to a specific behavior clip
  function navigateToBehavior(index) {
    if (index < 0 || index >= behaviorClips.length) return;
    
    const behaviorClip = behaviorClips[index];
    const targetClip = behaviorClip.clip;
    
    // Enable auto-scroll
    if (setAutoScrollEnabledFn) {
      setAutoScrollEnabledFn(true);
    }
    
    // Scroll to clip
    const setProgrammaticScrollCallback = getSetProgrammaticScrollCallbackFn ? getSetProgrammaticScrollCallbackFn() : null;
    scrollToClipCenter(targetClip, setProgrammaticScrollCallback);
    
    // Start playback from the clip's start time
    if (sound) {
      const seekTime = behaviorClip.startTime;
      if (seekTime !== null && seekTime >= 0) {
        sound.seek(seekTime);
        if (!sound.playing()) {
          sound.play();
        }
      }
    }
    
    // Update current index
    currentBehaviorIndex = index;
    hasNavigated = true;
    updateLinkStates();
  }
  
  // Handle next link click
  nextClipLink.addEventListener('click', function(e) {
    e.preventDefault();
    if (nextClipLinkElement.classList.contains('disabled')) return;
    
    const nextIndex = currentBehaviorIndex + 1;
    if (nextIndex < behaviorClips.length) {
      navigateToBehavior(nextIndex);
    }
  });
  
  // Handle previous link click
  previousClipLink.addEventListener('click', function(e) {
    e.preventDefault();
    if (previousClipLinkElement.classList.contains('disabled')) return;
    
    const prevIndex = currentBehaviorIndex - 1;
    if (prevIndex >= 0) {
      navigateToBehavior(prevIndex);
    }
  });
  
  // Update behavior index based on current playback position
  function updateBehaviorIndexFromPlayback() {
    if (!sound) return;
    
    try {
      const currentTime = sound.seek();
      if (currentTime === null || currentTime === undefined || currentTime < 0) return;
      
      // Find the behavior clip that corresponds to current playback position
      // We want to find the last behavior clip that has started (startTime <= currentTime)
      let newBehaviorIndex = -1;
      
      for (let i = behaviorClips.length - 1; i >= 0; i--) {
        if (behaviorClips[i].startTime <= currentTime) {
          newBehaviorIndex = i;
          break;
        }
      }
      
      // Only update if the index changed
      if (newBehaviorIndex !== currentBehaviorIndex) {
        currentBehaviorIndex = newBehaviorIndex;
        if (newBehaviorIndex >= 0) {
          hasNavigated = true;
        } else {
          // If we're before all behaviors, keep hasNavigated as is (don't reset)
        }
        updateLinkStates();
      }
    } catch (e) {
      // Ignore errors (e.g., if sound is not ready)
    }
  }
  
  // Start tracking playback position
  function startPlaybackTracking() {
    if (trackingIntervalId) return;
    
    trackingIntervalId = setInterval(() => {
      if (sound) {
        try {
          // Always update based on current position, even if paused
          // This handles cases where user seeks manually
          updateBehaviorIndexFromPlayback();
        } catch (e) {
          // Ignore errors
        }
      }
    }, 200); // Check every 200ms
  }
  
  // Stop tracking playback position
  function stopPlaybackTracking() {
    if (trackingIntervalId) {
      clearInterval(trackingIntervalId);
      trackingIntervalId = null;
    }
  }
  
  // Start tracking immediately and keep it running
  // This ensures we catch all position changes (playback, seeking, etc.)
  if (sound) {
    startPlaybackTracking();
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      stopPlaybackTracking();
    });
  }
  
  // Initialize link states
  updateLinkStates();
  
  // Initial update based on current position
  updateBehaviorIndexFromPlayback();
  
  // Handle scroll-based visibility
  function updateVisibility() {
    const transcriptContainer = document.querySelector('.transcript-container');
    if (!transcriptContainer) return;
    
    const clips = transcriptContainer.querySelectorAll('.transcript-clip.evidence');
    if (clips.length === 0) return;
    
    // Get the last clip
    const lastClip = clips[clips.length - 1];
    const lastClipRect = lastClip.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Check if last clip is above 2/3 of viewport height (from top)
    const twoThirdsHeight = viewportHeight * (2 / 3);
    const isLastClipAboveThreshold = lastClipRect.top < twoThirdsHeight;
    
    // Check if transcript container bottom is above viewport (scrolled past transcript)
    const transcriptRect = transcriptContainer.getBoundingClientRect();
    const isTranscriptBottomAboveViewport = transcriptRect.bottom < viewportHeight;
    
    // Hide if last clip is above threshold AND we've scrolled past the transcript (bottom is above viewport)
    // This means we're below the transcript, so hide the navigation
    // Show if transcript is still visible (not scrolled past it)
    if (isLastClipAboveThreshold && isTranscriptBottomAboveViewport) {
      // Hide element (move down) - we're below the transcript
      nextClipWrapper.classList.remove('visible');
    } else {
      // Show element - transcript is still on screen
      nextClipWrapper.classList.add('visible');
    }
  }
  
  // Add scroll listener for visibility
  const scrollContainer = document.querySelector('.main-content') || window;
  let scrollTimeout;
  scrollContainer.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateVisibility, 10);
  });
  
  // Initial visibility check
  updateVisibility();
  
  // Also check on resize
  window.addEventListener('resize', updateVisibility);
}


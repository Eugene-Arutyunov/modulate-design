import { getClipStartTime, formatTime } from './utils.js';
import { getCurrentClipIndex } from './clip-metadata.js';
import { updatePlayingClip } from './clip-metadata.js';
import { scrollToClipCenter } from './utils.js';
import { updateEmotionCaption, fadeOutEmotionCaption } from './emotions.js';

// Initialize transcript clips interaction (click and hover sync)
export function initTranscriptClipsInteraction(sound, clipMetadata, updatePlayingClipFn, getCurrentClipIndexFn, getAutoScrollEnabledFn, setAutoScrollEnabledFn, getSetProgrammaticScrollCallbackFn, setInitiatedFromBehaviourColumnFn) {
  if (!sound) return null;
  
  const visualization = document.querySelector('.player-visualization');
  const transcriptContainer = document.querySelector('.transcript-container');
  const audioPlayer = document.getElementById('audio-player');
  const hoverIndicator = audioPlayer ? audioPlayer.querySelector('.player-hover-position-indicator') : null;
  const hoverTimeElement = hoverIndicator ? hoverIndicator.querySelector('[data-hover-time]') : null;
  const mediaBox = audioPlayer ? audioPlayer.closest('.media-box') : null;
  
  if (!visualization || !transcriptContainer) return null;
  
  const visualizationClips = visualization.querySelectorAll('.transcript-clip');
  const containerClips = transcriptContainer.querySelectorAll('.transcript-clip');
  
  // Add indices to container clips (visualization clips already have indices)
  containerClips.forEach((clip, index) => {
    clip.setAttribute("data-clip-index", index.toString());
  });
  
  // Create mapping: clip index -> [visualization element, container element]
  const clipMap = new Map();
  visualizationClips.forEach((clip) => {
    const index = clip.getAttribute("data-clip-index");
    if (index !== null) {
      if (!clipMap.has(index)) {
        clipMap.set(index, { visualization: null, container: null });
      }
      clipMap.get(index).visualization = clip;
    }
  });
  
  containerClips.forEach((clip) => {
    const index = clip.getAttribute("data-clip-index");
    if (index !== null) {
      if (!clipMap.has(index)) {
        clipMap.set(index, { visualization: null, container: null });
      }
      clipMap.get(index).container = clip;
    }
  });
  
  // Function to update hover position indicator
  function updateHoverPositionIndicator(clipElement) {
    if (!hoverIndicator || !hoverTimeElement || !visualization) return;
    
    const clipStartTime = getClipStartTime(clipElement);
    if (clipStartTime === null || clipStartTime < 0) return;
    
    const duration = sound.duration();
    if (!duration || duration <= 0) return;
    
    // Calculate position percentage
    const percentage = (clipStartTime / duration) * 100;
    
    // Get visualization width
    const visualizationRect = visualization.getBoundingClientRect();
    const visualizationWidth = visualizationRect.width;
    
    // Calculate indicator position
    const indicatorLeft = (percentage / 100) * visualizationWidth;
    hoverIndicator.style.left = `${indicatorLeft}px`;
    
    // Update time display
    hoverTimeElement.textContent = formatTime(clipStartTime);
    
    // Show indicator
    hoverIndicator.classList.add('active');
    
    // Add class to media-box for browsers without :has() support
    if (mediaBox) {
      mediaBox.classList.add('has-hover-indicator');
    }
  }
  
  // Function to hide hover position indicator
  function hideHoverPositionIndicator() {
    if (hoverIndicator) {
      hoverIndicator.classList.remove('active');
    }
    // Remove class from media-box for browsers without :has() support
    if (mediaBox) {
      mediaBox.classList.remove('has-hover-indicator');
    }
  }
  
  // Function to sync hover between corresponding clips (including speaker-fingerprint)
  function syncHover(clipElement, isHovering) {
    const index = clipElement.getAttribute("data-clip-index");
    if (index === null) return;
    
    const pair = clipMap.get(index);
    if (!pair) return;
    
    // Clear all hover classes first to prevent stuck states
    if (isHovering) {
      document.querySelectorAll('.transcript-clip.hover, .speaker-fingerprint-clip.hover').forEach(el => {
        el.classList.remove('hover');
      });
    }
    
    // Add or remove hover class from both elements
    if (pair.visualization) {
      if (isHovering) {
        pair.visualization.classList.add('hover');
      } else {
        pair.visualization.classList.remove('hover');
      }
    }
    
    if (pair.container) {
      if (isHovering) {
        pair.container.classList.add('hover');
      } else {
        pair.container.classList.remove('hover');
      }
    }
    
    // Also sync with speaker-fingerprint clips
    if (isHovering) {
      document.querySelectorAll(`.speaker-fingerprint-clip[data-clip-index="${index}"]`).forEach(el => {
        el.classList.add('hover');
      });
    } else {
      document.querySelectorAll(`.speaker-fingerprint-clip[data-clip-index="${index}"]`).forEach(el => {
        el.classList.remove('hover');
      });
    }
    
    // Sync with behaviour indicators
    if (isHovering) {
      document.querySelectorAll(`.behaviour-indicator[data-clip-index="${index}"]`).forEach(el => {
        el.classList.add('hover');
      });
    } else {
      document.querySelectorAll(`.behaviour-indicator[data-clip-index="${index}"]`).forEach(el => {
        el.classList.remove('hover');
      });
    }
    
    // Update hover position indicator only for visualization clips
    const isVisualizationClip = clipElement.closest('.player-visualization') !== null;
    if (isVisualizationClip) {
      if (isHovering) {
        updateHoverPositionIndicator(clipElement);
      } else {
        hideHoverPositionIndicator();
      }
    } else if (!isHovering) {
      // Hide indicator when leaving transcript container clip (if it was shown from visualization)
      hideHoverPositionIndicator();
    }
  }
  
  // Track if mouse is over visualization area
  let isOverVisualization = false;
  
  // Handle mouse enter/leave for entire visualization area
  visualization.addEventListener('mouseenter', function() {
    isOverVisualization = true;
  });
  
  visualization.addEventListener('mouseleave', function() {
    isOverVisualization = false;
    fadeOutEmotionCaption();
    // Hide hover indicator when leaving visualization area
    hideHoverPositionIndicator();
  });
  
  // Add click handlers to container clips
  containerClips.forEach((clip) => {
    clip.addEventListener('click', function() {
      // Hide hover indicator when clicking on clip
      hideHoverPositionIndicator();
      
      // Check if this clip is currently playing
      if (clip.classList.contains('playing')) {
        // Stop playback and remove playing indicator
        sound.pause();
        if (updatePlayingClipFn && clipMap) {
          const setProgrammaticScrollCallback = getSetProgrammaticScrollCallbackFn ? getSetProgrammaticScrollCallbackFn() : null;
          updatePlayingClipFn(null, clipMap, false, setProgrammaticScrollCallback, scrollToClipCenter);
        }
        return;
      }
      
      const seekTime = getClipStartTime(clip);
      if (seekTime !== null && seekTime >= 0) {
        // Enable auto-scroll when clicking on clip in transcript container
        if (setAutoScrollEnabledFn) {
          setAutoScrollEnabledFn(true);
        }
        // Mark that playback was initiated from behaviour-column
        if (setInitiatedFromBehaviourColumnFn) {
          setInitiatedFromBehaviourColumnFn(true);
        }
        
        sound.seek(seekTime);
        if (!sound.playing()) {
          sound.play();
        }
        
        // Update playing clip immediately after seek
        if (clipMetadata && clipMetadata.length > 0 && updatePlayingClipFn && getCurrentClipIndexFn) {
          const newClipIndex = getCurrentClipIndexFn(seekTime, clipMetadata);
          const autoScrollEnabled = getAutoScrollEnabledFn ? getAutoScrollEnabledFn() : true;
          const setProgrammaticScrollCallback = getSetProgrammaticScrollCallbackFn ? getSetProgrammaticScrollCallbackFn() : null;
          updatePlayingClipFn(newClipIndex, clipMap, autoScrollEnabled, setProgrammaticScrollCallback, scrollToClipCenter);
        }
      }
    });
    
    // Add hover handlers
    clip.addEventListener('mouseenter', function() {
      syncHover(clip, true);
      updateEmotionCaption(clip);
    });
    
    clip.addEventListener('mouseleave', function() {
      syncHover(clip, false);
      // Don't fade out here - only fade out when leaving entire visualization
    });
  });
  
  // Add hover handlers to visualization clips
  visualizationClips.forEach((clip) => {
    // Add click handler to hide hover indicator when clicking on visualization clip
    clip.addEventListener('click', function() {
      hideHoverPositionIndicator();
    });
    
    clip.addEventListener('mouseenter', function() {
      syncHover(clip, true);
      updateEmotionCaption(clip);
    });
    
    clip.addEventListener('mouseleave', function() {
      syncHover(clip, false);
      // Don't fade out here - only fade out when leaving entire visualization
    });
  });
  
  // Return clipMap for use in playback tracking
  return clipMap;
}

import { getClipStartTime } from './utils.js';
import { getCurrentClipIndex } from './clip-metadata.js';
import { updatePlayingClip } from './clip-metadata.js';
import { scrollToClipCenter } from './utils.js';
import { updateEmotionCaption, fadeOutEmotionCaption } from './emotions.js';

// Initialize transcript clips interaction (click and hover sync)
export function initTranscriptClipsInteraction(sound, clipMetadata, updatePlayingClipFn, getCurrentClipIndexFn, getAutoScrollEnabledFn, setAutoScrollEnabledFn, getSetProgrammaticScrollCallbackFn) {
  if (!sound) return null;
  
  const visualization = document.querySelector('.player-visualization');
  const transcriptContainer = document.querySelector('.transcript-container');
  
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
  });
  
  // Add click handlers to container clips
  containerClips.forEach((clip) => {
    clip.addEventListener('click', function() {
      const seekTime = getClipStartTime(clip);
      if (seekTime !== null && seekTime >= 0) {
        // Enable auto-scroll when clicking on clip
        if (setAutoScrollEnabledFn) {
          setAutoScrollEnabledFn(true);
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

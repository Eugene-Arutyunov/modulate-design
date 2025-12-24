import { getClipStartTime, parseClipDuration } from './utils.js';
import { getCurrentClipIndex } from './clip-metadata.js';
import { updatePlayingClip } from './clip-metadata.js';
import { scrollToClipCenter } from './utils.js';
import { updateFingerprintEmotionCaption, fadeOutFingerprintEmotionCaption } from './emotions.js';

// Sync hover for speaker-fingerprint clips with all other visualizations
function syncFingerprintHover(fingerprintClip, isHovering, clipMap) {
  const index = fingerprintClip.getAttribute("data-clip-index");
  if (index === null) return;
  
  const pair = clipMap.get(index);
  if (!pair) return;
  
  // Clear all hover classes first to prevent stuck states
  if (isHovering) {
    document.querySelectorAll('.transcript-clip.hover, .speaker-fingerprint-clip.hover').forEach(el => {
      el.classList.remove('hover');
    });
  }
  
  // Add or remove hover class from visualization element
  if (pair.visualization) {
    if (isHovering) {
      pair.visualization.classList.add('hover');
    } else {
      pair.visualization.classList.remove('hover');
    }
  }
  
  // Add or remove hover class from container element
  if (pair.container) {
    if (isHovering) {
      pair.container.classList.add('hover');
    } else {
      pair.container.classList.remove('hover');
    }
  }
  
  // Add or remove hover class from all speaker-fingerprint clips with same index
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
}

// Initialize speaker fingerprint visualizations
export function initSpeakerFingerprints(sound, clipMap, clipMetadata, updatePlayingClipFn, getCurrentClipIndexFn, setAutoScrollEnabledFn, getSetProgrammaticScrollCallbackFn) {
  const visualization = document.querySelector('.player-visualization');
  if (!visualization) return;
  
  const allClips = visualization.querySelectorAll('.transcript-clip');
  if (allClips.length === 0) return;
  
  // Group clips by speaker index
  const clipsBySpeaker = new Map();
  
  allClips.forEach((clip) => {
    const speakerIndex = clip.getAttribute('data-speaker-index');
    if (!speakerIndex) return;
    
    const clipIndex = clip.getAttribute('data-clip-index');
    if (clipIndex === null) return;
    
    if (!clipsBySpeaker.has(speakerIndex)) {
      clipsBySpeaker.set(speakerIndex, []);
    }
    
    clipsBySpeaker.get(speakerIndex).push({
      element: clip,
      clipIndex: clipIndex,
      duration: parseClipDuration(clip),
      emotionClass: Array.from(clip.classList).find(cls => cls.startsWith('emotion-')) || 'emotion-neutral',
      seekTime: getClipStartTime(clip)
    });
  });
  
  // Calculate total duration for each speaker
  const speakerTotalDurations = new Map();
  clipsBySpeaker.forEach((clips, speakerIndex) => {
    const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
    speakerTotalDurations.set(speakerIndex, totalDuration);
  });
  
  // Find emotions summary table
  const emotionsTable = document.querySelector('.emotions-summary');
  if (!emotionsTable) return;
  
  // Create fingerprint visualizations for each speaker (only in emotions table)
  clipsBySpeaker.forEach((clips, speakerIndex) => {
    const fingerprintContainer = emotionsTable.querySelector(`.speaker-fingerprint[data-speaker-index="${speakerIndex}"]`);
    if (!fingerprintContainer) return;
    
    // Get wrapper and parent td
    const wrapper = fingerprintContainer.closest('.speaker-fingerprint-wrapper');
    if (!wrapper) return;
    const parentTd = wrapper.closest('td');
    if (!parentTd) return;
    
    // Calculate speaker's total duration
    const speakerTotalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
    
    // Set width to 100% of parent td
    fingerprintContainer.style.width = '100%';
    
    // Clear existing content
    fingerprintContainer.innerHTML = '';
    
    // Sort clips only by their original order (clipIndex) - transcript order
    clips.sort((a, b) => {
      return parseInt(a.clipIndex) - parseInt(b.clipIndex);
    });
    
    // Create clip rectangles
    clips.forEach((clipData) => {
      const clipRect = document.createElement('div');
      clipRect.className = `speaker-fingerprint-clip ${clipData.emotionClass}`;
      clipRect.setAttribute('data-clip-index', clipData.clipIndex);
      if (clipData.seekTime !== null) {
        clipRect.setAttribute('data-seek-time', clipData.seekTime.toString());
      }
      
      // Calculate width as percentage of speaker's total duration (not max)
      // This ensures clips fill the entire fingerprint width
      const widthPercent = speakerTotalDuration > 0 ? (clipData.duration / speakerTotalDuration) * 100 : 0;
      clipRect.style.width = `${widthPercent}%`;
      clipRect.style.minWidth = '2px';
      
      // Add hover handlers
      clipRect.addEventListener('mouseenter', function() {
        syncFingerprintHover(clipRect, true, clipMap);
        // Update fingerprint emotion caption if the original clip is available
        const originalClip = clipData.element;
        if (originalClip) {
          updateFingerprintEmotionCaption(originalClip, speakerIndex);
        }
      });
      
      clipRect.addEventListener('mouseleave', function() {
        syncFingerprintHover(clipRect, false, clipMap);
      });
      
      // Add click handler
      clipRect.addEventListener('click', function() {
        const seekTime = clipData.seekTime;
        if (seekTime !== null && seekTime >= 0 && sound) {
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
            const autoScrollEnabled = setAutoScrollEnabledFn ? setAutoScrollEnabledFn() : true;
            const setProgrammaticScrollCallback = getSetProgrammaticScrollCallbackFn ? getSetProgrammaticScrollCallbackFn() : null;
            updatePlayingClipFn(newClipIndex, clipMap, autoScrollEnabled, setProgrammaticScrollCallback, scrollToClipCenter);
          }
        }
      });
      
      fingerprintContainer.appendChild(clipRect);
    });
    
    // Add mouseleave handler to fingerprint wrapper to fade out caption when leaving fingerprint area
    const fingerprintWrapper = fingerprintContainer.closest('.speaker-fingerprint-wrapper');
    if (fingerprintWrapper) {
      fingerprintWrapper.addEventListener('mouseleave', function() {
        fadeOutFingerprintEmotionCaption(speakerIndex);
      });
    }
  });
  
}

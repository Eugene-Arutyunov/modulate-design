import { findFirstClipWithBehavior, getClipStartTime, scrollToClipCenter } from './utils.js';

// Initialize behavior link handlers
export function initBehaviorLinkHandlers(sound, setAutoScrollEnabledFn, getSetProgrammaticScrollCallbackFn) {
  // Handle detected-behaviour links
  const detectedBehaviourLinks = document.querySelectorAll('.detected-behaviour');
  detectedBehaviourLinks.forEach((link) => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const behaviorName = link.textContent.trim();
      const targetClip = findFirstClipWithBehavior(behaviorName);
      if (targetClip) {
        // Enable auto-scroll when clicking on behavior link
        if (setAutoScrollEnabledFn) {
          setAutoScrollEnabledFn(true);
        }
        
        const setProgrammaticScrollCallback = getSetProgrammaticScrollCallbackFn ? getSetProgrammaticScrollCallbackFn() : null;
        scrollToClipCenter(targetClip, setProgrammaticScrollCallback);
        
        // Start playback from the clip's start time
        if (sound) {
          const seekTime = getClipStartTime(targetClip);
          if (seekTime !== null && seekTime >= 0) {
            sound.seek(seekTime);
            if (!sound.playing()) {
              sound.play();
            }
          }
        }
      }
    });
  });
  
  // Handle behaviour-label links
  const behaviourLabelLinks = document.querySelectorAll('.behaviour-label a');
  behaviourLabelLinks.forEach((link) => {
    const behaviourLabel = link.closest('.behaviour-label');
    
    // Add hover handlers for border color change
    link.addEventListener('mouseenter', function() {
      if (behaviourLabel) {
        behaviourLabel.classList.add('hover');
      }
    });
    
    link.addEventListener('mouseleave', function() {
      if (behaviourLabel) {
        behaviourLabel.classList.remove('hover');
      }
    });
    
    // Handle click
    link.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation(); // Prevent click from reaching the clip underneath
      const span = link.querySelector('span');
      if (span) {
        const behaviorName = span.textContent.trim();
        const targetClip = findFirstClipWithBehavior(behaviorName);
        if (targetClip) {
          // Enable auto-scroll when clicking on behavior link
          if (setAutoScrollEnabledFn) {
            setAutoScrollEnabledFn(true);
          }
          
          const setProgrammaticScrollCallback = getSetProgrammaticScrollCallbackFn ? getSetProgrammaticScrollCallbackFn() : null;
          scrollToClipCenter(targetClip, setProgrammaticScrollCallback);
          
          // Start playback from the clip's start time
          if (sound) {
            const seekTime = getClipStartTime(targetClip);
            if (seekTime !== null && seekTime >= 0) {
              sound.seek(seekTime);
              if (!sound.playing()) {
                sound.play();
              }
            }
          }
        }
      }
    });
  });
}

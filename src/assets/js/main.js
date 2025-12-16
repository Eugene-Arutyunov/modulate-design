import { initStickyObserver } from './sticky-observer.js';
import { initPlayerVisualization } from './player-visualization.js';
import { initAudioPlayer } from './audio-player.js';
import { initTranscriptClipsInteraction } from './transcript-clips.js';
import { initSpeakerFingerprints } from './speaker-fingerprints.js';
import { initBehaviorLinkHandlers } from './behavior-links.js';
import { initBehaviorNavigation } from './behavior-navigation.js';
import { initSharePopover } from './share-popover.js';
import { getCurrentClipIndex } from './clip-metadata.js';
import { updatePlayingClip } from './clip-metadata.js';
import { scrollToClipCenter } from './utils.js';
import { initClickableTableRows, initTableFingerprints } from './demo-recordings-table.js';
import { initFingerprintVisualization } from './fingerprint-visualization.js';
import { initUploadForm, initUploadAreaStateSwitcher } from './upload-form.js';

// Initialize when DOM is ready
function init() {
  initStickyObserver();
  initPlayerVisualization();
  initFingerprintVisualization();
  initClickableTableRows();
  initTableFingerprints();
  initUploadForm();
  initUploadAreaStateSwitcher();
  const audioPlayerResult = initAudioPlayer();
  
  if (!audioPlayerResult) {
    // If audio player failed to initialize, still initialize other components
    initSharePopover();
    return;
  }
  
  const clipMap = initTranscriptClipsInteraction(
    audioPlayerResult.sound,
    audioPlayerResult.clipMetadata,
    (clipIndex, map, shouldScroll, setProgrammaticFlagCallback) => {
      updatePlayingClip(clipIndex, map, shouldScroll, setProgrammaticFlagCallback, scrollToClipCenter);
    },
    getCurrentClipIndex,
    audioPlayerResult.getAutoScrollEnabled,
    audioPlayerResult.setAutoScrollEnabled,
    audioPlayerResult.getSetProgrammaticScrollCallback
  );
  
  if (audioPlayerResult && audioPlayerResult.setClipMap) {
    audioPlayerResult.setClipMap(clipMap);
    // Don't set initial playing clip on page load - only when playback starts
  }
  
  initSpeakerFingerprints(
    audioPlayerResult.sound,
    clipMap,
    audioPlayerResult.clipMetadata,
    (clipIndex, map, shouldScroll, setProgrammaticFlagCallback) => {
      updatePlayingClip(clipIndex, map, shouldScroll, setProgrammaticFlagCallback, scrollToClipCenter);
    },
    getCurrentClipIndex,
    audioPlayerResult.setAutoScrollEnabled,
    audioPlayerResult.getSetProgrammaticScrollCallback
  );
  
  initBehaviorLinkHandlers(
    audioPlayerResult.sound,
    audioPlayerResult.setAutoScrollEnabled,
    audioPlayerResult.getSetProgrammaticScrollCallback
  );
  
  initBehaviorNavigation(
    audioPlayerResult.sound,
    audioPlayerResult.setAutoScrollEnabled,
    audioPlayerResult.getSetProgrammaticScrollCallback
  );
  
  initSharePopover();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

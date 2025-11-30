import { initStickyObserver } from './sticky-observer.js';
import { initPlayerVisualization } from './player-visualization.js';
import { initAudioPlayer } from './audio-player.js';
import { initTranscriptClipsInteraction } from './transcript-clips.js';
import { initSpeakerFingerprints } from './speaker-fingerprints.js';
import { initBehaviorLinkHandlers } from './behavior-links.js';
import { initEditableSpeakerNames } from './speaker-names.js';
import { initSharePopover } from './share-popover.js';
import { getCurrentClipIndex } from './clip-metadata.js';
import { updatePlayingClip } from './clip-metadata.js';
import { scrollToClipCenter } from './utils.js';

// Initialize when DOM is ready
function init() {
  initStickyObserver();
  initPlayerVisualization();
  const audioPlayerResult = initAudioPlayer();
  
  if (!audioPlayerResult) {
    // If audio player failed to initialize, still initialize other components
    initEditableSpeakerNames();
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
  
  initEditableSpeakerNames();
  initSharePopover();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

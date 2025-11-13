function initStickyObserver() {
  const stickyElement = document.querySelector(".sticky");

  if (!stickyElement) return;

  function checkSticky() {
    const rect = stickyElement.getBoundingClientRect();
    const stickyTop = parseInt(getComputedStyle(stickyElement).top) || 0;

    if (rect.top <= stickyTop) {
      stickyElement.classList.add("stuck");
    } else {
      stickyElement.classList.remove("stuck");
    }
  }

  // Check on scroll
  window.addEventListener("scroll", checkSticky);

  // Check on window resize
  window.addEventListener("resize", checkSticky);

  // Check immediately on load
  checkSticky();
}

function initPlayerVisualization() {
  const visualization = document.querySelector(".player-visualization");
  
  if (!visualization) return;

  const clips = visualization.querySelectorAll(".transcript-clip");

  clips.forEach((clip, index) => {
    const position = clip.getAttribute("data-position");
    const width = clip.getAttribute("data-width");

    if (position !== null && width !== null) {
      clip.style.left = `${position}%`;
      clip.style.width = `${width}%`;
    }
    
    // Add unique clip index for hover synchronization
    clip.setAttribute("data-clip-index", index.toString());
  });
}

// ==================== Audio Player Functions ====================

// Helper function: format seconds to "M:SS" or "MM:SS"
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper function: get padding in pixels from CSS variable
function getPaddingInPixels(element) {
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

// Initialize audio player
function initAudioPlayer() {
  const audioPlayer = document.getElementById('audio-player');
  if (!audioPlayer) return;

  const audioSrc = audioPlayer.dataset.audioSrc;
  if (!audioSrc) {
    console.error('Audio source not found');
    return;
  }

  // Create Howl instance
  const sound = new Howl({
    src: [audioSrc],
    html5: true,
    onload: function() {
      const duration = sound.duration();
      const durationElement = audioPlayer.querySelector('[data-total-time]');
      const totalDurationElement = audioPlayer.querySelector('[data-total-duration]');
      
      if (durationElement) {
        durationElement.textContent = formatTime(duration);
      }
      if (totalDurationElement) {
        totalDurationElement.dataset.totalDuration = duration.toString();
      }
      
      // Update initial position
      updatePlayerPosition(0);
    },
    onloaderror: function(id, error) {
      console.error('Error loading audio:', error);
    },
    onplay: function() {
      startPositionUpdate();
    },
    onpause: function() {
      stopPositionUpdate();
    },
    onend: function() {
      stopPositionUpdate();
      updatePlayerPosition(0);
    }
  });

  // State variables
  let animationFrameId = null;
  let isUpdating = false;

  // Update player position and time
  function updatePlayerPosition(currentTime) {
    const duration = sound.duration();
    if (!duration) return;

    const indicator = audioPlayer.querySelector('.player-position-indicator');
    const currentTimeElement = audioPlayer.querySelector('[data-current-time]');
    const visualization = audioPlayer.querySelector('.player-visualization');
    
    if (!indicator || !currentTimeElement || !visualization) return;

    // Calculate position percentage
    const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Get visualization width (it now takes full width of parent)
    const visualizationRect = visualization.getBoundingClientRect();
    const visualizationWidth = visualizationRect.width;

    // Calculate indicator position (no padding, starts from 0)
    const indicatorLeft = (percentage / 100) * visualizationWidth;
    indicator.style.left = `${indicatorLeft}px`;

    // Update time display
    currentTimeElement.textContent = formatTime(currentTime);
  }

  // Start position update loop
  function startPositionUpdate() {
    if (isUpdating) return;
    isUpdating = true;

    function update() {
      if (sound.playing()) {
        const currentTime = sound.seek();
        updatePlayerPosition(currentTime);
        animationFrameId = requestAnimationFrame(update);
      } else {
        isUpdating = false;
      }
    }

    animationFrameId = requestAnimationFrame(update);
  }

  // Stop position update loop
  function stopPositionUpdate() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    isUpdating = false;
  }

  // Play/Pause handler
  const playPauseBtn = audioPlayer.querySelector('[data-action="play-pause"]');
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (sound.playing()) {
        sound.pause();
      } else {
        sound.play();
      }
    });
  }

  // Mute/Unmute handler
  const muteUnmuteBtn = audioPlayer.querySelector('[data-action="mute-unmute"]');
  if (muteUnmuteBtn) {
    muteUnmuteBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const isMuted = sound.mute();
      sound.mute(!isMuted);
    });
  }

  // Seek on transcript clip click
  const visualization = audioPlayer.querySelector('.player-visualization');
  if (visualization) {
    const clips = visualization.querySelectorAll('.transcript-clip');
    clips.forEach((clip) => {
      clip.addEventListener('click', function() {
        const seekTime = parseFloat(clip.dataset.seekTime);
        if (!isNaN(seekTime) && seekTime >= 0) {
          sound.seek(seekTime);
          if (!sound.playing()) {
            sound.play();
          }
        }
      });
    });
  }

  // Update position on window resize
  window.addEventListener('resize', function() {
    if (sound.playing() || sound.seek() > 0) {
      const currentTime = sound.seek();
      updatePlayerPosition(currentTime);
    }
  });
  
  // Return sound instance for use in transcript clips interaction
  return sound;
}

// ==================== Transcript Clips Interaction ====================

// Initialize transcript clips interaction (click and hover sync)
function initTranscriptClipsInteraction(sound) {
  if (!sound) return;
  
  const visualization = document.querySelector('.player-visualization');
  const transcriptContainer = document.querySelector('.transcript-container');
  
  if (!visualization || !transcriptContainer) return;
  
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
  
  // Function to sync hover between corresponding clips
  function syncHover(clipElement, isHovering) {
    const index = clipElement.getAttribute("data-clip-index");
    if (index === null) return;
    
    const pair = clipMap.get(index);
    if (!pair) return;
    
    // Clear all hover classes first to prevent stuck states
    if (isHovering) {
      document.querySelectorAll('.transcript-clip.hover').forEach(el => {
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
  }
  
  // Add click handlers to container clips
  containerClips.forEach((clip) => {
    clip.addEventListener('click', function() {
      const seekTime = parseFloat(clip.dataset.seekTime);
      if (!isNaN(seekTime) && seekTime >= 0) {
        sound.seek(seekTime);
        if (!sound.playing()) {
          sound.play();
        }
      }
    });
    
    // Add hover handlers
    clip.addEventListener('mouseenter', function() {
      syncHover(clip, true);
    });
    
    clip.addEventListener('mouseleave', function() {
      syncHover(clip, false);
    });
  });
  
  // Add hover handlers to visualization clips
  visualizationClips.forEach((clip) => {
    clip.addEventListener('mouseenter', function() {
      syncHover(clip, true);
    });
    
    clip.addEventListener('mouseleave', function() {
      syncHover(clip, false);
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initStickyObserver();
    initPlayerVisualization();
    const sound = initAudioPlayer();
    initTranscriptClipsInteraction(sound);
  });
} else {
  initStickyObserver();
  initPlayerVisualization();
  const sound = initAudioPlayer();
  initTranscriptClipsInteraction(sound);
}

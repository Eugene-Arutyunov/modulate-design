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

  // Handle behaviour labels positioning
  const mediaBox = visualization.closest(".media-box") || visualization.closest("#audio-player");
  if (mediaBox) {
    const behaviourLabels = mediaBox.querySelectorAll(".behaviour-label");
    
    behaviourLabels.forEach((label) => {
      const position = label.getAttribute("data-position");
      
      if (position !== null) {
        label.style.left = `${position}%`;
      }
    });
  }
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
      updatePlayPauseIcon();
    },
    onpause: function() {
      stopPositionUpdate();
      updatePlayPauseIcon();
    },
    onend: function() {
      stopPositionUpdate();
      updatePlayerPosition(0);
      updatePlayPauseIcon();
    }
  });

  // State variables
  let animationFrameId = null;
  let isUpdating = false;

  // Load SVG icon from sprite file
  async function loadIcon(container, iconId) {
    try {
      // Load the sprite file once and cache it
      if (!loadIcon.spriteCache) {
        const response = await fetch('/assets/icons/player-icons.svg');
        const svgText = await response.text();
        const parser = new DOMParser();
        loadIcon.spriteCache = parser.parseFromString(svgText, 'image/svg+xml');
        
        // Cache styles from defs
        const defs = loadIcon.spriteCache.querySelector('defs');
        if (defs) {
          loadIcon.spriteStyles = defs.innerHTML;
        }
      }
      
      // Find the icon group by id
      const iconGroup = loadIcon.spriteCache.querySelector(`#${iconId}`);
      if (iconGroup) {
        // Create a temporary SVG to compute bounding box
        const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        tempSvg.setAttribute('viewBox', '0 0 220 220');
        tempSvg.style.position = 'absolute';
        tempSvg.style.visibility = 'hidden';
        tempSvg.style.width = '0';
        tempSvg.style.height = '0';
        
        // Clone the group and add styles to temp SVG
        const tempGroup = iconGroup.cloneNode(true);
        if (loadIcon.spriteStyles) {
          const tempDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          tempDefs.innerHTML = loadIcon.spriteStyles;
          tempSvg.appendChild(tempDefs);
        }
        tempSvg.appendChild(tempGroup);
        document.body.appendChild(tempSvg);
        
        // Get bounding box
        const bbox = tempGroup.getBBox();
        document.body.removeChild(tempSvg);
        
        // Create a new SVG with viewBox matching the icon's bounding box
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Add styles from defs if available
        if (loadIcon.spriteStyles) {
          const defsElement = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          defsElement.innerHTML = loadIcon.spriteStyles;
          svgElement.appendChild(defsElement);
        }
        
        // Clone all children from the group
        Array.from(iconGroup.children).forEach(child => {
          svgElement.appendChild(child.cloneNode(true));
        });
        
        container.innerHTML = '';
        container.appendChild(svgElement);
      }
    } catch (error) {
      console.error('Error loading icon:', error);
    }
  }

  // Update play/pause icon (shows action that will happen)
  function updatePlayPauseIcon() {
    const playPauseBtn = audioPlayer.querySelector('[data-action="play-pause"]');
    if (!playPauseBtn) return;
    
    const isPlaying = sound.playing();
    // Show pause icon when playing (action: pause), show play icon when paused (action: play)
    const iconId = isPlaying ? 'icon-pause' : 'icon-play';
    playPauseBtn.setAttribute('data-playing', isPlaying ? 'true' : 'false');
    loadIcon(playPauseBtn, iconId);
  }

  // Update mute/unmute icon (shows current status)
  function updateMuteUnmuteIcon() {
    const muteUnmuteBtn = audioPlayer.querySelector('[data-action="mute-unmute"]');
    if (!muteUnmuteBtn) return;
    
    const isMuted = sound.mute();
    // Show mute icon when muted (status: muted), show unmute icon when unmuted (status: unmuted)
    const iconId = isMuted ? 'icon-mute' : 'icon-unmute';
    muteUnmuteBtn.setAttribute('data-muted', isMuted ? 'true' : 'false');
    loadIcon(muteUnmuteBtn, iconId);
  }

  // Initialize icons on load
  const playPauseBtn = audioPlayer.querySelector('[data-action="play-pause"]');
  const muteUnmuteBtn = audioPlayer.querySelector('[data-action="mute-unmute"]');
  if (playPauseBtn) {
    const initialIconId = playPauseBtn.getAttribute('data-icon-id') || 'icon-play';
    loadIcon(playPauseBtn, initialIconId);
  }
  if (muteUnmuteBtn) {
    const initialIconId = muteUnmuteBtn.getAttribute('data-icon-id') || 'icon-unmute';
    loadIcon(muteUnmuteBtn, initialIconId);
  }

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
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (sound.playing()) {
        sound.pause();
      } else {
        sound.play();
      }
      // Icon will be updated by onplay/onpause callbacks
    });
  }

  // Mute/Unmute handler
  if (muteUnmuteBtn) {
    muteUnmuteBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const isMuted = sound.mute();
      sound.mute(!isMuted);
      updateMuteUnmuteIcon();
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
          
          // Scroll to corresponding transcript clip
          const clipIndex = clip.getAttribute('data-clip-index');
          if (clipIndex !== null) {
            const transcriptContainer = document.querySelector('.transcript-container');
            if (transcriptContainer) {
              const transcriptClip = transcriptContainer.querySelector(`.transcript-clip[data-clip-index="${clipIndex}"]`);
              if (transcriptClip) {
                scrollToClipCenter(transcriptClip);
              }
            }
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

// ==================== Scroll to Clip Functions ====================

// Scroll to center a clip element in the viewport
function scrollToClipCenter(clipElement) {
  if (!clipElement) return;
  
  const elementRect = clipElement.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.pageYOffset;
  const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
  
  window.scrollTo({
    top: middle,
    behavior: 'smooth'
  });
}

// Find first clip with matching behavior name
function findFirstClipWithBehavior(behaviorName) {
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
}

// Update emotion caption on hover (instant, no transition)
function updateEmotionCaption(clip) {
  const emotionCaption = document.querySelector('.emotion-caption');
  if (!emotionCaption) return;
  
  // Extract emotion name from class (e.g., "emotion-angry" -> "angry")
  const emotionClasses = Array.from(clip.classList).filter(cls => cls.startsWith('emotion-'));
  if (emotionClasses.length === 0) return;
  
  const emotionName = emotionClasses[0].replace('emotion-', '');
  
  // Update text (don't clear, just update)
  emotionCaption.textContent = emotionName;
  
  // Apply color using CSS variable
  const emotionColorVar = `--emotion-${emotionName}-RGB`;
  const computedStyle = getComputedStyle(document.documentElement);
  const colorValue = computedStyle.getPropertyValue(emotionColorVar).trim();
  
  if (colorValue) {
    emotionCaption.style.color = `rgba(${colorValue}, 1)`;
  }
  
  // Show instantly (no transition)
  emotionCaption.classList.add('visible');
}

// Fade out emotion caption when leaving visualization area (with transition)
function fadeOutEmotionCaption() {
  const emotionCaption = document.querySelector('.emotion-caption');
  if (!emotionCaption) return;
  
  // Remove visible class to trigger fade out transition
  emotionCaption.classList.remove('visible');
}

// Initialize behavior link handlers
function initBehaviorLinkHandlers() {
  // Handle detected-behaviour links
  const detectedBehaviourLinks = document.querySelectorAll('.detected-behaviour');
  detectedBehaviourLinks.forEach((link) => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const behaviorName = link.textContent.trim();
      const targetClip = findFirstClipWithBehavior(behaviorName);
      if (targetClip) {
        scrollToClipCenter(targetClip);
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
          scrollToClipCenter(targetClip);
        }
      }
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
    initBehaviorLinkHandlers();
  });
} else {
  initStickyObserver();
  initPlayerVisualization();
  const sound = initAudioPlayer();
  initTranscriptClipsInteraction(sound);
  initBehaviorLinkHandlers();
}

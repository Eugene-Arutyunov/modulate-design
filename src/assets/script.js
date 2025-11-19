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

// Get precise start time from clip - uses data-time if available, otherwise data-seek-time
function getClipStartTime(clip) {
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
      autoScrollEnabled = true;
      startPositionUpdate();
      updatePlayPauseIcon();
    },
    onpause: function() {
      stopPositionUpdate();
      updatePlayPauseIcon();
      // Clear playing clip when audio is paused
      if (clipMap) {
        updatePlayingClip(null, clipMap);
        currentClipIndex = null;
      }
    },
    onend: function() {
      stopPositionUpdate();
      updatePlayerPosition(0);
      updatePlayPauseIcon();
      // Clear playing clip when audio ends
      if (clipMap) {
        updatePlayingClip(null, clipMap);
        currentClipIndex = null;
      }
    }
  });

  // State variables
  let animationFrameId = null;
  let isUpdating = false;
  let currentClipIndex = null;
  let clipMetadata = [];
  let clipMap = null;
  
  // Auto-scroll tracking
  let autoScrollEnabled = true;
  let lastScrollPosition = window.pageYOffset;
  let lastScrollTime = Date.now();
  let isProgrammaticScroll = false;

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
        
        // Update playing clip based on current time
        if (clipMetadata.length > 0 && clipMap) {
          const newClipIndex = getCurrentClipIndex(currentTime, clipMetadata);
          if (newClipIndex !== currentClipIndex) {
            currentClipIndex = newClipIndex;
            updatePlayingClip(currentClipIndex, clipMap, autoScrollEnabled, (flag) => { isProgrammaticScroll = flag; });
          }
        }
        
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
        const seekTime = getClipStartTime(clip);
        if (seekTime !== null && seekTime >= 0) {
          // Enable auto-scroll when clicking on clip
          autoScrollEnabled = true;
          
          sound.seek(seekTime);
          if (!sound.playing()) {
            sound.play();
          }
          
          // Update playing clip immediately after seek
          if (clipMetadata.length > 0 && clipMap) {
            const newClipIndex = getCurrentClipIndex(seekTime, clipMetadata);
            if (newClipIndex !== currentClipIndex) {
              currentClipIndex = newClipIndex;
              updatePlayingClip(currentClipIndex, clipMap, autoScrollEnabled, (flag) => { isProgrammaticScroll = flag; });
            }
          }
          
          // Scroll to corresponding transcript clip
          const clipIndex = clip.getAttribute('data-clip-index');
          if (clipIndex !== null) {
            const transcriptContainer = document.querySelector('.transcript-container');
            if (transcriptContainer) {
              const transcriptClip = transcriptContainer.querySelector(`.transcript-clip[data-clip-index="${clipIndex}"]`);
              if (transcriptClip) {
                scrollToClipCenter(transcriptClip, (flag) => { isProgrammaticScroll = flag; });
              }
            }
          }
        }
      });
    });
  }

  // Handle user scroll to detect when auto-scroll should be disabled
  window.addEventListener('scroll', function() {
    // Ignore programmatic scrolls
    if (isProgrammaticScroll) {
      return;
    }
    
    const currentScrollPosition = window.pageYOffset;
    const currentTime = Date.now();
    const scrollDistance = Math.abs(currentScrollPosition - lastScrollPosition);
    const timeDelta = currentTime - lastScrollTime;
    
    // Check if user scrolled more than half viewport height in less than 1 second
    const halfViewportHeight = window.innerHeight / 2;
    if (scrollDistance >= halfViewportHeight && timeDelta <= 1000) {
      autoScrollEnabled = false;
    }
    
    // Update tracking variables
    lastScrollPosition = currentScrollPosition;
    lastScrollTime = currentTime;
  });
  
  // Update position on window resize
  window.addEventListener('resize', function() {
    if (sound.playing() || sound.seek() > 0) {
      const currentTime = sound.seek();
      updatePlayerPosition(currentTime);
      
      // Update playing clip
      if (clipMetadata.length > 0 && clipMap) {
        const newClipIndex = getCurrentClipIndex(currentTime, clipMetadata);
        if (newClipIndex !== currentClipIndex) {
          currentClipIndex = newClipIndex;
          updatePlayingClip(currentClipIndex, clipMap, autoScrollEnabled, (flag) => { isProgrammaticScroll = flag; });
        }
      }
    }
  });
  
  // Initialize clip metadata and tracking
  clipMetadata = buildClipMetadata();
  
  // Return sound instance and metadata for use in transcript clips interaction
  return { 
    sound, 
    clipMetadata, 
    setClipMap: (map) => { clipMap = map; },
    getAutoScrollEnabled: () => autoScrollEnabled,
    setAutoScrollEnabled: (enabled) => { autoScrollEnabled = enabled; },
    getSetProgrammaticScrollCallback: () => (flag) => { isProgrammaticScroll = flag; }
  };
}

// ==================== Scroll to Clip Functions ====================

// Scroll to center a clip element in the viewport
// Accepts optional callback to set programmatic scroll flag
function scrollToClipCenter(clipElement, setProgrammaticFlagCallback = null) {
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

// ==================== Clip Playback Tracking ====================

// Parse duration from clip element - uses data-duration if available, otherwise parses text
function parseClipDuration(clip) {
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

// Build clip metadata array with start times, end times, and indices
function buildClipMetadata() {
  const visualization = document.querySelector('.player-visualization');
  if (!visualization) return [];
  
  const clips = visualization.querySelectorAll('.transcript-clip');
  const metadata = [];
  
  clips.forEach((clip, index) => {
    const startTime = getClipStartTime(clip);
    if (startTime === null) return;
    
    const duration = parseClipDuration(clip);
    const endTime = startTime + duration;
    
    metadata.push({
      index: index,
      startTime: startTime,
      endTime: endTime,
      duration: duration
    });
  });
  
  // Sort by start time to ensure correct order
  metadata.sort((a, b) => a.startTime - b.startTime);
  
  return metadata;
}

// Get current clip index based on playback time
function getCurrentClipIndex(currentTime, clipMetadata) {
  if (!clipMetadata || clipMetadata.length === 0) return null;
  
  // Use a small epsilon for floating point comparison to handle precision issues
  const epsilon = 0.001; // 1ms tolerance
  
  // Find the clip that contains the current time
  // Iterate in reverse to handle overlapping clips (later clips take precedence)
  for (let i = clipMetadata.length - 1; i >= 0; i--) {
    const clip = clipMetadata[i];
    // Check if currentTime is within this clip's range
    // Use epsilon to handle floating point precision issues
    // Use <= for endTime to include the exact end time (important for precise timing)
    if (currentTime >= (clip.startTime - epsilon) && currentTime <= (clip.endTime + epsilon)) {
      return clip.index;
    }
  }
  
  // If no clip contains the time, find the nearest clip
  // This handles gaps between clips - show the last clip we passed
  
  // Before first clip
  const firstClip = clipMetadata[0];
  if (currentTime < firstClip.startTime) {
    return firstClip.index;
  }
  
  // After last clip - return last clip
  const lastClip = clipMetadata[clipMetadata.length - 1];
  if (currentTime > lastClip.endTime) {
    return lastClip.index;
  }
  
  // Between clips - return the clip we've most recently passed (the one that ended)
  // This ensures smooth transition: once a clip ends, we show it until the next one starts
  for (let i = clipMetadata.length - 1; i >= 0; i--) {
    const clip = clipMetadata[i];
    // If we've passed this clip's end time, return it (or the next one if we're closer to it)
    if (currentTime >= clip.endTime) {
      // Check if there's a next clip and if we're closer to it
      if (i < clipMetadata.length - 1) {
        const nextClip = clipMetadata[i + 1];
        // If we're closer to the next clip's start, return it
        if (currentTime >= nextClip.startTime - epsilon) {
          return nextClip.index;
        }
      }
      // Otherwise, return the clip we just passed
      return clip.index;
    }
  }
  
  // Fallback: return first clip
  return firstClip.index;
}

// Update visual state of playing clip
function updatePlayingClip(clipIndex, clipMap, shouldScroll = true, setProgrammaticFlagCallback = null) {
  // Remove playing class from all clips
  document.querySelectorAll('.transcript-clip.playing').forEach(clip => {
    clip.classList.remove('playing');
  });
  
  // Add playing class to current clip if valid
  if (clipIndex !== null && clipMap) {
    const pair = clipMap.get(clipIndex.toString());
    if (pair) {
      if (pair.visualization) {
        pair.visualization.classList.add('playing');
      }
      if (pair.container) {
        pair.container.classList.add('playing');
        // Scroll to the playing clip in transcript container only if shouldScroll is true
        if (shouldScroll) {
          scrollToClipCenter(pair.container, setProgrammaticFlagCallback);
        }
      }
    }
  }
}

// ==================== Transcript Clips Interaction ====================

// Initialize transcript clips interaction (click and hover sync)
function initTranscriptClipsInteraction(sound, clipMetadata, updatePlayingClipFn, getCurrentClipIndexFn, getAutoScrollEnabledFn, setAutoScrollEnabledFn, getSetProgrammaticScrollCallbackFn) {
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
          updatePlayingClipFn(newClipIndex, clipMap, autoScrollEnabled, setProgrammaticScrollCallback);
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
function initBehaviorLinkHandlers(sound, setAutoScrollEnabledFn, getSetProgrammaticScrollCallbackFn) {
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

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initStickyObserver();
    initPlayerVisualization();
    const audioPlayerResult = initAudioPlayer();
    const clipMap = initTranscriptClipsInteraction(
      audioPlayerResult.sound,
      audioPlayerResult.clipMetadata,
      updatePlayingClip,
      getCurrentClipIndex,
      audioPlayerResult.getAutoScrollEnabled,
      audioPlayerResult.setAutoScrollEnabled,
      audioPlayerResult.getSetProgrammaticScrollCallback
    );
    if (audioPlayerResult && audioPlayerResult.setClipMap) {
      audioPlayerResult.setClipMap(clipMap);
      // Don't set initial playing clip on page load - only when playback starts
    }
    initBehaviorLinkHandlers(audioPlayerResult.sound, audioPlayerResult.setAutoScrollEnabled, audioPlayerResult.getSetProgrammaticScrollCallback);
  });
} else {
  initStickyObserver();
  initPlayerVisualization();
    const audioPlayerResult = initAudioPlayer();
    const clipMap = initTranscriptClipsInteraction(
      audioPlayerResult.sound,
      audioPlayerResult.clipMetadata,
      updatePlayingClip,
      getCurrentClipIndex
    );
    if (audioPlayerResult && audioPlayerResult.setClipMap) {
      audioPlayerResult.setClipMap(clipMap);
      // Don't set initial playing clip on page load - only when playback starts
    }
  initBehaviorLinkHandlers(audioPlayerResult.sound);
}

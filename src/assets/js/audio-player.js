import { formatTime, getClipStartTime } from './utils.js';
import { getCurrentClipIndex, buildClipMetadata } from './clip-metadata.js';
import { updatePlayingClip } from './clip-metadata.js';
import { scrollToClipCenter } from './utils.js';

export function initAudioPlayer() {
  const audioPlayer = document.getElementById('audio-player');
  if (!audioPlayer) return;

  const audioSrc = audioPlayer.dataset.audioSrc;
  if (!audioSrc) {
    console.error('Audio source not found');
    return;
  }

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
      
      // Immediately scroll to current clip when playback starts
      if (clipMetadata.length > 0 && clipMap) {
        const currentTime = sound.seek();
        const clipIndex = getCurrentClipIndex(currentTime, clipMetadata);
        if (clipIndex !== null) {
          updatePlayingClip(clipIndex, clipMap, autoScrollEnabled, (flag) => { isProgrammaticScroll = flag; }, scrollToClipCenter);
          currentClipIndex = clipIndex;
        }
      }
    },
    onpause: function() {
      stopPositionUpdate();
      updatePlayPauseIcon();
      // Clear playing clip when audio is paused
      if (clipMap) {
        updatePlayingClip(null, clipMap, false, null, scrollToClipCenter);
        currentClipIndex = null;
      }
    },
    onend: function() {
      stopPositionUpdate();
      updatePlayerPosition(0);
      updatePlayPauseIcon();
      // Clear playing clip when audio ends
      if (clipMap) {
        updatePlayingClip(null, clipMap, false, null, scrollToClipCenter);
        currentClipIndex = null;
      }
    }
  });

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
    const playPauseContainer = audioPlayer.querySelector('[data-action="play-pause"]');
    if (!playPauseContainer) return;
    
    const playPauseIcon = playPauseContainer.querySelector('.player-icon');
    if (!playPauseIcon) return;
    
    const isPlaying = sound.playing();
    // Show pause icon when playing (action: pause), show play icon when paused (action: play)
    const iconId = isPlaying ? 'icon-pause' : 'icon-play';
    playPauseIcon.setAttribute('data-playing', isPlaying ? 'true' : 'false');
    loadIcon(playPauseIcon, iconId);
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
  const playPauseContainer = audioPlayer.querySelector('[data-action="play-pause"]');
  const muteUnmuteBtn = audioPlayer.querySelector('[data-action="mute-unmute"]');
  if (playPauseContainer) {
    const playPauseIcon = playPauseContainer.querySelector('.player-icon');
    if (playPauseIcon) {
      const initialIconId = playPauseIcon.getAttribute('data-icon-id') || 'icon-play';
      loadIcon(playPauseIcon, initialIconId);
    }
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
            updatePlayingClip(currentClipIndex, clipMap, autoScrollEnabled, (flag) => { isProgrammaticScroll = flag; }, scrollToClipCenter);
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
  const playPauseBtn = audioPlayer.querySelector('[data-action="play-pause"]');
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
          
          // Update playing clip immediately after seek (always update to ensure scroll happens)
          if (clipMetadata.length > 0 && clipMap) {
            const newClipIndex = getCurrentClipIndex(seekTime, clipMetadata);
            currentClipIndex = newClipIndex;
            updatePlayingClip(currentClipIndex, clipMap, autoScrollEnabled, (flag) => { isProgrammaticScroll = flag; }, scrollToClipCenter);
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
          updatePlayingClip(currentClipIndex, clipMap, autoScrollEnabled, (flag) => { isProgrammaticScroll = flag; }, scrollToClipCenter);
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

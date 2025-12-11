// Initialize static fingerprint visualization
export function initFingerprintVisualization() {
  const container = document.querySelector('.fingerprint-visualization-container');
  if (!container) return;

  const visualization = container.querySelector('.transcript-visualization');
  if (!visualization) return;

  const fingerprintBox = container.querySelector('.fingerprint-visualization-box');
  if (!fingerprintBox) return;

  // Initialize clip positioning
  const clips = visualization.querySelectorAll('.transcript-clip');
  clips.forEach((clip, index) => {
    const position = clip.getAttribute('data-position');
    const width = clip.getAttribute('data-width');

    if (position !== null && width !== null) {
      clip.style.left = `${position}%`;
      clip.style.width = `${width}%`;
    }

    // Add unique clip index for hover synchronization
    clip.setAttribute('data-clip-index', index.toString());
  });

  // Find or create behaviour indicators container
  let behaviourIndicatorsContainer = fingerprintBox.querySelector('.behaviour-indicators');
  if (!behaviourIndicatorsContainer) {
    behaviourIndicatorsContainer = document.createElement('div');
    behaviourIndicatorsContainer.className = 'behaviour-indicators';
    fingerprintBox.appendChild(behaviourIndicatorsContainer);
  }

  // Clear existing indicators
  behaviourIndicatorsContainer.innerHTML = '';

  // Create behaviour indicators from clip data
  clips.forEach((clip, clipIndex) => {
    const position = clip.getAttribute('data-position');
    const width = clip.getAttribute('data-width');

    // Extract emotion from clip classes
    const emotionClass = Array.from(clip.classList).find(cls => cls.startsWith('emotion-'));
    const emotion = emotionClass ? emotionClass.replace('emotion-', '') : 'neutral';

    // Get speaker index for vertical positioning
    const speakerIndex = clip.getAttribute('data-speaker-index') || '1';

    // Find behaviours in this clip - search in clip-caption
    const clipCaption = clip.querySelector('.clip-caption');
    if (!clipCaption) return; // Skip if no clip-caption
    
    const behaviours = clipCaption.querySelectorAll('.behaviour');
    if (behaviours.length === 0) return; // Skip if no behaviours
    
    const behavioursToShow = Array.from(behaviours).slice(0, 3); // Limit to 3

    behavioursToShow.forEach((behaviour, behaviourIndex) => {
      const behaviourType = behaviour.getAttribute('data-behaviour-type');
      if (!behaviourType) return;

      // Extract text content (without icon)
      const behaviourClone = behaviour.cloneNode(true);
      const iconInClone = behaviourClone.querySelector('.behaviour-icon');
      if (iconInClone) {
        iconInClone.remove();
      }
      const behaviourText = behaviourClone.textContent.trim();
      
      if (!behaviourText) return;
      
      // Create behaviour indicator element
      const indicator = document.createElement('div');
      indicator.className = 'behaviour-indicator';
      indicator.setAttribute('data-clip-position', position || '0');
      indicator.setAttribute('data-clip-width', width || '0');
      indicator.setAttribute('data-clip-index', clipIndex.toString());
      indicator.setAttribute('data-behaviour-index', (behaviourIndex + 1).toString());
      indicator.setAttribute('data-behaviour-type', behaviourType);
      indicator.setAttribute('data-emotion', emotion);
      indicator.setAttribute('data-speaker-index', speakerIndex);

      // Set position
      const clipPosition = position !== null ? parseFloat(position) : 0;
      indicator.style.left = `${clipPosition}%`;

      // Create icon element
      const iconContainer = document.createElement('span');
      iconContainer.className = 'behaviour-icon';
      
      // Clone the icon from behaviour element
      const originalIcon = behaviour.querySelector('.behaviour-icon');
      if (originalIcon) {
        const iconClone = originalIcon.cloneNode(true);
        iconContainer.appendChild(iconClone);
      } else {
        // Fallback: create icon based on type
        const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        iconSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        iconSvg.setAttribute('viewBox', '0 0 241.8 241.8');
        iconSvg.setAttribute('class', `behaviour-icon behaviour-icon--${behaviourType}`);
        iconSvg.setAttribute('aria-hidden', 'true');
        
        if (behaviourType === 'kiki') {
          const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          polygon.setAttribute('class', 'behaviour-icon__shape');
          polygon.setAttribute('points', '5.4 87.9 79.3 78.9 44.6 6.9 136.7 67.3 218.5 5 179.9 119.8 236 146 168.4 165.9 163.7 232.9 121 159 5.3 217.7 65.7 119.8 5.4 87.9');
          iconSvg.appendChild(polygon);
        } else if (behaviourType === 'buba') {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('class', 'behaviour-icon__shape');
          path.setAttribute('d', 'M91.7,48.3c89.8-70.4,166.7,33.1,92.8,112.3-112.6,120.7-234.7-1.1-92.8-112.3Z');
          iconSvg.appendChild(path);
        }
        
        iconContainer.appendChild(iconSvg);
      }

      // Create text label
      const textLabel = document.createElement('span');
      textLabel.className = 'behaviour-label-text';
      textLabel.textContent = behaviourText;

      indicator.appendChild(iconContainer);
      indicator.appendChild(textLabel);

      behaviourIndicatorsContainer.appendChild(indicator);
    });
  });

  // Sync hover between clips and behaviour indicators
  clips.forEach((clip) => {
    const clipIndex = clip.getAttribute('data-clip-index');
    
    clip.addEventListener('mouseenter', () => {
      const indicators = behaviourIndicatorsContainer.querySelectorAll(
        `.behaviour-indicator[data-clip-index="${clipIndex}"]`
      );
      indicators.forEach((indicator) => {
        indicator.classList.add('visible');
        
        // Check if text fits on the right, otherwise position on left
        const textLabel = indicator.querySelector('.behaviour-label-text');
        const icon = indicator.querySelector('.behaviour-icon');
        
        if (textLabel && icon) {
          // Remove position-left class first to measure correctly
          textLabel.classList.remove('position-left');
          
          // Force reflow to ensure text is visible for measurement
          textLabel.style.visibility = 'visible';
          textLabel.style.opacity = '1';
          
          // Get positions relative to container
          const containerRect = behaviourIndicatorsContainer.getBoundingClientRect();
          const iconRect = icon.getBoundingClientRect();
          const textWidth = textLabel.scrollWidth;
          
          // Calculate available space on the right side of the icon
          const iconRight = iconRect.right - containerRect.left;
          const availableRight = containerRect.width - iconRight;
          
          // If not enough space on the right, position label on the left
          if (availableRight < textWidth + 10) {
            textLabel.classList.add('position-left');
          }
          
          // Restore visibility (will be controlled by CSS .visible class)
          textLabel.style.visibility = '';
          textLabel.style.opacity = '';
        }
      });
    });

    clip.addEventListener('mouseleave', () => {
      const indicators = behaviourIndicatorsContainer.querySelectorAll(
        `.behaviour-indicator[data-clip-index="${clipIndex}"]`
      );
      indicators.forEach((indicator) => {
        indicator.classList.remove('visible');
      });
    });
  });

  // Get emotion caption element
  const emotionCaption = fingerprintBox.querySelector('.fingerprint-status-caption .emotion-caption');
  if (!emotionCaption) return;

  // Function to update emotion caption (adapted from emotions.js)
  function updateFingerprintEmotionCaption(clip) {
    if (!emotionCaption) return;

    // Extract emotion name from class (e.g., "emotion-angry" -> "angry")
    const emotionClasses = Array.from(clip.classList).filter(cls => cls.startsWith('emotion-'));
    if (emotionClasses.length === 0) {
      emotionCaption.classList.remove('visible');
      return;
    }

    const emotionName = emotionClasses[0].replace('emotion-', '');

    // Update text
    emotionCaption.textContent = emotionName;

    // Get color directly from emotion CSS variable
    const emotionColorVar = `--emotion-${emotionName}-RGB`;
    const computedStyle = getComputedStyle(document.documentElement);
    const colorValue = computedStyle.getPropertyValue(emotionColorVar).trim();

    if (colorValue) {
      emotionCaption.style.color = `rgba(${colorValue}, 1)`;
    }

    // Show instantly (no transition)
    emotionCaption.classList.add('visible');
  }

  // Function to fade out emotion caption
  function fadeOutFingerprintEmotionCaption() {
    if (!emotionCaption) return;
    emotionCaption.classList.remove('visible');
  }

  // Track if mouse is over visualization area
  let isOverVisualization = false;

  // Handle mouse enter/leave for entire visualization area
  visualization.addEventListener('mouseenter', function() {
    isOverVisualization = true;
  });

  visualization.addEventListener('mouseleave', function() {
    isOverVisualization = false;
    fadeOutFingerprintEmotionCaption();
  });

  // Add hover handlers to visualization clips
  clips.forEach((clip) => {
    clip.addEventListener('mouseenter', function() {
      clip.classList.add('hover');
      updateFingerprintEmotionCaption(clip);
    });

    clip.addEventListener('mouseleave', function() {
      clip.classList.remove('hover');
      // Don't fade out here - only fade out when leaving entire visualization
      if (!isOverVisualization) {
        fadeOutFingerprintEmotionCaption();
      }
    });
  });
}


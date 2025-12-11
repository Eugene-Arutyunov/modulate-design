import { updateEmotionCaption } from './emotions.js';

/**
 * Initialize transcript visualization with behaviour indicators and emotion handling
 * @param {Object} options - Configuration options
 * @param {string} options.visualizationSelector - Selector for visualization element (e.g., '.player-visualization' or '.transcript-visualization')
 * @param {string} options.parentSelector - Selector for parent container (e.g., '.media-box' or '.fingerprint-visualization-box')
 * @param {string} options.indicatorsContainerClass - Class name for behaviour indicators container (default: 'behaviour-indicators')
 * @param {string} options.emotionCaptionSelector - Selector for emotion caption element (e.g., '.emotion-caption' or '.fingerprint-status-caption .emotion-caption')
 * @param {boolean} options.trackVisualizationArea - Whether to track visualization area for emotion caption (default: false)
 */
export function initTranscriptVisualization(options) {
  const {
    visualizationSelector,
    parentSelector,
    indicatorsContainerClass = 'behaviour-indicators',
    emotionCaptionSelector,
    trackVisualizationArea = false
  } = options;

  // Find visualization element
  const visualization = document.querySelector(visualizationSelector);
  if (!visualization) return null;

  // Find parent container
  let parentElement;
  if (parentSelector.includes(',')) {
    // Handle multiple selectors (e.g., '.media-box, #audio-player')
    const selectors = parentSelector.split(',').map(s => s.trim());
    parentElement = visualization.closest(selectors[0]) || visualization.closest(selectors[1]);
  } else {
    parentElement = visualization.closest(parentSelector);
  }

  if (!parentElement) return null;

  // Get all clips
  const clips = visualization.querySelectorAll('.transcript-clip');

  // Initialize clip positioning
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
  let behaviourIndicatorsContainer = parentElement.querySelector(`.${indicatorsContainerClass}`);
  if (!behaviourIndicatorsContainer) {
    behaviourIndicatorsContainer = document.createElement('div');
    behaviourIndicatorsContainer.className = indicatorsContainerClass;
    parentElement.appendChild(behaviourIndicatorsContainer);
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
          const outlinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          outlinePath.setAttribute('id', 'kiki-outline-form');
          outlinePath.setAttribute('class', 'behaviour-icon__outline');
          outlinePath.setAttribute('d', 'M159,239.9c-6.3,0-12.3-3.3-15.6-9l-29.3-50.7-87.2,44.2c-2.6,1.3-5.4,1.9-8.1,1.9-4.9,0-9.8-2-13.3-5.8-5.5-5.9-6.3-14.8-2.1-21.6l43.4-70.3-36.4-19.3c-6.9-3.7-10.7-11.4-9.3-19.2,1.4-7.7,7.7-13.6,15.5-14.6l40.5-5-19.8-41.1c-3.5-7.3-1.7-16,4.3-21.3,3.4-3,7.6-4.5,11.9-4.5s6.9,1,9.9,2.9l70.9,46.5L196.6,5.7c3.2-2.4,7.1-3.7,10.9-3.7s7.3,1.1,10.5,3.4c6.4,4.6,9.1,12.9,6.6,20.4l-29,86.5,35.2,16.4c6.8,3.2,10.9,10.2,10.3,17.7s-5.7,13.8-12.9,15.9l-47.9,14.1-3.3,46.9c-.6,7.9-6.2,14.5-13.9,16.3-1.3.3-2.7.5-4,.5Z');
          outlinePath.setAttribute('fill', 'transparent');
          iconSvg.appendChild(outlinePath);
          const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          polygon.setAttribute('id', 'kiki-shape');
          polygon.setAttribute('class', 'behaviour-icon__shape');
          polygon.setAttribute('points', '18.9 93.5 84.3 85.5 53.6 21.7 135.1 75.2 207.5 20 173.4 121.7 223.1 144.9 163.3 162.5 159 221.9 121.2 156.4 18.8 208.4 72.3 121.7 18.9 93.5');
          iconSvg.appendChild(polygon);
        } else if (behaviourType === 'buba') {
          const outlinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          outlinePath.setAttribute('id', 'buba-outline');
          outlinePath.setAttribute('class', 'behaviour-icon__outline');
          outlinePath.setAttribute('d', 'M68.2,230c-16.7,0-30.8-5.4-41-15.5-16.2-16.2-19.9-41.6-10.3-71.5,8.2-25.9,25.8-53.2,49.4-76.8C99.9,32.6,141,11.7,173.6,11.7s30.8,5.4,41,15.5c16.2,16.2,19.9,41.6,10.3,71.5-8.2,25.9-25.8,53.2-49.4,76.8-33.6,33.6-74.7,54.5-107.3,54.5Z');
          outlinePath.setAttribute('fill', 'transparent');
          iconSvg.appendChild(outlinePath);
          const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
          ellipse.setAttribute('id', 'buba-shape');
          ellipse.setAttribute('class', 'behaviour-icon__shape');
          ellipse.setAttribute('cx', '120.9');
          ellipse.setAttribute('cy', '120.9');
          ellipse.setAttribute('rx', '114.4');
          ellipse.setAttribute('ry', '59.2');
          ellipse.setAttribute('transform', 'translate(-50.1 120.9) rotate(-45)');
          iconSvg.appendChild(ellipse);
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
        indicator.classList.add('hover');

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
        indicator.classList.remove('hover');
      });
    });
  });

  // Handle emotion caption if selector is provided
  if (emotionCaptionSelector) {
    const emotionCaption = document.querySelector(emotionCaptionSelector);
    if (emotionCaption) {
      let isOverVisualization = false;

      // Track visualization area if needed (for static version)
      if (trackVisualizationArea) {
        visualization.addEventListener('mouseenter', () => {
          isOverVisualization = true;
        });

        visualization.addEventListener('mouseleave', () => {
          isOverVisualization = false;
          // Fade out using the provided selector
          emotionCaption.classList.remove('visible');
        });
      }

      // Add hover handlers to clips for emotion caption
      clips.forEach((clip) => {
        clip.addEventListener('mouseenter', () => {
          clip.classList.add('hover');
          updateEmotionCaption(clip, emotionCaptionSelector);
        });

        clip.addEventListener('mouseleave', () => {
          clip.classList.remove('hover');
          // For static version: only fade out when leaving entire visualization
          // For player version: fade out immediately
          if (!trackVisualizationArea || !isOverVisualization) {
            // Fade out using the provided selector
            emotionCaption.classList.remove('visible');
          }
        });
      });
    }
  }

  return {
    visualization,
    parentElement,
    clips,
    behaviourIndicatorsContainer
  };
}

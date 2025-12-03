import { initPlayerVisualization } from './player-visualization.js';
import { updateEmotionCaption, fadeOutEmotionCaption } from './emotions.js';

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

  // Handle behaviour labels positioning
  const behaviourLabels = fingerprintBox.querySelectorAll('.behaviour-label');
  behaviourLabels.forEach((label) => {
    const position = label.getAttribute('data-position');
    if (position !== null) {
      label.style.left = `${position}%`;
    }
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


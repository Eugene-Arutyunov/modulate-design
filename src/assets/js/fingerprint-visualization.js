import { initTranscriptVisualization } from './transcript-visualization-core.js';

// Initialize static fingerprint visualization
export function initFingerprintVisualization() {
  const container = document.querySelector('.fingerprint-visualization-container');
  if (!container) return;

  const visualization = container.querySelector('.transcript-visualization');
  if (!visualization) return;

  const fingerprintBox = container.querySelector('.fingerprint-visualization-box');
  if (!fingerprintBox) return;

  // Initialize visualization using common module
  return initTranscriptVisualization({
    visualizationSelector: '.transcript-visualization',
    parentSelector: '.fingerprint-visualization-box',
    indicatorsContainerClass: 'behaviour-indicators',
    emotionCaptionSelector: '.fingerprint-status-caption .emotion-caption',
    trackVisualizationArea: true
  });
}


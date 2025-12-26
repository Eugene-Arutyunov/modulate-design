import { initTranscriptVisualization } from './transcript-visualization-core.js';

export function initPlayerVisualization() {
  return initTranscriptVisualization({
    visualizationSelector: '.player-visualization',
    parentSelector: '.media-box, #audio-player',
    indicatorsContainerClass: 'behaviour-indicators',
    emotionCaptionSelector: '.emotion-caption',
    clipTextCaptionSelector: '.clip-text-caption',
    trackVisualizationArea: false
  });
}

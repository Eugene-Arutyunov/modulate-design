export function initPlayerVisualization() {
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

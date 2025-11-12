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

  clips.forEach((clip) => {
    const position = clip.getAttribute("data-position");
    const width = clip.getAttribute("data-width");

    if (position !== null && width !== null) {
      clip.style.left = `${position}%`;
      clip.style.width = `${width}%`;
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initStickyObserver();
    initPlayerVisualization();
  });
} else {
  initStickyObserver();
  initPlayerVisualization();
}

export function initStickyObserver() {
  const stickyElement = document.querySelector(".sticky");

  if (!stickyElement) return;

  const scrollContainer = document.querySelector('.main-content') || window;

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
  scrollContainer.addEventListener("scroll", checkSticky);

  // Check on window resize
  window.addEventListener("resize", checkSticky);

  // Check immediately on load
  checkSticky();
}

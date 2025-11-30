export function initSharePopover() {
  const shareButtons = document.querySelectorAll('.share-button');
  
  if (shareButtons.length === 0) return;
  
  let currentPopover = null;
  
  // Function to get popover for a button
  function getPopoverForButton(button) {
    const container = button.closest('.nav-container') || button.closest('.share-container');
    if (!container) return null;
    return container.querySelector('.share-popover');
  }
  
  // Function to show popover
  function showPopover(button) {
    const popover = getPopoverForButton(button);
    if (!popover) return;
    
    // If clicking the same button, toggle off
    if (currentPopover === popover && popover.classList.contains('visible')) {
      hidePopover();
      return;
    }
    
    // Hide current popover if different
    if (currentPopover && currentPopover !== popover) {
      hidePopover();
    }
    
    currentPopover = popover;
    popover.classList.add('visible');
    popover.setAttribute('aria-hidden', 'false');
  }
  
  // Function to hide popover
  function hidePopover() {
    if (currentPopover) {
      currentPopover.classList.remove('visible');
      currentPopover.setAttribute('aria-hidden', 'true');
      currentPopover = null;
    }
  }
  
  // Close popover when clicking outside
  document.addEventListener('click', function(e) {
    // Check if click is on a button (including child elements)
    const clickedButton = e.target.closest('.share-button');
    const clickedPopover = e.target.closest('.share-popover');
    
    // If click is on button or popover, don't close
    if (clickedButton || clickedPopover) {
      return;
    }
    
    // If click is outside, close popover
    if (currentPopover && currentPopover.classList.contains('visible')) {
      hidePopover();
    }
  }, true); // Use capture phase
  
  // Add click handlers to share buttons
  shareButtons.forEach((button) => {
    button.addEventListener('click', function(e) {
      // Prevent event from bubbling to document handler
      e.stopPropagation();
      showPopover(button);
    });
  });
  
  // Close popover on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && currentPopover && currentPopover.classList.contains('visible')) {
      hidePopover();
    }
  });
}

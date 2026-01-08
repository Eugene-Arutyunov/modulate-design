export function initSharePopover() {
  const triggerButton = document.querySelector('.share-trigger-button');
  const backdrop = document.querySelector('.share-popover-backdrop');
  const popover = document.querySelector('.share-popover');
  const closeButton = document.querySelector('.share-popover-close');
  const copyLinkButton = document.querySelector('[data-share-action="copy-link"]');

  if (!triggerButton || !backdrop || !popover) return;

  // Function to open popover
  function openPopover() {
    backdrop.setAttribute('aria-hidden', 'false');
    popover.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  // Function to close popover
  function closePopover() {
    backdrop.setAttribute('aria-hidden', 'true');
    popover.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Open popover on trigger button click
  triggerButton.addEventListener('click', function(e) {
    e.preventDefault();
    openPopover();
  });

  // Close popover on close button click
  if (closeButton) {
    closeButton.addEventListener('click', function(e) {
      e.preventDefault();
      closePopover();
    });
  }

  // Close popover on backdrop click
  backdrop.addEventListener('click', function(e) {
    if (e.target === backdrop) {
      closePopover();
    }
  });

  // Close popover on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && backdrop.getAttribute('aria-hidden') === 'false') {
      closePopover();
    }
  });

  // Handle copy link action
  if (copyLinkButton) {
    copyLinkButton.addEventListener('click', function(e) {
      e.preventDefault();
      const url = window.location.href;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function() {
          // Visual feedback could be added here
          console.log('Link copied to clipboard');
        }).catch(function(err) {
          console.error('Failed to copy link:', err);
          // Fallback: select text
          fallbackCopyTextToClipboard(url);
        });
      } else {
        // Fallback for older browsers
        fallbackCopyTextToClipboard(url);
      }
    });
  }

  // Fallback copy function
  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        console.log('Link copied to clipboard (fallback)');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textArea);
  }
}

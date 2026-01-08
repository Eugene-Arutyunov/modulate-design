export function initTranscriptToggle() {
  const toggleButton = document.querySelector('.transcript-toggle-button');
  
  if (!toggleButton) return;
  
  // Find the transcript container that comes after the wrapper
  const wrapperElement = toggleButton.closest('.transcript-header-wrapper');
  if (!wrapperElement) return;
  
  // Find the next sibling transcript-container after the wrapper
  let nextElement = wrapperElement.nextElementSibling;
  while (nextElement && nextElement.classList && !nextElement.classList.contains('transcript-container')) {
    nextElement = nextElement.nextElementSibling;
  }
  
  const transcriptContainer = nextElement;
  if (!transcriptContainer) return;
  
  toggleButton.addEventListener('click', function(e) {
    e.preventDefault();
    
    const isHidden = transcriptContainer.style.display === 'none';
    
    if (isHidden) {
      // Show transcript
      transcriptContainer.style.display = '';
      toggleButton.textContent = 'Hide';
    } else {
      // Hide transcript
      transcriptContainer.style.display = 'none';
      toggleButton.textContent = 'Show';
    }
  });
}

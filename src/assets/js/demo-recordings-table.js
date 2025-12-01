// Initialize clickable table rows
export function initClickableTableRows() {
  const rows = document.querySelectorAll('tr[data-href]');
  rows.forEach(row => {
    row.addEventListener('click', (e) => {
      const href = row.getAttribute('data-href');
      if (href) {
        window.location.href = href;
      }
    });
  });
}

// Initialize table fingerprint diagrams
export function initTableFingerprints() {
  const MAX_DURATION = 352; // 05:52 in seconds - longest recording
  // Max width should fit in 10% column minus padding and time (approximately 6.875em, increased by 25%)
  const MAX_WIDTH_EM = 6.875;
  
  const fingerprints = document.querySelectorAll('.table-fingerprint');
  fingerprints.forEach(fingerprint => {
    const row = fingerprint.closest('tr[data-duration]');
    if (!row) return;
    
    const duration = parseInt(row.getAttribute('data-duration'), 10);
    if (!duration) return;
    
    // Calculate width as percentage of max duration, then convert to em
    const widthPercent = (duration / MAX_DURATION) * 100;
    const widthEm = (widthPercent / 100) * MAX_WIDTH_EM;
    
    // Set width of fingerprint container (proportional to duration)
    // This ensures the container width reflects the actual duration of the recording
    fingerprint.style.width = `${widthEm}em`;
    
    // Collect all clips and find the maximum position + width
    const clips = Array.from(fingerprint.querySelectorAll('.table-fingerprint-clip'));
    let maxEnd = 0;
    
    clips.forEach(clip => {
      const position = parseFloat(clip.getAttribute('data-position'));
      const width = parseFloat(clip.getAttribute('data-width'));
      if (!isNaN(position) && !isNaN(width)) {
        const end = position + width;
        if (end > maxEnd) maxEnd = end;
      }
    });
    
    // Normalize: scale all positions and widths so clips fill 100% of the container
    // maxEnd represents the actual coverage of clips (which may be less than full duration)
    // Clips are stretched to fill the entire container for better visualization
    // The container width is proportional to duration, showing relative duration between recordings
    const normalizeFactor = maxEnd > 0 ? 100 / maxEnd : 1;
    
    // Position clips within the fingerprint
    clips.forEach(clip => {
      const position = parseFloat(clip.getAttribute('data-position'));
      const width = parseFloat(clip.getAttribute('data-width'));
      
      if (!isNaN(position) && !isNaN(width)) {
        // Normalize positions and widths to fill 100% of container
        clip.style.left = `${position * normalizeFactor}%`;
        clip.style.width = `${width * normalizeFactor}%`;
      }
    });
  });
}


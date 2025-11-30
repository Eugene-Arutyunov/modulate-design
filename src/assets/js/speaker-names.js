// Update speaker name in all places
function updateSpeakerName(speakerIndex, newName) {
  // 1. Update speaker label in player
  const speakerLabel = document.querySelector(`.speaker-label[data-speaker-index="${speakerIndex}"] span`);
  if (speakerLabel) {
    speakerLabel.textContent = newName;
  }

  // 2. Update text in summary paragraph (inside <strong> tags)
  const summaryParagraph = document.querySelector('.summary-container p');
  if (summaryParagraph) {
    const strongElements = summaryParagraph.querySelectorAll('strong');
    // First strong is speaker 1, second is speaker 2
    const strongIndex = parseInt(speakerIndex) - 1;
    if (strongElements[strongIndex]) {
      strongElements[strongIndex].textContent = newName;
    }
  }

  // 3. Update all transcript clip names
  const transcriptClips = document.querySelectorAll(`.transcript-clip[data-speaker-index="${speakerIndex}"] .name`);
  transcriptClips.forEach((nameElement) => {
    nameElement.textContent = newName;
  });
}

// Initialize editable speaker names
export function initEditableSpeakerNames() {
  const speakerInputs = document.querySelectorAll('.speaker-name-input');
  
  // Function to adjust icon position based on text width
  function adjustIconPosition(input) {
    const wrapper = input.closest('.speaker-name-input-wrapper');
    if (!wrapper) return;
    
    const icon = wrapper.querySelector('.speaker-name-input-icon');
    if (!icon) return;
    
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'pre';
    tempSpan.style.font = window.getComputedStyle(input).font;
    tempSpan.textContent = input.value || input.placeholder || 'M';
    document.body.appendChild(tempSpan);
    const textWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);
    
    const computedStyle = window.getComputedStyle(input);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const iconWidth = parseFloat(window.getComputedStyle(icon).width) || 16;
    const iconMargin = parseFloat(window.getComputedStyle(icon).marginLeft) || 0;
    
    const iconLeft = paddingLeft + textWidth + iconMargin;
    const inputWidth = input.offsetWidth;
    const iconRight = iconLeft + iconWidth;
    
    // Always hide icon when input is focused
    if (document.activeElement === input) {
      icon.style.visibility = 'hidden';
      return;
    }
    
    // Check if icon fits within input bounds
    if (iconRight <= inputWidth - paddingRight) {
      icon.style.left = iconLeft + 'px';
      icon.style.visibility = 'visible';
    } else {
      // Hide icon if it doesn't fit
      icon.style.visibility = 'hidden';
    }
  }
  
  speakerInputs.forEach((input) => {
    const speakerIndex = input.getAttribute('data-speaker-index');
    if (!speakerIndex) return;

    // Set initial icon position
    adjustIconPosition(input);

    let wasEscPressed = false;

    // Store original value on focus
    input.addEventListener('focus', function() {
      input.dataset.originalValue = input.value;
      wasEscPressed = false;
      adjustIconPosition(input);
    });

    // Handle paste to prevent exceeding max length
    input.addEventListener('paste', function(e) {
      const maxLength = parseInt(input.getAttribute('maxlength')) || 50;
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const currentLength = input.value.length;
      const selectionLength = input.selectionEnd - input.selectionStart;
      const newLength = currentLength - selectionLength + pastedText.length;
      
      if (newLength > maxLength) {
        e.preventDefault();
        const allowedLength = maxLength - (currentLength - selectionLength);
        const truncatedText = pastedText.substring(0, allowedLength);
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + truncatedText + input.value.substring(end);
        input.setSelectionRange(start + truncatedText.length, start + truncatedText.length);
        adjustIconPosition(input);
        updateSpeakerName(speakerIndex, input.value);
      }
    });

    // Update in real-time on input
    input.addEventListener('input', function(e) {
      let newName = input.value;
      
      // Prevent input if exceeds max length (backup check)
      const maxLength = parseInt(input.getAttribute('maxlength')) || 50;
      if (newName.length > maxLength) {
        newName = newName.substring(0, maxLength);
        input.value = newName;
      }
      
      // Adjust icon position based on content
      adjustIconPosition(input);
      
      updateSpeakerName(speakerIndex, newName);
    });

    // Validate and clean value on blur
    input.addEventListener('blur', function() {
      if (!wasEscPressed) {
        let trimmedValue = input.value.trim();
        
        // If empty or only whitespace, restore original value
        if (!trimmedValue) {
          trimmedValue = input.dataset.originalValue || input.getAttribute('value') || '';
          input.value = trimmedValue;
          updateSpeakerName(speakerIndex, trimmedValue);
        } else {
          // Update with trimmed value
          input.value = trimmedValue;
          updateSpeakerName(speakerIndex, trimmedValue);
        }
        
        input.dataset.originalValue = trimmedValue;
        adjustIconPosition(input);
      }
    });

    // Restore original value on Esc
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        wasEscPressed = true;
        const originalValue = input.dataset.originalValue;
        if (originalValue !== undefined && originalValue !== null) {
          input.value = originalValue;
          updateSpeakerName(speakerIndex, originalValue);
          adjustIconPosition(input);
        }
        // Use setTimeout to ensure blur happens after value is restored
        setTimeout(() => {
          input.blur();
        }, 0);
      }
    });

    // Initialize original value from the initial value attribute
    const initialValue = input.getAttribute('value') || input.value;
    input.dataset.originalValue = initialValue;
  });
}

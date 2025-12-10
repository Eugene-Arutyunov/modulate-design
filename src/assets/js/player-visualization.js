export function initPlayerVisualization() {
  const visualization = document.querySelector(".player-visualization");
  
  if (!visualization) return;

  const clips = visualization.querySelectorAll(".transcript-clip");
  const mediaBox = visualization.closest(".media-box") || visualization.closest("#audio-player");
  
  if (!mediaBox) return;

  // Find or create behaviour indicators container
  let behaviourIndicatorsContainer = mediaBox.querySelector(".behaviour-indicators");
  if (!behaviourIndicatorsContainer) {
    behaviourIndicatorsContainer = document.createElement("div");
    behaviourIndicatorsContainer.className = "behaviour-indicators";
    mediaBox.appendChild(behaviourIndicatorsContainer);
  }

  // Clear existing indicators
  behaviourIndicatorsContainer.innerHTML = "";

  clips.forEach((clip, clipIndex) => {
    const position = clip.getAttribute("data-position");
    const width = clip.getAttribute("data-width");

    if (position !== null && width !== null) {
      clip.style.left = `${position}%`;
      clip.style.width = `${width}%`;
    }
    
    // Add unique clip index for hover synchronization
    clip.setAttribute("data-clip-index", clipIndex.toString());

    // Extract emotion from clip classes
    const emotionClass = Array.from(clip.classList).find(cls => cls.startsWith('emotion-'));
    const emotion = emotionClass ? emotionClass.replace('emotion-', '') : 'neutral';

    // Get speaker index for vertical positioning
    const speakerIndex = clip.getAttribute("data-speaker-index") || "1";

    // Find behaviours in this clip - search in clip-caption even if it's hidden
    const clipCaption = clip.querySelector(".clip-caption");
    if (!clipCaption) return; // Skip if no clip-caption
    
    const behaviours = clipCaption.querySelectorAll(".behaviour");
    if (behaviours.length === 0) return; // Skip if no behaviours
    
    const behavioursToShow = Array.from(behaviours).slice(0, 3); // Limit to 3

    behavioursToShow.forEach((behaviour, behaviourIndex) => {
      const behaviourType = behaviour.getAttribute("data-behaviour-type");
      if (!behaviourType) return;

      // Extract text content (without icon)
      // Clone the behaviour to remove icon, then get text
      const behaviourClone = behaviour.cloneNode(true);
      const iconInClone = behaviourClone.querySelector(".behaviour-icon");
      if (iconInClone) {
        iconInClone.remove();
      }
      const behaviourText = behaviourClone.textContent.trim();
      
      if (!behaviourText) return;
      
      // Create behaviour indicator element
      const indicator = document.createElement("div");
      indicator.className = "behaviour-indicator";
      indicator.setAttribute("data-clip-position", position || "0");
      indicator.setAttribute("data-clip-width", width || "0");
      indicator.setAttribute("data-clip-index", clipIndex.toString());
      indicator.setAttribute("data-behaviour-index", (behaviourIndex + 1).toString());
      indicator.setAttribute("data-behaviour-type", behaviourType);
      indicator.setAttribute("data-emotion", emotion);
      indicator.setAttribute("data-speaker-index", speakerIndex);

      // Set position - always set, even if position is null (will use 0)
      const clipPosition = position !== null ? parseFloat(position) : 0;
      indicator.style.left = `${clipPosition}%`;

      // Create icon element
      const iconContainer = document.createElement("span");
      iconContainer.className = "behaviour-icon";
      
      // Clone the icon from behaviour element
      const originalIcon = behaviour.querySelector(".behaviour-icon");
      if (originalIcon) {
        const iconClone = originalIcon.cloneNode(true);
        iconContainer.appendChild(iconClone);
      } else {
        // Fallback: create icon based on type
        const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        iconSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        iconSvg.setAttribute("viewBox", "0 0 241.8 241.8");
        iconSvg.setAttribute("class", `behaviour-icon behaviour-icon--${behaviourType}`);
        iconSvg.setAttribute("aria-hidden", "true");
        
        if (behaviourType === "kiki") {
          const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          polygon.setAttribute("class", "behaviour-icon__shape");
          polygon.setAttribute("points", "5.4 87.9 79.3 78.9 44.6 6.9 136.7 67.3 218.5 5 179.9 119.8 236 146 168.4 165.9 163.7 232.9 121 159 5.3 217.7 65.7 119.8 5.4 87.9");
          iconSvg.appendChild(polygon);
        } else if (behaviourType === "buba") {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("class", "behaviour-icon__shape");
          path.setAttribute("d", "M91.7,48.3c89.8-70.4,166.7,33.1,92.8,112.3-112.6,120.7-234.7-1.1-92.8-112.3Z");
          iconSvg.appendChild(path);
        }
        
        iconContainer.appendChild(iconSvg);
      }

      // Create text label
      const textLabel = document.createElement("span");
      textLabel.className = "behaviour-label-text";
      textLabel.textContent = behaviourText;

      indicator.appendChild(iconContainer);
      indicator.appendChild(textLabel);

      behaviourIndicatorsContainer.appendChild(indicator);
    });
  });

  // Sync hover between clips and behaviour indicators
  clips.forEach((clip) => {
    const clipIndex = clip.getAttribute("data-clip-index");
    
    clip.addEventListener("mouseenter", () => {
      const indicators = behaviourIndicatorsContainer.querySelectorAll(
        `.behaviour-indicator[data-clip-index="${clipIndex}"]`
      );
      indicators.forEach((indicator) => {
        indicator.classList.add("visible");
        
        // Check if text fits on the right, otherwise position on left
        const textLabel = indicator.querySelector(".behaviour-label-text");
        const icon = indicator.querySelector(".behaviour-icon");
        
        if (textLabel && icon) {
          // Remove position-left class first to measure correctly
          textLabel.classList.remove("position-left");
          
          // Force reflow to ensure text is visible for measurement
          textLabel.style.visibility = "visible";
          textLabel.style.opacity = "1";
          
          // Get positions relative to container
          const containerRect = behaviourIndicatorsContainer.getBoundingClientRect();
          const iconRect = icon.getBoundingClientRect();
          const textWidth = textLabel.scrollWidth;
          
          // Calculate available space on the right side of the icon
          const iconRight = iconRect.right - containerRect.left;
          const availableRight = containerRect.width - iconRight;
          
          // If not enough space on the right, position label on the left
          if (availableRight < textWidth + 10) {
            textLabel.classList.add("position-left");
          }
          
          // Restore visibility (will be controlled by CSS .visible class)
          textLabel.style.visibility = "";
          textLabel.style.opacity = "";
        }
      });
    });

    clip.addEventListener("mouseleave", () => {
      const indicators = behaviourIndicatorsContainer.querySelectorAll(
        `.behaviour-indicator[data-clip-index="${clipIndex}"]`
      );
      indicators.forEach((indicator) => {
        indicator.classList.remove("visible");
      });
    });
  });
}

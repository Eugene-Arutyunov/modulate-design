// Function to capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Function to get emotion color from CSS variable
function getEmotionColor(emotionName) {
  const emotionColorVar = `--emotion-${emotionName}-RGB`;
  const computedStyle = getComputedStyle(document.documentElement);
  const colorValue = computedStyle.getPropertyValue(emotionColorVar).trim();
  return colorValue ? `rgba(${colorValue}, 1)` : null;
}

// Function to collect unique emotions from transcript clips for a speaker
function collectEmotionsForSpeaker(speakerIndex) {
  const clips = document.querySelectorAll(
    `.transcript-clip[data-speaker-index="${speakerIndex}"]`
  );
  
  console.log(`Found ${clips.length} clips for speaker ${speakerIndex}`);
  
  const emotionsSet = new Set();

  clips.forEach((clip) => {
    // Extract emotion name directly from clip's class (e.g., "emotion-angry" -> "angry")
    // The clip itself has the emotion class
    const emotionClasses = Array.from(clip.classList).filter((cls) =>
      cls.startsWith('emotion-')
    );
    if (emotionClasses.length > 0) {
      const emotionName = emotionClasses[0].replace('emotion-', '');
      emotionsSet.add(emotionName);
    }
  });

  return Array.from(emotionsSet);
}

// Function to sort emotions by group priority (excluding neutral)
function sortEmotions(emotions) {
  const groupPriority = {
    // attack / rejection
    angry: 1,
    contemptuous: 1,
    disgusted: 1,
    // threat / uncertainty
    afraid: 2,
    anxious: 2,
    stressed: 2,
    surprised: 2,
    ashamed: 2,
    frustrated: 2,
    // excited / engaged
    affectionate: 3,
    amused: 3,
    excited: 3,
    happy: 3,
    hopeful: 3,
    proud: 3,
    relieved: 3,
    curious: 3,
    // low energy, negative
    disappointed: 4,
    bored: 4,
    tired: 4,
    concerned: 4,
    confused: 4,
    sad: 4,
    // calm / grounded
    calm: 5,
    confident: 5,
    interested: 5,
    // neutral (always last)
    neutral: 6,
    unknown: 6,
  };

  return emotions.sort((a, b) => {
    const priorityA = groupPriority[a] || 6;
    const priorityB = groupPriority[b] || 6;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // If same priority, sort alphabetically
    return a.localeCompare(b);
  });
}

// Function to populate emotions list column for a speaker
function populateEmotionsList(speakerIndex, emotionsListCell) {
  const emotions = collectEmotionsForSpeaker(speakerIndex);
  
  console.log(`Speaker ${speakerIndex} emotions found:`, emotions);
  
  const sortedEmotions = sortEmotions(emotions);

  if (sortedEmotions.length === 0) {
    console.warn(`No emotions found for speaker ${speakerIndex}`);
    return;
  }

  // Clear any existing content first
  emotionsListCell.innerHTML = '';

  // Create container for emotion items
  sortedEmotions.forEach((emotion, index) => {
    // Create span for each emotion
    const emotionSpan = document.createElement('span');
    // Only capitalize first word (first emotion in list)
    emotionSpan.textContent = index === 0 ? capitalize(emotion) : emotion;
    emotionSpan.className = 'emotion-list-item';
    emotionSpan.setAttribute('data-emotion-name', emotion); // Add data attribute for easy lookup
    const color = getEmotionColor(emotion);
    if (color) {
      emotionSpan.style.color = color;
    }

    emotionsListCell.appendChild(emotionSpan);

    // Add comma separator (except for last item)
    if (index < sortedEmotions.length - 1) {
      const commaSpan = document.createElement('span');
      commaSpan.textContent = ', ';
      // Color comma with the same color as the previous emotion
      if (color) {
        commaSpan.style.color = color;
      }
      emotionsListCell.appendChild(commaSpan);
    }
  });
}

// Initialize emotions list for all speakers
export function initEmotionsList() {
  // Wait a bit to ensure transcript clips are loaded
  setTimeout(() => {
    const speechTable = document.querySelector('.speech-summary');
    if (!speechTable) {
      console.warn('Speech summary table not found');
      return;
    }

    const rows = speechTable.querySelectorAll('tbody tr');
    if (rows.length === 0) {
      console.warn('No rows found in speech summary table');
      return;
    }

    rows.forEach((row) => {
      const speakerNameCell = row.querySelector('.speaker-name-column');
      const emotionsColumn = row.querySelector('.speaker-emotions-column');
      const emotionsListCell = emotionsColumn?.querySelector('.speaker-emotions-list-column');

      if (!speakerNameCell || !emotionsColumn || !emotionsListCell) {
        console.warn('Required cells not found in row');
        return;
      }

      // Get speaker index from fingerprint element
      const fingerprint = emotionsColumn.querySelector('.speaker-fingerprint');
      if (!fingerprint) {
        console.warn('Fingerprint not found in row');
        return;
      }

      const speakerIndex = fingerprint.getAttribute('data-speaker-index');
      if (!speakerIndex) {
        console.warn('Speaker index not found');
        return;
      }

      populateEmotionsList(speakerIndex, emotionsListCell);
    });
  }, 100);
}


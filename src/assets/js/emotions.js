// Map individual emotions to their group CSS variables
export const emotionGroupMap = {
  // no strong signal
  'neutral': 'neutral',
  'unknown': 'neutral',
  // attack / rejection
  'angry': 'angry',
  'contemptuous': 'angry',
  'disgusted': 'angry',
  // threat / uncertainty
  'afraid': 'fear',
  'anxious': 'fear',
  'stressed': 'fear',
  'surprised': 'fear',
  'ashamed': 'fear',
  'frustrated': 'fear',
  // calm / grounded
  'calm': 'positive-low-energy',
  'confident': 'positive-low-energy',
  'interested': 'positive-low-energy',
  // excited / engaged
  'affectionate': 'positive-high-energy',
  'amused': 'positive-high-energy',
  'excited': 'positive-high-energy',
  'happy': 'positive-high-energy',
  'hopeful': 'positive-high-energy',
  'proud': 'positive-high-energy',
  'relieved': 'positive-high-energy',
  'curious': 'positive-high-energy',
  // low energy, negative
  'sad': 'sad',
  'disappointed': 'sad',
  'bored': 'sad',
  'tired': 'sad',
  'concerned': 'sad',
  'confused': 'sad'
};

// Update emotion caption on hover (instant, no transition)
export function updateEmotionCaption(clip, captionSelector = '.emotion-caption') {
  const emotionCaption = document.querySelector(captionSelector);
  if (!emotionCaption) return;
  
  // Extract emotion name from class (e.g., "emotion-angry" -> "angry")
  const emotionClasses = Array.from(clip.classList).filter(cls => cls.startsWith('emotion-'));
  if (emotionClasses.length === 0) return;
  
  const emotionName = emotionClasses[0].replace('emotion-', '');
  
  // Update text (don't clear, just update)
  emotionCaption.textContent = emotionName;
  
  // Get color directly from emotion CSS variable (each emotion has its own variable)
  const emotionColorVar = `--emotion-${emotionName}-RGB`;
  const computedStyle = getComputedStyle(document.documentElement);
  const colorValue = computedStyle.getPropertyValue(emotionColorVar).trim();
  
  if (colorValue) {
    emotionCaption.style.color = `rgba(${colorValue}, 1)`;
  }
  
  // Show instantly (no transition)
  emotionCaption.classList.add('visible');
}

// Highlight emotion in the list instead of showing caption
export function updateFingerprintEmotionCaption(clip, speakerIndex) {
  const speechTable = document.querySelector('.speech-summary');
  if (!speechTable) return;
  
  // Extract emotion name from class (e.g., "emotion-angry" -> "angry")
  const emotionClasses = Array.from(clip.classList).filter(cls => cls.startsWith('emotion-'));
  if (emotionClasses.length === 0) return;
  
  const emotionName = emotionClasses[0].replace('emotion-', '');
  
  // Find the fingerprint element and then its row
  const fingerprint = speechTable.querySelector(`.speaker-fingerprint[data-speaker-index="${speakerIndex}"]`);
  if (!fingerprint) return;
  
  const row = fingerprint.closest('tr');
  if (!row) return;
  
  const emotionsListColumn = row.querySelector('.speaker-emotions-list-column');
  if (!emotionsListColumn) return;
  
  // Remove highlight from all emotion items first
  const allEmotionItems = emotionsListColumn.querySelectorAll('.emotion-list-item');
  allEmotionItems.forEach(item => {
    item.style.backgroundColor = '';
  });
  
  // Find the emotion item in the list by data attribute
  const emotionItem = emotionsListColumn.querySelector(`.emotion-list-item[data-emotion-name="${emotionName}"]`);
  if (!emotionItem) return;
  
  // Get color directly from emotion CSS variable (each emotion has its own variable)
  const emotionColorVar = `--emotion-${emotionName}-RGB`;
  const computedStyle = getComputedStyle(document.documentElement);
  const colorValue = computedStyle.getPropertyValue(emotionColorVar).trim();
  
  // Set background color with 0.2 opacity
  if (colorValue) {
    emotionItem.style.backgroundColor = `rgba(${colorValue}, 0.2)`;
  }
}

// Remove highlight from emotion in the list when leaving fingerprint area
export function fadeOutFingerprintEmotionCaption(speakerIndex) {
  const speechTable = document.querySelector('.speech-summary');
  if (!speechTable) return;
  
  // Find the fingerprint element and then its row
  const fingerprint = speechTable.querySelector(`.speaker-fingerprint[data-speaker-index="${speakerIndex}"]`);
  if (!fingerprint) return;
  
  const row = fingerprint.closest('tr');
  if (!row) return;
  
  const emotionsListColumn = row.querySelector('.speaker-emotions-list-column');
  if (!emotionsListColumn) return;
  
  // Remove background from all emotion items
  const emotionItems = emotionsListColumn.querySelectorAll('.emotion-list-item');
  emotionItems.forEach(item => {
    item.style.backgroundColor = '';
  });
}

// Fade out emotion caption when leaving visualization area (with transition)
export function fadeOutEmotionCaption() {
  const emotionCaption = document.querySelector('.emotion-caption');
  if (!emotionCaption) return;
  
  // Remove visible class to trigger fade out transition
  emotionCaption.classList.remove('visible');
}

// Update clip text caption on hover (instant, no transition)
export function updateClipTextCaption(clip, captionSelector = '.clip-text-caption') {
  const clipTextCaption = document.querySelector(captionSelector);
  if (!clipTextCaption) return;
  
  // Find span element inside caption
  const captionSpan = clipTextCaption.querySelector('span');
  if (!captionSpan) return;
  
  // Extract text from .clip-text p element
  const clipTextElement = clip.querySelector('.clip-text p');
  if (!clipTextElement) {
    // If no text found, hide the caption
    clipTextCaption.classList.remove('visible');
    return;
  }
  
  const clipText = clipTextElement.textContent.trim();
  
  // Update text content in span
  captionSpan.textContent = clipText;
  
  // Show instantly (no transition)
  clipTextCaption.classList.add('visible');
}

// Fade out clip text caption when leaving visualization area (with transition)
export function fadeOutClipTextCaption(captionSelector = '.clip-text-caption') {
  const clipTextCaption = document.querySelector(captionSelector);
  if (!clipTextCaption) return;
  
  // Remove visible class to trigger fade out transition
  clipTextCaption.classList.remove('visible');
}

// Function to determine emotion group priority for sorting
export function getEmotionGroupPriority(emotionClass) {
  const emotionName = emotionClass.replace('emotion-', '');
  
  const groupMapping = {
    'attack-rejection': ['angry', 'contemptuous', 'disgusted'],
    'threat-uncertainty': ['afraid', 'anxious', 'stressed', 'surprised', 'ashamed', 'frustrated', 'fear'],
    'excited-engaged': ['affectionate', 'amused', 'excited', 'happy', 'hopeful', 'proud', 'relieved', 'curious'],
    'low-energy-negative': ['disappointed', 'bored', 'tired', 'concerned', 'confused', 'sad'],
    'calm-grounded': ['calm', 'confident', 'interested'],
    'neutral': ['neutral', 'unknown']
  };
  
  const groupOrder = ['attack-rejection', 'threat-uncertainty', 'excited-engaged', 'low-energy-negative', 'calm-grounded', 'neutral'];
  
  for (let i = 0; i < groupOrder.length; i++) {
    if (groupMapping[groupOrder[i]].includes(emotionName)) {
      return i + 1; // Return 1-6
    }
  }
  
  return 6; // Default to neutral
}

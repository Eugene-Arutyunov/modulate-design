/**
 * Initialize hover handlers for model items
 * Updates status bar on hover with model name and description
 */
export function initModelItemsHover() {
  const modelItems = document.querySelectorAll('.model-item');
  const statusBar = document.querySelector('.status-bar');
  const statusBarCaption = document.querySelector('.status-bar-caption');
  
  if (!statusBar || !statusBarCaption) return;

  modelItems.forEach(item => {
    const modelNameElement = item.querySelector('p:first-of-type');
    const modelDescriptionElement = item.querySelector('.model-description');
    
    if (!modelNameElement) return;

    const modelName = modelNameElement.textContent.trim();
    const modelDescription = modelDescriptionElement 
      ? modelDescriptionElement.textContent.trim() 
      : '';

    item.addEventListener('mouseenter', () => {
      const strong = statusBarCaption.querySelector('strong');
      const span = statusBarCaption.querySelector('span');
      
      if (strong) {
        strong.textContent = modelName + ' Model';
      }
      
      if (span) {
        span.textContent = modelDescription;
      }

      // Показать статус-бар мгновенно
      statusBar.classList.add('active');
    });

    item.addEventListener('mouseleave', () => {
      const strong = statusBarCaption.querySelector('strong');
      const span = statusBarCaption.querySelector('span');
      
      // Очистить содержимое
      if (strong) {
        strong.textContent = '';
      }
      
      if (span) {
        span.textContent = '';
      }

      // Скрыть статус-бар с транзишеном
      statusBar.classList.remove('active');
    });
  });
}


// Автоматически обновляет RGB значения в guide-color-plate элементах
// на основе computed стилей из CSS переменных

function updateColorDisplays() {
  const colorPlates = document.querySelectorAll('.guide-color-plate');
  
  colorPlates.forEach(plate => {
    const rgbParagraph = plate.querySelector('p:last-child');
    if (!rgbParagraph) return;
    
    // Получаем computed стиль элемента
    const computedStyle = window.getComputedStyle(plate);
    const bgColor = computedStyle.backgroundColor;
    
    // Извлекаем RGB значения из строки вида "rgb(30, 30, 35)" или "rgba(30, 30, 35, 1)"
    const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    
    if (rgbMatch) {
      const r = rgbMatch[1];
      const g = rgbMatch[2];
      const b = rgbMatch[3];
      rgbParagraph.textContent = `rgb(${r}, ${g}, ${b})`;
    }
  });
}

// Обновляем при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateColorDisplays);
} else {
  updateColorDisplays();
}

// Также обновляем при изменении темы (если есть переключатель)
// Можно добавить MutationObserver для отслеживания изменений класса dark-mode
const observer = new MutationObserver(() => {
  updateColorDisplays();
});

const body = document.body;
if (body) {
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['class']
  });
}


export function initUploadForm() {
  const checkbox = document.getElementById('terms-checkbox');
  const submitButton = document.querySelector('.upload-form .ids__form-button');

  if (!checkbox || !submitButton) {
    return;
  }

  // Update button state based on checkbox
  function updateButtonState() {
    submitButton.disabled = !checkbox.checked;
  }

  // Set initial state
  updateButtonState();

  // Listen for checkbox changes
  checkbox.addEventListener('change', updateButtonState);
}

export function initUploadAreaStateSwitcher() {
  const container = document.querySelector('.upload-area-container');
  const stateSwitcher = container?.querySelector('.state-switcher');
  const radioButtons = stateSwitcher?.querySelectorAll('input[type="radio"]');

  if (!container || !stateSwitcher || !radioButtons) {
    return;
  }

  // Устанавливаем начальное состояние
  const initialRadio = stateSwitcher.querySelector('input[value="initial"]');
  if (initialRadio) {
    initialRadio.checked = true;
  }

  // Обработчик изменения состояния
  radioButtons.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        const newState = e.target.value;
        // Удаляем все классы состояний
        container.classList.remove('state-initial', 'state-file-dropping', 'state-accept', 'state-uploading');
        // Добавляем новый класс состояния
        container.classList.add(`state-${newState}`);
      }
    });
  });
}

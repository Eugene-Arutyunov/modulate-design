export function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const closeButton = document.querySelector('.sidebar-close');
  const openLink = document.querySelector('.tmp-transcript-link');
  
  if (!sidebar) return;
  
  // Function to open sidebar
  function openSidebar() {
    sidebar.classList.remove('sidebar-closed');
  }
  
  // Function to close sidebar
  function closeSidebar() {
    sidebar.classList.add('sidebar-closed');
  }
  
  // Add click handler to close button
  if (closeButton) {
    closeButton.addEventListener('click', function(e) {
      e.preventDefault();
      closeSidebar();
    });
  }
  
  // Add click handler to open link
  if (openLink) {
    openLink.addEventListener('click', function(e) {
      e.preventDefault();
      openSidebar();
    });
  }
}


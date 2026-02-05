// theme.js
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('themeToggle');
  const body = document.body;
  
  // تحقق من الوضع المحفوظ أو تفضيل النظام
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(savedTheme + '-theme');
    updateIcon(savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    updateIcon('dark');
  }

  toggleBtn.addEventListener('click', () => {
    if (body.classList.contains('light-theme')) {
      body.classList.replace('light-theme', 'dark-theme');
      localStorage.setItem('theme', 'dark');
      updateIcon('dark');
    } else {
      body.classList.replace('dark-theme', 'light-theme');
      localStorage.setItem('theme', 'light');
      updateIcon('light');
    }
  });

  function updateIcon(theme) {
    toggleBtn.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun-bright"></i>'
      : '<i class="fa-solid fa-moon-stars"></i>';
  }

  // Fade-in animation عند التمرير (اختياري – بسيط)
  const fadeElements = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  fadeElements.forEach(el => observer.observe(el));
});

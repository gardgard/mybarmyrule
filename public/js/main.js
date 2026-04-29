document.addEventListener('DOMContentLoaded', () => {

  // === Sidebar toggle (mobile) ===
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('sidebarToggle');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle) {
        sidebar.classList.remove('open');
      }
    });
  }

  // === Global search → redirect to library ===
  const globalSearch = document.getElementById('globalSearch');
  if (globalSearch) {
    globalSearch.addEventListener('keydown', e => {
      if (e.key === 'Enter' && globalSearch.value.trim()) {
        window.location.href = `/drinks?search=${encodeURIComponent(globalSearch.value.trim())}`;
      }
    });
  }

  // === Animate stats cards on scroll ===
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.stat-card, .drink-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity .3s ease ${i * 0.05}s, transform .3s ease ${i * 0.05}s, border-color .2s ease, box-shadow .2s ease`;
    observer.observe(el);
  });

  // === Auto-submit search on form ===
  const searchInput = document.querySelector('.search-box input');
  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => searchInput.closest('form')?.submit(), 600);
    });
  }

});

(function () {
  const root = document.documentElement;
  if (document.body.dataset.page === 'lecture') window.courseLabParams = Object.create(null);
  const buttons = document.querySelectorAll('button[data-theme]');
  function apply(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? '切换到浅色' : '切换到深色';
      button.querySelector('.theme-label').textContent = dark ? '浅色' : '深色';
    }
  }
  apply(root.dataset.theme || 'light');
  for (const button of buttons) {
    button.addEventListener('click', function () {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('nonparam-course-theme', next); } catch (error) {}
      apply(next);
    });
  }
})();

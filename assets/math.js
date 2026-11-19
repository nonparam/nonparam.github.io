(() => {
  'use strict';

  function renderMath(root = document.body) {
    if (typeof window.renderMathInElement !== 'function') {
      console.error('无法加载本地公式排版脚本，请检查 assets/katex 目录。');
      return;
    }

    window.renderMathInElement(root, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
      ignoredClasses: ['katex', 'katex-display', 'katex-error'],
      throwOnError: true,
      trust: false,
      errorCallback(message, error) {
        console.warn('公式排版异常', message, error);
      }
    });

  }

  window.renderCourseMath = renderMath;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderMath(), { once: true });
  } else {
    renderMath();
  }
})();

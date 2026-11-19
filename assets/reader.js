(() => {
  'use strict';
  const main = document.getElementById('main');
  if (!main || document.body.dataset.page !== 'lecture') return;

  const sidebar = document.getElementById('sidebar');
  const menu = document.getElementById('menuToggle');
  const shade = document.getElementById('menuOverlay');
  const progress = document.getElementById('progress');
  const toTop = document.getElementById('toTop');
  const deckButton = document.getElementById('deckToggle');
  const modules = [...main.querySelectorAll('section.module[id]')];
  const toc = [...document.querySelectorAll('.toc a[href^="#"]')].map(link => {
    const id = decodeURIComponent(link.hash.slice(1));
    return { link, target: document.getElementById(id) };
  }).filter(item => item.target);
  let deck = null;
  let scheduled = false;
  let menuOpen = false;

  function narrow() {
    return menu && menu.getClientRects().length > 0;
  }

  function setMenu(open, restoreFocus = false) {
    menuOpen = Boolean(open && narrow());
    document.body.classList.toggle('menu-open', menuOpen);
    if (sidebar) {
      sidebar.classList.toggle('open', menuOpen);
      sidebar.inert = Boolean(narrow() && !menuOpen);
    }
    if (shade) {
      shade.hidden = !menuOpen;
      shade.classList.toggle('open', menuOpen);
    }
    if (menu) menu.setAttribute('aria-expanded', String(menuOpen));
    if (menuOpen) {
      const current = sidebar?.querySelector('.toc [aria-current], .toc a');
      current?.focus({ preventScroll: true });
    } else if (restoreFocus) {
      menu?.focus({ preventScroll: true });
    }
  }

  menu?.setAttribute('aria-controls', 'sidebar');
  menu?.addEventListener('click', () => setMenu(!menuOpen));
  shade?.addEventListener('click', () => setMenu(false, true));
  toc.forEach(({ link, target }) => link.addEventListener('click', () => {
    if (!menuOpen) return;
    setMenu(false);
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }));
  setMenu(false);

  function updateReadingPosition() {
    scheduled = false;
    if (deck) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    if (progress) progress.style.width = (100 * ratio).toFixed(2) + '%';
    if (toTop) toTop.hidden = scrollY < innerHeight * 0.6;
    if (!toc.length) return;
    let active = toc[0];
    const threshold = narrow() ? 94 : 72;
    for (const item of toc) {
      if (item.target.getBoundingClientRect().top <= threshold) active = item;
    }
    if (ratio > 0.999) active = toc[toc.length - 1];
    toc.forEach(item => {
      item.link.classList.toggle('active', item === active);
      if (item === active) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    });
  }
  function onScroll() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateReadingPosition);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    if (deck) return;
    if (!narrow() || !menuOpen) setMenu(false);
    onScroll();
  });
  window.addEventListener('load', onScroll);
  toTop?.addEventListener('click', () => window.scrollTo({
    top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  }));
  updateReadingPosition();

  const quizzes = [...main.querySelectorAll('.quiz[data-answer]')];
  function updateScore() {
    const score = document.getElementById('quizScore');
    if (!score) return;
    const answered = quizzes.filter(q => q.dataset.answered);
    const correct = answered.filter(q => q.dataset.answered === 'correct');
    score.textContent = '已答 ' + answered.length + ' / ' + quizzes.length + ' · 答对 ' + correct.length + ' 题';
  }
  quizzes.forEach(quiz => {
    const choices = [...quiz.querySelectorAll(':scope > button')];
    const correct = Number(quiz.dataset.answer);
    if (!choices[correct]) return;
    const feedback = document.createElement('p');
    feedback.className = 'quiz-feedback';
    feedback.setAttribute('role', 'status');
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'quiz-retry';
    retry.textContent = '重新作答';
    retry.hidden = true;
    quiz.append(feedback, retry);
    choices.forEach((choice, i) => {
      choice.type = 'button';
      choice.addEventListener('click', () => {
        if (quiz.dataset.answered) return;
        const isCorrect = i === correct;
        quiz.dataset.answered = isCorrect ? 'correct' : 'incorrect';
        choices.forEach((option, j) => {
          option.disabled = true;
          option.classList.toggle('quiz-correct', j === correct);
          option.classList.toggle('quiz-incorrect', j === i && !isCorrect);
        });
        const decision = isCorrect ? '回答正确。' : '回答有误。正确选项为「' + choices[correct].textContent.trim() + '」。';
        feedback.textContent = decision + (quiz.dataset.explanation || '');
        retry.hidden = false;
        updateScore();
      });
    });
    retry.addEventListener('click', () => {
      delete quiz.dataset.answered;
      choices.forEach(option => {
        option.disabled = false;
        option.classList.remove('quiz-correct', 'quiz-incorrect');
      });
      feedback.textContent = '';
      retry.hidden = true;
      choices[0].focus({ preventScroll: true });
      updateScore();
    });
  });
  updateScore();

  // A slide owns a short sequence of original DOM blocks. Labs retain their
  // inputs and event listeners when the main element moves into the dialog.
  function makeSlides() {
    const slides = [];
    for (const section of modules) {
      const heading = section.querySelector(':scope > h2');
      const sectionName = section.dataset.title || heading?.textContent || '';
      let group = [];
      let chars = 0;
      const flush = () => {
        if (!group.length) return;
        const first = group[0];
        const headingNode = first.matches('h3,h4') ? first : first.querySelector('h3,h4,summary');
        const chart = group.find(block => block.matches('figure[data-figure-title]'));
        const title = (chart?.dataset.figureTitle || first.dataset.title || headingNode?.textContent || sectionName).trim();
        slides.push({ section, title, blocks: group });
        group = [];
        chars = 0;
      };
      for (const block of section.children) {
        if (block === heading || block.matches('script,style,template')) continue;
        const isUnit = block.matches('.lab,.quiz,.example,.mathbox,figure,table,details');
        const startsTopic = block.matches('h3,h4');
        const hasBody = group.some(el => !el.matches('h3,h4'));
        if (hasBody && (startsTopic || isUnit || group.length >= 5 || chars > 370)) flush();
        group.push(block);
        chars += block.textContent.length;
        if (isUnit) flush();
      }
      flush();
    }
    return slides;
  }
  function readingSlide(slides) {
    const line = narrow() ? 94 : 72;
    let choice = 0;
    for (let i = 0; i < slides.length; i++) {
      const rect = slides[i].blocks[0].getBoundingClientRect();
      if (rect.top <= line) choice = i;
      else if (i > 0 && slides[i].section !== slides[i-1].section &&
               slides[i].section.getBoundingClientRect().top <= line) choice = i;
    }
    return choice;
  }
  function makeDialog() {
    const dialog = document.createElement('dialog');
    dialog.className = 'np-deck';
    dialog.setAttribute('aria-label', '课堂投影');
    dialog.innerHTML =
      '<header class="np-deck-head"><div><div class="np-deck-section"></div><h2 class="np-deck-title"></h2></div>' +
      '<button type="button" data-action="leave" title="Esc 退出">退出投影</button></header>' +
      '<div class="np-deck-content" tabindex="-1"></div>' +
      '<footer class="np-deck-foot"><div class="np-deck-nav">' +
      '<button type="button" data-action="prev" title="上一张（←）" aria-label="上一张">←</button>' +
      '<span class="np-deck-count" aria-live="polite"></span>' +
      '<button type="button" data-action="next" title="下一张（→）" aria-label="下一张">→</button></div>' +
      '<div class="np-deck-tools"><button type="button" data-action="step" title="空格展开下一步">下一步</button>' +
      '<button type="button" data-action="steps" title="S 切换分步">分步</button>' +
      '<button type="button" data-action="grid" title="G 打开或关闭投影目录">目录</button></div></footer>' +
      '<div class="np-deck-grid" hidden><div><header><h3>投影目录</h3>' +
      '<button type="button" data-action="grid" aria-label="关闭投影目录">关闭</button></header>' +
      '<ol></ol></div></div>';
    return dialog;
  }

  function openDeck() {
    if (deck || !modules.length) return;
    const slides = makeSlides();
    if (!slides.length) return;
    const initial = readingSlide(slides);
    const originalFocus = document.activeElement;
    const returnTo = { x: window.scrollX, y: window.scrollY };
    setMenu(false);
    const marker = document.createComment('lecture reading position');
    main.before(marker);
    const dialog = makeDialog();
    document.body.append(dialog);
    const content = dialog.querySelector('.np-deck-content');
    deck = { slides, index: initial, dialog, content, marker, returnTo, originalFocus,
      steps: true, seen: new Map(), stepNodes: [], path: [], shown: [], nativeFullscreen: false };
    content.append(main);
    document.body.classList.add('np-present');
    const entries = dialog.querySelector('.np-deck-grid ol');
    slides.forEach((slide, i) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.slide = i;
      button.textContent = String(i + 1).padStart(2, '0') + ' · ' + slide.section.dataset.label + ' ' + slide.title;
      item.append(button);
      entries.append(item);
    });
    dialog.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action], button[data-slide]');
      if (!btn) return;
      if (btn.hasAttribute('data-slide')) {
        toggleGrid(false);
        showSlide(Number(btn.dataset.slide));
        content.focus({ preventScroll: true });
        return;
      }
      switch (btn.dataset.action) {
        case 'prev': showSlide(deck.index - 1); break;
        case 'next': showSlide(deck.index + 1); break;
        case 'step': advance(); break;
        case 'steps': toggleSteps(); break;
        case 'grid': toggleGrid(); break;
        case 'leave': closeDeck(); break;
      }
    });
    dialog.addEventListener('cancel', e => {
      e.preventDefault();
      if (gridOpen()) toggleGrid(false);
      else closeDeck();
    });
    dialog.showModal();
    showSlide(initial);
    content.focus({ preventScroll: true });
    // Request fullscreen on the page root so that the modal remains in the
    // top layer. Browsers that withhold fullscreen keep the modal presentation.
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        if (deck?.dialog === dialog) deck.nativeFullscreen = true;
        else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }).catch(() => {});
    }
  }
  function clearSlide() {
    deck.path.forEach(el => el.classList.remove('np-slide-path'));
    deck.shown.forEach(el => el.classList.remove('np-slide-member'));
    deck.stepNodes.forEach(el => el.classList.remove('np-step-hidden'));
    deck.path = [];
    deck.shown = [];
    deck.stepNodes = [];
  }
  function showSlide(index) {
    if (!deck || index < 0 || index >= deck.slides.length) return;
    clearSlide();
    deck.index = index;
    const slide = deck.slides[index];
    let node = slide.section;
    while (node && main.contains(node)) {
      node.classList.add('np-slide-path');
      deck.path.push(node);
      node = node.parentElement;
    }
    slide.blocks.forEach(block => {
      block.classList.add('np-slide-member');
      deck.shown.push(block);
      if (block.matches('.mathbox[data-kind="algorithm"]')) {
        for (const part of block.children) {
          if (part.matches('.mathbox-head')) continue;
          if (part.matches('ol')) deck.stepNodes.push(...part.children);
          else deck.stepNodes.push(part);
        }
      } else if (block.matches('ol,ul') && block.children.length) {
        deck.stepNodes.push(...block.children);
      } else if (!block.matches('h3,h4')) {
        deck.stepNodes.push(block);
      }
    });
    const { dialog, content } = deck;
    const sectionTitle = slide.section.dataset.title || '';
    dialog.querySelector('.np-deck-section').textContent = '§ ' + slide.section.dataset.label +
      (slide.title === sectionTitle ? '' : ' · ' + sectionTitle);
    dialog.querySelector('.np-deck-title').textContent = slide.title;
    dialog.querySelector('[data-action=prev]').disabled = index === 0;
    dialog.querySelector('[data-action=next]').disabled = index === deck.slides.length - 1;
    dialog.querySelectorAll('[data-slide]').forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    // Feature headings are already in the header when they are direct siblings.
    for (const block of slide.blocks) {
      if (block.matches('h3,h4') && block.textContent.trim() === slide.title) {
        block.classList.remove('np-slide-member');
      }
    }
    content.scrollTop = 0;
    renderSteps();
    window.dispatchEvent(new Event('resize'));
  }
  function renderSteps() {
    const { dialog, stepNodes, index, slides, steps } = deck;
    const count = Math.max(1, stepNodes.length);
    const shown = steps ? (deck.seen.get(index) || 1) : count;
    stepNodes.forEach((node, i) => node.classList.toggle('np-step-hidden', i >= shown));
    dialog.querySelector('.np-deck-count').textContent = (index + 1) + ' / ' + slides.length +
      (steps && count > 1 ? ' · ' + shown + '/' + count + ' 步' : '');
    const toggle = dialog.querySelector('[data-action=steps]');
    toggle.setAttribute('aria-pressed', String(steps));
    toggle.textContent = steps ? '分步开' : '分步关';
    const advanceBtn = dialog.querySelector('[data-action=step]');
    advanceBtn.disabled = shown >= count && index === slides.length - 1;
    advanceBtn.textContent = shown < count ? '下一步' : '下一张';
  }
  function advance() {
    const max = deck.stepNodes.length;
    const seen = deck.seen.get(deck.index) || 1;
    if (deck.steps && seen < max) {
      deck.seen.set(deck.index, seen + 1);
      renderSteps();
      deck.stepNodes[seen].scrollIntoView({ block: 'nearest', behavior: 'instant' });
    } else {
      showSlide(deck.index + 1);
    }
  }
  function toggleSteps() {
    deck.steps = !deck.steps;
    renderSteps();
  }
  function gridOpen() {
    return deck && !deck.dialog.querySelector('.np-deck-grid').hidden;
  }
  function toggleGrid(open = !gridOpen()) {
    const grid = deck.dialog.querySelector('.np-deck-grid');
    grid.hidden = !open;
    for (const child of deck.dialog.children) if (child !== grid) child.inert = open;
    if (open) {
      const button = grid.querySelector('[aria-current=page]');
      button.focus({ preventScroll: true });
      button.scrollIntoView({ block: 'nearest' });
    } else deck.content.focus({ preventScroll: true });
  }
  function closeDeck() {
    if (!deck) return;
    const { dialog, marker, returnTo, originalFocus, nativeFullscreen } = deck;
    clearSlide();
    deck = null;
    dialog.close();
    marker.replaceWith(main);
    dialog.remove();
    document.body.classList.remove('np-present');
    const focusTarget = originalFocus?.isConnected && originalFocus !== document.body ? originalFocus : deckButton;
    const restore = () => {
      if (deck) return;
      focusTarget?.focus({ preventScroll: true });
      window.scrollTo({ left: returnTo.x, top: returnTo.y, behavior: 'instant' });
      updateReadingPosition();
    };
    restore();
    if (nativeFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {}).finally(() => requestAnimationFrame(restore));
    } else requestAnimationFrame(restore);
    window.dispatchEvent(new Event('resize'));
  }
  document.addEventListener('fullscreenchange', () => {
    if (deck?.nativeFullscreen && !document.fullscreenElement) closeDeck();
  });
  deckButton?.addEventListener('click', openDeck);
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    if (!deck) {
      if (menuOpen && e.key === 'Escape') {
        e.preventDefault();
        setMenu(false, true);
      }
      if (menuOpen && e.key === 'Tab' && sidebar) {
        const items = [menu, ...sidebar.querySelectorAll('a[href],button:not([disabled])')]
          .filter(el => el && el.getClientRects().length);
        if (e.shiftKey && document.activeElement === items[0]) {
          e.preventDefault(); items.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
          e.preventDefault(); items[0]?.focus();
        }
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (gridOpen()) toggleGrid(false);
      else closeDeck();
      return;
    }
    if (e.target.closest('input,textarea,select,[contenteditable=true],[role=slider],.py-panel')) return;
    if (e.key.toLowerCase() === 'g') {
      e.preventDefault(); toggleGrid(); return;
    }
    if (gridOpen()) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); showSlide(deck.index + (e.key === 'ArrowRight' ? 1 : -1));
    } else if (e.key === ' ' && !e.target.closest('button,a,summary')) {
      e.preventDefault(); advance();
    } else if (e.key.toLowerCase() === 's') {
      e.preventDefault(); toggleSteps();
    }
  });
})();

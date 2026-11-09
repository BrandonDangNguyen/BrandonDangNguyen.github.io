/* Progressive enhancements; the complete article is readable without JavaScript. */
(() => {
  const passage = document.getElementById('bible-passage');
  passage?.addEventListener('click', () => {
    const showGreek = passage.classList.toggle('show-greek');
    passage.setAttribute('aria-pressed', String(showGreek));
  });

  const progress = document.querySelector('.reading-progress');
  const article = document.querySelector('.devo-full');
  let scheduled = false;

  function updateReadingPosition() {
    scheduled = false;
    const articleEnd = article.getBoundingClientRect().bottom + window.scrollY;
    const distance = Math.max(1, articleEnd - window.innerHeight);
    const completion = Math.max(0, Math.min(1, window.scrollY / distance));
    progress.style.transform = `scaleX(${completion})`;
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateReadingPosition);
  }

  if (progress && article) {
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('load', scheduleUpdate, { once: true });
    updateReadingPosition();
  }
  // Animate only as elements enter the viewport; content never depends on JS
  // or an animation class to become visible.
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const activeAnimations = new Set();
  let revealObserver;

  function reveal(element, delay = 0) {
    if (motionPreference.matches || typeof element.animate !== 'function') return;
    const animation = element.animate(
      [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 650, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
    activeAnimations.add(animation);
    const release = () => activeAnimations.delete(animation);
    animation.addEventListener('finish', release, { once: true });
    animation.addEventListener('cancel', release, { once: true });
  }

  if (!motionPreference.matches) {
    document.querySelectorAll('.hero-copy > *').forEach((element, index) => reveal(element, index * 65));
    if ('IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          revealObserver.unobserve(entry.target);
          // Keep anchor destinations and focused controls stable.
          if (entry.target.closest(':target') || entry.target.contains(document.activeElement)) return;
          reveal(entry.target);
        });
      }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
      document.querySelectorAll('.article-body h2, .article-body p, .comments-section > h3, .comment-form')
        .forEach(element => revealObserver.observe(element));
    }
  }

  motionPreference.addEventListener('change', event => {
    if (!event.matches) return;
    revealObserver?.disconnect();
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations.clear();
  });

})();

/* Progressive enhancements; the complete article is readable without JavaScript. */
(() => {
  const passage = document.getElementById('bible-passage');
  passage?.addEventListener('click', () => {
    const showGreek = passage.classList.toggle('show-greek');
    passage.setAttribute('aria-pressed', String(showGreek));
  });

  const progress = document.querySelector('.reading-progress');
  const article = document.querySelector('.devo-full');
  const sections = [...document.querySelectorAll('.article-body section')];
  const links = [...document.querySelectorAll('.section-nav li a')];
  let scheduled = false;

  function updateReadingPosition() {
    scheduled = false;
    const articleEnd = article.getBoundingClientRect().bottom + window.scrollY;
    const distance = Math.max(1, articleEnd - window.innerHeight);
    const completion = Math.max(0, Math.min(1, window.scrollY / distance));
    progress.style.transform = `scaleX(${completion})`;
    let active = -1;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= 200) active = index;
    });
    links.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
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
})();

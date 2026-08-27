const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const searchDialog = document.querySelector('.search-dialog');
const searchToggle = document.querySelector('.search-toggle');
const searchClose = document.querySelector('.search-close');
const searchInput = document.querySelector('#site-search');
const searchResults = document.querySelector('[data-search-results]');
const searchSummary = document.querySelector('.search-summary');
const header = document.querySelector('[data-header]');
const readingLine = document.querySelector('[data-reading-line]');

const searchableItems = [...document.querySelectorAll('[data-search-item]')].map((item) => ({
  title: item.dataset.title,
  topic: item.dataset.topic,
  scripture: item.dataset.scripture,
  url: item.dataset.url,
}));

function setMenu(open) {
  menuToggle?.setAttribute('aria-expanded', String(open));
  siteNav?.classList.toggle('is-open', open);
  document.body.classList.toggle('nav-open', open);
}

menuToggle?.addEventListener('click', () => {
  setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});

siteNav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});

function renderSearch(query = '') {
  if (!searchResults || !searchSummary) return;

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = searchableItems.filter((item) => (
    `${item.title} ${item.topic} ${item.scripture}`.toLocaleLowerCase().includes(normalizedQuery)
  ));

  searchResults.replaceChildren();
  searchSummary.textContent = normalizedQuery
    ? `${matches.length} ${matches.length === 1 ? 'entry' : 'entries'} found`
    : 'Recent and featured writings';

  if (!matches.length) {
    const empty = document.createElement('li');
    empty.className = 'search-empty';
    empty.textContent = 'No matching note yet. Try a biblical book, topic, or title.';
    searchResults.append(empty);
    return;
  }

  matches.forEach((item) => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    const title = document.createElement('strong');
    const meta = document.createElement('span');

    link.href = item.url;
    title.textContent = item.title;
    meta.textContent = `${item.topic} · ${item.scripture}`;
    link.append(title, meta);
    listItem.append(link);
    searchResults.append(listItem);
  });
}

function openSearch() {
  if (!searchDialog) return;
  renderSearch();
  searchDialog.showModal();
  window.setTimeout(() => searchInput?.focus(), 40);
}

searchToggle?.addEventListener('click', () => {
  setMenu(false);
  openSearch();
});
searchClose?.addEventListener('click', () => searchDialog?.close());
searchInput?.addEventListener('input', () => renderSearch(searchInput.value));
searchDialog?.addEventListener('click', (event) => {
  const rect = searchDialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right
    && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) searchDialog.close();
});

document.addEventListener('keydown', (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;

  if (event.key === '/' && !isTyping && !searchDialog?.open) {
    event.preventDefault();
    openSearch();
  }

  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuToggle.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 860) setMenu(false);
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('[data-reveal]');

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });

  revealItems.forEach((item) => observer.observe(item));
}

let scrollFrame = null;
function updateScrollDetails() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  if (readingLine) readingLine.style.width = `${progress * 100}%`;
  header?.classList.toggle('is-scrolled', window.scrollY > 12);
  scrollFrame = null;
}

window.addEventListener('scroll', () => {
  if (scrollFrame !== null) return;
  scrollFrame = window.requestAnimationFrame(updateScrollDetails);
}, { passive: true });

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

updateScrollDetails();


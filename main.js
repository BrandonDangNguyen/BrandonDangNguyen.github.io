gsap.registerPlugin(ScrollTrigger);

// footer year
const yearEl = document.querySelector("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// hero intro animations (works on both pages)
gsap.from(".js-rgbTitle",  { opacity: 0, y: 30, duration: 1.0, ease: "power3.out", delay: 0.1 });
gsap.from(".js-subtitle",{ opacity: 0, y: 18, duration: 0.9, ease: "power3.out", delay: 0.25 });
gsap.from(".js-ctas",   { opacity: 0, y: 12, duration: 0.8, ease: "power3.out", delay: 0.35 });

// scroll reveals
gsap.utils.toArray(".js-reveal").forEach((el) => {
  gsap.from(el, {
    opacity: 0,
    y: 24,
    duration: 0.9,
    ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 85%" }
  });
});

// nav book picker dropdown
(function initBookPicker() {
  const toggle = document.getElementById("bookToggle");
  const menu = document.getElementById("dropMenu");
  const select = document.getElementById("bookSelect");
  if (!toggle || !menu || !select) return;

  toggle.addEventListener("click", function (e) {
    e.stopPropagation();
    menu.classList.toggle("isOpen");
  });

  document.addEventListener("click", function (e) {
    if (!menu.contains(e.target) && e.target !== toggle) {
      menu.classList.remove("isOpen");
    }
  });

  const saved = localStorage.getItem("selectedBook");
  if (saved) {
    select.value = saved;
    const opt = select.options[select.selectedIndex];
    if (opt && opt.value) toggle.textContent = opt.text + " ▾";
  }

  select.addEventListener("change", function () {
    const label = this.options[this.selectedIndex].text;
    localStorage.setItem("selectedBook", this.value);
    toggle.textContent = label + " ▾";
    menu.classList.remove("isOpen");
  });
})();

gsap.utils.toArray(".js-card").forEach((card) => {
  gsap.from(card, {
    opacity: 0,
    y: 22,
    duration: 0.9,
    ease: "power3.out",
    scrollTrigger: { trigger: card, start: "top 90%" }
  });
});
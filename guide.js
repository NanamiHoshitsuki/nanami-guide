function setLang(lang) {
  const selected = lang === "en" ? "en" : "ja";
  document.documentElement.lang = selected;
  document.querySelectorAll("[data-ja][data-en]").forEach((element) => {
    element.innerHTML = element.dataset[selected];
  });
  document.querySelectorAll(".lang-btn").forEach((button) => {
    const isActive = button.dataset.lang === selected;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  localStorage.setItem("nanami-guide-lang", selected);
  localStorage.setItem("na-lang", selected);
}

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("nanami-guide-lang") || localStorage.getItem("na-lang");
  setLang(saved === "en" ? "en" : "ja");
});

import { shortcuts, keyMap } from "./shortcuts-data.js";

document.addEventListener("DOMContentLoaded", () => {
  const mainContent = document.getElementById("mainContent");
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const navigation = document.getElementById("navigation");
  const noResults = document.getElementById("noResults");
  const aiResultsContainer = document.getElementById("aiResultsContainer");
  let currentCategory = "chrome";

  const formatKeys = (keys) => {
    const tokens = keys.split(" ");
    return tokens
      .map((key, idx) => {
        if (key === "+") {
          if (tokens[idx - 1] === "+") {
            return `<span class="kbd">+</span>`;
          }
          return '<span class="mx-1 text-slate-400">+</span>';
        }
        if (key === ",") {
          if (tokens[idx - 1] === "+") {
            return `<span class="kbd">,</span>`;
          }
          return '<span class="mx-1 text-slate-400">,</span>';
        }
        const lowerKey = key.toLowerCase();
        const mapped = keyMap[lowerKey];
        if (mapped) {
          if (typeof mapped === "object") {
            return `<span class="kbd">${mapped[lang] || mapped["es"]}</span>`;
          }
          return `<span class="kbd">${mapped}</span>`;
        }
        if (key === ",")
          return '<span class="mx-1 text-slate-400">, luego</span>';
        return key;
      })
      .join(" ");
  };
  async function fetchAI(query) {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    return res.ok ? res.json() : null;
  }

  function renderAIResults(aiShortcuts, query) {
    aiResultsContainer.innerHTML = "";
    if (aiShortcuts === null)
      return (aiResultsContainer.innerHTML = `<div class="shortcut-card p-6 text-red-600"><h3 class="text-xl font-semibold mb-2">Error</h3><p>No se pudieron obtener los resultados de la IA. Inténtalo más tarde.</p></div>`);
    if (!aiShortcuts.length)
      return (aiResultsContainer.innerHTML = `<div class="shortcut-card p-6"><h3 class="text-xl font-semibold mb-2">Sin resultados de IA</h3><p>La IA no encontró atajos para "${query}"</p></div>`);
    const card = document.createElement("div");
    card.className = "shortcut-card p-6";
    card.innerHTML = `<h3 class="text-xl font-semibold text-slate-800 mb-4">Sugerencias de la IA para: <span class="text-indigo-600">${query}</span></h3>`;
    const list = document.createElement("div");
    list.className = "space-y-4";
    aiShortcuts.forEach((s) => {
      const item = document.createElement("div");
      item.className =
        "flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm";
      item.innerHTML = `<p class="flex-1 mb-1 sm:mb-0 text-slate-600">${
        s.action
      }</p><div class="flex-shrink-0">${formatKeys(s.keys)}</div>`;
      list.appendChild(item);
    });
    card.appendChild(list);
    aiResultsContainer.appendChild(card);
  }

  function renderAll() {
    mainContent.innerHTML = "";
    const filteredShortcuts = getShortcutsByLang();
    const categories = [...new Set(filteredShortcuts.map((s) => s.category))];
    categories.forEach((cat) => {
      const categoryShortcuts = filteredShortcuts.filter(
        (s) => s.category === cat
      );
      const subCategories = [
        ...new Set(categoryShortcuts.map((s) => s.subCategory)),
      ];
      const categorySection = document.createElement("div");
      categorySection.setAttribute("data-category-section", cat);
      categorySection.className = "hidden";
      const gridContainer = document.createElement("div");
      gridContainer.className =
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
      subCategories.forEach((subCat) => {
        const card = document.createElement("div");
        card.className = "shortcut-card p-6";
        card.setAttribute("data-card", "");
        const cardTitle = document.createElement("h3");
        cardTitle.className = "text-xl font-semibold text-slate-800 mb-4";
        cardTitle.textContent = subCat;
        card.appendChild(cardTitle);
        const list = document.createElement("div");
        list.className = "space-y-4";
        categoryShortcuts
          .filter((s) => s.subCategory === subCat)
          .forEach((s) => {
            const item = document.createElement("div");
            item.setAttribute("data-shortcut-item", "");
            item.setAttribute("data-action", s.action.toLowerCase());
            item.setAttribute("data-keys", s.keys.toLowerCase());
            item.className = "flex items-center justify-between text-sm";
            const actionP = document.createElement("p");
            actionP.className = "flex-1 mb-1 sm:mb-0 text-slate-600";
            actionP.textContent = s.action;
            const keysDiv = document.createElement("div");
            keysDiv.className = "flex-shrink-0";
            keysDiv.innerHTML = formatKeys(s.keys);
            item.appendChild(actionP);
            item.appendChild(keysDiv);
            list.appendChild(item);
          });
        card.appendChild(list);
        gridContainer.appendChild(card);
      });
      categorySection.appendChild(gridContainer);
      mainContent.appendChild(categorySection);
    });
  }

  const browserLang = (
    navigator.language ||
    navigator.userLanguage ||
    "es"
  ).slice(0, 2);
  let lang = ["es", "en"].includes(browserLang) ? browserLang : "es";

  function getShortcutsByLang() {
    return shortcuts.filter((s) => !s.lang || s.lang === lang);
  }

  function showCategory(categoryToShow) {
    mainContent.classList.remove("hidden");
    aiResultsContainer.innerHTML = "";
    noResults.classList.add("hidden");
    document.querySelectorAll("[data-category-section]").forEach((section) => {
      section.classList.add("hidden");
    });
    const sectionToShow = document.querySelector(
      `[data-category-section="${categoryToShow}"]`
    );
    if (sectionToShow) {
      sectionToShow.classList.remove("hidden");
      sectionToShow
        .querySelectorAll("[data-shortcut-item]")
        .forEach((item) => item.classList.remove("hidden"));
      sectionToShow
        .querySelectorAll("[data-card]")
        .forEach((card) => card.classList.remove("hidden"));
    }
  }

  function filterLocal() {
    const query = searchInput.value.toLowerCase().trim();
    let totalVisibleItems = 0;
    document.querySelectorAll("[data-category-section]").forEach((section) => {
      section.classList.remove("mt-12");
    });
    document.querySelectorAll("[data-category-section]").forEach((section) => {
      let sectionHasVisibleContent = false;
      section.querySelectorAll("[data-card]").forEach((card) => {
        let cardHasVisibleContent = false;
        card.querySelectorAll("[data-shortcut-item]").forEach((item) => {
          const action = item.dataset.action;
          const keys = item.dataset.keys;
          const isVisible = action.includes(query) || keys.includes(query);
          item.classList.toggle("hidden", !isVisible);
          if (isVisible) {
            cardHasVisibleContent = true;
          }
        });
        card.classList.toggle("hidden", !cardHasVisibleContent);
        if (cardHasVisibleContent) {
          sectionHasVisibleContent = true;
        }
      });
      section.classList.toggle("hidden", !sectionHasVisibleContent);
      if (sectionHasVisibleContent) {
        totalVisibleItems++;
      }
    });
    if (query) {
      const visibleSections = document.querySelectorAll(
        "[data-category-section]:not(.hidden)"
      );
      visibleSections.forEach((section, index) => {
        if (index > 0) {
          section.classList.add("mt-12");
        }
      });
    }
    noResults.classList.toggle("hidden", totalVisibleItems > 0 || query === "");
  }

  navigation.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      currentCategory = e.target.dataset.target;
      document
        .querySelectorAll(".nav-btn")
        .forEach((btn) => btn.classList.remove("active"));
      e.target.classList.add("active");
      searchInput.value = "";
      showCategory(currentCategory);
    }
  });
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    aiResultsContainer.innerHTML = `<div class="flex justify-center items-center h-24"><div class="spinner h-8 w-8 rounded-full border-4 border-slate-200"></div></div>`;
    mainContent.classList.add("hidden");
    noResults.classList.add("hidden");
    const aiShortcuts = await fetchAI(query);
    renderAIResults(aiShortcuts, query);
  });
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    if (query === "") {
      showCategory(currentCategory);
    } else {
      mainContent.classList.remove("hidden");
      aiResultsContainer.innerHTML = "";
      filterLocal();
    }
  });

  renderAll();
  showCategory(currentCategory);
});

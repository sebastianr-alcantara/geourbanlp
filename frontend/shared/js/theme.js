(() => {
    const root = document.documentElement;
    const themeSelect = document.getElementById("select-theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const storageKey = "geourbanlp-theme";

    function applyTheme(preference) {
        const theme = preference === "system"
            ? systemTheme.matches ? "dark" : "light"
            : preference;
        root.setAttribute("data-theme", theme);
        root.setAttribute("data-theme-preference", preference);
        if (themeSelect) {
            themeSelect.value = preference;
        }
    }

    const saved = localStorage.getItem(storageKey);
    applyTheme(["system", "light", "dark"].includes(saved) ? saved : "system");

    if (themeSelect) {
        themeSelect.addEventListener("change", () => {
            localStorage.setItem(storageKey, themeSelect.value);
            applyTheme(themeSelect.value);
        });
    }

    systemTheme.addEventListener("change", () => {
        if (root.getAttribute("data-theme-preference") === "system") {
            applyTheme("system");
        }
    });
})();
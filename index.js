const root = document.documentElement;
const themeSelect = document.getElementById("select-theme");
const loginButton = document.getElementById("btn-ingresar");

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

const THEME_STORAGE_KEY = "geourbanlp-theme";


function getSystemTheme() {
    return systemTheme.matches ? "dark" : "light";
}


function getSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (
        savedTheme === "light" ||
        savedTheme === "dark" ||
        savedTheme === "system"
    ) {
        return savedTheme;
    }

    return "system";
}


function applyTheme(themePreference) {
    const activeTheme =
        themePreference === "system"
            ? getSystemTheme()
            : themePreference;

    root.setAttribute("data-theme", activeTheme);
    root.setAttribute("data-theme-preference", themePreference);

    if (themeSelect) {
        themeSelect.value = themePreference;
    }
}


function saveTheme(themePreference) {
    localStorage.setItem(
        THEME_STORAGE_KEY,
        themePreference
    );
}


if (themeSelect) {
    themeSelect.addEventListener("change", function () {
        const selectedTheme = themeSelect.value;

        saveTheme(selectedTheme);
        applyTheme(selectedTheme);
    });
}


systemTheme.addEventListener("change", function () {
    const currentPreference =
        root.getAttribute("data-theme-preference");

    if (currentPreference === "system") {
        applyTheme("system");
    }
});


if (loginButton) {
    loginButton.addEventListener("click", function () {
        window.location.href = "frontend/modules/modules.html";
    });
}


applyTheme(getSavedTheme());
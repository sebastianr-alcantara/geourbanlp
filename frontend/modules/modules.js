const root = document.documentElement;

const themeSelect = document.getElementById("select-theme");
const btnLogout = document.getElementById("btn-logout");

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

const THEME_STORAGE_KEY = "geourbanlp-theme";


function getSystemTheme() {
    return systemTheme.matches ? "dark" : "light";
}


function getSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (
        savedTheme === "system" ||
        savedTheme === "light" ||
        savedTheme === "dark"
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

    root.setAttribute(
        "data-theme",
        activeTheme
    );

    root.setAttribute(
        "data-theme-preference",
        themePreference
    );

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


function handleThemeChange() {

    if (!themeSelect) {
        return;
    }

    const selectedTheme = themeSelect.value;

    saveTheme(selectedTheme);
    applyTheme(selectedTheme);
}


function handleSystemThemeChange() {

    const currentPreference =
        root.getAttribute("data-theme-preference");

    if (currentPreference === "system") {
        applyTheme("system");
    }
}


function logout() {

    window.location.href = "../../index.html";
}


function initializeModules() {

    const savedTheme = getSavedTheme();

    applyTheme(savedTheme);

    if (themeSelect) {
        themeSelect.addEventListener(
            "change",
            handleThemeChange
        );
    }

    systemTheme.addEventListener(
        "change",
        handleSystemThemeChange
    );

    if (btnLogout) {
        btnLogout.addEventListener(
            "click",
            logout
        );
    }
}


initializeModules();
const demoUserNameKey = "geourbanlp-demo-user-name";
const defaultDemoUserName = "SEBASTIÁN ROMALDO ALCÁNTARA LUYO";
const legacyDemoUserName = "Usuario de ejemplo";
const demoUserNameInput = document.getElementById("demo-user-name");
const demoUserNameForm = document.getElementById("demo-user-name-form");
const demoUserStatus = document.getElementById("demo-user-status");

function setDemoUserStatus(message) {
    if (demoUserStatus) {
        demoUserStatus.textContent = message;
    }
}

function getDemoUserName() {
    try {
        const savedName = localStorage.getItem(demoUserNameKey)?.trim();
        return savedName && savedName !== legacyDemoUserName
            ? savedName
            : defaultDemoUserName;
    } catch (error) {
        setDemoUserStatus(`No se pudo leer el nombre guardado: ${error.message}`);
        return defaultDemoUserName;
    }
}

function renderDemoUserName() {
    const name = getDemoUserName();
    document.querySelectorAll("[data-demo-user-name]").forEach(element => {
        element.textContent = name;
        element.title = name;
    });

    if (demoUserNameInput && document.activeElement !== demoUserNameInput) {
        demoUserNameInput.value = name;
    }
}

if (demoUserNameForm) {
    demoUserNameForm.addEventListener("submit", event => {
        event.preventDefault();
        const name = demoUserNameInput.value.trim();
        if (!name) {
            setDemoUserStatus("Ingresa un nombre para mostrar.");
            return;
        }

        try {
            localStorage.setItem(demoUserNameKey, name);
            renderDemoUserName();
            setDemoUserStatus("El nombre se guardó para este navegador.");
        } catch (error) {
            setDemoUserStatus(`No se pudo guardar el nombre: ${error.message}`);
        }
    });
}

window.addEventListener("storage", event => {
    if (event.key === demoUserNameKey || event.key === null) {
        renderDemoUserName();
    }
});

renderDemoUserName();

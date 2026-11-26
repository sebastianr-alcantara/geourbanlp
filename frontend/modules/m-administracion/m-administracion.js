const root = document.documentElement;
const themeSelect = document.getElementById("select-theme");
const statusElement = document.getElementById("admin-status");
const storageKey = "geourbanlp-admin-prototype-v1";
const roles = ["Desarrollador", "Administrador", "Creador", "Visualizador"];
const modules = [
    {id: "m-habilitacion-urbana", name: "Habilitación Urbana"},
    {id: "m-departamentos", name: "Departamentos"},
    {id: "m-administracion", name: "Administración del Sistema"}
];

function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function seedDate(monthOffset, day) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + monthOffset);
    date.setDate(day);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function createSeedState() {
    return {
        version: 1,
        users: [
            {
                id: "user-developer",
                name: "Desarrollador principal",
                email: "desarrollador@example.local",
                areaId: "area-sistemas",
                plazas: ["plaza-lima"],
                moduleRoles: Object.fromEntries(modules.map(module => [module.id, "Desarrollador"]))
            },
            {
                id: "user-manager",
                name: "Gerencia de ejemplo",
                email: "gerencia@example.local",
                areaId: "area-gerencia",
                plazas: ["plaza-lima", "plaza-arequipa"],
                moduleRoles: Object.fromEntries(modules.map(module => [module.id, "Administrador"]))
            },
            {
                id: "user-creator",
                name: "Creador de ejemplo",
                email: "creador@example.local",
                areaId: "area-inmobiliario",
                plazas: ["plaza-lima"],
                moduleRoles: {
                    "m-habilitacion-urbana": "Creador",
                    "m-departamentos": "Visualizador"
                }
            },
            {
                id: "user-viewer",
                name: "Visualizador de ejemplo",
                email: "visualizador@example.local",
                areaId: "area-arquitectura",
                plazas: ["plaza-arequipa"],
                moduleRoles: {
                    "m-habilitacion-urbana": "Visualizador",
                    "m-departamentos": "Visualizador"
                }
            }
        ],
        areas: [
            {id: "area-sistemas", name: "Sistemas y GIS", modules: modules.map(module => module.id)},
            {id: "area-gerencia", name: "Gerencia", modules: modules.map(module => module.id)},
            {id: "area-inmobiliario", name: "Desarrollo Inmobiliario", modules: ["m-habilitacion-urbana", "m-departamentos"]},
            {id: "area-arquitectura", name: "Desarrollo Arquitectónico", modules: ["m-habilitacion-urbana"]},
            {id: "area-comercial", name: "Comercial", modules: ["m-departamentos"]}
        ],
        plazas: [
            {id: "plaza-lima", name: "Lima"},
            {id: "plaza-arequipa", name: "Arequipa"},
            {id: "plaza-trujillo", name: "Trujillo"}
        ],
        activity: [
            {id: "activity-1", date: seedDate(0, 3), areaId: "area-inmobiliario", userId: "user-creator", count: 8},
            {id: "activity-2", date: seedDate(0, 8), areaId: "area-inmobiliario", userId: "user-creator", count: 5},
            {id: "activity-3", date: seedDate(0, 12), areaId: "area-arquitectura", userId: "user-viewer", count: 3},
            {id: "activity-4", date: seedDate(0, 15), areaId: "area-gerencia", userId: "user-manager", count: 4},
            {id: "activity-5", date: seedDate(-1, 5), areaId: "area-inmobiliario", userId: "user-creator", count: 11},
            {id: "activity-6", date: seedDate(-1, 18), areaId: "area-arquitectura", userId: "user-viewer", count: 6},
            {id: "activity-7", date: seedDate(-2, 9), areaId: "area-gerencia", userId: "user-manager", count: 9}
        ],
        layerStructures: {
            "m-habilitacion-urbana": [
                {id: "group-los-portales", name: "Los Portales", subgroups: [
                    {id: "sub-inmobiliario", name: "Desarrollo Inmobiliario"},
                    {id: "sub-arquitectonico", name: "Desarrollo Arquitectónico"}
                ]},
                {id: "group-info-base", name: "Información Base", subgroups: [
                    {id: "sub-servicios", name: "Servicios WFS/WMS"},
                    {id: "sub-importadas", name: "GeoJSON, KML y KMZ"}
                ]},
                {id: "group-mapa-base", name: "Mapa Base", subgroups: [
                    {id: "sub-openstreetmap", name: "OpenStreetMap"},
                    {id: "sub-google-cesium", name: "Google y Cesium 3D"}
                ]}
            ],
            "m-departamentos": [
                {id: "group-limites", name: "Información Departamental", subgroups: [
                    {id: "sub-limites-departamentos", name: "Límites departamentales"},
                    {id: "sub-indicadores", name: "Indicadores territoriales"}
                ]},
                {id: "group-departamentos-base", name: "Información Base", subgroups: [
                    {id: "sub-servicios-departamentos", name: "Servicios WFS/WMS"}
                ]},
                {id: "group-mapa-departamentos", name: "Mapa Base", subgroups: [
                    {id: "sub-osm-departamentos", name: "OpenStreetMap"}
                ]}
            ],
            "m-administracion": [
                {id: "group-administracion", name: "Administración", subgroups: [
                    {id: "sub-usuarios", name: "Usuarios y roles"},
                    {id: "sub-areas", name: "Áreas y plazas"}
                ]}
            ]
        }
    };
}

function setStatus(message) {
    statusElement.textContent = message;
}

function loadState() {
    try {
        const saved = localStorage.getItem(storageKey);
        if (!saved) {
            return createSeedState();
        }

        const parsed = JSON.parse(saved);
        if (
            parsed.version !== 1 ||
            !Array.isArray(parsed.users) ||
            !Array.isArray(parsed.areas) ||
            !Array.isArray(parsed.plazas) ||
            !Array.isArray(parsed.activity) ||
            !parsed.layerStructures
        ) {
            throw new Error("La estructura guardada no es compatible.");
        }

        return parsed;
    } catch (error) {
        setStatus(`No se pudo leer la configuración guardada: ${error.message}. Se muestran datos de ejemplo.`);
        return createSeedState();
    }
}

let state = loadState();
let activeView = "overview";
let selectedStructureModule = modules[0].id;

function saveState(message = "Cambios guardados en este navegador.") {
    try {
        localStorage.setItem(storageKey, JSON.stringify(state));
        setStatus(message);
    } catch (error) {
        setStatus(`No se pudieron guardar los cambios localmente: ${error.message}`);
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function monthForDate(date) {
    return date.slice(0, 7);
}

function formatMonth(month) {
    if (!month) {
        return "—";
    }
    return new Intl.DateTimeFormat("es-PE", {
        month: "long",
        year: "numeric"
    }).format(new Date(`${month}-01T12:00:00`));
}

function getThemePreference() {
    const saved = localStorage.getItem("geourbanlp-theme");
    return ["system", "light", "dark"].includes(saved) ? saved : "system";
}

function applyTheme(preference) {
    const theme = preference === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        : preference;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-theme-preference", preference);
    themeSelect.value = preference;
}

themeSelect.addEventListener("change", () => {
    localStorage.setItem("geourbanlp-theme", themeSelect.value);
    applyTheme(themeSelect.value);
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (root.getAttribute("data-theme-preference") === "system") {
        applyTheme("system");
    }
});

function navigateTo(view) {
    activeView = view;
    document.querySelectorAll(".admin-view").forEach(section => {
        section.hidden = section.id !== `view-${view}`;
    });
    document.querySelectorAll(".nav-item").forEach(button => {
        const active = button.dataset.view === view;
        button.classList.toggle("active", active);
        if (active) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });
}

document.querySelectorAll(".nav-item, [data-open-view]").forEach(button => {
    button.addEventListener("click", () => navigateTo(button.dataset.view || button.dataset.openView));
});

function getAreaName(areaId) {
    return state.areas.find(area => area.id === areaId)?.name || "Área eliminada";
}

function getUserName(userId) {
    return state.users.find(user => user.id === userId)?.name || "Usuario eliminado";
}

function getOptions(items, selected, placeholder = null) {
    const emptyOption = placeholder
        ? `<option value="">${escapeHtml(placeholder)}</option>`
        : "";
    return emptyOption + items.map(item =>
        `<option value="${escapeHtml(item.id)}"${item.id === selected ? " selected" : ""}>${escapeHtml(item.name)}</option>`
    ).join("");
}

function renderOverview() {
    const nowMonth = currentMonth();
    const createdThisMonth = state.activity
        .filter(item => monthForDate(item.date) === nowMonth)
        .reduce((total, item) => total + item.count, 0);

    document.getElementById("metric-users").textContent = state.users.length;
    document.getElementById("metric-areas").textContent = state.areas.length;
    document.getElementById("metric-plazas").textContent = state.plazas.length;
    document.getElementById("metric-activity").textContent = createdThisMonth;
}

function renderUsers() {
    const userList = document.getElementById("user-list");
    const areaSelect = document.getElementById("new-user-area");
    areaSelect.innerHTML = getOptions(state.areas, state.areas[0]?.id);

    if (state.users.length === 0) {
        userList.innerHTML = '<div class="content-card empty-state">Aún no hay usuarios. Agrega un perfil de ejemplo para comenzar.</div>';
        return;
    }

    userList.innerHTML = state.users.map(user => {
        const area = state.areas.find(item => item.id === user.areaId);
        const plazaChecks = state.plazas.length
            ? state.plazas.map(plaza => `
                <label class="check-option">
                    <input type="checkbox" data-user-plaza="${escapeHtml(user.id)}" value="${escapeHtml(plaza.id)}"${user.plazas.includes(plaza.id) ? " checked" : ""}>
                    <span>${escapeHtml(plaza.name)}</span>
                </label>`).join("")
            : '<span class="field-hint">Agrega una plaza en Áreas y plazas.</span>';
        const roleControls = modules.map(module => {
            const role = user.moduleRoles[module.id] || "";
            const areaAllowsModule = area?.modules.includes(module.id) || false;
            const roleOptions = `<option value="">Sin acceso</option>` + roles.map(item =>
                `<option value="${escapeHtml(item)}"${role === item ? " selected" : ""}>${escapeHtml(item)}</option>`
            ).join("");
            return `
                <label class="role-assignment">
                    <span>${escapeHtml(module.name)}</span>
                    <select data-user-role="${escapeHtml(user.id)}" data-module="${escapeHtml(module.id)}">${roleOptions}</select>
                    <small class="${areaAllowsModule ? "scope-on" : "scope-off"}">${areaAllowsModule ? "Habilitado por el área" : "Bloqueado por el área"}</small>
                </label>`;
        }).join("");

        return `
            <article class="user-card">
                <div class="user-card-header">
                    <div class="user-identity">
                        <strong>${escapeHtml(user.name)}</strong>
                        <span>${escapeHtml(user.email)}</span>
                    </div>
                    <button class="remove-button" type="button" data-remove-user="${escapeHtml(user.id)}" aria-label="Quitar ${escapeHtml(user.name)}" title="Quitar usuario">
                        <span class="material-icons" aria-hidden="true">delete_outline</span>
                    </button>
                </div>
                <div class="user-card-controls">
                    <label class="field-label">Área asignada
                        <select data-user-area="${escapeHtml(user.id)}">${getOptions(state.areas, user.areaId, "Sin área")}</select>
                    </label>
                    <div class="field-label">Plazas autorizadas
                        <div class="plaza-assignment">${plazaChecks}</div>
                    </div>
                </div>
                <div class="role-grid">${roleControls}</div>
            </article>`;
    }).join("");
}

function renderAreas() {
    const areaList = document.getElementById("area-list");
    if (state.areas.length === 0) {
        areaList.innerHTML = '<div class="content-card empty-state">Crea un área para asignar permisos.</div>';
        return;
    }

    areaList.innerHTML = state.areas.map(area => `
        <article class="area-card">
            <div class="area-card-header">
                <div><strong>${escapeHtml(area.name)}</strong><p>${state.users.filter(user => user.areaId === area.id).length} usuario(s) asignado(s)</p></div>
            </div>
            <div class="module-permission-grid">
                ${modules.map(module => `
                    <label class="module-permission">
                        <input type="checkbox" data-area-module="${escapeHtml(area.id)}" value="${escapeHtml(module.id)}"${area.modules.includes(module.id) ? " checked" : ""}>
                        <span>${escapeHtml(module.name)}</span>
                    </label>`).join("")}
            </div>
        </article>`).join("");

    const plazaList = document.getElementById("plaza-list");
    plazaList.innerHTML = state.plazas.length
        ? state.plazas.map(plaza => `
            <span class="plaza-chip">${escapeHtml(plaza.name)}
                <button class="remove-button" type="button" data-remove-plaza="${escapeHtml(plaza.id)}" aria-label="Quitar plaza ${escapeHtml(plaza.name)}" title="Quitar plaza">×</button>
            </span>`).join("")
        : '<span class="field-hint">No hay plazas. Agrega una ubicación de trabajo.</span>';
}

function getActivityRows() {
    const month = document.getElementById("activity-month").value || currentMonth();
    const areaId = document.getElementById("activity-area").value || "all";
    const userId = document.getElementById("activity-person").value || "all";
    const groups = new Map();

    state.activity
        .filter(item =>
            monthForDate(item.date) === month &&
            (areaId === "all" || item.areaId === areaId) &&
            (userId === "all" || item.userId === userId)
        )
        .forEach(item => {
            const key = `${item.areaId}|${item.userId}`;
            const current = groups.get(key) || {
                month,
                areaId: item.areaId,
                userId: item.userId,
                count: 0
            };
            current.count += item.count;
            groups.set(key, current);
        });

    return [...groups.values()].sort((first, second) =>
        getAreaName(first.areaId).localeCompare(getAreaName(second.areaId)) ||
        getUserName(first.userId).localeCompare(getUserName(second.userId))
    );
}

function renderActivity() {
    const monthInput = document.getElementById("activity-month");
    const areaSelect = document.getElementById("activity-area");
    const personSelect = document.getElementById("activity-person");
    const previousArea = areaSelect.value || "all";
    const previousPerson = personSelect.value || "all";
    if (!monthInput.value) {
        monthInput.value = currentMonth();
    }

    areaSelect.innerHTML = '<option value="all">Todas las áreas</option>' +
        state.areas.map(area =>
            `<option value="${escapeHtml(area.id)}">${escapeHtml(area.name)}</option>`
        ).join("");
    personSelect.innerHTML = '<option value="all">Todas las personas</option>' +
        state.users.map(user =>
            `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)}</option>`
        ).join("");
    areaSelect.value = state.areas.some(area => area.id === previousArea) ? previousArea : "all";
    personSelect.value = state.users.some(user => user.id === previousPerson) ? previousPerson : "all";

    const rows = getActivityRows();
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    document.getElementById("activity-total").textContent = total;
    document.getElementById("activity-people").textContent = new Set(rows.map(row => row.userId)).size;
    document.getElementById("activity-areas").textContent = new Set(rows.map(row => row.areaId)).size;
    document.getElementById("activity-table-body").innerHTML = rows.map(row => `
        <tr>
            <td>${escapeHtml(formatMonth(row.month))}</td>
            <td>${escapeHtml(getAreaName(row.areaId))}</td>
            <td>${escapeHtml(getUserName(row.userId))}</td>
            <td>${row.count}</td>
        </tr>`).join("");
    document.getElementById("activity-empty").hidden = rows.length > 0;
}

function renderLayerStructure() {
    const moduleSelect = document.getElementById("structure-module");
    moduleSelect.innerHTML = getOptions(modules, selectedStructureModule);
    moduleSelect.value = selectedStructureModule;

    const groups = state.layerStructures[selectedStructureModule] || [];
    const structureList = document.getElementById("layer-structure-list");
    if (groups.length === 0) {
        structureList.innerHTML = '<div class="content-card empty-state">Este módulo todavía no tiene grupos. Puedes crear uno arriba.</div>';
        return;
    }

    structureList.innerHTML = groups.map(group => `
        <article class="structure-card">
            <div class="structure-card-header">
                <strong>${escapeHtml(group.name)}</strong>
                <button class="remove-button" type="button" data-remove-group="${escapeHtml(group.id)}" aria-label="Quitar grupo ${escapeHtml(group.name)}" title="Quitar grupo">
                    <span class="material-icons" aria-hidden="true">delete_outline</span>
                </button>
            </div>
            <div class="structure-group-list">
                ${group.subgroups.map(subgroup => `
                    <div class="structure-subgroup">
                        <span>${escapeHtml(subgroup.name)}</span>
                        <button class="remove-button" type="button" data-remove-subgroup="${escapeHtml(group.id)}" data-subgroup="${escapeHtml(subgroup.id)}" aria-label="Quitar subgrupo ${escapeHtml(subgroup.name)}" title="Quitar subgrupo">×</button>
                    </div>`).join("")}
            </div>
            <form class="subgroup-form" data-add-subgroup="${escapeHtml(group.id)}">
                <input name="name" type="text" required maxlength="80" aria-label="Nuevo subgrupo para ${escapeHtml(group.name)}" placeholder="Nombre del subgrupo">
                <button class="button button-secondary" type="submit"><span class="material-icons" aria-hidden="true">add</span>Agregar subgrupo</button>
            </form>
        </article>`).join("");
}

function renderAll() {
    renderOverview();
    renderUsers();
    renderAreas();
    renderActivity();
    renderLayerStructure();
}

document.getElementById("user-form").addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name")).trim();
    const email = String(formData.get("email")).trim();
    const areaId = String(formData.get("areaId"));
    if (!name || !email || !state.areas.some(area => area.id === areaId)) {
        setStatus("Ingresa nombre, correo de ejemplo y área válida.");
        return;
    }

    state.users.push({
        id: createId("user"),
        name,
        email,
        areaId,
        plazas: [],
        moduleRoles: {}
    });
    event.currentTarget.reset();
    saveState(`Se agregó el perfil local de ${name}. Asigna sus módulos y plazas.`);
    renderAll();
});

document.getElementById("area-form").addEventListener("submit", event => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name")).trim();
    if (!name) {
        setStatus("Escribe un nombre de área.");
        return;
    }
    if (state.areas.some(area => area.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        setStatus("Ya existe un área con ese nombre.");
        return;
    }
    state.areas.push({id: createId("area"), name, modules: []});
    event.currentTarget.reset();
    saveState(`Se agregó el área "${name}".`);
    renderAll();
});

document.getElementById("plaza-form").addEventListener("submit", event => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name")).trim();
    if (!name) {
        setStatus("Escribe el nombre de la plaza.");
        return;
    }
    if (state.plazas.some(plaza => plaza.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        setStatus("Ya existe una plaza con ese nombre.");
        return;
    }
    state.plazas.push({id: createId("plaza"), name});
    event.currentTarget.reset();
    saveState(`Se agregó la plaza "${name}".`);
    renderAll();
});

document.getElementById("user-list").addEventListener("change", event => {
    const target = event.target;
    if (target.matches("[data-user-area]")) {
        const user = state.users.find(item => item.id === target.dataset.userArea);
        if (user) {
            user.areaId = target.value;
            saveState(`Se actualizó el área de ${user.name}.`);
        }
    } else if (target.matches("[data-user-role]")) {
        const user = state.users.find(item => item.id === target.dataset.userRole);
        if (user) {
            if (target.value) {
                user.moduleRoles[target.dataset.module] = target.value;
            } else {
                delete user.moduleRoles[target.dataset.module];
            }
            saveState(`Se actualizó el rol de ${user.name} para ${modules.find(module => module.id === target.dataset.module)?.name || "el módulo"}.`);
        }
    } else if (target.matches("[data-user-plaza]")) {
        const user = state.users.find(item => item.id === target.dataset.userPlaza);
        if (user) {
            const plazaId = target.value;
            user.plazas = target.checked
                ? [...new Set([...user.plazas, plazaId])]
                : user.plazas.filter(id => id !== plazaId);
            saveState(`Se actualizaron las plazas autorizadas de ${user.name}.`);
        }
    }
    renderUsers();
    renderOverview();
});

document.getElementById("user-list").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-user]");
    if (!button) {
        return;
    }
    const user = state.users.find(item => item.id === button.dataset.removeUser);
    if (!user || !window.confirm(`¿Quitar el usuario de ejemplo "${user.name}"?`)) {
        return;
    }
    state.users = state.users.filter(item => item.id !== user.id);
    saveState(`Se quitó el perfil de ejemplo "${user.name}".`);
    renderAll();
});

document.getElementById("area-list").addEventListener("change", event => {
    const target = event.target;
    if (!target.matches("[data-area-module]")) {
        return;
    }
    const area = state.areas.find(item => item.id === target.dataset.areaModule);
    if (!area) {
        return;
    }
    area.modules = target.checked
        ? [...new Set([...area.modules, target.value])]
        : area.modules.filter(moduleId => moduleId !== target.value);
    saveState(`Se actualizaron los módulos habilitados para ${area.name}.`);
    renderAreas();
    renderUsers();
});

document.getElementById("plaza-list").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-plaza]");
    if (!button) {
        return;
    }
    const plaza = state.plazas.find(item => item.id === button.dataset.removePlaza);
    if (!plaza || !window.confirm(`¿Quitar la plaza "${plaza.name}" y sus asignaciones de ejemplo?`)) {
        return;
    }
    state.plazas = state.plazas.filter(item => item.id !== plaza.id);
    state.users.forEach(user => {
        user.plazas = user.plazas.filter(id => id !== plaza.id);
    });
    saveState(`Se quitó la plaza "${plaza.name}".`);
    renderAll();
});

document.getElementById("activity-month").addEventListener("change", renderActivity);
document.getElementById("activity-area").addEventListener("change", renderActivity);
document.getElementById("activity-person").addEventListener("change", renderActivity);

document.getElementById("btn-export-activity").addEventListener("click", () => {
    const rows = getActivityRows();
    const cells = [
        ["Mes", "Área", "Persona", "Registros creados"],
        ...rows.map(row => [
            row.month,
            getAreaName(row.areaId),
            getUserName(row.userId),
            row.count
        ])
    ];
    const csv = cells.map(row =>
        row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
    ).join("\r\n");
    const file = new Blob(["\uFEFF", csv], {type: "text/csv;charset=utf-8"});
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `actividad-${document.getElementById("activity-month").value || currentMonth()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Se descargó el resumen filtrado en CSV.");
});

document.getElementById("structure-module").addEventListener("change", event => {
    selectedStructureModule = event.target.value;
    renderLayerStructure();
});

document.getElementById("layer-group-form").addEventListener("submit", event => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name")).trim();
    if (!name) {
        setStatus("Escribe el nombre del grupo de capas.");
        return;
    }
    const groups = state.layerStructures[selectedStructureModule] ||= [];
    groups.push({id: createId("group"), name, subgroups: []});
    event.currentTarget.reset();
    saveState(`Se agregó el grupo "${name}".`);
    renderLayerStructure();
});

document.getElementById("layer-structure-list").addEventListener("submit", event => {
    const form = event.target.closest("[data-add-subgroup]");
    if (!form) {
        return;
    }
    event.preventDefault();
    const name = String(new FormData(form).get("name")).trim();
    if (!name) {
        setStatus("Escribe el nombre del subgrupo.");
        return;
    }
    const group = (state.layerStructures[selectedStructureModule] || [])
        .find(item => item.id === form.dataset.addSubgroup);
    if (!group) {
        setStatus("No se encontró el grupo seleccionado.");
        return;
    }
    group.subgroups.push({id: createId("subgroup"), name});
    saveState(`Se agregó el subgrupo "${name}".`);
    renderLayerStructure();
});

document.getElementById("layer-structure-list").addEventListener("click", event => {
    const removeGroup = event.target.closest("[data-remove-group]");
    if (removeGroup) {
        const groups = state.layerStructures[selectedStructureModule] || [];
        state.layerStructures[selectedStructureModule] =
            groups.filter(group => group.id !== removeGroup.dataset.removeGroup);
        saveState("Se quitó el grupo y sus subgrupos.");
        renderLayerStructure();
        return;
    }

    const removeSubgroup = event.target.closest("[data-remove-subgroup]");
    if (removeSubgroup) {
        const group = (state.layerStructures[selectedStructureModule] || [])
            .find(item => item.id === removeSubgroup.dataset.removeSubgroup);
        if (group) {
            group.subgroups = group.subgroups.filter(item =>
                item.id !== removeSubgroup.dataset.subgroup
            );
            saveState("Se quitó el subgrupo.");
            renderLayerStructure();
        }
    }
});

document.getElementById("btn-reset-demo").addEventListener("click", () => {
    if (!window.confirm("Se reemplazarán los cambios guardados localmente por los datos iniciales de ejemplo. ¿Continuar?")) {
        return;
    }
    state = createSeedState();
    saveState("Se restauraron los datos de demostración.");
    renderAll();
});

applyTheme(getThemePreference());
renderAll();
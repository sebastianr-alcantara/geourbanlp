const statusElement = document.getElementById("admin-status");
const storageKey = "geourbanlp-admin-prototype-v1";
const roles = ["Desarrollador", "Administrador", "Creador", "Visualizador"];
const systemStates = ["Habilitado", "Deshabilitado"];
const modules = [
    {id: "m-habilitacion-urbana", name: "Habilitación Urbana"},
    {id: "m-departamentos", name: "Departamentos"},
    {id: "m-administracion", name: "Administración del Sistema"}
];
const moduleRoleFields = {
    "m-habilitacion-urbana": "rol_habilitacion_urbana",
    "m-departamentos": "rol_departamentos",
    "m-administracion": "rol_administracion"
};
const defaultLayersByGroup = {
    "sub-inmobiliario": ["Terrenos de interés", "Prospección", "Terrenos comprados"],
    "sub-arquitectonico": ["Zonificación", "Sistema vial", "Afectaciones"],
    "sub-importadas": ["Datos de habilitación urbana"],
    "sub-openstreetmap": ["OpenStreetMap"],
    "sub-google-cesium": ["Google Maps", "Google Híbrido", "Mapa 3D (Cesium)"],
    "sub-limites-departamentos": ["Límites departamentales"],
    "sub-indicadores": ["Indicadores territoriales"],
    "sub-usuarios": ["Usuarios y roles"],
    "sub-areas": ["Áreas y plazas"]
};

function createDefaultLayers(groupId) {
    return (defaultLayersByGroup[groupId] || []).map((name, index) => ({
        id: `${groupId}-layer-${index + 1}`,
        name
    }));
}

function parseWfsGetFeatureUrl(value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        return null;
    }

    const service = url.searchParams.get("service");
    const request = url.searchParams.get("request");
    const layerName = url.searchParams.get("typeName") ||
        url.searchParams.get("typeNames");

    if (
        !["http:", "https:"].includes(url.protocol) ||
        !service ||
        service.toUpperCase() !== "WFS" ||
        !request ||
        request.toLowerCase() !== "getfeature" ||
        !layerName
    ) {
        return null;
    }

    return url;
}

function createStructureGroup(id, name) {
    return {id, name, subgroups: [], layers: createDefaultLayers(id)};
}

function normalizeStructureGroup(group, isRoot = false) {
    if (!group || typeof group.id !== "string" || typeof group.name !== "string") {
        throw new Error("Se encontró un grupo sin identificador o nombre válido.");
    }
    if (!Array.isArray(group.subgroups)) {
        group.subgroups = [];
    }
    if (!Array.isArray(group.layers)) {
        group.layers = isRoot ? [] : createDefaultLayers(group.id);
    }
    if (group.layers.some(layer =>
        !layer ||
        typeof layer.id !== "string" ||
        typeof layer.name !== "string" ||
        (layer.type !== undefined && layer.type !== "WFS") ||
        (layer.type === "WFS" && (
            typeof layer.serviceUrl !== "string" ||
            !parseWfsGetFeatureUrl(layer.serviceUrl)
        ))
    )) {
        throw new Error(`El grupo "${group.name}" contiene una capa inválida.`);
    }

    if (group.id === "sub-importadas") {
        group.layers.forEach(layer => {
            if (layer.id === "sub-importadas-layer-1" &&
                layer.name === "Datos demostrativos de habilitación urbana" &&
                layer.type === undefined) {
                layer.name = "Datos de habilitación urbana";
            }
        });
    }

    group.subgroups.forEach(subgroup => normalizeStructureGroup(subgroup));
}

function normalizeLayerStructures(layerStructures) {
    if (!layerStructures || typeof layerStructures !== "object" || Array.isArray(layerStructures)) {
        throw new Error("La estructura de capas guardada no tiene un formato válido.");
    }

    Object.values(layerStructures).forEach(groups => {
        if (!Array.isArray(groups)) {
            throw new Error("La lista de grupos guardada no tiene un formato válido.");
        }

        groups.forEach(group => normalizeStructureGroup(group, true));
    });

    return layerStructures;
}

function findStructureGroup(groups, groupId) {
    for (const group of groups) {
        if (group.id === groupId) {
            return group;
        }
        const nestedGroup = findStructureGroup(group.subgroups || [], groupId);
        if (nestedGroup) {
            return nestedGroup;
        }
    }
    return null;
}

function removeStructureGroup(groups, groupId) {
    const index = groups.findIndex(group => group.id === groupId);
    if (index >= 0) {
        groups.splice(index, 1);
        return true;
    }
    return groups.some(group =>
        removeStructureGroup(group.subgroups || [], groupId)
    );
}

function getStructureGroupSiblings(parentId) {
    if (!parentId) {
        return state.layerStructures[selectedStructureModule] || [];
    }
    const parentGroup = findStructureGroup(
        state.layerStructures[selectedStructureModule] || [],
        parentId
    );
    return parentGroup ? parentGroup.subgroups : null;
}

function moveStructureItem(items, itemId, targetId, insertAfter) {
    const sourceIndex = items.findIndex(item => item.id === itemId);
    if (sourceIndex < 0 || targetId === itemId) {
        return false;
    }

    const [item] = items.splice(sourceIndex, 1);
    const targetIndex = targetId
        ? items.findIndex(target => target.id === targetId)
        : items.length;
    const insertionIndex = targetIndex < 0
        ? items.length
        : targetIndex + (insertAfter ? 1 : 0);
    if (insertionIndex === sourceIndex) {
        items.splice(sourceIndex, 0, item);
        return false;
    }

    items.splice(insertionIndex, 0, item);
    return true;
}

function getStructureDropTarget(event, draggedItem) {
    if (draggedItem.type === "group") {
        const targetGroup = event.target.closest("[data-structure-group]");
        if (targetGroup &&
            targetGroup.dataset.structureGroup !== draggedItem.id &&
            targetGroup.dataset.parentGroup === draggedItem.parentId
        ) {
            const rect = targetGroup.getBoundingClientRect();
            return {
                element: targetGroup,
                id: targetGroup.dataset.structureGroup,
                insertAfter: event.clientY > rect.top + rect.height / 2
            };
        }

        const groupList = event.target.closest("[data-group-list-parent]");
        if (groupList &&
            groupList.dataset.groupListParent === draggedItem.parentId
        ) {
            return {element: groupList, id: null, insertAfter: false};
        }
        return null;
    }

    const targetLayer = event.target.closest("[data-structure-layer]");
    if (targetLayer &&
        targetLayer.dataset.structureLayer !== draggedItem.id &&
        targetLayer.dataset.parentGroup === draggedItem.parentId
    ) {
        const rect = targetLayer.getBoundingClientRect();
        return {
            element: targetLayer,
            id: targetLayer.dataset.structureLayer,
            insertAfter: event.clientY > rect.top + rect.height / 2
        };
    }

    const layerList = event.target.closest("[data-layer-list-parent]");
    if (layerList &&
        layerList.dataset.layerListParent === draggedItem.parentId
    ) {
        return {element: layerList, id: null, insertAfter: false};
    }
    return null;
}

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

function validateSystemTable(records, tableName) {
    if (!Array.isArray(records)) {
        throw new Error(`La tabla "${tableName}" debe ser una lista.`);
    }

    const ids = new Set();
    const codes = new Set();
    records.forEach(record => {
        if (
            !record ||
            !Number.isInteger(record.id) ||
            record.id < 1 ||
            typeof record.codigo !== "string" ||
            !record.codigo.trim() ||
            !systemStates.includes(record.estado_sistema)
        ) {
            throw new Error(`La tabla "${tableName}" contiene un id, código o estado inválido.`);
        }
        if (ids.has(record.id)) {
            throw new Error(`El id "${record.id}" está duplicado en "${tableName}".`);
        }
        if (codes.has(record.codigo)) {
            throw new Error(`El código "${record.codigo}" está duplicado en "${tableName}".`);
        }
        ids.add(record.id);
        codes.add(record.codigo);
    });

    return {ids, codes};
}

function validateSeedData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("El archivo debe contener un objeto de tablas.");
    }

    const plazaIds = validateSystemTable(data.plaza_hu, "plaza_hu").ids;
    const frontIds = validateSystemTable(data.frente_hu, "frente_hu").ids;
    validateSystemTable(data.relacion_frentehu_usuario, "relacion_frentehu_usuario");
    const userIds = validateSystemTable(data.usuarios, "usuarios").ids;

    data.plaza_hu.forEach(plaza => {
        if (typeof plaza.nombre !== "string" || !plaza.nombre.trim()) {
            throw new Error(`La plaza "${plaza.codigo}" no tiene un nombre válido.`);
        }
    });

    data.frente_hu.forEach(front => {
        if (
            typeof front.nombre !== "string" ||
            !front.nombre.trim() ||
            !Number.isInteger(front.id_plaza_hu) ||
            !plazaIds.has(front.id_plaza_hu)
        ) {
            throw new Error(`El frente "${front.codigo}" no tiene una plaza válida.`);
        }
    });

    data.usuarios.forEach(user => {
        if (
            typeof user.nombre !== "string" ||
            !user.nombre.trim() ||
            typeof user.correo !== "string" ||
            !user.correo.trim() ||
            typeof user.areaId !== "string" ||
            Object.values(moduleRoleFields).some(field =>
                !Object.prototype.hasOwnProperty.call(user, field) ||
                (user[field] !== null && !roles.includes(user[field]))
            )
        ) {
            throw new Error(`El usuario "${user.codigo}" contiene campos inválidos.`);
        }
    });

    const activeAssignments = new Set();
    data.relacion_frentehu_usuario.forEach(assignment => {
        if (
            !Number.isInteger(assignment.id_frente_hu) ||
            !frontIds.has(assignment.id_frente_hu) ||
            !Number.isInteger(assignment.id_usuario) ||
            !userIds.has(assignment.id_usuario)
        ) {
            throw new Error(`La relación "${assignment.codigo}" referencia un id inexistente.`);
        }
        if (assignment.estado_sistema === "Habilitado") {
            const key = JSON.stringify([assignment.id_frente_hu, assignment.id_usuario]);
            if (activeAssignments.has(key)) {
                throw new Error(`La relación activa "${key}" está duplicada.`);
            }
            activeAssignments.add(key);
        }
    });

    return {
        plaza_hu: data.plaza_hu.map(plaza => ({...plaza})),
        frente_hu: data.frente_hu.map(front => ({...front})),
        relacion_frentehu_usuario: data.relacion_frentehu_usuario.map(assignment => ({...assignment})),
        usuarios: data.usuarios.map(user => ({...user}))
    };
}

async function loadSeedData() {
    const response = await fetch("../../../backend/data/data.json", {cache: "no-store"});
    if (!response.ok) {
        throw new Error(`La solicitud falló con el estado ${response.status}.`);
    }

    return validateSeedData(await response.json());
}

function createSeedState(seedData) {
    const plazaCodesById = new Map(seedData.plaza_hu.map(plaza => [plaza.id, plaza.codigo]));
    const frontCodesById = new Map(seedData.frente_hu.map(front => [front.id, front.codigo]));
    const userCodesById = new Map(seedData.usuarios.map(user => [user.id, user.codigo]));

    return {
        version: 2,
        users: seedData.usuarios.map(user => ({
            id: user.codigo,
            name: user.nombre,
            email: user.correo,
            areaId: user.areaId,
            moduleRoles: Object.fromEntries(Object.entries(moduleRoleFields)
                .filter(([, field]) => user[field] !== null)
                .map(([moduleId, field]) => [moduleId, user[field]])),
            estado_sistema: user.estado_sistema
        })),
        plazas: seedData.plaza_hu.map(plaza => ({
            id: plaza.codigo,
            name: plaza.nombre,
            estado_sistema: plaza.estado_sistema
        })),
        frentes: seedData.frente_hu.map(front => ({
            id: front.codigo,
            plazaId: plazaCodesById.get(front.id_plaza_hu),
            name: front.nombre,
            estado_sistema: front.estado_sistema
        })),
        relacionFrenteHuUsuario: seedData.relacion_frentehu_usuario.map(assignment => ({
            id: assignment.codigo,
            frenteId: frontCodesById.get(assignment.id_frente_hu),
            userId: userCodesById.get(assignment.id_usuario),
            estado_sistema: assignment.estado_sistema
        })),
        areas: [
            {id: "area-sistemas", name: "Sistemas y GIS", modules: modules.map(module => module.id)},
            {id: "area-gerencia", name: "Gerencia", modules: modules.map(module => module.id)},
            {id: "area-inmobiliario", name: "Desarrollo Inmobiliario", modules: ["m-habilitacion-urbana", "m-departamentos"]},
            {id: "area-arquitectura", name: "Desarrollo Arquitectónico", modules: ["m-habilitacion-urbana"]},
            {id: "area-comercial", name: "Comercial", modules: ["m-departamentos"]}
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
                {id: "group-los-portales", name: "Los Portales", layers: [], subgroups: [
                    createStructureGroup("sub-inmobiliario", "Desarrollo Inmobiliario"),
                    createStructureGroup("sub-arquitectonico", "Desarrollo Arquitectónico")
                ]},
                {id: "group-info-base", name: "Información Base", layers: [], subgroups: [
                    createStructureGroup("sub-servicios", "Servicios WFS/WMS"),
                    createStructureGroup("sub-importadas", "GeoJSON, KML y KMZ")
                ]},
                {id: "group-mapa-base", name: "Mapa Base", layers: [], subgroups: [
                    createStructureGroup("sub-openstreetmap", "OpenStreetMap"),
                    createStructureGroup("sub-google-cesium", "Google y Cesium 3D")
                ]}
            ],
            "m-departamentos": [
                {id: "group-limites", name: "Información Departamental", layers: [], subgroups: [
                    createStructureGroup("sub-limites-departamentos", "Límites departamentales"),
                    createStructureGroup("sub-indicadores", "Indicadores territoriales")
                ]},
                {id: "group-departamentos-base", name: "Información Base", layers: [], subgroups: [
                    createStructureGroup("sub-servicios-departamentos", "Servicios WFS/WMS")
                ]},
                {id: "group-mapa-departamentos", name: "Mapa Base", layers: [], subgroups: [
                    createStructureGroup("sub-osm-departamentos", "OpenStreetMap")
                ]}
            ],
            "m-administracion": [
                {id: "group-administracion", name: "Administración", layers: [], subgroups: [
                    createStructureGroup("sub-usuarios", "Usuarios y roles"),
                    createStructureGroup("sub-areas", "Áreas y plazas")
                ]}
            ]
        }
    };
}

function migrateLegacyState(parsed, seedData) {
    const seedPlazaById = new Map(seedData.plaza_hu.map(plaza => [plaza.codigo, plaza]));
    const seedPlazaCodesById = new Map(seedData.plaza_hu.map(plaza => [plaza.id, plaza.codigo]));
    const plazas = parsed.plazas.map(plaza => ({
        ...plaza,
        estado_sistema: plaza.estado_sistema || seedPlazaById.get(plaza.id)?.estado_sistema || "Habilitado"
    }));
    const plazaIds = new Set(plazas.map(plaza => plaza.id));

    seedData.plaza_hu.forEach(plaza => {
        if (!plazaIds.has(plaza.codigo)) {
            plazas.push({
                id: plaza.codigo,
                name: plaza.nombre,
                estado_sistema: plaza.estado_sistema
            });
            plazaIds.add(plaza.codigo);
        }
    });

    const frentes = seedData.frente_hu
        .filter(front => plazaIds.has(seedPlazaCodesById.get(front.id_plaza_hu)))
        .map(front => ({
            id: front.codigo,
            plazaId: seedPlazaCodesById.get(front.id_plaza_hu),
            name: front.nombre,
            estado_sistema: front.estado_sistema
        }));
    const frontsByPlaza = new Map();
    frentes.forEach(front => {
        const fronts = frontsByPlaza.get(front.plazaId) || [];
        fronts.push(front);
        frontsByPlaza.set(front.plazaId, fronts);
    });

    plazas.forEach(plaza => {
        if (!frontsByPlaza.has(plaza.id)) {
            const front = {
                id: `frente-migrado-${plaza.id}`,
                plazaId: plaza.id,
                name: `${plaza.name} - Frente 1`,
                estado_sistema: "Habilitado"
            };
            frentes.push(front);
            frontsByPlaza.set(plaza.id, [front]);
        }
    });

    const seedUserById = new Map(seedData.usuarios.map(user => [user.codigo, user]));
    const users = parsed.users.map(user => {
        const seedUser = seedUserById.get(user.id);
        const savedUser = {...user};
        delete savedUser.plazas;
        return {
            ...savedUser,
            estado_sistema: user.estado_sistema || seedUser?.estado_sistema || "Habilitado"
        };
    });
    const relacionFrenteHuUsuario = [];
    parsed.users.forEach(user => {
        (Array.isArray(user.plazas) ? user.plazas : []).forEach(plazaId => {
            (frontsByPlaza.get(plazaId) || []).forEach(front => {
                relacionFrenteHuUsuario.push({
                    id: createId("relacion"),
                    frenteId: front.id,
                    userId: user.id,
                    estado_sistema: "Habilitado"
                });
            });
        });
    });

    return {
        ...parsed,
        version: 2,
        users,
        plazas,
        frentes,
        relacionFrenteHuUsuario
    };
}

function validateStoredRelations(savedState) {
    const plazaIds = new Set(savedState.plazas.map(plaza => plaza.id));
    const frontIds = new Set(savedState.frentes.map(front => front.id));
    const userIds = new Set(savedState.users.map(user => user.id));
    const records = [
        ...savedState.plazas,
        ...savedState.frentes,
        ...savedState.relacionFrenteHuUsuario,
        ...savedState.users
    ];

    if (records.some(record => !record || !systemStates.includes(record.estado_sistema))) {
        throw new Error("Hay registros con un estado de sistema inválido.");
    }
    if (savedState.frentes.some(front => !plazaIds.has(front.plazaId))) {
        throw new Error("Hay frentes relacionados con plazas inexistentes.");
    }
    if (savedState.relacionFrenteHuUsuario.some(assignment =>
        !frontIds.has(assignment.frenteId) || !userIds.has(assignment.userId)
    )) {
        throw new Error("Hay relaciones de frente y usuario con códigos inexistentes.");
    }
}

function setStatus(message) {
    statusElement.textContent = message;
}

async function confirmDisable(message) {
    try {
        return await window.GeoMessages.confirm(message, {confirmText: "Deshabilitar"});
    } catch (error) {
        console.error("No se pudo mostrar la confirmación.", error);
        setStatus("No se pudo mostrar la confirmación. Inténtalo de nuevo.");
        return false;
    }
}

function loadState(seedData) {
    try {
        const saved = localStorage.getItem(storageKey);
        if (!saved) {
            const initialState = createSeedState(seedData);
            localStorage.setItem(storageKey, JSON.stringify(initialState));
            return initialState;
        }

        const parsed = JSON.parse(saved);
        if (parsed.version === 1) {
            const migratedState = migrateLegacyState(parsed, seedData);
            validateStoredRelations(migratedState);
            localStorage.setItem(storageKey, JSON.stringify(migratedState));
            return migratedState;
        }
        if (
            parsed.version !== 2 ||
            !Array.isArray(parsed.users) ||
            !Array.isArray(parsed.areas) ||
            !Array.isArray(parsed.plazas) ||
            !Array.isArray(parsed.frentes) ||
            !Array.isArray(parsed.relacionFrenteHuUsuario) ||
            !Array.isArray(parsed.activity) ||
            !parsed.layerStructures
        ) {
            throw new Error("La estructura guardada no es compatible.");
        }

        validateStoredRelations(parsed);
        normalizeLayerStructures(parsed.layerStructures);
        return parsed;
    } catch (error) {
        setStatus(`No se pudo leer la configuración guardada: ${error.message}. Se muestran los datos iniciales.`);
        return createSeedState(seedData);
    }
}

let seedData = null;
let state = null;
let activeView = "overview";
let selectedStructureModule = modules[0].id;
let draggedStructureItem = null;
let userSortKey = "name";
let userSortDirection = "asc";
const collapsedStructureGroups = new Set();
const userSortCollator = new Intl.Collator("es-PE", {numeric: true, sensitivity: "base"});

function saveState(message = "Cambios guardados en este navegador.") {
    try {
        localStorage.setItem(storageKey, JSON.stringify(state));
        setStatus(message);
    } catch (error) {
        setStatus(`No se pudieron guardar los cambios localmente: ${error.message}`);
    }
}

const {escapeHtml} = window.GeoMarkup;

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

document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => navigateTo(button.dataset.view));
});

function getAreaName(areaId) {
    return state.areas.find(area => area.id === areaId)?.name || "Área eliminada";
}

function getUserName(userId) {
    return state.users.find(user => user.id === userId)?.name || "Usuario eliminado";
}

function isSystemEnabled(record) {
    return record?.estado_sistema === "Habilitado";
}

function getUserFrontRelation(userId, frontId) {
    return state.relacionFrenteHuUsuario.find(
        relation =>
            relation.userId === userId &&
            relation.frenteId === frontId &&
            isSystemEnabled(relation)
    ) || null;
}

function hasDisabledUserFrontRelation(userId, frontId) {
    return state.relacionFrenteHuUsuario.some(
        relation =>
            relation.userId === userId &&
            relation.frenteId === frontId &&
            !isSystemEnabled(relation)
    );
}

function getFrontDisplayName(front) {
    const plaza = state.plazas.find(item => item.id === front.plazaId);
    return plaza ? `${plaza.name} / ${front.name}` : front.name;
}

function getUserFrontNames(userId) {
    return state.relacionFrenteHuUsuario
        .filter(relation => relation.userId === userId && isSystemEnabled(relation))
        .map(relation => state.frentes.find(front => front.id === relation.frenteId))
        .filter(Boolean)
        .map(getFrontDisplayName);
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

    document.getElementById("metric-users").textContent =
        state.users.filter(isSystemEnabled).length;
    document.getElementById("metric-areas").textContent = state.areas.length;
    document.getElementById("metric-plazas").textContent =
        state.plazas.filter(isSystemEnabled).length;
    document.getElementById("metric-activity").textContent = createdThisMonth;
}

function getUserSortValue(user, sortKey) {
    if (sortKey === "name") {
        return user.name;
    }
    if (sortKey === "email") {
        return user.email;
    }
    if (sortKey === "area") {
        return getAreaName(user.areaId);
    }
    if (sortKey === "frentes") {
        return getUserFrontNames(user.id).join(", ");
    }
    const moduleId = sortKey.slice("role:".length);
    return user.moduleRoles[moduleId] || "Sin acceso";
}

function renderUserSortHeader(label, sortKey) {
    const active = userSortKey === sortKey;
    const direction = userSortDirection === "asc" ? "ascending" : "descending";
    const icon = active
        ? userSortDirection === "asc" ? "arrow_upward" : "arrow_downward"
        : "unfold_more";
    return `
        <th scope="col" aria-sort="${active ? direction : "none"}">
            <button class="user-sort-button" type="button" data-sort-users="${escapeHtml(sortKey)}" aria-label="Ordenar por ${escapeHtml(label)}">
                <span>${escapeHtml(label)}</span>
                <span class="material-icons" aria-hidden="true">${icon}</span>
            </button>
        </th>`;
}

function renderUsers() {
    const areaSelect = document.getElementById("new-user-area");
    areaSelect.innerHTML = getOptions(state.areas, state.areas[0]?.id);
    const userList = document.getElementById("user-list");
    const userTableHead = document.getElementById("user-table-head");
    const userTableBody = document.getElementById("user-table-body");
    const userTableEmpty = document.getElementById("user-table-empty");
    const userSearch = document.getElementById("user-search").value.trim().toLocaleLowerCase("es-PE");
    const openFrontMenus = new Set(
        [...userList.querySelectorAll("details[data-user-front-picker][open]")]
            .map(details => details.dataset.userFrontPicker)
    );
    const headers = [
        renderUserSortHeader("Usuario", "name"),
        renderUserSortHeader("Correo", "email"),
        renderUserSortHeader("Área", "area"),
        renderUserSortHeader("Frentes", "frentes"),
        ...modules.map(module => renderUserSortHeader(module.name, `role:${module.id}`)),
        "<th scope=\"col\">Acciones</th>"
    ];
    userTableHead.innerHTML = `<tr>${headers.join("")}</tr>`;

    const users = state.users
        .filter(user => {
            if (!userSearch) {
                return true;
            }
            const searchText = [
                user.name,
                user.id,
                user.email,
                getAreaName(user.areaId),
                ...getUserFrontNames(user.id),
                ...modules.map(module => user.moduleRoles[module.id] || "Sin acceso")
            ].join(" ").toLocaleLowerCase("es-PE");
            return searchText.includes(userSearch);
        })
        .sort((first, second) => {
            const comparison = userSortCollator.compare(
                getUserSortValue(first, userSortKey),
                getUserSortValue(second, userSortKey)
            );
            return comparison * (userSortDirection === "asc" ? 1 : -1);
        });

    userTableBody.innerHTML = users.map(user => {
        const area = state.areas.find(item => item.id === user.areaId);
        const userEnabled = isSystemEnabled(user);
        const assignedFrontNames = getUserFrontNames(user.id);
        const frontControls = state.frentes.length
            ? `<details class="user-front-picker" data-user-front-picker="${escapeHtml(user.id)}"${openFrontMenus.has(user.id) ? " open" : ""}>
                    <summary>
                        <span>${assignedFrontNames.length ? escapeHtml(assignedFrontNames.join(", ")) : "Sin frentes asignados"} (${assignedFrontNames.length}/${state.frentes.length})</span>
                        <span class="material-icons" aria-hidden="true">expand_more</span>
                    </summary>
                    <div class="user-front-assignment">
                        ${state.frentes.map(front => {
                            const plaza = state.plazas.find(item => item.id === front.plazaId);
                            const relation = getUserFrontRelation(user.id, front.id);
                            const relationEnabled = Boolean(relation);
                            const frontAvailable = isSystemEnabled(front) && isSystemEnabled(plaza);
                            const hasDisabledRelation = hasDisabledUserFrontRelation(user.id, front.id);
                            const assignmentStatus = hasDisabledRelation && !relation
                                ? " · Asignación anterior deshabilitada"
                                : !isSystemEnabled(plaza)
                                    ? " · Plaza deshabilitada"
                                    : !isSystemEnabled(front)
                                        ? " · Deshabilitado"
                                        : "";
                            return `<label class="check-option">
                                <input type="checkbox" data-user-front="${escapeHtml(user.id)}" value="${escapeHtml(front.id)}"${relationEnabled ? " checked" : ""}${userEnabled && frontAvailable ? "" : " disabled"}>
                                <span>${escapeHtml(getFrontDisplayName(front))}${assignmentStatus}</span>
                            </label>`;
                        }).join("")}
                    </div>
                </details>`
            : '<span class="field-hint">No hay frentes disponibles.</span>';
        const roleControls = modules.map(module => {
            const role = user.moduleRoles[module.id] || "";
            const areaAllowsModule = area?.modules.includes(module.id) || false;
            const roleOptions = `<option value="">Sin acceso</option>` + roles.map(item =>
                `<option value="${escapeHtml(item)}"${role === item ? " selected" : ""}>${escapeHtml(item)}</option>`
            ).join("");
            return `
                <td>
                    <div class="table-role-control">
                        <select data-user-role="${escapeHtml(user.id)}" data-module="${escapeHtml(module.id)}" aria-label="Rol de ${escapeHtml(user.name)} en ${escapeHtml(module.name)}"${userEnabled ? "" : " disabled"}>${roleOptions}</select>
                        <small class="${areaAllowsModule ? "scope-on" : "scope-off"}">${areaAllowsModule ? "Habilitado por el área" : "Bloqueado por el área"}</small>
                    </div>
                </td>`;
        }).join("");

        return `
            <tr>
                <th scope="row">
                    <div class="user-table-identity">
                        <strong>${escapeHtml(user.name)}</strong>
                        <span>${escapeHtml(user.id)}</span>
                        <small class="record-status ${userEnabled ? "is-enabled" : "is-disabled"}">${escapeHtml(user.estado_sistema)}</small>
                    </div>
                </th>
                <td>${escapeHtml(user.email)}</td>
                <td>
                    <select data-user-area="${escapeHtml(user.id)}" aria-label="Área asignada a ${escapeHtml(user.name)}"${userEnabled ? "" : " disabled"}>
                        ${getOptions(state.areas, user.areaId, "Sin área")}
                    </select>
                </td>
                <td>${frontControls}</td>
                ${roleControls}
                <td>
                    <button class="remove-button" type="button" data-disable-user="${escapeHtml(user.id)}" aria-label="Deshabilitar ${escapeHtml(user.name)}" title="${userEnabled ? "Deshabilitar usuario" : "Usuario deshabilitado"}"${userEnabled ? "" : " disabled"}>
                        <span class="material-icons" aria-hidden="true">person_off</span>
                    </button>
                </td>
            </tr>`;
    }).join("");

    document.getElementById("user-result-count").textContent =
        `${users.length} de ${state.users.length} usuarios`;
    userTableEmpty.textContent = state.users.length === 0
        ? "Aún no hay usuarios. Agrega un perfil para comenzar."
        : "No hay usuarios que coincidan con la búsqueda.";
    userTableEmpty.hidden = users.length > 0;
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
                <div><strong>${escapeHtml(area.name)}</strong><p>${state.users.filter(user => user.areaId === area.id && isSystemEnabled(user)).length} usuario(s) asignado(s)</p></div>
            </div>
            <div class="module-permission-grid">
                ${modules.map(module => `
                    <label class="module-permission">
                        <input type="checkbox" data-area-module="${escapeHtml(area.id)}" value="${escapeHtml(module.id)}"${area.modules.includes(module.id) ? " checked" : ""}>
                        <span>${escapeHtml(module.name)}</span>
                    </label>`).join("")}
            </div>
        </article>`).join("");

    renderPlazaManagement();
}

function renderPlazaManagement() {
    const plazaList = document.getElementById("plaza-list");
    plazaList.innerHTML = state.plazas.length
        ? state.plazas.map(plaza => `
            <span class="plaza-chip ${isSystemEnabled(plaza) ? "" : "is-disabled"}">
                <span class="plaza-chip-label">
                    <strong>${escapeHtml(plaza.name)}</strong>
                    <small class="record-status ${isSystemEnabled(plaza) ? "is-enabled" : "is-disabled"}">${escapeHtml(plaza.estado_sistema)} · ${state.frentes.filter(front => front.plazaId === plaza.id).length} frente(s)</small>
                </span>
                <button class="remove-button" type="button" data-disable-plaza="${escapeHtml(plaza.id)}" aria-label="Deshabilitar plaza ${escapeHtml(plaza.name)}" title="${isSystemEnabled(plaza) ? "Deshabilitar plaza" : "Plaza deshabilitada"}"${isSystemEnabled(plaza) ? "" : " disabled"}>
                    <span class="material-icons" aria-hidden="true">block</span>
                </button>
            </span>`).join("")
        : '<span class="field-hint">No hay plazas. Agrega una ubicación de trabajo.</span>';

    const activePlazas = state.plazas.filter(isSystemEnabled);
    const frontForm = document.getElementById("frente-form");
    const frontPlazaSelect = document.getElementById("frente-plaza");
    const previousPlazaId = frontPlazaSelect.value;
    const selectedPlazaId = activePlazas.some(plaza => plaza.id === previousPlazaId)
        ? previousPlazaId
        : activePlazas[0]?.id;
    frontPlazaSelect.innerHTML = getOptions(
        activePlazas,
        selectedPlazaId,
        activePlazas.length ? null : "No hay plazas habilitadas"
    );
    frontPlazaSelect.disabled = activePlazas.length === 0;
    frontForm.querySelector("button").disabled = activePlazas.length === 0;

    const frontList = document.getElementById("frente-list");
    frontList.innerHTML = state.frentes.length
        ? state.frentes.map(front => {
            const plaza = state.plazas.find(item => item.id === front.plazaId);
            const frontCanBeDisabled = isSystemEnabled(front) && isSystemEnabled(plaza);
            return `
                <span class="plaza-chip front-chip ${frontCanBeDisabled ? "" : "is-disabled"}">
                    <span class="plaza-chip-label">
                        <strong>${escapeHtml(front.name)}</strong>
                        <small class="record-status ${isSystemEnabled(front) ? "is-enabled" : "is-disabled"}">${escapeHtml(plaza?.name || "Plaza desconocida")} · ${escapeHtml(front.estado_sistema)}</small>
                    </span>
                    <button class="remove-button" type="button" data-disable-front="${escapeHtml(front.id)}" aria-label="Deshabilitar frente ${escapeHtml(front.name)}" title="${frontCanBeDisabled ? "Deshabilitar frente" : "Frente deshabilitado"}"${frontCanBeDisabled ? "" : " disabled"}>
                        <span class="material-icons" aria-hidden="true">block</span>
                    </button>
                </span>`;
        }).join("")
        : '<span class="field-hint">No hay frentes. Agrega un frente y relaciónalo con una plaza.</span>';
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

function renderStructureGroup(group, isRoot = false, parentId = "", groupIndex = 0, groupCount = 1) {
    const name = escapeHtml(group.name);
    const groupId = escapeHtml(group.id);
    const nestedGroups = group.subgroups || [];
    const layers = group.layers || [];
    const container = isRoot ? "article" : "section";
    const className = isRoot ? "structure-card" : "structure-subgroup";
    const headerClass = isRoot ? "structure-card-header" : "structure-subgroup-header";
    const collapsed = collapsedStructureGroups.has(group.id);
    const contentId = `structure-group-content-${groupId}`;

    return `
        <${container} class="${className}" data-structure-group="${groupId}" data-parent-group="${escapeHtml(parentId)}">
            <div class="${headerClass}">
                <div class="structure-group-label">
                    <button class="structure-icon-button structure-drag-handle" type="button" draggable="true" data-drag-group="${groupId}" aria-label="Mover grupo ${name}" title="Arrastrar para cambiar el orden del grupo">
                        <span class="material-icons" aria-hidden="true">drag_indicator</span>
                    </button>
                    <button class="structure-icon-button" type="button" data-toggle-structure-group="${groupId}" aria-expanded="${!collapsed}" aria-controls="${contentId}" aria-label="${collapsed ? "Expandir" : "Contraer"} grupo ${name}" title="${collapsed ? "Expandir grupo" : "Contraer grupo"}">
                        <span class="material-icons" aria-hidden="true">${collapsed ? "chevron_right" : "expand_more"}</span>
                    </button>
                    <strong>${name}</strong>
                </div>
                <div class="structure-order-controls">
                    <button class="structure-icon-button" type="button" data-move-group="${groupId}" data-move-direction="up" aria-label="Subir grupo ${name}" title="Subir grupo"${groupIndex === 0 ? " disabled" : ""}>
                        <span class="material-icons" aria-hidden="true">arrow_upward</span>
                    </button>
                    <button class="structure-icon-button" type="button" data-move-group="${groupId}" data-move-direction="down" aria-label="Bajar grupo ${name}" title="Bajar grupo"${groupIndex === groupCount - 1 ? " disabled" : ""}>
                        <span class="material-icons" aria-hidden="true">arrow_downward</span>
                    </button>
                </div>
                <button class="remove-button" type="button" data-remove-group="${groupId}" aria-label="Quitar grupo ${name}" title="Quitar grupo">
                    <span class="material-icons" aria-hidden="true">delete_outline</span>
                </button>
            </div>
            <div class="structure-group-content" id="${contentId}"${collapsed ? " hidden" : ""}>
                <div class="structure-group-list" data-group-list-parent="${groupId}">
                    ${nestedGroups.map((nestedGroup, index) =>
                        renderStructureGroup(nestedGroup, false, group.id, index, nestedGroups.length)
                    ).join("")}
                </div>
                ${isRoot ? "" : `
                    <div class="structure-layer-list" data-layer-list-parent="${groupId}">
                        ${layers.map((layer, index) => `
                            <div class="structure-layer" data-structure-layer="${escapeHtml(layer.id)}" data-parent-group="${groupId}">
                                <button class="structure-icon-button structure-drag-handle" type="button" draggable="true" data-drag-layer="${escapeHtml(layer.id)}" aria-label="Mover capa ${escapeHtml(layer.name)}" title="Arrastrar para cambiar el orden de la capa">
                                    <span class="material-icons" aria-hidden="true">drag_indicator</span>
                                </button>
                                <span class="structure-layer-name">
                                    <span class="material-icons" aria-hidden="true">layers</span>
                                    <span>${escapeHtml(layer.name)}</span>
                                    ${layer.type === "WFS"
                                        ? `<a class="structure-layer-service" href="${escapeHtml(layer.serviceUrl)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(layer.serviceUrl)}" aria-label="Abrir el servicio WFS de ${escapeHtml(layer.name)}">WFS</a>`
                                        : ""}
                                </span>
                                <div class="structure-order-controls">
                                    <button class="structure-icon-button" type="button" data-move-layer="${escapeHtml(layer.id)}" data-group="${groupId}" data-move-direction="up" aria-label="Subir capa ${escapeHtml(layer.name)}" title="Subir capa"${index === 0 ? " disabled" : ""}>
                                        <span class="material-icons" aria-hidden="true">arrow_upward</span>
                                    </button>
                                    <button class="structure-icon-button" type="button" data-move-layer="${escapeHtml(layer.id)}" data-group="${groupId}" data-move-direction="down" aria-label="Bajar capa ${escapeHtml(layer.name)}" title="Bajar capa"${index === layers.length - 1 ? " disabled" : ""}>
                                        <span class="material-icons" aria-hidden="true">arrow_downward</span>
                                    </button>
                                </div>
                                <button class="remove-button" type="button" data-remove-layer="${escapeHtml(layer.id)}" data-group="${groupId}" aria-label="Quitar capa ${escapeHtml(layer.name)}" title="Quitar capa">
                                    <span class="material-icons" aria-hidden="true">delete_outline</span>
                                </button>
                            </div>`).join("")}
                        ${layers.length === 0
                            ? '<p class="structure-empty-layers">Este grupo no tiene capas todavía.</p>'
                            : ""}
                    </div>`}
                <form class="nested-group-form" data-add-nested-group="${groupId}">
                    <input name="name" type="text" required maxlength="80" aria-label="Nuevo grupo dentro de ${name}" placeholder="Nombre del grupo">
                    <button class="button button-secondary" type="submit"><span class="material-icons" aria-hidden="true">create_new_folder</span>Agregar grupo</button>
                </form>
                ${isRoot ? "" : `
                    <form class="layer-form" data-add-layer="${groupId}">
                        <label>Nombre de la capa
                            <input name="name" type="text" required maxlength="80" aria-label="Nueva capa para ${name}" placeholder="Nombre de la capa">
                        </label>
                        <label>Tipo de capa
                            <select name="type" data-layer-type aria-label="Tipo de capa para ${name}">
                                <option value="regular">Capa regular</option>
                                <option value="WFS">Servicio WFS</option>
                            </select>
                        </label>
                        <label class="layer-service-url" data-wfs-url-field hidden>URL GetFeature del servicio WFS
                            <input name="serviceUrl" type="url" placeholder="https://servidor/ows?service=WFS&amp;request=GetFeature&amp;typeName=espacio:capa" autocomplete="url">
                            <small>Pega la URL GetFeature completa, incluyendo typeName o typeNames.</small>
                        </label>
                        <button class="button button-secondary" type="submit"><span class="material-icons" aria-hidden="true">add</span>Agregar capa</button>
                    </form>`}
            </div>
        </${container}>`;
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

    structureList.dataset.groupListParent = "";
    structureList.innerHTML = groups.map((group, index) =>
        renderStructureGroup(group, true, "", index, groups.length)
    ).join("");
}

function renderDataTables() {
    const tables = [
        {id: "json-table-plaza-hu", name: "plaza_hu", records: seedData.plaza_hu},
        {id: "json-table-frente-hu", name: "frente_hu", records: seedData.frente_hu},
        {id: "json-table-relacion-frentehu-usuario", name: "relacion_frentehu_usuario", records: seedData.relacion_frentehu_usuario},
        {id: "json-table-usuarios", name: "usuarios", records: seedData.usuarios}
    ];

    tables.forEach(table => {
        const columns = table.records.length ? Object.keys(table.records[0]) : [];
        const rows = table.records.map(record => `
            <tr>${columns.map(column => {
                const value = record[column] === null ? "NULL" : String(record[column]);
                return `<td>${escapeHtml(value)}</td>`;
            }).join("")}</tr>`
        ).join("");
        const content = table.records.length
            ? `<div class="table-scroll">
                    <table aria-label="Tabla ${escapeHtml(table.name)}">
                        <thead><tr>${columns.map(column => `<th scope="col">${escapeHtml(column)}</th>`).join("")}</tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>`
            : '<p class="empty-state">Esta tabla no contiene registros.</p>';

        document.getElementById(table.id).innerHTML = `
            <div class="section-heading">
                <div><h3>${escapeHtml(table.name)}</h3><p>${table.records.length} registro(s) de data.json</p></div>
            </div>
            ${content}`;
    });
}

function renderAll() {
    renderOverview();
    renderUsers();
    renderAreas();
    renderActivity();
    renderLayerStructure();
    renderDataTables();
}

document.getElementById("user-form").addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name")).trim();
    const email = String(formData.get("email")).trim();
    const areaId = String(formData.get("areaId"));
    if (!name || !email || !state.areas.some(area => area.id === areaId)) {
        setStatus("Ingresa nombre, correo y área válida.");
        return;
    }

    state.users.push({
        id: createId("user"),
        name,
        email,
        areaId,
        moduleRoles: {},
        estado_sistema: "Habilitado"
    });
    event.currentTarget.reset();
    saveState(`Se agregó el perfil local de ${name}. Asigna sus módulos y frentes.`);
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
    state.plazas.push({id: createId("plaza"), name, estado_sistema: "Habilitado"});
    event.currentTarget.reset();
    saveState(`Se agregó la plaza "${name}".`);
    renderAll();
});

document.getElementById("frente-form").addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name")).trim();
    const plazaId = String(formData.get("plazaId"));
    const plaza = state.plazas.find(item => item.id === plazaId);
    if (!name || !isSystemEnabled(plaza)) {
        setStatus("Ingresa un nombre de frente y selecciona una plaza habilitada.");
        return;
    }
    if (state.frentes.some(front =>
        front.plazaId === plazaId &&
        front.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    )) {
        setStatus("Ya existe un frente con ese nombre en la plaza seleccionada.");
        return;
    }

    state.frentes.push({
        id: createId("frente"),
        plazaId,
        name,
        estado_sistema: "Habilitado"
    });
    event.currentTarget.reset();
    saveState(`Se agregó el frente "${name}" en ${plaza.name}.`);
    renderAll();
});

document.getElementById("user-search").addEventListener("input", renderUsers);

document.getElementById("user-list").addEventListener("change", event => {
    const target = event.target;
    if (target.matches("[data-user-area]")) {
        const user = state.users.find(item => item.id === target.dataset.userArea);
        if (user && isSystemEnabled(user)) {
            user.areaId = target.value;
            saveState(`Se actualizó el área de ${user.name}.`);
        } else {
            setStatus("No se puede modificar un usuario deshabilitado.");
        }
    } else if (target.matches("[data-user-role]")) {
        const user = state.users.find(item => item.id === target.dataset.userRole);
        if (user && isSystemEnabled(user)) {
            if (target.value) {
                user.moduleRoles[target.dataset.module] = target.value;
            } else {
                delete user.moduleRoles[target.dataset.module];
            }
            saveState(`Se actualizó el rol de ${user.name} para ${modules.find(module => module.id === target.dataset.module)?.name || "el módulo"}.`);
        } else {
            setStatus("No se puede modificar un usuario deshabilitado.");
        }
    } else if (target.matches("[data-user-front]")) {
        const user = state.users.find(item => item.id === target.dataset.userFront);
        const front = state.frentes.find(item => item.id === target.value);
        const plaza = state.plazas.find(item => item.id === front?.plazaId);
        const relation = getUserFrontRelation(user?.id, front?.id);
        if (
            !user ||
            !front ||
            !isSystemEnabled(user) ||
            !isSystemEnabled(front) ||
            !isSystemEnabled(plaza)
        ) {
            setStatus("No se puede modificar una relación con registros deshabilitados.");
            renderUsers();
            return;
        }

        if (target.checked && !relation) {
            state.relacionFrenteHuUsuario.push({
                id: createId("relacion"),
                frenteId: front.id,
                userId: user.id,
                estado_sistema: "Habilitado"
            });
            saveState(`Se asignó el frente "${front.name}" a ${user.name}.`);
        } else if (!target.checked && relation) {
            relation.estado_sistema = "Deshabilitado";
            saveState(`Se deshabilitó la asignación del frente "${front.name}" a ${user.name}.`);
        }
    }
    renderUsers();
    renderOverview();
});

document.getElementById("user-list").addEventListener("click", async event => {
    const sortButton = event.target.closest("[data-sort-users]");
    if (sortButton) {
        const sortKey = sortButton.dataset.sortUsers;
        if (userSortKey === sortKey) {
            userSortDirection = userSortDirection === "asc" ? "desc" : "asc";
        } else {
            userSortKey = sortKey;
            userSortDirection = "asc";
        }
        renderUsers();
        return;
    }

    const button = event.target.closest("[data-disable-user]");
    if (!button) {
        return;
    }
    const user = state.users.find(item => item.id === button.dataset.disableUser);
    if (!user || !isSystemEnabled(user)) {
        return;
    }
    if (!await confirmDisable(`¿Deshabilitar el usuario "${user.name}"?`) || !isSystemEnabled(user)) {
        return;
    }
    user.estado_sistema = "Deshabilitado";
    saveState(`Se deshabilitó el usuario "${user.name}".`);
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

document.getElementById("plaza-list").addEventListener("click", async event => {
    const button = event.target.closest("[data-disable-plaza]");
    if (!button) {
        return;
    }
    const plaza = state.plazas.find(item => item.id === button.dataset.disablePlaza);
    if (!plaza || !isSystemEnabled(plaza)) {
        return;
    }
    if (!await confirmDisable(`¿Deshabilitar la plaza "${plaza.name}"? Sus frentes no podrán modificarse ni asignarse.`) || !isSystemEnabled(plaza)) {
        return;
    }
    plaza.estado_sistema = "Deshabilitado";
    saveState(`Se deshabilitó la plaza "${plaza.name}".`);
    renderAll();
});

document.getElementById("frente-list").addEventListener("click", async event => {
    const button = event.target.closest("[data-disable-front]");
    if (!button) {
        return;
    }
    const front = state.frentes.find(item => item.id === button.dataset.disableFront);
    const plaza = state.plazas.find(item => item.id === front?.plazaId);
    if (!front || !isSystemEnabled(front) || !isSystemEnabled(plaza)) {
        return;
    }
    if (!await confirmDisable(`¿Deshabilitar el frente "${front.name}"? Sus asignaciones quedarán bloqueadas.`) ||
        !isSystemEnabled(front) || !isSystemEnabled(plaza)) {
        return;
    }
    front.estado_sistema = "Deshabilitado";
    saveState(`Se deshabilitó el frente "${front.name}".`);
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
    groups.push({id: createId("group"), name, subgroups: [], layers: []});
    event.currentTarget.reset();
    saveState(`Se agregó el grupo "${name}".`);
    renderLayerStructure();
});

document.getElementById("layer-structure-list").addEventListener("submit", event => {
    const layerForm = event.target.closest("[data-add-layer]");
    if (layerForm) {
        event.preventDefault();
        const formData = new FormData(layerForm);
        const name = String(formData.get("name")).trim();
        if (!name) {
            setStatus("Escribe el nombre de la capa.");
            return;
        }

        const type = String(formData.get("type"));
        let wfsUrl = null;
        if (type === "WFS") {
            wfsUrl = parseWfsGetFeatureUrl(
                String(formData.get("serviceUrl") || "").trim()
            );
            if (!wfsUrl) {
                setStatus("Pega una URL HTTP/HTTPS completa de WFS GetFeature que incluya typeName o typeNames.");
                return;
            }
        } else if (type !== "regular") {
            setStatus("Selecciona un tipo de capa válido.");
            return;
        }

        const group = findStructureGroup(
            state.layerStructures[selectedStructureModule] || [],
            layerForm.dataset.addLayer
        );
        if (!group) {
            setStatus("No se encontró el grupo seleccionado para agregar la capa.");
            return;
        }

        const layer = {id: createId("layer"), name};
        if (type === "WFS") {
            layer.type = "WFS";
            layer.serviceUrl = wfsUrl.href;
        }
        group.layers.push(layer);
        saveState(type === "WFS"
            ? `Se agregó la capa WFS "${name}".`
            : `Se agregó la capa "${name}".`
        );
        renderLayerStructure();
        return;
    }

    const nestedGroupForm = event.target.closest("[data-add-nested-group]");
    if (nestedGroupForm) {
        event.preventDefault();
        const name = String(new FormData(nestedGroupForm).get("name")).trim();
        if (!name) {
            setStatus("Escribe el nombre del grupo.");
            return;
        }
        const group = findStructureGroup(
            state.layerStructures[selectedStructureModule] || [],
            nestedGroupForm.dataset.addNestedGroup
        );
        if (!group) {
            setStatus("No se encontró el grupo donde agregar el nuevo grupo.");
            return;
        }
        group.subgroups.push({
            id: createId("group"),
            name,
            subgroups: [],
            layers: []
        });
        saveState(`Se agregó el grupo "${name}" dentro de "${group.name}".`);
        renderLayerStructure();
    }
});

document.getElementById("layer-structure-list").addEventListener("change", event => {
    const typeSelect = event.target.closest("[data-layer-type]");
    if (!typeSelect) {
        return;
    }

    const layerForm = typeSelect.closest("[data-add-layer]");
    const serviceUrlField = layerForm.querySelector("[data-wfs-url-field]");
    const serviceUrlInput = layerForm.querySelector("[name='serviceUrl']");
    const isWfs = typeSelect.value === "WFS";
    serviceUrlField.hidden = !isWfs;
    serviceUrlInput.required = isWfs;
    if (!isWfs) {
        serviceUrlInput.value = "";
    }
});

document.getElementById("layer-structure-list").addEventListener("click", event => {
    const moveGroup = event.target.closest("[data-move-group]");
    if (moveGroup) {
        const groupElement = moveGroup.closest("[data-structure-group]");
        const siblings = getStructureGroupSiblings(groupElement.dataset.parentGroup || "");
        const sourceIndex = siblings
            ? siblings.findIndex(group => group.id === moveGroup.dataset.moveGroup)
            : -1;
        const direction = moveGroup.dataset.moveDirection;
        const target = siblings && siblings[sourceIndex + (direction === "up" ? -1 : 1)];
        if (!target || !moveStructureItem(
            siblings,
            moveGroup.dataset.moveGroup,
            target.id,
            direction === "down"
        )) {
            return;
        }
        saveState("Se actualizó el orden de los grupos.");
        renderLayerStructure();
        return;
    }

    const moveLayer = event.target.closest("[data-move-layer]");
    if (moveLayer) {
        const group = findStructureGroup(
            state.layerStructures[selectedStructureModule] || [],
            moveLayer.dataset.group
        );
        const sourceIndex = group
            ? group.layers.findIndex(layer => layer.id === moveLayer.dataset.moveLayer)
            : -1;
        const direction = moveLayer.dataset.moveDirection;
        const target = group && group.layers[sourceIndex + (direction === "up" ? -1 : 1)];
        if (!group || !target || !moveStructureItem(
            group.layers,
            moveLayer.dataset.moveLayer,
            target.id,
            direction === "down"
        )) {
            return;
        }
        saveState("Se actualizó el orden de las capas.");
        renderLayerStructure();
        return;
    }

    const toggleGroup = event.target.closest("[data-toggle-structure-group]");
    if (toggleGroup) {
        const groupId = toggleGroup.dataset.toggleStructureGroup;
        const group = findStructureGroup(
            state.layerStructures[selectedStructureModule] || [],
            groupId
        );
        const content = document.getElementById(toggleGroup.getAttribute("aria-controls"));
        if (!group || !content) {
            setStatus("No se encontró el contenido del grupo seleccionado.");
            return;
        }

        const shouldCollapse = toggleGroup.getAttribute("aria-expanded") === "true";
        if (shouldCollapse) {
            collapsedStructureGroups.add(groupId);
        } else {
            collapsedStructureGroups.delete(groupId);
        }
        content.hidden = shouldCollapse;
        toggleGroup.setAttribute("aria-expanded", String(!shouldCollapse));
        toggleGroup.setAttribute(
            "aria-label",
            `${shouldCollapse ? "Expandir" : "Contraer"} grupo ${group.name}`
        );
        toggleGroup.title = `${shouldCollapse ? "Expandir" : "Contraer"} grupo`;
        toggleGroup.querySelector(".material-icons").textContent =
            shouldCollapse ? "chevron_right" : "expand_more";
        return;
    }

    const removeGroup = event.target.closest("[data-remove-group]");
    if (removeGroup) {
        const groups = state.layerStructures[selectedStructureModule] || [];
        const group = findStructureGroup(groups, removeGroup.dataset.removeGroup);
        if (!group || !removeStructureGroup(groups, removeGroup.dataset.removeGroup)) {
            setStatus("No se encontró el grupo que intentas quitar.");
            return;
        }
        saveState(`Se quitó el grupo "${group.name}" y todo su contenido.`);
        renderLayerStructure();
        return;
    }

    const removeLayer = event.target.closest("[data-remove-layer]");
    if (removeLayer) {
        const group = findStructureGroup(
            state.layerStructures[selectedStructureModule] || [],
            removeLayer.dataset.group
        );
        if (group) {
            const layer = group.layers.find(item => item.id === removeLayer.dataset.removeLayer);
            group.layers = group.layers.filter(item =>
                item.id !== removeLayer.dataset.removeLayer
            );
            saveState(`Se quitó la capa "${layer ? layer.name : ""}".`);
            renderLayerStructure();
        } else {
            setStatus("No se encontró el grupo de la capa que intentas quitar.");
        }
    }
});

const layerStructureList = document.getElementById("layer-structure-list");

layerStructureList.addEventListener("dragstart", event => {
    const groupHandle = event.target.closest("[data-drag-group]");
    const layerHandle = event.target.closest("[data-drag-layer]");
    if (!groupHandle && !layerHandle) {
        return;
    }

    if (groupHandle) {
        const group = groupHandle.closest("[data-structure-group]");
        draggedStructureItem = {
            type: "group",
            id: groupHandle.dataset.dragGroup,
            parentId: group.dataset.parentGroup || ""
        };
        group.classList.add("structure-dragging");
    } else {
        const layer = layerHandle.closest("[data-structure-layer]");
        draggedStructureItem = {
            type: "layer",
            id: layerHandle.dataset.dragLayer,
            parentId: layer.dataset.parentGroup
        };
        layer.classList.add("structure-dragging");
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
        "text/plain",
        `${draggedStructureItem.type}:${draggedStructureItem.id}`
    );
});

layerStructureList.addEventListener("dragover", event => {
    if (!draggedStructureItem) {
        return;
    }
    const target = getStructureDropTarget(event, draggedStructureItem);
    if (!target) {
        return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    layerStructureList.querySelectorAll(
        ".structure-drop-before, .structure-drop-after, .structure-drop-list"
    ).forEach(element => {
        element.classList.remove(
            "structure-drop-before",
            "structure-drop-after",
            "structure-drop-list"
        );
    });
    target.element.classList.add(target.id
        ? target.insertAfter ? "structure-drop-after" : "structure-drop-before"
        : "structure-drop-list"
    );
});

layerStructureList.addEventListener("drop", event => {
    if (!draggedStructureItem) {
        return;
    }
    const target = getStructureDropTarget(event, draggedStructureItem);
    if (!target) {
        return;
    }

    event.preventDefault();
    let items;
    if (draggedStructureItem.type === "group") {
        items = getStructureGroupSiblings(draggedStructureItem.parentId);
    } else {
        const parentGroup = findStructureGroup(
            state.layerStructures[selectedStructureModule] || [],
            draggedStructureItem.parentId
        );
        items = parentGroup ? parentGroup.layers : null;
    }

    if (!items) {
        setStatus("No se encontró la lista donde mover el elemento.");
    } else if (moveStructureItem(
        items,
        draggedStructureItem.id,
        target.id,
        target.insertAfter
    )) {
        saveState(draggedStructureItem.type === "group"
            ? "Se actualizó el orden de los grupos."
            : "Se actualizó el orden de las capas."
        );
        renderLayerStructure();
    }
    draggedStructureItem = null;
    layerStructureList.querySelectorAll(
        ".structure-dragging, .structure-drop-before, .structure-drop-after, .structure-drop-list"
    ).forEach(element => {
        element.classList.remove(
            "structure-dragging",
            "structure-drop-before",
            "structure-drop-after",
            "structure-drop-list"
        );
    });
});

layerStructureList.addEventListener("dragend", () => {
    draggedStructureItem = null;
    layerStructureList.querySelectorAll(
        ".structure-dragging, .structure-drop-before, .structure-drop-after, .structure-drop-list"
    ).forEach(element => {
        element.classList.remove(
            "structure-dragging",
            "structure-drop-before",
            "structure-drop-after",
            "structure-drop-list"
        );
    });
});

async function initializeAdmin() {
    const adminMain = document.querySelector(".admin-main");
    adminMain.setAttribute("aria-busy", "true");
    adminMain.inert = true;

    try {
        seedData = await loadSeedData();
        state = loadState(seedData);
        adminMain.inert = false;
        adminMain.removeAttribute("aria-busy");
        renderAll();
    } catch (error) {
        adminMain.inert = false;
        adminMain.removeAttribute("aria-busy");
        adminMain.querySelectorAll("button, input, select").forEach(control => {
            control.disabled = true;
        });
        setStatus(`No se pudieron cargar las tablas de datos: ${error.message}`);
    }
}

initializeAdmin();
const root = document.documentElement;

const themeSelect =
    document.getElementById("select-theme");

const systemTheme =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );
const THEME_STORAGE_KEY =
    "geourbanlp-theme";

/* ===================== */
/* THEME                 */
/* ===================== */

function getSystemTheme() {

    return systemTheme.matches
        ? "dark"
        : "light";
}

function getThemePreference() {

    const saved =
        localStorage.getItem(
            THEME_STORAGE_KEY
        );

    if (
        saved === "system" ||
        saved === "light" ||
        saved === "dark"
    ) {
        return saved;
    }

    return "system";
}

function applyTheme(preference) {
    const theme =
        preference === "system"
            ? getSystemTheme()
            : preference;

    root.setAttribute(
        "data-theme",
        theme
    );

    root.setAttribute(
        "data-theme-preference",
        preference
    );

    themeSelect.value =
        preference;
}

themeSelect.addEventListener(
    "change",
    function () {

        const preference =
            themeSelect.value;

        localStorage.setItem(
            THEME_STORAGE_KEY,
            preference
        );

        applyTheme(
            preference
        );
    }
);

systemTheme.addEventListener(
    "change",
    function () {

        if (
            root.getAttribute(
                "data-theme-preference"
            ) === "system"
        ) {
            applyTheme(
                "system"
            );
        }
    }
);


applyTheme(
    getThemePreference()
);

/* ===================== */
/* MAP                   */
/* ===================== */

const peruExtent =
    ol.proj.transformExtent(
        [-81.5, -18.5, -68.5, 0.2],
        "EPSG:4326",
        "EPSG:3857"
    );

const baseLayer = new ol.layer.Tile({
    source: new ol.source.OSM()
});


const drawingSource =
    new ol.source.Vector();

const drawingColorInput = document.getElementById("drawing-color");
const drawingColorValue = document.getElementById("drawing-color-value");

function createDrawingStyle(color) {
    const red = parseInt(color.slice(1, 3), 16);
    const green = parseInt(color.slice(3, 5), 16);
    const blue = parseInt(color.slice(5, 7), 16);

    return new ol.style.Style({
        fill: new ol.style.Fill({
            color: `rgba(${red}, ${green}, ${blue}, 0.18)`
        }),
        stroke: new ol.style.Stroke({
            color,
            width: 2
        }),
        image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({color}),
            stroke: new ol.style.Stroke({
                color: "#FFFFFF",
                width: 2
            })
        })
    });
}

const drawingLayer = new ol.layer.Vector({
    source: drawingSource,
    style: createDrawingStyle(drawingColorInput.value)
});

drawingColorInput.addEventListener("input", () => {
    const color = drawingColorInput.value.toUpperCase();
    drawingLayer.setStyle(createDrawingStyle(color));
    drawingColorValue.textContent = color;
});

const measurementSource = new ol.source.Vector();

const measurementLayer = new ol.layer.Vector({
    source: measurementSource,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: "rgba(84,124,138,0.18)"
        }),
        stroke: new ol.style.Stroke({
            color: "#547C8A",
            width: 3
        }),
        image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({
                color: "#547C8A"
            })
        })
    })
});

const locationSource = new ol.source.Vector();

const locationLayer = new ol.layer.Vector({
    source: locationSource,
    style: new ol.style.Style({
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: "#C47D55"
            }),
            stroke: new ol.style.Stroke({
                color: "#FFFFFF",
                width: 2
            })
        })
    })
});

const userLocationSource = new ol.source.Vector();
const userLocationLayer = new ol.layer.Vector({
    source: userLocationSource,
    style: feature => {
        if (feature.getGeometry().getType() === "Circle") {
            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "rgba(63,116,108,0.16)"
                }),
                stroke: new ol.style.Stroke({
                    color: "rgba(63,116,108,0.55)",
                    width: 1
                })
            });
        }

        return new ol.style.Style({
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: "#3F746C"
                }),
                stroke: new ol.style.Stroke({
                    color: "#FFFFFF",
                    width: 2
                })
            })
        });
    }
});

const map = new ol.Map({
    target: "map",
    layers: [
        baseLayer,
        measurementLayer,
        drawingLayer,
        locationLayer,
        userLocationLayer
    ],
    view: new ol.View({
        center: ol.extent.getCenter(peruExtent),
        zoom: 5,
        minZoom: 4,
        maxZoom: 21
    }),
    controls: ol.control.defaults.defaults({
        rotate: false
    })
});

drawingLayer.setZIndex(1000);
measurementLayer.setZIndex(1001);
locationLayer.setZIndex(1002);
userLocationLayer.setZIndex(1003);

map.getView().fit(peruExtent, {
    padding: [40, 40, 40, 40],
    maxZoom: 6
});

const mapElement = document.getElementById("map");
const mapContainer = document.querySelector(".map-container");
const cesiumElement = document.getElementById("cesium-map");
const basemapStatus = document.getElementById("basemap-status");
const basemapButtons = document.querySelectorAll("[data-basemap]");
const managedServiceLayersContainer = document.getElementById("managed-service-layers");
const managedFileLayersContainer = document.getElementById("managed-file-layers");
const serviceLayerControls = document.getElementById("service-layer-controls");
const legendContent = document.getElementById("legend-content");
const mapLegend = document.getElementById("map-legend");
const mapLegendToggleButton = document.getElementById("btn-toggle-map-legend");
const mapLegendCloseButton = document.getElementById("btn-close-map-legend");
const mapScreenshotButton = document.getElementById("btn-map-screenshot");
const mapScreenshotStatus = document.getElementById("map-screenshot-status");
const mapScreenshotActions = document.getElementById("map-screenshot-actions");
const mapScreenshotPreview = document.getElementById("map-screenshot-preview");
const mapScreenshotActionsStatus = document.getElementById("map-screenshot-actions-status");
const mapScreenshotDownloadButton = document.getElementById("btn-download-map-screenshot");
const mapScreenshotCopyButton = document.getElementById("btn-copy-map-screenshot");
const mapScreenshotCloseButton = document.getElementById("btn-close-map-screenshot-actions");
const timelinePanel = document.getElementById("map-timeline");
const timelinePanelButton = document.getElementById("btn-toggle-timeline-panel");
const timelineCloseButton = document.getElementById("btn-close-timeline");
const timelineStartRange = document.getElementById("timeline-start");
const timelineEndRange = document.getElementById("timeline-end");
const timelineRangeSlider = document.getElementById("timeline-range-slider");
const timelineRangeSelection = document.getElementById("timeline-range-selection");
const timelineStartOutput = document.getElementById("timeline-start-output");
const timelineEndOutput = document.getElementById("timeline-end-output");
const timelineStatus = document.getElementById("timeline-status");
let mapScreenshotBlob = null;
let mapScreenshotPreviewUrl = null;
let cesiumViewer = null;
let cesiumViewerToken = null;
let cesiumLoadPromise = null;
let activeBasemap = "osm";
const externalLayers = [];
const millisecondsPerDay = 24 * 60 * 60 * 1000;
let timelineEnabled = false;
const categoryPalette = [
    "#3F746C",
    "#C47D55",
    "#547C8A",
    "#B65454",
    "#8064A2",
    "#B07A50",
    "#4F79A5",
    "#7D8B45",
    "#A8517C",
    "#4D7B85"
];

function setBasemapStatus(message) {
    basemapStatus.textContent = message;
}

function updateBasemapSelection() {
    basemapButtons.forEach(button => {
        const selected = button.dataset.basemap === activeBasemap;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
    });
}

function loadCesium() {
    if (window.Cesium) {
        return Promise.resolve(window.Cesium);
    }

    if (!cesiumLoadPromise) {
        cesiumLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cesium.com/downloads/cesiumjs/releases/1.125/Build/Cesium/Cesium.js";
            script.onload = () => resolve(window.Cesium);
            script.onerror = () => {
                cesiumLoadPromise = null;
                reject(new Error("No se pudo cargar CesiumJS."));
            };
            document.head.appendChild(script);
        });
    }

    return cesiumLoadPromise;
}

async function showGoogleBasemap(mapType) {
    const apiKey = document.getElementById("google-api-key").value.trim();
    if (!apiKey) {
        setBasemapStatus("Introduce una clave API de Google Maps para usar este mapa base.");
        return;
    }

    setBasemapStatus("Conectando con Google Maps…");

    try {
        const response = await fetch(
            `https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(apiKey)}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    mapType: mapType === "hybrid" ? "satellite" : mapType,
                    ...(mapType === "hybrid" && {
                        layerTypes: ["layerRoadmap"]
                    }),
                    language: "es",
                    region: "PE",
                    overlay: false
                })
            }
        );
        const sessionData = await response.json();

        if (!response.ok) {
            throw new Error(sessionData.error?.message || "Google Maps rechazó la solicitud.");
        }

        if (activeBasemap === "3d") {
            syncCesiumViewToMap();
        }

        mapElement.hidden = false;
        cesiumElement.hidden = true;
        baseLayer.setVisible(true);
        baseLayer.setSource(new ol.source.XYZ({
            url: `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${encodeURIComponent(sessionData.session)}&key=${encodeURIComponent(apiKey)}`,
            attributions: '<a href="https://maps.google.com/" target="_blank" rel="noopener noreferrer">Google Maps</a>',
            maxZoom: 22
        }));
        activeBasemap = mapType === "hybrid" ? "google-hybrid" : "google";
        updateBasemapSelection();
        updateLegend();
        setBasemapStatus(`Mapa ${mapType === "hybrid" ? "Google Híbrido" : "Google"} activo.`);
        map.updateSize();
    } catch (error) {
        setBasemapStatus(`No se pudo cargar Google Maps: ${error.message}`);
    }
}

async function showCesiumBasemap() {
    const token = document.getElementById("cesium-ion-token").value.trim();
    if (!token) {
        setBasemapStatus("Introduce un token de Cesium ion para usar el mapa 3D.");
        return;
    }

    setBasemapStatus("Cargando el terreno y los edificios 3D…");

    try {
        const Cesium = await loadCesium();
        Cesium.Ion.defaultAccessToken = token;

        if (cesiumViewer && cesiumViewerToken !== token) {
            cesiumViewer.destroy();
            cesiumViewer = null;
        }

        if (!cesiumViewer) {
            const terrainProvider = await Cesium.createWorldTerrainAsync();
            const osmBuildings = await Cesium.createOsmBuildingsAsync();
            cesiumViewer = new Cesium.Viewer(cesiumElement, {
                animation: false,
                baseLayerPicker: false,
                geocoder: false,
                homeButton: false,
                infoBox: false,
                sceneModePicker: false,
                selectionIndicator: false,
                timeline: false,
                navigationHelpButton: false,
                terrainProvider
            });
            cesiumViewer.scene.primitives.add(osmBuildings);
            cesiumViewerToken = token;
        }

        const center = ol.proj.toLonLat(map.getView().getCenter());
        cesiumViewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], 1800000),
            duration: 0
        });

        mapElement.hidden = true;
        cesiumElement.hidden = false;
        cesiumViewer.resize();
        activeBasemap = "3d";
        updateBasemapSelection();
        updateLegend();
        setBasemapStatus("Mapa 3D activo con terreno y edificios de OpenStreetMap.");
    } catch (error) {
        setBasemapStatus(`No se pudo cargar el mapa 3D: ${error.message}`);
    }
}

function syncCesiumViewToMap() {
    if (!cesiumViewer) {
        return;
    }

    const cameraPosition = cesiumViewer.camera.positionCartographic;
    const longitude = window.Cesium.Math.toDegrees(cameraPosition.longitude);
    const latitude = window.Cesium.Math.toDegrees(cameraPosition.latitude);
    const zoom = Math.max(4, Math.min(18, Math.log2(40075016 / cameraPosition.height) - 1));

    map.getView().animate({
        center: ol.proj.fromLonLat([longitude, latitude]),
        zoom,
        duration: 300
    });
}

function showOsmBasemap() {
    if (activeBasemap === "3d" && cesiumViewer) {
        syncCesiumViewToMap();
    }

    mapElement.hidden = false;
    cesiumElement.hidden = true;
    baseLayer.setVisible(true);
    baseLayer.setSource(new ol.source.OSM());
    activeBasemap = "osm";
    updateBasemapSelection();
    updateLegend();
    setBasemapStatus("OpenStreetMap es el mapa base activo.");
    map.updateSize();
}

basemapButtons.forEach(button => {
    button.addEventListener("click", async () => {
        if (button.dataset.basemap === "osm") {
            showOsmBasemap();
        } else if (button.dataset.basemap === "google") {
            await showGoogleBasemap("roadmap");
        } else if (button.dataset.basemap === "google-hybrid") {
            await showGoogleBasemap("hybrid");
        } else {
            await showCesiumBasemap();
        }
    });
});

/* ===================== */
/* PANELS                */
/* ===================== */

const viewerPanel =
    document.getElementById(
        "viewer-panel"
    );

const panelTitle =
    document.getElementById(
        "panel-title"
    );

const toolButtons =
    document.querySelectorAll(
        ".tool-button[data-panel]"
    );


const panelTitles = {
    layers:
        "Capas",

    services:
        "Servicios WFS/WMS",

    drawing:
        "Dibujo",

    measurement:
        "Medición",

    location:
        "Localización",

    "place-search":
        "Buscar lugar",

    reports:
        "Reportes e indicadores"
};


function openPanel(panelName) {
    viewerPanel.classList
        .remove(
            "closed"
        );

    document
        .querySelectorAll(
            ".panel-section"
        )
        .forEach(
            section => {

                section.classList
                    .remove(
                        "active"
                    );
            }
        );


    toolButtons.forEach(
        button => {

            button.classList
                .toggle(
                    "active",
                    button.dataset.panel ===
                    panelName
                );
        }
    );


    const panel =
        document.getElementById(
            `panel-${panelName}`
        );


    if (panel) {

        panel.classList
            .add(
                "active"
            );
    }


    panelTitle.textContent =
        panelTitles[panelName]
        ?? "Herramientas";


    setTimeout(
        () => {
            map.updateSize();
        },
        220
    );
}

toolButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function () {

                openPanel(
                    button.dataset.panel
                );
            }
        );
    }
);

document
    .getElementById(
        "btn-close-panel"
    )
    .addEventListener(
        "click",
        function () {

            viewerPanel.classList
                .add(
                    "closed"
                );

            toolButtons.forEach(
                button =>
                    button.classList
                        .remove(
                            "active"
                        )
            );


            setTimeout(
                () => {
                    map.updateSize();
                },
                220
            );
        }
    );

function hideTimelinePanel() {
    timelinePanel.hidden = true;
    timelinePanelButton.classList.remove("active");
    timelinePanelButton.setAttribute("aria-pressed", "false");
    timelinePanelButton.title = "Mostrar línea de tiempo";
    timelinePanelButton.setAttribute("aria-label", timelinePanelButton.title);
    setTimelineEnabled(false);
}

timelinePanelButton.addEventListener("click", () => {
    const showTimeline = timelinePanel.hidden;
    timelinePanel.hidden = !showTimeline;
    timelinePanelButton.classList.toggle("active", showTimeline);
    timelinePanelButton.setAttribute("aria-pressed", String(showTimeline));
    timelinePanelButton.title = showTimeline
        ? "Ocultar línea de tiempo"
        : "Mostrar línea de tiempo";
    timelinePanelButton.setAttribute("aria-label", timelinePanelButton.title);
    setTimelineEnabled(showTimeline);
});

timelineCloseButton.addEventListener("click", hideTimelinePanel);

function setMapLegendVisible(visible) {
    mapLegend.hidden = !visible;
    mapLegendToggleButton.classList.toggle("active", visible);
    mapLegendToggleButton.setAttribute("aria-pressed", String(visible));
    mapLegendToggleButton.title = visible ? "Ocultar leyenda" : "Mostrar leyenda";
    mapLegendToggleButton.setAttribute("aria-label", mapLegendToggleButton.title);
    if (visible) {
        updateLegend();
    }
}

mapLegendToggleButton.addEventListener("click", () => {
    setMapLegendVisible(mapLegend.hidden);
});
mapLegendCloseButton.addEventListener("click", () => setMapLegendVisible(false));

let html2canvasLoadPromise = null;

function loadHtml2Canvas() {
    if (typeof window.html2canvas === "function") {
        return Promise.resolve(window.html2canvas);
    }

    if (!html2canvasLoadPromise) {
        html2canvasLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
            script.onload = () => {
                if (typeof window.html2canvas !== "function") {
                    html2canvasLoadPromise = null;
                    reject(new Error("La biblioteca de captura no está disponible."));
                    return;
                }
                resolve(window.html2canvas);
            };
            script.onerror = () => {
                html2canvasLoadPromise = null;
                reject(new Error("No se pudo cargar la biblioteca de captura."));
            };
            document.head.appendChild(script);
        });
    }

    return html2canvasLoadPromise;
}

function clearMapScreenshotPreview() {
    if (mapScreenshotPreviewUrl) {
        URL.revokeObjectURL(mapScreenshotPreviewUrl);
        mapScreenshotPreviewUrl = null;
    }
    mapScreenshotPreview.removeAttribute("src");
    mapScreenshotBlob = null;
}

function hideMapScreenshotActions() {
    mapScreenshotActions.hidden = true;
    mapScreenshotButton.setAttribute("aria-expanded", "false");
    clearMapScreenshotPreview();
}

async function captureMapScreenshot() {
    mapScreenshotButton.disabled = true;
    mapScreenshotActions.hidden = true;
    mapScreenshotButton.setAttribute("aria-expanded", "false");
    clearMapScreenshotPreview();
    mapScreenshotStatus.textContent = "Preparando la captura del mapa…";

    try {
        const html2canvas = await loadHtml2Canvas();
        map.renderSync();
        const canvas = await html2canvas(mapContainer, {
            backgroundColor: null,
            imageTimeout: 15000,
            ignoreElements: element => element.hasAttribute("data-html2canvas-ignore"),
            logging: false,
            scale: Math.min(window.devicePixelRatio || 1, 2),
            useCORS: true
        });
        const image = await new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (!blob) {
                    reject(new Error("El navegador no pudo generar la imagen PNG."));
                    return;
                }
                resolve(blob);
            }, "image/png");
        });

        mapScreenshotBlob = image;
        mapScreenshotPreviewUrl = URL.createObjectURL(image);
        mapScreenshotPreview.src = mapScreenshotPreviewUrl;
        mapScreenshotActionsStatus.textContent = "Elige cómo quieres guardar la captura.";
        mapScreenshotActions.hidden = false;
        mapScreenshotButton.setAttribute("aria-expanded", "true");
        mapScreenshotStatus.textContent =
            `Captura lista (${canvas.width} × ${canvas.height}).`;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        mapScreenshotStatus.textContent = `No se pudo capturar el mapa: ${message}`;
    } finally {
        mapScreenshotButton.disabled = false;
    }
}

function downloadMapScreenshot() {
    if (!mapScreenshotBlob) {
        mapScreenshotActionsStatus.textContent = "Primero captura el mapa.";
        return;
    }

    const imageUrl = URL.createObjectURL(mapScreenshotBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = imageUrl;
    downloadLink.download = `geourbanlp-mapa-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(imageUrl), 60000);
    mapScreenshotActionsStatus.textContent = "La descarga de la imagen PNG ha comenzado.";
}

async function copyMapScreenshot() {
    if (!mapScreenshotBlob) {
        mapScreenshotActionsStatus.textContent = "Primero captura el mapa.";
        return;
    }

    if (!window.isSecureContext || !navigator.clipboard || typeof navigator.clipboard.write !== "function" ||
        typeof window.ClipboardItem !== "function") {
        mapScreenshotActionsStatus.textContent =
            "Copiar requiere un navegador compatible y una conexión segura (HTTPS o localhost).";
        return;
    }

    mapScreenshotCopyButton.disabled = true;
    mapScreenshotActionsStatus.textContent = "Copiando imagen…";
    try {
        await navigator.clipboard.write([
            new window.ClipboardItem({"image/png": mapScreenshotBlob})
        ]);
        mapScreenshotActionsStatus.textContent = "Imagen PNG copiada al portapapeles.";
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        mapScreenshotActionsStatus.textContent = `No se pudo copiar la imagen: ${message}`;
    } finally {
        mapScreenshotCopyButton.disabled = false;
    }
}

mapScreenshotButton.addEventListener("click", captureMapScreenshot);
mapScreenshotDownloadButton.addEventListener("click", downloadMapScreenshot);
mapScreenshotCopyButton.addEventListener("click", copyMapScreenshot);
mapScreenshotCloseButton.addEventListener("click", hideMapScreenshotActions);



/* ===================== */
/* DRAWING               */
/* ===================== */

let drawInteraction = null;
let measureInteraction = null;
let activeMeasurementFeature = null;

const drawingModifyInteraction = new ol.interaction.Modify({
    source: drawingSource
});
const measurementModifyInteraction = new ol.interaction.Modify({
    source: measurementSource
});

function setVertexEditor(type, enabled) {
    const isDrawing = type === "drawing";
    const selectedInteraction = isDrawing
        ? drawingModifyInteraction
        : measurementModifyInteraction;
    const otherInteraction = isDrawing
        ? measurementModifyInteraction
        : drawingModifyInteraction;
    const selectedButton = document.getElementById(
        isDrawing ? "btn-edit-drawing" : "btn-edit-measurement"
    );
    const otherButton = document.getElementById(
        isDrawing ? "btn-edit-measurement" : "btn-edit-drawing"
    );

    if (enabled) {
        map.removeInteraction(otherInteraction);
        otherButton.setAttribute("aria-pressed", "false");
        map.removeInteraction(selectedInteraction);
        map.addInteraction(selectedInteraction);
    } else {
        map.removeInteraction(selectedInteraction);
    }

    selectedButton.setAttribute("aria-pressed", String(enabled));
}

document.getElementById("btn-edit-drawing").addEventListener("click", () => {
    if (drawInteraction || measureInteraction) {
        document.getElementById("drawing-edit-status").textContent =
            "Termina el trazo actual antes de editar vértices.";
        return;
    }

    const enabled = document.getElementById("btn-edit-drawing")
        .getAttribute("aria-pressed") !== "true";
    setVertexEditor("drawing", enabled);
    document.getElementById("drawing-edit-status").textContent = enabled
        ? "Arrastra un vértice para moverlo o haz clic en un segmento para añadir otro."
        : "Edición de vértices desactivada.";
});

document.getElementById("btn-edit-measurement").addEventListener("click", () => {
    if (drawInteraction || measureInteraction) {
        document.getElementById("measure-result").textContent =
            "Termina la medición actual antes de editar vértices.";
        return;
    }

    const enabled = document.getElementById("btn-edit-measurement")
        .getAttribute("aria-pressed") !== "true";
    setVertexEditor("measurement", enabled);
    document.getElementById("measure-result").textContent = enabled
        ? "Arrastra un vértice o haz clic en un segmento para añadir otro."
        : "Edición de vértices desactivada.";
});

measurementModifyInteraction.on("modifyend", event => {
    event.features.forEach(feature => {
        const type = feature.get("measurementType");
        if (type) {
            activeMeasurementFeature = feature;
            document.getElementById("measure-result").textContent =
                formatMeasurement(feature.getGeometry(), type);
            updateMeasurementPopup(
                feature,
                type,
                feature.get("measurementComplete") === true
            );
        }
    });
});

measurementSource.on("changefeature", event => {
    if (event.feature === activeMeasurementFeature) {
        const type = event.feature.get("measurementType");
        document.getElementById("measure-result").textContent =
            formatMeasurement(event.feature.getGeometry(), type);
        updateMeasurementPopup(
            event.feature,
            type,
            event.feature.get("measurementComplete") === true
        );
    }
});


function activateDrawing(type) {
    if (activeBasemap === "3d") {
        showOsmBasemap();
    }

    setVertexEditor("drawing", false);
    setVertexEditor("measurement", false);

    if (drawInteraction) {
        map.removeInteraction(drawInteraction);
    }

    if (measureInteraction) {
        map.removeInteraction(measureInteraction);
        measureInteraction = null;
    }

    drawInteraction = new ol.interaction.Draw({
        source: drawingSource,
        type
    });
    drawInteraction.on("drawend", () => {
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
        setVertexEditor("drawing", true);
        document.getElementById("drawing-edit-status").textContent =
            "Arrastra un vértice para moverlo o haz clic en un segmento para añadir otro.";
    });
    map.addInteraction(drawInteraction);
}


document
    .querySelectorAll(
        "[data-draw]"
    )
    .forEach(
        button => {
            button.addEventListener(
                "click",
                function () {
                    activateDrawing(
                        button.dataset.draw
                    );
                }
            );
        }
    );


document
    .getElementById(
        "btn-clear-drawing"
    )
    .addEventListener(
        "click",
        function () {
            drawingSource.clear();
            setVertexEditor("drawing", false);

            if (drawInteraction) {
                map.removeInteraction(drawInteraction);
                drawInteraction = null;
            }
        }
    );


function formatMeasurement(geometry, type) {
    if (type === "LineString") {
        const length = ol.sphere.getLength(geometry, {
            projection: map.getView().getProjection()
        });
        return length >= 1000
            ? `Longitud: ${(length / 1000).toFixed(2)} km`
            : `Longitud: ${length.toFixed(1)} m`;
    }

    const area = ol.sphere.getArea(geometry, {
        projection: map.getView().getProjection()
    });
    return area >= 10000
        ? `Área: ${(area / 10000).toFixed(2)} ha`
        : `Área: ${area.toFixed(1)} m²`;
}


function activateMeasurement(type) {
    if (activeBasemap === "3d") {
        showOsmBasemap();
    }

    setVertexEditor("drawing", false);
    setVertexEditor("measurement", false);

    if (drawInteraction) {
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
    }

    if (measureInteraction) {
        map.removeInteraction(measureInteraction);
    }

    const result = document.getElementById("measure-result");
    measureInteraction = new ol.interaction.Draw({
        source: measurementSource,
        type
    });

    measureInteraction.on("drawstart", event => {
        activeMeasurementFeature = event.feature;
        event.feature.set("measurementType", type);
        event.feature.set("measurementComplete", false);
        const geometry = event.feature.getGeometry();
        geometry.on("change", () => {
            result.textContent = formatMeasurement(geometry, type);
            updateMeasurementPopup(event.feature, type, false);
        });
    });

    measureInteraction.on("drawend", event => {
        event.feature.set("measurementType", type);
        event.feature.set("measurementComplete", true);
        result.textContent = formatMeasurement(event.feature.getGeometry(), type);
        map.removeInteraction(measureInteraction);
        measureInteraction = null;
        setVertexEditor("measurement", true);
        result.textContent =
            `${formatMeasurement(event.feature.getGeometry(), type)}. Arrastra un vértice o haz clic en un segmento para editar.`;
        updateMeasurementPopup(event.feature, type, true);
    });

    result.textContent = type === "LineString"
        ? "Haz clic en el mapa para trazar una línea; doble clic para terminar."
        : "Haz clic en el mapa para trazar un área; doble clic para terminar.";
    map.addInteraction(measureInteraction);
}


document.querySelectorAll("[data-measure]").forEach(button => {
    button.addEventListener("click", () => {
        activateMeasurement(button.dataset.measure);
    });
});


document.getElementById("btn-clear-measurement").addEventListener("click", () => {
    measurementSource.clear();
    activeMeasurementFeature = null;
    if (featurePopup && featurePopup.classList.contains("measurement-popup")) {
        featurePopup.hidden = true;
        featurePopup.classList.remove("measurement-popup");
    }
    setVertexEditor("measurement", false);
    if (measureInteraction) {
        map.removeInteraction(measureInteraction);
        measureInteraction = null;
    }
    document.getElementById("measure-result").textContent =
        "Selecciona una herramienta para comenzar.";
});


/* ===================== */
/* LOCATION              */
/* ===================== */

function goToCoordinate() {
    const longitudeInput = document.getElementById("input-longitude");
    const latitudeInput = document.getElementById("input-latitude");
    const longitude = Number(longitudeInput.value);
    const latitude = Number(latitudeInput.value);

    if (
        !longitudeInput.value.trim() ||
        !latitudeInput.value.trim() ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
    ) {
        document.getElementById("location-pick-status").textContent =
            "Ingresa una longitud entre -180 y 180 y una latitud entre -90 y 90.";
        return;
    }

    stopCoordinatePick();

    if (activeBasemap === "3d") {
        showOsmBasemap();
    }

    const coordinate = ol.proj.fromLonLat([longitude, latitude]);
    locationSource.clear();
    locationSource.addFeature(new ol.Feature({
        geometry: new ol.geom.Point(coordinate)
    }));

    map
        .getView()
        .animate({

            center: coordinate,

            zoom:
                16,

            duration:
                600
        });
}

let coordinatePickActive = false;

function stopCoordinatePick() {
    coordinatePickActive = false;
    document.getElementById("btn-pick-coordinate")
        .setAttribute("aria-pressed", "false");
    mapElement.classList.remove("pick-coordinate");
}

document.getElementById("btn-pick-coordinate").addEventListener("click", () => {
    if (activeBasemap === "3d") {
        showOsmBasemap();
    }

    coordinatePickActive = !coordinatePickActive;
    document.getElementById("btn-pick-coordinate")
        .setAttribute("aria-pressed", String(coordinatePickActive));
    mapElement.classList.toggle("pick-coordinate", coordinatePickActive);
    document.getElementById("location-pick-status").textContent =
        coordinatePickActive
            ? "Haz clic en el mapa para colocar el punto y extraer sus coordenadas."
            : "Selección de punto cancelada.";
    map.updateSize();
});


let geolocationWatchId = null;
let hasInitialLocationFix = false;

const userLocationButton = document.getElementById("btn-my-location");
const locationPickStatus = document.getElementById("location-pick-status");

function stopLocationTracking() {
    if (geolocationWatchId !== null) {
        navigator.geolocation.clearWatch(geolocationWatchId);
        geolocationWatchId = null;
    }

    hasInitialLocationFix = false;
    userLocationButton.setAttribute("aria-pressed", "false");
    userLocationButton.textContent = "Seguir mi ubicación";
}

function updateUserLocation(position) {
    const longitude = position.coords.longitude;
    const latitude = position.coords.latitude;
    const coordinate = ol.proj.fromLonLat([longitude, latitude]);
    const accuracy = position.coords.accuracy / Math.cos(latitude * Math.PI / 180);

    userLocationSource.clear();
    userLocationSource.addFeatures([
        new ol.Feature({
            geometry: new ol.geom.Circle(coordinate, accuracy)
        }),
        new ol.Feature({
            geometry: new ol.geom.Point(coordinate)
        })
    ]);

    const view = map.getView();
    if (!hasInitialLocationFix) {
        view.animate({
            center: coordinate,
            zoom: 16,
            duration: 600
        });
        hasInitialLocationFix = true;
    } else {
        view.setCenter(coordinate);
    }

    locationPickStatus.textContent =
        `Siguiendo ubicación en tiempo real · ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(position.coords.accuracy)} m).`;
}

function locateUser() {
    if (!navigator.geolocation) {
        locationPickStatus.textContent =
            "Este navegador no permite obtener la ubicación actual.";
        return;
    }

    if (geolocationWatchId !== null) {
        stopLocationTracking();
        locationPickStatus.textContent = "Seguimiento de ubicación detenido.";
        return;
    }

    if (activeBasemap === "3d") {
        showOsmBasemap();
    }

    userLocationButton.setAttribute("aria-pressed", "true");
    userLocationButton.textContent = "Dejar de seguir ubicación";
    locationPickStatus.textContent =
        "Solicitando permiso para seguir la ubicación en tiempo real…";

    try {
        geolocationWatchId = navigator.geolocation.watchPosition(
            updateUserLocation,
            error => {
                stopLocationTracking();
                locationPickStatus.textContent =
                    `No se pudo seguir la ubicación: ${error.message}`;
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 15000
            }
        );
    } catch (error) {
        stopLocationTracking();
        locationPickStatus.textContent =
            `No se pudo iniciar el seguimiento de ubicación: ${error.message}`;
    }
}


document
    .getElementById(
        "btn-go-coordinate"
    )
    .addEventListener(
        "click",
        goToCoordinate
    );


document
    .getElementById(
        "btn-my-location"
    )
    .addEventListener(
        "click",
        locateUser
    );

const placeSearchForm = document.getElementById("place-search-form");
const placeSearchMode = document.getElementById("place-search-mode");
const placeSearchInput = document.getElementById("place-search-input");
const placeSearchQueryLabel = document.getElementById("place-search-query-label");
const placeSearchButton = document.getElementById("btn-search-place");
const placeSearchStatus = document.getElementById("place-search-status");
const placeSearchResults = document.getElementById("place-search-results");
const placeSearchAttribution = document.getElementById("place-search-attribution");
let lastPlaceSearchAt = 0;
let placeSearchPending = false;

function normalizePlaceSearchText(value) {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("es-PE");
}

function updatePlaceSearchMode() {
    const modeSettings = {
        address: {
            label: "Nombre o dirección",
            placeholder: "Ej. Larcomar, Miraflores",
            button: "Buscar lugar",
            status: "Ingresa una dirección o lugar para buscarlo en Perú."
        },
        plaza: {
            label: "Nombre de la plaza",
            placeholder: "Ej. Lima",
            button: "Buscar plaza",
            status: "Busca una plaza configurada en Administración."
        },
        terrain: {
            label: "Código, nombre o distrito",
            placeholder: "Ej. HU-DEMO-001 o Lurín",
            button: "Buscar terreno",
            status: "Busca en los terrenos de las capas vectoriales cargadas."
        }
    };
    const settings = modeSettings[placeSearchMode.value];
    placeSearchQueryLabel.textContent = settings.label;
    placeSearchInput.placeholder = settings.placeholder;
    placeSearchButton.textContent = settings.button;
    placeSearchStatus.textContent = settings.status;
    placeSearchAttribution.hidden = placeSearchMode.value === "terrain";
    placeSearchResults.replaceChildren();
}

function createPlaceResultButton(iconName, label, ariaLabel, onSelect) {
    const resultButton = document.createElement("button");
    resultButton.className = "place-result-button";
    resultButton.type = "button";
    resultButton.setAttribute("aria-label", ariaLabel);

    const icon = document.createElement("span");
    icon.className = "material-icons";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = iconName;

    const name = document.createElement("span");
    name.textContent = label;
    resultButton.append(icon, name);
    resultButton.addEventListener("click", onSelect);
    return resultButton;
}

function showPlaceOnMap(longitude, latitude, label) {
    if (activeBasemap === "3d") {
        showOsmBasemap();
    }

    const coordinate = ol.proj.fromLonLat([longitude, latitude]);
    locationSource.clear();
    locationSource.addFeature(new ol.Feature({
        geometry: new ol.geom.Point(coordinate)
    }));
    map.getView().animate({
        center: coordinate,
        zoom: 16,
        duration: 600
    });
    placeSearchStatus.textContent = `Ubicación mostrada en el mapa: ${label}.`;
}

async function searchNominatim(query) {
    const delay = Math.max(0, 1000 - (Date.now() - lastPlaceSearchAt));
    if (delay > 0) {
        await new Promise(resolve => window.setTimeout(resolve, delay));
    }

    const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
    searchUrl.searchParams.set("format", "jsonv2");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("countrycodes", "pe");
    searchUrl.searchParams.set("addressdetails", "1");
    searchUrl.searchParams.set("limit", "5");
    searchUrl.searchParams.set("accept-language", "es");
    lastPlaceSearchAt = Date.now();

    const response = await fetch(searchUrl, {
        headers: {
            Accept: "application/json"
        }
    });
    if (!response.ok) {
        throw new Error(`El servicio de búsqueda respondió HTTP ${response.status}.`);
    }

    const places = await response.json();
    if (!Array.isArray(places)) {
        throw new Error("El servicio devolvió una respuesta de búsqueda no válida.");
    }

    return places.filter(place =>
        place &&
        typeof place.display_name === "string" &&
        Number.isFinite(Number(place.lat)) &&
        Number.isFinite(Number(place.lon)) &&
        Number(place.lat) >= -90 &&
        Number(place.lat) <= 90 &&
        Number(place.lon) >= -180 &&
        Number(place.lon) <= 180
    );
}

function renderGeographicResults(places) {
    placeSearchResults.replaceChildren();
    if (places.length === 0) {
        placeSearchStatus.textContent = "No se encontraron lugares coincidentes en Perú.";
        return;
    }

    places.forEach(place => {
        const resultButton = createPlaceResultButton(
            "place",
            place.display_name,
            `Mostrar ${place.display_name} en el mapa`,
            () => showPlaceOnMap(Number(place.lon), Number(place.lat), place.display_name)
        );
        placeSearchResults.append(resultButton);
    });
    placeSearchStatus.textContent =
        `Se encontraron ${places.length} resultados. Selecciona uno para verlo en el mapa.`;
}

function getConfiguredPlazas() {
    const savedState = localStorage.getItem("geourbanlp-admin-prototype-v1");
    if (!savedState) {
        return [];
    }

    const adminState = JSON.parse(savedState);
    if (!adminState || !Array.isArray(adminState.plazas)) {
        throw new Error("La configuración de plazas guardada no tiene un formato válido.");
    }

    if (adminState.plazas.some(plaza =>
        !plaza || typeof plaza.name !== "string" || !plaza.name.trim()
    )) {
        throw new Error("La configuración de plazas contiene nombres vacíos o inválidos.");
    }

    return adminState.plazas;
}

function renderPlazaResults(query) {
    const normalizedQuery = normalizePlaceSearchText(query);
    const plazas = getConfiguredPlazas();
    if (plazas.length === 0) {
        placeSearchStatus.textContent =
            "No hay plazas configuradas. Agrégalas en el módulo Administración.";
        return;
    }

    const matches = plazas.filter(plaza =>
        normalizePlaceSearchText(plaza.name).includes(normalizedQuery)
    );
    if (matches.length === 0) {
        placeSearchStatus.textContent = "No se encontraron plazas con ese nombre.";
        return;
    }

    matches.forEach(plaza => {
        const resultButton = createPlaceResultButton(
            "location_city",
            `${plaza.name} · Buscar ubicación en Perú`,
            `Buscar la ubicación de la plaza ${plaza.name}`,
            async () => {
                if (placeSearchPending) {
                    return;
                }

                placeSearchPending = true;
                placeSearchButton.disabled = true;
                placeSearchResults.replaceChildren();
                placeSearchStatus.textContent = `Buscando la plaza ${plaza.name} en Perú…`;
                try {
                    renderGeographicResults(
                        await searchNominatim(`${plaza.name}, Perú`)
                    );
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    placeSearchStatus.textContent = `No se pudo buscar la plaza: ${message}`;
                } finally {
                    placeSearchPending = false;
                    placeSearchButton.disabled = false;
                }
            }
        );
        placeSearchResults.append(resultButton);
    });
    placeSearchStatus.textContent =
        `Se encontraron ${matches.length} plazas. Selecciona una para ubicarla en el mapa.`;
}

function getTerrainSearchRecords(query) {
    const normalizedQuery = normalizePlaceSearchText(query);
    return externalLayers.flatMap(entry =>
        (Array.isArray(entry.features) ? entry.features : [])
            .map((feature, index) => ({entry, feature, index}))
            .filter(({feature}) => {
                const geometry = feature.getGeometry();
                if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.getType())) {
                    return false;
                }

                return Object.entries(feature.getProperties()).some(([key, value]) =>
                    key !== feature.getGeometryName() &&
                    ["string", "number", "boolean"].includes(typeof value) &&
                    normalizePlaceSearchText(value).includes(normalizedQuery)
                );
            })
    );
}

function includeTerrainInTimeline(feature) {
    const registrationDate = getFeatureRegistrationDate(feature);
    if (!timelineEnabled || registrationDate === null || !timelineStartRange.dataset.startDate) {
        return;
    }

    const startDate = Number(timelineStartRange.dataset.startDate);
    const selectedDay = Math.round((registrationDate - startDate) / millisecondsPerDay);
    const startDay = Number(timelineStartRange.value);
    const endDay = Number(timelineEndRange.value);
    timelineStartRange.value = String(Math.min(startDay, selectedDay));
    timelineEndRange.value = String(Math.max(endDay, selectedDay));
    timelineStartRange.max = timelineEndRange.value;
    timelineEndRange.min = timelineStartRange.value;
    updateTimelineFilter();
}

function showTerrainOnMap(entry, feature, label) {
    const geometry = feature.getGeometry();
    if (!geometry) {
        placeSearchStatus.textContent = `El terreno "${label}" no tiene geometría para mostrar.`;
        return;
    }

    if (activeBasemap === "3d") {
        showOsmBasemap();
    }
    entry.layer.setVisible(true);
    renderManagedLayers();
    updateLegend();
    includeTerrainInTimeline(feature);

    const extent = geometry.getExtent();
    if (ol.extent.isEmpty(extent)) {
        placeSearchStatus.textContent = `El terreno "${label}" no tiene una extensión válida.`;
        return;
    }

    const coordinate = ol.extent.getCenter(extent);
    locationSource.clear();
    locationSource.addFeature(new ol.Feature({
        geometry: new ol.geom.Point(coordinate)
    }));
    map.getView().fit(extent, {
        padding: [40, 40, 40, 40],
        maxZoom: 17,
        duration: 600
    });
    placeSearchStatus.textContent = `Terreno mostrado en el mapa: ${label}.`;
}

function renderTerrainResults(query) {
    const matches = getTerrainSearchRecords(query);
    if (matches.length === 0) {
        placeSearchStatus.textContent =
            "No se encontraron terrenos coincidentes en las capas vectoriales cargadas.";
        return;
    }

    const visibleMatches = matches.slice(0, 50);
    visibleMatches.forEach(({entry, feature, index}) => {
        const properties = feature.getProperties();
        const name = properties.nombre || properties.name || properties.terreno ||
            properties.codigo || `Terreno ${index + 1}`;
        const code = properties.codigo && properties.codigo !== name
            ? String(properties.codigo)
            : "";
        const district = properties.distrito || properties.district || "";
        const label = [name, code, district, entry.name]
            .filter(Boolean)
            .join(" · ");
        const resultButton = createPlaceResultButton(
            "landscape",
            label,
            `Mostrar terreno ${label} en el mapa`,
            () => showTerrainOnMap(entry, feature, String(name))
        );
        placeSearchResults.append(resultButton);
    });

    placeSearchStatus.textContent = matches.length > visibleMatches.length
        ? `Se encontraron ${matches.length} terrenos. Mostrando los primeros ${visibleMatches.length}.`
        : `Se encontraron ${matches.length} terrenos. Selecciona uno para verlo en el mapa.`;
}

placeSearchMode.addEventListener("change", updatePlaceSearchMode);

placeSearchForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (placeSearchPending) {
        return;
    }

    const query = placeSearchInput.value.trim();
    if (!query) {
        placeSearchStatus.textContent = "Escribe un término para iniciar la búsqueda.";
        return;
    }

    placeSearchResults.replaceChildren();
    if (placeSearchMode.value === "plaza") {
        try {
            renderPlazaResults(query);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            placeSearchStatus.textContent = `No se pudieron leer las plazas: ${message}`;
        }
        return;
    }
    if (placeSearchMode.value === "terrain") {
        renderTerrainResults(query);
        return;
    }

    placeSearchPending = true;
    placeSearchButton.disabled = true;
    placeSearchStatus.textContent = "Buscando lugares en Perú…";
    try {
        renderGeographicResults(await searchNominatim(query));
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        placeSearchStatus.textContent = `No se pudo buscar el lugar: ${message}`;
    } finally {
        placeSearchPending = false;
        placeSearchButton.disabled = false;
    }
});

updatePlaceSearchMode();


/* ===================== */
/* LAYER VISIBILITY      */
/* ===================== */

/*
    Connect your real PostGIS/API layers
    here later.

    Example:

    const applicationLayers = {
        terrenos: terrenosLayer,
        zonificacion: zonificacionLayer,
        vias: viasLayer
    };
*/

const applicationLayers = {};


document
    .querySelectorAll(
        "[data-layer]"
    )
    .forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                function () {

                    const layer =
                        applicationLayers[
                            checkbox.dataset.layer
                        ];


                    if (!layer) {
                        return;
                    }


                    layer.setVisible(
                        checkbox.checked
                    );
                }
            );
        }
    );

/* ===================== */
/* EXTERNAL LAYERS       */
/* ===================== */

const serviceStatus = document.getElementById("service-status");
let jsZipLoadPromise = null;

function setServiceStatus(message) {
    serviceStatus.textContent = message;
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function createCategoryStyle(color) {
    return new ol.style.Style({
        fill: new ol.style.Fill({
            color: `${color}40`
        }),
        stroke: new ol.style.Stroke({
            color,
            width: 2
        }),
        image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
                color
            }),
            stroke: new ol.style.Stroke({
                color: "#FFFFFF",
                width: 1
            })
        })
    });
}

function createLegendLayer(entry) {
    const legendLayer = document.createElement("section");
    legendLayer.className = "legend-layer";

    const title = document.createElement("div");
    title.className = "legend-layer-title";
    title.textContent = entry.name;
    const visibility = document.createElement("span");
    visibility.className = "legend-layer-visibility";
    visibility.textContent = entry.layer.getVisible() ? "Visible" : "Oculta";
    legendLayer.append(title, visibility);

    if (entry.categories.length > 0) {
        const items = document.createElement("div");
        items.className = "legend-items";
        entry.categories.forEach(category => {
            const item = document.createElement("div");
            item.className = "category-item";
            const swatch = document.createElement("span");
            swatch.className = "legend-swatch";
            swatch.style.backgroundColor = category.color;
            const label = document.createElement("span");
            label.textContent = category.label;
            item.append(swatch, label);
            items.append(item);
        });
        legendLayer.append(items);
    } else {
        const description = document.createElement("p");
        description.className = "empty-layer-message";
        description.textContent = entry.type === "WMS"
            ? "Simbología predeterminada del servicio."
            : "Sin simbología categorizada.";
        legendLayer.append(description);

        if (entry.type === "WMS") {
            const legendUrl = new URL(entry.serviceUrl);
            legendUrl.searchParams.set("SERVICE", "WMS");
            legendUrl.searchParams.set("REQUEST", "GetLegendGraphic");
            legendUrl.searchParams.set("VERSION", "1.1.1");
            legendUrl.searchParams.set("FORMAT", "image/png");
            legendUrl.searchParams.set("LAYER", entry.layerName);
            const legendImage = document.createElement("img");
            legendImage.className = "wms-legend-image";
            legendImage.alt = `Leyenda del servicio ${entry.name}`;
            legendImage.src = legendUrl.href;
            legendImage.addEventListener("error", () => {
                legendImage.remove();
                description.textContent = "El servicio no ofrece una leyenda GetLegendGraphic.";
            }, {once: true});
            legendLayer.append(legendImage);
        }
    }

    return legendLayer;
}

function createLegendSubgroup(title, entries) {
    const subgroup = document.createElement("section");
    subgroup.className = "legend-subgroup";
    const heading = document.createElement("h3");
    heading.className = "legend-subgroup-title";
    heading.textContent = title;
    subgroup.append(heading);

    if (entries.length > 0) {
        entries.forEach(entry => subgroup.append(createLegendLayer(entry)));
    } else {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-layer-message";
        emptyMessage.textContent = "No hay capas con simbología para mostrar.";
        subgroup.append(emptyMessage);
    }

    return subgroup;
}

function createLegendGroup(title) {
    const group = document.createElement("section");
    group.className = "legend-group";
    const heading = document.createElement("h2");
    heading.className = "legend-group-title";
    heading.textContent = title;
    group.append(heading);
    return group;
}

function updateLegend() {
    legendContent.replaceChildren();

    const activeLayers = externalLayers.filter(entry => entry.layer.getVisible());
    const portalLayers = activeLayers.filter(entry => entry.group === "portales");
    if (portalLayers.length > 0) {
        const portalGroup = createLegendGroup("Los Portales");
        const realEstateLayers = portalLayers.filter(entry => entry.subgroup === "inmobiliario");
        const architectureLayers = portalLayers.filter(entry => entry.subgroup === "arquitectonico");
        if (realEstateLayers.length > 0) {
            portalGroup.append(createLegendSubgroup("Desarrollo Inmobiliario", realEstateLayers));
        }
        if (architectureLayers.length > 0) {
            portalGroup.append(createLegendSubgroup("Desarrollo Arquitectónico", architectureLayers));
        }
        legendContent.append(portalGroup);
    }

    const serviceLayers = activeLayers.filter(entry => entry.group === "services");
    const fileLayers = activeLayers.filter(entry => entry.group === "files");
    if (serviceLayers.length > 0 || fileLayers.length > 0) {
        const informationGroup = createLegendGroup("Información Base");
        if (serviceLayers.length > 0) {
            informationGroup.append(createLegendSubgroup("Capas de servicios WFS/WMS", serviceLayers));
        }
        if (fileLayers.length > 0) {
            informationGroup.append(
                createLegendSubgroup(
                    "Capas de ejemplo e importadas (GeoJSON/KML/KMZ)",
                    fileLayers
                )
            );
        }
        legendContent.append(informationGroup);
    }

    const basemapGroup = createLegendGroup("Mapa Base");
    const baseLegend = document.createElement("section");
    baseLegend.className = "legend-layer";
    const baseTitle = document.createElement("div");
    baseTitle.className = "legend-layer-title";
    baseTitle.textContent = "Mapa base activo";
    const baseDescription = document.createElement("p");
    baseDescription.className = "empty-layer-message";
    baseDescription.textContent = {
        osm: "OpenStreetMap",
        google: "Google Maps",
        "google-hybrid": "Google Híbrido",
        "3d": "Cesium 3D con edificios de OpenStreetMap"
    }[activeBasemap];
    baseLegend.append(baseTitle, baseDescription);
    basemapGroup.append(baseLegend);
    legendContent.append(basemapGroup);
}

function getFeatureRegistrationDate(feature) {
    const value = feature.get("fecha_registro");
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const timestamp = Date.parse(`${value}T00:00:00.000Z`);
    return Number.isFinite(timestamp) &&
        new Date(timestamp).toISOString().slice(0, 10) === value
        ? timestamp
        : null;
}

function getTimelineEntries() {
    return externalLayers
        .map(entry => ({
            entry,
            datedFeatures: entry.features.filter(feature =>
                getFeatureRegistrationDate(feature) !== null
            )
        }))
        .filter(group => group.datedFeatures.length > 0);
}

function formatTimelineDate(timestamp) {
    return new Intl.DateTimeFormat("es-PE", {
        dateStyle: "long",
        timeZone: "UTC"
    }).format(new Date(timestamp));
}

function updateTimelineFilter() {
    const startDate = Number(timelineStartRange.dataset.startDate);
    const fromDate = startDate + Number(timelineStartRange.value) * millisecondsPerDay;
    const throughDate = startDate + Number(timelineEndRange.value) * millisecondsPerDay;
    let visibleCount = 0;
    let datedCount = 0;

    getTimelineEntries().forEach(({entry}) => {
        const source = entry.layer.getSource();
        if (!source || typeof source.clear !== "function" || typeof source.addFeatures !== "function") {
            return;
        }

        const visibleFeatures = entry.features.filter(feature => {
            const registrationDate = getFeatureRegistrationDate(feature);
            if (registrationDate === null) {
                return true;
            }

            datedCount += 1;
            const isVisible = !timelineEnabled ||
                (registrationDate >= fromDate && registrationDate <= throughDate);
            if (isVisible) {
                visibleCount += 1;
            }
            return isVisible;
        });
        source.clear(true);
        source.addFeatures(visibleFeatures);
    });

    const fromDateLabel = formatTimelineDate(fromDate);
    const throughDateLabel = formatTimelineDate(throughDate);
    timelineStartOutput.textContent = fromDateLabel;
    timelineEndOutput.textContent = throughDateLabel;
    const daySpan = Number(timelineEndRange.max);
    const startPercentage = daySpan > 0
        ? Number(timelineStartRange.value) / daySpan * 100
        : 0;
    const endPercentage = daySpan > 0
        ? Number(timelineEndRange.value) / daySpan * 100
        : 0;
    timelineRangeSlider.style.setProperty("--timeline-range-start", `${startPercentage}%`);
    timelineRangeSlider.style.setProperty("--timeline-range-end", `${endPercentage}%`);
    timelineStatus.textContent = timelineEnabled
        ? `Mostrando ${visibleCount} de ${datedCount} entidades registradas entre el ${fromDateLabel} y el ${throughDateLabel}.`
        : `${datedCount} entidades con fecha disponibles. Filtro temporal desactivado.`;
}

function updateTimelineControls() {
    const datedFeatures = getTimelineEntries()
        .flatMap(group => group.datedFeatures);
    if (datedFeatures.length === 0) {
        delete timelineStartRange.dataset.startDate;
        timelineStartRange.max = "0";
        timelineStartRange.value = "0";
        timelineEndRange.max = "0";
        timelineEndRange.value = "0";
        timelineStartRange.disabled = true;
        timelineEndRange.disabled = true;
        timelineStartOutput.textContent = "Sin datos";
        timelineEndOutput.textContent = "Sin datos";
        timelineRangeSlider.style.setProperty("--timeline-range-start", "0%");
        timelineRangeSlider.style.setProperty("--timeline-range-end", "0%");
        timelineStatus.textContent = timelineEnabled
            ? "La línea de tiempo está activa. Carga una capa que incluya el atributo fecha_registro para filtrar."
            : "Carga una capa que incluya el atributo fecha_registro para usar la línea de tiempo.";
        return;
    }

    const timestamps = datedFeatures.map(getFeatureRegistrationDate);
    const earliestDate = timestamps.reduce((earliest, timestamp) =>
        Math.min(earliest, timestamp)
    );
    const latestDate = timestamps.reduce((latest, timestamp) =>
        Math.max(latest, timestamp)
    );
    const daySpan = String(Math.floor((latestDate - earliestDate) / millisecondsPerDay));
    timelineStartRange.dataset.startDate = String(earliestDate);
    timelineStartRange.min = "0";
    timelineStartRange.max = daySpan;
    timelineStartRange.value = "0";
    timelineEndRange.min = "0";
    timelineEndRange.max = daySpan;
    timelineEndRange.value = daySpan;
    timelineStartRange.disabled = !timelineEnabled;
    timelineEndRange.disabled = !timelineEnabled;
    updateTimelineFilter();
}

function setTimelineEnabled(enabled) {
    timelineEnabled = enabled;
    const hasDateRange = Boolean(timelineStartRange.dataset.startDate);
    timelineStartRange.disabled = !timelineEnabled || !hasDateRange;
    timelineEndRange.disabled = !timelineEnabled || !hasDateRange;

    if (hasDateRange) {
        updateTimelineFilter();
    } else {
        timelineStatus.textContent = timelineEnabled
            ? "La línea de tiempo está activa. Carga una capa que incluya el atributo fecha_registro para filtrar."
            : "Carga una capa que incluya el atributo fecha_registro para usar la línea de tiempo.";
    }
}

timelineStartRange.addEventListener("input", () => {
    timelineEndRange.min = timelineStartRange.value;
    updateTimelineFilter();
});
timelineEndRange.addEventListener("input", () => {
    timelineStartRange.max = timelineEndRange.value;
    updateTimelineFilter();
});
timelineRangeSlider.addEventListener("pointerdown", event => {
    if (!timelineEnabled ||
        (event.target !== timelineRangeSlider &&
            event.target !== timelineRangeSelection &&
            event.target !== timelineRangeSlider.querySelector(".timeline-range-track"))) {
        return;
    }

    const bounds = timelineRangeSlider.getBoundingClientRect();
    if (!bounds.width) {
        return;
    }

    const daySpan = Number(timelineEndRange.max);
    const pointerRatio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const selectedDay = Math.round(pointerRatio * daySpan);
    const startDay = Number(timelineStartRange.value);
    const endDay = Number(timelineEndRange.value);

    if (Math.abs(selectedDay - startDay) <= Math.abs(selectedDay - endDay)) {
        timelineStartRange.value = String(Math.min(selectedDay, endDay));
        timelineEndRange.min = timelineStartRange.value;
    } else {
        timelineEndRange.value = String(Math.max(selectedDay, startDay));
        timelineStartRange.max = timelineEndRange.value;
    }
    updateTimelineFilter();
});

function renderManagedLayerGroup(container, entries, emptyMessage) {
    container.replaceChildren();
    if (entries.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-layer-message";
        message.textContent = emptyMessage;
        container.append(message);
        return;
    }

    entries.forEach(entry => {
        const card = document.createElement("div");
        card.className = "managed-layer-card";
        const header = document.createElement("div");
        header.className = "managed-layer-header";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = entry.layer.getVisible();
        checkbox.setAttribute("aria-label", `Mostrar ${entry.name}`);
        checkbox.addEventListener("change", () => {
            entry.layer.setVisible(checkbox.checked);
            updateLegend();
        });
        const name = document.createElement("span");
        name.className = "managed-layer-name";
        name.textContent = entry.name;
        if (entry.features.length > 0) {
            const zoomButton = document.createElement("button");
            zoomButton.className = "zoom-layer-button";
            zoomButton.type = "button";
            zoomButton.setAttribute("aria-label", `Acercar a ${entry.name}`);
            zoomButton.title = `Acercar a ${entry.name}`;
            const zoomIcon = document.createElement("span");
            zoomIcon.className = "material-icons";
            zoomIcon.setAttribute("aria-hidden", "true");
            zoomIcon.textContent = "zoom_in_map";
            zoomButton.append(zoomIcon);
            zoomButton.addEventListener("click", () => {
                if (activeBasemap === "3d") {
                    showOsmBasemap();
                }

                const extent = entry.layer.getSource().getExtent();
                if (ol.extent.isEmpty(extent)) {
                    setServiceStatus(`La capa "${entry.name}" no tiene una extensión válida.`);
                    return;
                }

                map.getView().fit(extent, {
                    padding: [40, 40, 40, 40],
                    maxZoom: 16,
                    duration: 500
                });
            });
            header.append(checkbox, name, zoomButton);
        } else {
            header.append(checkbox, name);
        }
        const removeButton = document.createElement("button");
        removeButton.className = "remove-layer-button";
        removeButton.type = "button";
        removeButton.setAttribute("aria-label", `Quitar ${entry.name}`);
        removeButton.textContent = "×";
        removeButton.addEventListener("click", () => {
            map.removeLayer(entry.layer);
            externalLayers.splice(externalLayers.indexOf(entry), 1);
            renderManagedLayers();
            renderSymbologyControls();
            updateLegend();
            updateTimelineControls();
            setServiceStatus(`Se quitó la capa "${entry.name}".`);
        });
        header.append(removeButton);
        card.append(header);
        container.append(card);
    });
}

function renderManagedLayers() {
    renderManagedLayerGroup(
        managedServiceLayersContainer,
        externalLayers.filter(entry => entry.type === "WFS" || entry.type === "WMS"),
        "Conecta un servicio WFS/WMS desde la herramienta Servicios para agregar capas base."
    );
    renderManagedLayerGroup(
        managedFileLayersContainer,
        externalLayers.filter(entry =>
            entry.type === "GeoJSON" || entry.type === "KML" || entry.type === "KMZ"
        ),
        "Los datos GeoJSON de ejemplo y los archivos KML/KMZ aparecerán aquí."
    );
}

function renderCategoryEditor(entry, container) {
    container.replaceChildren();

    if (entry.categories.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-layer-message";
        message.textContent = "No hay categorías para mostrar.";
        container.append(message);
        return;
    }

    entry.categories.forEach(category => {
        const row = document.createElement("div");
        row.className = "category-item";
        const label = document.createElement("span");
        label.textContent = category.label;
        const color = document.createElement("input");
        color.type = "color";
        color.value = category.color;
        color.setAttribute("aria-label", `Color para ${category.label}`);
        color.addEventListener("change", () => {
            category.color = color.value;
            if (entry.type === "WMS") {
                applyWmsCategories(entry);
            } else {
                applyVectorCategories(entry);
            }
            updateLegend();
        });
        row.append(label, color);
        container.append(row);
    });
}

function applyVectorCategories(entry) {
    entry.features.forEach(feature => feature.setStyle(undefined));
    entry.styleCache = new Map();
    entry.categories.forEach(category => {
        entry.styleCache.set(category.value, createCategoryStyle(category.color));
    });

    entry.layer.setStyle(feature => {
        const rawValue = feature.get(entry.field);
        const value = rawValue === null || rawValue === undefined
            ? ""
            : String(rawValue);
        return entry.styleCache.get(value) || createCategoryStyle("#547C8A");
    });
    updateLegend();
}

function createVectorCategories(entry, field) {
    const values = new Set();
    entry.features.forEach(feature => {
        const value = feature.get(field);
        values.add(value === null || value === undefined ? "" : String(value));
    });

    const uniqueValues = [...values].sort((first, second) =>
        first.localeCompare(second, undefined, {numeric: true})
    );
    const previousColors = new Map(
        entry.categories.map(category => [category.value, category.color])
    );

    entry.field = field;
    entry.categories = uniqueValues.slice(0, 100).map((value, index) => ({
        value,
        label: value || "(Sin dato)",
        color: previousColors.get(value) || categoryPalette[index % categoryPalette.length]
    }));

    if (uniqueValues.length > 100) {
        setServiceStatus(`La capa "${entry.name}" tiene ${uniqueValues.length} categorías; se muestran las primeras 100.`);
    }

    applyVectorCategories(entry);
}

function makeWmsSld(entry) {
    const rules = entry.categories.map(category => `
        <sld:Rule>
            <sld:Name>${escapeXml(category.label)}</sld:Name>
            <ogc:Filter>
                <ogc:PropertyIsEqualTo>
                    <ogc:PropertyName>${escapeXml(entry.field)}</ogc:PropertyName>
                    <ogc:Literal>${escapeXml(category.value)}</ogc:Literal>
                </ogc:PropertyIsEqualTo>
            </ogc:Filter>
            <sld:PolygonSymbolizer>
                <sld:Fill><sld:CssParameter name="fill">${category.color}</sld:CssParameter><sld:CssParameter name="fill-opacity">0.25</sld:CssParameter></sld:Fill>
                <sld:Stroke><sld:CssParameter name="stroke">${category.color}</sld:CssParameter><sld:CssParameter name="stroke-width">2</sld:CssParameter></sld:Stroke>
            </sld:PolygonSymbolizer>
            <sld:LineSymbolizer>
                <sld:Stroke><sld:CssParameter name="stroke">${category.color}</sld:CssParameter><sld:CssParameter name="stroke-width">2</sld:CssParameter></sld:Stroke>
            </sld:LineSymbolizer>
            <sld:PointSymbolizer>
                <sld:Graphic><sld:Mark><sld:WellKnownName>circle</sld:WellKnownName><sld:Fill><sld:CssParameter name="fill">${category.color}</sld:CssParameter></sld:Fill></sld:Mark><sld:Size>8</sld:Size></sld:Graphic>
            </sld:PointSymbolizer>
        </sld:Rule>`).join("");

    return `<sld:StyledLayerDescriptor version="1.0.0" xmlns:sld="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc"><sld:NamedLayer><sld:Name>${escapeXml(entry.layerName)}</sld:Name><sld:UserStyle><sld:FeatureTypeStyle>${rules}</sld:FeatureTypeStyle></sld:UserStyle></sld:NamedLayer></sld:StyledLayerDescriptor>`;
}

function applyWmsCategories(entry) {
    if (!entry.field || entry.categories.length === 0) {
        return;
    }

    entry.layer.getSource().updateParams({
        SLD_BODY: makeWmsSld(entry)
    });
}

function renderSymbologyControls() {
    serviceLayerControls.replaceChildren();

    if (externalLayers.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-layer-message";
        message.textContent = "Las herramientas de simbología aparecerán al agregar una capa.";
        serviceLayerControls.append(message);
        return;
    }

    externalLayers.forEach(entry => {
        const card = document.createElement("div");
        card.className = "service-symbology-card";
        const title = document.createElement("strong");
        title.textContent = `${entry.name} · ${entry.type}`;
        card.append(title);
        const controls = document.createElement("div");
        controls.className = "category-controls";

        if (entry.type === "WMS") {
            const fieldLabel = document.createElement("label");
            fieldLabel.textContent = "Campo de clasificación";
            const fieldInput = document.createElement("input");
            fieldInput.type = "text";
            fieldInput.value = entry.field || "";
            fieldInput.placeholder = "Nombre del campo";
            fieldLabel.append(fieldInput);

            const valuesLabel = document.createElement("label");
            valuesLabel.textContent = "Categorías (separadas por comas)";
            const valuesInput = document.createElement("textarea");
            valuesInput.rows = 2;
            valuesInput.value = entry.categories.map(category => category.value).join(", ");
            valuesInput.placeholder = "Residencial, Comercial, Industrial";
            valuesLabel.append(valuesInput);

            const applyButton = document.createElement("button");
            applyButton.className = "panel-action";
            applyButton.type = "button";
            applyButton.textContent = "Aplicar categorías SLD";
            applyButton.addEventListener("click", () => {
                const field = fieldInput.value.trim();
                const values = [...new Set(valuesInput.value.split(",").map(value => value.trim()).filter(Boolean))];
                if (!field || values.length === 0) {
                    setServiceStatus("Para clasificar WMS, indica el campo y al menos una categoría.");
                    return;
                }

                entry.field = field;
                const previousColors = new Map(
                    entry.categories.map(category => [category.value, category.color])
                );
                entry.categories = values.map((value, index) => ({
                    value,
                    label: value,
                    color: previousColors.get(value) || categoryPalette[index % categoryPalette.length]
                }));
                applyWmsCategories(entry);
                renderSymbologyControls();
                updateLegend();
                setServiceStatus("Se envió la simbología SLD. El servidor WMS debe admitir SLD_BODY.");
            });

            const categoryList = document.createElement("div");
            categoryList.className = "category-controls";
            renderCategoryEditor(entry, categoryList);
            controls.append(fieldLabel, valuesLabel, applyButton, categoryList);
            const hint = document.createElement("p");
            hint.className = "empty-layer-message";
            hint.textContent = "El servicio debe admitir SLD_BODY; el WMS no expone atributos para descubrir categorías.";
            card.append(hint);
        } else {
            const fields = [...new Set(entry.features.flatMap(feature =>
                Object.keys(feature.getProperties()).filter(key =>
                    key !== feature.getGeometryName() &&
                    feature.get(key) !== feature.getGeometry()
                )
            ))];
            const fieldLabel = document.createElement("label");
            fieldLabel.textContent = "Campo de categoría";
            const fieldSelect = document.createElement("select");
            fieldSelect.setAttribute("aria-label", `Campo de categoría para ${entry.name}`);

            if (fields.length === 0) {
                const option = document.createElement("option");
                option.textContent = "Sin atributos disponibles";
                option.value = "";
                fieldSelect.append(option);
            } else {
                fields.forEach(field => {
                    const option = document.createElement("option");
                    option.value = field;
                    option.textContent = field;
                    fieldSelect.append(option);
                });
            }

            const categoryList = document.createElement("div");
            categoryList.className = "category-controls";
            fieldLabel.append(fieldSelect);
            controls.append(fieldLabel, categoryList);
            fieldSelect.addEventListener("change", () => {
                if (fieldSelect.value) {
                    createVectorCategories(entry, fieldSelect.value);
                    renderCategoryEditor(entry, categoryList);
                }
            });

            if (fields.length > 0) {
                fieldSelect.value = entry.field || fields[0];
                createVectorCategories(entry, fieldSelect.value);
                renderCategoryEditor(entry, categoryList);
            } else {
                const message = document.createElement("p");
                message.className = "empty-layer-message";
                message.textContent = "Esta capa no contiene campos para clasificar.";
                categoryList.append(message);
            }
        }

        card.append(controls);
        serviceLayerControls.append(card);
    });
}

function registerExternalLayer({
    name,
    type,
    layer,
    features = [],
    layerName = "",
    serviceUrl = "",
    group = "files",
    subgroup = ""
}) {
    const entry = {
        id: `external-layer-${Date.now()}-${externalLayers.length}`,
        name,
        type,
        layer,
        features,
        layerName,
        serviceUrl,
        group,
        subgroup,
        field: "",
        categories: [],
        styleCache: new Map()
    };
    externalLayers.push(entry);
    map.addLayer(layer);
    renderManagedLayers();
    renderSymbologyControls();
    updateLegend();
    updateTimelineControls();
    return entry;
}

async function loadExampleGeoJson() {
    if (window.location.protocol === "file:") {
        setServiceStatus("Sirve el proyecto por HTTP para cargar los datos GeoJSON de ejemplo.");
        return;
    }

    try {
        const url = new URL("../../../backend/data/data.geojson", window.location.href);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`El archivo respondió HTTP ${response.status}.`);
        }

        const data = await response.json();
        if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
            throw new Error("El archivo no contiene un GeoJSON FeatureCollection válido.");
        }

        const features = new ol.format.GeoJSON().readFeatures(data, {
            dataProjection: "EPSG:4326",
            featureProjection: map.getView().getProjection()
        });
        if (features.length === 0) {
            throw new Error("El archivo GeoJSON no contiene entidades para mostrar.");
        }

        const layer = new ol.layer.Vector({
            source: new ol.source.Vector({features})
        });
        registerExternalLayer({
            name: "Datos demostrativos de habilitación urbana",
            type: "GeoJSON",
            layer,
            features,
            group: "files"
        });
        setServiceStatus(`Se cargaron ${features.length} entidades GeoJSON de ejemplo.`);
    } catch (error) {
        setServiceStatus(`No se pudieron cargar los datos GeoJSON de ejemplo: ${error.message}`);
    }
}

async function loadWfsLayer(serviceUrl, layerName) {
    const requestUrl = new URL(serviceUrl);
    requestUrl.searchParams.set("service", "WFS");
    requestUrl.searchParams.set("version", "2.0.0");
    requestUrl.searchParams.set("request", "GetFeature");
    requestUrl.searchParams.set("typeNames", layerName);
    requestUrl.searchParams.set("outputFormat", "application/json");
    requestUrl.searchParams.set("srsName", "EPSG:4326");
    requestUrl.searchParams.set("count", "10000");

    const response = await fetch(requestUrl);
    if (!response.ok) {
        throw new Error(`WFS respondió HTTP ${response.status}.`);
    }

    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error("WFS no devolvió una respuesta GeoJSON válida.");
    }

    if (!Array.isArray(data.features)) {
        throw new Error("La respuesta WFS no contiene una colección GeoJSON.");
    }

    const features = new ol.format.GeoJSON().readFeatures(data, {
        dataProjection: "EPSG:4326",
        featureProjection: map.getView().getProjection()
    });
    if (features.length === 0) {
        throw new Error("La capa WFS no contiene entidades para mostrar.");
    }

    const layer = new ol.layer.Vector({
        source: new ol.source.Vector({features})
    });
    registerExternalLayer({
        name: layerName,
        layerName,
        type: "WFS",
        layer,
        features,
        group: "services"
    });
    setServiceStatus(`Se agregó la capa WFS "${layerName}" (${features.length} entidades).`);
}

function addWmsLayer(serviceUrl, layerName) {
    const source = new ol.source.TileWMS({
        url: serviceUrl,
        params: {
            VERSION: "1.1.1",
            LAYERS: layerName,
            FORMAT: "image/png",
            TRANSPARENT: true
        },
        serverType: "geoserver"
    });
    const layer = new ol.layer.Tile({source});
    registerExternalLayer({
        name: layerName,
        layerName,
        serviceUrl,
        type: "WMS",
        layer,
        group: "services"
    });
    setServiceStatus(`Se agregó la capa WMS "${layerName}".`);
}

document.getElementById("btn-add-service").addEventListener("click", async () => {
    const type = document.getElementById("service-type").value;
    const serviceUrl = document.getElementById("service-url").value.trim();
    const layerName = document.getElementById("service-layer-name").value.trim();
    if (!serviceUrl || !layerName) {
        setServiceStatus("Ingresa la URL del servicio y el nombre de la capa.");
        return;
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(serviceUrl);
    } catch {
        setServiceStatus("La URL del servicio no es válida.");
        return;
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        setServiceStatus("El servicio debe usar una URL HTTP o HTTPS.");
        return;
    }

    const button = document.getElementById("btn-add-service");
    button.disabled = true;
    setServiceStatus(`Conectando con el servicio ${type}…`);
    try {
        if (type === "WFS") {
            await loadWfsLayer(parsedUrl.href, layerName);
        } else {
            addWmsLayer(parsedUrl.href, layerName);
        }
    } catch (error) {
        setServiceStatus(`No se pudo agregar la capa: ${error.message}`);
    } finally {
        button.disabled = false;
    }
});

function loadJsZip() {
    if (window.JSZip) {
        return Promise.resolve(window.JSZip);
    }
    if (!jsZipLoadPromise) {
        jsZipLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
            script.onload = () => resolve(window.JSZip);
            script.onerror = () => {
                jsZipLoadPromise = null;
                reject(new Error("No se pudo cargar el lector de archivos KMZ."));
            };
            document.head.append(script);
        });
    }
    return jsZipLoadPromise;
}

async function importSpatialFile(file) {
    const extension = file.name.split(".").pop().toLowerCase();
    let kmlText;

    if (extension === "kmz") {
        const JSZip = await loadJsZip();
        const archive = await JSZip.loadAsync(file);
        const kmlFiles = archive.file(/\.kml$/i);
        if (kmlFiles.length === 0) {
            throw new Error("El archivo KMZ no contiene ningún archivo KML.");
        }
        const kmlFile = kmlFiles.find(item => /(^|\/)doc\.kml$/i.test(item.name)) || kmlFiles[0];
        kmlText = await kmlFile.async("text");
    } else if (extension === "kml") {
        kmlText = await file.text();
    } else {
        throw new Error("Selecciona un archivo con extensión .kml o .kmz.");
    }

    const features = new ol.format.KML({
        extractStyles: true
    }).readFeatures(kmlText, {
        featureProjection: map.getView().getProjection()
    });
    if (features.length === 0) {
        throw new Error("El archivo no contiene geometrías compatibles.");
    }

    const layer = new ol.layer.Vector({
        source: new ol.source.Vector({features})
    });
    registerExternalLayer({
        name: file.name,
        type: extension.toUpperCase(),
        layer,
        features,
        group: "files"
    });
    setServiceStatus(`Se importó "${file.name}" (${features.length} entidades).`);
}

document.getElementById("btn-import-file").addEventListener("click", async () => {
    const fileInput = document.getElementById("spatial-file");
    const file = fileInput.files[0];
    if (!file) {
        setServiceStatus("Selecciona un archivo KML o KMZ.");
        return;
    }

    const button = document.getElementById("btn-import-file");
    button.disabled = true;
    setServiceStatus(`Importando "${file.name}"…`);
    try {
        await importSpatialFile(file);
        fileInput.value = "";
    } catch (error) {
        setServiceStatus(`No se pudo importar el archivo: ${error.message}`);
    } finally {
        button.disabled = false;
    }
});

renderManagedLayers();
renderSymbologyControls();
updateLegend();
loadExampleGeoJson();



/* ===================== */
/* FEATURE POPUP         */
/* ===================== */

const featurePopup =
    document.getElementById(
        "feature-popup"
    );

function updateMeasurementPopup(feature, type, complete) {
    if (!feature || !type) {
        return;
    }

    const geometry = feature.getGeometry();
    const isLine = type === "LineString";
    const coordinates = geometry.getCoordinates();
    const vertexCount = isLine
        ? coordinates.length
        : coordinates.reduce((total, ring) => total + Math.max(ring.length - 1, 0), 0);
    const measurement = formatMeasurement(geometry, type);

    featurePopup.classList.add("measurement-popup");
    document.getElementById("popup-kind").textContent = "MEDICIÓN";
    document.getElementById("popup-title").textContent =
        isLine ? "Medición de longitud" : "Medición de área";
    document.getElementById("popup-code-label").textContent = "Vértices";
    document.getElementById("popup-code").textContent = String(vertexCount);
    document.getElementById("popup-area-label").textContent =
        isLine ? "Longitud" : "Área";
    document.getElementById("popup-area").textContent =
        measurement.slice(measurement.indexOf(": ") + 2);
    document.getElementById("popup-status-label").textContent = "Estado";
    document.getElementById("popup-status").textContent =
        complete ? "Completada" : "En curso";
    document.getElementById("btn-feature-detail").hidden = true;
    featurePopup.hidden = false;
}


map.on(
    "singleclick",
    function (event) {
        if (coordinatePickActive) {
            const [longitude, latitude] = ol.proj.toLonLat(event.coordinate);
            document.getElementById("input-longitude").value = longitude.toFixed(6);
            document.getElementById("input-latitude").value = latitude.toFixed(6);
            locationSource.clear();
            locationSource.addFeature(new ol.Feature({
                geometry: new ol.geom.Point(event.coordinate)
            }));
            stopCoordinatePick();
            document.getElementById("location-pick-status").textContent =
                `Coordenadas (longitud, latitud): ${longitude.toFixed(6)}, ${latitude.toFixed(6)}.`;
            return;
        }

        if (
            measureInteraction ||
            document.getElementById("btn-edit-measurement")
                .getAttribute("aria-pressed") === "true"
        ) {
            return;
        }

        const feature =
            map.forEachFeatureAtPixel(
                event.pixel,
                feature =>
                    feature,
                {
                    layerFilter: layer =>
                        layer !== drawingLayer &&
                        layer !== measurementLayer &&
                        layer !== locationLayer &&
                        layer !== userLocationLayer
                }
            );


        if (!feature) {
            if (
                activeMeasurementFeature &&
                featurePopup.classList.contains("measurement-popup")
            ) {
                return;
            }

            featurePopup.hidden =
                true;

            return;
        }

        featurePopup.classList.remove("measurement-popup");
        document.getElementById("popup-kind").textContent = "TERRENO";
        document.getElementById("popup-code-label").textContent = "Código";
        document.getElementById("popup-area-label").textContent = "Área";
        document.getElementById("popup-status-label").textContent = "Estado";
        document.getElementById("btn-feature-detail").hidden = false;


        document
            .getElementById(
                "popup-title"
            )
            .textContent =
                feature.get("nombre")
                ?? "Terreno seleccionado";


        document
            .getElementById(
                "popup-code"
            )
            .textContent =
                feature.get("codigo")
                ?? "-";


        document
            .getElementById(
                "popup-area"
            )
            .textContent =
                typeof feature.get("area") === "number"
                    ? `${new Intl.NumberFormat("es-PE").format(feature.get("area"))}${feature.get("area_unidad") ? ` ${feature.get("area_unidad")}` : ""}`
                    : feature.get("area")
                    ?? "-";


        document
            .getElementById(
                "popup-status"
            )
            .textContent =
                feature.get("estado")
                ?? "-";


        featurePopup.hidden =
            false;


    }
);


document
    .getElementById(
        "btn-close-popup"
    )
    .addEventListener(
        "click",
        function () {

            featurePopup.hidden =
                true;
        }
    );

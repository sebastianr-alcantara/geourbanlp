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

const initialCenter =
    ol.proj.fromLonLat([
        -77.0428,
        -12.0464
    ]);


const baseLayer =
    new ol.layer.Tile({

        source:
            new ol.source.OSM()
    });


const drawingSource =
    new ol.source.Vector();


const drawingLayer =
    new ol.layer.Vector({

        source:
            drawingSource,

        style:
            new ol.style.Style({

                fill:
                    new ol.style.Fill({
                        color:
                            "rgba(196,125,85,0.18)"
                    }),

                stroke:
                    new ol.style.Stroke({
                        color:
                            "#C47D55",
                        width:
                            2
                    }),

                image:
                    new ol.style.Circle({

                        radius:
                            5,

                        fill:
                            new ol.style.Fill({
                                color:
                                    "#C47D55"
                            })
                    })
            })
    });


const map =
    new ol.Map({

        target:
            "map",

        layers: [
            baseLayer,
            drawingLayer
        ],

        view:
            new ol.View({

                center:
                    initialCenter,

                zoom:
                    11,

                minZoom:
                    5,

                maxZoom:
                    21
            }),

        controls:
            ol.control
                .defaults
                .defaults({
                    rotate: false
                })
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
        ".tool-button"
    );


const panelTitles = {

    layers:
        "Capas",

    drawing:
        "Dibujo",

    location:
        "Localización",

    reports:
        "Reportes e indicadores",

    records:
        "Registros relacionados"
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



/* ===================== */
/* DRAWING               */
/* ===================== */

let drawInteraction = null;


function activateDrawing(type) {

    if (drawInteraction) {

        map.removeInteraction(
            drawInteraction
        );
    }


    drawInteraction =
        new ol.interaction.Draw({

            source:
                drawingSource,

            type:
                type
        });


    map.addInteraction(
        drawInteraction
    );
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

            if (drawInteraction) {

                map.removeInteraction(
                    drawInteraction
                );

                drawInteraction = null;
            }
        }
    );



/* ===================== */
/* LOCATION              */
/* ===================== */

function goToCoordinate() {

    const longitude =
        Number(
            document
                .getElementById(
                    "input-longitude"
                )
                .value
        );


    const latitude =
        Number(
            document
                .getElementById(
                    "input-latitude"
                )
                .value
        );


    if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
    ) {
        return;
    }


    map
        .getView()
        .animate({

            center:
                ol.proj.fromLonLat([
                    longitude,
                    latitude
                ]),

            zoom:
                16,

            duration:
                600
        });
}


function locateUser() {

    if (!navigator.geolocation) {
        return;
    }


    navigator
        .geolocation
        .getCurrentPosition(

            position => {

                map
                    .getView()
                    .animate({

                        center:
                            ol.proj.fromLonLat([
                                position.coords.longitude,
                                position.coords.latitude
                            ]),

                        zoom:
                            16,

                        duration:
                            600
                    });
            }
        );
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


document
    .getElementById(
        "btn-location"
    )
    .addEventListener(
        "click",
        locateUser
    );


document
    .getElementById(
        "btn-home"
    )
    .addEventListener(
        "click",
        function () {

            map
                .getView()
                .animate({

                    center:
                        initialCenter,

                    zoom:
                        11,

                    duration:
                        600
                });
        }
    );



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
/* FEATURE POPUP         */
/* ===================== */

const featurePopup =
    document.getElementById(
        "feature-popup"
    );

let selectedFeature = null;


map.on(
    "singleclick",
    function (event) {

        const feature =
            map.forEachFeatureAtPixel(
                event.pixel,
                feature =>
                    feature
            );


        if (!feature) {

            featurePopup.hidden =
                true;

            selectedFeature =
                null;

            return;
        }


        selectedFeature =
            feature;


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
                feature.get("area")
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


        document
            .getElementById(
                "selected-feature-message"
            )
            .textContent =
                feature.get("codigo")
                ?? "Terreno seleccionado";
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



/* ===================== */
/* RELATED RECORDS       */
/* ===================== */

const recordModal =
    document.getElementById(
        "record-modal"
    );

const recordModalTitle =
    document.getElementById(
        "record-modal-title"
    );


const recordTitles = {

    contacto:
        "Nuevo contacto",

    negociacion:
        "Nueva negociación",

    "revision-partida":
        "Nueva revisión de partida",

    visita:
        "Nueva visita de campo"
};


document
    .querySelectorAll(
        ".record-action"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    if (!selectedFeature) {

                        openPanel(
                            "records"
                        );

                        return;
                    }


                    recordModalTitle
                        .textContent =
                            recordTitles[
                                button.dataset.record
                            ]
                            ?? "Nuevo registro";


                    recordModal
                        .showModal();
                }
            );
        }
    );


document
    .getElementById(
        "btn-close-record"
    )
    .addEventListener(
        "click",
        function () {

            recordModal.close();
        }
    );


document
    .getElementById(
        "btn-cancel-record"
    )
    .addEventListener(
        "click",
        function () {

            recordModal.close();
        }
    );


document
    .getElementById(
        "record-form"
    )
    .addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            /*
                POST to your backend here.

                Example payload:

                {
                    terreno_id:
                        selectedFeature.get("id"),

                    descripcion:
                        ...,

                    fecha:
                        ...
                }
            */

            recordModal.close();
        }
    );
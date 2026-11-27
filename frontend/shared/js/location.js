(() => {
    function createTracker({map, button, status, beforeStart}) {
        const source = new ol.source.Vector();
        const layer = new ol.layer.Vector({
            source,
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
        layer.setZIndex(1003);
        map.addLayer(layer);

        let watchId = null;
        let hasInitialFix = false;

        function stop() {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }

            source.clear();
            hasInitialFix = false;
            button.setAttribute("aria-pressed", "false");
            button.textContent = "Seguir mi ubicación";
        }

        function update(position) {
            const longitude = position.coords.longitude;
            const latitude = position.coords.latitude;
            const coordinate = ol.proj.fromLonLat([longitude, latitude]);
            const accuracy = position.coords.accuracy / Math.cos(latitude * Math.PI / 180);

            source.clear();
            source.addFeatures([
                new ol.Feature({
                    geometry: new ol.geom.Circle(coordinate, accuracy)
                }),
                new ol.Feature({
                    geometry: new ol.geom.Point(coordinate)
                })
            ]);

            const view = map.getView();
            if (!hasInitialFix) {
                view.animate({
                    center: coordinate,
                    zoom: 16,
                    duration: 600
                });
                hasInitialFix = true;
            } else {
                view.setCenter(coordinate);
            }

            status.textContent =
                `Siguiendo ubicación en tiempo real · ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(position.coords.accuracy)} m).`;
        }

        button.addEventListener("click", () => {
            if (!navigator.geolocation) {
                status.textContent =
                    "Este navegador no permite obtener la ubicación actual.";
                return;
            }

            if (watchId !== null) {
                stop();
                status.textContent = "Seguimiento de ubicación detenido.";
                return;
            }

            beforeStart();
            button.setAttribute("aria-pressed", "true");
            button.textContent = "Dejar de seguir ubicación";
            status.textContent =
                "Solicitando permiso para seguir la ubicación en tiempo real…";

            try {
                watchId = navigator.geolocation.watchPosition(
                    update,
                    error => {
                        stop();
                        status.textContent =
                            `No se pudo seguir la ubicación: ${error.message}`;
                    },
                    {
                        enableHighAccuracy: true,
                        maximumAge: 1000,
                        timeout: 15000
                    }
                );
            } catch (error) {
                stop();
                status.textContent =
                    `No se pudo iniciar el seguimiento de ubicación: ${error.message}`;
            }
        });

        return layer;
    }

    window.GeoLocation = {createTracker};
})();
console.log("========== MAP.JS START ==========");

console.log("MapLibre:", typeof maplibregl);

document.addEventListener("DOMContentLoaded", () => {

    console.log("DOM LOADED");
    console.log("Coordinates:", window.coordinates);
    console.log("Map element:", document.getElementById("map"));

    if (!window.coordinates) {
        console.error("Coordinates not found!");
        return;
    }

    const map = new maplibregl.Map({
        container: "map",
        style: "https://demotiles.maplibre.org/style.json",
        center: window.coordinates,
        zoom: 10
    });

    map.on("load", () => {
        console.log("========== MAP LOADED SUCCESSFULLY ==========");
    });

    map.on("error", (e) => {
        console.error("========== MAP ERROR ==========");
        console.error(e);
    });

    new maplibregl.Marker()
        .setLngLat(window.coordinates)
        .addTo(map);
});
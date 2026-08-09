console.log("========== MAP.JS START ==========");

console.log("MapLibre:", typeof maplibregl);
console.log("Coordinates:", coordinates);
console.log("Map element:", document.getElementById("map"));

document.addEventListener("DOMContentLoaded", () => {

    console.log("DOM LOADED");

    const map = new maplibregl.Map({
        container: "map",
        style: "https://demotiles.maplibre.org/style.json",
        center: coordinates,
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
        .setLngLat(coordinates)
        .addTo(map);
});
document.addEventListener("DOMContentLoaded", () => {

    console.log("Map JS loaded");
    console.log("Coordinates:", coordinates);

    if (!coordinates || coordinates.length !== 2) {
        console.log("No coordinates available");
        return;
    }

    const map = new maplibregl.Map({
        container: "map",
        style: "https://demotiles.maplibre.org/style.json",
        center: coordinates,
        zoom: 10
    });

    new maplibregl.Marker()
        .setLngLat(coordinates)
        .addTo(map);

});
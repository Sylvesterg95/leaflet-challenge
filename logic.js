// Create the 'basemap' tile layer that will be the background of our map.
let basemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
});

// OPTIONAL: Create the 'street' tile layer as a second background of the map.
let street = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team"
});

// Create the map object with center and zoom options.
let map = L.map("map", {
  center: [20, 0], // Center globally
  zoom: 2,
  layers: [basemap] // Default base layer
});

// Add the 'basemap' tile layer to the map.
basemap.addTo(map);

// Create layer groups for earthquakes and tectonic plates.
let earthquakeLayer = new L.LayerGroup();
let tectonicPlatesLayer = new L.LayerGroup();

// Define base maps and overlays for control.
let baseMaps = {
  "Base Map": basemap,
  "Street Map": street
};

let overlays = {
  "Earthquakes": earthquakeLayer,
  "Tectonic Plates": tectonicPlatesLayer
};

// Add layer control to toggle layers.
L.control.layers(baseMaps, overlays).addTo(map);

// Fetch the earthquake GeoJSON data.
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function (data) {

  // Function to set style based on magnitude and depth.
  function styleInfo(feature) {
      return {
          radius: getRadius(feature.properties.mag),
          fillColor: getColor(feature.geometry.coordinates[2]),
          color: "#000",
          weight: 0.5,
          fillOpacity: 0.8
      };
  }

  // Function to determine color based on earthquake depth.
  function getColor(depth) {
      return depth > 90 ? "#ff0000" :
             depth > 70 ? "#ff6600" :
             depth > 50 ? "#ffcc00" :
             depth > 30 ? "#ccff33" :
             depth > 10 ? "#66ff66" :
                          "#00ff00"; // Shallowest earthquakes
  }

  // Function to determine marker radius based on magnitude.
  function getRadius(magnitude) {
      return magnitude === 0 ? 1 : magnitude * 4;
  }

  // Add earthquake data to the map as circle markers.
  L.geoJson(data, {
      pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng);
      },
      style: styleInfo,
      onEachFeature: function (feature, layer) {
          layer.bindPopup(
              `<strong>Location:</strong> ${feature.properties.place}<br>
               <strong>Magnitude:</strong> ${feature.properties.mag}<br>
               <strong>Depth:</strong> ${feature.geometry.coordinates[2]} km`
          );
      }
  }).addTo(earthquakeLayer);

  // Add earthquake layer to map.
  earthquakeLayer.addTo(map);

  // Create a legend.
  let legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
      let div = L.DomUtil.create("div", "info legend");
      let depths = [-10, 10, 30, 50, 70, 90];
      let colors = ["#00ff00", "#66ff66", "#ccff33", "#ffcc00", "#ff6600", "#ff0000"];

      // Loop through depth intervals to generate a label.
      for (let i = 0; i < depths.length; i++) {
          div.innerHTML +=
              `<i style="background: ${colors[i]}"></i> ${depths[i]}${depths[i + 1] ? `&ndash;${depths[i + 1]} km<br>` : "+ km"}`;
      }
      return div;
  };

  // Add the legend to the map.
  legend.addTo(map);

  // Fetch tectonic plate boundaries GeoJSON.
  d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plateData) {
      L.geoJson(plateData, {
          color: "orange",
          weight: 2
      }).addTo(tectonicPlatesLayer);

      // Add tectonic plates layer to map.
      tectonicPlatesLayer.addTo(map);
  });

});

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  Polyline,
  useMapEvent,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
});

const districts = {
  Almora: [29.3, 79.1, 29.9, 79.9],
  Bageshwar: [29.7, 79.4, 30.1, 79.9],
  Chamoli: [30.1, 79.2, 31.2, 80.5],
  Champawat: [29.5, 80.0, 30.1, 80.6],
  Dehradun: [30.0, 77.9, 30.4, 78.3],
  Haridwar: [29.7, 77.7, 30.0, 78.3],
  Nainital: [29.0, 79.2, 29.7, 79.8],
  PauriGarhwal: [29.5, 78.5, 30.2, 79.5],
  Pithoragarh: [29.4, 80.0, 30.2, 80.6],
  Rudraprayag: [30.3, 79.0, 30.9, 79.7],
  TehriGarhwal: [30.2, 78.2, 30.8, 79.1],
  UdhamSinghNagar: [28.9, 78.8, 29.2, 79.3],
  Uttarkashi: [30.8, 78.1, 31.7, 79.3],
};

const cities = {
  Dehradun: [30.3165, 78.0322],
  Nainital: [29.3919, 79.4542],
  Haridwar: [29.9457, 78.1642],
  Almora: [29.598, 79.6503],
  Pithoragarh: [29.5817, 80.2304],
  Rishikesh: [30.0869, 78.2676],
};

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Component to handle map clicks and clear selection
function MapClickHandler({ clearSelection }) {
  useMapEvent("click", () => {
    clearSelection();
  });
  return null;
}

export default function App() {
  const [selectedDistrict, setSelectedDistrict] = useState("Dehradun");
  const [selectedCity, setSelectedCity] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  useEffect(() => {
    async function fetchHotels() {
      const bbox = districts[selectedDistrict];
      const query = `
        [out:json][timeout:25];
        (
          node["tourism"="hotel"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
          way["tourism"="hotel"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
          relation["tourism"="hotel"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
        );
        out center;
      `;
      const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

      try {
        const res = await fetch(url);
        const data = await res.json();
        const places = data.elements
          .map((el) => {
            const lat = el.lat || (el.center && el.center.lat);
            const lon = el.lon || (el.center && el.center.lon);
            const name = el.tags?.name || "Unnamed Hotel";
            return lat && lon ? { id: el.id, lat, lon, name } : null;
          })
          .filter(Boolean);
        setHotels(places);
        setDistanceKm(null);
        setSelectedHotel(null);
      } catch (err) {
        console.error("Error fetching hotels:", err);
        setHotels([]);
      }
    }
    fetchHotels();
  }, [selectedDistrict]);

  const getCenterFromBBox = (bbox) => [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];

  const handleHotelClick = (hotel) => {
    if (selectedCity) {
      const [cityLat, cityLon] = cities[selectedCity];
      const dist = getDistanceFromLatLonInKm(cityLat, cityLon, hotel.lat, hotel.lon);
      setDistanceKm(dist.toFixed(2));
      setSelectedHotel(hotel);
    } else {
      setDistanceKm(null);
      setSelectedHotel(null);
    }
  };

  const clearSelection = () => {
    setSelectedHotel(null);
    setDistanceKm(null);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Heading in blue */}
      <h2
        style={{
          textAlign: "center",
          marginTop: 10,
          color: "#007bff",
          fontWeight: "bold",
          fontSize: "2.5rem",
        }}
      >
        Uttarakhand Hotels
      </h2>

      {/* Dropdowns container */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "40px",
          marginBottom: 10,
          marginTop: 10,
          flexWrap: "wrap",
        }}
      >
        {/* District dropdown */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <label
            htmlFor="district-select"
            style={{
              marginBottom: 4,
              fontWeight: "bold",
              color: "#ff6666",
              fontSize: "1.1rem",
            }}
          >
            Select District
          </label>
          <select
            id="district-select"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{ padding: "6px", fontSize: "16px", minWidth: "170px" }}
          >
            {Object.keys(districts).map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        {/* City dropdown */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <label
            htmlFor="city-select"
            style={{
              marginBottom: 4,
              fontWeight: "bold",
              color: "#ff6666",
              fontSize: "1.1rem",
              textAlign: "center",
            }}
          >
            Pick the source location to get distance
          </label>
          <select
            id="city-select"
            value={selectedCity || ""}
            onChange={(e) => setSelectedCity(e.target.value || null)}
            style={{ padding: "6px", fontSize: "16px", minWidth: "250px" }}
          >
            <option value="">-- Choose City --</option>
            {Object.keys(cities).map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <small style={{ marginTop: 6, fontStyle: "italic", color: "#666" }}>
            Click on a hotel marker on the map to see distance
          </small>
        </div>
      </div>

      {/* Map Container */}
      <MapContainer
        center={getCenterFromBBox(districts[selectedDistrict])}
        zoom={11}
        style={{ flexGrow: 1, width: "100%" }}
        key={selectedDistrict}
      >
        <MapClickHandler clearSelection={clearSelection} />
        <LayersControl position="topright">
          {/* Satellite Imagery */}
          <LayersControl.BaseLayer checked name="Esri Satellite">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          {/* Terrain Reference Overlay */}
          <LayersControl.BaseLayer name="Esri Terrain">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri and others'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* City Marker (source) */}
        {selectedCity && (
          <Marker position={cities[selectedCity]}>
            <Popup>
              <b>{selectedCity}</b> (Source Location)
            </Popup>
          </Marker>
        )}

        {/* Hotels Markers (red) */}
        {hotels.map((hotel) => (
          <Marker
            key={hotel.id}
            position={[hotel.lat, hotel.lon]}
            icon={redIcon}
            eventHandlers={{
              click: () => handleHotelClick(hotel),
            }}
          >
            <Popup>
              <div>
                <strong>{hotel.name}</strong>
                {distanceKm &&
                  selectedCity &&
                  selectedHotel?.id === hotel.id && (
                    <>
                      <br />
                      Distance from <b>{selectedCity}</b> to <b>{hotel.name}</b>:{" "}
                      {distanceKm} km
                    </>
                  )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Draw line between source city and selected hotel */}
        {selectedCity && selectedHotel && (
          <Polyline
            positions={[cities[selectedCity], [selectedHotel.lat, selectedHotel.lon]]}
            pathOptions={{ color: "blue", weight: 3 }}
          />
        )}
      </MapContainer>
    </div>
  );
}

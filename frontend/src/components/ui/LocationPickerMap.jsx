import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Default Icon Issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

export default function LocationPickerMap({ latitude, longitude, onLocationSelect }) {
    // Default to Indonesia center if no location provided
    const defaultCenter = [-6.200000, 106.816666];

    // Determine initial position
    const initialPosition = (latitude && longitude)
        ? [parseFloat(latitude), parseFloat(longitude)]
        : null;

    const [position, setPosition] = useState(initialPosition);

    useEffect(() => {
        if (latitude && longitude) {
            setPosition([parseFloat(latitude), parseFloat(longitude)]);
        }
    }, [latitude, longitude]);

    const handleSetPosition = (pos) => {
        setPosition(pos);
        onLocationSelect({ lat: pos[0], lng: pos[1] });
    };

    return (
        <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
            <MapContainer
                center={initialPosition || defaultCenter}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={handleSetPosition} />
            </MapContainer>
        </div>
    );
}

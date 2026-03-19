"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet 기본 아이콘 경로 문제 해결
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface ActivityData {
  title: {
    ko: string;
    en: string;
  };
  date: string;
  latitude: number;
  longitude: number;
  description: {
    ko: string;
    en: string;
  };
}

interface ActivityMapProps {
  activities: ActivityData[];
  onMarkerClick?: (index: number) => void;
}

// 지도 bounds를 활동 위치에 맞게 조정하는 컴포넌트
function MapBoundsAdjuster({ activities }: { activities: ActivityData[] }) {
  const map = useMap();

  useEffect(() => {
    if (activities.length === 0) return;

    if (activities.length === 1) {
      // 활동이 하나면 해당 위치로 이동
      map.setView([activities[0].latitude, activities[0].longitude], 13);
    } else {
      // 여러 활동이면 모든 마커를 포함하는 영역으로 조정
      const bounds = L.latLngBounds(
        activities.map((a) => [a.latitude, a.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [activities, map]);

  return null;
}

export default function ActivityMap({ activities, onMarkerClick }: ActivityMapProps) {
  if (activities.length === 0) {
    return (
      <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">활동 데이터가 없습니다</p>
      </div>
    );
  }

  // 중심점 계산 (첫 번째 활동 또는 평균)
  const center: [number, number] =
    activities.length === 1
      ? [activities[0].latitude, activities[0].longitude]
      : [
          activities.reduce((sum, a) => sum + a.latitude, 0) / activities.length,
          activities.reduce((sum, a) => sum + a.longitude, 0) / activities.length,
        ];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      className="w-full h-[400px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBoundsAdjuster activities={activities} />
      {activities.map((activity, index) => (
        <Marker
          key={index}
          position={[activity.latitude, activity.longitude]}
          icon={icon}
          eventHandlers={{
            click: () => {
              onMarkerClick?.(index);
            },
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold mb-1">{activity.title.ko}</p>
              <p className="text-xs text-gray-600 mb-1">
                {new Date(activity.date).toLocaleDateString("ko-KR")}
              </p>
              <p className="text-xs">{activity.description.ko}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

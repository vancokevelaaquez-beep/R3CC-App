import { LatLngPoint } from "./types";

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKm(from: LatLngPoint, to: LatLngPoint) {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function speedKph(from: LatLngPoint, to: LatLngPoint) {
  if (!from.timestamp || !to.timestamp || to.timestamp <= from.timestamp) {
    return 0;
  }

  const hours = (to.timestamp - from.timestamp) / 1000 / 60 / 60;
  return haversineKm(from, to) / hours;
}

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, "0")).join(":");
}

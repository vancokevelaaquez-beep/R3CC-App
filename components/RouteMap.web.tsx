import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { LatLngPoint } from "@/lib/types";

declare global {
  interface Window {
    L?: any;
  }
}

type Props = {
  coords: LatLngPoint[];
  dashed?: boolean;
  showMarkers?: boolean;
  height?: number;
};

const leafletCssUrl = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const leafletScriptUrl = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadLeaflet(): Promise<any> {
  if (window.L) return Promise.resolve(window.L);

  const existing = document.querySelector<HTMLScriptElement>('script[data-leaflet="true"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.L), { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
  }

  if (!document.querySelector('link[data-leaflet="true"]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = leafletCssUrl;
    stylesheet.dataset.leaflet = "true";
    document.head.appendChild(stylesheet);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = leafletScriptUrl;
    script.dataset.leaflet = "true";
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Unable to load Leaflet."));
    document.head.appendChild(script);
  });
}

export function RouteMap({ coords, dashed, showMarkers = true, height = 220 }: Props) {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;

    async function initializeMap() {
      try {
        const L = await loadLeaflet();
        if (!active || !containerRef.current || !L) return;

        const points = coords.length ? coords : [{ latitude: 10.3157, longitude: 123.8854 }];
        const first = points[0];
        const last = points[points.length - 1];
        const latLngs = points.map(({ latitude, longitude }) => [latitude, longitude]);
        const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors"
        }).addTo(map);

        const route = L.polyline(latLngs, {
          color: colors.primary,
          weight: 4,
          dashArray: dashed ? "8 5" : undefined
        }).addTo(map);

        if (coords.length > 1) {
          map.fitBounds(route.getBounds(), { padding: [24, 24] });
        } else {
          map.setView([first.latitude, first.longitude], 13);
        }

        if (showMarkers) {
          L.marker([first.latitude, first.longitude]).addTo(map).bindPopup("Route start");
          if (coords.length > 1) {
            L.marker([last.latitude, last.longitude]).addTo(map).bindPopup("Route finish");
          }
        }

        mapRef.current = map;
      } catch {
        if (active) setUnavailable(true);
      }
    }

    initializeMap();
    return () => {
      active = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [coords, dashed, showMarkers]);

  if (unavailable) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text style={styles.fallbackText}>Map preview is unavailable.</Text>
      </View>
    );
  }

  return <View ref={containerRef} style={[styles.map, { height }]} />;
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: colors.surfaceHigh
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 16
  },
  fallbackText: {
    color: colors.muted,
    textAlign: "center"
  }
});

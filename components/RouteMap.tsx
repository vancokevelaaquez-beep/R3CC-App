import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { colors } from "@/constants/theme";
import { darkMapStyle } from "@/lib/mapStyle";
import { LatLngPoint } from "@/lib/types";

type Props = {
  coords: LatLngPoint[];
  dashed?: boolean;
  showMarkers?: boolean;
  height?: number;
};

export function RouteMap({ coords, dashed, showMarkers, height = 220 }: Props) {
  const first = coords[0];
  const last = coords[coords.length - 1];

  if (!first) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text style={styles.fallbackText}>Route preview unavailable</Text>
      </View>
    );
  }

  return (
    <MapView
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      style={[styles.map, { height }]}
      customMapStyle={darkMapStyle}
      initialRegion={{
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      }}
    >
      <Polyline coordinates={coords} strokeColor={colors.primary} strokeWidth={4} lineDashPattern={dashed ? [8, 5] : undefined} />
      {showMarkers && first ? <Marker coordinate={first} pinColor={colors.success} /> : null}
      {showMarkers && last ? <Marker coordinate={last} pinColor={colors.primary} /> : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    overflow: "hidden"
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceHigh
  },
  fallbackText: {
    color: colors.muted
  }
});

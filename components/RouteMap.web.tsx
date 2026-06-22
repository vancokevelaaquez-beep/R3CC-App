import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { LatLngPoint } from "@/lib/types";

type Props = {
  coords: LatLngPoint[];
  dashed?: boolean;
  showMarkers?: boolean;
  height?: number;
};

export function RouteMap({ coords, height = 220 }: Props) {
  const first = coords[0];

  return (
    <View style={[styles.fallback, { height }]}> 
      <Text style={styles.fallbackText}>
        Map preview is not available on web.
      </Text>
      {first ? (
        <Text style={styles.coordsText}>
          First point: {first.latitude.toFixed(5)}, {first.longitude.toFixed(5)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 16
  },
  fallbackText: {
    color: colors.muted,
    textAlign: "center",
    marginBottom: 8
  },
  coordsText: {
    color: colors.muted,
    textAlign: "center"
  }
});

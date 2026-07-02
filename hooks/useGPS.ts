import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useRideStore } from "@/store/rideStore";

export const LOCATION_TASK_NAME = "R3CC_BACKGROUND_LOCATION";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error || !data) {
    return;
  }
});

export function useGPS() {
  const addPoint = useRideStore((state) => state.addPoint);
  const isRecording = useRideStore((state) => state.isRecording);
  const isPaused = useRideStore((state) => state.isPaused);
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      setPermissionGranted(status === "granted");
    });
  }, []);

  useEffect(() => {
    async function startWatching() {
      if (!permissionGranted || !isRecording || isPaused || subscription.current) {
        return;
      }

      subscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 5
        },
        (location) => {
          addPoint({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            timestamp: location.timestamp,
            speedMps: typeof location.coords.speed === "number" && Number.isFinite(location.coords.speed) ? location.coords.speed : null
          });
        }
      );
    }

    startWatching();

    if ((!isRecording || isPaused) && subscription.current) {
      subscription.current.remove();
      subscription.current = null;
    }

    return () => {
      subscription.current?.remove();
      subscription.current = null;
    };
  }, [addPoint, isPaused, isRecording, permissionGranted]);

  return { permissionGranted };
}


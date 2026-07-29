import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useRideStore } from "@/store/rideStore";
import { LatLngPoint } from "@/lib/types";

export const LOCATION_TASK_NAME = "R3CC_BACKGROUND_LOCATION";

type BackgroundLocationTaskData = {
  locations: Location.LocationObject[];
};

// Registered once in the global scope, as required by TaskManager. Runs
// whether the app is foregrounded or backgrounded, so a ride keeps recording
// even when the rider's phone is locked or tucked in a jacket pocket.
TaskManager.defineTask<BackgroundLocationTaskData>(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error || !data?.locations?.length) {
    return;
  }

  const { isRecording, isPaused, addPoint } = useRideStore.getState();
  if (!isRecording || isPaused) {
    return;
  }

  data.locations.forEach((location) => {
    const point: LatLngPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      timestamp: location.timestamp,
      speedMps: typeof location.coords.speed === "number" && Number.isFinite(location.coords.speed) ? location.coords.speed : null
    };
    addPoint(point);
  });
});

export function useGPS() {
  const isRecording = useRideStore((state) => state.isRecording);
  const isPaused = useRideStore((state) => state.isPaused);
  const isTracking = useRef(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [backgroundPermissionGranted, setBackgroundPermissionGranted] = useState(false);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      setPermissionGranted(status === "granted");
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncTracking() {
      const shouldTrack = permissionGranted && isRecording && !isPaused;

      if (shouldTrack && !isTracking.current) {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (cancelled) return;
        setBackgroundPermissionGranted(backgroundStatus === "granted");

        const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
        if (!alreadyStarted) {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 2000,
            distanceInterval: 5,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: "R3CC is recording your ride",
              notificationBody: "Tap to return to the app.",
              notificationColor: "#0B5FB4"
            }
          });
        }
        isTracking.current = true;
      }

      if (!shouldTrack && isTracking.current) {
        const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
        if (alreadyStarted) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
        isTracking.current = false;
      }
    }

    syncTracking();

    return () => {
      cancelled = true;
    };
  }, [isPaused, isRecording, permissionGranted]);

  // Safety net: never leave background tracking running if this hook unmounts
  // mid-ride (e.g. navigating away unexpectedly).
  useEffect(() => {
    return () => {
      if (isTracking.current) {
        Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});
        isTracking.current = false;
      }
    };
  }, []);

  return { permissionGranted, backgroundPermissionGranted };
}
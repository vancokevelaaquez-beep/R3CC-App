import { create } from "zustand";
import { haversineKm, speedKph } from "@/lib/haversine";
import { LatLngPoint } from "@/lib/types";

type RideState = {
  coords: LatLngPoint[];
  elapsedSec: number;
  isRecording: boolean;
  isPaused: boolean;
  distanceKm: number;
  currentSpeedKph: number;
  topSpeedKph: number;
  photos: string[];
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  tick: () => void;
  addPoint: (point: LatLngPoint) => void;
  addPhoto: (uri: string) => void;
  reset: () => void;
};

const initial = {
  coords: [],
  elapsedSec: 0,
  isRecording: false,
  isPaused: false,
  distanceKm: 0,
  currentSpeedKph: 0,
  topSpeedKph: 0,
  photos: []
};

export const useRideStore = create<RideState>((set, get) => ({
  ...initial,
  start: () => set({ ...initial, isRecording: true }),
  pause: () => set({ isPaused: true, currentSpeedKph: 0 }),
  resume: () => set({ isPaused: false }),
  stop: () => set({ isRecording: false, isPaused: false, currentSpeedKph: 0 }),
  tick: () => {
    const { isRecording, isPaused } = get();
    if (isRecording && !isPaused) {
      set((state) => ({ elapsedSec: state.elapsedSec + 1 }));
    }
  },
  addPoint: (point) => {
    const { coords, distanceKm, topSpeedKph } = get();
    const previous = coords[coords.length - 1];
    const segmentKm = previous ? haversineKm(previous, point) : 0;
    const currentSpeedKph = previous ? speedKph(previous, point) : 0;

    set({
      coords: [...coords, point],
      distanceKm: distanceKm + segmentKm,
      currentSpeedKph,
      topSpeedKph: Math.max(topSpeedKph, currentSpeedKph)
    });
  },
  addPhoto: (uri) => set((state) => ({ photos: [...state.photos, uri] })),
  reset: () => set(initial)
}));

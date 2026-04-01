/**
 * Office 3D — Meeting Room system
 * Manages convening agents to the meeting table.
 */
import { useMemo } from "react";
import { MEETING_POSITION } from "./OfficeLayout";

/**
 * Calculate positions around the meeting table for convened agents.
 */
export function getMeetingPositions(count: number): [number, number, number][] {
  const [mx, , mz] = MEETING_POSITION;
  const radius = 1.6;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return [
      mx + Math.cos(angle) * radius,
      0,
      mz + Math.sin(angle) * radius,
    ] as [number, number, number];
  });
}

/**
 * Hook to manage meeting state
 */
export function useMeetingState() {
  // This is managed by the parent page via useState
  // Providing helper utilities here
  return { getMeetingPositions };
}
